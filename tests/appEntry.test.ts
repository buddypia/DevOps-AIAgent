import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildAgentBuyerProofSignal,
  buildBuyerActivationSnapshot,
  buildBuyerCommercialOfferSnapshot,
  buildBuyerGlobalLaunchSnapshot,
  buildHomepageHeroProofRouteSnapshot,
  buildHomepageOutcomeArtifactSnapshot,
  buildHomepageProofEntrySnapshot,
  buildHomepagePublishabilitySnapshot,
  buildHomepageReviewerHandoffKitSnapshot,
  WorkspaceStatusBar,
  buildBuyerPilotAssemblyLineSnapshot,
  buildBuyerPilotContractSnapshot,
  buildBuyerPilotDecisionBriefSnapshot,
  buildBuyerPilotMeetingBriefSnapshot,
  buildBuyerOwnedProofChecklist,
  buildBuyerProofFocusPlan,
  buildBuyerProofChainSnapshot,
  buildBuyerProofPathRows,
  buildBuyerOperatingPlanSnapshot,
  buildBuyerPublicDecisionPath,
  buildBuyerSponsorAskSnapshot,
  buildBuyerTrustSnapshot,
  buildBuyerSquadAcceptanceMatrix,
  buildBuyerSquadClaimProofQueue,
  buildBuyerSquadClaimProofPacket,
  buildBuyerSquadHandoffMemo,
  buildBuyerSquadHandoffReadiness,
  buildBuyerSquadHandoffRows,
  buildBuyerSquadMeasurementPlan,
  buildBuyerSquadOperatingContract,
  buildBuyerSquadReviewAgenda,
  buildBuyerSquadReviewDecision,
  buildBuyerSquadReviewDecisionReceipt,
  buildBuyerSquadReviewDecisionReceiptPayload,
  buildBuyerSquadReviewReplaySteps,
  buildBuyerSquadTrialRepairPacket,
  buildBuyerSquadTrialRepairRows,
  buildBuyerSquadValueClaimLedger,
  BUYER_PROOF_ENTRY_STEPS,
  loadInitialWorkspaceDraft,
  type HomepagePublishabilitySnapshot,
  type BuyerProofWorkflowReadiness
} from "../src/AppHome";
import { buildBuyerProofSendabilityContract } from "../src/buyerProofSendabilityContract";
import { HomepageOutcomeArtifactPanel } from "../src/HomepageOutcomeArtifactPanel";
import HomepageOutcomeSpinePanel from "../src/HomepageOutcomeSpinePanel";
import HomepageReviewerHandoffKitPanel from "../src/HomepageReviewerHandoffKitPanel";
import { HomepageHeroPacketVerifier } from "../src/HomepageHeroPacketVerifier";
import { HomepageExternalReviewerDockPanel } from "../src/HomepageExternalReviewerDockPanel";
import { buildHomepageExternalReviewerDockSnapshot } from "../src/homepageExternalReviewerDock";
import { BuyerPilotSendNotePanel } from "../src/BuyerPilotSendNotePanel";
import { HomepageReferenceModeBridge } from "../src/HomepageReferenceModeBridge";
import type { ProofTransformation } from "../src/proofTransformation";
import { HomepageFirstRunValueProofCommandPanel } from "../src/HomepageFirstRunValueProofCommandPanel";
import { buildHomepageFirstRunValueProofCommand } from "../src/homepageFirstRunValueProofCommand";
import { HomepageHeroProofRoute, HomepageProofEntryRail } from "../src/HomepageProofEntryPanels";
import { buildHomepageValueLensSnapshot } from "../src/HomepageValueLens";
import { HomepageValueLens } from "../src/HomepageValueLensPanel";
import { buildHomepageBuyerBoardMemo } from "../src/homepageBuyerBoardMemo";
import { HomepageBuyerBoardMemoPanel } from "../src/HomepageBuyerBoardMemoPanel";
import { buildBuyerProofRepairProjection } from "../src/buyerProofRepairQueue";
import { BUYER_MEASURED_RUN_TUNER_FIELDS, BUYER_VALUE_TUNER_FIELDS } from "../src/BuyerValueTunerStrip";
import { buildBuyerPublicationWindowSnapshot } from "../src/buyerPublicationWindow";
import { buildBuyerA2ATrialEvidenceRecord } from "../src/buyerA2ATrialEvidence";
import type { BuyerOutcomeBrief } from "../src/buyerOutcomeBrief";
import { recommendSquad } from "../src/agentEngine";
import type { AgentTrialEvidenceRecord } from "../src/agentTrialEvidence";
import { buildBuyerPilotMeasuredRunSummary, type BuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun";
import { buildBuyerValueCommitment } from "../src/buyerValueCommitment";
import type { BuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildBuyerValueSensitivity } from "../src/buyerValueSensitivity";
import type { GlobalLaunchAudit } from "../src/globalLaunchAudit";
import type { HomepageRouteLock } from "../src/homepageRouteLock";
import type { HeroBuyerDecisionBrief } from "../src/HeroBuyerDecisionBrief";
import { mergeWorkflowProofIntake, type BuyerPilotProofIntake } from "../src/buyerPilotProofIntake";
import { HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH, HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION } from "../src/homepageOutcomeArtifactReceipt";
import { HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH } from "../src/homepageOutcomeSpineReceipt";
import { HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH, HOMEPAGE_VALUE_LENS_RECEIPT_VERSION } from "../src/homepageValueLensReceipt";
import { DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "../src/market";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import type { Recommendation } from "../src/types";
import type { BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { defaultWorkspaceDraft, encodeWorkspaceDraft, encodeWorkspaceShareParam, WORKSPACE_SHARE_PARAM, type WorkspaceDraft } from "../src/workspaceDraft";

function proofWorkspace({
  pilotEvidenceUrl,
  workOrderEvidenceUrl,
  ...patch
}: Partial<Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl">> & {
  pilotEvidenceUrl?: string;
  workOrderEvidenceUrl?: string;
} = {}): WorkspaceDraft {
  const workspace = defaultWorkspaceDraft("2026-06-20T00:00:00.000Z");
  return {
    ...workspace,
    ...patch,
    pilotRun: {
      ...workspace.pilotRun,
      evidenceUrl: pilotEvidenceUrl ?? workspace.pilotRun.evidenceUrl
    },
    buyerWorkOrder: {
      ...workspace.buyerWorkOrder,
      evidenceUrl: workOrderEvidenceUrl ?? workspace.buyerWorkOrder.evidenceUrl
    }
  };
}

test("merges workflow proof links without erasing existing proof intake", () => {
  const current: BuyerPilotProofIntake = {
    targetUrl: "https://current.opsbridge.ai",
    protopediaUrl: "https://protopedia.net/prototype/current",
    videoUrl: "https://youtu.be/current",
    pilotEvidenceUrl: "https://docs.google.com/document/d/current-run",
    workOrderEvidenceUrl: "https://github.com/buddypia/current/issues/12"
  };

  expect(
    mergeWorkflowProofIntake(current, {
      targetUrl: " https://release.opsbridge.ai ",
      protopediaUrl: "",
      videoUrl: "https://vimeo.com/123456",
      pilotEvidenceUrl: "   ",
      workOrderEvidenceUrl: " https://github.com/buddypia/release/issues/42 "
    })
  ).toEqual({
    targetUrl: "https://release.opsbridge.ai",
    protopediaUrl: "https://protopedia.net/prototype/current",
    videoUrl: "https://vimeo.com/123456",
    pilotEvidenceUrl: "https://docs.google.com/document/d/current-run",
    workOrderEvidenceUrl: "https://github.com/buddypia/release/issues/42"
  });
});

function globalLaunchLiftPlanFixture(score = 91, blocked = false): GlobalLaunchAudit["liftPlan"] {
  const projectedScore = blocked ? Math.max(score, 72) : score;
  return {
    targetScore: 86,
    scoreGap: Math.max(0, 86 - score),
    projectedScoreAfterFirstFix: projectedScore,
    summary: blocked ? "Public product surface is the first lift before global-ready." : "Global-ready threshold is met; keep proof fresh.",
    actions: [
      {
        id: blocked ? "lift-live-surface" : "route-global-traffic",
        priority: "now",
        dimensionId: blocked ? "live-surface" : "global-routing",
        label: blocked ? "Public product surface" : "Route global traffic to the launch room",
        currentScore: score,
        targetScore: blocked ? 92 : score,
        scoreLift: Math.max(0, projectedScore - score),
        projectedScore,
        proofRequired: blocked ? "Attach public launch proof links." : "Keep public proof links reachable.",
        decisionImpact: blocked ? "Makes the launch inspectable by a new buyer." : "Moves from review to acquisition routing.",
        href: blocked ? "#launch-evidence-console" : "#buyer-share-gate"
      }
    ]
  };
}

function routeStepsFixture(status: HomepageRouteLock["status"] = "ready", verdict: HomepageRouteLock["verdict"] = "send"): HomepageRouteLock["routeSteps"] {
  return [
    {
      id: "work-order",
      label: "Scope",
      value: status === "ready" ? "bounded" : "needs scope",
      status,
      evidence: "Work order evidence is attached.",
      href: "#marketplace-workbench",
      external: false,
      isCurrent: false
    },
    {
      id: "value-case",
      label: "Value",
      value: "¥420,000 / month",
      status,
      evidence: "Value evidence is modeled.",
      href: "/buyer-value",
      external: false,
      isCurrent: false
    },
    {
      id: "measured-run",
      label: "Measured run",
      value: status === "ready" ? "100% accepted" : "needs evidence",
      status,
      evidence: "Measured run evidence is attached.",
      href: "/buyer-delivery-memo",
      external: false,
      isCurrent: false
    },
    {
      id: "live-proof",
      label: "Live proof",
      value: status === "ready" ? "5/5" : "not checked",
      status,
      evidence: "Public proof reachability is represented.",
      href: "/buyer-proof-audit",
      external: false,
      isCurrent: verdict !== "send"
    },
    {
      id: "buyer-room",
      label: "Decision room",
      value: verdict,
      status: verdict === "send" ? "ready" : status,
      evidence: "Buyer decision route is represented.",
      href: "/launch-room",
      external: false,
      isCurrent: verdict === "send"
    }
  ];
}

function handoffPacketFixture(status: HomepageRouteLock["status"] = "ready", verdict: HomepageRouteLock["verdict"] = "send"): HomepageRouteLock["handoffPacket"] {
  return {
    title: verdict === "send" ? "Handoff attachable" : "Handoff stopped",
    summary: verdict === "send" ? "Attach receipts, manifest, and audit." : "Do not send until the current proof gap closes.",
    primaryAction: {
      label: verdict === "send" ? "Open review kit" : "Review blockers",
      href: "/buyer-review-kit",
      external: false
    },
    secondaryAction: {
      label: verdict === "send" ? "Open acceptance path" : "Preview acceptance path",
      href: "/buyer-acceptance-path",
      external: false
    },
    items: [
      {
        id: "decision-receipt",
        label: "Decision receipt",
        title: verdict === "send" ? "Continue record" : "Stop record",
        detail: "Checksum-verifiable decision record.",
        status,
        href: "/buyer-decision-receipt",
        external: false
      },
      {
        id: "trust-manifest",
        label: "Trust manifest",
        title: "5/5 artifacts sealed",
        detail: "Artifacts and owners are attached.",
        status,
        href: "/buyer-trust-manifest",
        external: false
      },
      {
        id: "live-proof-audit",
        label: "Live proof audit",
        title: status === "ready" ? "5/5 verified" : "not checked",
        detail: "Public proof reachability is represented.",
        status,
        href: "/buyer-proof-audit",
        external: false
      },
      {
        id: "follow-up-ledger",
        label: "Follow-up ledger",
        title: verdict === "send" ? "Post-send ownership" : "Live proof health",
        detail: "Owner follow-up is attached.",
        status,
        href: "/buyer-decision-follow-up",
        external: false
      }
    ]
  };
}

function homepageRouteLockFixture(status: HomepageRouteLock["status"] = "ready", verdict: HomepageRouteLock["verdict"] = "send"): HomepageRouteLock {
  return {
    status,
    verdict,
    headline: verdict === "send" ? "Send the buyer room now" : "Fix the first buyer blocker",
    instruction: status === "ready" ? "Buyer proof can be sent with the packet attached." : "Close the current proof gap before buyer delivery.",
    operatorLine: status === "ready" ? "Buyer can inspect value, proof, and operating gates." : "A buyer blocker is still visible before send.",
    score: status === "ready" ? 87 : status === "attention" ? 74 : 58,
    scoreLabel: verdict === "send" ? "buyer-send" : "hold-share",
    primaryAction: { label: verdict === "send" ? "Open launch room" : "Fix live proof", href: verdict === "send" ? "/launch-room" : "#buyer-proof-intake", external: false },
    secondaryAction: { label: "Open proof audit", href: "/buyer-proof-audit", external: false },
    routeSteps: routeStepsFixture(status, verdict),
    checks: [
      { id: "buyer-decision", label: "Buyer decision", value: verdict, status, evidence: "Buyer decision route is represented.", href: "/launch-room" },
      { id: "current-gap", label: "Current gap", value: status === "ready" ? "none" : "Live proof", status, evidence: "Current buyer proof gap is represented.", href: "#buyer-proof-intake" },
      { id: "live-proof", label: "Live proof", value: status === "ready" ? "5/5" : "2/5", status, evidence: "Public proof reachability is represented.", href: "/buyer-proof-audit" },
      { id: "artifact-closure", label: "Artifact closure", value: status === "ready" ? "5/5 ready" : "3/5 ready", status, evidence: "Artifact closure is represented.", href: "#buyer-pilot-command-title" }
    ],
    handoffPacket: handoffPacketFixture(status, verdict)
  };
}

function heroBuyerDecisionBriefFixture(status: HeroBuyerDecisionBrief["status"] = "ready"): HeroBuyerDecisionBrief {
  const decision = status === "ready" ? "send" : status === "attention" ? "review" : "hold";
  const decisionLabel = status === "ready" ? "Send" : status === "attention" ? "Review" : "Hold";
  const actionHref = status === "ready" ? "/launch-room" : "#buyer-proof-intake";
  return {
    status,
    decision,
    decisionLabel,
    headline: status === "ready" ? "Send Platform lead a buyer-verifiable pilot contract" : "Hold external sharing until proof closes",
    evidence: status === "ready" ? "Value, proof, trust, and stop rule are inspectable before approval." : "Live proof must be repaired before sharing.",
    buyer: "Platform lead",
    score: status === "ready" ? 88 : status === "attention" ? 76 : 61,
    primaryAction: { label: status === "ready" ? "Open launch room" : "Fix live proof", href: actionHref },
    secondaryAction: { label: "Open proof audit", href: "/buyer-proof-audit" },
    decisionReceiptAction: { label: "Open decision receipt", href: "/buyer-decision-receipt" },
    metrics: [
      { id: "value", label: "Buyer value", value: "¥420,000 / month", detail: "¥420,000 modeled, 32d payback." },
      { id: "receipt", label: "Measured receipt", value: "46m saved/run", detail: "83% accepted, ¥240,000 measured monthly value." },
      { id: "proof", label: "Public proof", value: status === "ready" ? "5/5" : "2/5", detail: "Attach public proof links." }
    ],
    outcomeReplay: [
      { id: "manual-work", label: "Manual work", status, value: "82h/month exposed", detail: "Manual release work is named.", href: "#buyer-value-simulator" },
      { id: "agent-run", label: "Agent run", status, value: "46m saved/run", detail: "Measured run is represented.", href: "#pilot-run-receipt" },
      { id: "proof-packet", label: "Proof packet", status, value: status === "ready" ? "5/5" : "2/5", detail: "Public proof is represented.", href: "/buyer-proof-audit" },
      { id: "buyer-decision", label: "Buyer decision", status, value: decisionLabel, detail: "Decision route is represented.", href: actionHref }
    ],
    buyerQuestions: [
      {
        id: "value-case",
        question: "Is the pilot worth buying?",
        answer: status === "ready" ? "Yes, value and measured receipt are attached." : "Not yet, value proof needs closure.",
        status,
        href: "#buyer-value-simulator",
        evidence: "¥420,000 modeled; ¥240,000 measured monthly value; 83% accepted."
      },
      { id: "proof-access", question: "Can the reviewer open proof?", answer: "Proof audit is represented.", status, href: "/buyer-proof-audit", evidence: "Proof links are represented." },
      { id: "trust-gate", question: "What keeps approval bounded?", answer: "Trust and stop rules are represented.", status, href: "#buyer-trust-center", evidence: "Trust boundary is represented." },
      { id: "next-decision", question: "What should happen next?", answer: "Open the launch room or fix live proof.", status, href: actionHref, evidence: "Next decision route is represented." }
    ],
    approvalPath: [
      { id: "work-order", label: "Scope work", status, owner: "Platform lead", href: "#buyer-work-order-studio", summary: "Scope is represented." },
      { id: "receipt", label: "Measure receipt", status, owner: "Pilot reviewer", href: "#pilot-run-receipt", summary: "Receipt is represented." },
      { id: "trust", label: "Check trust memo", status, owner: "Security reviewer", href: "#buyer-trust-center", summary: "Trust is represented." },
      { id: "send-room", label: "Send room", status, owner: "Sponsor owner", href: "/launch-room", summary: "Send path is represented." }
    ],
    packetReceipt: {
      receiptId: `buyer-send-${decision}-fixture`,
      checksumAlgorithm: "fnv1a32",
      checksum: "00000000"
    },
    exportMarkdown: "# Buyer send packet"
  };
}

function homepagePublishabilitySnapshotFixture(status: HomepagePublishabilitySnapshot["status"] = "ready"): HomepagePublishabilitySnapshot {
  const decision = status === "ready" ? "publish-ready" : status === "attention" ? "review-first" : "do-not-publish";
  const score = status === "ready" ? 91 : status === "attention" ? 78 : 58;
  return {
    status,
    decision,
    score,
    headline: status === "ready" ? "Global public release is ready to inspect" : "Do not publish until proof closes",
    hardTruth: status === "ready" ? "A buyer can inspect value, evidence, and operating proof." : "Public product surface blocks the release story.",
    proofSummary: status === "ready" ? "5/5 public links, 2 accepted A2A trials" : "2/5 public links, proof review required",
    primaryAction: { id: "primary", label: status === "ready" ? "Open publishability report" : "Fix public proof", href: status === "ready" ? "/global-publishability" : "#launch-evidence-console", external: false },
    reportAction: { id: "primary", label: "Open publishability report", href: "/global-publishability", external: false },
    workflowAction: { id: "workflow-intake", label: "Paste workflow", href: "#quick-workflow-intake", external: false },
    reviewerCover: {
      status,
      label: status === "ready" ? "Review cover" : "No-send cover",
      headline: status === "ready" ? "10-minute review cover is ready" : "Open the no-send cover before sharing",
      summary: status === "ready" ? "External reviewers can inspect the proof path." : "The cover names the first proof blocker.",
      href: "/global-publishability",
      external: false
    },
    readyCount: status === "ready" ? 3 : 0,
    blockedCount: status === "blocked" ? 1 : 0,
    gateTotal: 3,
    gates: [
      { id: "buyer-value", label: "Buyer value clarity", status, score, href: "#buyer-value-simulator" },
      { id: "measured-outcome", label: "Measured buyer outcome", status, score, href: "#pilot-run-receipt" },
      { id: "live-surface", label: "Public product surface", status, score, href: "#launch-evidence-console" }
    ],
    valueRoute: [
      { id: "buyer-value", label: "Value", status, title: `${score}/100 Buyer value clarity`, evidence: "Value is quantified.", href: "#buyer-value-simulator" },
      { id: "measured-proof", label: "Measured proof", status, title: `${score}/100 Measured buyer outcome`, evidence: "Pilot receipt shows accepted measured value.", href: "#pilot-run-receipt" },
      { id: "public-proof", label: "Public proof", status, title: `${score}/100 Public product surface`, evidence: "Public proof reachability is represented.", href: "#launch-evidence-console" },
      { id: "decision-path", label: "Decision", status, title: "Buyer decision path is inspectable", evidence: "Launch room route is represented.", href: "/launch-room" }
    ],
    publicClaimLedger: [
      { id: "value-claim", label: "Value claim", status, claim: "Economic value is defensible.", proof: "Value proof is represented.", buyerQuestion: "Why spend time now?", href: "#buyer-value-simulator" },
      { id: "outcome-claim", label: "Outcome claim", status, claim: "A measured run supports the outcome.", proof: "Measured proof is represented.", buyerQuestion: "Can I inspect a result?", href: "#pilot-run-receipt" },
      { id: "proof-claim", label: "Proof claim", status, claim: "The public proof path is inspectable.", proof: "Public proof is represented.", buyerQuestion: "Can I verify it myself?", href: "#launch-evidence-console" },
      { id: "operating-claim", label: "Operating claim", status, claim: "Operating and trust guardrails are visible.", proof: "Operating proof is represented.", buyerQuestion: "Who owns limits?", href: "#buyer-trust-center" }
    ],
    releaseLift: {
      targetScore: 86,
      scoreGap: Math.max(0, 86 - score),
      projectedScoreAfterFirstFix: status === "blocked" ? 72 : score,
      summary: status === "blocked" ? "Public proof is the first lift before global-ready." : "Global-ready threshold is represented.",
      actions: []
    },
    copyText: "# Public release verdict",
    exportMarkdown: "# Public release verdict"
  };
}

function buyerOutcomeBriefFixture(status: BuyerOutcomeBrief["status"] = "pass"): BuyerOutcomeBrief {
  const decision = status === "pass" ? "send-to-buyer" : status === "watch" ? "sponsor-review" : "repair-before-share";
  const metricStatus = status === "pass" ? "pass" : status === "watch" ? "watch" : "block";
  const briefScore = status === "pass" ? 91 : status === "watch" ? 74 : 58;
  const nextAction = {
    label: status === "block" ? "Public story proof" : "Buyer delivery memo",
    owner: status === "block" ? "Publication lead" : "Platform / DevOps Lead",
    action: status === "block" ? "Attach the public product URL, ProtoPedia page, and walkthrough video." : "Share the buyer proof packet and ask for bounded pilot approval.",
    href: status === "block" ? "#launch-evidence-console" : "/buyer-delivery-memo"
  };
  return {
    id: `buyer-outcome-brief-${decision}-${briefScore}`,
    generatedAt: "2026-06-20T00:00:00.000Z",
    decision,
    status,
    briefScore,
    headline: status === "pass" ? "A buyer can understand the value and proof from one page" : "Repair the buyer proof before sharing this publicly",
    hardTruth: status === "pass" ? "The brief ties value to measured pilot evidence." : "Public story proof blocks public buyer sharing.",
    decisionAsk: status === "pass" ? "Send this brief and ask for a bounded pilot approval." : "Keep this internal until public story proof is repaired.",
    targetBuyer: "Platform release lead",
    primaryMetric: "¥958,000",
    measuredOutcome: "340m saved/run, 100% accepted",
    valueNarrative:
      "Platform release lead gets ¥958,000 modeled monthly value from 82 saved hours/month and risk reduction, backed by 340 measured minutes saved in the first pilot run.",
    metrics: [
      { id: "modeled-value", label: "Modeled monthly value", value: "¥958,000", evidence: "82h/month saved, 19-day payback.", status: metricStatus },
      { id: "measured-value", label: "Measured pilot value", value: "¥742,000", evidence: "340m saved/run, 100% accepted.", status: metricStatus },
      { id: "live-proof", label: "Live proof health", value: status === "pass" ? "5/5" : "2/5", evidence: "Public proof reachability is represented.", status: metricStatus },
      { id: "buyer-decision", label: "Buyer decision", value: status === "pass" ? "send" : "hold", evidence: "Buyer decision route is represented.", status: metricStatus }
    ],
    story: [
      { id: "buyer-job", label: "Buyer job", narrative: "Release owner needs inspected proof.", proof: "Work order proof is represented." },
      { id: "agent-work", label: "Agent work", narrative: "Agent squad handles value and proof.", proof: "Agent fit is represented." },
      { id: "measured-outcome", label: "Measured outcome", narrative: "Measured receipt backs the claim.", proof: "Accepted run is represented." },
      { id: "buyer-decision", label: "Buyer decision", narrative: "Buyer can decide from proof.", proof: "Decision route is represented." }
    ],
    proof: [],
    redLines:
      status === "block"
        ? [
            {
              id: "redline-submission-proof",
              label: "Public story proof",
              owner: "Publication lead",
              status: "block",
              action: "Attach the public product URL, ProtoPedia page, and walkthrough video.",
              href: "#launch-evidence-console"
            }
          ]
        : [],
    nextAction,
    exportMarkdown: "# Buyer Outcome Brief"
  };
}

function homepageValueLensFixture() {
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"], 260);
  const scenario = buildBuyerValueScenario(recommendation, {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 6,
    manualHoursPerCycle: 32,
    adoptionRatePercent: 82,
    incidentRiskYenPerMonth: 500000
  });
  const measuredRun = buildBuyerPilotMeasuredRunSummary(
    {
      observedManualMinutes: 1920,
      observedAssistedMinutes: 240,
      participants: 5,
      acceptedTasks: 9,
      totalTasks: 10,
      evidenceUrl: "https://evidence.example/value-run",
      reviewerName: "Platform sponsor",
      notes: "Release planning pilot accepted."
    },
    scenario
  );

  return buildHomepageValueLensSnapshot({
    buyer: "Platform release lead",
    scenario,
    measuredRun,
    valueReportHref: "/buyer-value?workspace=share-token"
  });
}

describe("workspace initial load", () => {
  test("uses the proof-backed sample for first-time visitors", () => {
    const sample = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example");
    const result = loadInitialWorkspaceDraft({
      href: "https://app.example/",
      storedWorkspace: null,
      sampleWorkspace: sample,
      fallbackWorkspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z")
    });

    expect(result.source).toBe("sample");
    expect(result.draft.targetUrl).toBe("https://sample.example");
    expect(result.draft.pilotRun.evidenceUrl).toBe("https://sample.example/sample/pilot-run-receipt");
    expect(result.draft.buyerWorkOrder.evidenceUrl).toBe("https://sample.example/sample/work-order-brief");
    expect(result.draft.agentTrialEvidence.map((record) => record.status)).toEqual(["accepted", "accepted"]);
  });

  test("does not override a saved workspace with the sample", () => {
    const sample = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example");
    const saved = {
      ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      projectBrief: "Saved buyer proof room",
      targetUrl: "https://saved.example/run"
    };
    const result = loadInitialWorkspaceDraft({
      href: "https://app.example/",
      storedWorkspace: encodeWorkspaceDraft(saved),
      sampleWorkspace: sample,
      fallbackWorkspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z")
    });

    expect(result.source).toBe("saved");
    expect(result.draft.projectBrief).toBe("Saved buyer proof room");
    expect(result.draft.targetUrl).toBe("https://saved.example/run");
  });

  test("prioritizes shared workspaces over saved local state", () => {
    const sample = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example");
    const saved = {
      ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      projectBrief: "Saved buyer proof room",
      targetUrl: "https://saved.example/run"
    };
    const shared = {
      ...defaultWorkspaceDraft("2026-06-20T00:00:00.000Z"),
      projectBrief: "Shared buyer proof room",
      targetUrl: "https://shared.example/run"
    };
    const sharedParam = encodeURIComponent(encodeWorkspaceShareParam(shared));
    const result = loadInitialWorkspaceDraft({
      href: `https://app.example/?${WORKSPACE_SHARE_PARAM}=${sharedParam}`,
      storedWorkspace: encodeWorkspaceDraft(saved),
      sampleWorkspace: sample,
      fallbackWorkspace: defaultWorkspaceDraft("2026-06-20T00:00:00.000Z")
    });

    expect(result.source).toBe("shared");
    expect(result.draft.projectBrief).toBe("Shared buyer proof room");
    expect(result.draft.targetUrl).toBe("https://shared.example/run");
  });
});

describe("app entry buyer proof path", () => {
  test("surfaces the receipt-backed buyer evidence board from the workspace status bar", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example");
    const html = renderToStaticMarkup(
      createElement(WorkspaceStatusBar, {
        draft: workspace,
        selectedCount: 4,
        shareHref: "https://app.example/?workspace=lz1.demo",
        launchRoomHref: "https://app.example/launch-room?workspace=lz1.demo",
        evidenceBoardHref: "https://app.example/buyer-evidence-board?workspace=lz1.demo",
        proofAuditHref: "https://app.example/buyer-proof-audit?brief=sample",
        publicReviewHref: "https://app.example/global-publishability?workspace=lz1.demo",
        importedFromShare: false,
        shareStatus: "idle",
        importStatus: "idle",
        importMessage: "",
        onCopyShareLink: () => undefined,
        onImportWorkspace: (_file: File | null) => undefined,
        onReset: () => undefined
      })
    );

    expect(html).toContain("Buyer evidence board checkpoint");
    expect(html).toContain("Evidence board");
    expect(html).toContain("https://app.example/buyer-evidence-board?workspace=lz1.demo");
    expect(html).toContain("Open board");
  });

  test("keeps the first-run path focused on proof-backed buyer value", () => {
    expect(BUYER_PROOF_ENTRY_STEPS.map((step) => step.id)).toEqual(["current", "sample", "agent-trial"]);
    expect(BUYER_PROOF_ENTRY_STEPS.map((step) => step.signal)).toEqual(["Your workspace", "Reference room", "Agent trial"]);
    expect(BUYER_PROOF_ENTRY_STEPS).toHaveLength(3);

    expect(BUYER_PROOF_ENTRY_STEPS[0].title).toMatch(/buyer pilot/i);
    expect(BUYER_PROOF_ENTRY_STEPS[0].detail).toMatch(/proof URLs/i);
    expect(BUYER_PROOF_ENTRY_STEPS[0].detail).toMatch(/send\/hold/i);
    expect(BUYER_PROOF_ENTRY_STEPS[0].detail).toMatch(/trust manifest/i);
    expect(BUYER_PROOF_ENTRY_STEPS[1].title).toMatch(/evidence shape/i);
    expect(BUYER_PROOF_ENTRY_STEPS[1].detail).toMatch(/reference room as calibration/i);
    expect(BUYER_PROOF_ENTRY_STEPS[1].detail).toMatch(/deployed URL/i);
    expect(BUYER_PROOF_ENTRY_STEPS[1].detail).toMatch(/A2A receipts/i);
    expect(BUYER_PROOF_ENTRY_STEPS[2].detail).toMatch(/trial plan/i);

    for (const step of BUYER_PROOF_ENTRY_STEPS) {
      expect(step.signal).not.toMatch(/^\d/);
      expect(step.title).not.toMatch(/demo/i);
      expect(step.detail).not.toMatch(/demo/i);
    }
  });

  test("frames the reference workspace as an unlock path instead of a failed room", () => {
    const transformation: ProofTransformation = {
      id: "proof-transformation-fixture",
      headline: "Turn one workflow into buyer proof",
      hardTruth: "Reference proof must be replaced before sharing.",
      before: {
        id: "current",
        label: "Current workspace",
        decision: "repair-before-share",
        status: "block",
        score: 75,
        targetBuyer: "Platform release lead",
        monthlyValue: "¥1,005,000/month",
        measuredOutcome: "1260m saved/run",
        proofClosure: "3/5",
        acceptedTrials: "2 accepted",
        blockerCount: 2,
        summary: "Public proof still needs owner evidence."
      },
      after: {
        id: "sample",
        label: "Buyer proof target",
        decision: "send-to-buyer",
        status: "pass",
        score: 91,
        targetBuyer: "Platform release lead",
        monthlyValue: "¥1,005,000/month",
        measuredOutcome: "1260m saved/run",
        proofClosure: "5/5",
        acceptedTrials: "2 accepted",
        blockerCount: 0,
        summary: "Buyer-owned proof is attached."
      },
      current: {
        status: "block",
        headline: "2 current repair items before buyer sharing",
        score: 75,
        proofClosure: "not checked",
        readyCount: 3,
        watchCount: 0,
        blockedCount: 2,
        openCount: 2,
        primaryAction: "Public story proof: Attach both the public story page and the walkthrough video URL.",
        items: [
          {
            id: "public-story-proof",
            label: "Public story proof",
            status: "block",
            owner: "Publication lead",
            action: "Attach both the public story page and the walkthrough video URL.",
            proof: "Blocks external buyer review until repaired.",
            href: "#launch-evidence-console"
          },
          {
            id: "buyer-proof-packet",
            label: "Buyer proof packet",
            status: "block",
            owner: "Proof owner",
            action: "Close public story proof before sharing externally.",
            proof: "Blocks external buyer review until repaired.",
            href: "#buyer-pilot-send-note"
          }
        ]
      },
      deltas: [],
      generatedArtifacts: [],
      runway: []
    };

    const html = renderToStaticMarkup(
      createElement(HomepageReferenceModeBridge, {
        workspaceSource: "sample",
        transformation,
        workflowHref: "#quick-workflow-intake",
        proofAuditHref: "/buyer-proof-audit",
        sendBriefHref: "#buyer-pilot-send-note",
        onLoadSample: () => undefined
      })
    );

    expect(html).toContain("Reference mode");
    expect(html).toContain("This reference room is a map, not a sendable buyer claim");
    expect(html).toContain("Paste your workflow");
    expect(html).toContain("Replace proof URLs");
    expect(html).toContain("Review send brief");
    expect(html).toContain("First repairs");
    expect(html).toContain("Public story proof");
    expect(html).toContain("2 open / 3 ready");
    expect(html).not.toMatch(/demo/i);
  });

  test("turns proof, commitment, and decision state into one focused pilot path", () => {
    const proofChecklist = buildBuyerOwnedProofChecklist({
      workspace: proofWorkspace(),
      proofVerification: null,
      workflowIntakeHref: "#marketplace-workbench",
      currentAuditHref: "/buyer-proof-audit"
    });
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 260);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 6,
      hourlyCostYen: 9000,
      cyclesPerMonth: 4,
      manualHoursPerCycle: 24,
      adoptionRatePercent: 70,
      incidentRiskYenPerMonth: 180000
    });
    const sponsorAsk = buildBuyerSponsorAskSnapshot({
      commitment: buildBuyerValueCommitment({ scenario, sensitivity: buildBuyerValueSensitivity(scenario) }),
      valueReportHref: "/buyer-value"
    });
    const plan = buildBuyerProofFocusPlan({
      proofChecklist,
      sponsorAsk,
      publicDecisionPath: {
        status: "blocked",
        decision: "hold-internal",
        headline: "Hold public sharing until proof closes",
        buyerLine: "Platform release lead -> ¥467,000 / mo -> 35m saved/run -> hold",
        firstAction: { id: "primary", label: "Fix proof audit", href: "/buyer-proof-audit", external: false },
        artifacts: [
          {
            id: "proof-audit",
            label: "Proof audit",
            status: "blocked",
            value: "not checked",
            proof: "Run live proof verification before sending.",
            href: "/buyer-proof-audit"
          }
        ],
        guardrails: ["Do not send externally while proof is blocked."],
        copyText: "# Public buyer decision path",
        exportMarkdown: "# Public buyer decision path"
      }
    });

    expect(plan.status).toBe("blocked");
    expect(plan.headline).toBe("Work proof gaps before buyer sharing");
    expect(plan.primaryAction).toMatchObject({ label: "Fix Live product", href: "#marketplace-workbench" });
    expect(plan.stages.map((stage) => stage.id)).toEqual(["proof-gaps", "first-commitment", "buyer-room"]);
    expect(plan.stages.find((stage) => stage.id === "proof-gaps")).toMatchObject({
      status: "blocked",
      metric: "0/5 verified"
    });
    expect(plan.stages.find((stage) => stage.id === "buyer-room")).toMatchObject({
      status: "blocked",
      metric: "hold-internal"
    });
    expect(plan.copyText).toBe(plan.exportMarkdown);
    expect(plan.exportMarkdown).toContain("# Buyer proof focus plan");
    expect(plan.exportMarkdown).toContain("## Focus stages");
    expect(plan.exportMarkdown).toContain("Action: [Fix Live product](#marketplace-workbench)");
    expect(plan.taskCsv).toContain("stageId,label,status,metric,headline,action,evidence,sourceHref");
    expect(plan.taskCsv).toContain("proof-gaps,Proof gaps,blocked,0/5 verified");
    expect(plan.taskCsv).toContain("buyer-room,Buyer room,blocked,hold-internal");
    expect(plan.taskCsvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(JSON.stringify(plan)).not.toMatch(/demo/i);
  });

  test("blocks the buyer-owned proof checklist when URLs are missing or still starter proof", () => {
    const checklist = buildBuyerOwnedProofChecklist({
      workspace: proofWorkspace({
        targetUrl: "https://sample.example",
        pilotEvidenceUrl: "https://proof.example/sample/pilot-receipt",
        workOrderEvidenceUrl: "https://proof.example/sample/work-order"
      }),
      proofVerification: null,
      workflowIntakeHref: "#marketplace-workbench",
      currentAuditHref: "/buyer-proof-audit"
    });

    expect(checklist.status).toBe("blocked");
    expect(checklist.readyCount).toBe(0);
    expect(checklist.attentionCount).toBe(0);
    expect(checklist.blockedCount).toBe(5);
    expect(checklist.headline).toMatch(/proof gaps/i);
    expect(checklist.primaryAction).toBe("Live product: Replace it with proof from the buyer workflow.");
    expect(checklist.items.map((item) => [item.id, item.value])).toEqual([
      ["targetUrl", "Reference URL"],
      ["protopediaUrl", "Missing"],
      ["videoUrl", "Missing"],
      ["pilotEvidenceUrl", "Reference URL"],
      ["workOrderEvidenceUrl", "Reference URL"]
    ]);
    expect(buildBuyerProofSendabilityContract(checklist)).toMatchObject({
      status: "blocked",
      headline: "Do not send this buyer room yet",
      firstBlockerLabel: "Live product",
      proofLine: "0/5 buyer-owned proof links verified",
      ownershipLine: "Live reachability has not proven buyer-owned proof yet.",
      artifactLine: "5 proof slots blocked.",
      verifierLine: "Keep verifier internal until proof is replaced.",
      primaryAction: "Live product: Replace it with proof from the buyer workflow.",
      primaryActionHref: "#marketplace-workbench"
    });
    expect(buildBuyerProofSendabilityContract(checklist, { liveVerifiedCount: 3, liveTotalCount: 5 })).toMatchObject({
      ownershipLine: "3/5 live links are reachable, but only 0/5 are buyer-owned."
    });
    expect(JSON.stringify(checklist)).not.toMatch(/demo/i);
  });

  test("blocks hosted reference proof in the buyer-owned proof checklist", () => {
    const referenceWorkspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://a2a-agent-marketplace.example");
    const checklist = buildBuyerOwnedProofChecklist({
      workspace: referenceWorkspace,
      referenceWorkspace,
      proofVerification: null,
      workflowIntakeHref: "#marketplace-workbench",
      currentAuditHref: "/buyer-proof-audit"
    });

    expect(checklist.status).toBe("blocked");
    expect(checklist.blockedCount).toBe(5);
    expect(checklist.primaryAction).toBe("Live product: Replace it with proof from the buyer workflow.");
    expect(checklist.items.find((item) => item.id === "targetUrl")).toMatchObject({
      status: "blocked",
      value: "Reference URL",
      evidence: "Live product still points at a reference artifact."
    });
    expect(checklist.items.find((item) => item.id === "pilotEvidenceUrl")).toMatchObject({
      status: "blocked",
      value: "Reference URL"
    });
    expect(checklist.items.find((item) => item.id === "workOrderEvidenceUrl")).toMatchObject({
      status: "blocked",
      value: "Reference URL"
    });
  });

  test("asks for live verification when buyer-owned proof URLs are attached but unchecked", () => {
    const checklist = buildBuyerOwnedProofChecklist({
      workspace: proofWorkspace({
        targetUrl: "https://proof.example/app",
        protopediaUrl: "https://protopedia.net/prototype/123",
        videoUrl: "https://youtu.be/buyer-proof",
        pilotEvidenceUrl: "https://proof.example/receipts/pilot",
        workOrderEvidenceUrl: "https://proof.example/receipts/work-order"
      }),
      proofVerification: null,
      workflowIntakeHref: "#marketplace-workbench",
      currentAuditHref: "/buyer-proof-audit"
    });

    expect(checklist.status).toBe("attention");
    expect(checklist.readyCount).toBe(0);
    expect(checklist.attentionCount).toBe(5);
    expect(checklist.blockedCount).toBe(0);
    expect(checklist.headline).toMatch(/live verification/i);
    expect(checklist.primaryAction).toBe("Live product: Run live proof verification.");
    expect(checklist.items.every((item) => item.value === "Attached")).toBe(true);
    expect(checklist.items.every((item) => item.href === "/buyer-proof-audit")).toBe(true);
    expect(buildBuyerProofSendabilityContract(checklist)).toMatchObject({
      status: "attention",
      headline: "Proof is shaped, live verification is still required",
      firstBlockerLabel: "Live product",
      ownershipLine: "Live reachability has not proven buyer-owned proof yet.",
      artifactLine: "5 proof slots need live check.",
      verifierLine: "Run live verification before sending.",
      sendRule: "Keep in sponsor review until live verification passes.",
      primaryActionHref: "/buyer-proof-audit"
    });
  });

  test("marks the buyer-owned proof checklist ready only after all live checks pass", () => {
    const proofVerification: BuyerShareGateProofVerificationSummary = {
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
      ]
    };

    const checklist = buildBuyerOwnedProofChecklist({
      workspace: proofWorkspace({
        targetUrl: "https://proof.example/app",
        protopediaUrl: "https://protopedia.net/prototype/123",
        videoUrl: "https://youtu.be/buyer-proof",
        pilotEvidenceUrl: "https://proof.example/receipts/pilot",
        workOrderEvidenceUrl: "https://proof.example/receipts/work-order"
      }),
      proofVerification,
      workflowIntakeHref: "#marketplace-workbench",
      currentAuditHref: "/buyer-proof-audit"
    });

    expect(checklist.status).toBe("ready");
    expect(checklist.readyCount).toBe(5);
    expect(checklist.attentionCount).toBe(0);
    expect(checklist.blockedCount).toBe(0);
    expect(checklist.headline).toMatch(/verified/i);
    expect(checklist.primaryAction).toBe("Keep the proof audit fresh while sharing.");
    expect(checklist.items.every((item) => item.value === "Verified")).toBe(true);
    expect(buildBuyerProofSendabilityContract(checklist, { readyActionHref: "/launch-room" })).toMatchObject({
      status: "ready",
      headline: "Buyer send is allowed with verifier attached",
      firstBlockerLabel: "None",
      ownershipLine: "Live verification and buyer-owned proof both show 5/5 ready.",
      artifactLine: "Attach memo, trust manifest, launch room, and decision receipt.",
      verifierLine: "Verifier can travel with the packet.",
      primaryAction: "Open launch room",
      primaryActionHref: "/launch-room"
    });
  });

  test("keeps failed live proof checks in the buyer-owned proof repair path", () => {
    const proofVerification: BuyerShareGateProofVerificationSummary = {
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: 3,
      totalCount: 5,
      score: 70,
      results: [
        { id: "targetUrl", label: "Live product", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
        { id: "protopediaUrl", label: "ProtoPedia story", status: "watch", httpStatus: 302, evidence: "Redirected.", action: "Confirm the public page is stable." },
        { id: "videoUrl", label: "Walkthrough video", status: "block", httpStatus: 404, evidence: "HTTP 404.", action: "Replace the walkthrough URL." },
        { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
        { id: "workOrderEvidenceUrl", label: "Work order proof", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." }
      ]
    };

    const checklist = buildBuyerOwnedProofChecklist({
      workspace: proofWorkspace({
        targetUrl: "https://proof.example/app",
        protopediaUrl: "https://protopedia.net/prototype/123",
        videoUrl: "https://youtu.be/buyer-proof",
        pilotEvidenceUrl: "https://proof.example/receipts/pilot",
        workOrderEvidenceUrl: "https://proof.example/receipts/work-order"
      }),
      proofVerification,
      workflowIntakeHref: "#marketplace-workbench",
      currentAuditHref: "/buyer-proof-audit"
    });

    expect(checklist.status).toBe("blocked");
    expect(checklist.readyCount).toBe(3);
    expect(checklist.attentionCount).toBe(1);
    expect(checklist.blockedCount).toBe(1);
    expect(checklist.items.find((item) => item.id === "protopediaUrl")).toMatchObject({
      status: "attention",
      value: "Needs review",
      href: "#marketplace-workbench"
    });
    expect(checklist.items.find((item) => item.id === "videoUrl")).toMatchObject({
      status: "blocked",
      value: "Blocked",
      action: "Replace the walkthrough URL."
    });
    expect(checklist.primaryAction).toBe("ProtoPedia story: Confirm the public page is stable.");
    expect(buildBuyerProofSendabilityContract(checklist, { liveVerifiedCount: 3, liveTotalCount: 5 })).toMatchObject({
      ownershipLine: "3/5 live links are reachable and 2 proof slots still need repair."
    });
  });

  test("builds a buyer-safe accepted A2A trial receipt from a public artifact", () => {
    const agent = MARKET_AGENTS.find((item) => item.id === "cloud-run-sre");
    expect(agent).toBeDefined();
    if (!agent) return;

    const record = buildBuyerA2ATrialEvidenceRecord({
      agent,
      skillId: "cloud-run.release-proof",
      score: 94.4,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/a2a/cloud-run-receipt",
      evidenceSource: "Buyer-safe release review A2A response.",
      attachedAt: "2026-06-21T00:00:00.000Z"
    });

    expect(record).toMatchObject({
      id: "trial-proof-buyer-trial-cloud-run-sre-cloud-run-release-proof",
      receiptId: "buyer-trial-cloud-run-sre-cloud-run-release-proof",
      agentId: "cloud-run-sre",
      agentName: "Cloud Run SRE",
      skillId: "cloud-run.release-proof",
      status: "accepted",
      score: 94,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/a2a/cloud-run-receipt",
      evidenceSource: "Buyer-safe release review A2A response."
    });
    expect(record?.summary).toMatch(/buyer-safe accepted A2A trial receipt/i);
    expect(JSON.stringify(record)).not.toMatch(/demo/i);
  });

  test("rejects A2A trial receipts that are not buyer-facing HTTPS artifacts", () => {
    const agent = MARKET_AGENTS.find((item) => item.id === "cloud-run-sre");
    expect(agent).toBeDefined();
    if (!agent) return;

    expect(
      buildBuyerA2ATrialEvidenceRecord({
        agent,
        score: 94,
        artifactUrl: "http://localhost:8080/a2a-receipt"
      })
    ).toBeNull();
    expect(
      buildBuyerA2ATrialEvidenceRecord({
        agent,
        score: 94,
        artifactUrl: "https://proof.your-company.com/receipts/a2a-trial.json"
      })
    ).toBeNull();
  });

  test("summarizes the first buyer pilot as an assembly line with one current fix", () => {
    const assembly = buildBuyerPilotAssemblyLineSnapshot({
      proofChain: {
        primaryAction: { id: "primary", label: "Fix Proof", href: "/buyer-proof-audit", external: false },
        gates: [
          { id: "workflow-scope", label: "Workflow scope", status: "ready", value: "Platform release review", evidence: "Workflow is named.", href: "#marketplace-workbench" },
          { id: "value-case", label: "Value case", status: "ready", value: "¥720,000 / mo", evidence: "Value is modeled.", href: "/buyer-value" },
          { id: "measured-run", label: "Measured run", status: "ready", value: "420m saved/run", evidence: "Pilot run is measured.", href: "/buyer-delivery-memo" },
          { id: "live-proof-audit", label: "Live proof audit", status: "blocked", value: "2/5", evidence: "Three links are missing.", href: "/buyer-proof-audit" },
          { id: "buyer-decision", label: "Buyer decision", status: "blocked", value: "hold", evidence: "Buyer cannot receive it yet.", href: "/launch-room" }
        ]
      },
      publicDecisionPath: {
        artifacts: [
          { id: "workflow-intake", label: "Workflow intake", status: "ready", value: "Platform release review", proof: "Scope, owner, baseline, and success metric are attached.", href: "#marketplace-workbench" },
          { id: "value-report", label: "Value report", status: "ready", value: "¥720,000 / mo", proof: "Payback is inside the pilot window.", href: "/buyer-value" },
          { id: "proof-audit", label: "Proof audit", status: "blocked", value: "2/5 links", proof: "Story, walkthrough, and receipt links are missing.", href: "/buyer-proof-audit" },
          { id: "launch-room", label: "Launch room", status: "blocked", value: "hold", proof: "Proof must close before sharing.", href: "/launch-room" }
        ]
      },
      pilotContract: {
        status: "blocked",
        headline: "Do not send the pilot contract yet",
        firstAction: { id: "primary", label: "Fix Proof acceptance", href: "/buyer-proof-audit", external: false },
        stopRule: "Stop if proof remains incomplete.",
        sendNote: {
          status: "blocked",
          subject: "Draft only: Platform lead pilot contract",
          instruction: "Do not send.",
          body: [],
          attachments: [],
          copyText: ""
        }
      },
      globalLaunchSnapshot: {
        status: "blocked",
        headline: "Do not present this as globally launch-ready yet",
        proofSummary: "2/5 public links",
        firstAction: { id: "primary", label: "Fix proof links", href: "/buyer-proof-audit", external: false }
      }
    });

    expect(assembly.status).toBe("blocked");
    expect(assembly.headline).toBe("Proof is the next assembly step");
    expect(assembly.primaryAction).toMatchObject({ label: "Fix Proof", href: "/buyer-proof-audit" });
    expect(assembly.readyCount).toBe(2);
    expect(assembly.attentionCount).toBe(0);
    expect(assembly.blockedCount).toBe(2);
    expect(assembly.stages.map((stage) => stage.id)).toEqual(["workflow", "value", "proof", "contract"]);
    expect(assembly.stages.map((stage) => stage.status)).toEqual(["ready", "ready", "blocked", "blocked"]);
    expect(JSON.stringify(assembly)).not.toMatch(/demo/i);
  });

  test("marks the assembly line ready only when workflow, value, proof, and contract are ready", () => {
    const assembly = buildBuyerPilotAssemblyLineSnapshot({
      proofChain: {
        primaryAction: { id: "primary", label: "Open buyer room", href: "/launch-room", external: false },
        gates: [
          { id: "workflow-scope", label: "Workflow scope", status: "ready", value: "Platform release review", evidence: "Workflow is named.", href: "#marketplace-workbench" },
          { id: "value-case", label: "Value case", status: "ready", value: "¥920,000 / mo", evidence: "Value is modeled.", href: "/buyer-value" },
          { id: "measured-run", label: "Measured run", status: "ready", value: "1260m saved/run", evidence: "Pilot run is measured.", href: "/buyer-delivery-memo" },
          { id: "live-proof-audit", label: "Live proof audit", status: "ready", value: "5/5", evidence: "All links are current.", href: "/buyer-proof-audit" },
          { id: "buyer-decision", label: "Buyer decision", status: "ready", value: "send", evidence: "Buyer can receive the room.", href: "/launch-room" }
        ]
      },
      publicDecisionPath: {
        artifacts: [
          { id: "workflow-intake", label: "Workflow intake", status: "ready", value: "Platform release review", proof: "Scope, owner, baseline, and success metric are attached.", href: "#marketplace-workbench" },
          { id: "value-report", label: "Value report", status: "ready", value: "¥920,000 / mo", proof: "Payback is inside the pilot window.", href: "/buyer-value" },
          { id: "proof-audit", label: "Proof audit", status: "ready", value: "5/5 links", proof: "Public proof is current.", href: "/buyer-proof-audit" },
          { id: "launch-room", label: "Launch room", status: "ready", value: "send", proof: "Buyer room can be sent.", href: "/launch-room" }
        ]
      },
      pilotContract: {
        status: "ready",
        headline: "The first buyer pilot has a sendable contract",
        firstAction: { id: "primary", label: "Open pilot contract", href: "#commercial-offer", external: false },
        stopRule: "Stop if measured value falls below the floor.",
        sendNote: {
          status: "ready",
          subject: "Pilot contract ready: Platform lead",
          instruction: "Send with proof attached.",
          body: [],
          attachments: [],
          copyText: ""
        }
      },
      globalLaunchSnapshot: {
        status: "ready",
        headline: "This launch can stand in front of a global buyer",
        proofSummary: "5/5 public links",
        firstAction: { id: "primary", label: "Open launch audit", href: "/global-launch-audit", external: false }
      }
    });

    expect(assembly.status).toBe("ready");
    expect(assembly.headline).toBe("Pilot contract is assembled for buyer review");
    expect(assembly.instruction).toContain("Workflow, value, public proof, and contract terms");
    expect(assembly.readyCount).toBe(4);
    expect(assembly.attentionCount).toBe(0);
    expect(assembly.blockedCount).toBe(0);
    expect(assembly.primaryAction).toMatchObject({ label: "Open pilot contract", href: "#commercial-offer" });
  });

  test("turns the pilot contract into buyer decision answers with the first unresolved answer", () => {
    const brief = buildBuyerPilotDecisionBriefSnapshot({
      pilotContract: {
        status: "blocked",
        headline: "Do not send the pilot contract yet",
        hardTruth: "Commercial proof is not ready for a buyer.",
        pilotOffer: "First pilot offer",
        proofLine: "Proof audit is missing public links.",
        stopRule: "Stop if proof remains incomplete.",
        firstAction: { id: "primary", label: "Fix contract", href: "/commercial-offer", external: false },
        buyerQuestions: [
          { question: "What do we buy first?", answer: "A bounded release review pilot.", evidence: "Scope is approved." },
          { question: "Why is the ask defensible?", answer: "The ask is not defensible yet.", evidence: "Proof acceptance is blocked." },
          { question: "What prevents over-expansion?", answer: "A value floor and renewal gate.", evidence: "Renewal decision is ready." }
        ],
        closeChecklist: [
          { id: "buyer-scope", label: "Scope", status: "ready", owner: "Buyer", buyerDecision: "Approve one workflow", evidence: "Workflow is concrete.", href: "/work-order" },
          { id: "commercial-boundary", label: "Commercial", status: "blocked", owner: "Sponsor", buyerDecision: "Hold pricing", evidence: "Value coverage is missing.", href: "/commercial-offer" },
          { id: "proof-acceptance", label: "Proof", status: "blocked", owner: "Proof owner", buyerDecision: "Wait for proof", evidence: "Public proof is incomplete.", href: "/proof-audit" },
          { id: "trust-boundary", label: "Trust", status: "ready", owner: "Security", buyerDecision: "Public-safe data only", evidence: "Trust controls are ready.", href: "/trust" },
          { id: "renewal-decision", label: "Renewal", status: "ready", owner: "Sponsor", buyerDecision: "Renew only above floor", evidence: "Stop rule is explicit.", href: "/renewal" }
        ]
      }
    });

    expect(brief.status).toBe("blocked");
    expect(brief.headline).toBe("Price answer is not ready");
    expect(brief.primaryAction).toMatchObject({ label: "Fix Price answer", href: "/commercial-offer" });
    expect(brief.readyCount).toBe(2);
    expect(brief.questionTotal).toBe(3);
    expect(brief.questions.map((question) => question.id)).toEqual(["scope", "price", "expansion"]);
    expect(brief.questions.map((question) => question.status)).toEqual(["ready", "blocked", "ready"]);
    expect(brief.copyText).toContain("Why is the ask defensible?");
    expect(brief.copyText).not.toMatch(/demo/i);
  });

  test("marks buyer decision answers ready when scope, price, proof, trust, and renewal are clear", () => {
    const brief = buildBuyerPilotDecisionBriefSnapshot({
      pilotContract: {
        status: "ready",
        headline: "The first buyer pilot has a sendable contract",
        hardTruth: "The offer ties scope, value, proof, trust, and renewal terms together.",
        pilotOffer: "First pilot offer",
        proofLine: "Proof audit, launch room, and contract terms are attached.",
        stopRule: "Stop if measured value falls below the floor.",
        firstAction: { id: "primary", label: "Open pilot contract", href: "#commercial-offer", external: false },
        buyerQuestions: [
          { question: "What do we buy first?", answer: "A bounded release review pilot.", evidence: "Scope is approved." },
          { question: "Why is the ask defensible?", answer: "The ask is covered by measured value.", evidence: "Proof acceptance is ready." },
          { question: "What prevents over-expansion?", answer: "A value floor and renewal gate.", evidence: "Renewal decision is ready." }
        ],
        closeChecklist: [
          { id: "buyer-scope", label: "Scope", status: "ready", owner: "Buyer", buyerDecision: "Approve one workflow", evidence: "Workflow is concrete.", href: "/work-order" },
          { id: "commercial-boundary", label: "Commercial", status: "ready", owner: "Sponsor", buyerDecision: "Approve first pilot", evidence: "Value coverage is ready.", href: "/commercial-offer" },
          { id: "proof-acceptance", label: "Proof", status: "ready", owner: "Proof owner", buyerDecision: "Accept proof", evidence: "Public proof is complete.", href: "/proof-audit" },
          { id: "trust-boundary", label: "Trust", status: "ready", owner: "Security", buyerDecision: "Public-safe data only", evidence: "Trust controls are ready.", href: "/trust" },
          { id: "renewal-decision", label: "Renewal", status: "ready", owner: "Sponsor", buyerDecision: "Renew only above floor", evidence: "Stop rule is explicit.", href: "/renewal" }
        ]
      }
    });

    expect(brief.status).toBe("ready");
    expect(brief.headline).toBe("Buyer answers are ready for procurement review");
    expect(brief.summary).toMatch(/first scope/i);
    expect(brief.readyCount).toBe(3);
    expect(brief.questionTotal).toBe(3);
    expect(brief.primaryAction).toMatchObject({ label: "Open pilot contract", href: "#commercial-offer" });
  });

  test("turns contract answers into a buyer meeting brief with the first blocked agenda item", () => {
    const meeting = buildBuyerPilotMeetingBriefSnapshot({
      decisionBrief: {
        status: "blocked",
        primaryAction: { id: "primary", label: "Fix Price answer", href: "/commercial-offer", external: false },
        questions: [
          { id: "scope", label: "Scope", status: "ready", question: "What do we buy first?", answer: "A bounded release review pilot.", evidence: "Scope is approved.", href: "/work-order" },
          { id: "price", label: "Price", status: "blocked", question: "Why is the ask defensible?", answer: "The ask is not defensible yet.", evidence: "Proof acceptance is blocked.", href: "/commercial-offer" },
          { id: "expansion", label: "Expansion", status: "ready", question: "What prevents over-expansion?", answer: "A value floor and renewal gate.", evidence: "Renewal is ready.", href: "/renewal" }
        ]
      },
      pilotContract: {
        status: "blocked",
        buyer: "Platform release lead",
        pilotOffer: "Proof pilot",
        proofLine: "Proof audit is missing public links.",
        stopRule: "Stop if proof remains incomplete.",
        firstAction: { id: "primary", label: "Fix contract", href: "/commercial-offer", external: false },
        closeChecklist: [
          { id: "buyer-scope", label: "Scope", status: "ready", owner: "Buyer", buyerDecision: "Approve one workflow", evidence: "Workflow is concrete.", href: "/work-order" },
          { id: "commercial-boundary", label: "Commercial", status: "blocked", owner: "Sponsor", buyerDecision: "Hold pricing", evidence: "Value coverage is missing.", href: "/commercial-offer" },
          { id: "proof-acceptance", label: "Proof", status: "blocked", owner: "Proof owner", buyerDecision: "Wait for proof", evidence: "Public proof is incomplete.", href: "/proof-audit" },
          { id: "trust-boundary", label: "Trust", status: "ready", owner: "Security", buyerDecision: "Public-safe data only", evidence: "Trust controls are ready.", href: "/trust" },
          { id: "renewal-decision", label: "Renewal", status: "ready", owner: "Sponsor", buyerDecision: "Renew only above floor", evidence: "Stop rule is explicit.", href: "/renewal" }
        ]
      },
      operatingSnapshot: {
        status: "ready",
        headline: "This pilot has a 30-day operating path",
        firstAction: { id: "primary", label: "Open launch room", href: "/launch-room", external: false },
        commitments: [{ role: "Buyer sponsor", owner: "Sponsor", commitment: "Own the day-30 decision." }],
        expansionCriteria: ["Risk-adjusted monthly value stays above ¥600,000."],
        riskAdjustedMonthlyValueYen: 600000
      },
      trustSnapshot: {
        status: "ready",
        headline: "Buyer trust is ready for external review",
        firstAction: { id: "primary", label: "Open trust manifest", href: "/trust", external: false },
        dataBoundary: "Public or synthetic data only",
        trustScore: 100
      },
      publicDecisionPath: {
        status: "ready",
        headline: "This proof chain is ready to share with a buyer",
        buyerLine: "scope -> value -> proof",
        firstAction: { id: "primary", label: "Open buyer room", href: "/launch-room", external: false }
      }
    });

    expect(meeting.status).toBe("blocked");
    expect(meeting.headline).toBe("Approve first commitment must be fixed before the buyer call");
    expect(meeting.primaryAction).toMatchObject({ label: "Fix Approve first commitment", href: "/commercial-offer" });
    expect(meeting.readyCount).toBe(3);
    expect(meeting.agendaTotal).toBe(4);
    expect(meeting.agenda.map((item) => item.id)).toEqual(["scope", "price", "proof-trust", "day-30"]);
    expect(meeting.closeAsk).toMatch(/Keep this internal/i);
    expect(meeting.followUp.subject).toBe("Internal repair before buyer call: Approve first commitment");
    expect(meeting.followUp.instruction).toMatch(/Do not send externally/i);
    expect(meeting.followUp.mailtoHref).toMatch(/^mailto:\?subject=/);
    expect(meeting.followUp.calendar.title).toBe("Internal buyer-call repair: Approve first commitment");
    expect(meeting.followUp.calendar.filename).toBe("internal-buyer-call-repair.ics");
    expect(meeting.followUp.calendar.durationMinutes).toBe(30);
    expect(meeting.followUp.calendar.href).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(meeting.followUp.calendar.icsText).toContain("BEGIN:VCALENDAR");
    expect(meeting.followUp.calendar.icsText).toContain("SUMMARY:Internal buyer-call repair: Approve first commitment");
    expect(meeting.followUp.calendar.icsText).toContain("STATUS:TENTATIVE");
    expect(meeting.decisionReceipt.decision).toBe("repair-before-buyer");
    expect(meeting.decisionReceipt.receiptId).toMatch(/^buyer-pilot-meeting-repair-before-buyer-[a-f0-9]{8}$/);
    expect(meeting.decisionReceipt.checksumAlgorithm).toBe("fnv1a32");
    expect(meeting.decisionReceipt.owner).toBe("Sponsor");
    expect(meeting.decisionReceipt.items.map((item) => item.id)).toEqual(["close-ask", "scope", "price", "proof-trust", "day-30", "follow-up", "calendar-hold"]);
    expect(meeting.decisionReceipt.items.find((item) => item.id === "price")).toMatchObject({
      status: "blocked",
      action: "Repair approve first commitment before buyer sharing."
    });
    expect(meeting.decisionReceipt.recommendedOutcome).toBe("hold");
    expect(meeting.decisionReceipt.outcomeRoutes.map((route) => route.id)).toEqual(["approve", "hold", "reject"]);
    expect(meeting.decisionReceipt.outcomeRoutes.find((route) => route.id === "approve")).toMatchObject({
      status: "blocked",
      record: "Do not record external approval from this receipt."
    });
    expect(meeting.decisionReceipt.outcomeRoutes.find((route) => route.id === "hold")).toMatchObject({
      status: "ready",
      owner: "Sponsor"
    });
    expect(meeting.decisionReceipt.taskLedger.filename).toBe("buyer-pilot-repair-tasks.csv");
    expect(meeting.decisionReceipt.taskLedger.taskCount).toBe(7);
    expect(meeting.decisionReceipt.taskLedger.href).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(meeting.decisionReceipt.taskLedger.csvText).toContain("receiptId,decision,taskId,status,owner,title,action,evidence,sourceHref");
    expect(meeting.decisionReceipt.taskLedger.csvText).toContain("repair-before-buyer");
    expect(meeting.decisionReceipt.taskLedger.csvText).toContain("Repair approve first commitment before buyer sharing.");
    expect(meeting.decisionReceipt.exportMarkdown).toContain("# Buyer pilot meeting decision receipt");
    expect(meeting.decisionReceipt.exportMarkdown).toContain("## Outcome routing");
    expect(meeting.decisionReceipt.exportMarkdown).toContain("## Task ledger");
    expect(meeting.decisionReceipt.exportMarkdown).toContain("Replay rule");
    expect(meeting.copyText).toContain("Objection answers");
    expect(meeting.copyText).toContain("## Follow-up");
    expect(meeting.copyText).toContain("## Calendar hold");
    expect(meeting.copyText).toContain("## Decision receipt");
    expect(meeting.copyText).not.toMatch(/demo/i);
  });

  test("marks the buyer meeting brief ready when scope, price, proof, trust, and operating decision are clear", () => {
    const meeting = buildBuyerPilotMeetingBriefSnapshot({
      decisionBrief: {
        status: "ready",
        primaryAction: { id: "primary", label: "Open pilot contract", href: "#commercial-offer", external: false },
        questions: [
          { id: "scope", label: "Scope", status: "ready", question: "What do we buy first?", answer: "A bounded release review pilot.", evidence: "Scope is approved.", href: "/work-order" },
          { id: "price", label: "Price", status: "ready", question: "Why is the ask defensible?", answer: "The ask is covered by measured value.", evidence: "Proof acceptance is ready.", href: "/commercial-offer" },
          { id: "expansion", label: "Expansion", status: "ready", question: "What prevents over-expansion?", answer: "A value floor and renewal gate.", evidence: "Renewal is ready.", href: "/renewal" }
        ]
      },
      pilotContract: {
        status: "ready",
        buyer: "Platform release lead",
        pilotOffer: "Proof pilot",
        proofLine: "Proof audit, launch room, and contract terms are attached.",
        stopRule: "Stop if measured value falls below the floor.",
        firstAction: { id: "primary", label: "Open pilot contract", href: "#commercial-offer", external: false },
        closeChecklist: [
          { id: "buyer-scope", label: "Scope", status: "ready", owner: "Buyer", buyerDecision: "Approve one workflow", evidence: "Workflow is concrete.", href: "/work-order" },
          { id: "commercial-boundary", label: "Commercial", status: "ready", owner: "Sponsor", buyerDecision: "Approve first pilot", evidence: "Value coverage is ready.", href: "/commercial-offer" },
          { id: "proof-acceptance", label: "Proof", status: "ready", owner: "Proof owner", buyerDecision: "Accept proof", evidence: "Public proof is complete.", href: "/proof-audit" },
          { id: "trust-boundary", label: "Trust", status: "ready", owner: "Security", buyerDecision: "Public-safe data only", evidence: "Trust controls are ready.", href: "/trust" },
          { id: "renewal-decision", label: "Renewal", status: "ready", owner: "Sponsor", buyerDecision: "Renew only above floor", evidence: "Stop rule is explicit.", href: "/renewal" }
        ]
      },
      operatingSnapshot: {
        status: "ready",
        headline: "This pilot has a 30-day operating path",
        firstAction: { id: "primary", label: "Open launch room", href: "/launch-room", external: false },
        commitments: [{ role: "Buyer sponsor", owner: "Sponsor", commitment: "Own the day-30 decision." }],
        expansionCriteria: ["Risk-adjusted monthly value stays above ¥600,000."],
        riskAdjustedMonthlyValueYen: 600000
      },
      trustSnapshot: {
        status: "ready",
        headline: "Buyer trust is ready for external review",
        firstAction: { id: "primary", label: "Open trust manifest", href: "/trust", external: false },
        dataBoundary: "Public or synthetic data only",
        trustScore: 100
      },
      publicDecisionPath: {
        status: "ready",
        headline: "This proof chain is ready to share with a buyer",
        buyerLine: "scope -> value -> proof",
        firstAction: { id: "primary", label: "Open buyer room", href: "/launch-room", external: false }
      }
    });

    expect(meeting.status).toBe("ready");
    expect(meeting.headline).toBe("Buyer pilot meeting is ready to run");
    expect(meeting.meetingGoal).toMatch(/confirms scope, price, proof access/i);
    expect(meeting.readyCount).toBe(4);
    expect(meeting.closeAsk).toContain("Approve Proof pilot");
    expect(meeting.primaryAction).toMatchObject({ label: "Open pilot contract", href: "#commercial-offer" });
    expect(meeting.followUp.subject).toBe("Buyer pilot next step: Proof pilot");
    expect(meeting.followUp.instruction).toMatch(/Send after the buyer call/i);
    expect(meeting.followUp.body.join(" ")).toContain("Close ask: Approve Proof pilot");
    expect(decodeURIComponent(meeting.followUp.mailtoHref)).toContain("Buyer pilot next step: Proof pilot");
    expect(meeting.followUp.calendar.title).toBe("Buyer pilot approval call: Proof pilot");
    expect(meeting.followUp.calendar.filename).toBe("buyer-pilot-approval-call.ics");
    expect(meeting.followUp.calendar.icsText).toContain("SUMMARY:Buyer pilot approval call: Proof pilot");
    expect(meeting.followUp.calendar.icsText).toContain("DESCRIPTION:Send after the buyer call");
    expect(decodeURIComponent(meeting.followUp.calendar.href)).toContain("BEGIN:VCALENDAR");
    expect(meeting.decisionReceipt.decision).toBe("approve-pilot");
    expect(meeting.decisionReceipt.receiptId).toMatch(/^buyer-pilot-meeting-approve-pilot-[a-f0-9]{8}$/);
    expect(meeting.decisionReceipt.owner).toBe("Platform release lead");
    expect(meeting.decisionReceipt.summary).toContain("approve, hold, or reject");
    expect(meeting.decisionReceipt.items.every((item) => item.status === "ready")).toBe(true);
    expect(meeting.decisionReceipt.items.find((item) => item.id === "follow-up")?.evidence).toBe("Buyer pilot next step: Proof pilot");
    expect(meeting.decisionReceipt.recommendedOutcome).toBe("approve");
    expect(meeting.decisionReceipt.outcomeRoutes.find((route) => route.id === "approve")).toMatchObject({
      status: "ready",
      record: "Approve Proof pilot."
    });
    expect(meeting.decisionReceipt.outcomeRoutes.find((route) => route.id === "reject")?.nextAction).toBe("Revise the buyer workflow before reopening the ask.");
    expect(meeting.decisionReceipt.taskLedger.filename).toBe("buyer-pilot-approval-tasks.csv");
    expect(meeting.decisionReceipt.taskLedger.taskCount).toBe(7);
    expect(meeting.decisionReceipt.taskLedger.csvText).toContain("approve-pilot");
    expect(meeting.decisionReceipt.taskLedger.csvText).toContain("Record the buyer approve, hold, or reject decision against this ask.");
    expect(decodeURIComponent(meeting.decisionReceipt.taskLedger.href)).toContain("buyer-pilot-meeting-approve-pilot");
    expect(decodeURIComponent(meeting.decisionReceipt.href)).toContain("# Buyer pilot meeting decision receipt");
  });

  test("keeps the top buyer value tuner wired to real value and measured-run levers", () => {
    expect(BUYER_VALUE_TUNER_FIELDS.map((field) => field.key)).toEqual(["adoptionRatePercent", "cyclesPerMonth", "manualHoursPerCycle"]);
    expect(BUYER_MEASURED_RUN_TUNER_FIELDS.map((field) => field.key)).toEqual(["observedManualMinutes", "observedAssistedMinutes"]);

    for (const field of [...BUYER_VALUE_TUNER_FIELDS, ...BUYER_MEASURED_RUN_TUNER_FIELDS]) {
      expect(field.label).not.toMatch(/demo/i);
      expect(field.min).toBeLessThan(field.max);
      expect(field.step).toBeGreaterThan(0);
    }
  });

  test("turns value commitment into a first-screen sponsor ask", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });
    const sensitivity = buildBuyerValueSensitivity(scenario);
    const commitment = buildBuyerValueCommitment({ scenario, sensitivity });

    const ask = buildBuyerSponsorAskSnapshot({ commitment, valueReportHref: "/buyer-value" });

    expect(ask.status).toBe("ready");
    expect(ask.decision).toBe("send-to-sponsor");
    expect(ask.recommendedAskYen).toBeGreaterThan(0);
    expect(ask.recommendedAskYen).toBeLessThanOrEqual(scenario.pilotBudgetCeilingYen);
    expect(ask.firstAction).toMatchObject({ label: "Open value report", href: "/buyer-value", external: false });
    expect(ask.conditions.map((condition) => condition.id)).toEqual(["adoption-floor", "downside-payback", "evidence-confidence", "pilot-ask", "value-at-risk"]);
    expect(ask.redLines.map((redLine) => redLine.id)).toEqual(["adoption", "measured-savings", "proof"]);
    expect(ask.copyText).toBe(ask.exportMarkdown);
    expect(ask.exportMarkdown).toContain("## What must be true");
    expect(ask.exportMarkdown).toContain("## Red lines");
    expect(JSON.stringify(ask)).not.toMatch(/demo/i);
  });

  test("blocks the first-screen sponsor ask when value proof is unsafe", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const commitment = buildBuyerValueCommitment({ scenario, sensitivity: buildBuyerValueSensitivity(scenario) });

    const ask = buildBuyerSponsorAskSnapshot({ commitment, valueReportHref: "/buyer-value" });

    expect(ask.status).toBe("blocked");
    expect(ask.decision).toBe("hold-pitch");
    expect(ask.recommendedAskYen).toBe(0);
    expect(ask.firstAction.href).toBe("#buyer-value-simulator");
    expect(ask.firstAction.label).toMatch(/^Repair /);
    expect(ask.conditions.some((condition) => condition.status === "blocked")).toBe(true);
  });

  test("builds a 30-day operating snapshot from proof, value, and sponsor ask", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster", "security-sentinel"], 260);
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    });
    const buyerWorkOrder = {
      request: "Convert one release-readiness review into a public buyer proof packet with owners, acceptance checks, and a continue or revise decision.",
      targetUser: "Platform lead",
      successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
      currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
      dataSensitivity: "public" as const,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
    };
    const workflowReadiness: BuyerProofWorkflowReadiness = {
      decision: "pilot-ready",
      headline: "Workflow is concrete enough for sponsor review",
      nextAction: "Open the launch room for a continue, revise, or stop decision."
    };
    const measuredRun = {
      observedManualMinutes: 1680,
      observedAssistedMinutes: 560,
      participants: 4,
      acceptedTasks: 3,
      totalTasks: 3,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
      reviewerName: "Platform sponsor",
      notes: "Observed run completed with evidence attached."
    };
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "measured",
      actualMinutesSavedPerRun: 1120,
      acceptanceRatePercent: 100,
      measuredMonthlyHoursSaved: 93.3,
      measuredMonthlyLaborValueYen: 1120000,
      measuredMonthlyValueYen: 1240000,
      headline: "Measured release review is ready"
    };
    const lock: HomepageRouteLock = {
      status: "ready",
      verdict: "send",
      headline: "Ready to send",
      instruction: "All public proof gates are aligned.",
      operatorLine: "Buyer can inspect value, proof, and decision state.",
      score: 92,
      scoreLabel: "send-ready",
      primaryAction: { label: "Open launch room", href: "/launch-room", external: false },
      secondaryAction: { label: "Open value report", href: "/buyer-value", external: false },
      routeSteps: routeStepsFixture("ready", "send"),
      checks: [
        { id: "buyer-decision", label: "Buyer decision", value: "send", status: "ready", evidence: "Buyer decision is ready.", href: "/launch-room" },
        { id: "current-gap", label: "Current gap", value: "none", status: "ready", evidence: "No gap remains.", href: "#buyer-proof-command" },
        { id: "live-proof", label: "Live proof", value: "5/5", status: "ready", evidence: "Public proof is reachable.", href: "/buyer-proof-audit" },
        { id: "artifact-closure", label: "Artifact closure", value: "5/5 ready", status: "ready", evidence: "Artifacts are closed.", href: "#buyer-proof-command-title" }
      ],
      handoffPacket: handoffPacketFixture("ready", "send")
    };
    const proofPath = buildBuyerProofPathRows({
      workflowReadiness,
      buyerScenario,
      buyerWorkOrder,
      measuredRun,
      measuredRunSummary,
      lock,
      workflowIntakeHref: "#marketplace-workbench",
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      launchRoomHref: "/launch-room"
    });
    const snapshot = buildBuyerProofChainSnapshot({
      lock,
      workflowReadiness,
      buyerScenario,
      measuredRunSummary,
      workflowIntakeHref: "#marketplace-workbench",
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      currentAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      decisionReceiptHref: "/buyer-decision-receipt",
      launchRoomHref: "/launch-room"
    });
    const publicDecisionPath = buildBuyerPublicDecisionPath({ snapshot, proofPath });
    const sponsorAsk = buildBuyerSponsorAskSnapshot({
      commitment: buildBuyerValueCommitment({ scenario: buyerScenario, sensitivity: buildBuyerValueSensitivity(buyerScenario) }),
      valueReportHref: "/buyer-value"
    });

    const plan = buildBuyerOperatingPlanSnapshot({
      workflowReadiness,
      buyerScenario,
      buyerWorkOrder,
      measuredRun,
      measuredRunSummary,
      publicDecisionPath,
      sponsorAsk,
      workflowIntakeHref: "#marketplace-workbench",
      deliveryMemoHref: "/buyer-delivery-memo",
      launchRoomHref: "/launch-room"
    });

    expect(plan.readiness).toBe("ready-to-operate");
    expect(plan.status).toBe("ready");
    expect(plan.firstAction).toMatchObject({ label: "Open launch room", href: "/launch-room" });
    expect(plan.cadence.map((step) => step.id)).toEqual(["day-0-work-order", "week-1-measured-run", "week-2-proof-review", "day-30-decision"]);
    expect(plan.commitments.map((commitment) => commitment.role)).toEqual(["Buyer sponsor", "Pilot operator", "Proof owner"]);
    expect(plan.riskAdjustedMonthlyValueYen).toBe(Math.round(buyerScenario.monthlyGrossValueYen * 0.9));
    expect(plan.copyText).toBe(plan.exportMarkdown);
    expect(plan.exportMarkdown).toContain("## 30-day operating cadence");
    expect(plan.exportMarkdown).toContain("## Owner commitments");
    expect(plan.exportMarkdown).toContain("## Expansion criteria");
    expect(JSON.stringify(plan)).not.toMatch(/demo/i);
  });

  test("blocks the 30-day operating snapshot when the work order cannot run", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140);
    const buyerScenario = buildBuyerValueScenario(recommendation, {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const workflowReadiness: BuyerProofWorkflowReadiness = {
      decision: "do-not-share",
      headline: "Restricted workflow is not buyer-shareable",
      nextAction: "Redact restricted inputs or keep this packet internal."
    };
    const buyerWorkOrder = {
      request: "Review launch",
      targetUser: "",
      successMetric: "Launch readiness",
      currentBaseline: "Manual notes",
      dataSensitivity: "restricted" as const,
      evidenceUrl: ""
    };
    const measuredRun = {
      observedManualMinutes: 50,
      observedAssistedMinutes: 55,
      participants: 1,
      acceptedTasks: 0,
      totalTasks: 2,
      evidenceUrl: "",
      reviewerName: "",
      notes: ""
    };
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "needs-savings",
      actualMinutesSavedPerRun: 0,
      acceptanceRatePercent: 0,
      measuredMonthlyHoursSaved: 0,
      measuredMonthlyLaborValueYen: 0,
      measuredMonthlyValueYen: 0,
      headline: "Measured run needs savings"
    };
    const sponsorAsk = buildBuyerSponsorAskSnapshot({
      commitment: buildBuyerValueCommitment({ scenario: buyerScenario, sensitivity: buildBuyerValueSensitivity(buyerScenario) }),
      valueReportHref: "/buyer-value"
    });
    const publicDecisionPath = {
      status: "blocked" as const,
      decision: "hold-internal" as const,
      headline: "Hold public sharing until Workflow intake is fixed",
      buyerLine: "Buyer sponsor -> hold",
      firstAction: { id: "primary" as const, label: "Fix Workflow intake", href: "#marketplace-workbench", external: false },
      artifacts: [],
      guardrails: [],
      copyText: "hold",
      exportMarkdown: "hold"
    };

    const plan = buildBuyerOperatingPlanSnapshot({
      workflowReadiness,
      buyerScenario,
      buyerWorkOrder,
      measuredRun,
      measuredRunSummary,
      publicDecisionPath,
      sponsorAsk,
      workflowIntakeHref: "#marketplace-workbench",
      deliveryMemoHref: "/buyer-delivery-memo",
      launchRoomHref: "/launch-room"
    });

    expect(plan.readiness).toBe("blocked");
    expect(plan.status).toBe("blocked");
    expect(plan.firstAction).toMatchObject({ label: "Fix Confirm the real work order", href: "#marketplace-workbench" });
    expect(plan.riskAdjustedMonthlyValueYen).toBe(Math.round(buyerScenario.monthlyGrossValueYen * 0.35));
    expect(plan.cadence.some((step) => step.status === "blocked")).toBe(true);
  });

  test("builds a buyer trust snapshot from boundary, proof, measured run, and stop rules", () => {
    const measuredRun = {
      observedManualMinutes: 1680,
      observedAssistedMinutes: 560,
      participants: 4,
      acceptedTasks: 3,
      totalTasks: 3,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/pilot-run/receipt.json",
      reviewerName: "Platform sponsor",
      notes: "Observed run completed with evidence attached."
    };
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "measured",
      actualMinutesSavedPerRun: 1120,
      acceptanceRatePercent: 100,
      measuredMonthlyHoursSaved: 93.3,
      measuredMonthlyLaborValueYen: 1120000,
      measuredMonthlyValueYen: 1240000,
      headline: "Measured release review is ready"
    };
    const trust = buildBuyerTrustSnapshot({
      buyerWorkOrder: {
        request: "Convert one release-readiness review into a public buyer proof packet with owners, acceptance checks, and a continue or revise decision.",
        targetUser: "Platform lead",
        successMetric: "Minutes saved per review and proof gaps closed before sponsor review",
        currentBaseline: "Manual release notes, scattered screenshots, and unclear owner handoffs",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      measuredRun,
      measuredRunSummary,
      publicDecisionPath: {
        status: "ready",
        decision: "send-to-buyer",
        headline: "Public buyer path is ready",
        buyerLine: "Platform lead -> ¥1,560,000 / mo -> 1120m saved/run -> send",
        firstAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
        artifacts: [],
        guardrails: [],
        copyText: "ready",
        exportMarkdown: "ready"
      },
      sponsorAsk: {
        status: "ready",
        decision: "send-to-sponsor",
        headline: "Ask for the first buyer pilot with explicit stop lines",
        askLabel: "Pilot ask ceiling",
        recommendedAskYen: 420000,
        askInstruction: "Ask up to ¥420,000 and expand only after measured proof clears the red lines.",
        decisionOwner: "Executive sponsor",
        firstAction: { id: "primary" as const, label: "Open value report", href: "/buyer-value", external: false },
        conditions: [],
        redLines: [],
        nextProofMove: { id: "seal-proof", owner: "Cloud Run SRE", priority: "next", action: "Attach public launch evidence.", proof: "Buyer value report" },
        copyText: "ask",
        exportMarkdown: "ask"
      },
      operatingSnapshot: {
        readiness: "ready-to-operate",
        status: "ready",
        headline: "This pilot has a 30-day operating path",
        hardTruth: "The buyer can see the path.",
        buyer: "Platform lead",
        operatingMetric: "Minutes saved per review and proof gaps closed before sponsor review",
        expectedMonthlyValueYen: 1560000,
        riskAdjustedMonthlyValueYen: 1404000,
        firstAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
        cadence: [],
        commitments: [{ role: "Buyer sponsor", owner: "Executive sponsor", commitment: "Own the day-30 decision." }],
        expansionCriteria: ["No blocked public decision artifact remains open before expansion."],
        copyText: "plan",
        exportMarkdown: "plan"
      },
      workflowIntakeHref: "#marketplace-workbench",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    });

    expect(trust.readiness).toBe("trust-ready");
    expect(trust.status).toBe("ready");
    expect(trust.trustScore).toBe(100);
    expect(trust.firstAction).toMatchObject({ label: "Open trust manifest", href: "/buyer-trust-manifest" });
    expect(trust.controls.map((control) => control.id)).toEqual(["data-boundary", "public-proof", "measured-run", "sponsor-ask", "operating-owner", "stop-rules"]);
    expect(trust.questions).toHaveLength(4);
    expect(trust.copyText).toBe(trust.exportMarkdown);
    expect(trust.exportMarkdown).toContain("## Trust controls");
    expect(trust.exportMarkdown).toContain("## Buyer questions");
    expect(trust.exportMarkdown).toContain("## Commitments");
    expect(JSON.stringify(trust)).not.toMatch(/demo/i);
  });

  test("builds a publication window from live proof freshness and trust status", () => {
    const proofChain = {
      status: "ready" as const,
      verdict: "send" as const,
      headline: "Proof chain is ready",
      instruction: "Send with proof attached.",
      score: 100,
      scoreLabel: "ready",
      readyCount: 5,
      attentionCount: 0,
      blockedCount: 0,
      gateTotal: 5,
      primaryAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
      actions: [],
      gates: []
    };
    const publicDecisionPath = {
      status: "ready" as const,
      decision: "send-to-buyer" as const,
      headline: "Public buyer path is ready",
      buyerLine: "Platform lead -> send",
      firstAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
      artifacts: [],
      guardrails: [],
      copyText: "ready",
      exportMarkdown: "ready"
    };
    const trustSnapshot = {
      readiness: "trust-ready" as const,
      status: "ready" as const,
      trustScore: 100,
      headline: "Buyer trust is ready",
      hardTruth: "A buyer can inspect the chain.",
      dataBoundary: "Public data only",
      firstAction: { id: "primary" as const, label: "Open trust manifest", href: "/buyer-trust-manifest", external: false },
      controls: [],
      questions: [],
      commitments: [],
      copyText: "trust",
      exportMarkdown: "trust"
    };

    const window = buildBuyerPublicationWindowSnapshot({
      proofVerification: {
        checkedAt: "2026-06-20T00:00:00.000Z",
        verifiedCount: 5,
        totalCount: 5,
        score: 100,
        results: [
          { id: "targetUrl", label: "Deployed URL", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." },
          { id: "pilotEvidenceUrl", label: "Pilot receipt", status: "pass", httpStatus: 200, evidence: "HTTP 200.", action: "Keep attached." }
        ]
      },
      proofChain,
      publicDecisionPath,
      trustSnapshot,
      currentAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room",
      now: new Date("2026-06-20T08:00:00.000Z")
    });

    expect(window.status).toBe("ready");
    expect(window.headline).toMatch(/publication window/i);
    expect(window.timeboxLabel).toBe("16h proof window");
    expect(window.proofExpiresAt).toBe("2026-06-21T00:00:00.000Z");
    expect(window.manifestExpiresAt).toBe("2026-06-27T00:00:00.000Z");
    expect(window.buyerReviewDueAt).toBe("2026-06-23T00:00:00.000Z");
    expect(window.firstAction).toMatchObject({ label: "Open trust manifest", href: "/buyer-trust-manifest" });
    expect(window.tasks.map((task) => task.id)).toEqual(["live-proof-recheck", "manifest-regeneration", "buyer-review-checkpoint"]);
    expect(window.tasks.every((task) => task.status === "ready")).toBe(true);
    expect(window.exportMarkdown).toContain("## Recheck schedule");
    expect(JSON.stringify(window)).not.toMatch(/demo/i);
  });

  test("blocks the publication window when live proof has not run", () => {
    const proofChain = {
      status: "ready" as const,
      verdict: "send" as const,
      headline: "Proof chain is ready",
      instruction: "Send with proof attached.",
      score: 100,
      scoreLabel: "ready",
      readyCount: 5,
      attentionCount: 0,
      blockedCount: 0,
      gateTotal: 5,
      primaryAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
      actions: [],
      gates: []
    };
    const publicDecisionPath = {
      status: "ready" as const,
      decision: "send-to-buyer" as const,
      headline: "Public buyer path is ready",
      buyerLine: "Platform lead -> send",
      firstAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
      artifacts: [],
      guardrails: [],
      copyText: "ready",
      exportMarkdown: "ready"
    };
    const trustSnapshot = {
      readiness: "trust-ready" as const,
      status: "ready" as const,
      trustScore: 100,
      headline: "Buyer trust is ready",
      hardTruth: "A buyer can inspect the chain.",
      dataBoundary: "Public data only",
      firstAction: { id: "primary" as const, label: "Open trust manifest", href: "/buyer-trust-manifest", external: false },
      controls: [],
      questions: [],
      commitments: [],
      copyText: "trust",
      exportMarkdown: "trust"
    };

    const window = buildBuyerPublicationWindowSnapshot({
      proofVerification: null,
      proofChain,
      publicDecisionPath,
      trustSnapshot,
      currentAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room",
      now: new Date("2026-06-20T08:00:00.000Z")
    });

    expect(window.status).toBe("blocked");
    expect(window.generatedAt).toBe("not checked");
    expect(window.proofExpiresAt).toBe("not checked");
    expect(window.timeboxLabel).toBe("Live proof not checked");
    expect(window.firstAction).toMatchObject({ label: "Fix Live proof recheck", href: "/buyer-proof-audit" });
    expect(window.tasks.find((task) => task.id === "live-proof-recheck")).toMatchObject({
      status: "blocked",
      dueAt: "Run before sharing"
    });
  });

  test("blocks the buyer trust snapshot when restricted data and proof gaps remain", () => {
    const measuredRun = {
      observedManualMinutes: 50,
      observedAssistedMinutes: 55,
      participants: 1,
      acceptedTasks: 0,
      totalTasks: 2,
      evidenceUrl: "",
      reviewerName: "",
      notes: ""
    };
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "needs-savings",
      actualMinutesSavedPerRun: 0,
      acceptanceRatePercent: 0,
      measuredMonthlyHoursSaved: 0,
      measuredMonthlyLaborValueYen: 0,
      measuredMonthlyValueYen: 0,
      headline: "Measured run needs savings"
    };
    const trust = buildBuyerTrustSnapshot({
      buyerWorkOrder: {
        request: "Review launch",
        targetUser: "",
        successMetric: "Launch readiness",
        currentBaseline: "Manual notes",
        dataSensitivity: "restricted",
        evidenceUrl: ""
      },
      measuredRun,
      measuredRunSummary,
      publicDecisionPath: {
        status: "blocked",
        decision: "hold-internal",
        headline: "Hold public sharing until Workflow intake is fixed",
        buyerLine: "Buyer sponsor -> hold",
        firstAction: { id: "primary" as const, label: "Fix Workflow intake", href: "#marketplace-workbench", external: false },
        artifacts: [],
        guardrails: [],
        copyText: "hold",
        exportMarkdown: "hold"
      },
      sponsorAsk: {
        status: "blocked",
        decision: "hold-pitch",
        headline: "Hold the pitch and repair the value proof first",
        askLabel: "No budget ask",
        recommendedAskYen: 0,
        askInstruction: "Do not request budget until adoption, payback, and public proof are repaired.",
        decisionOwner: "A2A Market Broker",
        firstAction: { id: "primary" as const, label: "Repair Adoption floor", href: "#buyer-value-simulator", external: false },
        conditions: [],
        redLines: [],
        nextProofMove: { id: "repair-value", owner: "A2A Market Broker", priority: "now", action: "Repair value proof.", proof: "Buyer Value Simulator" },
        copyText: "hold",
        exportMarkdown: "hold"
      },
      operatingSnapshot: {
        readiness: "blocked",
        status: "blocked",
        headline: "Do not roll out until the operating blockers are fixed",
        hardTruth: "Operating blockers remain.",
        buyer: "Buyer sponsor",
        operatingMetric: "Launch readiness",
        expectedMonthlyValueYen: 0,
        riskAdjustedMonthlyValueYen: 0,
        firstAction: { id: "primary" as const, label: "Fix Confirm the real work order", href: "#marketplace-workbench", external: false },
        cadence: [],
        commitments: [],
        expansionCriteria: ["No blocked public decision artifact remains open before expansion."],
        copyText: "blocked",
        exportMarkdown: "blocked"
      },
      workflowIntakeHref: "#marketplace-workbench",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    });

    expect(trust.readiness).toBe("blocked");
    expect(trust.status).toBe("blocked");
    expect(trust.firstAction).toMatchObject({ label: "Fix Data boundary", href: "#marketplace-workbench" });
    expect(trust.controls.find((control) => control.id === "data-boundary")).toMatchObject({
      status: "blocked",
      evidence: "Restricted data blocked from external sharing"
    });
    expect(trust.controls.filter((control) => control.status === "blocked").length).toBeGreaterThanOrEqual(4);
  });

  test("builds a proof-backed commercial offer snapshot from buyer value, trust, and operating proof", () => {
    const offer = buildBuyerCommercialOfferSnapshot({
      buyerScenario: {
        readiness: "scales-now",
        monthlyGrossValueYen: 1560000,
        monthlyHoursSaved: 120,
        paybackDays: 8,
        hardTruth: "Proof can support a first buyer commitment."
      } as BuyerValueScenario,
      measuredRunSummary: {
        readiness: "measured",
        actualMinutesSavedPerRun: 1120,
        acceptanceRatePercent: 100,
        measuredMonthlyHoursSaved: 93.3,
        measuredMonthlyLaborValueYen: 1120000,
        measuredMonthlyValueYen: 1240000,
        headline: "Measured release review is ready"
      },
      publicDecisionPath: {
        status: "ready",
        decision: "send-to-buyer",
        headline: "Public buyer path is ready",
        buyerLine: "Platform lead -> ¥1,560,000 / mo -> 1120m saved/run -> send",
        firstAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
        artifacts: [],
        guardrails: [],
        copyText: "ready",
        exportMarkdown: "ready"
      },
      sponsorAsk: {
        status: "ready",
        decision: "send-to-sponsor",
        headline: "Ask for the first buyer pilot with explicit stop lines",
        askLabel: "Pilot ask ceiling",
        recommendedAskYen: 420000,
        askInstruction: "Ask up to ¥420,000 and expand only after measured proof clears the red lines.",
        decisionOwner: "Executive sponsor",
        firstAction: { id: "primary" as const, label: "Open value report", href: "/buyer-value", external: false },
        conditions: [],
        redLines: [],
        nextProofMove: { id: "seal-proof", owner: "Cloud Run SRE", priority: "next", action: "Attach public launch evidence.", proof: "Buyer value report" },
        copyText: "ask",
        exportMarkdown: "ask"
      },
      operatingSnapshot: {
        readiness: "ready-to-operate",
        status: "ready",
        headline: "This pilot has a 30-day operating path",
        hardTruth: "The buyer can see the path.",
        buyer: "Platform lead",
        operatingMetric: "Minutes saved per review and proof gaps closed before sponsor review",
        expectedMonthlyValueYen: 1560000,
        riskAdjustedMonthlyValueYen: 1404000,
        firstAction: { id: "primary" as const, label: "Open launch room", href: "/launch-room", external: false },
        cadence: [],
        commitments: [{ role: "Buyer sponsor", owner: "Executive sponsor", commitment: "Own the day-30 decision." }],
        expansionCriteria: ["Risk-adjusted monthly value stays above ¥936,000.", "Acceptance remains above 70%."],
        copyText: "plan",
        exportMarkdown: "plan"
      },
      trustSnapshot: {
        readiness: "trust-ready",
        status: "ready",
        trustScore: 100,
        headline: "Buyer trust is ready for external review",
        hardTruth: "Trust is ready.",
        dataBoundary: "Public or synthetic data only",
        firstAction: { id: "primary" as const, label: "Open trust manifest", href: "/buyer-trust-manifest", external: false },
        controls: [],
        questions: [],
        commitments: [],
        copyText: "trust",
        exportMarkdown: "trust"
      },
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    });

    expect(offer.readiness).toBe("offer-ready");
    expect(offer.status).toBe("ready");
    expect(offer.firstCommitmentYen).toBeGreaterThan(0);
    expect(offer.firstCommitmentYen).toBeLessThanOrEqual(420000);
    expect(offer.expectedMonthlyValueYen).toBe(1404000);
    expect(offer.valueCoveragePercent).toBeGreaterThan(250);
    expect(offer.paybackDays).toBeLessThanOrEqual(9);
    expect(offer.contractLine).toMatch(/14 days/);
    expect(offer.firstAction).toMatchObject({ label: "Open commercial offer", href: "#commercial-offer" });
    expect(offer.terms.map((term) => term.id)).toEqual(["scope", "term", "acceptance", "renewal"]);
    expect(offer.guardrails.map((guardrail) => guardrail.id)).toEqual(["budget-cap", "public-proof", "trust-gate", "operating-gate"]);
    expect(offer.guardrails.find((guardrail) => guardrail.id === "budget-cap")?.rule).toMatch(/first offer must stay under the sponsor ask/i);
    expect(offer.guardrails.find((guardrail) => guardrail.id === "operating-gate")?.rule).toMatch(/30-day owner path/i);
    expect(offer.buyerQuestions).toHaveLength(3);
    expect(offer.buyerQuestions.find((question) => question.question === "Why is this price defensible?")?.answer).toMatch(/covered by/i);
    expect(offer.buyerQuestions.find((question) => question.question === "What prevents over-expansion?")?.answer).toMatch(/day-30 renewal/i);
    expect(offer.copyText).toBe(offer.exportMarkdown);
    expect(offer.exportMarkdown).toContain("# Buyer commercial offer snapshot");
    expect(offer.exportMarkdown).toContain("## Offer terms");
    expect(offer.exportMarkdown).toContain("## Commercial guardrails");
    expect(offer.exportMarkdown).toContain("## Buyer questions");
    expect(JSON.stringify(offer)).not.toMatch(/demo/i);
  });

  test("blocks the commercial offer snapshot when pricing is detached from proof", () => {
    const offer = buildBuyerCommercialOfferSnapshot({
      buyerScenario: {
        readiness: "not-yet",
        monthlyGrossValueYen: 0,
        monthlyHoursSaved: 0,
        paybackDays: 999,
        hardTruth: "Value proof is missing."
      } as BuyerValueScenario,
      measuredRunSummary: {
        readiness: "needs-savings",
        actualMinutesSavedPerRun: 0,
        acceptanceRatePercent: 0,
        measuredMonthlyHoursSaved: 0,
        measuredMonthlyLaborValueYen: 0,
        measuredMonthlyValueYen: 0,
        headline: "Measured run needs savings"
      },
      publicDecisionPath: {
        status: "blocked",
        decision: "hold-internal",
        headline: "Hold public sharing until Workflow intake is fixed",
        buyerLine: "Buyer sponsor -> hold",
        firstAction: { id: "primary" as const, label: "Fix Workflow intake", href: "#marketplace-workbench", external: false },
        artifacts: [],
        guardrails: [],
        copyText: "hold",
        exportMarkdown: "hold"
      },
      sponsorAsk: {
        status: "blocked",
        decision: "hold-pitch",
        headline: "Hold the pitch and repair the value proof first",
        askLabel: "No budget ask",
        recommendedAskYen: 0,
        askInstruction: "Do not request budget until adoption, payback, and public proof are repaired.",
        decisionOwner: "A2A Market Broker",
        firstAction: { id: "primary" as const, label: "Repair Adoption floor", href: "#buyer-value-simulator", external: false },
        conditions: [],
        redLines: [],
        nextProofMove: { id: "repair-value", owner: "A2A Market Broker", priority: "now", action: "Repair value proof.", proof: "Buyer Value Simulator" },
        copyText: "hold",
        exportMarkdown: "hold"
      },
      operatingSnapshot: {
        readiness: "blocked",
        status: "blocked",
        headline: "Do not roll out until the operating blockers are fixed",
        hardTruth: "Operating blockers remain.",
        buyer: "Buyer sponsor",
        operatingMetric: "Launch readiness",
        expectedMonthlyValueYen: 0,
        riskAdjustedMonthlyValueYen: 0,
        firstAction: { id: "primary" as const, label: "Fix Confirm the real work order", href: "#marketplace-workbench", external: false },
        cadence: [],
        commitments: [],
        expansionCriteria: ["No blocked public decision artifact remains open before expansion."],
        copyText: "blocked",
        exportMarkdown: "blocked"
      },
      trustSnapshot: {
        readiness: "blocked",
        status: "blocked",
        trustScore: 18,
        headline: "Trust blocks external buyer rollout",
        hardTruth: "Trust blockers remain.",
        dataBoundary: "Restricted data blocked from external sharing",
        firstAction: { id: "primary" as const, label: "Fix Data boundary", href: "#marketplace-workbench", external: false },
        controls: [],
        questions: [],
        commitments: [],
        copyText: "blocked",
        exportMarkdown: "blocked"
      },
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      trustManifestHref: "/buyer-trust-manifest",
      launchRoomHref: "/launch-room"
    });

    expect(offer.readiness).toBe("blocked");
    expect(offer.status).toBe("blocked");
    expect(offer.firstCommitmentYen).toBe(0);
    expect(offer.valueCoveragePercent).toBe(0);
    expect(offer.firstAction).toMatchObject({ label: "Fix Budget cap", href: "/buyer-value" });
    expect(offer.recommendedTier).toBe("No external offer");
    expect(offer.contractLine).toMatch(/No external commercial offer/);
    expect(offer.paybackDays).toBe(999);
    expect(offer.guardrails.every((guardrail) => guardrail.status === "blocked")).toBe(true);
    expect(offer.buyerQuestions.find((question) => question.question === "Why is this price defensible?")?.answer).toMatch(/No price is shown/);
    expect(offer.exportMarkdown).toContain("First commitment: ¥0");
    expect(JSON.stringify(offer)).not.toMatch(/demo/i);
  });

  test("builds a buyer pilot contract from offer, proof, operations, and launch readiness", () => {
    const contract = buildBuyerPilotContractSnapshot({
      publicDecisionPath: {
        status: "ready",
        decision: "send-to-buyer",
        headline: "Public buyer path is ready",
        buyerLine: "Platform lead -> ¥1,560,000 / mo -> 1120m saved/run -> send",
        firstAction: { id: "primary", label: "Open launch room", href: "/launch-room?workspace=share-token", external: false },
        artifacts: [],
        guardrails: [],
        copyText: "ready",
        exportMarkdown: "ready"
      },
      sponsorAsk: {
        status: "ready",
        decision: "send-to-sponsor",
        headline: "Ask for the first buyer pilot with explicit stop lines",
        askLabel: "Pilot ask ceiling",
        recommendedAskYen: 420000,
        askInstruction: "Ask up to ¥420,000 and expand only after measured proof clears the red lines.",
        decisionOwner: "Executive sponsor",
        firstAction: { id: "primary", label: "Open value report", href: "/buyer-value?workspace=share-token", external: false },
        conditions: [],
        redLines: [],
        nextProofMove: { id: "seal-proof", owner: "Cloud Run SRE", priority: "next", action: "Attach public launch evidence.", proof: "Buyer value report and pilot receipt" },
        copyText: "ask",
        exportMarkdown: "ask"
      },
      operatingSnapshot: {
        readiness: "ready-to-operate",
        status: "ready",
        headline: "This pilot has a 30-day operating path",
        hardTruth: "The buyer can see the path.",
        buyer: "Platform lead",
        operatingMetric: "Minutes saved per review and proof gaps closed before sponsor review",
        expectedMonthlyValueYen: 1560000,
        riskAdjustedMonthlyValueYen: 1404000,
        firstAction: { id: "primary", label: "Open launch room", href: "/launch-room?workspace=share-token", external: false },
        cadence: [],
        commitments: [{ role: "Buyer sponsor", owner: "Executive sponsor", commitment: "Own the day-30 decision." }],
        expansionCriteria: ["Risk-adjusted monthly value stays above ¥936,000.", "No blocked public decision artifact remains open before expansion."],
        copyText: "plan",
        exportMarkdown: "plan"
      },
      trustSnapshot: {
        readiness: "trust-ready",
        status: "ready",
        trustScore: 100,
        headline: "Buyer trust is ready for external review",
        hardTruth: "Trust is ready.",
        dataBoundary: "Public or synthetic data only",
        firstAction: { id: "primary", label: "Open trust manifest", href: "/buyer-trust-manifest", external: false },
        controls: [],
        questions: [],
        commitments: [],
        copyText: "trust",
        exportMarkdown: "trust"
      },
      commercialOffer: {
        readiness: "offer-ready",
        status: "ready",
        headline: "The first commercial offer is ready",
        hardTruth: "A buyer can see the price.",
        buyer: "Platform lead",
        recommendedTier: "Proof pilot",
        firstCommitmentYen: 420000,
        expectedMonthlyValueYen: 1404000,
        valueCoveragePercent: 334,
        paybackDays: 9,
        contractLine: "Proof pilot: ¥420,000 for 14 days, with expansion tied to measured value and trust controls.",
        firstAction: { id: "primary", label: "Open commercial offer", href: "#commercial-offer", external: false },
        terms: [],
        guardrails: [],
        buyerQuestions: [],
        copyText: "offer",
        exportMarkdown: "offer"
      },
      activationSnapshot: {
        status: "ready",
        readiness: "buyer-ready",
        headline: "Monday pilot handoff is ready",
        hardTruth: "Ready.",
        buyer: "Platform lead",
        proofClosure: "10/10 artifacts sealed",
        currentOwner: "Sponsor",
        currentArtifact: "Start buyer pilot review",
        firstAction: { id: "primary", label: "Open launch room", href: "/launch-room?workspace=share-token", external: false },
        reviewAction: { id: "launch-room", label: "Review launch room", href: "/launch-room?workspace=share-token", external: false },
        steps: [],
        commitments: [],
        copyText: "activation",
        exportMarkdown: "activation"
      },
      globalLaunchSnapshot: {
        readiness: "global-ready",
        status: "ready",
        score: 91,
        headline: "This launch can stand in front of a global buyer",
        hardTruth: "Launch is ready.",
        targetMarket: "Platform lead",
        proofSummary: "5/5 public links, 2 accepted A2A trials",
        opsSummary: "88/100 production capability",
        firstAction: { id: "primary", label: "Open global audit", href: "/global-launch-audit?workspace=share-token", external: false },
        reviewAction: { id: "launch-room", label: "Review launch room", href: "/launch-room?workspace=share-token", external: false },
        dimensions: [],
        releaseLift: {
          targetScore: 86,
          scoreGap: 0,
          projectedScoreAfterFirstFix: 91,
          summary: "Global-ready threshold is met; keep proof fresh.",
          actions: [
            {
              id: "route-global-traffic",
              priority: "now",
              label: "Route global traffic to the launch room",
              status: "ready",
              scoreLift: 0,
              projectedScore: 91,
              proofRequired: "Keep public proof links reachable.",
              decisionImpact: "Moves from review to acquisition routing.",
              href: "#buyer-share-gate"
            }
          ]
        },
        proofLinks: [],
        copyText: "global",
        exportMarkdown: "global"
      },
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    expect(contract.readiness).toBe("contract-ready");
    expect(contract.status).toBe("ready");
    expect(contract.firstAction).toMatchObject({ label: "Open pilot contract", href: "#commercial-offer" });
    expect(contract.milestones.map((milestone) => milestone.id)).toEqual(["first-commitment", "sponsor-decision", "operating-path", "activation-owner", "public-launch-proof"]);
    expect(contract.closeChecklist.map((item) => item.id)).toEqual(["buyer-scope", "commercial-boundary", "proof-acceptance", "trust-boundary", "renewal-decision"]);
    expect(contract.closeChecklist.every((item) => item.status === "ready")).toBe(true);
    expect(contract.closeChecklist.find((item) => item.id === "commercial-boundary")).toMatchObject({
      owner: "Executive sponsor",
      buyerDecision: "Approve ¥420,000 first commitment; expansion waits for measured proof."
    });
    expect(contract.closeChecklist.find((item) => item.id === "proof-acceptance")?.evidence).toContain("88/100 production capability");
    expect(contract.buyerQuestions).toHaveLength(3);
    expect(contract.sendNote).toMatchObject({
      status: "ready",
      subject: "Pilot contract ready: Platform lead"
    });
    expect(contract.sendNote.instruction).toContain("launch room");
    expect(contract.sendNote.body.join(" ")).toContain("¥420,000");
    expect(contract.sendNote.body.join(" ")).toContain("5/5 buyer decisions ready");
    expect(contract.sendNote.attachments.map((attachment) => attachment.id)).toEqual([
      "pilot-contract",
      "launch-room",
      "proof-audit",
      "commercial-boundary",
      "trust-boundary"
    ]);
    expect(contract.sendNote.attachments.every((attachment) => attachment.status === "ready")).toBe(true);
    expect(contract.sendNote.copyText).toContain("Subject: Pilot contract ready: Platform lead");
    expect(contract.sendNote.copyText).toContain("Commercial boundary");
    expect(contract.sendNote.copyText).not.toContain("workspace=share-token");
    expect(contract.copyText).toBe(contract.exportMarkdown);
    expect(contract.exportMarkdown).toContain("# Buyer pilot contract");
    expect(contract.exportMarkdown).toContain("## Buyer send note");
    expect(contract.exportMarkdown).toContain("## Send attachments");
    expect(contract.exportMarkdown).toContain("## Contract milestones");
    expect(contract.exportMarkdown).toContain("## Buyer close checklist");
    expect(contract.exportMarkdown).toContain("Commercial boundary");
    expect(contract.exportMarkdown).toContain("## Buyer questions");
    expect(contract.exportMarkdown).toContain("## Stop rule");
    expect(contract.exportMarkdown).not.toContain("workspace=share-token");
    const html = renderToStaticMarkup(createElement(BuyerPilotSendNotePanel, { snapshot: contract, onCopyText: async () => true }));
    expect(html).toContain("Buyer send brief");
    expect(html).toContain("Pilot contract ready: Platform lead");
    expect(html).toContain("Sendable");
    expect(html).toContain("5/5");
    expect(html).toContain("attachments ready");
    expect(html).toContain("buyer-send-note.txt");
    expect(html).toContain("Send rule clear");
    expect(html).not.toMatch(/demo/i);
    expect(JSON.stringify(contract)).not.toMatch(/demo/i);
  });

  test("blocks the buyer pilot contract at the first unready contract milestone", () => {
    const contract = buildBuyerPilotContractSnapshot({
      publicDecisionPath: {
        status: "blocked",
        decision: "hold-internal",
        headline: "Hold public sharing",
        buyerLine: "Buyer sponsor -> hold",
        firstAction: { id: "primary", label: "Fix proof", href: "#launch-evidence-console", external: false },
        artifacts: [],
        guardrails: [],
        copyText: "hold",
        exportMarkdown: "hold"
      },
      sponsorAsk: {
        status: "blocked",
        decision: "hold-pitch",
        headline: "Hold the pitch",
        askLabel: "No budget ask",
        recommendedAskYen: 0,
        askInstruction: "Do not request budget until adoption, payback, and public proof are repaired.",
        decisionOwner: "A2A Market Broker",
        firstAction: { id: "primary", label: "Repair Adoption floor", href: "#buyer-value-simulator", external: false },
        conditions: [],
        redLines: [],
        nextProofMove: { id: "repair-value", owner: "A2A Market Broker", priority: "now", action: "Repair value proof.", proof: "Buyer Value Simulator" },
        copyText: "hold",
        exportMarkdown: "hold"
      },
      operatingSnapshot: {
        readiness: "blocked",
        status: "blocked",
        headline: "Do not roll out",
        hardTruth: "Operating blockers remain.",
        buyer: "Buyer sponsor",
        operatingMetric: "Launch readiness",
        expectedMonthlyValueYen: 0,
        riskAdjustedMonthlyValueYen: 0,
        firstAction: { id: "primary", label: "Fix work order", href: "#marketplace-workbench", external: false },
        cadence: [],
        commitments: [],
        expansionCriteria: ["No blocked public decision artifact remains open before expansion."],
        copyText: "blocked",
        exportMarkdown: "blocked"
      },
      trustSnapshot: {
        readiness: "blocked",
        status: "blocked",
        trustScore: 18,
        headline: "Trust blocks rollout",
        hardTruth: "Trust blockers remain.",
        dataBoundary: "Restricted data blocked from external sharing",
        firstAction: { id: "primary", label: "Fix Data boundary", href: "#marketplace-workbench", external: false },
        controls: [],
        questions: [],
        commitments: [],
        copyText: "blocked",
        exportMarkdown: "blocked"
      },
      commercialOffer: {
        readiness: "blocked",
        status: "blocked",
        headline: "Do not send pricing",
        hardTruth: "Proof is missing.",
        buyer: "Buyer sponsor",
        recommendedTier: "No external offer",
        firstCommitmentYen: 0,
        expectedMonthlyValueYen: 0,
        valueCoveragePercent: 0,
        paybackDays: 999,
        contractLine: "No external commercial offer until budget, proof, trust, and operating guardrails are repaired.",
        firstAction: { id: "primary", label: "Fix Budget cap", href: "/buyer-value?workspace=share-token", external: false },
        terms: [],
        guardrails: [],
        buyerQuestions: [],
        copyText: "blocked",
        exportMarkdown: "blocked"
      },
      activationSnapshot: {
        status: "blocked",
        readiness: "needs-value",
        headline: "Make the buyer value case credible first",
        hardTruth: "Blocked.",
        buyer: "Buyer sponsor",
        proofClosure: "2/10 artifacts sealed",
        currentOwner: "A2A Market Broker",
        currentArtifact: "Buyer value memo",
        firstAction: { id: "primary", label: "Fix Buyer value memo", href: "#buyer-value-simulator", external: false },
        reviewAction: { id: "launch-room", label: "Review launch room", href: "/launch-room?workspace=share-token", external: false },
        steps: [],
        commitments: [],
        copyText: "activation",
        exportMarkdown: "activation"
      },
      globalLaunchSnapshot: {
        readiness: "not-ready",
        status: "blocked",
        score: 38,
        headline: "Do not present this as globally launch-ready yet",
        hardTruth: "Proof blocks launch.",
        targetMarket: "Buyer sponsor",
        proofSummary: "0/5 public links, 0 accepted A2A trials",
        opsSummary: "41/100 production capability",
        firstAction: { id: "primary", label: "Fix Public product surface", href: "#launch-evidence-console", external: false },
        reviewAction: { id: "launch-room", label: "Review launch room", href: "/launch-room?workspace=share-token", external: false },
        dimensions: [],
        releaseLift: {
          targetScore: 86,
          scoreGap: 48,
          projectedScoreAfterFirstFix: 52,
          summary: "Public product surface is the first lift before global-ready.",
          actions: [
            {
              id: "lift-live-surface",
              priority: "now",
              label: "Public product surface",
              status: "blocked",
              scoreLift: 14,
              projectedScore: 52,
              proofRequired: "Attach public launch proof links.",
              decisionImpact: "Makes the launch inspectable by a new buyer.",
              href: "#launch-evidence-console"
            }
          ]
        },
        proofLinks: [],
        copyText: "global",
        exportMarkdown: "global"
      },
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    expect(contract.readiness).toBe("blocked");
    expect(contract.status).toBe("blocked");
    expect(contract.firstAction).toMatchObject({ label: "Fix First commitment", href: "/buyer-value?workspace=share-token" });
    expect(contract.hardTruth).toContain("A2A Market Broker must close First commitment");
    expect(contract.milestones.every((milestone) => milestone.status === "blocked")).toBe(true);
    expect(contract.closeChecklist.map((item) => `${item.id}:${item.status}`)).toEqual([
      "buyer-scope:blocked",
      "commercial-boundary:blocked",
      "proof-acceptance:blocked",
      "trust-boundary:blocked",
      "renewal-decision:blocked"
    ]);
    expect(contract.closeChecklist.find((item) => item.id === "commercial-boundary")?.buyerDecision).toBe("Hold price until value, proof, trust, and operating blockers close.");
    expect(contract.closeChecklist.find((item) => item.id === "trust-boundary")?.evidence).toContain("Trust score 18/100");
    expect(contract.sendNote).toMatchObject({
      status: "blocked",
      subject: "Draft only: Buyer sponsor pilot contract"
    });
    expect(contract.sendNote.instruction).toContain("Do not send to the buyer");
    expect(contract.sendNote.attachments.find((attachment) => attachment.id === "commercial-boundary")?.evidence).toBe(
      "Hold price until value, proof, trust, and operating blockers close."
    );
    expect(contract.sendNote.copyText).toContain("Hold price until value, proof, trust, and operating blockers close.");
    expect(contract.sendNote.copyText).not.toContain("workspace=share-token");
    expect(contract.exportMarkdown).toContain("First action: Fix First commitment (/buyer-value)");
    expect(contract.exportMarkdown).toContain("## Buyer send note");
    expect(contract.exportMarkdown).toContain("Draft only: Buyer sponsor pilot contract");
    expect(contract.exportMarkdown).toContain("## Send attachments");
    expect(contract.exportMarkdown).toContain("## Buyer close checklist");
    expect(contract.exportMarkdown).toContain("Hold price until value, proof, trust, and operating blockers close.");
    expect(contract.exportMarkdown).not.toContain("workspace=share-token");
    const html = renderToStaticMarkup(createElement(BuyerPilotSendNotePanel, { snapshot: contract, onCopyText: async () => true }));
    expect(html).toContain("Buyer send brief");
    expect(html).toContain("Draft only: Buyer sponsor pilot contract");
    expect(html).toContain("Internal draft");
    expect(html).toContain("0/5");
    expect(html).toContain("attachments need review");
    expect(html).toContain("Open blocker");
    expect(html).toContain("First commitment");
    expect(html).not.toMatch(/demo/i);
    expect(JSON.stringify(contract)).not.toMatch(/demo/i);
  });

  test("builds a first-screen activation command when the launch room is ready", () => {
    const snapshot = buildBuyerActivationSnapshot({
      launchRoomHref: "https://launch.example/launch-room?workspace=share-token",
      command: {
        readiness: "buyer-ready",
        launchScore: 96,
        headline: "Share the launch room with a buyer",
        targetBuyer: "Platform lead",
        primaryMetric: "¥900,000 modeled value",
        proofClosure: "10/10 artifacts sealed",
        pathLabel: "Ready for external review",
        nextGap: {
          label: "Buyer delivery memo",
          owner: "Sponsor owner",
          action: "Send the packet.",
          href: "https://launch.example/buyer-delivery-memo",
          editHref: "#marketplace-workbench"
        },
        gapQueue: [
          {
            id: "closure-ready",
            artifactId: "sponsor-review",
            label: "Start buyer pilot review",
            status: "ready",
            owner: "Sponsor",
            action: "Send the launch room.",
            acceptanceSignal: "Sponsor can approve, revise, or stop.",
            proofToAttach: "No missing proof remains.",
            href: "https://launch.example/sponsor-review?workspace=share-token",
            editHref: "https://launch.example/?workspace=share-token#sponsor-review-room",
            isCurrent: true
          }
        ],
        steps: []
      }
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.headline).toBe("Monday pilot handoff is ready");
    expect(snapshot.firstAction).toMatchObject({ label: "Open launch room", href: "https://launch.example/launch-room?workspace=share-token" });
    expect(snapshot.reviewAction).toMatchObject({ label: "Review launch room" });
    expect(snapshot.currentOwner).toBe("Sponsor");
    expect(snapshot.currentArtifact).toBe("Start buyer pilot review");
    expect(snapshot.steps).toHaveLength(1);
    expect(snapshot.steps[0]).toMatchObject({ status: "ready", isCurrent: true });
    expect(snapshot.copyText).toBe(snapshot.exportMarkdown);
    expect(snapshot.exportMarkdown).toContain("# Buyer activation command");
    expect(snapshot.exportMarkdown).toContain("## Activation steps");
    expect(snapshot.exportMarkdown).toContain("## Handoff commitments");
    expect(snapshot.exportMarkdown).toContain("First action: Open launch room (https://launch.example/launch-room)");
    expect(snapshot.exportMarkdown).not.toContain("workspace=share-token");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("points the activation command at the current owner when handoff proof is blocked", () => {
    const snapshot = buildBuyerActivationSnapshot({
      launchRoomHref: "/launch-room?workspace=share-token",
      command: {
        readiness: "needs-value",
        launchScore: 42,
        headline: "Make the buyer value case credible first",
        targetBuyer: "Platform lead",
        primaryMetric: "¥0 modeled value",
        proofClosure: "2/10 artifacts sealed",
        pathLabel: "Value case is the first blocker",
        nextGap: {
          label: "Buyer value memo",
          owner: "A2A Market Broker",
          action: "Repair the value assumptions.",
          href: "/buyer-value?workspace=share-token",
          editHref: "#buyer-value-simulator"
        },
        gapQueue: [
          {
            id: "closure-1-buyer-value",
            artifactId: "buyer-value",
            label: "Buyer value memo",
            status: "blocked",
            owner: "A2A Market Broker",
            action: "Rebuild the value case with buyer-safe assumptions.",
            acceptanceSignal: "Buyer Value Report has a positive payback and sponsor-readable assumptions.",
            proofToAttach: "Buyer value report with assumptions and sensitivity.",
            href: "/buyer-value?workspace=share-token",
            editHref: "#buyer-value-simulator",
            isCurrent: true
          },
          {
            id: "closure-2-work-order",
            artifactId: "work-order-brief",
            label: "Work order brief",
            status: "attention",
            owner: "Pilot facilitator",
            action: "Name the bounded workflow.",
            acceptanceSignal: "Work order names owner, acceptance check, and stop rule.",
            proofToAttach: "Public work order brief.",
            href: "/work-order-brief?workspace=share-token",
            editHref: "#buyer-work-order-studio",
            isCurrent: false
          }
        ],
        steps: []
      }
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.firstAction).toMatchObject({ label: "Fix Buyer value memo", href: "#buyer-value-simulator" });
    expect(snapshot.currentOwner).toBe("A2A Market Broker");
    expect(snapshot.currentArtifact).toBe("Buyer value memo");
    expect(snapshot.steps.map((step) => step.status)).toEqual(["blocked", "attention"]);
    expect(snapshot.hardTruth).toContain("A2A Market Broker must close Buyer value memo");
    expect(snapshot.exportMarkdown).toContain("First action: Fix Buyer value memo (#buyer-value-simulator)");
    expect(snapshot.exportMarkdown).not.toContain("workspace=share-token");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("builds a first-screen global launch readiness snapshot from the public audit", () => {
    const audit: GlobalLaunchAudit = {
      readiness: "global-ready",
      score: 91,
      headline: "This launch can stand in front of a global buyer",
      hardTruth: "A buyer can inspect value, evidence, and operating proof without a private explanation.",
      targetMarket: "Platform lead",
      launchNarrative: "A public buyer can inspect the proof path.",
      monthlyValue: "1,200,000 yen",
      measuredValue: "980,000 yen",
      proofSummary: "5/5 public links, 2 accepted A2A trials",
      opsSummary: "88/100 production capability",
      dimensions: [
        { id: "buyer-value", label: "Buyer value clarity", status: "pass", score: 94, evidence: "Value is quantified.", action: "Keep assumptions attached.", href: "#buyer-value-simulator" },
        { id: "measured-outcome", label: "Measured buyer outcome", status: "pass", score: 91, evidence: "Pilot receipt shows accepted measured value.", action: "Keep the receipt attached.", href: "#pilot-run-receipt" },
        { id: "live-surface", label: "Public product surface", status: "pass", score: 92, evidence: "Public product and story are attached.", action: "Keep the public links current.", href: "#launch-evidence-console" }
      ],
      actions: [
        {
          id: "send-launch-room",
          priority: "now",
          owner: "Founder / PM",
          label: "Send the global launch room",
          action: "Ask for a pilot approval decision.",
          href: "#buyer-share-gate"
        }
      ],
      liftPlan: globalLaunchLiftPlanFixture(91),
      proofLinks: [
        { id: "targetUrl", label: "Live product", value: "https://service.example/app", status: "pass", href: "#launch-evidence-console" },
        { id: "videoUrl", label: "Walkthrough video", value: "https://video.example/walkthrough", status: "pass", href: "#launch-evidence-console" }
      ],
      exportMarkdown: "# Global launch audit"
    };

    const snapshot = buildBuyerGlobalLaunchSnapshot({
      audit,
      publicAuditHref: "/global-launch-audit?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.firstAction).toMatchObject({ label: "Open global audit", href: "/global-launch-audit?workspace=share-token" });
    expect(snapshot.reviewAction).toMatchObject({ label: "Review launch room" });
    expect(snapshot.dimensions.map((dimension) => dimension.status)).toEqual(["ready", "ready", "ready"]);
    expect(snapshot.releaseLift).toMatchObject({
      targetScore: 86,
      scoreGap: 0,
      projectedScoreAfterFirstFix: 91
    });
    expect(snapshot.releaseLift.actions[0]).toMatchObject({
      id: "route-global-traffic",
      status: "ready",
      label: "Route global traffic to the launch room",
      projectedScore: 91
    });
    expect(snapshot.proofLinks.find((link) => link.id === "videoUrl")).toMatchObject({ label: "Walkthrough video", status: "ready" });
    expect(snapshot.copyText).toBe(snapshot.exportMarkdown);
    expect(snapshot.exportMarkdown).toContain("# Global launch readiness");
    expect(snapshot.exportMarkdown).toContain("## Global readiness dimensions");
    expect(snapshot.exportMarkdown).toContain("## Release lift");
    expect(snapshot.exportMarkdown).toContain("[ready/now] Route global traffic to the launch room");
    expect(snapshot.exportMarkdown).toContain("## Public proof links");
    expect(snapshot.exportMarkdown).toContain("First action: Open global audit (/global-launch-audit)");
    expect(snapshot.exportMarkdown).not.toContain("workspace=share-token");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("points the global launch readiness snapshot at the first public blocker", () => {
    const audit: GlobalLaunchAudit = {
      readiness: "private-beta",
      score: 58,
      headline: "Keep this in private beta until proof gets stronger",
      hardTruth: "Public product surface blocks the global launch story.",
      targetMarket: "Platform lead",
      launchNarrative: "The public story still needs reachable launch proof.",
      monthlyValue: "420,000 yen",
      measuredValue: "0 yen",
      proofSummary: "1/5 public links, 0 accepted A2A trials",
      opsSummary: "63/100 production capability",
      dimensions: [
        {
          id: "live-surface",
          label: "Public product surface",
          status: "block",
          score: 22,
          evidence: "Only one public proof link is attached.",
          action: "Attach the deployed URL, public story, and walkthrough video.",
          href: "#launch-evidence-console"
        },
        { id: "production-ops", label: "Production operations", status: "watch", score: 63, evidence: "Ops coverage needs review.", action: "Pick stronger deploy and monitoring agents.", href: "#marketplace-workbench" }
      ],
      actions: [
        {
          id: "fix-live-surface",
          priority: "now",
          owner: "Product owner",
          label: "Public product surface",
          action: "Attach the deployed URL, public story, and walkthrough video.",
          href: "#launch-evidence-console"
        }
      ],
      liftPlan: globalLaunchLiftPlanFixture(58, true),
      proofLinks: [
        { id: "targetUrl", label: "Live product", value: "", status: "block", href: "#launch-evidence-console" },
        { id: "videoUrl", label: "Walkthrough video", value: "", status: "block", href: "#launch-evidence-console" }
      ],
      exportMarkdown: "# Global launch audit"
    };

    const snapshot = buildBuyerGlobalLaunchSnapshot({
      audit,
      publicAuditHref: "/global-launch-audit?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.firstAction).toMatchObject({ label: "Fix Public product surface", href: "#launch-evidence-console" });
    expect(snapshot.dimensions.map((dimension) => dimension.status)).toEqual(["blocked", "attention"]);
    expect(snapshot.releaseLift).toMatchObject({
      scoreGap: 28,
      projectedScoreAfterFirstFix: 72
    });
    expect(snapshot.releaseLift.actions[0]).toMatchObject({
      id: "lift-live-surface",
      status: "blocked",
      label: "Public product surface",
      scoreLift: 14,
      projectedScore: 72
    });
    expect(snapshot.proofLinks.every((link) => link.status === "blocked")).toBe(true);
    expect(snapshot.exportMarkdown).toContain("First action: Fix Public product surface (#launch-evidence-console)");
    expect(snapshot.exportMarkdown).toContain("Projected after first fix: 72/100");
    expect(snapshot.exportMarkdown).toContain("Walkthrough video: missing");
    expect(snapshot.exportMarkdown).not.toContain("workspace=share-token");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("turns ready global launch proof into a first-screen publishability verdict", () => {
    const audit: GlobalLaunchAudit = {
      readiness: "global-ready",
      score: 91,
      headline: "This launch can stand in front of a global buyer",
      hardTruth: "A buyer can inspect value, evidence, and operating proof without a private explanation.",
      targetMarket: "Platform lead",
      launchNarrative: "A public buyer can inspect the proof path.",
      monthlyValue: "1,200,000 yen",
      measuredValue: "980,000 yen",
      proofSummary: "5/5 public links, 2 accepted A2A trials",
      opsSummary: "88/100 production capability",
      dimensions: [
        { id: "buyer-value", label: "Buyer value clarity", status: "pass", score: 94, evidence: "Value is quantified.", action: "Keep assumptions attached.", href: "#buyer-value-simulator" },
        { id: "measured-outcome", label: "Measured buyer outcome", status: "pass", score: 91, evidence: "Pilot receipt shows accepted measured value.", action: "Keep the receipt attached.", href: "#pilot-run-receipt" },
        { id: "live-surface", label: "Public product surface", status: "pass", score: 92, evidence: "Public product and story are attached.", action: "Keep the public links current.", href: "#launch-evidence-console" }
      ],
      actions: [],
      liftPlan: globalLaunchLiftPlanFixture(91),
      proofLinks: [],
      exportMarkdown: "# Global launch audit"
    };
    const globalLaunch = buildBuyerGlobalLaunchSnapshot({
      audit,
      publicAuditHref: "/global-launch-audit?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    const snapshot = buildHomepagePublishabilitySnapshot({
      globalLaunch,
      publishabilityHref: "/global-publishability?workspace=share-token"
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.decision).toBe("publish-ready");
    expect(snapshot.primaryAction).toMatchObject({ label: "Open publishability report", href: "/global-publishability?workspace=share-token" });
    expect(snapshot.reportAction).toMatchObject({ label: "Open publishability report", href: "/global-publishability?workspace=share-token" });
    expect(snapshot.workflowAction).toMatchObject({ label: "Paste workflow", href: "#quick-workflow-intake" });
    expect(snapshot.reviewerCover).toMatchObject({
      status: "ready",
      label: "Review cover",
      headline: "10-minute review cover is ready",
      href: "/global-publishability?workspace=share-token"
    });
    expect(snapshot.readyCount).toBe(3);
    expect(snapshot.blockedCount).toBe(0);
    expect(snapshot.gateTotal).toBe(3);
    expect(snapshot.gates.map((gate) => gate.id)).toEqual(["buyer-value", "measured-outcome", "live-surface"]);
    expect(snapshot.valueRoute.map((step) => [step.id, step.status])).toEqual([
      ["buyer-value", "ready"],
      ["measured-proof", "ready"],
      ["public-proof", "ready"],
      ["decision-path", "ready"]
    ]);
    expect(snapshot.valueRoute.find((step) => step.id === "measured-proof")).toMatchObject({
      title: "91/100 Measured buyer outcome",
      evidence: "Pilot receipt shows accepted measured value.",
      href: "#pilot-run-receipt"
    });
    expect(snapshot.publicClaimLedger.map((claim) => [claim.id, claim.status])).toEqual([
      ["value-claim", "ready"],
      ["outcome-claim", "ready"],
      ["proof-claim", "ready"],
      ["operating-claim", "ready"]
    ]);
    expect(snapshot.publicClaimLedger.find((claim) => claim.id === "proof-claim")).toMatchObject({
      label: "Proof claim",
      claim: "The public proof path is inspectable.",
      buyerQuestion: "Can I verify it myself?",
      href: "#launch-evidence-console"
    });
    expect(snapshot.releaseLift.actions[0]).toMatchObject({
      status: "ready",
      label: "Route global traffic to the launch room",
      projectedScore: 91
    });
    expect(snapshot.copyText).toBe(snapshot.exportMarkdown);
    expect(snapshot.exportMarkdown).toContain("# Public release verdict");
    expect(snapshot.exportMarkdown).toContain("Report: /global-publishability?workspace=share-token");
    expect(snapshot.exportMarkdown).toContain("Workflow intake: Paste workflow (#quick-workflow-intake)");
    expect(snapshot.exportMarkdown).toContain("Review cover: Review cover (/global-publishability)");
    expect(snapshot.exportMarkdown).toContain("Reviewer protocol: 10-minute review cover is ready.");
    expect(snapshot.exportMarkdown).toContain("First action: Open publishability report (/global-publishability)");
    expect(snapshot.exportMarkdown).toContain("## Buyer value route");
    expect(snapshot.exportMarkdown).toContain("[ready] Measured proof: 91/100 Measured buyer outcome");
    expect(snapshot.exportMarkdown).toContain("## Release lift");
    expect(snapshot.exportMarkdown).toContain("[ready/now] Route global traffic to the launch room");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("keeps first-screen publishability blocked on the first global launch blocker", () => {
    const audit: GlobalLaunchAudit = {
      readiness: "private-beta",
      score: 58,
      headline: "Keep this in private beta until proof gets stronger",
      hardTruth: "Public product surface blocks the global launch story.",
      targetMarket: "Platform lead",
      launchNarrative: "The public story still needs reachable launch proof.",
      monthlyValue: "420,000 yen",
      measuredValue: "0 yen",
      proofSummary: "1/5 public links, 0 accepted A2A trials",
      opsSummary: "63/100 production capability",
      dimensions: [
        {
          id: "live-surface",
          label: "Public product surface",
          status: "block",
          score: 22,
          evidence: "Only one public proof link is attached.",
          action: "Attach the deployed URL, public story, and walkthrough video.",
          href: "#launch-evidence-console"
        },
        { id: "production-ops", label: "Production operations", status: "watch", score: 63, evidence: "Ops coverage needs review.", action: "Pick stronger deploy and monitoring agents.", href: "#marketplace-workbench" }
      ],
      actions: [
        {
          id: "fix-live-surface",
          priority: "now",
          owner: "Product owner",
          label: "Public product surface",
          action: "Attach the deployed URL, public story, and walkthrough video.",
          href: "#launch-evidence-console"
        }
      ],
      liftPlan: globalLaunchLiftPlanFixture(58, true),
      proofLinks: [],
      exportMarkdown: "# Global launch audit"
    };
    const globalLaunch = buildBuyerGlobalLaunchSnapshot({
      audit,
      publicAuditHref: "/global-launch-audit?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    const snapshot = buildHomepagePublishabilitySnapshot({
      globalLaunch,
      publishabilityHref: "/global-publishability?workspace=share-token"
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.decision).toBe("do-not-publish");
    expect(snapshot.primaryAction).toMatchObject({ label: "Fix Public product surface", href: "#launch-evidence-console" });
    expect(snapshot.reportAction).toMatchObject({ label: "Open publishability report", href: "/global-publishability?workspace=share-token" });
    expect(snapshot.workflowAction).toMatchObject({ label: "Paste workflow", href: "#quick-workflow-intake" });
    expect(snapshot.reviewerCover).toMatchObject({
      status: "blocked",
      label: "No-send cover",
      headline: "Open the no-send cover before sharing",
      href: "/global-publishability?workspace=share-token"
    });
    expect(snapshot.readyCount).toBe(0);
    expect(snapshot.blockedCount).toBe(1);
    expect(snapshot.gateTotal).toBe(2);
    expect(snapshot.gates[0]).toMatchObject({ id: "live-surface", status: "blocked", href: "#launch-evidence-console" });
    expect(snapshot.valueRoute.map((step) => [step.id, step.status])).toEqual([
      ["buyer-value", "blocked"],
      ["measured-proof", "blocked"],
      ["public-proof", "blocked"],
      ["decision-path", "blocked"]
    ]);
    expect(snapshot.valueRoute.find((step) => step.id === "public-proof")).toMatchObject({
      title: "22/100 Public product surface",
      evidence: "Only one public proof link is attached.",
      href: "#launch-evidence-console"
    });
    expect(snapshot.publicClaimLedger.map((claim) => [claim.id, claim.status])).toEqual([
      ["value-claim", "blocked"],
      ["outcome-claim", "blocked"],
      ["proof-claim", "blocked"],
      ["operating-claim", "attention"]
    ]);
    expect(snapshot.publicClaimLedger.find((claim) => claim.id === "value-claim")).toMatchObject({
      claim: "Economic value is defensible.",
      buyerQuestion: "Why spend time now?",
      href: "#buyer-value-simulator"
    });
    expect(snapshot.releaseLift).toMatchObject({
      scoreGap: 28,
      projectedScoreAfterFirstFix: 72
    });
    expect(snapshot.releaseLift.actions[0]).toMatchObject({
      status: "blocked",
      label: "Public product surface",
      scoreLift: 14,
      projectedScore: 72,
      proofRequired: "Attach public launch proof links."
    });
    expect(snapshot.exportMarkdown).toContain("Decision: do-not-publish");
    expect(snapshot.exportMarkdown).toContain("First action: Fix Public product surface (#launch-evidence-console)");
    expect(snapshot.exportMarkdown).toContain("Report: /global-publishability?workspace=share-token");
    expect(snapshot.exportMarkdown).toContain("Workflow intake: Paste workflow (#quick-workflow-intake)");
    expect(snapshot.exportMarkdown).toContain("Review cover: No-send cover (/global-publishability)");
    expect(snapshot.exportMarkdown).toContain("Reviewer protocol: Open the no-send cover before sharing.");
    expect(snapshot.exportMarkdown).toContain("## Release lift");
    expect(snapshot.exportMarkdown).toContain("[blocked/now] Public product surface: +14 to 72/100");
    expect(snapshot.exportMarkdown).toContain("[blocked] Public proof: 22/100 Public product surface");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("projects the buyer outcome brief into an early homepage artifact preview", () => {
    const snapshot = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.decision).toBe("send-to-buyer");
    expect(snapshot.headline).toBe("A buyer can understand the value and proof from one page");
    expect(snapshot.buyer).toBe("Platform release lead");
    expect(snapshot.score).toBe(91);
    expect(snapshot.readyCount).toBe(4);
    expect(snapshot.blockedCount).toBe(0);
    expect(snapshot.primaryAction).toMatchObject({ label: "Open buyer brief", href: "/buyer-outcome-brief?workspace=share-token", external: false });
    expect(snapshot.workflowAction).toMatchObject({ label: "Paste workflow", href: "#quick-workflow-intake", external: false });
    expect(snapshot.launchRoomAction).toMatchObject({ label: "Open launch room", href: "/launch-room?workspace=share-token", external: false });
    expect(snapshot.packet).toMatchObject({
      status: "ready",
      headline: "One workflow note becomes a buyer packet",
      readyCount: 4,
      itemCount: 4,
      receipt: {
        checksumAlgorithm: "fnv1a32",
        verificationApiPath: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
        verification: {
          status: "verified"
        },
        payload: {
          receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
          source: "homepage-outcome-artifact",
          buyer: "Platform release lead",
          decision: "send-to-buyer"
        }
      }
    });
    expect(snapshot.packet.receipt.receiptId).toMatch(/^homepage-outcome-ready-[a-f0-9]{8}$/);
    expect(snapshot.packet.receipt.checksum).toMatch(/^[a-f0-9]{8}$/);
    expect(snapshot.packet.receipt.verificationRequestJson).toContain(`"checksum": "${snapshot.packet.receipt.checksum}"`);
    expect(snapshot.packet.receipt.verificationRequestHref).toContain("data:application/json");
    expect(snapshot.packet.items.map((item) => item.id)).toEqual(["buyer-one-pager", "value-proof", "proof-gate", "decision-handoff"]);
    expect(snapshot.packet.items.find((item) => item.id === "decision-handoff")).toMatchObject({
      status: "ready",
      actionLabel: "Open decision room",
      href: "/launch-room?workspace=share-token"
    });
    expect(snapshot.metrics.map((metric) => [metric.id, metric.status])).toEqual([
      ["modeled-value", "ready"],
      ["measured-value", "ready"],
      ["live-proof", "ready"],
      ["buyer-decision", "ready"]
    ]);
    expect(snapshot.exportMarkdown).toContain("# Buyer outcome artifact");
    expect(snapshot.exportMarkdown).toContain("Ready metrics: 4/4");
    expect(snapshot.exportMarkdown).toContain("## What the user gets");
    expect(snapshot.exportMarkdown).toContain("One workflow note becomes a buyer packet");
    expect(snapshot.exportMarkdown).toContain(`Receipt: ${snapshot.packet.receipt.receiptId}`);
    expect(snapshot.exportMarkdown).toContain(`Checksum: fnv1a32:${snapshot.packet.receipt.checksum}`);
    expect(snapshot.exportMarkdown).toContain(`API verification: POST ${HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH}`);
    expect(snapshot.exportMarkdown).toContain("[ready] Buyer one-pager");
    expect(snapshot.exportMarkdown).toContain("First action: Open buyer brief (/buyer-outcome-brief)");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
    const html = renderToStaticMarkup(createElement(HomepageOutcomeArtifactPanel, { snapshot, onCopyText: async () => true }));
    expect(html).toContain("What the user gets");
    expect(html).toContain("One workflow note becomes a buyer packet");
    expect(html).toContain("Packet receipt");
    expect(html).toContain("Verify packet");
    expect(html).toContain("Verify JSON");
    expect(html).toContain("Packet receipt not checked in this browser yet.");
    expect(html).toContain(HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH);
    expect(html).toContain(`${snapshot.packet.receipt.receiptId}.json`);
    expect(html).toContain("buyer-outcome-artifact.md");
  });

  test("keeps the early buyer outcome artifact internal when the buyer proof is blocked", () => {
    const snapshot = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("block"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.decision).toBe("repair-before-share");
    expect(snapshot.readyCount).toBe(0);
    expect(snapshot.blockedCount).toBe(4);
    expect(snapshot.primaryAction).toMatchObject({ label: "Fix Public story proof", href: "#launch-evidence-console", external: false });
    expect(snapshot.packet).toMatchObject({
      status: "blocked",
      headline: "Buyer packet stays internal until proof closes",
      readyCount: 0,
      itemCount: 4,
      receipt: {
        checksumAlgorithm: "fnv1a32",
        verificationApiPath: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
        payload: {
          receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
          source: "homepage-outcome-artifact",
          decision: "repair-before-share"
        }
      }
    });
    expect(snapshot.packet.receipt.receiptId).toMatch(/^homepage-outcome-blocked-[a-f0-9]{8}$/);
    expect(snapshot.packet.items.find((item) => item.id === "decision-handoff")).toMatchObject({
      status: "blocked",
      actionLabel: "Fix Public story proof",
      href: "#launch-evidence-console"
    });
    expect(snapshot.redLines).toHaveLength(1);
    expect(snapshot.redLines[0]).toMatchObject({
      label: "Public story proof",
      owner: "Publication lead",
      status: "block"
    });
    expect(snapshot.exportMarkdown).toContain("Blocked metrics: 4");
    expect(snapshot.exportMarkdown).toContain("## What the user gets");
    expect(snapshot.exportMarkdown).toContain(`Receipt: ${snapshot.packet.receipt.receiptId}`);
    expect(snapshot.exportMarkdown).toContain("[blocked] Decision handoff");
    expect(snapshot.exportMarkdown).toContain("First action: Fix Public story proof (#launch-evidence-console)");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("packages the homepage outcome and proof rail into a reviewer handoff kit", () => {
    const artifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const kit = buildHomepageReviewerHandoffKitSnapshot({
      artifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });

    expect(kit.status).toBe("ready");
    expect(kit.headline).toBe("Reviewer can decide from one kit");
    expect(kit.buyer).toBe("Platform release lead");
    expect(kit.reviewQuestion).toBe("Can the buyer approve the first pilot from this room?");
    expect(kit.primaryAction).toMatchObject({ label: "Open review kit", href: "/buyer-review-kit?workspace=share-token", external: false });
    expect(kit.proofAction).toMatchObject({ label: "Open launch room", href: "/launch-room", external: false });
    expect(kit.readyCount).toBe(4);
    expect(kit.blockedCount).toBe(0);
    expect(kit.steps.map((step) => [step.id, step.status])).toEqual([
      ["buyer-brief", "ready"],
      ["proof-rail", "ready"],
      ["decision-room", "ready"],
      ["send-rule", "ready"]
    ]);
    expect(kit.sendRule).toContain("buyer brief, launch room, proof rail, and decision receipt");
    expect(kit.exportMarkdown).toContain("# Reviewer handoff kit");
    expect(kit.exportMarkdown).toContain("Ready steps: 4/4");
    expect(kit.exportMarkdown).toContain("Primary action: Open review kit (/buyer-review-kit)");
    expect(kit.exportMarkdown).toContain("[ready] Proof rail - Pilot owner");
    const html = renderToStaticMarkup(createElement(HomepageReviewerHandoffKitPanel, { snapshot: kit, onCopyText: async () => true }));
    expect(html).toContain("Reviewer handoff kit");
    expect(html).toContain("Reviewer can decide from one kit");
    expect(html).toContain("Can the buyer approve the first pilot from this room?");
    expect(html).toContain("reviewer-handoff-kit.md");
    expect(JSON.stringify(kit)).not.toMatch(/demo/i);
  });

  test("connects value, proof, packet, and review into a first buyer decision route", () => {
    const valueLens = homepageValueLensFixture();
    const publishability = homepagePublishabilitySnapshotFixture("ready");
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability,
      routeLock: homepageRouteLockFixture("ready", "send"),
      reviewKitHref: "/buyer-review-kit?workspace=share-token",
      decisionReceiptHref: "/buyer-decision-receipt?workspace=share-token&decision=continue",
      acceptancePathHref: "/buyer-acceptance-path?workspace=share-token&decision=continue"
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });

    const html = renderToStaticMarkup(
      createElement(HomepageOutcomeSpinePanel, {
        valueLens,
        proofEntry,
        outcomeArtifact,
        publishability,
        reviewerHandoffKit,
        launchIntegrity: {
          workspace: buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example"),
          auditHref: "/buyer-proof-audit?workspace=share-token",
          memoHref: "/buyer-delivery-memo?workspace=share-token",
          manifestHref: "/buyer-trust-manifest?workspace=share-token",
          roomHref: "/launch-room?workspace=share-token",
          gateHref: "/production-hardening?workspace=share-token"
        },
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Workflow-to-decision route");
    expect(html).toContain("First buyer decision route");
    expect(html).toContain("Platform release lead can move from workflow intake");
    expect(html).toContain("Workflow");
    expect(html).toContain("Value");
    expect(html).toContain("Proof");
    expect(html).toContain("Packet");
    expect(html).toContain("Decision");
    expect(html).toContain("Open review kit");
    expect(html).toContain("Copy route");
    expect(html).toContain("Export route");
    expect(html).toContain("Launch integrity triage");
    expect(html).toContain("Reference residue audit");
    expect(html).toContain("Production gate");
    expect(html).toContain("Route receipt");
    expect(html).toContain("Verify route");
    expect(html).toContain("first-buyer-decision-route.md");
    expect(html).toContain("homepage-outcome-spine-ready-");
    expect(html).toContain("fnv1a32:");
    expect(html).toContain(HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH);
    expect(html).toContain("/receipt-verifier?request=");
    expect(html).not.toContain("/receipt-verifier?requestKey=homepage-outcome-spine-ready-");
    expect(html).toContain("sendable route");
    expect(html).not.toMatch(/demo/i);
  });

  test("puts the external reviewer decision dock in the first-screen path", () => {
    const artifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send"),
      reviewKitHref: "/buyer-review-kit?workspace=share-token",
      decisionReceiptHref: "/buyer-decision-receipt?workspace=share-token&decision=continue",
      acceptancePathHref: "/buyer-acceptance-path?workspace=share-token&decision=continue"
    });
    const reviewerKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const dock = buildHomepageExternalReviewerDockSnapshot({ artifact, proofEntry, reviewerKit });

    expect(dock.status).toBe("ready");
    expect(dock.headline).toBe("External reviewer can inspect the decision path");
    expect(dock.primaryAction).toMatchObject({ label: "Open review kit", href: "/buyer-review-kit?workspace=share-token" });
    expect(dock.verifierAction).toMatchObject({ label: "Verify packet" });
    const verifierUrl = new URL(dock.verifierAction.href, "https://example.com");
    expect(verifierUrl.pathname).toBe("/receipt-verifier");
    expect(verifierUrl.searchParams.get("request")).toBe(artifact.packet.receipt.verificationRequestJson);
    expect(verifierUrl.searchParams.get("verify")).toBe("1");
    expect(verifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(dock.verifierRequestKey).toBe(artifact.packet.receipt.receiptId);
    expect(dock.verifierRequestJson).toBe(artifact.packet.receipt.verificationRequestJson);
    expect(dock.verifierFallbackHref).toBe(dock.verifierAction.href);
    expect(dock.readyCount).toBe(4);
    expect(dock.itemCount).toBe(4);
    expect(dock.items.map((item) => item.id)).toEqual(["review-kit", "packet-verifier", "decision-receipt", "acceptance-path"]);
    expect(dock.sendRule).toContain("review kit, packet verifier, decision receipt, and acceptance path");
    expect(dock.exportMarkdown).toContain("# External reviewer dock");
    expect(dock.exportMarkdown).toContain("Ready surfaces: 4/4");
    expect(dock.exportMarkdown).toContain("Verifier: Verify packet (/receipt-verifier)");
    expect(dock.exportMarkdown).toContain("[ready] Packet verifier");
    const html = renderToStaticMarkup(createElement(HomepageExternalReviewerDockPanel, { snapshot: dock }));
    expect(html).toContain("External review room");
    expect(html).toContain("External reviewer can inspect the decision path");
    expect(html).toContain("4/4 surfaces ready");
    expect(html).toContain("Verify packet");
    expect(html).toContain("/receipt-verifier?request=");
    expect(html).not.toContain(`requestKey=${artifact.packet.receipt.receiptId}`);
    expect(html).toContain("Decision: continue");
    expect(html).toContain("Acceptance path");
    expect(html).toContain("external-reviewer-dock.md");
    expect(JSON.stringify(dock)).not.toMatch(/demo/i);
  });

  test("keeps the external reviewer decision dock on hold when proof is blocked", () => {
    const artifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("block"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold"),
      reviewKitHref: "/buyer-review-kit?workspace=share-token",
      decisionReceiptHref: "/buyer-decision-receipt?workspace=share-token&decision=stop",
      acceptancePathHref: "/buyer-acceptance-path?workspace=share-token&decision=stop"
    });
    const reviewerKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const dock = buildHomepageExternalReviewerDockSnapshot({ artifact, proofEntry, reviewerKit });

    expect(dock.status).toBe("blocked");
    expect(dock.headline).toBe("External review stays blocked with the reason named");
    expect(dock.primaryAction.label).not.toBe("Open review kit");
    expect(dock.primaryAction.label).toBe(proofEntry.nextMove.action.label);
    expect(dock.sendRule).toContain("Hold external review until");
    expect(dock.items.find((item) => item.id === "packet-verifier")).toMatchObject({
      status: "blocked",
      actionLabel: "Verify packet"
    });
    const verifierUrl = new URL(dock.verifierAction.href, "https://example.com");
    expect(verifierUrl.searchParams.get("request")).toBe(artifact.packet.receipt.verificationRequestJson);
    expect(verifierUrl.searchParams.has("requestKey")).toBe(false);
    const html = renderToStaticMarkup(createElement(HomepageExternalReviewerDockPanel, { snapshot: dock }));
    expect(html).toContain("External review stays blocked with the reason named");
    expect(html).toContain("Hold external review until");
    expect(html).toContain("0/4 surfaces ready");
    expect(html).toContain("External review room");
    expect(html).toContain("/receipt-verifier?request=");
    expect(html).not.toContain(`requestKey=${artifact.packet.receipt.receiptId}`);
    expect(JSON.stringify(dock)).not.toMatch(/demo/i);
  });

  test("puts live buyer packet verification in the first-screen proof path", () => {
    const artifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const html = renderToStaticMarkup(createElement(HomepageHeroPacketVerifier, { artifact, proofEntry }));

    expect(html).toContain("Live packet verifier");
    expect(html).toContain("Buyer packet is ready to verify before review");
    expect(html).toContain("Verify now");
    expect(html).toContain("Request JSON");
    expect(html).toContain("Receipt desk");
    const verifierHref = html.match(/<a href="([^"]+)"[^>]*>[\s\S]*?Receipt desk/)?.[1]?.replaceAll("&amp;", "&") ?? "";
    const verifierUrl = new URL(verifierHref, "https://example.com");
    expect(verifierUrl.pathname).toBe("/receipt-verifier");
    expect(verifierUrl.searchParams.get("request")).toBe(artifact.packet.receipt.verificationRequestJson);
    expect(verifierUrl.searchParams.get("verify")).toBe("1");
    expect(verifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(html).not.toContain("/external-review-packet");
    expect(html).toContain(HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH);
    expect(html).toContain(artifact.packet.receipt.receiptId);
    expect(html).toContain(`${artifact.packet.receipt.checksumAlgorithm}:${artifact.packet.receipt.checksum}`);
    expect(html).toContain("continue decision handoff");
    expect(html).toContain("Packet receipt not checked in this browser yet.");
    expect(JSON.stringify(artifact)).not.toMatch(/demo/i);
  });

  test("keeps the reviewer handoff kit internal when the proof room has a no-send blocker", () => {
    const artifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("block"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold")
    });
    const kit = buildHomepageReviewerHandoffKitSnapshot({
      artifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });

    expect(kit.status).toBe("blocked");
    expect(kit.headline).toBe("Reviewer kit names the no-send reason");
    expect(kit.reviewQuestion).toBe("What must close before this buyer can review the room?");
    expect(kit.reviewAnswer).toContain("cannot trust the room until public proof is backed by evidence");
    expect(kit.primaryAction).toMatchObject({ label: "Fix live proof", href: "#buyer-proof-intake", external: false });
    expect(kit.readyCount).toBe(0);
    expect(kit.blockedCount).toBe(4);
    expect(kit.steps.map((step) => [step.id, step.status])).toEqual([
      ["buyer-brief", "blocked"],
      ["proof-rail", "blocked"],
      ["decision-room", "blocked"],
      ["send-rule", "blocked"]
    ]);
    expect(kit.sendRule).toBe("Do not send until close public proof before buyer sharing.");
    expect(kit.holdRule).toContain("Publication lead");
    expect(kit.exportMarkdown).toContain("Primary action: Fix live proof (#buyer-proof-intake)");
    expect(kit.exportMarkdown).toContain("## Hold rule");
    expect(kit.exportMarkdown).toContain("[blocked] No-send rule - Proof owner");
    expect(JSON.stringify(kit)).not.toMatch(/demo/i);
  });

  test("summarizes buyer decision, value, public proof, and handoff into a first-screen proof entry", () => {
    const snapshot = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.headline).toBe("Buyer proof room is ready to inspect");
    expect(snapshot.buyer).toBe("Platform lead");
    expect(snapshot.proofScore).toBe(89);
    expect(snapshot.readyCount).toBe(4);
    expect(snapshot.blockedCount).toBe(0);
    expect(snapshot.primaryAction).toMatchObject({ label: "Open launch room", href: "/launch-room", external: false });
    expect(snapshot.secondaryAction).toMatchObject({ label: "Open publishability report", href: "/global-publishability", external: false });
    expect(snapshot.nextMove).toMatchObject({
      id: "send-route",
      status: "ready",
      label: "Send route",
      headline: "Send the buyer room with proof attached",
      owner: "Pilot owner"
    });
    expect(snapshot.nextMove.command).toContain("Open launch room");
    expect(snapshot.nextMove.buyerImpact).toContain("can inspect value, public proof, and the handoff path");
    expect(snapshot.nextMove.acceptanceCriteria).toContain("The buyer can make a continue, revise, or stop decision from the room.");
    expect(snapshot.nextMove.impact).toMatchObject({
      currentScore: 89,
      projectedScore: 89,
      scoreDelta: 0,
      currentReadyCount: 4,
      projectedReadyCount: 4,
      readyDelta: 0,
      label: "No repair lift needed"
    });
    expect(snapshot.nextMove.ownerPacket).toMatchObject({
      status: "ready",
      title: "Pilot owner packet for Platform lead",
      owner: "Pilot owner",
      due: "Before buyer review",
      proofToAttach: "Review kit, decision receipt, acceptance path, publishability report, and receipt verifier handoff.",
      verificationLabel: "Open receipt verifier",
      verificationHref: "/receipt-verifier",
      shareRule: "Send only with the review kit, decision receipt, acceptance path, and verifier links attached."
    });
    expect(snapshot.nextMove.ownerPacket.exportMarkdown).toContain("# Homepage proof owner packet");
    expect(snapshot.nextMove.ownerPacket.exportMarkdown).toContain("Proof to attach");
    expect(snapshot.nextMove.ownerPacket.href).toContain("data:text/markdown");
    expect(snapshot.nextMove.exportMarkdown).toContain("# Next proof move");
    expect(snapshot.nextMove.exportMarkdown).toContain("Estimated lift: 89/100 -> 89/100 (+0)");
    expect(snapshot.nextMove.exportMarkdown).toContain("## Owner packet");
    expect(snapshot.decisionHandoff).toMatchObject({
      recommendedDecision: "continue",
      headline: "Continue can be recorded with proof attached",
      guardrail: "Send only after Platform lead can open the review kit, receipt, and acceptance path."
    });
    expect(snapshot.decisionHandoff.reviewKit.href).toBe("/buyer-review-kit");
    expect(snapshot.decisionHandoff.decisionReceipt).toMatchObject({ label: "Decision: continue", href: "/buyer-decision-receipt" });
    expect(snapshot.decisionHandoff.acceptancePath.href).toBe("/buyer-acceptance-path");
    expect(snapshot.items.map((item) => item.id)).toEqual(["buyer-decision", "value-proof", "public-proof", "handoff"]);
    expect(snapshot.items.find((item) => item.id === "value-proof")).toMatchObject({
      status: "ready",
      title: "¥420,000 / month",
      actionLabel: "Review value proof"
    });
    const html = renderToStaticMarkup(createElement(HomepageProofEntryRail, { snapshot }));
    expect(html).toContain('id="homepage-proof-entry"');
    expect(html).toContain("Proof-first entry");
    expect(html).toContain("Buyer proof room is ready to inspect");
    expect(html).toContain("Buyer decision");
    expect(html).toContain("Value proof");
    expect(html).toContain("Public proof");
    expect(html).toContain("Handoff");
    expect(html).toContain("homepage-proof-entry.md");
    expect(html).toContain("Next proof move");
    expect(html).toContain("Estimated lift");
    expect(html).toContain("Owner packet");
    expect(html).toContain("Pilot owner");
    expect(html).toContain("homepage-proof-owner-packet.md");
    expect(html).toContain('href="/receipt-verifier"');
    expect(html).toContain("Review kit");
    expect(html).toContain("Decision: continue");
    expect(html).toContain('href="/buyer-decision-receipt"');
    expect(html).toContain("homepage-next-proof-move.md");
    expect(html).toContain("Send: all rails for Platform lead.");
    expect(snapshot.exportMarkdown).toContain("# Homepage proof entry");
    expect(snapshot.exportMarkdown).toContain("## Next proof move");
    expect(snapshot.exportMarkdown).toContain("## Decision handoff");
    expect(snapshot.exportMarkdown).toContain("Decision handoff: continue");
    expect(snapshot.exportMarkdown).toContain("- Decision: continue: /buyer-decision-receipt");
    expect(snapshot.exportMarkdown).toContain("[ready] Buyer decision: Send / 88.");
    expect(snapshot.exportMarkdown).toContain("Ready rails: 4/4 -> 4/4");
    expect(snapshot.exportMarkdown).toContain("## Proof rail");
    expect(snapshot.exportMarkdown).toContain("[ready] Public proof: 91/100 Public product surface");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("uses the buyer proof room as the homepage proof entry when provided", () => {
    const snapshot = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send"),
      proofRoomHref: "/buyer-proof-room?workspace=lz1.release",
      reviewKitHref: "/buyer-review-kit?workspace=lz1.release&decision=continue",
      decisionReceiptHref: "/buyer-decision-receipt?workspace=lz1.release&decision=continue",
      acceptancePathHref: "/buyer-acceptance-path?workspace=lz1.release&decision=continue"
    });
    const route = buildHomepageHeroProofRouteSnapshot(snapshot);
    const html = renderToStaticMarkup(createElement(HomepageProofEntryRail, { snapshot }));

    expect(snapshot.primaryAction).toMatchObject({ label: "Open proof room", href: "/buyer-proof-room?workspace=lz1.release", external: false });
    expect(snapshot.nextMove.action).toMatchObject({ label: "Open proof room", href: "/buyer-proof-room?workspace=lz1.release", external: false });
    expect(snapshot.nextMove.command).toContain("Open proof room");
    expect(snapshot.exportMarkdown).toContain("First action: Open proof room (/buyer-proof-room?workspace=lz1.release)");
    expect(snapshot.nextMove.exportMarkdown).toContain("Action: Open proof room (/buyer-proof-room?workspace=lz1.release)");
    expect(route.primaryAction).toMatchObject({ label: "Open proof room", href: "/buyer-proof-room?workspace=lz1.release", external: false });
    expect(route.exportMarkdown).toContain("First action: Open proof room (/buyer-proof-room?workspace=lz1.release)");
    expect(html).toContain('href="/buyer-proof-room?workspace=lz1.release"');
    expect(snapshot.decisionHandoff.reviewKit.href).toBe("/buyer-review-kit?workspace=lz1.release&decision=continue");
    expect(snapshot.decisionHandoff.decisionReceipt.href).toBe("/buyer-decision-receipt?workspace=lz1.release&decision=continue");
    expect(snapshot.decisionHandoff.acceptancePath.href).toBe("/buyer-acceptance-path?workspace=lz1.release&decision=continue");
    expect(snapshot.exportMarkdown).toContain("- Review kit: /buyer-review-kit?workspace=lz1.release&decision=continue");
    expect(snapshot.exportMarkdown).toContain("- Decision: continue: /buyer-decision-receipt?workspace=lz1.release&decision=continue");
    expect(snapshot.exportMarkdown).toContain("- Acceptance path: /buyer-acceptance-path?workspace=lz1.release&decision=continue");
    expect(route.exportMarkdown).toContain("Decision receipt: Decision: continue (/buyer-decision-receipt?workspace=lz1.release&decision=continue)");
  });

  test("condenses the first-screen proof entry into a visible hero buyer route", () => {
    const entry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const route = buildHomepageHeroProofRouteSnapshot(entry);

    expect(route.status).toBe("ready");
    expect(route.headline).toBe("First buyer route is send-ready");
    expect(route.buyer).toBe("Platform lead");
    expect(route.scoreLine).toBe("89/100 proof / 4/4 ready");
    expect(route.primaryAction).toMatchObject({ label: "Open launch room", href: "/launch-room", external: false });
    expect(route.decisionHandoff.decisionReceipt).toMatchObject({ label: "Decision: continue", href: "/buyer-decision-receipt" });
    expect(route.items.map((item) => item.id)).toEqual(["value-proof", "public-proof", "handoff"]);
    expect(route.items.find((item) => item.id === "value-proof")).toMatchObject({
      status: "ready",
      title: "¥420,000 / month"
    });
    expect(route.exportMarkdown).toContain("# First buyer route");
    expect(route.exportMarkdown).toContain("## Route checks");
    expect(route.exportMarkdown).toContain("[ready] Public proof: 91/100 Public product surface");
    expect(JSON.stringify(route)).not.toMatch(/demo/i);
  });

  test("renders the first-screen route as a verifiable buyer approval loop", () => {
    const entry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const route = buildHomepageHeroProofRouteSnapshot(entry);
    const html = renderToStaticMarkup(createElement(HomepageHeroProofRoute, { snapshot: route }));

    expect(html).toContain("Buyer approval loop");
    expect(html).toContain("Verify receipts");
    expect(html).toContain("Decision: continue");
    expect(html).toContain("Review kit");
    expect(html).toContain('href="/receipt-verifier"');
    expect(html).toContain('href="/buyer-decision-receipt"');
    expect(html).toContain("Open launch room");
    expect(JSON.stringify(route)).not.toMatch(/demo/i);
  });

  test("turns homepage buyer value assumptions into a first-screen value lens", () => {
    const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"], 260);
    const scenario = buildBuyerValueScenario(recommendation, {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 6,
      manualHoursPerCycle: 32,
      adoptionRatePercent: 82,
      incidentRiskYenPerMonth: 500000
    });
    const measuredRun = buildBuyerPilotMeasuredRunSummary(
      {
        observedManualMinutes: 1920,
        observedAssistedMinutes: 240,
        participants: 5,
        acceptedTasks: 9,
        totalTasks: 10,
        evidenceUrl: "https://evidence.example/value-run",
        reviewerName: "Platform sponsor",
        notes: "Release planning pilot accepted."
      },
      scenario
    );

    const snapshot = buildHomepageValueLensSnapshot({
      buyer: "Platform release lead",
      scenario,
      measuredRun,
      valueReportHref: "/buyer-value?workspace=share-token"
    });

    expect(snapshot.status).toBe("ready");
    expect(snapshot.headline).toBe("This workflow has a defendable value case");
    expect(snapshot.primaryAction).toMatchObject({ label: "Open value report", href: "/buyer-value?workspace=share-token", external: false });
    expect(snapshot.workflowAction).toMatchObject({ label: "Start with workflow", href: "#quick-workflow-intake", external: false });
    expect(snapshot.measuredSupportPercent).toBeGreaterThanOrEqual(70);
    expect(snapshot.metrics.map((metric) => metric.id)).toEqual(["modeled-value", "measured-support", "payback", "confidence"]);
    expect(snapshot.readinessCoach).toMatchObject({
      status: "ready",
      label: "Buyer-ready",
      headline: "Value claim can move to buyer review"
    });
    expect(snapshot.readinessCoach.sendRule).toContain("value receipt");
    expect(snapshot.readinessCoach.buyerAsk).toContain("Ask Platform release lead to approve");
    expect(snapshot.readinessCoach.levers.map((lever) => lever.id)).toEqual(["adoption", "measured-support", "payback", "confidence"]);
    expect(snapshot.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a32",
      verificationApiPath: HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH,
      verification: {
        status: "verified"
      },
      payload: {
        receiptVersion: HOMEPAGE_VALUE_LENS_RECEIPT_VERSION,
        source: "homepage-value-lens",
        buyer: "Platform release lead",
        status: "ready",
        monthlyValueYen: snapshot.monthlyValueYen,
        measuredMonthlyValueYen: snapshot.measuredMonthlyValueYen,
        measuredSupportPercent: snapshot.measuredSupportPercent,
        paybackDays: snapshot.paybackDays
      }
    });
    expect(snapshot.receipt.receiptId).toMatch(/^homepage-value-ready-[a-f0-9]{8}$/);
    expect(snapshot.receipt.checksum).toMatch(/^[a-f0-9]{8}$/);
    expect(snapshot.receipt.verificationRequestJson).toContain(`"checksum": "${snapshot.receipt.checksum}"`);
    expect(snapshot.receipt.verificationRequestHref).toContain("data:application/json");
    expect(snapshot.exportMarkdown).toContain("# Homepage value lens");
    expect(snapshot.exportMarkdown).toContain("Buyer: Platform release lead");
    expect(snapshot.exportMarkdown).toContain("## Buyer readiness coach");
    expect(snapshot.exportMarkdown).toContain("Buyer ask: Ask Platform release lead to approve");
    expect(snapshot.exportMarkdown).toContain(`Receipt: ${snapshot.receipt.receiptId}`);
    expect(snapshot.exportMarkdown).toContain(`Checksum: fnv1a32:${snapshot.receipt.checksum}`);
    expect(snapshot.exportMarkdown).toContain(`API verification: POST ${HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH}`);
    expect(snapshot.exportMarkdown).toContain("First action: Open value report (/buyer-value?workspace=share-token)");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);

    const html = renderToStaticMarkup(createElement(HomepageValueLens, { snapshot, onAssumptionChange: () => undefined }));
    expect(html).toContain("Homepage value lens");
    expect(html).toContain("Value lens");
    expect(html).toContain("This workflow has a defendable value case");
    expect(html).toContain('aria-label="Team"');
    expect(html).toContain('aria-label="Adoption"');
    expect(html).toContain("homepage-value-lens.md");
    expect(html).toContain('href="/buyer-value?workspace=share-token"');
    expect(html).toContain('href="#quick-workflow-intake"');
    expect(html).toContain("Value receipt");
    expect(html).toContain("Verify value");
    expect(html).toContain("Verify JSON");
    expect(html).toContain("Value receipt not checked in this browser yet.");
    expect(html).toContain(HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH);
    expect(html).toContain(`${snapshot.receipt.receiptId}.json`);
    expect(html).toContain("Readiness coach");
    expect(html).toContain("Value claim can move to buyer review");
    expect(html).toContain("Buyer-ready");
    expect(html).toContain("Send rule");
    expect(html).toContain("Ask Platform release lead to approve");
    expect(html).toContain("Adoption lift");
    expect(html).toContain("Payback guardrail");
    expect(html).toContain("Value trace ledger");
    expect(html).toContain("Value math is replayable");
    expect(html).toContain("Replay-ready");
    expect(html).toContain("Copy trace");
    expect(html).toContain("Export trace");
    expect(html).toContain("Receipt payload");
    expect(html).toContain("buyer-value-trace-ledger.md");
    expect(html).toContain(`${snapshot.receipt.receiptId}-payload.json`);
    expect(html).toContain("Workflow load");
    expect(html).toContain("manual hours x cycles x adoption");
    expect(html).toContain("Labor value");
    expect(html).toContain("saved hours x loaded hourly cost");
    expect(html).toContain("Risk adjustment");
    expect(html).toContain("Measured replay");
    expect(html).toContain("measured value / modeled value");
    expect(html).toContain("Payback replay");
    expect(html).toContain("pilot investment / monthly value x 30 days");
    expect(html).toContain("Receipt confidence");
    expect(html).toContain("Send only when every buyer-facing number has an input, formula, result, and receipt reference.");
    expect(html).toContain("Buyer decision shortcut");
    expect(html).toContain("Approval memo is the next buyer artifact");
    expect(html).toContain("Approval path ready");
    expect(html).toContain("Open approval memo");
    expect(html).toContain("Export route");
    expect(html).toContain("buyer-decision-shortcut.md");
    expect(html).toContain('href="#procurement-decision-desk"');
    expect(html).toContain('href="#commercial-offer"');
    expect(html).toContain('href="#pilot-acceptance-terms"');
    expect(html).toContain("Value receipt");
    expect(html).toContain(`${snapshot.receipt.receiptId}, verified checksum.`);
    expect(html).toContain("Pilot acceptance terms");
    expect(html).toContain('id="pilot-acceptance-terms"');
    expect(html).toContain("Buyer terms are ready to review");
    expect(html).toContain("Commitment ready");
    expect(html).toContain("Maximum pilot ask");
    expect(html).toContain("14-day measured pilot");
    expect(html).toContain("Stop rule");
    expect(html).toContain("Measured support reaches 70% or higher.");
    expect(html).toContain("Copy terms");
    expect(html).toContain("Export terms");
    expect(html).toContain("pilot-acceptance-terms.md");
    expect(html).toContain("Economic proof");
    expect(html).toContain("Budget guardrail");
    expect(html).toContain("Receipt review");
  });

  test("turns the first buyer loop into a board-ready decision memo", () => {
    const valueLens = homepageValueLensFixture();
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const memo = buildHomepageBuyerBoardMemo({
      valueLens,
      proofEntry,
      outcomeArtifact,
      reviewerHandoffKit
    });

    expect(memo.status).toBe("ready");
    expect(memo.decisionLabel).toBe("Approve bounded pilot");
    expect(memo.headline).toBe("What the buyer can decide from this room");
    expect(memo.boardScore).toBe(100);
    expect(memo.valueAtStakeYen).toBeGreaterThan(0);
    expect(memo.primaryAction).toMatchObject({ label: "Open review kit", href: "/buyer-review-kit?workspace=share-token", external: false });
    expect(memo.secondaryAction).toMatchObject({ label: "Verify receipt", external: false });
    expect(memo.secondaryAction.href).toContain("/receipt-verifier?");
    expect(memo.metrics.map((metric) => metric.id)).toEqual(["value-at-stake", "proof-gate", "packet", "receipt"]);
    expect(memo.questions.map((question) => question.id)).toEqual(["worth-pilot", "proof-open", "what-sent", "next-decision"]);
    expect(memo.exportMarkdown).toContain("# Buyer board memo");
    expect(memo.exportMarkdown).toContain("Decision: Approve bounded pilot");
    expect(memo.exportMarkdown).toContain(`Receipt: ${outcomeArtifact.packet.receipt.receiptId}`);
    expect(JSON.stringify(memo)).not.toMatch(/demo/i);

    const html = renderToStaticMarkup(createElement(HomepageBuyerBoardMemoPanel, { memo, onCopyText: async () => true }));
    expect(html).toContain('id="buyer-board-memo"');
    expect(html).toContain("Buyer board memo");
    expect(html).toContain("What the buyer can decide from this room");
    expect(html).toContain("Approve bounded pilot");
    expect(html).toContain("Value at stake");
    expect(html).toContain("Is this worth a pilot?");
    expect(html).toContain("Can the proof be opened?");
    expect(html).toContain("What exactly gets sent?");
    expect(html).toContain("Who decides next?");
    expect(html).toContain("Copy memo");
    expect(html).toContain("Export memo");
    expect(html).toContain("buyer-board-memo.md");
    expect(html).toContain('href="/buyer-review-kit?workspace=share-token"');
    expect(html).toContain("/receipt-verifier?");
  });

  test("composes value, proof, packet, and handoff into a first-run buyer command", () => {
    const valueLens = homepageValueLensFixture();
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const command = buildHomepageFirstRunValueProofCommand({
      valueLens,
      proofEntry,
      outcomeArtifact,
      reviewerHandoffKit
    });

    expect(command.status).toBe("ready");
    expect(command.headline).toBe("Send the first buyer loop with proof attached");
    expect(command.readyCount).toBe(4);
    expect(command.checkTotal).toBe(4);
    expect(command.primaryAction).toMatchObject({ label: "Open launch room", href: "/launch-room", external: false });
    const verifierUrl = new URL(command.verifierAction.href, "https://example.com");
    expect(command.verifierAction).toMatchObject({
      label: "Verify packet receipt",
      requestKey: outcomeArtifact.packet.receipt.receiptId
    });
    expect(verifierUrl.pathname).toBe("/receipt-verifier");
    expect(verifierUrl.searchParams.get("request")).toBe(outcomeArtifact.packet.receipt.verificationRequestJson);
    expect(verifierUrl.searchParams.get("verify")).toBe("1");
    expect(verifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(command.ownerPacketAction).toMatchObject({ label: "Pilot owner packet" });
    expect(command.valueLine).toContain("measured");
    expect(command.proofLine).toBe("89/100 proof, 4/4 rails ready");
    expect(command.packetLine).toBe("4/4 packet artifacts, 4/4 handoff steps");
    expect(command.command).toContain(outcomeArtifact.packet.receipt.receiptId);
    expect(command.command).toContain("continue decision handoff");
    expect(command.receipts.map((receipt) => receipt.id)).toEqual(["value", "packet"]);
    expect(command.receipts[0]).toMatchObject({
      label: "Value receipt",
      receiptId: valueLens.receipt.receiptId,
      checksum: `fnv1a32:${valueLens.receipt.checksum}`
    });
    expect(command.checks.map((check) => [check.id, check.status])).toEqual([
      ["value-case", "ready"],
      ["proof-route", "ready"],
      ["buyer-packet", "ready"],
      ["reviewer-handoff", "ready"]
    ]);
    expect(command.exportMarkdown).toContain("# First-run buyer value command");
    expect(command.exportMarkdown).toContain(`Verifier: Verify packet receipt (/receipt-verifier)`);
    expect(command.exportMarkdown).toContain(`Packet receipt: ${outcomeArtifact.packet.receipt.receiptId}`);
    expect(command.exportMarkdown).toContain("Owner packet: Pilot owner packet (data export)");
    expect(command.exportMarkdown).not.toContain("nulltext");
    expect(JSON.stringify(command)).not.toMatch(/demo/i);

    const html = renderToStaticMarkup(
      createElement(HomepageFirstRunValueProofCommandPanel, {
        valueLens,
        proofEntry,
        outcomeArtifact,
        reviewerHandoffKit,
        onCopyText: async () => true
      })
    );
    expect(html).toContain("Buyer value command");
    expect(html).toContain("Send the first buyer loop with proof attached");
    expect(html).toContain("Verify packet receipt");
    const firstRunVerifierHref =
      html.match(/<a class="homepage-first-run-value-proof-link" href="([^"]+)"[^>]*>[\s\S]*?Verify packet receipt/)?.[1] ?? "";
    expect(firstRunVerifierHref).toContain("/receipt-verifier?request=");
    expect(firstRunVerifierHref).not.toContain("requestKey=");
    expect(html).toContain("Value receipt");
    expect(html).toContain("Packet receipt");
    expect(html).toContain("Owner packet");
    expect(html).toContain("First buyer meeting brief");
    expect(html).toContain("Buyer meeting should stay in proof review");
    expect(html).toContain("Review only");
    expect(html).toContain("Copy meeting brief");
    expect(html).toContain("Export meeting brief");
    expect(html).toContain("first-buyer-meeting-brief.md");
    expect(html).toContain("Value case");
    expect(html).toContain("Receipt check");
    expect(html).toContain("Pilot decision");
    expect(html).toContain("Open artifact");
    expect(html).toContain("Leave with the next proof owner and no external approval request.");
    expect(html).toContain("Buyer question answers");
    expect(html).toContain("First buyer question answer board");
    expect(html).toContain("Buyer answers stay internal until proof closes");
    expect(html).toContain("Internal answers only");
    expect(html).toContain("Current question");
    expect(html).toContain("Copy answers");
    expect(html).toContain("Export answers");
    expect(html).toContain("first-buyer-question-answer-board.md");
    expect(html).toContain("Open proof");
    expect(html).toContain("Buyer approval checklist");
    expect(html).toContain("Buyer approval is blocked by proof conditions");
    expect(html).toContain("Do not ask for approval yet.");
    expect(html).toContain("Value can be cited");
    expect(html).toContain("Receipts verify outside workspace");
    expect(html).toContain("Decision route is bounded");
    expect(html).toContain("Meeting ask is safe");
    expect(html).toContain("Buyer package has attachments");
    expect(html).toContain("Copy checklist");
    expect(html).toContain("Export checklist");
    expect(html).toContain("first-buyer-approval-checklist.md");
    expect(html).toContain("Open condition");
    expect(html).toContain("First buyer follow-up");
    expect(html).toContain("Send the repair request before buyer follow-up");
    expect(html).toContain("Repair follow-up");
    expect(html).toContain("Do not send the buyer ask yet.");
    expect(html).toContain("proof repair needed before buyer follow-up");
    expect(html).toContain("Attachment contract");
    expect(html).toContain("Keep the follow-up internal:");
    expect(html).toContain("attachments are send-ready");
    expect(html).toContain("Public proof manifest");
    expect(html).toContain("Fresh live proof");
    expect(html).toContain("Open attachment");
    expect(html).toContain("Copy follow-up");
    expect(html).toContain("Export follow-up");
    expect(html).toContain("first-buyer-follow-up.md");
    expect(html).toContain("Proof state");
    expect(html).toContain("Meeting ask");
    expect(html).toContain("Decision record");
    expect(html).toContain("Safety line");
    expect(html).toContain("first-run-buyer-value-command.md");
  });

  test("keeps the first-run buyer command on hold when packet proof is blocked", () => {
    const valueLens = homepageValueLensFixture();
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold")
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("block"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const command = buildHomepageFirstRunValueProofCommand({
      valueLens,
      proofEntry,
      outcomeArtifact,
      reviewerHandoffKit
    });

    expect(command.status).toBe("blocked");
    expect(command.headline).toBe("Hold buyer delivery and close the first proof move");
    expect(command.readyCount).toBe(1);
    expect(command.primaryAction).toMatchObject({ label: "Fix live proof", href: "#buyer-proof-intake" });
    expect(command.command).toContain("Close public proof before buyer sharing");
    expect(command.sendRule).toBe("Do not send until close public proof before buyer sharing.");
    expect(command.holdRule).toContain("Publication lead");
    expect(command.proofToAttach).toContain("Public product URL");
    expect(command.checks.map((check) => [check.id, check.status])).toEqual([
      ["value-case", "ready"],
      ["proof-route", "blocked"],
      ["buyer-packet", "blocked"],
      ["reviewer-handoff", "blocked"]
    ]);
    expect(command.exportMarkdown).toContain("Status: blocked");
    expect(command.exportMarkdown).toContain("First action: Fix live proof (#buyer-proof-intake)");
    expect(JSON.stringify(command)).not.toMatch(/demo/i);
  });

  test("surfaces the concrete proof repair guide in the first-run buyer command", () => {
    const valueLens = homepageValueLensFixture();
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold")
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("block"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const current = defaultWorkspaceDraft("2026-06-23T00:00:00.000Z");
    const sample = buildProofBackedSampleWorkspaceDraft("2026-06-23T00:00:00.000Z", "https://sample.example", {
      protopediaUrl: "https://protopedia.net/prototype/release-ready",
      videoUrl: "https://youtu.be/releaseReady12345"
    });
    const proofRepairProjection = buildBuyerProofRepairProjection({ current, sample });
    const command = buildHomepageFirstRunValueProofCommand({
      valueLens,
      proofEntry,
      outcomeArtifact,
      reviewerHandoffKit,
      proofRepairProjection
    });

    expect(command.status).toBe("blocked");
    expect(command.primaryAction).toMatchObject({ label: "Open receipt", href: "#pilot-run-receipt", external: false });
    expect(command.command).toContain("Pilot reviewer owns the first no-send repair");
    expect(command.command).toContain("Paste the buyer-observed pilot receipt URL");
    expect(command.repairGuide).toMatchObject({
      noSendHeadline: "External sharing locked by reference proof",
      firstOwner: "Pilot reviewer",
      firstAction: "Paste the buyer-observed pilot receipt URL, reviewer, and accepted task count.",
      buyerOwnedCount: 2,
      proofGateCount: 6,
      blockingGateCount: 4,
      remainingDecisionLift: 61,
      appliedFixCount: 6,
      nowCount: 4,
      nextCount: 0,
      operatorBriefFilename: "buyer-proof-operator-brief.md",
      workOrdersFilename: "buyer-proof-replacement-work-orders.md",
      csvFilename: "buyer-proof-replacement-work-orders.csv"
    });
    expect(command.repairGuide?.tasks.map((task) => [task.id, task.priority, task.inputHref])).toEqual([
      ["measured-run", "now", "#pilot-run-receipt"],
      ["public-product", "now", "#launch-evidence-console"],
      ["work-order", "now", "#buyer-work-order-studio"]
    ]);
    expect(command.exportMarkdown).toContain("## Repair cockpit");
    expect(command.exportMarkdown).toContain("No-send lock: External sharing locked by reference proof");
    expect(command.exportMarkdown).toContain("First owner: Pilot reviewer");
    expect(command.exportMarkdown).toContain("Work orders: Export work orders (data export)");
    expect(JSON.stringify(command)).not.toMatch(/demo/i);

    const html = renderToStaticMarkup(
      createElement(HomepageFirstRunValueProofCommandPanel, {
        valueLens,
        proofEntry,
        outcomeArtifact,
        reviewerHandoffKit,
        workspace: current,
        proofSampleWorkspace: sample,
        onCopyText: async () => true
      })
    );
    expect(html).toContain("No-send repair");
    expect(html).toContain("First repair");
    expect(html).toContain("Pilot reviewer: Measured pilot receipt first");
    expect(html).toContain("2/6 buyer-owned gates, 61 lift at stake. Open receipt.");
    expect(html).toContain("Operator brief: Measured pilot receipt is the first no-send task");
    expect(html).toContain("Open receipt");
    expect(html).toContain("#pilot-run-receipt");
    expect(html).toContain("Public repair payoff");
    expect(html).toContain("2 proof gaps can close now; 61 decision-lift points still need buyer-owned proof.");
    expect(html).toContain("Pilot reviewer: Paste the buyer-observed pilot receipt URL, reviewer, and accepted task count.");
    expect(html).toContain("Copy payoff");
    expect(html).toContain("first-run-public-repair-payoff.md");
    expect(html).toContain("Repair impact simulator");
    expect(html).toContain("Choose repairs to see value unlock");
    expect(html).toContain("Select all repairs");
    expect(html).toContain("Reset simulation");
    expect(html).toContain("Copy simulation");
    expect(html).toContain("first-run-repair-impact-simulation.md");
    expect(html).toContain("Buyer decision rehearsal");
    expect(html).toContain("Buyer decision is held before external sharing");
    expect(html).toContain("Recommended decision");
    expect(html).toContain("Decision: stop");
    expect(html).toContain("Review kit");
    expect(html).toContain("Acceptance path");
    expect(html).toContain("Copy decision rehearsal");
    expect(html).toContain("first-run-buyer-decision-rehearsal.md");
    expect(html).toContain("Open decision route");
    expect(html).toContain("Export operator brief");
    expect(html).toContain("buyer-proof-operator-brief.md");
    expect(html).toContain("Export work orders");
    expect(html).toContain("buyer-proof-replacement-work-orders.md");
  });

  test("blocks the public proof manifest when a verified live proof receipt expires", () => {
    const valueLens = homepageValueLensFixture();
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("ready"),
      publishability: homepagePublishabilitySnapshotFixture("ready"),
      routeLock: homepageRouteLockFixture("ready", "send")
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("pass"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const proofLinks = [
      { id: "targetUrl", label: "Deployed URL", value: "https://release.opsbridge.ai", href: "#launch-evidence-console" },
      { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/prototype/release-ready", href: "#workflow-intake" },
      { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/release-proof", href: "#workflow-intake" }
    ];
    const proofVerification = {
      checkedAt: "2026-06-25T11:30:00.000Z",
      verifiedCount: 3,
      totalCount: 3,
      score: 100,
      results: proofLinks.map((link) => ({
        id: link.id,
        label: link.label,
        status: "pass" as const,
        httpStatus: 200,
        evidence: `${link.label} responded with HTTP 200.`,
        action: "Keep this link attached to the public proof manifest."
      }))
    };
    const baseProps = {
      valueLens,
      proofEntry,
      outcomeArtifact,
      reviewerHandoffKit,
      proofLinks,
      proofVerifyStatus: "checked" as const,
      proofVerification,
      onVerifyProofLinks: () => undefined,
      onProofLinkChange: () => undefined,
      onCopyText: async () => true
    };
    const freshHtml = renderToStaticMarkup(
      createElement(HomepageFirstRunValueProofCommandPanel, {
        ...baseProps,
        freshnessNowMs: Date.parse("2026-06-25T12:00:00.000Z")
      })
    );
    const staleHtml = renderToStaticMarkup(
      createElement(HomepageFirstRunValueProofCommandPanel, {
        ...baseProps,
        freshnessNowMs: Date.parse("2026-06-27T12:00:00.000Z")
      })
    );

    expect(freshHtml).toContain("Global public proof manifest is publish-ready");
    expect(freshHtml).toContain("Fresh for review");
    expect(freshHtml).toContain("Recheck before: 2026-06-26T11:30:00.000Z");
    expect(staleHtml).toContain("Global public proof manifest is blocked");
    expect(staleHtml).toContain("4/6 proof assets are ready. Launch owner owns: Proof owner: Reissue live proof verification before public sharing; do not reuse the expired receipt.");
    expect(staleHtml).toContain("Freshness expired");
    expect(staleHtml).toContain("Reissue live proof verification before public sharing; do not reuse the expired receipt.");
    expect(staleHtml).toContain("Do not cite the measured monthly value externally");
  });

  test("surfaces the live proof audit command from the first-run buyer command", () => {
    const valueLens = homepageValueLensFixture();
    const proofEntry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold")
    });
    const outcomeArtifact = buildHomepageOutcomeArtifactSnapshot({
      brief: buyerOutcomeBriefFixture("block"),
      publicBriefHref: "/buyer-outcome-brief?workspace=share-token",
      launchRoomHref: "/launch-room?workspace=share-token"
    });
    const reviewerHandoffKit = buildHomepageReviewerHandoffKitSnapshot({
      artifact: outcomeArtifact,
      proofEntry,
      reviewKitHref: "/buyer-review-kit?workspace=share-token"
    });
    const proofLinks = [
      { id: "targetUrl", label: "Deployed URL", value: "https://release.opsbridge.ai", href: "#launch-evidence-console" },
      { id: "videoUrl", label: "Walkthrough video", value: "", href: "#launch-evidence-console" },
      { id: "pilotEvidenceUrl", label: "Pilot receipt", value: "https://release.opsbridge.ai/pilot.json", href: "#pilot-run-receipt" }
    ];
    const html = renderToStaticMarkup(
      createElement(HomepageFirstRunValueProofCommandPanel, {
        valueLens,
        proofEntry,
        outcomeArtifact,
        reviewerHandoffKit,
        proofLinks,
        proofVerifyStatus: "checked",
        proofVerification: {
          checkedAt: "2026-06-25T11:30:00.000Z",
          verifiedCount: 1,
          totalCount: 3,
          score: 33,
          results: [
            {
              id: "targetUrl",
              label: "Deployed URL",
              status: "pass",
              httpStatus: 200,
              evidence: "Public URL responded with HTTP 200.",
              action: "Keep this link attached to the launch room."
            },
            {
              id: "pilotEvidenceUrl",
              label: "Pilot receipt",
              status: "block",
              httpStatus: 403,
              evidence: "Public URL responded with HTTP 403; external reviewers may not be able to open it.",
              action: "Make the artifact publicly readable or attach a different proof URL."
            }
          ]
        },
        onVerifyProofLinks: () => undefined,
        onProofLinkChange: () => undefined,
        onCopyText: async () => true
      })
    );

    expect(html).toContain("Live proof audit");
    expect(html).toContain("Live proof audit needs repair");
    expect(html).toContain("1/3 proof links responded live. 2 links still need repair.");
    expect(html).toContain("Live checked");
    expect(html).toContain("Export audit");
    expect(html).toContain("Verify JSON");
    expect(html).toContain("Verify audit");
    expect(html).toContain("workflow-live-proof-action-required");
    expect(html).not.toContain("requestKey=workflow-live-proof-action-required");
    const liveProofAuditVerifierHrefs = Array.from(html.matchAll(/href="([^"]*\/receipt-verifier\?request=[^"]+)"/g))
      .map(([, href]) => href.replaceAll("&amp;", "&"))
      .filter((href) => {
        const requestJson = new URL(href, "https://example.com").searchParams.get("request") ?? "";
        return requestJson.includes('"receiptVersion": "workflow-live-proof-audit.v1"');
      });
    expect(liveProofAuditVerifierHrefs.length).toBeGreaterThanOrEqual(1);
    expect(liveProofAuditVerifierHrefs.every((href) => !href.includes("requestKey="))).toBe(true);
    expect(html).toContain("Critical path");
    expect(html).toContain("Critical path is blocked at Proof closeout");
    expect(html).toContain("0/4 steps are clear. Publication owner owns: Paste a buyer-facing HTTPS URL for Walkthrough video.");
    expect(html).toContain("Blocked path");
    expect(html).toContain("Current step");
    expect(html).toContain("¥1,756,000/month remains locked until Publication owner clears Proof closeout.");
    expect(html).toContain("Open Proof closeout");
    expect(html).toContain("Copy path");
    expect(html).toContain("Export path");
    expect(html).toContain("first-run-critical-path.md");
    expect(html).toContain("Value release");
    expect(html).toContain("Decision packet");
    expect(html).toContain("Buyer follow-up");
    expect(html).toContain("Open path step");
    expect(html).toContain("External verification desk");
    expect(html).toContain("External verification blocked at");
    expect(html).toContain("verification surfaces ready");
    expect(html).toContain("Verification check");
    expect(html).toContain("Hold external review.");
    expect(html).toContain("Packet verifier");
    expect(html).toContain("Public proof");
    expect(html).toContain("Live audit verifier");
    expect(html).toContain("Value release memo");
    expect(html).toContain("Open verification");
    expect(html).toContain("Copy verification");
    expect(html).toContain("Export verification");
    expect(html).toContain("first-run-external-verification-desk.md");
    expect(html).toContain("Open verifier");
    expect(html).toContain("Proof closeout");
    expect(html).toContain("Close Walkthrough video before buyer sharing");
    expect(html).toContain("Proof blocker");
    expect(html).toContain("Walkthrough video is blocking");
    expect(html).toContain("#first-run-proof-input-videoUrl");
    expect(html).toContain("Open URL input");
    expect(html).toContain("Export closeout");
    expect(html).toContain("first-run-proof-closeout.md");
    expect(html).toContain("Paste public URL");
    expect(html).toContain("Run live check");
    expect(html).toContain("Release value");
    expect(html).toContain("Walkthrough video has a buyer-facing HTTPS URL");
    expect(html).toContain("Public value release");
    expect(html).toContain("¥1,756,000/month stays internal");
    expect(html).toContain("Value locked");
    expect(html).toContain("Shareable ¥0");
    expect(html).toContain("Locked ¥1,756,000");
    expect(html).toContain("Do not cite the measured monthly value externally");
    expect(html).toContain("Release memo");
    expect(html).toContain("Verify packet");
    expect(html).toContain("Live proof freshness");
    expect(html).toContain("No-send lock");
    expect(html).toContain("Reviewer packet");
    expect(html).toContain("Reviewer note stays internal");
    expect(html).toContain("Internal only");
    expect(html).toContain("Platform lead value proof packet needs proof repair");
    expect(html).toContain("Copy reviewer note");
    expect(html).toContain("Export reviewer note");
    expect(html).toContain("first-run-reviewer-packet.md");
    expect(html).toContain("1/3 proof links verified live");
    expect(html).toContain("Live repair runbook");
    expect(html).toContain("Repair work orders are ready");
    expect(html).toContain("3 immediate repairs and 0 follow-up checks are packaged for owner handoff.");
    expect(html).toContain("Publication owner owns the first repair.");
    expect(html).toContain("Attach Walkthrough video");
    expect(html).toContain("Repair Pilot receipt");
    expect(html).toContain("Rerun public value release gate");
    expect(html).toContain("Acceptance:");
    expect(html).toContain("Copy live runbook");
    expect(html).toContain("Export live runbook");
    expect(html).toContain("first-run-live-repair-runbook.md");
    expect(html).toContain("Global public proof manifest");
    expect(html).toContain("Global public proof manifest is blocked");
    expect(html).toContain("1/6 proof assets are ready.");
    expect(html).toContain("Proof freshness window");
    expect(html).toContain("Recheck after repair");
    expect(html).toContain("Checked: 2026-06-25T11:30:00.000Z");
    expect(html).toContain("Recheck before: 2026-06-26T11:30:00.000Z");
    expect(html).toContain("Treat live proof as fresh for 24 hours");
    expect(html).toContain("Repair failed proof links, then reissue a fresh live proof receipt before forwarding.");
    expect(html).toContain("Deployed URL");
    expect(html).toContain("ProtoPedia URL");
    expect(html).toContain("Walkthrough video");
    expect(html).toContain("Reviewer packet");
    expect(html).toContain("Live proof audit");
    expect(html).toContain("Repair runbook");
    expect(html).toContain("Cloud Run owner");
    expect(html).toContain("ProtoPedia URL has not been attached to the proof intake.");
    expect(html).toContain("Copy manifest");
    expect(html).toContain("Export manifest");
    expect(html).toContain("first-run-global-public-proof-manifest.md");
    expect(html).toContain("External decision packet");
    expect(html).toContain("External decision packet stays internal");
    expect(html).toContain("Internal only");
    expect(html).toContain("Recipient: Publication owner");
    expect(html).toContain("4 artifacts attached");
    expect(html).toContain("¥1,756,000/month cannot be cited externally yet.");
    expect(html).toContain("Hold external send.");
    expect(html).toContain("Copy decision packet");
    expect(html).toContain("Export decision packet");
    expect(html).toContain("first-run-external-decision-packet.md");
    expect(html).toContain("Open blocker");
    expect(html).toContain("Public repair payoff");
    expect(html).toContain("¥1,756,000/month is waiting on proof repair");
    expect(html).toContain("5 public gates still block external value.");
    expect(html).toContain("5 publish blockers must close before the value claim leaves the workspace.");
    expect(html).toContain("Next action: Publication owner: Attach the ProtoPedia story URL before publication.");
    expect(html).not.toContain("Global submission manifest");
    expect(html).not.toContain("Submission owner");
    expect(html).not.toContain("final submission");
    expect(html).toContain("Copy payoff");
    expect(html).toContain("Export payoff");
    expect(html).toContain("first-run-public-repair-payoff.md");
    expect(html).toContain("Open repair");
    expect(html).toContain("Repair impact simulator");
    expect(html).toContain("Choose repairs to see value unlock");
    expect(html).toContain("0/5 repairs simulated");
    expect(html).toContain("¥0/month shareable");
    expect(html).toContain("Locked after simulation: ¥1,756,000/month");
    expect(html).toContain("External packet stays internal until at least one repair is selected.");
    expect(html).toContain("Repair acceptance plan");
    expect(html).toContain("Close the public proof contract in order");
    expect(html).toContain("¥1,756,000/month stays internal until 5 gates pass with receipts attached.");
    expect(html).toContain("Close first");
    expect(html).toContain("ProtoPedia URL changes to ready in the global public proof manifest.");
    expect(html).toContain("¥1,756,000/month stays locked until this and 4 later gates close.");
    expect(html).toContain("Open acceptance input");
    expect(html).toContain("first-run-repair-impact-protopedia-url");
    expect(html).toContain("Select all repairs");
    expect(html).toContain("Reset simulation");
    expect(html).toContain("Copy simulation");
    expect(html).toContain("Export simulation");
    expect(html).toContain("first-run-repair-impact-simulation.md");
    expect(html).toContain("Buyer decision rehearsal");
    expect(html).toContain("Buyer decision is held before external sharing");
    expect(html).toContain("Recommended decision");
    expect(html).toContain("Decision: stop");
    expect(html).toContain("Do not send the acceptance path externally.");
    expect(html).toContain("Copy decision rehearsal");
    expect(html).toContain("Export decision rehearsal");
    expect(html).toContain("first-run-buyer-decision-rehearsal.md");
    expect(html).toContain("Open decision route");
    expect(html).toContain("Attachment contract");
    expect(html).toContain("Keep the follow-up internal:");
    expect(html).toContain("attachments are send-ready");
    expect(html).toContain("Public proof manifest");
    expect(html).toContain("Fresh live proof");
    expect(html).toContain("Open attachment");
    expect(html).toContain("Buyer question answers");
    expect(html).toContain("Buyer answers stay internal until proof closes");
    expect(html).toContain("Internal answers only");
    expect(html).toContain("Current question");
    expect(html).toContain("Do not cite the monthly value externally yet.");
    expect(html).toContain("Copy answers");
    expect(html).toContain("Export answers");
    expect(html).toContain("first-buyer-question-answer-board.md");
    expect(html).toContain("Open proof");
    expect(html).toContain("Buyer approval checklist");
    expect(html).toContain("Buyer approval is blocked by proof conditions");
    expect(html).toContain("Do not ask for approval yet.");
    expect(html).toContain("Value can be cited");
    expect(html).toContain("Receipts verify outside workspace");
    expect(html).toContain("Decision route is bounded");
    expect(html).toContain("Meeting ask is safe");
    expect(html).toContain("Buyer package has attachments");
    expect(html).toContain("Copy checklist");
    expect(html).toContain("Export checklist");
    expect(html).toContain("first-buyer-approval-checklist.md");
    expect(html).toContain("Open condition");
    expect(html).toContain("Public proof inputs");
    expect(html).toContain("Replace sample proof with your public URLs");
    expect(html).toContain("first-run-proof-input-videoUrl");
    expect(html).toContain("value=\"\"");
    expect(html).toContain("Walkthrough video");
    expect(html).toContain("No buyer-facing HTTPS URL is attached.");
    expect(html).toContain("Pilot receipt");
    expect(html).toContain("Public URL responded with HTTP 403");
    expect(html).toContain("#pilot-run-receipt");
    expect(html).toContain("Repair slot");
  });

  test("keeps the first-screen proof entry blocked when any buyer-visible proof rail blocks send", () => {
    const snapshot = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold")
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.headline).toBe("First buyer blocker is visible before send");
    expect(snapshot.proofScore).toBe(59);
    expect(snapshot.readyCount).toBe(0);
    expect(snapshot.blockedCount).toBe(4);
    expect(snapshot.primaryAction).toMatchObject({ label: "Fix live proof", href: "#buyer-proof-intake" });
    expect(snapshot.items.map((item) => [item.id, item.status])).toEqual([
      ["buyer-decision", "blocked"],
      ["value-proof", "blocked"],
      ["public-proof", "blocked"],
      ["handoff", "blocked"]
    ]);
    expect(snapshot.items.find((item) => item.id === "public-proof")).toMatchObject({
      title: "58/100 Public product surface",
      actionLabel: "Fix public proof"
    });
    expect(snapshot.nextMove).toMatchObject({
      id: "public-proof",
      status: "blocked",
      label: "Next proof move",
      headline: "Close public proof before buyer sharing",
      owner: "Proof owner"
    });
    expect(snapshot.nextMove.command).toContain("Fix live proof");
    expect(snapshot.nextMove.buyerImpact).toContain("Platform lead cannot trust the room until public proof is backed by evidence");
    expect(snapshot.nextMove.acceptanceCriteria).toContain("Required public proof links open without private credentials.");
    expect(snapshot.nextMove.impact).toMatchObject({
      currentScore: 59,
      projectedScore: 73,
      scoreDelta: 14,
      currentReadyCount: 0,
      projectedReadyCount: 1,
      readyDelta: 1,
      label: "+14 proof points"
    });
    expect(snapshot.nextMove.ownerPacket).toMatchObject({
      status: "blocked",
      title: "Proof owner packet for Platform lead",
      owner: "Proof owner",
      due: "Before external send",
      proofToAttach: "Public product URL, ProtoPedia story, walkthrough video, live proof audit, and repair-check receipt.",
      verificationLabel: "Open receipt verifier",
      verificationHref: "/receipt-verifier",
      shareRule: "No buyer send until this owner packet is checked, proof is re-exported, and the receipt verifier accepts the replay."
    });
    expect(snapshot.nextMove.exportMarkdown).toContain("Owner: Proof owner");
    expect(snapshot.nextMove.exportMarkdown).toContain("Estimated lift: 59/100 -> 73/100 (+14)");
    expect(snapshot.nextMove.exportMarkdown).toContain("Proof to attach: Public product URL, ProtoPedia story, walkthrough video, live proof audit, and repair-check receipt.");
    expect(snapshot.nextMove.ownerPacket.exportMarkdown).toContain("Due: Before external send");
    expect(snapshot.decisionHandoff).toMatchObject({
      recommendedDecision: "stop",
      headline: "Stop should be recorded while proof is blocked"
    });
    expect(snapshot.decisionHandoff.guardrail).toContain("issue a stop receipt");
    expect(snapshot.decisionHandoff.decisionReceipt).toMatchObject({ label: "Decision: stop", href: "/buyer-decision-receipt" });
    expect(snapshot.exportMarkdown).toContain("Blocked rails: 4");
    expect(snapshot.exportMarkdown).toContain("## Next proof move");
    expect(snapshot.exportMarkdown).toContain("Decision handoff: stop");
    expect(snapshot.exportMarkdown).toContain("[blocked] Handoff: Handoff stopped.");
    expect(snapshot.exportMarkdown).toContain("Ready rails: 0/4 -> 1/4");
    expect(snapshot.exportMarkdown).toContain("First action: Fix live proof (#buyer-proof-intake)");
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("keeps the hero buyer route internal when the first buyer blocker is still open", () => {
    const entry = buildHomepageProofEntrySnapshot({
      heroBrief: heroBuyerDecisionBriefFixture("blocked"),
      publishability: homepagePublishabilitySnapshotFixture("blocked"),
      routeLock: homepageRouteLockFixture("blocked", "hold")
    });
    const route = buildHomepageHeroProofRouteSnapshot(entry);

    expect(route.status).toBe("blocked");
    expect(route.headline).toBe("First buyer route is held on proof");
    expect(route.summary).toContain("should not receive the room until fix live proof closes");
    expect(route.scoreLine).toBe("59/100 proof / 0/4 ready");
    expect(route.primaryAction).toMatchObject({ label: "Fix live proof", href: "#buyer-proof-intake" });
    expect(route.items.map((item) => [item.id, item.status])).toEqual([
      ["value-proof", "blocked"],
      ["public-proof", "blocked"],
      ["handoff", "blocked"]
    ]);
    expect(route.exportMarkdown).toContain("First action: Fix live proof (#buyer-proof-intake)");
    expect(route.exportMarkdown).toContain("[blocked] Handoff: Handoff stopped");
    expect(JSON.stringify(route)).not.toMatch(/demo/i);
  });

  test("builds a current proof chain from workflow scope, value, measured run, live audit, and buyer decision state", () => {
    const lock: HomepageRouteLock = {
      status: "blocked",
      verdict: "hold",
      headline: "Fix the first buyer blocker",
      instruction: "Live proof must be repaired before sharing.",
      operatorLine: "Live proof health must be fixed before a buyer sees this room.",
      score: 61,
      scoreLabel: "hold-share",
      primaryAction: { label: "Fix Live proof health", href: "#buyer-proof-intake", external: false },
      secondaryAction: { label: "Open launch room", href: "/launch-room", external: false },
      routeSteps: routeStepsFixture("blocked", "hold"),
      checks: [
        { id: "buyer-decision", label: "Buyer decision", value: "hold", status: "blocked", evidence: "Buyer decision is blocked.", href: "/launch-room" },
        { id: "current-gap", label: "Current gap", value: "Live proof health", status: "blocked", evidence: "Live proof health is blocked.", href: "#buyer-proof-intake" },
        { id: "live-proof", label: "Live proof", value: "not checked", status: "blocked", evidence: "Public proof has not been checked.", href: "#launch-evidence-console" },
        { id: "artifact-closure", label: "Artifact closure", value: "3/5 ready", status: "attention", evidence: "Some artifacts still need review.", href: "#buyer-pilot-command-title" }
      ],
      handoffPacket: handoffPacketFixture("blocked", "hold")
    };
    const buyerScenario = {
      readiness: "pilot-first",
      monthlyGrossValueYen: 420000,
      paybackDays: 32,
      hardTruth: "Payback is 32 days. Keep this as a bounded pilot until evidence improves."
    } as BuyerValueScenario;
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "needs-reviewer",
      actualMinutesSavedPerRun: 46,
      acceptanceRatePercent: 83,
      measuredMonthlyHoursSaved: 12.3,
      measuredMonthlyLaborValueYen: 180000,
      measuredMonthlyValueYen: 240000,
      headline: "Name the reviewer before sharing"
    };
    const workflowReadiness: BuyerProofWorkflowReadiness = {
      decision: "needs-scope",
      headline: "Tighten scope before assigning agents",
      nextAction: "Name one target user and one bounded workflow request."
    };

    const snapshot = buildBuyerProofChainSnapshot({
      lock,
      workflowReadiness,
      buyerScenario,
      measuredRunSummary,
      workflowIntakeHref: "#marketplace-workbench",
      valueReportHref: "/buyer-value-report",
      deliveryMemoHref: "/buyer-delivery-memo",
      currentAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      decisionReceiptHref: "/buyer-decision-receipt",
      launchRoomHref: "/launch-room"
    });

    expect(snapshot.status).toBe("blocked");
    expect(snapshot.headline).toMatch(/hold sharing/i);
    expect(snapshot.gates.map((gate) => gate.id)).toEqual(["workflow-scope", "value-case", "measured-run", "live-proof-audit", "buyer-decision"]);
    expect(snapshot.gates.find((gate) => gate.id === "workflow-scope")).toMatchObject({ status: "blocked", href: "#marketplace-workbench" });
    expect(snapshot.gates.find((gate) => gate.id === "value-case")).toMatchObject({ status: "attention", href: "/buyer-value-report" });
    expect(snapshot.gates.find((gate) => gate.id === "measured-run")).toMatchObject({ status: "attention", href: "/buyer-delivery-memo" });
    expect(snapshot.gates.find((gate) => gate.id === "live-proof-audit")).toMatchObject({ status: "blocked", href: "/buyer-proof-audit" });
    expect(snapshot.gates.find((gate) => gate.id === "buyer-decision")).toMatchObject({ status: "blocked", href: "/buyer-decision-receipt" });
    expect(snapshot.actions.map((action) => action.id)).toEqual(["workflow-intake", "delivery-memo", "live-proof-audit", "trust-manifest", "decision-receipt", "launch-room"]);
    expect(snapshot.actions.find((action) => action.id === "workflow-intake")?.href).toBe("#marketplace-workbench");
    expect(snapshot.actions.find((action) => action.id === "trust-manifest")?.href).toBe("/buyer-trust-manifest");
    expect(snapshot.actions.find((action) => action.id === "decision-receipt")?.href).toBe("/buyer-decision-receipt");
    expect(snapshot.primaryAction).toMatchObject({ label: "Fix Workflow scope", href: "#marketplace-workbench" });
    expect(JSON.stringify(snapshot)).not.toMatch(/demo/i);
  });

  test("builds a current buyer proof path from workspace evidence", () => {
    const lock: HomepageRouteLock = {
      status: "attention",
      verdict: "hold",
      headline: "Review public proof before sending",
      instruction: "Sponsor review should clear proof reachability.",
      operatorLine: "Buyer packet has value evidence, but public proof needs one more reviewer check.",
      score: 74,
      scoreLabel: "sponsor-review",
      primaryAction: { label: "Review proof audit", href: "/buyer-proof-audit", external: false },
      secondaryAction: { label: "Open launch room", href: "/launch-room", external: false },
      routeSteps: routeStepsFixture("attention", "hold"),
      checks: [],
      handoffPacket: handoffPacketFixture("attention", "hold")
    };
    const workflowReadiness: BuyerProofWorkflowReadiness = {
      decision: "needs-proof",
      headline: "Workflow is useful, proof needs closure",
      nextAction: "Attach public-safe evidence before external sharing."
    };
    const buyerScenario = {
      readiness: "pilot-first",
      monthlyGrossValueYen: 958000,
      monthlyHoursSaved: 82,
      paybackDays: 19,
      hardTruth: "Payback is 19 days. Ask for sponsor review after proof closes."
    } as BuyerValueScenario;
    const measuredRun = {
      observedManualMinutes: 480,
      observedAssistedMinutes: 140,
      participants: 4,
      acceptedTasks: 5,
      totalTasks: 5,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/release-ready",
      reviewerName: "Release sponsor",
      notes: "Accepted replay"
    };
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "measured",
      actualMinutesSavedPerRun: 340,
      acceptanceRatePercent: 100,
      measuredMonthlyHoursSaved: 28.3,
      measuredMonthlyLaborValueYen: 680000,
      measuredMonthlyValueYen: 742000,
      headline: "Measured release review is ready"
    };

    const rows = buildBuyerProofPathRows({
      workflowReadiness,
      buyerScenario,
      buyerWorkOrder: {
        request: "Turn one Cloud Run release-readiness review into a buyer proof packet with owners, evidence, and stop rules.",
        targetUser: "Platform release lead",
        successMetric: "Save six hours per release review and close public proof gaps before sponsor review.",
        currentBaseline: "Release evidence is copied from tickets, CI logs, and chat threads by hand.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      measuredRun,
      measuredRunSummary,
      lock,
      workflowIntakeHref: "#marketplace-workbench",
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      launchRoomHref: "/launch-room"
    });

    expect(rows.map((row) => row.id)).toEqual(["work-order", "value-model", "measured-run", "decision-proof"]);
    expect(rows.map((row) => row.href)).toEqual(["#marketplace-workbench", "/buyer-value", "/buyer-delivery-memo", "/launch-room"]);
    expect(rows.find((row) => row.id === "work-order")).toMatchObject({
      status: "attention",
      title: "Platform release lead"
    });
    expect(rows.find((row) => row.id === "value-model")).toMatchObject({
      status: "attention",
      title: "¥958,000 / mo"
    });
    expect(rows.find((row) => row.id === "measured-run")).toMatchObject({
      status: "ready",
      title: "340m saved/run"
    });
    expect(rows.find((row) => row.id === "decision-proof")).toMatchObject({
      status: "attention",
      title: "hold"
    });
    expect(rows.find((row) => row.id === "measured-run")?.detail).toContain("480m manual to 140m assisted");
    expect(JSON.stringify(rows)).not.toMatch(/sample|demo/i);
  });

  test("turns the current proof chain into a public decision path", () => {
    const lock: HomepageRouteLock = {
      status: "blocked",
      verdict: "hold",
      headline: "Fix live proof before sending",
      instruction: "Public proof must be verified before this can leave the workspace.",
      operatorLine: "Live proof health must be fixed before a buyer sees this room.",
      score: 58,
      scoreLabel: "hold-share",
      primaryAction: { label: "Fix Live proof health", href: "#buyer-proof-intake", external: false },
      secondaryAction: { label: "Open launch room", href: "/launch-room", external: false },
      routeSteps: routeStepsFixture("blocked", "hold"),
      checks: [
        { id: "buyer-decision", label: "Buyer decision", value: "hold", status: "blocked", evidence: "Buyer decision is blocked.", href: "/launch-room" },
        { id: "current-gap", label: "Current gap", value: "Live proof health", status: "blocked", evidence: "Live proof health is blocked.", href: "#buyer-proof-intake" },
        { id: "live-proof", label: "Live proof", value: "2/5", status: "blocked", evidence: "Three public links are missing.", href: "#launch-evidence-console" },
        { id: "artifact-closure", label: "Artifact closure", value: "2/5 ready", status: "attention", evidence: "Some artifacts still need review.", href: "#buyer-pilot-command-title" }
      ],
      handoffPacket: handoffPacketFixture("blocked", "hold")
    };
    const workflowReadiness: BuyerProofWorkflowReadiness = {
      decision: "pilot-ready",
      headline: "Workflow is concrete enough for sponsor review",
      nextAction: "Open the launch room for a continue, revise, or stop decision."
    };
    const buyerScenario = {
      readiness: "pilot-first",
      monthlyGrossValueYen: 958000,
      monthlyHoursSaved: 82,
      paybackDays: 19,
      hardTruth: "Payback is 19 days. Ask for sponsor review after proof closes."
    } as BuyerValueScenario;
    const measuredRun = {
      observedManualMinutes: 480,
      observedAssistedMinutes: 140,
      participants: 4,
      acceptedTasks: 5,
      totalTasks: 5,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/release-ready",
      reviewerName: "Release sponsor",
      notes: "Accepted replay"
    };
    const measuredRunSummary: BuyerPilotMeasuredRunSummary = {
      readiness: "measured",
      actualMinutesSavedPerRun: 340,
      acceptanceRatePercent: 100,
      measuredMonthlyHoursSaved: 28.3,
      measuredMonthlyLaborValueYen: 680000,
      measuredMonthlyValueYen: 742000,
      headline: "Measured release review is ready"
    };
    const proofPath = buildBuyerProofPathRows({
      workflowReadiness,
      buyerScenario,
      buyerWorkOrder: {
        request: "Turn one Cloud Run release-readiness review into a buyer proof packet with owners, evidence, and stop rules.",
        targetUser: "Platform release lead",
        successMetric: "Save six hours per release review and close public proof gaps before sponsor review.",
        currentBaseline: "Release evidence is copied from tickets, CI logs, and chat threads by hand.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      measuredRun,
      measuredRunSummary,
      lock,
      workflowIntakeHref: "#marketplace-workbench",
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      launchRoomHref: "/launch-room"
    });
    const snapshot = buildBuyerProofChainSnapshot({
      lock,
      workflowReadiness,
      buyerScenario,
      measuredRunSummary,
      workflowIntakeHref: "#marketplace-workbench",
      valueReportHref: "/buyer-value",
      deliveryMemoHref: "/buyer-delivery-memo",
      currentAuditHref: "/buyer-proof-audit",
      trustManifestHref: "/buyer-trust-manifest",
      decisionReceiptHref: "/buyer-decision-receipt",
      launchRoomHref: "/launch-room"
    });

    const publicPath = buildBuyerPublicDecisionPath({ snapshot, proofPath });

    expect(publicPath).toMatchObject({
      status: "blocked",
      decision: "hold-internal",
      headline: "Hold public sharing until Proof audit is fixed",
      firstAction: { label: "Fix Proof audit", href: "/buyer-proof-audit", external: false }
    });
    expect(publicPath.buyerLine).toBe("Platform release lead -> ¥958,000 / mo -> 340m saved/run -> hold");
    expect(publicPath.artifacts.map((artifact) => artifact.id)).toEqual(["workflow-intake", "value-report", "delivery-memo", "proof-audit", "launch-room", "decision-receipt"]);
    expect(publicPath.artifacts.find((artifact) => artifact.id === "workflow-intake")).toMatchObject({
      status: "ready",
      href: "#marketplace-workbench"
    });
    expect(publicPath.artifacts.find((artifact) => artifact.id === "proof-audit")).toMatchObject({
      status: "blocked",
      value: "2/5",
      href: "/buyer-proof-audit"
    });
    expect(publicPath.artifacts.find((artifact) => artifact.id === "launch-room")).toMatchObject({
      status: "blocked",
      value: "hold",
      href: "/launch-room"
    });
    expect(publicPath.artifacts.find((artifact) => artifact.id === "decision-receipt")).toMatchObject({
      status: "blocked",
      value: "hold-internal",
      href: "/buyer-decision-receipt"
    });
    expect(publicPath.guardrails).toContain("Do not send externally while any public decision artifact is blocked.");
    expect(publicPath.guardrails).toContain("Keep the proof audit, trust manifest, launch room, and decision receipt attached to every external handoff.");
    expect(publicPath.copyText).toBe(publicPath.exportMarkdown);
    expect(publicPath.exportMarkdown).toContain("# Public buyer decision path");
    expect(publicPath.exportMarkdown).toContain("Decision: hold-internal");
    expect(publicPath.exportMarkdown).toContain("First action: Fix Proof audit (/buyer-proof-audit)");
    expect(publicPath.exportMarkdown).toContain("## Artifacts");
    expect(publicPath.exportMarkdown).toContain("- Workflow intake: ready");
    expect(publicPath.exportMarkdown).toContain("- Proof audit: blocked | 2/5 | /buyer-proof-audit");
    expect(publicPath.exportMarkdown).toContain("- Decision receipt: blocked | hold-internal | /buyer-decision-receipt");
    expect(publicPath.exportMarkdown).toContain("## Guardrails");
    expect(publicPath.exportMarkdown).toContain("Do not send externally while any public decision artifact is blocked.");
    expect(JSON.stringify(publicPath)).not.toMatch(/demo/i);
  });

  test("builds per-agent buyer proof signals from selection and A2A trial evidence", () => {
    const cloudRunAgent = MARKET_AGENTS.find((agent) => agent.id === "cloud-run-sre");
    expect(cloudRunAgent).toBeDefined();
    if (!cloudRunAgent) return;

    const available = buildAgentBuyerProofSignal({
      agent: cloudRunAgent,
      selected: false,
      evidenceRecords: [],
      trialPlanHref: "/agent-card-trial-plan",
      diligenceHref: "/agent-card-diligence"
    });
    expect(available).toMatchObject({
      status: "available",
      label: "Buyer-fit trial",
      value: "Cloud Run",
      actionLabel: "Plan trial"
    });

    const selected = buildAgentBuyerProofSignal({
      agent: cloudRunAgent,
      selected: true,
      evidenceRecords: [],
      trialPlanHref: "/agent-card-trial-plan",
      diligenceHref: "/agent-card-diligence"
    });
    expect(selected).toMatchObject({
      status: "selected",
      label: "Selected for pilot",
      value: "Trial needed",
      actionLabel: "Plan trial"
    });
    expect(selected.detail).toMatch(/buyer work order/i);

    const acceptedTrial: AgentTrialEvidenceRecord = {
      id: "trial-proof-cloud-run-sre",
      receiptId: "trial-cloud-run-sre",
      agentId: "cloud-run-sre",
      agentName: "Cloud Run SRE",
      skillId: "cloud-run.release-proof",
      status: "accepted",
      score: 94,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run",
      evidenceSource: "Public launch route",
      headline: "Launch proof accepted",
      summary: "Cloud Run SRE verified the launch route.",
      attachedAt: "2026-06-21T00:00:00.000Z"
    };
    const ready = buildAgentBuyerProofSignal({
      agent: cloudRunAgent,
      selected: true,
      evidenceRecords: [acceptedTrial],
      trialPlanHref: "/agent-card-trial-plan",
      diligenceHref: "/agent-card-diligence"
    });
    expect(ready).toMatchObject({
      status: "ready",
      label: "A2A trial accepted",
      value: "94/100",
      href: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run",
      actionLabel: "Open proof"
    });
    expect(ready.detail).toContain("cloud-run.release-proof");
    expect(JSON.stringify([available, selected, ready])).not.toMatch(/demo/i);
  });

  test("summarizes buyer squad handoff readiness into the first repair action", () => {
    const rows = [
      {
        id: "cloud-run-sre",
        agentName: "Cloud Run SRE",
        role: "Release owner",
        buyerTask: "Platform lead: Cloud Run delivery",
        acceptance: "Scope: release review Gate: sponsor accepts the run",
        evidence: "94/100 accepted A2A proof for cloud-run.release-proof",
        status: "proof-ready" as const,
        href: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run",
        actionLabel: "Open proof"
      },
      {
        id: "security-sentinel",
        agentName: "Security Sentinel",
        role: "Risk owner",
        buyerTask: "Platform lead: Security boundary",
        acceptance: "Scope: release review Gate: sponsor accepts the run",
        evidence: "No accepted A2A trial is attached yet.",
        status: "trial-needed" as const,
        href: "/agent-card-trial-plan",
        actionLabel: "Plan trial"
      }
    ];

    const readiness = buildBuyerSquadHandoffReadiness(rows);

    expect(readiness).toMatchObject({
      status: "needs-trials",
      label: "Trial proof missing",
      headline: "1/2 agents are proof-ready",
      proofReadyCount: 1,
      totalCount: 2,
      primaryAction: { label: "Plan trial: 1 remaining", href: "/agent-card-trial-plan" }
    });
    expect(readiness.detail).toContain("Security Sentinel");

    const ready = buildBuyerSquadHandoffReadiness(rows.map((row) => ({ ...row, status: "proof-ready" as const, evidence: "91/100 accepted A2A proof" })));
    expect(ready).toMatchObject({
      status: "ready",
      label: "Ready for buyer review",
      headline: "2/2 agents have accepted A2A proof",
      primaryAction: { label: "Open proof", href: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run" }
    });

    const scopeNeeded = buildBuyerSquadHandoffReadiness([{ ...rows[0], status: "scope-needed" as const, href: "#marketplace-workbench", actionLabel: "Finish scope" }]);
    expect(scopeNeeded).toMatchObject({
      status: "needs-scope",
      label: "Scope incomplete",
      primaryAction: { label: "Finish scope", href: "#marketplace-workbench" }
    });
    expect(JSON.stringify([readiness, ready, scopeNeeded])).not.toMatch(/demo/i);
  });

  test("builds buyer squad handoff rows from work order scope and trial proof", () => {
    const selectedAgents = MARKET_AGENTS.filter((agent) => ["cloud-run-sre", "security-sentinel"].includes(agent.id));
    const recommendation = { selected: selectedAgents } as Recommendation;
    const acceptedTrial: AgentTrialEvidenceRecord = {
      id: "trial-proof-cloud-run-sre",
      receiptId: "trial-cloud-run-sre",
      agentId: "cloud-run-sre",
      agentName: "Cloud Run SRE",
      skillId: "cloud-run.release-proof",
      status: "accepted",
      score: 94,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run",
      evidenceSource: "Public launch route",
      headline: "Launch proof accepted",
      summary: "Cloud Run SRE verified the launch route.",
      attachedAt: "2026-06-21T00:00:00.000Z"
    };

    const rows = buildBuyerSquadHandoffRows({
      recommendation,
      buyerWorkOrder: {
        request: "Turn one Cloud Run release-readiness review into a buyer proof packet with owners, evidence, and stop rules.",
        targetUser: "Platform release lead",
        successMetric: "Save six hours per release review and close public proof gaps before sponsor review.",
        currentBaseline: "Release evidence is copied from tickets, CI logs, and chat threads by hand.",
        dataSensitivity: "public",
        evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
      },
      evidenceRecords: [acceptedTrial],
      trialPlanHref: "/agent-card-trial-plan",
      workflowIntakeHref: "#marketplace-workbench"
    });

    expect(rows.map((row) => row.id)).toEqual(["cloud-run-sre", "security-sentinel"]);
    expect(rows[0]).toMatchObject({
      status: "proof-ready",
      role: "Release owner",
      href: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run",
      actionLabel: "Open proof"
    });
    expect(rows[0].buyerTask).toContain("Platform release lead");
    expect(rows[0].acceptance).toContain("Save six hours per release review");
    expect(rows[0].evidence).toContain("94/100 accepted A2A proof");
    expect(rows[1]).toMatchObject({
      status: "trial-needed",
      role: "Risk owner",
      href: "/agent-card-trial-plan",
      actionLabel: "Plan trial"
    });
    expect(rows[1].evidence).toMatch(/No accepted A2A trial/i);
    expect(JSON.stringify(rows)).not.toMatch(/demo/i);
  });

  test("builds a buyer handoff memo that can be shared outside the app", () => {
    const rows = [
      {
        id: "cloud-run-sre",
        agentName: "Cloud Run SRE",
        role: "Release owner",
        buyerTask: "Platform release lead: Cloud Run release proof",
        acceptance: "Scope: release review Gate: sponsor accepts the run",
        evidence: "94/100 accepted A2A proof for cloud-run.release-proof",
        status: "proof-ready" as const,
        href: "https://storage.googleapis.com/a2a-agent-marketplace-proof/cloud-run",
        actionLabel: "Open proof"
      },
      {
        id: "security-sentinel",
        agentName: "Security Sentinel",
        role: "Risk owner",
        buyerTask: "Platform release lead: Security boundary",
        acceptance: "Scope: release review Gate: sponsor accepts the run",
        evidence: "No accepted A2A trial is attached yet.",
        status: "trial-needed" as const,
        href: "/agent-card-trial-plan",
        actionLabel: "Plan trial"
      }
    ];
    const readiness = buildBuyerSquadHandoffReadiness(rows);
    const buyerWorkOrder = {
      request: "Turn release evidence into a sponsor-ready proof packet.",
      targetUser: "Platform release lead",
      successMetric: "Save six hours per release review.",
      currentBaseline: "Release review evidence is assembled from CI, tickets, and chat.",
      dataSensitivity: "public" as const,
      evidenceUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
    };
    const agenda = buildBuyerSquadReviewAgenda({
      readiness,
      rows,
      buyerWorkOrder
    });
    const repairRows = buildBuyerSquadTrialRepairRows({
      rows,
      buyerWorkOrder
    });
    const acceptanceMatrix = buildBuyerSquadAcceptanceMatrix({
      rows,
      buyerWorkOrder
    });
    const reviewDecision = buildBuyerSquadReviewDecision({
      readiness,
      acceptanceMatrix
    });

    const memo = buildBuyerSquadHandoffMemo({
      readiness,
      rows,
      buyerWorkOrder,
      agenda,
      repairRows,
      acceptanceMatrix,
      reviewDecision
    });

    expect(agenda.map((item) => item.id)).toEqual(["scope", "accepted-proof", "trial-gaps", "buyer-call"]);
    expect(agenda.map((item) => item.status)).toEqual(["ready", "needs-action", "needs-action", "needs-action"]);
    expect(agenda[2]).toMatchObject({
      owner: "Security Sentinel",
      decision: "Plan 1 remaining trial"
    });
    expect(repairRows).toHaveLength(1);
    expect(repairRows[0]).toMatchObject({
      agentName: "Security Sentinel",
      status: "proof-needed",
      requiredArtifact: "Buyer-safe A2A trial artifact for Platform release lead",
      actionLabel: "Plan trial"
    });
    expect(repairRows[0].responseMustInclude).toContain("receiptId");
    expect(repairRows[0].responseMustInclude).toContain("verifierUrl");
    expect(repairRows[0].responseMustInclude).toContain("reviewer role");
    expect(acceptanceMatrix.map((item) => item.status)).toEqual(["accepted", "needs-proof"]);
    expect(acceptanceMatrix[0]).toMatchObject({
      agentName: "Cloud Run SRE",
      verdict: "Accept for buyer review",
      requiredEvidence: "94/100 accepted A2A proof for cloud-run.release-proof"
    });
    expect(acceptanceMatrix[0].gates.map((gate) => `${gate.label}:${gate.status}`)).toEqual([
      "Buyer scope:pass",
      "Accepted A2A trial:pass",
      "Public artifact:pass"
    ]);
    expect(acceptanceMatrix[1]).toMatchObject({
      agentName: "Security Sentinel",
      verdict: "Trial proof required",
      requiredEvidence: "Accepted A2A trial evidence tied to: Save six hours per release review."
    });
    expect(acceptanceMatrix[1].rejectIf).toContain("accepted trial receipt");
    expect(reviewDecision).toMatchObject({
      status: "revise",
      label: "Revise before buyer",
      headline: "1/2 agents accepted for buyer review",
      owner: "Security Sentinel",
      nextAction: "Run or repair the buyer-safe A2A trial."
    });
    const decisionReceipt = buildBuyerSquadReviewDecisionReceipt({
      decision: reviewDecision,
      acceptanceMatrix,
      buyerWorkOrder
    });
    const decisionReceiptPayload = buildBuyerSquadReviewDecisionReceiptPayload({
      decision: reviewDecision,
      acceptanceMatrix,
      buyerWorkOrder
    });
    const replaySteps = buildBuyerSquadReviewReplaySteps({
      decision: reviewDecision,
      receiptPayload: decisionReceiptPayload
    });
    const operatingContract = buildBuyerSquadOperatingContract({
      decision: reviewDecision,
      receiptPayload: decisionReceiptPayload
    });
    const measurementPlan = buildBuyerSquadMeasurementPlan({
      decision: reviewDecision,
      receiptPayload: decisionReceiptPayload,
      buyerWorkOrder
    });
    const measurementPlanWithoutEvidenceUrl = buildBuyerSquadMeasurementPlan({
      decision: reviewDecision,
      receiptPayload: decisionReceiptPayload,
      buyerWorkOrder: { ...buyerWorkOrder, evidenceUrl: "" }
    });
    const valueClaimLedger = buildBuyerSquadValueClaimLedger({
      decision: reviewDecision,
      receiptPayload: decisionReceiptPayload,
      measurementPlan
    });
    const claimProofQueue = buildBuyerSquadClaimProofQueue({
      ledger: valueClaimLedger,
      measurementPlan,
      receiptPayload: decisionReceiptPayload
    });
    const claimProofPacket = buildBuyerSquadClaimProofPacket({
      queue: claimProofQueue,
      receiptPayload: decisionReceiptPayload
    });
    const repairPacket = buildBuyerSquadTrialRepairPacket({
      repairRows,
      buyerWorkOrder
    });
    expect(repairPacket).toContain("# Buyer squad trial repair packet");
    expect(repairPacket).toContain("Target user: Platform release lead");
    expect(repairPacket).toContain("Security Sentinel");
    expect(repairPacket).toContain("Response JSON shape");
    expect(repairPacket).not.toContain("proof.example.com/agent-trial");
    expect(repairPacket).toContain('"artifactUrl": "<public HTTPS A2A trial receipt artifact URL reviewers can open>"');
    expect(repairPacket).toContain('"verifierUrl": "<public verifier URL or /receipt-verifier>"');
    expect(repairPacket).toContain('"openedBy": "<buyer reviewer role>"');
    expect(repairPacket).toContain("Stop if credentials are required.");
    expect(decisionReceipt).toContain("# Buyer squad review decision receipt");
    expect(decisionReceiptPayload.receiptId).toMatch(/^buyer-squad-review-revise-[a-f0-9]{8}$/);
    expect(decisionReceiptPayload.checksumAlgorithm).toBe("fnv1a32");
    expect(decisionReceiptPayload.proofChecksum).toMatch(/^[a-f0-9]{8}$/);
    expect(decisionReceiptPayload.checksumFields).toEqual(["decision", "buyerWorkflow", "acceptedAgents", "openGaps", "evidence", "nextAction"]);
    expect(replaySteps.map((step) => step.id)).toEqual(["receipt-identity", "checksum-replay", "gap-closure", "review-record"]);
    expect(replaySteps.map((step) => step.status)).toEqual(["ready", "ready", "watch", "watch"]);
    expect(replaySteps[2].proof).toBe("1 open proof gap remains.");
    expect(replaySteps[2].action).toContain("Security Sentinel");
    expect(operatingContract).toMatchObject({
      status: "watch",
      label: "Repair before pilot",
      headline: "1 open proof gap before Platform release lead can run the squad",
      nextAction: "Run or repair the buyer-safe A2A trial."
    });
    expect(operatingContract.terms.map((term) => term.id)).toEqual(["scope-lock", "proof-floor", "decision-record", "pilot-hold"]);
    expect(operatingContract.terms.map((term) => term.status)).toEqual(["ready", "watch", "watch", "watch"]);
    expect(operatingContract.terms[1]).toMatchObject({
      owner: "Security Sentinel",
      proof: "Accepted A2A trial evidence tied to: Save six hours per release review."
    });
    expect(operatingContract.terms[2].proof).toBe(`fnv1a32:${decisionReceiptPayload.proofChecksum}`);
    expect(measurementPlan).toMatchObject({
      status: "watch",
      label: "Measurement waiting on proof",
      headline: "Repair 1 proof gap before measuring buyer value.",
      metric: "Save six hours per release review.",
      nextAction: "Run or repair the buyer-safe A2A trial."
    });
    expect(measurementPlan.steps.map((step) => step.id)).toEqual(["baseline-snapshot", "assisted-run", "outcome-check", "rollout-decision"]);
    expect(measurementPlan.steps.map((step) => step.status)).toEqual(["ready", "watch", "watch", "watch"]);
    expect(measurementPlan.steps[0]).toMatchObject({
      owner: "Platform release lead",
      measure: "Release review evidence is assembled from CI, tickets, and chat.",
      evidence: "https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order"
    });
    expect(measurementPlanWithoutEvidenceUrl.steps[0]).toMatchObject({
      status: "watch",
      evidence: "Attach the current workflow evidence URL before the measured run."
    });
    expect(measurementPlan.steps[1]).toMatchObject({
      owner: "Security Sentinel",
      evidence: "Accepted A2A trial evidence tied to: Save six hours per release review."
    });
    expect(valueClaimLedger).toMatchObject({
      status: "watch",
      label: "Claims need proof",
      headline: "Hold value claims until 1 proof gap and the measured outcome are closed.",
      nextAction: "Run or repair the buyer-safe A2A trial."
    });
    expect(valueClaimLedger.claims.map((claim) => claim.id)).toEqual(["scope-claim", "proof-claim", "outcome-claim", "rollout-claim"]);
    expect(valueClaimLedger.claims.map((claim) => claim.status)).toEqual(["ready", "watch", "watch", "watch"]);
    expect(valueClaimLedger.claims[0]).toMatchObject({
      claim: "Platform release lead has a bounded workflow and success metric.",
      releaseRule: "Can share the scoped workflow, not the outcome claim yet."
    });
    expect(valueClaimLedger.claims[2]).toMatchObject({
      claim: "The squad can claim: Save six hours per release review.",
      releaseRule: "Do not claim measured value until the sponsor can replay the receipt."
    });
    expect(claimProofQueue).toMatchObject({
      status: "watch",
      label: "Claim proof queue",
      headline: "3 value claims need evidence before public sharing."
    });
    expect(claimProofQueue.items.map((item) => item.sourceClaimId)).toEqual(["proof-claim", "outcome-claim", "rollout-claim"]);
    expect(claimProofQueue.items.map((item) => item.status)).toEqual(["watch", "watch", "watch"]);
    expect(claimProofQueue.items[0]).toMatchObject({
      owner: "Security Sentinel",
      requiredArtifact: "Accepted A2A trial artifact for Security Sentinel.",
      acceptanceGate: "Every selected agent has an accepted receipt and public artifact."
    });
    expect(claimProofQueue.items[1]).toMatchObject({
      owner: "Sponsor reviewer",
      requiredArtifact: "Measured pilot outcome receipt tied to the buyer success metric.",
      nextAction: "Do not claim measured value until the sponsor can replay the receipt."
    });
    expect(claimProofPacket).toContain("# Value claim proof packet");
    expect(claimProofPacket).toContain(`Receipt: ${decisionReceiptPayload.receiptId}`);
    expect(claimProofPacket).toContain(`Checksum: fnv1a32:${decisionReceiptPayload.proofChecksum}`);
    expect(claimProofPacket).toContain("Queue: Claim proof queue (watch)");
    expect(claimProofPacket).toContain("Claim: Execution claim");
    expect(claimProofPacket).toContain("Required artifact: Accepted A2A trial artifact for Security Sentinel.");
    expect(claimProofPacket).toContain("Acceptance gate: Every selected agent has an accepted receipt and public artifact.");
    expect(claimProofPacket).toContain("Claim: Outcome claim");
    expect(claimProofPacket).toContain('"claimId": "outcome-claim"');
    expect(claimProofPacket).not.toContain("proof.example.com/value-claim");
    expect(claimProofPacket).toContain('"artifactUrl": "<public HTTPS measured outcome artifact URL reviewers can open>"');
    expect(claimProofPacket).toContain('"verifierUrl": "<public verifier URL or /receipt-verifier>"');
    expect(claimProofPacket).toContain('"openedBy": "<buyer reviewer role>"');
    expect(claimProofPacket).toContain("Stop if the receipt checksum differs from the recorded payload.");
    expect(decisionReceipt).toContain(`Receipt: ${decisionReceiptPayload.receiptId}`);
    expect(decisionReceipt).toContain(`Checksum: fnv1a32:${decisionReceiptPayload.proofChecksum}`);
    expect(decisionReceipt).toContain("Status: revise");
    expect(decisionReceipt).toContain("Label: Revise before buyer");
    expect(decisionReceipt).toContain("Target user: Platform release lead");
    expect(decisionReceipt).toContain("Cloud Run SRE: 94/100 accepted A2A proof");
    expect(decisionReceipt).toContain("Security Sentinel: Trial proof required");
    expect(decisionReceipt).toContain("Checksum coverage");
    expect(decisionReceipt).toContain("- buyerWorkflow");
    expect(decisionReceipt).toContain("- openGaps");
    expect(decisionReceipt).toContain("Replay checklist");
    expect(decisionReceipt).toContain("Match receipt identity (ready)");
    expect(decisionReceipt).toContain("Check open gaps (watch)");
    expect(decisionReceipt).toContain("Record review outcome (watch)");
    expect(decisionReceipt).toContain("Pilot operating contract");
    expect(decisionReceipt).toContain("Contract: Repair before pilot (watch)");
    expect(decisionReceipt).toContain("Scope lock (ready)");
    expect(decisionReceipt).toContain("Proof floor (watch)");
    expect(decisionReceipt).toContain("Decision record (watch)");
    expect(decisionReceipt).toContain("Pilot hold (watch)");
    expect(decisionReceipt).toContain("Pilot measurement plan");
    expect(decisionReceipt).toContain("Plan: Measurement waiting on proof (watch)");
    expect(decisionReceipt).toContain("Baseline snapshot (ready)");
    expect(decisionReceipt).toContain("Assisted run (watch)");
    expect(decisionReceipt).toContain("Outcome check (watch)");
    expect(decisionReceipt).toContain("Rollout decision (watch)");
    expect(decisionReceipt).toContain("Buyer value claim ledger");
    expect(decisionReceipt).toContain("Ledger: Claims need proof (watch)");
    expect(decisionReceipt).toContain("Workflow claim (ready)");
    expect(decisionReceipt).toContain("Execution claim (watch)");
    expect(decisionReceipt).toContain("Outcome claim (watch)");
    expect(decisionReceipt).toContain("Rollout claim (watch)");
    expect(decisionReceipt).toContain("Value claim proof queue");
    expect(decisionReceipt).toContain("Queue: Claim proof queue (watch)");
    expect(decisionReceipt).toContain("Required artifact: Accepted A2A trial artifact for Security Sentinel.");
    expect(decisionReceipt).toContain("Required artifact: Measured pilot outcome receipt tied to the buyer success metric.");
    expect(decisionReceipt).toContain("Receipt JSON shape");
    expect(decisionReceipt).toContain('"decision": "revise"');
    expect(decisionReceipt).toContain('"checksumFields": [');
    expect(decisionReceipt).toContain(`"receiptId": "${decisionReceiptPayload.receiptId}"`);
    expect(decisionReceipt).toContain(`"proofChecksum": "${decisionReceiptPayload.proofChecksum}"`);
    expect(decisionReceipt).toContain("Record this receipt before external buyer sharing.");
    expect(decisionReceipt).toContain("Recompute the checksum over the receipt payload before accepting a forwarded receipt.");
    expect(memo).toContain("# Buyer squad handoff");
    expect(memo).toContain("Readiness: Trial proof missing");
    expect(memo).toContain("Proof-ready agents: 1/2");
    expect(memo).toContain("Target user: Platform release lead");
    expect(memo).toContain("Review agenda");
    expect(memo).toContain("Confirm buyer workflow (4 min, ready)");
    expect(memo).toContain("Assign trial gaps (5 min, needs-action)");
    expect(memo).toContain("Review decision");
    expect(memo).toContain("Decision: Revise before buyer");
    expect(memo).toContain("Owner: Security Sentinel");
    expect(memo).toContain("Pilot operating contract");
    expect(memo).toContain("Contract: Repair before pilot (watch)");
    expect(memo).toContain("Stop while Security Sentinel remains unaccepted.");
    expect(memo).toContain("Pilot measurement plan");
    expect(memo).toContain("Plan: Measurement waiting on proof (watch)");
    expect(memo).toContain("Evidence: https://storage.googleapis.com/a2a-agent-marketplace-proof/work-order");
    expect(memo).toContain("Buyer value claim ledger");
    expect(memo).toContain("Ledger: Claims need proof (watch)");
    expect(memo).toContain("Release rule: Do not claim measured value until the sponsor can replay the receipt.");
    expect(memo).toContain("Value claim proof queue");
    expect(memo).toContain("Queue: Claim proof queue (watch)");
    expect(memo).toContain("Acceptance gate: Every selected agent has an accepted receipt and public artifact.");
    expect(memo).toContain("Acceptance matrix");
    expect(memo).toContain("Cloud Run SRE: Accept for buyer review");
    expect(memo).toContain("Security Sentinel: Trial proof required");
    expect(memo).toContain("Gates: Buyer scope=pass, Accepted A2A trial=missing, Public artifact=missing");
    expect(memo).toContain("Trial repair queue");
    expect(memo).toContain("Security Sentinel: Buyer-safe A2A trial artifact for Platform release lead");
    expect(memo).toContain("Cloud Run SRE (Release owner)");
    expect(memo).toContain("94/100 accepted A2A proof");
    expect(memo).toContain("Security Sentinel (Risk owner)");
    expect(memo).toContain("Action: Plan trial (/agent-card-trial-plan)");
    expect(memo).not.toMatch(/demo/i);
    expect(repairPacket).not.toMatch(/demo/i);
    expect(decisionReceipt).not.toMatch(/demo/i);
    expect(claimProofPacket).not.toMatch(/demo/i);
  });

  test("blocks squad handoff assignment until buyer work order scope exists", () => {
    const selectedAgents = MARKET_AGENTS.filter((agent) => ["cloud-run-sre"].includes(agent.id));
    const rows = buildBuyerSquadHandoffRows({
      recommendation: { selected: selectedAgents } as Recommendation,
      buyerWorkOrder: {
        request: "",
        targetUser: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "public",
        evidenceUrl: ""
      },
      evidenceRecords: [],
      trialPlanHref: "/agent-card-trial-plan",
      workflowIntakeHref: "#marketplace-workbench"
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: "scope-needed",
      buyerTask: "Target buyer: Cloud Run配送",
      href: "#marketplace-workbench",
      actionLabel: "Finish scope"
    });
    expect(rows[0].acceptance).toMatch(/Complete buyer workflow/i);
    const readiness = buildBuyerSquadHandoffReadiness(rows);
    const agenda = buildBuyerSquadReviewAgenda({
      readiness,
      rows,
      buyerWorkOrder: {
        request: "",
        targetUser: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "public",
        evidenceUrl: ""
      }
    });
    expect(agenda.map((item) => item.status)).toEqual(["blocked", "blocked", "blocked", "blocked"]);
    expect(agenda[0].decision).toBe("Finish workflow intake");
    const matrix = buildBuyerSquadAcceptanceMatrix({
      rows,
      buyerWorkOrder: {
        request: "",
        targetUser: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "public",
        evidenceUrl: ""
      }
    });
    expect(matrix).toEqual([
      expect.objectContaining({
        agentName: "Cloud Run SRE",
        status: "blocked",
        verdict: "Scope required",
        requiredEvidence: "Complete the buyer workflow, target user, and success metric before judging this agent."
      })
    ]);
    expect(matrix[0].gates.map((gate) => gate.status)).toEqual(["blocked", "blocked", "blocked"]);
    const decision = buildBuyerSquadReviewDecision({
      readiness,
      acceptanceMatrix: matrix
    });
    expect(decision).toMatchObject({
      status: "stop",
      label: "Stop external share",
      headline: "Scope is not ready for buyer review",
      owner: "Cloud Run SRE",
      nextAction: "Finish buyer workflow scope."
    });
    const repairs = buildBuyerSquadTrialRepairRows({
      rows,
      buyerWorkOrder: {
        request: "",
        targetUser: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "public",
        evidenceUrl: ""
      }
    });
    expect(repairs).toEqual([
      expect.objectContaining({
        agentName: "Cloud Run SRE",
        status: "scope-needed",
        requiredArtifact: "Completed buyer work order",
        actionLabel: "Finish scope"
      })
    ]);
  });
});
