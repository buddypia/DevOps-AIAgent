import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildHomepageBuyerDecisionCockpit, buildHomepageBuyerDecisionCockpitFromWorkspace } from "../src/homepageBuyerDecisionCockpit";
import QuickBuyerEvidencePackSharePage from "../src/QuickBuyerEvidencePackSharePage";
import {
  buildQuickBuyerEvidenceAuditRepairOrder,
  buildQuickBuyerEvidenceAuditReplacementCloseout,
  buildQuickBuyerEvidenceAuditReplacementWorkspace,
  buildQuickBuyerEvidenceActivationPlan,
  buildQuickBuyerEvidenceAdoptionRiskLedger,
  buildQuickBuyerEvidenceAnswerBrief,
  buildQuickBuyerEvidenceApprovalChecklist,
  buildQuickBuyerEvidenceCommitteeMinutes,
  buildQuickBuyerEvidenceDecisionCockpit,
  buildQuickBuyerEvidenceDecisionImpactPreview,
  buildQuickBuyerEvidenceDecisionMeetingAgenda,
  buildQuickBuyerEvidenceDecisionMemo,
  buildQuickBuyerEvidenceDecisionReceipt,
  buildQuickBuyerEvidenceDisclosureBoundary,
  buildQuickBuyerEvidenceLiveAuditPlan,
  buildQuickBuyerEvidenceProcurementHandoff,
  buildQuickBuyerEvidenceValueCheckpoint,
  parseQuickBuyerEvidencePackSharePayload,
  quickBuyerEvidenceReplacementCloseoutReviewerNote
} from "../src/quickBuyerEvidenceShare";
import { decodeQuickBuyerEvidencePackShareParam, QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM } from "../src/quickExternalReviewPacketShare";
import {
  buildQuickBuyerEvidenceValueOwnerCloseoutReceipt,
  buildQuickBuyerEvidenceValueCheckpointOwnerHandoff,
  buildQuickBuyerEvidenceValueCheckpointReceipt,
  buildQuickBuyerEvidenceValueNextWindowPacket
} from "../src/quickBuyerEvidenceValueCheckpointReceipt";
import {
  buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt,
  buildQuickBuyerEvidenceAdoptionRiskRecheckPacket,
  buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt,
  buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff,
  buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt,
  quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision
} from "../src/quickBuyerEvidenceAdoptionRiskDispositionReceipt";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";

const verificationRequestJson = JSON.stringify({
  checksum: "cca49d65",
  payload: {
    receiptVersion: "homepage-outcome-artifact.v1",
    source: "homepage-outcome-artifact",
    buyer: "Platform release lead",
    decision: "revise",
    status: "blocked",
    readyCount: 1,
    itemCount: 4,
    items: []
  }
});

function inputFor(overrides: Partial<Parameters<typeof buildHomepageBuyerDecisionCockpit>[0]> = {}): Parameters<typeof buildHomepageBuyerDecisionCockpit>[0] {
  return {
    buyer: "Platform release lead",
    workflow: "Weekly Cloud Run release-readiness review",
    routeStatus: "blocked",
    routeHeadline: "Fix the first buyer blocker",
    routeOperatorLine: "Live proof blocks external sharing.",
    launchEvidenceHref: "/launch-evidence",
    launchRoomHref: "/launch-room",
    buyerEvidenceBoardHref: "/buyer-evidence-board",
    buyerProofRoomHref: "/buyer-proof-room",
    valueClaim: "¥295,000/month and 21.3h saved.",
    decisionAsk: "Can this proof be sent to a buyer?",
    sourceReceipt: {
      receiptId: "homepage-outcome-blocked-cca49d65",
      checksumAlgorithm: "fnv1a32",
      checksum: "cca49d65",
      verificationRequestJson
    },
    proofEntry: {
      status: "blocked",
      proofScore: 79,
      readyCount: 1,
      itemCount: 4,
      headline: "First buyer proof rail still needs repair."
    },
    packet: {
      status: "blocked",
      readyCount: 1,
      itemCount: 4
    },
    shareGate: {
      mode: "hold",
      score: 72,
      decision: "Hold external sharing until public proof is repaired.",
      primaryActionLabel: "Resolve blocker",
      primaryActionHref: "/launch-evidence",
      checks: [
        {
          id: "public-proof",
          label: "Live proof reachability",
          status: "watch",
          score: 60,
          evidence: "3/5 evidence links verified live.",
          action: "Publish the missing public proof links.",
          href: "/launch-evidence"
        }
      ]
    },
    proofVerification: {
      checkedAt: "2026-06-27T00:00:00.000Z",
      verifiedCount: 3,
      totalCount: 5,
      score: 60,
      results: []
    },
    ...overrides
  };
}

describe("buildHomepageBuyerDecisionCockpit", () => {
  test("builds a populated quick buyer evidence pack share URL from homepage proof", () => {
    const cockpitLink = buildHomepageBuyerDecisionCockpit(inputFor());
    const shareUrl = new URL(cockpitLink.shareHref, "https://example.com");
    const payloadText = decodeQuickBuyerEvidencePackShareParam(shareUrl.searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM));
    const payload = parseQuickBuyerEvidencePackSharePayload(payloadText);

    expect(shareUrl.pathname).toBe("/quick-buyer-evidence-pack");
    expect(payload).not.toBeNull();
    if (!payload) throw new Error("Expected homepage buyer decision cockpit payload");
    expect(payload.buyer).toBe("Platform release lead");
    expect(payload.workflow).toBe("Weekly Cloud Run release-readiness review");
    expect(payload.sourceReceiptId).toBe("homepage-outcome-blocked-cca49d65");
    expect(payload.sourceChecksum).toBe("fnv1a32:cca49d65");
    expect(payload.verifierHref).toContain("/receipt-verifier?request=");
    expect(payload.artifacts.filter((artifact) => artifact.requiredForSend)).toHaveLength(6);
    expect(payload.artifacts.map((artifact) => artifact.id)).toEqual([
      "decision-case",
      "send-memo",
      "claim-ledger",
      "proof-repair",
      "redaction",
      "conversion-receipt",
      "pilot-week",
      "decision-close"
    ]);
    expect(payload.firstAction.label).toBe("Fix Public proof links");
    expect(payload.buyerQuestions?.map((question) => question.id)).toEqual(["decision", "value", "proof", "risk", "source-receipt"]);
    expect(payload.buyerQuestions?.find((question) => question.id === "proof")).toMatchObject({
      label: "Proof",
      status: "watch",
      owner: "Proof owner",
      question: "Can I verify the proof myself?"
    });
    expect(payload.buyerQuestions?.find((question) => question.id === "risk")?.answer).toContain("Public proof links");

    const answerBrief = buildQuickBuyerEvidenceAnswerBrief(payload);
    expect(answerBrief).toMatchObject({
      status: "blocked",
      headline: "Buyer answer brief should stay internal",
      readyCount: 1,
      totalCount: 5
    });
    expect(answerBrief.firstOpenQuestion).toMatchObject({
      id: "decision",
      owner: "Buyer reviewer"
    });
    expect(answerBrief.exportMarkdown).toContain("# Buyer proof answer brief");
    expect(answerBrief.exportMarkdown).toContain("Can I verify the proof myself?");
    expect(answerBrief.csv).toContain("questionId,label,status,owner,question,answer,evidence,action,href");
    expect(answerBrief.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(answerBrief.mailHref).toContain("mailto:?");

    const disclosureBoundary = buildQuickBuyerEvidenceDisclosureBoundary(payload);
    expect(disclosureBoundary.items.map((item) => item.id)).toEqual(["source-minimization", "artifact-scope", "public-redaction", "claim-citation", "send-boundary"]);
    expect(disclosureBoundary).toMatchObject({
      status: "blocked",
      headline: "Disclosure boundary keeps this pack internal",
      totalCount: 5
    });
    expect(disclosureBoundary.items.find((item) => item.id === "source-minimization")).toMatchObject({
      status: "ready",
      owner: "Reviewer"
    });
    expect(disclosureBoundary.items.find((item) => item.id === "public-redaction")).toMatchObject({
      status: "blocked",
      action: "Finish the public-safe evidence board before broad sharing."
    });
    expect(disclosureBoundary.exportMarkdown).toContain("# Evidence disclosure boundary");
    expect(disclosureBoundary.exportMarkdown).toContain("Source data minimized");
    expect(disclosureBoundary.mailHref).toContain("mailto:?");

    const procurementHandoff = buildQuickBuyerEvidenceProcurementHandoff(payload);
    expect(procurementHandoff.routes.map((route) => route.id)).toEqual(["security", "legal", "finance", "technical", "sponsor"]);
    expect(procurementHandoff).toMatchObject({
      status: "blocked",
      headline: "Global procurement handoff keeps buyer routing held",
      totalCount: 5
    });
    expect(procurementHandoff.routes.find((route) => route.id === "security")).toMatchObject({
      status: "blocked",
      owner: "Launch owner"
    });
    expect(procurementHandoff.routes.find((route) => route.id === "finance")?.reviewQuestion).toBe("What value claim is being approved?");
    expect(procurementHandoff.exportMarkdown).toContain("# Global procurement handoff");
    expect(procurementHandoff.exportMarkdown).toContain("Security review");
    expect(procurementHandoff.mailHref).toContain("mailto:?");

    const adoptionRiskLedger = buildQuickBuyerEvidenceAdoptionRiskLedger(payload);
    expect(adoptionRiskLedger.risks.map((risk) => risk.id)).toEqual(["source-trust", "disclosure-boundary", "proof-reachability", "value-proof", "decision-ownership"]);
    expect(adoptionRiskLedger).toMatchObject({
      status: "blocked",
      headline: "Buyer adoption risk keeps this pack from global send",
      riskTotal: 5,
      firstOpenRisk: {
        id: "disclosure-boundary",
        severity: "high"
      }
    });
    expect(adoptionRiskLedger.clearanceScore).toBeGreaterThan(0);
    expect(adoptionRiskLedger.clearanceScore).toBeLessThan(60);
    expect(adoptionRiskLedger.highRiskCount).toBeGreaterThanOrEqual(2);
    expect(adoptionRiskLedger.risks.find((risk) => risk.id === "source-trust")).toMatchObject({
      status: "ready",
      severity: "low",
      owner: "Reviewer"
    });
    expect(adoptionRiskLedger.risks.find((risk) => risk.id === "proof-reachability")).toMatchObject({
      status: "blocked",
      severity: "high",
      owner: "Proof owner"
    });
    expect(adoptionRiskLedger.exportMarkdown).toContain("# Buyer adoption risk ledger");
    expect(adoptionRiskLedger.exportMarkdown).toContain("Clearance score:");
    expect(adoptionRiskLedger.csv).toContain("riskId,label,status,severity,owner,exposure,mitigation,proofRequired,evidence,href");
    expect(adoptionRiskLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(adoptionRiskLedger.mailHref).toContain("mailto:?");
    const adoptionRiskDispositionReceipt = buildQuickBuyerEvidenceAdoptionRiskDispositionReceipt({
      payload,
      ledger: adoptionRiskLedger,
      decision: quickBuyerEvidenceAdoptionRiskDispositionDefaultDecision(adoptionRiskLedger),
      reviewerName: "Risk reviewer",
      reviewerNote: "Repair public proof risk before buyer send.",
      generatedAt: "2026-07-01T00:00:00.000Z"
    });
    expect(adoptionRiskDispositionReceipt).toMatchObject({
      payload: {
        receiptVersion: "quick-buyer-evidence-adoption-risk-disposition.v1",
        status: "blocked",
        decision: "hold-buyer-send",
        buyer: "Platform release lead",
        riskTotal: 5,
        sourceLedgerHash: expect.stringMatching(/^fnv1a32:[a-f0-9]{8}$/)
      },
      verification: {
        status: "verified"
      }
    });
    expect(adoptionRiskDispositionReceipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(adoptionRiskDispositionReceipt.verifierHref).toContain("/receipt-verifier?");
    expect(adoptionRiskDispositionReceipt.exportMarkdown).toContain("# Buyer adoption risk disposition receipt");
    const adoptionRiskOwnerHandoff = buildQuickBuyerEvidenceAdoptionRiskDispositionOwnerHandoff(adoptionRiskDispositionReceipt);
    expect(adoptionRiskOwnerHandoff).toMatchObject({
      status: "blocked",
      headline: "Buyer send stays held until risk owner work closes",
      readyCount: 1,
      taskTotal: expect.any(Number),
      firstOwner: "Launch owner"
    });
    expect(adoptionRiskOwnerHandoff.tasks.map((task) => task.id)).toContain("hold-disclosure-boundary");
    expect(adoptionRiskOwnerHandoff.exportMarkdown).toContain("# Buyer adoption risk owner handoff");
    expect(adoptionRiskOwnerHandoff.csv).toContain("taskId,label,status,owner,due,action,closeCondition,evidence,href");
    expect(adoptionRiskOwnerHandoff.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(adoptionRiskOwnerHandoff.mailHref).toContain("mailto:?");
    const adoptionRiskOwnerCloseoutReceipt = buildQuickBuyerEvidenceAdoptionRiskOwnerCloseoutReceipt({
      receipt: adoptionRiskDispositionReceipt,
      handoff: adoptionRiskOwnerHandoff,
      acceptedBy: "Launch owner",
      evidenceNote: "Disclosure repair is accepted, but live proof and value proof still need owner evidence.",
      closedTaskIds: ["attach-risk-disposition-receipt", "hold-disclosure-boundary"],
      generatedAt: "2026-07-02T00:00:00.000Z"
    });
    expect(adoptionRiskOwnerCloseoutReceipt).toMatchObject({
      payload: {
        receiptVersion: "quick-buyer-evidence-adoption-risk-owner-closeout.v1",
        status: "watch",
        decision: "hold-risk-closeout",
        buyer: "Platform release lead",
        closedTaskCount: 2,
        openTaskCount: expect.any(Number),
        sourceDispositionChecksum: `fnv1a32:${adoptionRiskDispositionReceipt.checksum}`,
        sourceLedgerHash: adoptionRiskDispositionReceipt.payload.sourceLedgerHash
      },
      verification: {
        status: "verified"
      }
    });
    expect(adoptionRiskOwnerCloseoutReceipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(adoptionRiskOwnerCloseoutReceipt.verifierHref).toContain("/receipt-verifier?");
    expect(adoptionRiskOwnerCloseoutReceipt.exportMarkdown).toContain("# Buyer adoption risk owner closeout receipt");
    expect(adoptionRiskOwnerCloseoutReceipt.exportMarkdown).toContain("Closed tasks: 2/");
    const adoptionRiskRecheckPacket = buildQuickBuyerEvidenceAdoptionRiskRecheckPacket(adoptionRiskOwnerCloseoutReceipt);
    expect(adoptionRiskRecheckPacket).toMatchObject({
      status: "watch",
      headline: "Risk recheck packet stays held until owner work closes",
      readyCount: 0,
      stepTotal: 2,
      currentOwner: expect.any(String)
    });
    expect(adoptionRiskRecheckPacket.exportMarkdown).toContain("# Buyer adoption risk recheck packet");
    expect(adoptionRiskRecheckPacket.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(adoptionRiskRecheckPacket.mailHref).toContain("mailto:?");
    const adoptionRiskSendControlReceipt = buildQuickBuyerEvidenceAdoptionRiskSendControlReceipt({
      closeout: adoptionRiskOwnerCloseoutReceipt,
      recheck: adoptionRiskRecheckPacket,
      generatedAt: "2026-07-03T00:00:00.000Z"
    });
    expect(adoptionRiskSendControlReceipt).toMatchObject({
      payload: {
        status: "blocked",
        decision: "hold-buyer-send",
        criteria: expect.arrayContaining([
          expect.objectContaining({
            id: "risk-owner-closeout",
            status: "block"
          })
        ])
      },
      verification: {
        status: "verified"
      }
    });
    expect(adoptionRiskSendControlReceipt.payload.criteria).toHaveLength(4);
    expect(adoptionRiskSendControlReceipt.exportMarkdown).toContain("# Buyer-send risk control receipt");
    expect(adoptionRiskSendControlReceipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(adoptionRiskSendControlReceipt.verifierHref).toContain("/receipt-verifier?");

    const meetingAgenda = buildQuickBuyerEvidenceDecisionMeetingAgenda(payload);
    expect(meetingAgenda.items.map((item) => item.id)).toEqual(["evidence-context", "disclosure-review", "value-case", "technical-proof", "decision-close"]);
    expect(meetingAgenda).toMatchObject({
      status: "blocked",
      headline: "Buyer decision meeting should stay in repair mode",
      totalCount: 5,
      totalDurationMinutes: 30
    });
    expect(meetingAgenda.currentItem).toMatchObject({
      id: "disclosure-review",
      owner: "Launch owner"
    });
    expect(meetingAgenda.exportMarkdown).toContain("# Buyer decision meeting agenda");
    expect(meetingAgenda.exportMarkdown).toContain("30 minutes");
    expect(meetingAgenda.mailHref).toContain("mailto:?");

    const committeeMinutes = buildQuickBuyerEvidenceCommitteeMinutes(payload);
    expect(committeeMinutes.decisions.map((decision) => decision.id)).toEqual(["packet", "committee-posture", "approval-conditions", "first-open-owner", "response-record"]);
    expect(committeeMinutes).toMatchObject({
      status: "blocked",
      headline: "Committee minutes should record repair, not approval",
      decision: "revise",
      totalCount: 5
    });
    expect(committeeMinutes.currentDecision).toMatchObject({
      id: "first-open-owner",
      value: "Launch owner"
    });
    expect(committeeMinutes.attendees.map((attendee) => attendee.id)).toEqual(["reviewer", "security", "legal", "finance", "technical", "sponsor"]);
    expect(committeeMinutes.exportMarkdown).toContain("# Buyer committee minutes");
    expect(committeeMinutes.exportMarkdown).toContain("Committee posture");
    expect(committeeMinutes.mailHref).toContain("mailto:?");

    const activationPlan = buildQuickBuyerEvidenceActivationPlan(payload);
    expect(activationPlan.steps.map((step) => step.id)).toEqual(["approval-gate", "kickoff-owner", "proof-recheck", "value-baseline", "stop-rule"]);
    expect(activationPlan).toMatchObject({
      status: "blocked",
      headline: "Buyer activation plan starts with repair closeout",
      startDate: "2026-07-01",
      endDate: "2026-07-08",
      totalCount: 5
    });
    expect(activationPlan.currentStep).toMatchObject({
      id: "approval-gate",
      owner: "Launch owner"
    });
    expect(activationPlan.calendarText).toContain("BEGIN:VCALENDAR");
    expect(activationPlan.calendarText).toContain("SUMMARY:Day 0 Close approval gate");
    expect(activationPlan.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(activationPlan.exportMarkdown).toContain("# Buyer activation plan");
    expect(activationPlan.exportMarkdown).toContain("Calendar export:");
    expect(activationPlan.mailHref).toContain("mailto:?");

    const valueCheckpoint = buildQuickBuyerEvidenceValueCheckpoint(payload);
    expect(valueCheckpoint.items.map((item) => item.id)).toEqual(["baseline", "proof-sample", "adoption-signal", "finance-decision", "next-window"]);
    expect(valueCheckpoint).toMatchObject({
      status: "blocked",
      headline: "Buyer value checkpoint starts with baseline repair",
      totalCount: 5
    });
    expect(valueCheckpoint.currentItem).toMatchObject({
      id: "baseline",
      metric: "Baseline value claim"
    });
    expect(valueCheckpoint.exportMarkdown).toContain("# Buyer value checkpoint");
    expect(valueCheckpoint.exportMarkdown).toContain("Baseline value claim");
    expect(valueCheckpoint.csv).toContain("checkpointId,label,status,owner,metric,target,evidence,action,href");
    expect(valueCheckpoint.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(valueCheckpoint.mailHref).toContain("mailto:?");

    const valueCheckpointReceipt = buildQuickBuyerEvidenceValueCheckpointReceipt({
      payload,
      checkpoint: valueCheckpoint,
      decision: "repair",
      reviewerName: "Finance reviewer",
      actualValueSignal: "Day 7 value cannot be accepted until baseline proof is attached.",
      generatedAt: "2026-07-08T00:00:00.000Z"
    });
    expect(valueCheckpointReceipt).toMatchObject({
      payload: {
        receiptVersion: "quick-buyer-evidence-value-checkpoint.v1",
        status: "watch",
        decision: "repair",
        buyer: "Platform release lead",
        readyCount: valueCheckpoint.readyCount,
        totalCount: 5,
        nextOwner: valueCheckpoint.currentItem.owner
      },
      verification: {
        status: "verified"
      }
    });
    expect(valueCheckpointReceipt.requestJson).toContain("quick-buyer-evidence-value-checkpoint.v1");
    expect(valueCheckpointReceipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(valueCheckpointReceipt.verifierHref).toContain("/receipt-verifier?");
    expect(valueCheckpointReceipt.exportMarkdown).toContain("# Buyer value checkpoint receipt");

    const valueCheckpointOwnerHandoff = buildQuickBuyerEvidenceValueCheckpointOwnerHandoff(valueCheckpointReceipt);
    expect(valueCheckpointOwnerHandoff).toMatchObject({
      status: "blocked",
      headline: "Value checkpoint becomes an owner repair handoff",
      taskTotal: 6,
      firstOwner: valueCheckpoint.currentItem.owner
    });
    expect(valueCheckpointOwnerHandoff.tasks[0]).toMatchObject({
      id: "attach-checkpoint-receipt",
      status: "ready",
      owner: "Finance reviewer"
    });
    expect(valueCheckpointOwnerHandoff.tasks.map((task) => task.id)).toContain("close-baseline");
    expect(valueCheckpointOwnerHandoff.exportMarkdown).toContain("# Buyer value checkpoint owner handoff");
    expect(valueCheckpointOwnerHandoff.exportMarkdown).toContain("Calendar window: 2026-07-08 to ");
    expect(valueCheckpointOwnerHandoff.calendarText).toContain("BEGIN:VCALENDAR");
    expect(valueCheckpointOwnerHandoff.calendarText).toContain("SUMMARY:Today Attach checkpoint receipt - Finance reviewer");
    expect(valueCheckpointOwnerHandoff.calendarText.replace(/\r\n /g, "")).toContain(`Receipt: fnv1a32:${valueCheckpointReceipt.checksum}`);
    expect(valueCheckpointOwnerHandoff.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(valueCheckpointOwnerHandoff.csv).toContain("taskId,label,status,owner,due,action,closeCondition,evidence,href");
    expect(valueCheckpointOwnerHandoff.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(valueCheckpointOwnerHandoff.mailHref).toContain("mailto:?");

    const valueOwnerCloseoutReceipt = buildQuickBuyerEvidenceValueOwnerCloseoutReceipt({
      receipt: valueCheckpointReceipt,
      handoff: valueCheckpointOwnerHandoff,
      closedTaskIds: ["attach-checkpoint-receipt", "close-baseline"],
      acceptedBy: "Pilot owner",
      evidenceNote: "Baseline proof has been attached, but proof links still need repair.",
      generatedAt: "2026-07-09T00:00:00.000Z"
    });
    expect(valueOwnerCloseoutReceipt).toMatchObject({
      payload: {
        receiptVersion: "quick-buyer-evidence-value-owner-closeout.v1",
        status: "watch",
        decision: "hold-owner-closeout",
        acceptedBy: "Pilot owner",
        closedTaskCount: 2,
        taskCount: 6,
        openTaskCount: 4,
        nextOwner: "Proof owner"
      },
      verification: {
        status: "verified"
      }
    });
    expect(valueOwnerCloseoutReceipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(valueOwnerCloseoutReceipt.verifierHref).toContain("/receipt-verifier?");
    expect(valueOwnerCloseoutReceipt.exportMarkdown).toContain("# Buyer value owner closeout receipt");
    expect(valueOwnerCloseoutReceipt.exportMarkdown).toContain("Closed tasks: 2/6");
    const acceptedValueOwnerCloseoutReceipt = buildQuickBuyerEvidenceValueOwnerCloseoutReceipt({
      receipt: valueCheckpointReceipt,
      handoff: valueCheckpointOwnerHandoff,
      closedTaskIds: valueCheckpointOwnerHandoff.tasks.map((task) => task.id),
      acceptedBy: "Pilot owner",
      evidenceNote: "All owner proof is attached and ready for the next value window.",
      generatedAt: "2026-07-09T00:00:00.000Z"
    });
    expect(acceptedValueOwnerCloseoutReceipt).toMatchObject({
      payload: {
        status: "ready",
        decision: "accept-owner-closeout",
        closedTaskCount: 6,
        openTaskCount: 0
      }
    });
    const valueNextWindowPacket = buildQuickBuyerEvidenceValueNextWindowPacket(acceptedValueOwnerCloseoutReceipt);
    expect(valueNextWindowPacket).toMatchObject({
      status: "watch",
      headline: "Next value window is ready to schedule from the verified closeout",
      startDate: "2026-07-16",
      endDate: "2026-07-23",
      readyCount: 2,
      stepTotal: 4,
      currentOwner: "Proof owner"
    });
    expect(valueNextWindowPacket.steps.map((step) => step.id)).toEqual(["open-next-value-thread", "refresh-value-baseline", "rerun-live-proof", "record-day7-decision"]);
    expect(valueNextWindowPacket.calendarText).toContain("BEGIN:VCALENDAR");
    expect(valueNextWindowPacket.calendarText).toContain("SUMMARY:Day 0 Open next value thread");
    expect(valueNextWindowPacket.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(valueNextWindowPacket.exportMarkdown).toContain("# Buyer value next window packet");
    expect(valueNextWindowPacket.exportMarkdown).toContain("Calendar export:");
    expect(valueNextWindowPacket.mailHref).toContain("mailto:?");

    const cockpit = buildQuickBuyerEvidenceDecisionCockpit(payload);
    expect(cockpit.primaryQuestion).toBe("Can this evidence pack be used for buyer send?");
    expect(cockpit.recommendedDecision).toBe("revise");
    expect(cockpit.requiredReady).toBeGreaterThan(0);
    expect(cockpit.requiredTotal).toBe(6);

    const memo = buildQuickBuyerEvidenceDecisionMemo(payload);
    expect(memo).toMatchObject({
      status: "watch",
      recommendedDecision: "revise",
      headline: "Platform release lead has a clear repair order before the next send"
    });
    expect(memo.items.map((item) => item.id)).toEqual(["buyer-outcome", "trust-proof", "open-risk", "next-owner-action"]);
    expect(memo.questions.map((question) => question.id)).toEqual(["trust", "value", "risk", "next"]);
    expect(memo.questions.find((question) => question.id === "risk")).toMatchObject({
      status: "watch",
      answer: "Public proof links must be repaired first."
    });
    expect(memo.exportMarkdown).toContain("# Buyer decision memo");
    expect(memo.exportMarkdown).toContain("## Buyer questions");
    expect(memo.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const approvalChecklist = buildQuickBuyerEvidenceApprovalChecklist(payload);
    expect(approvalChecklist).toMatchObject({
      status: "watch",
      headline: "Approval needs repair evidence before buyer send",
      readyCount: 1,
      totalCount: 5
    });
    expect(approvalChecklist.currentItem).toMatchObject({
      id: "required-artifacts",
      label: "Required artifacts are ready",
      action: "Fix Public proof links"
    });
    expect(approvalChecklist.items.map((item) => item.id)).toEqual(["source-receipt", "required-artifacts", "open-risk", "decision-readiness", "response-path"]);
    expect(approvalChecklist.exportMarkdown).toContain("# Buyer approval checklist");
    expect(approvalChecklist.exportMarkdown).toContain("Decision gate:");
    expect(approvalChecklist.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const liveAuditPlan = buildQuickBuyerEvidenceLiveAuditPlan(payload);
    expect(liveAuditPlan).toMatchObject({
      status: "blocked",
      headline: "Run a live audit before trusting this pack",
      targetCount: 8,
      requiredTargetCount: 6
    });
    expect(liveAuditPlan.targets.map((target) => target.id)).toEqual([
      "decision-case",
      "send-memo",
      "claim-ledger",
      "proof-repair",
      "redaction",
      "conversion-receipt",
      "pilot-week",
      "decision-close"
    ]);
    expect(liveAuditPlan.firstTarget).toMatchObject({
      id: "proof-repair",
      label: "Public proof links"
    });
    expect(liveAuditPlan.exportMarkdown).toContain("# Live buyer evidence audit plan");
    expect(liveAuditPlan.exportMarkdown).toContain("Audit targets: 8");
    expect(liveAuditPlan.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const auditRepairOrder = buildQuickBuyerEvidenceAuditRepairOrder(payload, {
      checkedAt: "2026-06-27T01:00:00.000Z",
      verifiedCount: 1,
      totalCount: 3,
      score: 33,
      results: [
        {
          id: "decision-case",
          label: "Buyer decision case",
          status: "pass",
          url: "https://a2a-agent-marketplace.example.com/launch-room",
          evidence: "Public URL responded with HTTP 200.",
          action: "Keep this link attached to the launch room.",
          httpStatus: 200
        },
        {
          id: "proof-repair",
          label: "Public proof links",
          status: "block",
          url: "http://127.0.0.1:8080/launch-evidence",
          evidence: "Only https URLs can be verified as buyer-facing proof.",
          action: "Replace Public proof links with a secure https:// URL."
        },
        {
          id: "conversion-receipt",
          label: "Outcome receipt verifier",
          status: "block",
          url: "http://127.0.0.1:8080/receipt-verifier?request=too-long",
          evidence: "Audit target URL is too large to verify safely from this page.",
          action: "Open the artifact directly or regenerate the buyer pack with a shorter public evidence URL."
        }
      ]
    });
    expect(auditRepairOrder).toMatchObject({
      status: "blocked",
      headline: "Live audit created a buyer-send repair order",
      blockedCount: 2,
      watchCount: 0,
      taskTotal: 2
    });
    expect(auditRepairOrder.firstTask).toMatchObject({
      id: "proof-repair",
      owner: "Proof owner",
      dueLabel: "Before buyer send"
    });
    expect(auditRepairOrder.tasks.map((task) => task.id)).toEqual(["proof-repair", "conversion-receipt"]);
    expect(auditRepairOrder.markdown).toContain("# Live evidence audit repair order");
    expect(auditRepairOrder.csv).toContain("taskId,label,status,owner,due,action");
    expect(auditRepairOrder.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(auditRepairOrder.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(auditRepairOrder.mailHref).toContain("mailto:?");

    const replacementWorkspace = buildQuickBuyerEvidenceAuditReplacementWorkspace(auditRepairOrder);
    expect(replacementWorkspace).toMatchObject({
      status: "blocked",
      headline: "Check replacement proof before reopening approval",
      slotTotal: 2
    });
    expect(replacementWorkspace.slots.map((slot) => slot.id)).toEqual(["proof-repair", "conversion-receipt"]);
    expect(replacementWorkspace.slots[0]).toMatchObject({
      label: "Public proof links",
      owner: "Proof owner",
      placeholder: "https://public.example.com/evidence"
    });
    expect(replacementWorkspace.markdown).toContain("# Live evidence replacement workspace");
    expect(replacementWorkspace.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const replacementCloseout = buildQuickBuyerEvidenceAuditReplacementCloseout({
      workspace: replacementWorkspace,
      replacements: {
        "proof-repair": "https://public.example.com/replacement-proof",
        "conversion-receipt": "https://public.example.com/replacement-receipt"
      },
      audit: {
        checkedAt: "2026-06-27T01:10:00.000Z",
        verifiedCount: 1,
        totalCount: 2,
        score: 50,
        results: [
          {
            id: "proof-repair",
            label: "Public proof links",
            status: "pass",
            url: "https://public.example.com/replacement-proof",
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached to the launch room.",
            httpStatus: 200
          },
          {
            id: "conversion-receipt",
            label: "Outcome receipt verifier",
            status: "block",
            url: "https://public.example.com/replacement-receipt",
            evidence: "Public URL responded with HTTP 403.",
            action: "Make the artifact publicly readable or attach a different proof URL.",
            httpStatus: 403
          }
        ]
      }
    });
    expect(replacementCloseout).toMatchObject({
      status: "blocked",
      headline: "Buyer approval stays held",
      readyCount: 1,
      blockedCount: 1,
      missingCount: 0,
      canReopen: false
    });
    expect(replacementCloseout.firstOpenItem).toMatchObject({
      id: "conversion-receipt",
      owner: "Review coordinator"
    });
    expect(replacementCloseout.markdown).toContain("# Replacement proof closeout");
    expect(replacementCloseout.csv).toContain("slotId,label,status,owner,replacementHref");
    expect(replacementCloseout.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(replacementCloseout.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);

    const readyReplacementCloseout = buildQuickBuyerEvidenceAuditReplacementCloseout({
      workspace: replacementWorkspace,
      replacements: {
        "proof-repair": "https://public.example.com/replacement-proof",
        "conversion-receipt": "https://public.example.com/replacement-receipt"
      },
      audit: {
        checkedAt: "2026-06-27T01:12:00.000Z",
        verifiedCount: 2,
        totalCount: 2,
        score: 100,
        results: [
          {
            id: "proof-repair",
            label: "Public proof links",
            status: "pass",
            url: "https://public.example.com/replacement-proof",
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached to the launch room.",
            httpStatus: 200
          },
          {
            id: "conversion-receipt",
            label: "Outcome receipt verifier",
            status: "pass",
            url: "https://public.example.com/replacement-receipt",
            evidence: "Public URL responded with HTTP 200.",
            action: "Keep this link attached to the launch room.",
            httpStatus: 200
          }
        ]
      }
    });
    expect(readyReplacementCloseout).toMatchObject({
      status: "ready",
      headline: "Buyer approval gate can reopen",
      readyCount: 2,
      blockedCount: 0,
      canReopen: true,
      firstOpenItem: null
    });
    expect(quickBuyerEvidenceReplacementCloseoutReviewerNote(readyReplacementCloseout)).toContain("Buyer approval gate can reopen");

    const reopenedReceipt = buildQuickBuyerEvidenceDecisionReceipt({
      payload,
      decision: "continue",
      reviewerName: "Mina reviewer",
      replacementCloseout: readyReplacementCloseout,
      generatedAt: "2026-06-27T01:15:00.000Z",
      returnBaseHref: "/?workspace=workspace_test#quick-workflow-intake"
    });
    expect(reopenedReceipt.recommendedDecision).toBe("continue");
    expect(reopenedReceipt.payload).toMatchObject({
      decision: "continue",
      status: "ready",
      packetStatus: "ready",
      packetClearance: "external-review",
      testsReady: 6,
      testsTotal: 6,
      confidence: 100,
      reviewerName: "Mina reviewer"
    });
    expect(reopenedReceipt.payload.reviewerNote).toContain("Replacement closeout verified 2/2 repair slots");
    expect(reopenedReceipt.payload.proof).toContain("replacement closeout 2/2");
    expect(reopenedReceipt.scorecard.status).toBe("ready");
    expect(reopenedReceipt.verification.status).toBe("verified");

    const receipt = buildQuickBuyerEvidenceDecisionReceipt({
      payload,
      decision: cockpit.recommendedDecision,
      returnBaseHref: "/?workspace=workspace_test#quick-workflow-intake"
    });
    const impact = buildQuickBuyerEvidenceDecisionImpactPreview(receipt);
    expect(impact).toMatchObject({
      status: "watch",
      headline: "Repair request becomes an owner packet",
      decisionLine: "Request repairs",
      ownerLine: "Proof owner",
      returnLine: "Owner workspace receives the response receipt",
      nextAction: "Fix Public proof links"
    });
    expect(impact.summary).toContain("Proof owner");
    expect(impact.followUpLine).toContain("owner tasks, first due");
  });

  test("marks the cockpit ready when homepage proof and share gate are ready", () => {
    const cockpitLink = buildHomepageBuyerDecisionCockpit(
      inputFor({
        routeStatus: "ready",
        proofEntry: {
          status: "ready",
          proofScore: 100,
          readyCount: 4,
          itemCount: 4,
          headline: "All proof rails are ready."
        },
        packet: {
          status: "ready",
          readyCount: 4,
          itemCount: 4
        },
        shareGate: {
          mode: "send",
          score: 100,
          decision: "Send the evidence pack with verifier attached.",
          primaryActionLabel: "Open receipt verifier",
          primaryActionHref: "/receipt-verifier",
          checks: [
            {
              id: "public-proof",
              label: "Live proof reachability",
              status: "pass",
              score: 100,
              evidence: "5/5 evidence links verified live.",
              action: "Keep proof attached.",
              href: "/launch-evidence"
            }
          ]
        },
        proofVerification: {
          checkedAt: "2026-06-27T00:00:00.000Z",
          verifiedCount: 5,
          totalCount: 5,
          score: 100,
          results: []
        }
      })
    );
    const shareUrl = new URL(cockpitLink.shareHref, "https://example.com");
    const payloadText = decodeQuickBuyerEvidencePackShareParam(shareUrl.searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM));
    const payload = parseQuickBuyerEvidencePackSharePayload(payloadText);

    expect(payload).not.toBeNull();
    if (!payload) throw new Error("Expected ready cockpit payload");
    expect(payload.status).toBe("ready");
    expect(payload.firstAction.label).toBe("Open receipt verifier");
    expect(buildQuickBuyerEvidenceDecisionCockpit(payload)).toMatchObject({
      status: "ready",
      recommendedDecision: "continue",
      requiredReady: 6,
      requiredTotal: 6
    });
  });

  test("reconstructs a populated decision cockpit from workspace data without URL payload input", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-27T00:00:00.000Z", "https://a2a-agent-marketplace.example.com");
    const cockpitLink = buildHomepageBuyerDecisionCockpitFromWorkspace({
      workspace,
      hrefs: {
        launchEvidenceHref: "/launch-evidence",
        launchRoomHref: "/launch-room",
        buyerEvidenceBoardHref: "/buyer-evidence-board",
        buyerProofRoomHref: "/buyer-proof-room"
      }
    });
    const payload = parseQuickBuyerEvidencePackSharePayload(cockpitLink.payloadJson);

    expect(payload).not.toBeNull();
    if (!payload) throw new Error("Expected workspace buyer decision cockpit payload");
    expect(payload.buyer).toBe("Platform / DevOps Lead");
    expect(payload.workflow).toContain("Turn one Cloud Run release-readiness review");
    expect(payload.artifacts.map((artifact) => artifact.id)).toContain("proof-repair");
    expect(payload.firstAction.href).toContain("/launch-evidence");
    expect(payload.sourceReceiptId).toMatch(/^workspace-decision-/);
    expect(payload.sourceChecksum).toMatch(/^fnv1a32:[a-f0-9]{8}$/);

    const html = renderToStaticMarkup(
      createElement(QuickBuyerEvidencePackSharePage, {
        homeHref: "/?workspace=workspace_test#quick-workflow-intake",
        payloadText: cockpitLink.payloadJson,
        responseReturnHref: "/?workspace=workspace_test#quick-workflow-intake"
      })
    );
    expect(html).toContain("Buyer decision cockpit");
    expect(html).toContain('aria-label="Buyer proof answer deck"');
    expect(html).toContain("Buyer proof answers");
    expect(html).toContain("safe to cite");
    expect(html).toContain("Can I verify the proof myself?");
    expect(html).toContain("Can this decision be audited later?");
    expect(html).toContain('aria-label="Evidence disclosure boundary"');
    expect(html).toContain("Evidence disclosure boundary");
    expect(html).toContain("Disclosure boundary keeps this pack internal");
    expect(html).toContain("Download boundary");
    expect(html).toContain("Email boundary");
    expect(html).toContain('aria-label="Global procurement handoff"');
    expect(html).toContain("Global procurement handoff");
    expect(html).toContain("Security review");
    expect(html).toContain("Finance approval");
    expect(html).toContain("Download handoff");
    expect(html).toContain("Email handoff");
    expect(html).toContain('aria-label="Buyer adoption risk ledger"');
    expect(html).toContain("Buyer adoption risk ledger");
    expect(html).toContain("Source trust");
    expect(html).toContain("Proof reachability");
    expect(html).toContain("Download risk ledger");
    expect(html).toContain("Risk CSV");
    expect(html).toContain("Email risk ledger");
    expect(html).toContain('aria-label="Buyer adoption risk disposition receipt"');
    expect(html).toContain("Risk disposition receipt");
    expect(html).toContain("Disposition note");
    expect(html).toContain("Risk receipt JSON");
    expect(html).toContain("Verify risk receipt");
    expect(html).toContain("Open risk verifier");
    expect(html).toContain("Risk receipt memo");
    expect(html).toContain('aria-label="Risk disposition owner handoff"');
    expect(html).toContain("Risk disposition owner handoff");
    expect(html).toContain("Attach risk disposition receipt");
    expect(html).toContain("Owner handoff");
    expect(html).toContain("Handoff CSV");
    expect(html).toContain("Handoff calendar");
    expect(html).toContain("Email risk owner");
    expect(html).toContain('aria-label="Risk owner closeout receipt"');
    expect(html).toContain("Risk owner closeout receipt");
    expect(html).toContain("Risk closeout JSON");
    expect(html).toContain("Verify risk closeout");
    expect(html).toContain("Open risk closeout verifier");
    expect(html).toContain("Risk closeout memo");
    expect(html).toContain('aria-label="Risk owner closeout tasks"');
    expect(html).toContain('aria-label="Risk recheck packet"');
    expect(html).toContain("Risk recheck packet");
    expect(html).toContain("Recheck memo");
    expect(html).toContain("Recheck calendar");
    expect(html).toContain("Email recheck owner");
    expect(html).toContain('aria-label="Risk recheck steps"');
    expect(html).toContain('aria-label="Buyer-send risk control"');
    expect(html).toContain("Buyer-send risk control");
    expect(html).toContain("Risk control JSON");
    expect(html).toContain("Verify risk control");
    expect(html).toContain("Open risk control verifier");
    expect(html).toContain("Risk control memo");
    expect(html).toContain('aria-label="Risk control criteria"');
    expect(html).toContain("Risk owner closeout verifies");
    expect(html).toContain('aria-label="Buyer decision meeting agenda"');
    expect(html).toContain("Buyer decision meeting agenda");
    expect(html).toContain("Technical proof");
    expect(html).toContain("30 min");
    expect(html).toContain("Download agenda");
    expect(html).toContain("Email agenda");
    expect(html).toContain('aria-label="Buyer committee minutes"');
    expect(html).toContain("Buyer committee minutes");
    expect(html).toContain("Committee posture");
    expect(html).toContain("Download minutes");
    expect(html).toContain("Email minutes");
    expect(html).toContain('aria-label="Buyer activation plan"');
    expect(html).toContain("Buyer activation plan");
    expect(html).toContain("Capture value baseline");
    expect(html).toContain("Download activation");
    expect(html).toContain("Activation calendar");
    expect(html).toContain("Email activation");
    expect(html).toContain('aria-label="Buyer value checkpoint"');
    expect(html).toContain("Buyer value checkpoint");
    expect(html).toContain("Baseline value claim");
    expect(html).toContain("Download checkpoint");
    expect(html).toContain("Checkpoint CSV");
    expect(html).toContain("Email checkpoint");
    expect(html).toContain('aria-label="Buyer value checkpoint receipt"');
    expect(html).toContain("Value checkpoint receipt");
    expect(html).toContain("Actual value signal");
    expect(html).toContain("Checkpoint receipt JSON");
    expect(html).toContain("Verify checkpoint");
    expect(html).toContain("Receipt memo");
    expect(html).toContain('aria-label="Buyer value checkpoint owner handoff"');
    expect(html).toContain("Value checkpoint owner handoff");
    expect(html).toContain("Attach checkpoint receipt");
    expect(html).toContain("Owner handoff");
    expect(html).toContain("Handoff CSV");
    expect(html).toContain("Handoff calendar");
    expect(html).toContain("Email value owner");
    expect(html).toContain('aria-label="Buyer value owner closeout receipt"');
    expect(html).toContain("Value owner closeout receipt");
    expect(html).toContain("Accepted by");
    expect(html).toContain("Evidence note");
    expect(html).toContain("Closeout receipt JSON");
    expect(html).toContain("Verify closeout");
    expect(html).toContain("Open verifier");
    expect(html).toContain("Closeout memo");
    expect(html).toContain('aria-label="Buyer value next window packet"');
    expect(html).toContain("Value next window packet");
    expect(html).toContain("Next window memo");
    expect(html).toContain("Next window calendar");
    expect(html).toContain("Email next window");
    expect(html).toContain('aria-label="Buyer answer brief"');
    expect(html).toContain("Buyer answer brief");
    expect(html).toContain("Download brief");
    expect(html).toContain("Brief CSV");
    expect(html).toContain("Email brief");
    expect(html).toContain('href="/?workspace=workspace_test#quick-workflow-intake"');
    expect(html).toContain('aria-label="Buyer decision action dock"');
    expect(html).toContain('aria-label="Selected decision impact"');
    expect(html).toContain("Decision impact");
    expect(html).toContain("Repair request becomes an owner packet");
    expect(html).toContain("Selected response");
    expect(html).toContain("Response owner");
    expect(html).toContain("First follow-up");
    expect(html).toContain("Owner workspace");
    expect(html).toContain('href="#buyer-response-receipt"');
    expect(html).toContain("Record response");
    expect(html).toContain("Receipt JSON");
    expect(html).toContain("Verify receipt");
    expect(html).toContain("Return response");
    expect(html).toContain("workspace=workspace_test&amp;evidenceResponse=");
    expect(html).toContain("Live evidence audit");
    expect(html).toContain("Run live audit");
    expect(html).toContain("Audit plan");
    expect(html).toContain("Audit targets");
    expect(html).toContain("Not run");
    expect(html).toContain("8 artifact links can be rechecked from this shared page");
    expect(html).toContain("Approval checklist");
    expect(html).toContain("Buyer approval checklist");
    expect(html).toContain("Download checklist");
    expect(html).toContain("Source receipt verifies");
    expect(html).toContain("Required artifacts are ready");
    expect(html).toContain("Open risk is named");
    expect(html).toContain("Decision can be defended");
    expect(html).toContain("Response returns to owner");
    expect(html).toContain("Current approval gate");
    expect(html).toContain("Decision memo");
    expect(html).toContain("Buyer questions");
    expect(html).toContain("Can I trust the evidence?");
    expect(html).toContain("Download memo");
    expect(html).toContain("Evidence disclosure boundary");
    expect(html).toContain("Download boundary");
    expect(html).toContain("Email boundary");
    expect(html).toContain("Buyer adoption risk ledger");
    expect(html).toContain("Risk CSV");
    expect(html).toContain("Risk disposition receipt");
    expect(html).toContain("Risk receipt JSON");
    expect(html).toContain("Risk disposition owner handoff");
    expect(html).toContain("Email risk owner");
    expect(html).toContain("Risk owner closeout receipt");
    expect(html).toContain("Verify risk closeout");
    expect(html).toContain("Risk recheck packet");
    expect(html).toContain("Recheck calendar");
    expect(html).toContain("Buyer-send risk control");
    expect(html).toContain("Verify risk control");
    expect(html).toContain("Buyer value checkpoint");
    expect(html).toContain("Checkpoint CSV");
    expect(html).toContain("Email checkpoint");
    expect(html).toContain("Value checkpoint receipt");
    expect(html).toContain("Verify checkpoint");
    expect(html).toContain("Value checkpoint owner handoff");
    expect(html).toContain("Handoff CSV");
    expect(html).toContain("Handoff calendar");
    expect(html).toContain("Value owner closeout receipt");
    expect(html).toContain("Verify closeout");
    expect(html).toContain("Open verifier");
    expect(html).toContain("Value next window packet");
    expect(html).toContain("Next window calendar");
    expect(html).toContain("Buyer answer brief");
    expect(html).toContain("Download brief");
    expect(html).toContain("Brief CSV");
    expect(html).toContain("Email brief");
    expect(html).toContain("Platform / DevOps Lead");
    expect(html).toContain("Public proof links");
    expect(html).toContain('id="buyer-response-receipt"');
    expect(html.indexOf('aria-label="Live evidence audit"')).toBeLessThan(html.indexOf('aria-label="Buyer approval checklist"'));
    expect(html.indexOf('aria-label="Live evidence audit"')).toBeLessThan(html.indexOf('aria-label="Buyer decision memo"'));
    expect(html.indexOf('aria-label="Evidence disclosure boundary"')).toBeLessThan(html.indexOf('aria-label="Buyer answer brief"'));
    expect(html.indexOf('aria-label="Global procurement handoff"')).toBeLessThan(html.indexOf('aria-label="Buyer adoption risk ledger"'));
    expect(html.indexOf('aria-label="Buyer adoption risk ledger"')).toBeLessThan(html.indexOf('aria-label="Buyer decision meeting agenda"'));
    expect(html.indexOf('aria-label="Buyer adoption risk ledger"')).toBeLessThan(html.indexOf('aria-label="Buyer adoption risk disposition receipt"'));
    expect(html.indexOf('aria-label="Buyer adoption risk disposition receipt"')).toBeLessThan(html.indexOf('aria-label="Buyer decision meeting agenda"'));
    expect(html.indexOf('aria-label="Buyer adoption risk disposition receipt"')).toBeLessThan(html.indexOf('aria-label="Risk disposition owner handoff"'));
    expect(html.indexOf('aria-label="Risk disposition owner handoff"')).toBeLessThan(html.indexOf('aria-label="Buyer decision meeting agenda"'));
    expect(html.indexOf('aria-label="Risk disposition owner handoff"')).toBeLessThan(html.indexOf('aria-label="Risk owner closeout receipt"'));
    expect(html.indexOf('aria-label="Risk owner closeout receipt"')).toBeLessThan(html.indexOf('aria-label="Buyer decision meeting agenda"'));
    expect(html.indexOf('aria-label="Risk owner closeout receipt"')).toBeLessThan(html.indexOf('aria-label="Risk recheck packet"'));
    expect(html.indexOf('aria-label="Risk recheck packet"')).toBeLessThan(html.indexOf('aria-label="Buyer-send risk control"'));
    expect(html.indexOf('aria-label="Buyer-send risk control"')).toBeLessThan(html.indexOf('aria-label="Buyer decision meeting agenda"'));
    expect(html.indexOf('aria-label="Buyer activation plan"')).toBeLessThan(html.indexOf('aria-label="Buyer value checkpoint"'));
    expect(html.indexOf('aria-label="Buyer value checkpoint"')).toBeLessThan(html.indexOf('aria-label="Buyer value checkpoint receipt"'));
    expect(html.indexOf('aria-label="Buyer value checkpoint receipt"')).toBeLessThan(html.indexOf('aria-label="Buyer value checkpoint owner handoff"'));
    expect(html.indexOf('aria-label="Buyer value checkpoint owner handoff"')).toBeLessThan(html.indexOf('aria-label="Buyer value owner closeout receipt"'));
    expect(html.indexOf('aria-label="Buyer value owner closeout receipt"')).toBeLessThan(html.indexOf('aria-label="Buyer value next window packet"'));
    expect(html.indexOf('aria-label="Buyer value next window packet"')).toBeLessThan(html.indexOf('aria-label="Buyer answer brief"'));
    expect(html.indexOf('aria-label="Buyer value checkpoint"')).toBeLessThan(html.indexOf('aria-label="Buyer answer brief"'));
    expect(html.indexOf('aria-label="Buyer answer brief"')).toBeLessThan(html.indexOf('aria-label="Live evidence audit"'));
    expect(html.indexOf('aria-label="Buyer approval checklist"')).toBeLessThan(html.indexOf('aria-label="Buyer decision memo"'));
    expect(html.indexOf('aria-label="Buyer approval checklist"')).toBeLessThan(html.indexOf('id="buyer-response-receipt"'));
    expect(html.indexOf('aria-label="Buyer decision action dock"')).toBeLessThan(html.indexOf('aria-label="Buyer decision memo"'));
    expect(html.indexOf('aria-label="Buyer decision action dock"')).toBeLessThan(html.indexOf('id="buyer-response-receipt"'));
    expect(html).not.toContain("No shared evidence pack was found");
  });
});
