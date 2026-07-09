import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { verifyReceiptVerificationDeskRequest } from "../server/receiptVerificationDesk";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario, normalizeBuyerValueScenarioInput } from "../src/buyerValueScenario";
import { normalizeBuyerWorkOrderInput } from "../src/buyerWorkOrder";
import { normalizePilotRunReceiptInput } from "../src/pilotRunReceipt";
import { buildOutcomeSnapshot } from "../src/outcomeSnapshot";
import { buildWorkflowIntakeBrief, buildWorkflowIntakeReadiness, type WorkflowIntakeBriefInput } from "../src/workflowIntake";
import { buildWorkflowIntakeDraftFromText } from "../src/workflowIntakeDraft";
import { buildWorkflowIntakeShareGate, type WorkflowIntakeProofSlot } from "../src/workflowIntakeShareGate";
import { buildWorkflowLiveProofAudit } from "../src/workflowLiveProofAudit";
import type { BuyerShareGateCheckStatus, BuyerShareGateProofVerificationSummary } from "../src/buyerShareGate";
import { buildWorkflowDeliveryMemo, renderWorkflowDeliveryMemoHtml } from "../src/workflowDeliveryMemo";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "../src/publicProofUrl";
import { buildQuickBuyerValidationDecisionHandoff } from "../src/quickBuyerValidationDecisionHandoff";
import BuyerWorkflowIntakePanel, { WORKFLOW_INTAKE_STARTERS, buildWorkflowIntakePreviewRows } from "../src/BuyerWorkflowIntakePanel";
import { WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH, extractWorkflowIntakeDraft, verifyWorkflowIntakeExtractionReceiptRequest } from "../server/workflowIntakeExtractor";
import QuickBuyerEvidencePackSharePage from "../src/QuickBuyerEvidencePackSharePage";
import QuickWorkflowIntakePanel, {
  QUICK_WORKFLOW_INTAKE_EXAMPLE,
  QUICK_WORKFLOW_INTAKE_OUTPUTS,
  QUICK_WORKFLOW_INTAKE_PRIMARY_OUTCOMES,
  buyerAcceptancePathReplyRecordHref,
  buyerAcceptancePathValidationAnswerRecordHref,
  buyerReviewKitValidationAnswerRecordHref,
  buildQuickAppliedLaunchPacket,
  buildQuickBuyerDecisionActivationBrief,
  buildQuickBuyerDecisionSuccessCommitment,
  buildQuickBuyerDecisionReplyDeck,
  buildQuickBuyerDecisionOnePager,
  buildQuickBuyerDecisionReplyRecord,
  buildQuickBuyerValidationCallBrief,
  buildQuickBuyerValidationAnswerRecord,
  buildQuickGlobalPublishabilityBrief,
  buildQuickExternalReviewReadiness,
  buildQuickExternalReviewResponseActionPlan,
  buildQuickBuyerEvidenceDecisionReceipt,
  buildQuickBuyerEvidenceResponseImportPlan,
  verifyQuickBuyerDecisionOnePagerReceipt,
  buildQuickBuyerRoomPreview,
  buildQuickRolloutCalendarExport,
  buildQuickValueRealizationCalendarExport,
  buildQuickValueRealizationCloseout,
  buildQuickValueRealizationCloseoutRepairAcknowledgement,
  buildQuickValueRealizationAcceptancePacket,
  buildQuickValueRealizationBuyerReviewDossier,
  buildQuickValueReviewExecutionPacket,
  buildQuickValueReviewExecutionCloseout,
  buildQuickLiveProofPendingExportMarkdown,
  buildQuickLiveProofPendingMessage,
  buildQuickLiveProofAudit,
  buildQuickProofVerificationHandoff,
  buildQuickProofReplacementPacket,
  buildQuickPublicationKit,
  buildQuickPublicValueReleaseGate,
  buildQuickA2ATrialStarter,
  buildQuickVerifiedLaunchExportMarkdown,
  buildQuickVerifiedLaunchRoomHref,
  buildQuickVerifiedLaunchMessage,
  QUICK_WORKFLOW_BROWSER_DRAFT_FILENAME,
  QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM,
  buildQuickWorkflowInputReadiness,
  buildQuickWorkflowIntakeExample,
  buildQuickWorkflowBrowserDraft,
  buildQuickWorkflowPublicSafeShareDraft,
  buildQuickSharedWorkflowReviewBrief,
  parseQuickWorkflowBrowserDraftShareParam,
  quickWorkflowBrowserDraftShareHref,
  buildQuickWorkflowGuidedProofChecks,
  buildQuickWorkflowNoteFromFields,
  buildQuickWorkflowLiveBuyerCase,
  buildQuickWorkflowCommercialPilotOffer,
  buildQuickWorkflowValueDiagnosis,
  defaultQuickWorkflowGuidedFields,
  quickWorkflowReferenceGuidedFields,
  quickWorkflowGuidedProofReadyCount,
  importedQuickExternalReviewPacketFromRequestJson,
  parseQuickWorkflowBrowserDraft,
  parseQuickBuyerEvidencePackSharePayload,
  QuickPublicValueReleaseGatePanel,
  QuickSponsorSendGatePanel,
  quickWorkflowExtractionGuardrailAudit,
  quickWorkflowApplyGate,
  buyerReviewKitReplyRecordHref,
  quickProofLinksForVerification,
  withQuickProofLinkRepair
} from "../src/QuickWorkflowIntakePanel";
import QuickExternalReviewReadinessPanel from "../src/QuickExternalReviewReadinessPanel";
import QuickBuyerDecisionSuccessPanel from "../src/QuickBuyerDecisionSuccessPanel";
import QuickWorkflowBuyerExpansionPacketPanel from "../src/QuickWorkflowBuyerExpansionPacketPanel";
import QuickWorkflowPilotKickoffPackPanel from "../src/QuickWorkflowPilotKickoffPackPanel";
import QuickWorkflowPilotRunLogPanel from "../src/QuickWorkflowPilotRunLogPanel";
import QuickWorkflowValueAcceptanceContractPanel from "../src/QuickWorkflowValueAcceptanceContractPanel";
import { buildQuickBuyerDecisionReplyHandoff } from "../src/quickBuyerDecisionReplyHandoff";
import { SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH, SAMPLE_PILOT_RECEIPT_PATH, SAMPLE_WORK_ORDER_PATH } from "../src/sampleProofPaths";
import { SUBMISSION_PROOF } from "../src/submission";
import { buildValueBlueprint } from "../src/valueBlueprint";
import {
  QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM,
  QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
  QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM,
  QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM,
  decodeQuickBuyerEvidencePackShareParam,
  decodeQuickBuyerEvidenceResponseShareParam,
  decodeQuickExternalReviewPacketShareParam
} from "../src/quickExternalReviewPacketShare";
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
  quickExternalReviewDecisionReceiptChecksum,
  quickExternalReviewDecisionReceiptRequestJson,
  type QuickExternalReviewDecisionReceiptPayload
} from "../src/quickExternalReviewDecisionReceipt";
import {
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION
} from "../src/quickWorkflowConversionReceipt";
import {
  buildQuickBuyerEvidenceAuditRepairOrder,
  buildQuickBuyerEvidenceAuditReplacementCloseout,
  buildQuickBuyerEvidenceAuditReplacementWorkspace,
  buildQuickBuyerEvidenceDecisionCockpit,
  buildQuickBuyerEvidenceDecisionReceipt as buildSharedQuickBuyerEvidenceDecisionReceipt
} from "../src/quickBuyerEvidenceShare";
import { QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH } from "../src/quickBuyerValidationAnswerRecordReceipt";
import { BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM } from "../src/buyerReviewKit";
import { QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION } from "../src/quickPublicValueReleaseReceipt";
import { buildQuickWorkflowBuyerExpansionPacket } from "../src/quickWorkflowBuyerExpansionPacket";
import { buildQuickWorkflowBuyerExpansionHandoff } from "../src/quickWorkflowBuyerExpansionHandoff";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH
} from "../src/quickWorkflowBuyerExpansionHandoffReceipt";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH
} from "../src/quickWorkflowBuyerExpansionHandoffSignoffReceipt";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION,
  QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
  buildQuickWorkflowBuyerExpansionRecheckCloseout
} from "../src/quickWorkflowBuyerExpansionRecheckCloseoutReceipt";
import { verifyQuickWorkflowBuyerExpansionRecheckCloseoutRequest } from "../server/quickWorkflowBuyerExpansionRecheckCloseoutReceiptVerifier";
import { buildQuickWorkflowCommercialResponseRecord } from "../src/quickWorkflowCommercialResponse";
import { buildQuickWorkflowPilotDecisionBrief } from "../src/quickWorkflowPilotDecisionBrief";
import {
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH
} from "../src/quickWorkflowPilotDecisionBriefReceipt";
import {
  buildQuickWorkflowPilotExpansionGuardrail,
  buildQuickWorkflowPilotExpansionRecheckEvidence
} from "../src/quickWorkflowPilotExpansionGuardrail";
import {
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH
} from "../src/quickWorkflowPilotExpansionGuardrailReceipt";
import { buildQuickWorkflowPilotKickoffPack } from "../src/quickWorkflowPilotKickoffPack";
import { buildQuickWorkflowPilotRunLog } from "../src/quickWorkflowPilotRunLog";
import {
  QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
  QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH
} from "../src/quickWorkflowPilotRunLogReceipt";
import { buildQuickWorkflowValueAcceptanceContract } from "../src/quickWorkflowValueAcceptanceContract";
import {
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH
} from "../src/quickWorkflowValueAcceptanceContractReceipt";
import { verifyQuickWorkflowPilotExpansionGuardrailRequest } from "../server/quickWorkflowPilotExpansionGuardrailReceiptVerifier";
import { verifyQuickWorkflowBuyerExpansionHandoffRequest } from "../server/quickWorkflowBuyerExpansionHandoffReceiptVerifier";
import { verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest } from "../server/quickWorkflowBuyerExpansionHandoffSignoffReceiptVerifier";
import { verifyQuickWorkflowPilotDecisionBriefRequest } from "../server/quickWorkflowPilotDecisionBriefReceiptVerifier";
import { verifyQuickWorkflowValueAcceptanceContractRequest } from "../server/quickWorkflowValueAcceptanceContractReceiptVerifier";

function fnv1a32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const WORKFLOW_TEST_APP_URL = "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app";
const WORKFLOW_TEST_PROOF_BASE = "https://storage.googleapis.com/a2a-agent-marketplace-proof";
const WORKFLOW_TEST_WORK_ORDER_PROOF_URL = `${WORKFLOW_TEST_PROOF_BASE}/work-order.json`;
const WORKFLOW_TEST_PILOT_PROOF_URL = `${WORKFLOW_TEST_PROOF_BASE}/pilot-receipt.json`;
const WORKFLOW_TEST_RELEASE_PROOF_URL = `${WORKFLOW_TEST_PROOF_BASE}/release-ready.json`;
const WORKFLOW_TEST_SECURITY_PROOF_URL = `${WORKFLOW_TEST_PROOF_BASE}/security-signoff.json`;

function completeWorkflowInput(): WorkflowIntakeBriefInput {
  return {
    workOrder: {
      request: "Turn one weekly release readiness review into a buyer proof packet with owners, evidence, and stop rules.",
      targetUser: "Platform release lead",
      successMetric: "Save six hours per release and close all public proof gaps before sponsor review.",
      currentBaseline: "Release proof is copied by hand from tickets, CI logs, Cloud Run checks, and spreadsheets.",
      dataSensitivity: "public",
      evidenceUrl: WORKFLOW_TEST_RELEASE_PROOF_URL
    },
    buyerScenario: {
      teamSize: 8,
      hourlyCostYen: 12000,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 16,
      adoptionRatePercent: 75,
      incidentRiskYenPerMonth: 240000
    },
    pilotRun: {
      observedManualMinutes: 480,
      observedAssistedMinutes: 140,
      participants: 4,
      acceptedTasks: 5,
      totalTasks: 5,
      evidenceUrl: WORKFLOW_TEST_RELEASE_PROOF_URL,
      reviewerName: "Platform sponsor",
      notes: "Accepted replay"
    }
  };
}

function proofSlots(values: Partial<Record<string, string>> = {}): WorkflowIntakeProofSlot[] {
  return [
    { id: "targetUrl", label: "Deployed URL", value: values.targetUrl ?? WORKFLOW_TEST_APP_URL, href: "#launch-evidence-console" },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: values.protopediaUrl ?? "https://protopedia.net/prototype/a2a-release-ready", href: "#launch-evidence-console" },
    { id: "videoUrl", label: "Demo video", value: values.videoUrl ?? "https://youtu.be/a2a-release-ready", href: "#launch-evidence-console" },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: values.pilotEvidenceUrl ?? WORKFLOW_TEST_PILOT_PROOF_URL, href: "#pilot-run-receipt" },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: values.workOrderEvidenceUrl ?? WORKFLOW_TEST_WORK_ORDER_PROOF_URL, href: "#buyer-work-order-studio" }
  ];
}

function proofVerificationFor(
  proofLinks: Array<Pick<WorkflowIntakeProofSlot, "id" | "label" | "value">>,
  statuses: Partial<Record<string, BuyerShareGateCheckStatus>> = {}
): BuyerShareGateProofVerificationSummary {
  const results = proofLinks.map((link) => {
    const status = statuses[link.id] ?? "pass";
    return {
      id: link.id,
      label: link.label,
      status,
      httpStatus: status === "pass" ? 200 : status === "watch" ? 302 : 404,
      evidence: status === "pass" ? "HTTP 200 live verification" : status === "watch" ? "HTTP 302 requires review" : "HTTP 404 unreachable",
      action: status === "pass" ? "Keep this verified proof URL attached." : `Open a reachable public proof URL for ${link.label}.`
    };
  });
  const scoreByStatus: Record<BuyerShareGateCheckStatus, number> = {
    pass: 100,
    watch: 66,
    block: 22
  };

  return {
    checkedAt: "2026-06-21T00:00:00.000Z",
    verifiedCount: results.filter((result) => result.status === "pass").length,
    totalCount: proofLinks.length,
    score: Math.round(results.reduce((sum, result) => sum + scoreByStatus[result.status], 0) / Math.max(1, results.length)),
    results
  };
}

const workflowValueSummary = {
  monthlyGrossValueYen: 1820000,
  paybackDays: 18,
  confidenceScore: 86
};

function readyGlobalPublishabilityVerdict() {
  const draft = buildWorkflowIntakeDraftFromText(
    buildQuickWorkflowIntakeExample({
      protopediaUrl: "https://protopedia.net/prototype/release-ready",
      videoUrl: "https://youtu.be/releaseReady12345"
    })
  );
  const preview = buildQuickBuyerRoomPreview(draft, 0);
  const liveProofAudit = buildQuickLiveProofAudit({
    proofRepairPlan: preview.proofRepairPlan,
    proofVerification: proofVerificationFor(quickProofLinksForVerification(preview.proofRepairPlan))
  });
  return buildQuickGlobalPublishabilityBrief(draft, preview, undefined, undefined, undefined, 0, {
    liveProofAudit,
    freshnessNowMs: Date.parse("2026-06-21T12:00:00.000Z")
  });
}

function externalReviewDecisionReceiptRequestJson(
  verdict: ReturnType<typeof readyGlobalPublishabilityVerdict>,
  overrides: Partial<QuickExternalReviewDecisionReceiptPayload> = {}
) {
  const payload: QuickExternalReviewDecisionReceiptPayload = {
    receiptVersion: QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERSION,
    decision: "continue",
    status: "ready",
    label: "External review continue",
    reviewerName: "Global reviewer",
    reviewerNote: "Approved after checking the packet manifest and proof order.",
    buyer: verdict.reviewPacket.manifest.buyer,
    generatedAt: "2026-06-21T12:30:00.000Z",
    manifestReceiptId: verdict.reviewPacket.manifest.receiptId,
    manifestChecksum: `fnv1a32:${verdict.reviewPacket.manifest.checksum}`,
    packetStatus: "ready",
    packetClearance: "external-review",
    testsReady: verdict.reviewPacket.readyCount,
    testsTotal: verdict.reviewPacket.totalCount,
    confidence: verdict.decisionMemo.confidenceScore,
    reviewOutcome: "Accept for external review",
    nextAction: "Send the launch certificate and reviewer brief to the sponsor.",
    proof: `Packet verifier verified; manifest ${verdict.reviewPacket.manifest.receiptId}; ${verdict.reviewPacket.readyCount}/${verdict.reviewPacket.totalCount} acceptance tests ready.`,
    ...overrides
  };
  const request = {
    checksum: quickExternalReviewDecisionReceiptChecksum(payload),
    payload
  };
  return quickExternalReviewDecisionReceiptRequestJson(request);
}

describe("workflow intake", () => {
  test("quick workflow intake is a visible first-run value path", () => {
    const source = readFileSync(new URL("../src/QuickWorkflowIntakePanel.tsx", import.meta.url), "utf8");
    const commercialPanelSource = readFileSync(new URL("../src/QuickWorkflowCommercialPilotOfferPanel.tsx", import.meta.url), "utf8");
    const proofPreflightSource = readFileSync(new URL("../src/QuickProofPreflightPanel.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
    const validationBriefStart = source.indexOf('className={cx("quick-buyer-validation-call-brief"');
    const intakeActionsStart = source.indexOf('className="quick-workflow-intake-actions"', validationBriefStart);
    const html = renderToStaticMarkup(
      createElement(QuickWorkflowIntakePanel, {
        currentOpenCount: 6,
        currentPrimaryAction: "Public deployment: Save the deployed URL that an external reviewer can open.",
        onApplyDraft: () => undefined
      })
    );

    expect(QUICK_WORKFLOW_INTAKE_OUTPUTS.map((output) => output.label)).toEqual([
      "Buyer room preview",
      "Evidence pack",
      "Buyer value map",
      "Buyer validation script",
      "Proof repair plan",
      "Claim-proof ledger",
      "Procurement matrix",
      "Adoption success plan",
      "Rollout command board",
      "Decision close pack",
      "Pilot-week packet",
      "Publication kit",
      "Reviewer decision memo"
    ]);
    expect(QUICK_WORKFLOW_INTAKE_PRIMARY_OUTCOMES.map((outcome) => outcome.label)).toEqual([
      "Buyer decision room",
      "Proof repair queue",
      "Pilot-week packet"
    ]);
    expect(html).toContain('id="quick-workflow-intake"');
    expect(html).toContain("Start with your workflow");
    expect(html).toContain("Paste one workflow note to replace 6 repair items");
    expect(html).toContain("Continue, revise, or stop");
    expect(html).toContain("Every gap has an owner");
    expect(html).toContain("Tasks, kickoff, receipt");
    expect(html).toContain("Input readiness");
    expect(html).toContain("0/6 buyer facts");
    expect(html).toContain("Paste a workflow note with buyer, value, proof, and data boundary.");
    expect(html).toContain("Guided workflow builder");
    expect(html).toContain("0/8 core facts / 0/5 proof URLs");
    expect(html).toContain("Deployed URL");
    expect(html).toContain("ProtoPedia URL");
    expect(html).toContain("Pilot receipt URL");
    expect(html).toContain("Work order proof URL");
    expect(html).toContain("A2A trial receipt");
    expect(html).toContain("Public proof quality");
    expect(html).toContain("0/5 buyer-facing URLs");
    expect(html).toContain("Attach deployed url as a public https URL.");
    expect(html).toContain("Buyer readiness checks");
    expect(html).toContain("Preview buyer room");
    expect(html).toContain("Load public brief");
    expect(html).toContain("Local draft");
    expect(html).toContain("Draft saves in this browser");
    expect(html).toContain("Your workflow note, guided facts, and preview stay available after refresh.");
    expect(html).toContain("Import draft");
    expect(html).toContain("Import workflow draft JSON");
    expect(html).toContain("Generated artifact audit");
    expect(html).toContain("Preview unlocks the generated artifact set");
    expect(html).toContain("No artifact is counted as real until the workflow note is parsed.");
    expect(html).toContain("Buyer room preview");
    expect(html).toContain("Evidence pack");
    expect(html).toContain("Buyer value map");
    expect(html).toContain("Buyer validation script");
    expect(html).toContain("Proof repair plan");
    expect(html).toContain("Claim-proof ledger");
    expect(html).toContain("Procurement matrix");
    expect(html).toContain("Adoption success plan");
    expect(html).toContain("Rollout command board");
    expect(html).toContain("Decision close pack");
    expect(html).toContain("Pilot-week packet");
    expect(html).toContain("Publication kit");
    expect(source).toContain("buildQuickBuyerValidationCallBrief(roomPreview, validationAnswerRecord)");
    expect(source).toContain("Buyer validation call brief");
    expect(source).toContain("Buyer validation answer capture");
    expect(source).toContain("value={buyerValidationAnswerText}");
    expect(source).toContain("setBuyerValidationAnswerText(event.target.value)");
    expect(source).toContain("recommendedBuyerDecision");
    expect(source).toContain("<QuickWorkflowCommercialPilotOfferPanel");
    expect(source).toContain("readiness={inputReadiness}");
    expect(source).toContain("valueDiagnosis={valueDiagnosis}");
    expect(commercialPanelSource).toContain("QuickWorkflowBuyerExpansionPacketPanel");
    expect(commercialPanelSource).toContain("buildQuickWorkflowBuyerExpansionPacket");
    expect(commercialPanelSource).toContain("onExpansionGuardrailChange={setPilotExpansionGuardrail}");
    expect(commercialPanelSource).toContain("quickWorkflowPilotDraftStorageKey");
    expect(commercialPanelSource).toContain("Pilot packet draft");
    expect(commercialPanelSource).toContain("evidenceText={pilotDraftState.runEvidenceText}");
    expect(commercialPanelSource).toContain("expansionDraft={pilotDraftState.expansion}");
    expect(commercialPanelSource).toContain("QuickWorkflowValueAcceptanceContractPanel");
    expect(commercialPanelSource).toContain("<QuickWorkflowValueAcceptanceContractPanel");
    expect(source).toContain("quick-buyer-validation-decision");
    expect(source).toContain('const QuickBuyerValidationDecisionHandoffPanel = lazy(() => import("./QuickBuyerValidationDecisionHandoffPanel"))');
    expect(source).toContain("<QuickBuyerValidationDecisionHandoffPanel");
    expect(source).toContain("Full recorder");
    expect(source).toContain('const QuickProofPreflightPanel = lazy(() => import("./QuickProofPreflightPanel"))');
    expect(source).toContain("<QuickProofPreflightPanel");
    expect(source).toContain("proofPreflightRepairItems");
    expect(source).toContain("repairItems={proofPreflightRepairItems}");
    expect(source).toContain('.filter((item) => item.status !== "ready").slice(0, 3)');
    expect(proofPreflightSource).toContain("quick-proof-preflight-repair");
    expect(proofPreflightSource).toContain("const nextRepair = repairItems[0]");
    expect(proofPreflightSource).toContain("className={item.status}");
    expect(proofPreflightSource).toContain("Next repair");
    expect(proofPreflightSource).toContain("Live check");
    expect(proofPreflightSource).toContain("onProofLinkChange(item.id, event.target.value)");
    expect(styles).toContain(".quick-proof-preflight-repair label.watch");
    expect(source).not.toContain("roomPreview.proofRepairPlan.items.slice(1, 3)");
    expect(source).not.toContain("Next open");
    expect(proofPreflightSource).not.toContain("Next open");
    expect(source).toContain("id={QUICK_BUYER_VALIDATION_RECORDER_ID}");
    expect(validationBriefStart).toBeGreaterThan(-1);
    expect(intakeActionsStart).toBeGreaterThan(validationBriefStart);
    expect(styles).toContain(".quick-buyer-validation-call-brief");
    expect(styles).toContain(".quick-buyer-validation-call-answers");
    expect(styles).toContain(".quick-buyer-validation-call-capture");
    expect(styles).toContain(".quick-buyer-validation-call-capture textarea");
    expect(styles).toContain(".quick-buyer-validation-call-capture aside .quick-buyer-validation-decision");
    expect(styles).toContain(".quick-buyer-validation-handoff");
    expect(styles).toContain(".quick-buyer-validation-handoff-steps");
    expect(styles).toContain(".quick-buyer-validation-call-actions");
    expect(styles).toContain(".quick-proof-preflight-repair");
    expect(styles).toContain(".quick-proof-preflight-repair input");
    expect(styles).toContain(".quick-buyer-validation-call-brief,\n  .quick-buyer-validation-call-answers,\n  .quick-buyer-validation-call-capture {\n    grid-template-columns: 1fr;");
  });

  test("buyer workflow intake evidence field explains placeholder proof hosts", () => {
    const input = completeWorkflowInput();
    const placeholderEvidenceUrl = "https://proof.your-company.com/receipts/pilot-run";
    const workOrder = normalizeBuyerWorkOrderInput({
      ...input.workOrder,
      evidenceUrl: placeholderEvidenceUrl
    });
    const buyerScenarioInput = normalizeBuyerValueScenarioInput(input.buyerScenario);
    const pilotRun = normalizePilotRunReceiptInput({
      ...input.pilotRun,
      evidenceUrl: placeholderEvidenceUrl
    });
    const projectBrief = buildWorkflowIntakeBrief({ workOrder, buyerScenario: buyerScenarioInput, pilotRun });
    const recommendation = recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist"], 140);
    const buyerScenario = buildBuyerValueScenario(recommendation, buyerScenarioInput);

    const html = renderToStaticMarkup(
      createElement(BuyerWorkflowIntakePanel, {
        projectBrief,
        workOrder,
        buyerScenario,
        buyerScenarioInput,
        pilotRun,
        proofLinks: proofSlots(),
        proofVerification: null,
        proofVerifyStatus: "idle",
        proofVerifyError: "",
        launchRoomHref: "#launch-room",
        buyerProofAuditHref: "#buyer-proof-audit",
        buyerDeliveryMemoHref: "#buyer-delivery-memo",
        buyerTrustManifestHref: "#buyer-trust-manifest",
        buyerDecisionReceiptHref: "#buyer-decision-receipt",
        onApplyBrief: () => undefined,
        onProofLinkChange: () => undefined,
        onVerifyProofLinks: () => undefined,
        onCopyText: async () => true,
        onWorkOrderChange: () => undefined,
        onBuyerScenarioChange: () => undefined,
        onPilotRunChange: () => undefined
      })
    );

    expect(html).toContain("workflow-intake-evidence is-risk");
    expect(html).toContain("Replace the placeholder proof host with a real public artifact URL.");
    expect(html).toContain(placeholderEvidenceUrl);
  });

  test("auto-previews the buyer room when a returned response opens the workflow intake", () => {
    const source = readFileSync(new URL("../src/QuickWorkflowIntakePanel.tsx", import.meta.url), "utf8");

    expect(source).toContain("responseReturnAutoPreviewStartedRef");
    expect(source).toContain("Returned reviewer response triggered audited local parser preview before importing the response.");
    expect(source).toContain("buyerEvidenceResponseAutoScrollDoneRef");
    expect(source).toContain("buyerEvidenceResponseIntakeRef");
    expect(source).toContain("ref={buyerEvidenceResponseIntakeRef}");
    expect(source).toContain("buyerEvidenceResponseImportTarget = buyerEvidenceResponseTarget ?? roomPreview");
    expect(source).toContain('responseReturnAutoPreviewStartedRef.current && !draft && status !== "failed"');
    expect(source).toContain('behavior: "auto"');
  });

  test("topline quick workflow opens with a real reference workflow instead of empty placeholders", () => {
    const html = renderToStaticMarkup(
      createElement(QuickWorkflowIntakePanel, {
        currentOpenCount: 6,
        currentPrimaryAction: "Public deployment: Save the deployed URL that an external reviewer can open.",
        onApplyDraft: () => undefined,
        variant: "topline"
      })
    );
    const referenceFields = quickWorkflowReferenceGuidedFields();
    const referenceNote = buildQuickWorkflowNoteFromFields(referenceFields);
    const referenceDraft = buildWorkflowIntakeDraftFromText(referenceNote);
    const readiness = buildQuickWorkflowInputReadiness(referenceNote, referenceDraft);

    expect(referenceFields).toMatchObject({
      buyer: "Platform release lead",
      deployedUrl: SUBMISSION_PROOF.deployedUrl,
      pilotEvidenceUrl: `${SUBMISSION_PROOF.deployedUrl}${SAMPLE_PILOT_RECEIPT_PATH}`,
      workOrderEvidenceUrl: `${SUBMISSION_PROOF.deployedUrl}${SAMPLE_WORK_ORDER_PATH}`
    });
    expect(quickWorkflowGuidedProofReadyCount(referenceFields)).toBe(3);
    expect(readiness).toMatchObject({
      status: "ready",
      readyCount: 6,
      totalCount: 6
    });
    expect(html).toContain("6/6 buyer facts ready for preview");
    expect(html).toContain("6/6 buyer facts");
    expect(html).toContain("8/8 core facts / 3/5 proof URLs");
    expect(html).toContain("Platform release lead");
    expect(html).toContain("Value diagnosis");
    expect(html).toContain("Proof repair queue");
    expect(html).toContain("Preview buyer room");
    expect(html).not.toContain("0/6 buyer facts");
    expect(html).not.toContain("0/8 core facts / 0/5 proof URLs");
    expect(html).not.toMatch(/demo/i);
    expect(html).not.toContain("Final submission gaps");
  });

  test("browser draft persistence keeps guided fields, raw note, and preview draft", () => {
    const guidedFields = {
      ...defaultQuickWorkflowGuidedFields(),
      buyer: "Revenue operations lead",
      workflow: "Weekly renewal risk review",
      deployedUrl: "https://renewals.opsbridge.ai"
    };
    const note = buildQuickWorkflowNoteFromFields(guidedFields);
    const draft = buildWorkflowIntakeDraftFromText(note);
    const saved = buildQuickWorkflowBrowserDraft(note, guidedFields, draft, "2026-06-26T08:00:00.000Z");
    const parsed = parseQuickWorkflowBrowserDraft(JSON.stringify(saved));
    const regenerated = buildQuickWorkflowBrowserDraft("", guidedFields, null, "2026-06-26T08:01:00.000Z");

    expect(parsed).toMatchObject({
      version: 1,
      savedAt: "2026-06-26T08:00:00.000Z",
      rawIntake: note,
      guidedFields: {
        buyer: "Revenue operations lead",
        workflow: "Weekly renewal risk review",
        deployedUrl: "https://renewals.opsbridge.ai",
        dataBoundary: "public"
      }
    });
    expect(parsed?.draft?.workOrder.targetUser).toBe("Revenue operations lead");
    expect(parsed?.draft?.proofLinks.targetUrl).toBe("https://renewals.opsbridge.ai");
    expect(regenerated.rawIntake).toContain("Buyer: Revenue operations lead");
    expect(regenerated.rawIntake).toContain("Deployment: https://renewals.opsbridge.ai");
  });

  test("browser draft export has a stable filename and round-trips through the parser", () => {
    const guidedFields = {
      ...defaultQuickWorkflowGuidedFields(),
      buyer: "Support operations director",
      workflow: "Escalation review before executive renewal calls",
      deployedUrl: "https://support.opsbridge.ai"
    };
    const saved = buildQuickWorkflowBrowserDraft("", guidedFields, null, "2026-06-26T08:02:00.000Z");
    const parsed = parseQuickWorkflowBrowserDraft(JSON.stringify(saved));

    expect(QUICK_WORKFLOW_BROWSER_DRAFT_FILENAME).toBe("quick-workflow-draft.json");
    expect(parsed?.rawIntake).toContain("Buyer: Support operations director");
    expect(parsed?.rawIntake).toContain("Workflow: Escalation review before executive renewal calls");
    expect(parsed?.guidedFields.deployedUrl).toBe("https://support.opsbridge.ai");
  });

  test("browser draft share link restores guided facts without embedding the preview draft", () => {
    const guidedFields = {
      ...defaultQuickWorkflowGuidedFields(),
      buyer: "Global support lead",
      workflow: "Follow-the-sun severity review",
      deployedUrl: "https://support-review.opsbridge.ai"
    };
    const note = buildQuickWorkflowNoteFromFields(guidedFields);
    const draft = buildWorkflowIntakeDraftFromText(note);
    const saved = buildQuickWorkflowBrowserDraft(note, guidedFields, draft, "2026-06-26T08:03:00.000Z");
    const href = quickWorkflowBrowserDraftShareHref(saved, "https://app.example/path?utm=judge#top");
    const url = new URL(href);
    const restored = parseQuickWorkflowBrowserDraftShareParam(url.searchParams.get(QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM));

    expect(url.hash).toBe("#quick-workflow-intake");
    expect(url.searchParams.get("utm")).toBe("judge");
    expect(restored).toMatchObject({
      savedAt: "2026-06-26T08:03:00.000Z",
      rawIntake: note,
      guidedFields: {
        buyer: "Global support lead",
        workflow: "Follow-the-sun severity review",
        deployedUrl: "https://support-review.opsbridge.ai"
      },
      draft: null
    });
  });

  test("public-safe browser draft share link omits private buyer names and proof URLs", () => {
    const guidedFields = {
      ...defaultQuickWorkflowGuidedFields(),
      buyer: "Global support lead",
      workflow: "Follow-the-sun severity review for Global support lead",
      baseline: "Manual review uses restricted customer data before handoff.",
      successMetric: "Reduce severity review time",
      reviewer: "Global support lead",
      deployedUrl: "https://support-review.opsbridge.ai",
      workOrderEvidenceUrl: "support-review.opsbridge.ai/work-order",
      dataBoundary: "restricted" as const
    };
    const note = buildQuickWorkflowNoteFromFields(guidedFields);
    const draft = buildWorkflowIntakeDraftFromText(note);
    const safeDraft = buildQuickWorkflowPublicSafeShareDraft(note, guidedFields, draft, "2026-06-26T08:04:00.000Z");
    const href = safeDraft ? quickWorkflowBrowserDraftShareHref(safeDraft, "https://app.example/path?utm=judge#top") : "";
    const restored = parseQuickWorkflowBrowserDraftShareParam(new URL(href).searchParams.get(QUICK_WORKFLOW_BROWSER_DRAFT_SHARE_PARAM));
    const serializedRestored = JSON.stringify(restored);

    expect(safeDraft).not.toBeNull();
    expect(restored).toMatchObject({
      savedAt: "2026-06-26T08:04:00.000Z",
      guidedFields: {
        buyer: "External reviewer",
        workflow: "Follow-the-sun severity review for External reviewer",
        baseline: "Manual review uses public-safe redacted evidence before handoff.",
        reviewer: "External reviewer",
        deployedUrl: "",
        workOrderEvidenceUrl: "",
        dataBoundary: "public"
      },
      draft: null
    });
    expect(restored?.rawIntake).toContain("Data boundary: public evidence only.");
    expect(restored?.rawIntake).toContain("Public-safe receipt:");
    expect(serializedRestored).not.toContain("Global support lead");
    expect(serializedRestored).not.toContain("support-review.opsbridge.ai");
    expect(serializedRestored).not.toContain("restricted customer data");
  });

  test("shared workflow review brief gives reviewers a copyable decision summary", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      "Buyer: Global support lead\nWorkflow: follow-the-sun severity review across support tickets.\nSuccess: reduce escalation review time.\nData boundary: public evidence only.\nDeployment: https://support-review.opsbridge.ai"
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const brief = buildQuickSharedWorkflowReviewBrief(preview);
    const replyDeck = buildQuickBuyerDecisionReplyDeck(preview, buildQuickBuyerDecisionOnePager(preview));
    const recommendedReply = replyDeck.options.find((option) => option.id === replyDeck.recommendedOptionId);

    expect(brief.status).toBe("blocked");
    expect(brief.headline).toContain("Global support lead");
    expect(brief.decisionLabel).toBe("Internal repair before sharing");
    expect(brief.nextOwner).toBeTruthy();
    expect(brief.nextAction).toBeTruthy();
    expect(brief.items.map((item) => item.id)).toEqual(["decision", "proof", "receipt"]);
    expect(brief.copyText).toContain("Shared workflow review");
    expect(brief.copyText).toContain("Buyer: Global support lead");
    expect(brief.copyText).toContain("Decision: Internal repair before sharing");
    expect(brief.copyText).toContain("Receipt:");
    expect(recommendedReply?.id).toBe("revise");
    expect(recommendedReply?.replyText).toContain("Decision reply: Revise");
    expect(recommendedReply?.replyText).toContain("Next owner: Proof owner");
    expect(recommendedReply?.replyText).toContain("One-pager receipt:");
  });

  test("browser draft parser rejects malformed storage and normalizes guided defaults", () => {
    expect(parseQuickWorkflowBrowserDraft(null)).toBeNull();
    expect(parseQuickWorkflowBrowserDraft("{not-json")).toBeNull();
    expect(
      parseQuickWorkflowBrowserDraft(
        JSON.stringify({
          version: 1,
          savedAt: "2026-06-26T08:00:00.000Z",
          rawIntake: "Buyer: Platform lead",
          guidedFields: {
            buyer: "Platform lead",
            dataBoundary: "secret"
          },
          draft: {
            confidence: "not-a-number"
          }
        })
      )
    ).toMatchObject({
      rawIntake: "Buyer: Platform lead",
      guidedFields: {
        buyer: "Platform lead",
        dataBoundary: "public"
      },
      draft: null
    });
  });

  test("guided workflow fields generate a source-traceable workflow note", () => {
    const note = buildQuickWorkflowNoteFromFields({
      ...defaultQuickWorkflowGuidedFields(),
      buyer: "Revenue operations lead",
      workflow: "Weekly renewal risk review turns CRM changes, support tickets, and contract notes into an approval memo.",
      baseline: "Renewal proof is copied by hand from CRM, support queues, spreadsheets, and Slack.",
      successMetric: "Save five hours per review and make every renewal decision auditable before the forecast call.",
      teamSize: "7",
      cyclesPerMonth: "4",
      manualHoursPerCycle: "9",
      adoptionRatePercent: "80",
      hourlyCostYen: "13000",
      incidentRiskYenPerMonth: "180000",
      pilotManualMinutes: "540",
      pilotAssistedMinutes: "120",
      acceptedTasks: "6",
      totalTasks: "7",
      reviewer: "Revenue sponsor",
      deployedUrl: "https://renewals.opsbridge.ai",
      protopediaUrl: "https://protopedia.net/prototype/renewal-risk-review",
      videoUrl: "https://youtu.be/renewalRisk12345",
      pilotEvidenceUrl: "https://proof.opsbridge.ai/renewal-pilot-receipt",
      workOrderEvidenceUrl: "https://proof.opsbridge.ai/renewal-work-order",
      agentTrial: "agent=Cloud Run SRE, skill=renewal.risk.proof, score 93, artifact https://proof.opsbridge.ai/a2a-renewal-trial"
    });
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);

    expect(note).toContain("Buyer: Revenue operations lead");
    expect(note).toContain("Value model: team 7 people, 4 reviews/month, manual 9 hours/review, 80% adoption");
    expect(note).toContain("Pilot: manual 540 min, assisted 120 min, 6/7 accepted tasks.");
    expect(note).toContain("Reviewer: Revenue sponsor");
    expect(note).toContain("Deployment: https://renewals.opsbridge.ai");
    expect(note).toContain("ProtoPedia: https://protopedia.net/prototype/renewal-risk-review");
    expect(note).toContain("Walkthrough: https://youtu.be/renewalRisk12345");
    expect(note).toContain("Pilot receipt: https://proof.opsbridge.ai/renewal-pilot-receipt");
    expect(note).toContain("Work order proof: https://proof.opsbridge.ai/renewal-work-order");
    expect(draft.workOrder.targetUser).toBe("Revenue operations lead");
    expect(draft.workOrder.evidenceUrl).toBe("https://proof.opsbridge.ai/renewal-work-order");
    expect(draft.proofLinks).toMatchObject({
      targetUrl: "https://renewals.opsbridge.ai",
      protopediaUrl: "https://protopedia.net/prototype/renewal-risk-review",
      videoUrl: "https://youtu.be/renewalRisk12345",
      pilotEvidenceUrl: "https://proof.opsbridge.ai/renewal-pilot-receipt",
      workOrderEvidenceUrl: "https://proof.opsbridge.ai/renewal-work-order"
    });
    expect(draft.buyerScenario).toMatchObject({
      teamSize: 7,
      cyclesPerMonth: 4,
      manualHoursPerCycle: 9,
      adoptionRatePercent: 80,
      hourlyCostYen: 13000,
      incidentRiskYenPerMonth: 180000
    });
    expect(draft.pilotRun).toMatchObject({
      observedManualMinutes: 540,
      observedAssistedMinutes: 120,
      acceptedTasks: 6,
      totalTasks: 7,
      reviewerName: "Revenue sponsor"
    });
    expect(draft.agentTrialEvidence).toMatchObject({
      agentName: "Cloud Run SRE",
      skillId: "renewal.risk.proof",
      score: 93,
      artifactUrl: "https://proof.opsbridge.ai/a2a-renewal-trial"
    });
    expect(readiness.status).toBe("ready");
    expect(readiness.items.find((item) => item.id === "scope")).toMatchObject({ status: "ready" });
    expect(valueDiagnosis.monthlyValueYen).toBeGreaterThan(250000);
    expect(valueDiagnosis).toMatchObject({
      status: "ready",
      proofReadyCount: 5,
      proofRepairCount: 0
    });
    expect(valueDiagnosis.levers.some((lever) => lever.targetAction)).toBe(false);
    expect(valueDiagnosis.exportMarkdown).toContain("Quick workflow value diagnosis");

    const offer = buildQuickWorkflowCommercialPilotOffer(draft, readiness, valueDiagnosis);
    expect(offer).toMatchObject({
      status: "ready",
      decision: "Quote a bounded paid pilot",
      priceLine: expect.stringContaining("14-day proof pilot"),
      sendRule: "Can send after a live proof verification receipt is attached."
    });
    expect(offer.suggestedPilotPriceYen).toBeGreaterThanOrEqual(50000);
    expect(offer.suggestedPilotPriceYen).toBeLessThanOrEqual(offer.pilotBudgetCeilingYen);
    expect(offer.terms.map((term) => term.id)).toEqual(["price", "cap", "send-rule", "acceptance"]);
    expect(offer.stressCases.map((stressCase) => stressCase.id)).toEqual(["base-payback", "downside-value", "approval-floor"]);
    expect(offer.stressCases.find((stressCase) => stressCase.id === "downside-value")).toMatchObject({
      status: "ready",
      buyerDecision: "Downside case still supports a paid pilot."
    });
    expect(offer.objections.map((objection) => objection.id)).toEqual(["price-defense", "proof-trust", "stop-rule"]);
    expect(offer.objections.find((objection) => objection.id === "proof-trust")).toMatchObject({
      status: "ready",
      answer: "Yes, after the live verifier issues the buyer-send receipt."
    });
    expect(offer.approvalMemo).toMatchObject({
      status: "ready",
      decision: "approve",
      score: 100,
      signer: "Finance owner + pilot sponsor"
    });
    expect(offer.decisionPacket).toMatchObject({
      status: "ready",
      mode: "buyer-ready",
      headline: "Buyer decision packet is ready",
      subject: expect.stringContaining("Approval request:")
    });
    expect(offer.decisionPacket.decisionAsk).toContain("approves");
    expect(offer.decisionPacket.attachments.map((attachment) => attachment.id)).toEqual(["offer", "public-proof", "pilot-receipt", "work-order-proof", "a2a-trial"]);
    expect(offer.decisionPacket.attachments.every((attachment) => attachment.status === "ready")).toBe(true);
    expect(offer.decisionPacket.body).toContain("Attachments to review:");
    expect(decodeURIComponent(offer.decisionPacket.exportHref.split(",")[1] ?? "")).toBe(offer.decisionPacket.exportMarkdown);
    const responseRecord = buildQuickWorkflowCommercialResponseRecord(
      offer,
      "Approved for the 14-day pilot. Please attach the live proof receipt before kickoff and send the calendar invite."
    );
    expect(responseRecord).toMatchObject({
      status: "ready",
      decision: "approved",
      headline: "Buyer approved the pilot path",
      owner: "Pilot sponsor"
    });
    expect(responseRecord.nextAction).toContain("Schedule kickoff");
    expect(responseRecord.detectedSignals).toContain("approval intent");
    expect(responseRecord.followUps.find((followUp) => followUp.id === "kickoff")).toMatchObject({
      status: "ready",
      action: "Schedule kickoff and confirm the acceptance receipt owner."
    });
    expect(decodeURIComponent(responseRecord.exportHref.split(",")[1] ?? "")).toBe(responseRecord.exportMarkdown);
    expect(offer.exportMarkdown).toContain("Quick workflow commercial pilot offer");
    expect(offer.exportMarkdown).toContain(`Pilot cap: ${valueDiagnosis.items.find((item) => item.id === "pilot-boundary")?.value.replace(" cap", "")}`);
    expect(offer.exportMarkdown).toContain("## Buyer objections");
    expect(offer.exportMarkdown).toContain("Approval memo: approve / 100/100");
    expect(offer.exportMarkdown).toContain("## Decision packet");
  });

  test("guided workflow proof count ignores demo and placeholder public-proof URLs", () => {
    expect(
      quickWorkflowGuidedProofReadyCount({
        ...defaultQuickWorkflowGuidedFields(),
        deployedUrl: "https://your-service.run.app",
        protopediaUrl: "https://protopedia.net/prototype/...",
        videoUrl: "https://youtu.be/...",
        pilotEvidenceUrl: "https://proof.example.com/pilot-receipt",
        workOrderEvidenceUrl: "https://artifact.invalid/work-order"
      })
    ).toBe(0);

    expect(
      quickWorkflowGuidedProofReadyCount({
        ...defaultQuickWorkflowGuidedFields(),
        deployedUrl: "https://renewals.opsbridge.ai",
        protopediaUrl: "https://protopedia.net/prototype/renewal-risk-review",
        videoUrl: "https://youtu.be/renewalRisk12345",
        pilotEvidenceUrl: "https://proof.opsbridge.ai/renewal-pilot-receipt",
        workOrderEvidenceUrl: "https://proof.opsbridge.ai/renewal-work-order"
      })
    ).toBe(5);
  });

  test("guided workflow proof checks explain which proof URL must be repaired", () => {
    const placeholderChecks = buildQuickWorkflowGuidedProofChecks({
      ...defaultQuickWorkflowGuidedFields(),
      deployedUrl: "https://your-service.run.app",
      protopediaUrl: "https://protopedia.net/prototype/...",
      videoUrl: "https://youtu.be/...",
      pilotEvidenceUrl: "https://proof.example.com/pilot-receipt",
      workOrderEvidenceUrl: "https://artifact.invalid/work-order"
    });

    expect(placeholderChecks.map((check) => [check.id, check.status])).toEqual([
      ["targetUrl", "watch"],
      ["protopediaUrl", "watch"],
      ["videoUrl", "watch"],
      ["pilotEvidenceUrl", "watch"],
      ["workOrderEvidenceUrl", "watch"]
    ]);
    expect(placeholderChecks.find((check) => check.id === "targetUrl")).toMatchObject({
      label: "Deployed URL",
      action: "Replace the placeholder deployment host with a real public artifact URL reviewers can open."
    });
    expect(placeholderChecks.find((check) => check.id === "videoUrl")).toMatchObject({
      action: "Replace the placeholder proof URL with a real public artifact URL reviewers can open."
    });

    const readyChecks = buildQuickWorkflowGuidedProofChecks({
      ...defaultQuickWorkflowGuidedFields(),
      deployedUrl: "https://renewals.opsbridge.ai",
      protopediaUrl: "https://protopedia.net/prototype/renewal-risk-review",
      videoUrl: "https://youtu.be/renewalRisk12345",
      pilotEvidenceUrl: "https://proof.opsbridge.ai/renewal-pilot-receipt",
      workOrderEvidenceUrl: "https://proof.opsbridge.ai/renewal-work-order"
    });

    expect(readyChecks.every((check) => check.status === "ready" && check.action === "Ready for live proof verification.")).toBe(true);
  });

  test("quick workflow intake example updates the workspace with buyer value inputs", () => {
    expect(QUICK_WORKFLOW_INTAKE_EXAMPLE).not.toMatch(/demo/i);
    expect(QUICK_WORKFLOW_INTAKE_EXAMPLE).not.toContain("release-ready.example.com");
    expect(QUICK_WORKFLOW_INTAKE_EXAMPLE).not.toContain("proof.example.com");

    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const workOrder = normalizeBuyerWorkOrderInput(draft.workOrder);
    const buyerScenario = normalizeBuyerValueScenarioInput(draft.buyerScenario);
    const pilotRun = normalizePilotRunReceiptInput(draft.pilotRun);
    const brief = buildWorkflowIntakeBrief({ workOrder, buyerScenario, pilotRun });
    const readiness = buildWorkflowIntakeReadiness({ workOrder, buyerScenario, pilotRun });
    const proofBaseUrl = SUBMISSION_PROOF.deployedUrl;

    expect(draft.confidence).toBeGreaterThanOrEqual(80);
    expect(draft.detectedSignals).toEqual(
      expect.arrayContaining(["workflow request", "target buyer", "success metric", "ROI assumptions", "measured minutes", "accepted tasks", "public evidence URL", "accepted A2A trial receipt"])
    );
    expect(draft.sourceTrace.map((item) => item.id)).toEqual(["buyer", "workflow", "baseline", "success", "value-model", "pilot-run", "public-proof", "agent-trial", "data-boundary"]);
    expect(draft.sourceTrace.find((item) => item.id === "workflow")).toMatchObject({
      status: "traced",
      sourceLineNumber: 2
    });
    expect(draft.sourceTrace.find((item) => item.id === "public-proof")).toMatchObject({
      status: "traced"
    });
    expect(workOrder.targetUser).toBe("Platform release lead");
    expect(workOrder.dataSensitivity).toBe("public");
    expect(workOrder.evidenceUrl).toBe(`${proofBaseUrl}${SAMPLE_WORK_ORDER_PATH}`);
    expect(draft.proofLinks).toMatchObject({
      targetUrl: proofBaseUrl,
      pilotEvidenceUrl: `${proofBaseUrl}${SAMPLE_PILOT_RECEIPT_PATH}`,
      workOrderEvidenceUrl: `${proofBaseUrl}${SAMPLE_WORK_ORDER_PATH}`
    });
    expect(draft.proofLinks.protopediaUrl).toBeUndefined();
    expect(draft.proofLinks.videoUrl).toBeUndefined();
    expect(draft.agentTrialEvidence).toMatchObject({
      agentName: "Cloud Run SRE",
      skillId: "cloudrun.release-proof",
      score: 94,
      artifactUrl: `${proofBaseUrl}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`
    });
    expect(buyerScenario).toMatchObject({
      teamSize: 8,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 28,
      adoptionRatePercent: 75,
      hourlyCostYen: 12000,
      incidentRiskYenPerMonth: 240000
    });
    expect(pilotRun).toMatchObject({
      observedManualMinutes: 1680,
      observedAssistedMinutes: 560,
      participants: 4,
      acceptedTasks: 5,
      totalTasks: 5,
      reviewerName: "Platform sponsor",
      notes: "observed run completed with public receipt, accepted tasks, and sponsor stop rule reviewed."
    });
    expect(pilotRun.evidenceUrl).toBe(`${proofBaseUrl}${SAMPLE_PILOT_RECEIPT_PATH}`);
    expect(brief).toContain("1120 minutes saved/run");
    expect(readiness.decision).not.toBe("do-not-share");
  });

  test("quick workflow preview gives the sponsor a send gate before workspace apply", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft);
    const gate = preview.sponsorSendGate;
    const html = renderToStaticMarkup(createElement(QuickSponsorSendGatePanel, { gate }));

    expect(gate).toMatchObject({
      status: "watch",
      decision: "repair-before-sponsor",
      label: "Repair before sponsor",
      readyCount: 3,
      totalCount: 5,
      nextOwner: "Proof owner",
      sourceReceiptId: preview.conversionReceipt.receiptId,
      sourceChecksum: `${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`
    });
    expect(gate.score).toBeGreaterThanOrEqual(80);
    expect(gate.checks.map((check) => [check.id, check.status])).toEqual([
      ["value", "ready"],
      ["proof", "watch"],
      ["trust", "ready"],
      ["data", "ready"],
      ["approval", "watch"]
    ]);
    expect(gate.receipt.receiptId).toMatch(/^quick-sponsor-gate-repair-before-sponsor-[a-f0-9]{8}$/);
    expect(gate.receiptHref).toContain("quick-sponsor-send-gate.v1");
    expect(gate.summary).not.toContain("..");
    expect(gate.exportMarkdown).toContain("# Sponsor send gate");
    expect(gate.exportMarkdown).toContain(`Source receipt: ${preview.conversionReceipt.receiptId}`);
    expect(preview.exportMarkdown).toContain("## Sponsor send gate");
    expect(html).toContain("Sponsor send gate");
    expect(html).toContain("Gate memo");
    expect(html).toContain("Gate receipt");
    expect(html).toContain("Verify source");
    expect(html).toContain("3/5 checks ready");
    expect(html).toContain(preview.conversionReceipt.receiptId);
    expect(JSON.stringify(gate)).not.toMatch(/demo/i);
  });

  test("quick workflow preview shows the public value still locked by proof and publication gates", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft);
    const publicationKit = buildQuickPublicationKit(draft, preview);
    const gate = buildQuickPublicValueReleaseGate({ preview, publicationKit });
    const html = renderToStaticMarkup(createElement(QuickPublicValueReleaseGatePanel, { gate }));

    expect(gate).toMatchObject({
      status: "blocked",
      label: "Value locked",
      releaseScore: 50,
      shareableMonthlyValueYen: 0,
      lockedMonthlyValueYen: 328000,
      nextOwner: "Recording owner",
      nextAction: "Record the five-shot walkthrough and attach a public video URL.",
      sourceReceiptId: preview.conversionReceipt.receiptId,
      sourceChecksum: `${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`
    });
    expect(gate.headline).toBe("¥328,000/month is not shareable yet");
    expect(gate.summary).toContain("¥328,000/month remains internal");
    expect(gate.releaseRule).toContain("Do not cite the monthly value externally");
    expect(gate.checks.map((check) => [check.id, check.status, check.value])).toEqual([
      ["value", "ready", "¥328,000/month"],
      ["sponsor", "watch", "Repair before sponsor / 85/100"],
      ["publication", "blocked", "1/4 items ready"],
      ["live-proof", "blocked", "No fresh proof receipt"]
    ]);
    expect(gate.exportMarkdown).toContain("# Public value release gate");
    expect(gate.exportMarkdown).toContain("Locked monthly value: ¥328,000");
    expect(gate.exportMarkdown).toContain(`Source receipt: ${preview.conversionReceipt.receiptId}`);
    expect(gate.receipt.receiptId).toMatch(/^quick-public-value-blocked-[a-f0-9]{8}$/);
    expect(gate.receipt.payload).toMatchObject({
      receiptVersion: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERSION,
      status: "blocked",
      releaseScore: 50,
      lockedMonthlyValueYen: 328000,
      sourceReceiptId: preview.conversionReceipt.receiptId,
      sponsorGateReceiptId: preview.sponsorSendGate.receipt.receiptId,
      publicationReadyCount: 1,
      publicationTotalCount: 4
    });
    expect(gate.receipt.verification.status).toBe("verified");
    expect(gate.receipt.verificationRequestHref).toContain("data:application/json");
    const releaseVerifierUrl = new URL(gate.verifierHref, "https://example.com");
    expect(releaseVerifierUrl.pathname).toBe("/receipt-verifier");
    expect(releaseVerifierUrl.searchParams.get("request")).toBe(gate.receipt.verificationRequestJson);
    expect(releaseVerifierUrl.searchParams.get("verify")).toBe("1");
    expect(releaseVerifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(html).toContain("Public value release");
    expect(html).toContain("Release memo");
    expect(html).toContain("Release receipt");
    expect(html).toContain("Verify release");
    expect(html).toContain("/receipt-verifier?request=");
    expect(html).not.toContain(`requestKey=${gate.receipt.receiptId}`);
    expect(html).toContain("Locked ¥328,000");
    expect(JSON.stringify(gate)).not.toMatch(/demo/i);
  });

  test("quick workflow preview surfaces external review readiness from the launch certificate chain", () => {
    const verdict = readyGlobalPublishabilityVerdict();
    const readiness = buildQuickExternalReviewReadiness(verdict);
    const html = renderToStaticMarkup(createElement(QuickExternalReviewReadinessPanel, { readiness }));
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const successCommitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);
    const valueCalendar = buildQuickValueRealizationCalendarExport(successCommitment.valueRealizationLedger, "2026-06-21");

    expect(readiness).toMatchObject({
      status: "ready",
      label: "External review readiness",
      headline: "External review packet can leave the room",
      scoreLine: "100/100 launch score",
      clearance: "External review allowed",
      primaryAction: "Open the external review desk with the verified packet manifest.",
      primaryHref: verdict.reviewPacket.reviewDeskHref,
      verifyHref: verdict.reviewPacket.manifestVerifierHref
    });
    expect(readiness.repairPath).toBeNull();
    expect(readiness.sendPacket).toMatchObject({
      headline: "Sendable reviewer message is ready",
      subject: "External review packet: Platform release lead"
    });
    expect(readiness.sendPacket?.messageText).toContain("Verify the manifest");
    expect(readiness.sendPacket?.messageText).toContain(verdict.reviewPacket.reviewDeskHref);
    expect(readiness.sendPacket?.attachments.map((attachment) => attachment.label)).toEqual([
      "Review desk",
      "Manifest verifier",
      "Readiness memo",
      "Packet memo",
      "Artifact bundle",
      "Decision memo"
    ]);
    expect(readiness.sendPacket?.acceptanceCriteria).toContain("Reviewer exports a continue, revise, or stop decision receipt from the review desk.");
    expect(readiness.items.map((item) => [item.id, item.status, item.value])).toEqual([
      ["launch-certificate", "ready", "External review allowed"],
      ["review-packet", "ready", "6/6 artifacts ready"],
      ["decision-memo", "ready", "Accept for external review"],
      ["fresh-proof", "ready", "Fresh proof receipt"]
    ]);
    expect(readiness.manifestLine).toBe(
      `${verdict.reviewPacket.manifest.receiptId} / ${verdict.reviewPacket.manifest.checksumAlgorithm}:${verdict.reviewPacket.manifest.checksum}`
    );
    expect(readiness.exportMarkdown).toContain("# External review readiness");
    expect(readiness.exportMarkdown).toContain("## Readiness chain");
    expect(readiness.exportMarkdown).toContain("## Reviewer send packet");
    expect(readiness.exportMarkdown).toContain("Clearance: External review allowed");
    expect(readiness.exportMarkdown).toContain("Review packet: 6/6 artifacts ready");
    expect(html).toContain("External review readiness");
    expect(html).toContain("Reviewer send packet");
    expect(html).toContain("External review packet: Platform release lead");
    expect(html).toContain("100/100 launch score");
    expect(html).toContain("Launch certificate");
    expect(html).toContain("Review packet");
    expect(html).toContain("Decision memo");
    expect(html).toContain("Fresh proof receipt");
    expect(html).toContain("Verify manifest");
    expect(html).toContain(verdict.reviewPacket.manifest.receiptId);
    const copyHtml = renderToStaticMarkup(
      createElement(QuickExternalReviewReadinessPanel, {
        readiness,
        sendCopyLabel: "Copy message",
        onCopySendPacket: () => undefined
      })
    );
    expect(copyHtml).toContain("Copy message");
    const valueRunwayHtml = renderToStaticMarkup(
      createElement(QuickExternalReviewReadinessPanel, {
        readiness,
        decisionSuccessCommitment: successCommitment,
        valueRealizationCalendarExport: valueCalendar
      })
    );
    expect(valueRunwayHtml).toContain("Post-review value runway");
    expect(valueRunwayHtml).toContain("Value realization ledger");
    expect(valueRunwayHtml).toContain("Value CSV");
    expect(valueRunwayHtml).toContain("Calendar");
    expect(valueRunwayHtml).toContain("Ledger receipt");
    expect(valueRunwayHtml).toContain("Day 0");
    expect(valueRunwayHtml).toContain("Day 30");
    expect(valueRunwayHtml).toContain(successCommitment.valueRealizationLedger.receipt.receiptId);
    const readinessReviewCopy = [
      readiness.headline,
      readiness.summary,
      readiness.primaryAction,
      ...readiness.items.flatMap((item) => [item.label, item.value, item.detail, item.action]),
      readiness.sendPacket?.headline,
      readiness.sendPacket?.summary,
      readiness.sendPacket?.decisionAsk,
      readiness.sendPacket?.proofWindow,
      ...(readiness.sendPacket?.attachments.flatMap((attachment) => [attachment.label, attachment.detail]) ?? []),
      ...(readiness.sendPacket?.acceptanceCriteria ?? [])
    ].join("\n");
    expect(readinessReviewCopy).not.toMatch(/demo/i);
  });

  test("external review readiness keeps blocked packets internal until repair links are closed", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const verdict = buildQuickGlobalPublishabilityBrief(draft, preview);
    const readiness = buildQuickExternalReviewReadiness(verdict);
    const html = renderToStaticMarkup(createElement(QuickExternalReviewReadinessPanel, { readiness }));
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const successCommitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);

    expect(readiness).toMatchObject({
      status: "blocked",
      headline: "External review is blocked until proof is repaired",
      clearance: "Internal only",
      primaryAction: "Publish the ProtoPedia story page and attach its public URL.",
      primaryHref: "#quick-proof-repair-plan-protopediaUrl"
    });
    expect(readiness.items.find((item) => item.id === "fresh-proof")).toMatchObject({
      status: "blocked",
      value: "Live proof not run",
      href: "#quick-live-proof-audit"
    });
    expect(readiness.items.find((item) => item.id === "review-packet")).toMatchObject({
      status: "blocked",
      value: "0/6 artifacts ready"
    });
    expect(readiness.sendPacket).toBeNull();
    expect(readiness.repairPath).toMatchObject({
      status: "blocked",
      label: "First repair path",
      headline: "ProtoPedia URL unlocks the next repair gate",
      targetLabel: "ProtoPedia URL",
      owner: "Publication owner",
      action: "Publish the ProtoPedia story page and attach its public URL.",
      href: "#quick-proof-repair-plan-protopediaUrl",
      proofLinkId: "protopediaUrl",
      sampleValue: "https://protopedia.net/prototype/release-ready",
      currentScore: 40,
      projectedScore: 40,
      scoreDelta: 0,
      nextAction: "Attach a public walkthrough video showing the buyer workflow from input to proof packet."
    });
    expect(readiness.repairPath?.acceptanceCriteria).toContain("ProtoPedia story page is public and reachable without private access.");
    expect(readiness.repairPath?.verification).toContain("next open gate moves to");
    expect(readiness.exportMarkdown).toContain("Clearance: Internal only");
    expect(readiness.exportMarkdown).toContain("Primary link: #quick-proof-repair-plan-protopediaUrl");
    expect(readiness.exportMarkdown).toContain("## First repair path");
    expect(readiness.exportMarkdown).toContain("Projected score: 40/100");
    expect(readiness.exportMarkdown).not.toContain("External review allowed");
    expect(html).toContain("External review is blocked until proof is repaired");
    expect(html).toContain("First repair path");
    expect(html).toContain("ProtoPedia URL unlocks the next repair gate");
    expect(html).toContain("40/100 now to 40/100 after ProtoPedia URL");
    expect(html).toContain("Owner command");
    expect(html).toContain("Internal only");
    expect(html).toContain("#quick-proof-repair-plan-protopediaUrl");
    expect(html).not.toContain("Reviewer send packet");

    const inlineRepairHtml = renderToStaticMarkup(
      createElement(QuickExternalReviewReadinessPanel, {
        readiness,
        repairValue: "",
        onRepairValueChange: () => undefined
      })
    );
    expect(inlineRepairHtml).toContain("Repair URL");
    expect(inlineRepairHtml).toContain("protopedia.net/prototype/release-ready");
    const blockedValueRunwayHtml = renderToStaticMarkup(
      createElement(QuickExternalReviewReadinessPanel, {
        readiness,
        decisionSuccessCommitment: successCommitment
      })
    );
    expect(blockedValueRunwayHtml).not.toContain("Post-review value runway");
  });

  test("public value release requires a fresh live proof receipt, not only a verified old receipt", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft);
    const publicationKit = buildQuickPublicationKit(draft, preview);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const liveProofAudit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: proofVerificationFor(links)
    });
    const freshGate = buildQuickPublicValueReleaseGate({
      preview,
      publicationKit,
      liveProofAudit,
      freshnessNowMs: Date.parse("2026-06-21T12:00:00.000Z")
    });
    const staleGate = buildQuickPublicValueReleaseGate({
      preview,
      publicationKit,
      liveProofAudit,
      freshnessNowMs: Date.parse("2026-06-22T02:00:00.000Z")
    });

    expect(freshGate.checks.find((check) => check.id === "live-proof")).toMatchObject({
      status: "ready",
      value: "5/5 proof rows fresh",
      action: "Keep the fresh live proof receipt attached to the public value claim."
    });
    expect(staleGate.checks.find((check) => check.id === "live-proof")).toMatchObject({
      status: "blocked",
      value: "No fresh proof receipt",
      evidence: expect.stringContaining("24-hour buyer-send window has expired"),
      action: "Run live proof verification before public sharing."
    });
    expect(staleGate.releaseRule).toContain("Do not cite the monthly value externally");
  });

  test("scores quick workflow notes before preview so missing buyer facts are explicit", () => {
    const complete = buildQuickWorkflowInputReadiness(QUICK_WORKFLOW_INTAKE_EXAMPLE);

    expect(complete).toMatchObject({
      status: "ready",
      score: 100,
      readyCount: 6,
      totalCount: 6,
      headline: "Input can become a buyer room"
    });
    expect(complete.items.map((item) => item.id)).toEqual(["scope", "value-model", "measured-run", "public-proof", "data-boundary", "agent-trust"]);
    expect(complete.nextAction).toBe("Preview the buyer room and run proof verification.");
    expect(quickWorkflowApplyGate(complete, true)).toMatchObject({
      canApply: true,
      message: "Buyer-ready input can update the workspace."
    });
    expect(quickWorkflowApplyGate(complete, false)).toMatchObject({
      canApply: false,
      message: "Preview a workflow note before applying it to the workspace."
    });

    const weak = buildQuickWorkflowInputReadiness("Buyer: Ops lead\nWorkflow: Internal restricted credential cleanup.");

    expect(weak.status).toBe("blocked");
    expect(weak.score).toBeLessThan(50);
    expect(weak.items.find((item) => item.id === "data-boundary")).toMatchObject({ status: "blocked" });
    expect(weak.items.find((item) => item.id === "public-proof")).toMatchObject({ status: "blocked" });
    expect(weak.nextAction).toContain("Add buyer");
    expect(quickWorkflowApplyGate(weak, true)).toMatchObject({
      canApply: false,
      message: "Cannot apply yet: Add buyer, workflow, success metric, and current baseline."
    });
    expect(quickWorkflowApplyGate(weak, true, true)).toMatchObject({
      canApply: false,
      message: "Wait for extraction to finish before applying this workspace."
    });
  });

  test("summarizes ignored Gemini suggestions for the extraction guardrail audit", () => {
    const audit = quickWorkflowExtractionGuardrailAudit(
      [
        "Public evidence URL is still missing.",
        "Gemini suggested success metric that was not present in the pasted note, so it was ignored.",
        "Gemini suggested current baseline that was not present in the pasted note, so it was ignored.",
        "Gemini suggested team size that was not present in the pasted note, so it was ignored.",
        "Gemini suggested manual minutes that was not present in the pasted note, so it was ignored.",
        "Gemini suggested A2A trial artifact URL that was not present in the pasted note, so it was ignored.",
        "Gemini suggested malformed warning"
      ],
      3
    );

    expect(audit).toEqual({
      ignoredSuggestions: [
        "Gemini suggested success metric that was not present in the pasted note, so it was ignored.",
        "Gemini suggested current baseline that was not present in the pasted note, so it was ignored.",
        "Gemini suggested team size that was not present in the pasted note, so it was ignored."
      ],
      totalIgnored: 5,
      hiddenIgnored: 2
    });
    expect(quickWorkflowExtractionGuardrailAudit([], 3)).toEqual({
      ignoredSuggestions: [],
      totalIgnored: 0,
      hiddenIgnored: 0
    });
  });

  test("accepts natural evidence and agent trial lines in a pasted workflow note", () => {
    const note = [
      "Buyer: VP of Platform Operations at a 600-person SaaS company.",
      "Workflow: every Friday release readiness review takes product managers and SREs 7 hours to collect Jira blockers, GitHub deploy status, Cloud Run health, and customer-risk notes into a go/no-go memo.",
      "Baseline: release proof is collected manually from tickets, GitHub, Cloud Run, and risk notes.",
      "Success: reduce review prep to under 90 minutes and make the release decision auditable.",
      "Team 9, 4 reviews/month, manual 7 hours per review, 80% adoption, hourly cost 14000 yen.",
      "Pilot: manual 420 min, assisted 82 min, 6/7 accepted tasks.",
      "Reviewer: Platform sponsor.",
      "Data boundary: public-safe redacted release metadata only.",
      "Evidence: https://proof.opsbridge.ai/release-readiness-proof",
      "Agent trial: Cloud Run SRE, skill cloud-run.release-proof, score 91, artifact https://proof.opsbridge.ai/a2a-trial-receipt"
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const liveCase = buildQuickWorkflowLiveBuyerCase(draft, readiness);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);

    expect(draft.proofLinks.workOrderEvidenceUrl).toBe("https://proof.opsbridge.ai/release-readiness-proof");
    expect(draft.workOrder.evidenceUrl).toBe("https://proof.opsbridge.ai/release-readiness-proof");
    expect(draft.agentTrialEvidence).toMatchObject({
      agentName: "Cloud Run SRE",
      skillId: "cloud-run.release-proof",
      score: 91,
      artifactUrl: "https://proof.opsbridge.ai/a2a-trial-receipt"
    });
    expect(readiness).toMatchObject({
      status: "watch",
      readyCount: 5,
      totalCount: 6
    });
    expect(readiness.items.find((item) => item.id === "public-proof")).toMatchObject({
      status: "watch",
      evidence: "1/5 proof links: work order proof."
    });
    expect(readiness.items.find((item) => item.id === "agent-trust")).toMatchObject({
      status: "ready",
      evidence: "Cloud Run SRE / cloud-run.release-proof / 91/100."
    });
    expect(liveCase).toMatchObject({
      status: "watch",
      valueLine: "¥252,000/mo",
      proofLine: "1 proof URL captured"
    });
    expect(liveCase.headline).toContain("VP of Platform Operations");
    expect(liveCase.items.map((item) => item.id)).toEqual(["buyer", "value", "proof"]);
    expect(liveCase.items.find((item) => item.id === "value")).toMatchObject({
      status: "ready",
      detail: "18h/month at extracted adoption."
    });
    expect(valueDiagnosis).toMatchObject({
      status: "watch",
      headline: "Value is visible, but proof still gates sharing",
      monthlyValueYen: 252000,
      monthlyHoursSaved: 18,
      pilotBudgetCeilingYen: 126000,
      proofReadyCount: 2,
      proofRepairCount: 3
    });
    expect(valueDiagnosis.items.map((item) => item.id)).toEqual(["measured-value", "break-even", "scope-fit", "pilot-boundary", "proof-gap", "next-fix"]);
    expect(valueDiagnosis.items.find((item) => item.id === "measured-value")).toMatchObject({
      status: "ready",
      value: "¥252,000/month",
      detail: "338m saved/run x 4 cycles/month x 80% adoption."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "break-even")).toMatchObject({
      status: "ready",
      value: "Clears ¥250,000/month",
      detail: "¥252,000/month is above the buyer-value floor."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "scope-fit")).toMatchObject({
      status: "ready",
      value: "Paid pilot scope",
      detail: "The current workflow already clears the buyer-value floor."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "proof-gap")).toMatchObject({
      status: "watch",
      value: "2/5 public proof URLs ready / 3 need repair"
    });
    expect(valueDiagnosis.levers.map((lever) => lever.id)).toEqual(["automation", "scope", "adoption"]);
    expect(valueDiagnosis.levers.find((lever) => lever.id === "automation")).toMatchObject({
      status: "ready",
      value: "Current run clears floor"
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "scope")).toMatchObject({
      status: "ready",
      value: "4 cycles/month clears"
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "adoption")).toMatchObject({
      status: "ready",
      value: "80% adoption clears"
    });
    expect(valueDiagnosis.exportMarkdown).toContain("Measured monthly value: ¥252,000/month");
    expect(valueDiagnosis.exportMarkdown).toContain("Break-even target: 335m saved/run for ¥250,000/month");
    expect(valueDiagnosis.exportMarkdown).toContain("Next action: Attach deployment, pilot receipt, work order proof, walkthrough, or ProtoPedia URLs.");
    expect(valueDiagnosis.exportMarkdown).toContain("## Value levers");
    expect(valueDiagnosis.exportMarkdown).toContain("[ready] Adoption lever: 80% adoption clears.");
    expect(decodeURIComponent(valueDiagnosis.exportHref.split(",")[1] ?? "")).toBe(valueDiagnosis.exportMarkdown);

    const offer = buildQuickWorkflowCommercialPilotOffer(draft, readiness, valueDiagnosis);
    expect(offer).toMatchObject({
      status: "watch",
      decision: "Draft the offer; hold buyer send",
      suggestedPilotPriceYen: 88000,
      pilotBudgetCeilingYen: 126000,
      priceLine: "¥88,000 for a 14-day proof pilot"
    });
    expect(offer.sendRule).toContain("Do not send externally");
    expect(offer.sendRule).toContain("3 public proof repair items remain");
    expect(offer.approvalMemo).toMatchObject({
      status: "watch",
      decision: "revise"
    });
    expect(offer.approvalMemo.redlines).toContain("Attach all five public proof URLs and a live verification receipt before buyer send.");
    expect(offer.objections.find((objection) => objection.id === "proof-trust")).toMatchObject({
      status: "watch",
      answer: "Not externally; keep the offer internal until the proof repair queue closes."
    });
    expect(offer.stressCases.find((stressCase) => stressCase.id === "downside-value")).toMatchObject({
      status: "ready",
      value: "21 days"
    });
    expect(offer.decisionPacket).toMatchObject({
      status: "watch",
      mode: "internal-redline",
      headline: "Decision packet stays internal until redlines close"
    });
    expect(offer.decisionPacket.subject).toContain("Internal redline");
    expect(offer.decisionPacket.sendRule).toContain("Do not send externally");
    expect(offer.decisionPacket.attachments.find((attachment) => attachment.id === "public-proof")).toMatchObject({
      status: "watch",
      value: "2/5 public proof URLs ready / 3 need repair"
    });
    const responseRecord = buildQuickWorkflowCommercialResponseRecord(
      offer,
      "We can proceed after security reviews the receipt and you attach the missing proof links."
    );
    expect(responseRecord).toMatchObject({
      status: "watch",
      decision: "needs-revision",
      headline: "Buyer response needs a controlled revision",
      owner: "Finance owner + pilot sponsor"
    });
    expect(responseRecord.detectedSignals).toEqual(["approval intent", "stakeholder review", "proof request"]);
    expect(responseRecord.followUps.find((followUp) => followUp.id === "proof-repair")).toMatchObject({
      status: "watch",
      evidence: "2/5 public proof URLs ready / 3 need repair"
    });
    expect(offer.exportMarkdown).toContain("Buyer send rule: Do not send externally");
    expect(offer.exportMarkdown).toContain("Approval memo: revise /");
  });

  test("generates a value acceptance contract from a priced buyer workflow", () => {
    const note = [
      "Buyer: Platform release lead.",
      "Workflow: weekly release review is copied from tickets, CI logs, Cloud Run health, and customer-risk notes into a go/no-go memo before sponsor sign-off.",
      "Baseline: release proof is collected manually from tickets, GitHub, Cloud Run, and risk notes.",
      "Success: save 6 hours per review and make the release decision auditable.",
      "Team: 8 people",
      "Reviews: 5 reviews/month",
      "Manual: 28 hours/review",
      "Adoption: 75% adoption",
      "Hourly cost: ¥12000/h",
      "Risk: ¥240000/month",
      "Pilot: manual 1680 min, assisted 560 min, 5/5 accepted tasks.",
      "Reviewer: Platform sponsor.",
      "Deployment: https://release-agent.global.run.app",
      "ProtoPedia: https://protopedia.net/prototype/9999",
      "Walkthrough: https://youtu.be/abcd1234",
      "Pilot receipt: https://proof.opsbridge.ai/pilot-receipt.json",
      "Work order proof: https://github.com/example/release-agent/issues/42",
      "Accepted A2A trial: agent=ReleaseProofAgent, skill=release.review.verify, status accepted, score 92/100, artifact https://proof.opsbridge.ai/a2a-trial-receipt.json",
      "Data boundary: public redacted synthetic evidence only."
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);
    const offer = buildQuickWorkflowCommercialPilotOffer(draft, readiness, valueDiagnosis);
    const contract = buildQuickWorkflowValueAcceptanceContract({
      draft,
      readiness,
      valueDiagnosis,
      commercialPilotOffer: offer
    });
    const html = renderToStaticMarkup(
      createElement(QuickWorkflowValueAcceptanceContractPanel, {
        draft,
        readiness,
        valueDiagnosis,
        commercialPilotOffer: offer
      })
    );

    expect(readiness.status).toBe("ready");
    expect(valueDiagnosis.status).toBe("ready");
    expect(offer.status).toBe("ready");
    expect(contract).toMatchObject({
      status: "ready",
      decision: "Issue value acceptance contract",
      headline: "Value acceptance contract is ready",
      buyer: "Platform release lead",
      pilotWindow: "14-day proof pilot",
      suggestedPilotPriceYen: offer.suggestedPilotPriceYen
    });
    expect(contract.valueFloorYen).toBeGreaterThan(offer.suggestedPilotPriceYen);
    expect(contract.stopLossYen).toBeGreaterThanOrEqual(offer.suggestedPilotPriceYen);
    expect(contract.acceptanceLine).toContain("Platform release lead accepts the 14-day proof pilot only when");
    expect(contract.creditLine).toContain("the next sprint becomes repair work");
    expect(contract.gates.map((gate) => gate.id)).toEqual(["value-floor", "proof-receipt", "data-boundary", "buyer-commitment", "commercial-cap", "stop-rule"]);
    expect(contract.gates.every((gate) => gate.status === "ready")).toBe(true);
    expect(contract.ownerActions).toEqual([]);
    expect(contract.receipt).toMatchObject({
      receiptVersion: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      verificationApiPath: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
      payloadJson: expect.stringContaining('"buyer": "Platform release lead"')
    });
    expect(JSON.parse(contract.receipt.payloadJson)).toMatchObject({
      receiptVersion: "quick-workflow-value-acceptance-contract.v1",
      source: "quick-workflow-intake",
      buyer: "Platform release lead",
      status: "ready",
      decision: "Issue value acceptance contract"
    });
    expect(verifyQuickWorkflowValueAcceptanceContractRequest(JSON.parse(contract.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-value-acceptance-contract.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: contract.receipt.checksum,
          actualChecksum: contract.receipt.checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-value-acceptance-contract.v1",
          status: "ready",
          blockedCount: 0,
          gateCount: 6
        }
      }
    });
    expect(contract.exportMarkdown).toContain("# Quick workflow value acceptance contract");
    expect(contract.exportMarkdown).toContain("Receipt: quick-value-contract-");
    expect(decodeURIComponent(contract.exportHref.split(",")[1] ?? "")).toBe(contract.exportMarkdown);
    expect(decodeURIComponent(contract.receipt.payloadHref.split(",")[1] ?? "")).toBe(contract.receipt.payloadJson);
    expect(decodeURIComponent(contract.receipt.verificationRequestHref.split(",")[1] ?? "")).toBe(contract.receipt.verificationRequestJson);
    expect(contract.receipt.verifierHref).toContain("/receipt-verifier?");
    expect(contract.receipt.verifierHref).toContain("verify=1");
    expect(html).toContain("Value acceptance contract");
    expect(html).toContain("Value acceptance contract is ready");
    expect(html).toContain("Accepted value floor");
    expect(html).toContain("Live proof receipt");
    expect(html).toContain("Contract receipt");
    expect(html).toContain("Export contract");
    expect(html).toContain("Receipt payload");
    expect(html).toContain("Verifier request");
    expect(html).toContain("Verify contract");
    expect(html).not.toMatch(/demo/i);
  });

  test("turns an approved value acceptance contract into a dated pilot kickoff pack", () => {
    const note = [
      "Buyer: Platform release lead.",
      "Workflow: weekly release review is copied from tickets, CI logs, Cloud Run health, and customer-risk notes into a go/no-go memo before sponsor sign-off.",
      "Baseline: release proof is collected manually from tickets, GitHub, Cloud Run, and risk notes.",
      "Success: save 6 hours per review and make the release decision auditable.",
      "Team: 8 people",
      "Reviews: 5 reviews/month",
      "Manual: 28 hours/review",
      "Adoption: 75% adoption",
      "Hourly cost: ¥12000/h",
      "Risk: ¥240000/month",
      "Pilot: manual 1680 min, assisted 560 min, 5/5 accepted tasks.",
      "Reviewer: Platform sponsor.",
      "Deployment: https://release-agent.global.run.app",
      "ProtoPedia: https://protopedia.net/prototype/9999",
      "Walkthrough: https://youtu.be/abcd1234",
      "Pilot receipt: https://proof.opsbridge.ai/pilot-receipt.json",
      "Work order proof: https://github.com/example/release-agent/issues/42",
      "Accepted A2A trial: agent=ReleaseProofAgent, skill=release.review.verify, status accepted, score 92/100, artifact https://proof.opsbridge.ai/a2a-trial-receipt.json",
      "Data boundary: public redacted synthetic evidence only."
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);
    const offer = buildQuickWorkflowCommercialPilotOffer(draft, readiness, valueDiagnosis);
    const contract = buildQuickWorkflowValueAcceptanceContract({
      draft,
      readiness,
      valueDiagnosis,
      commercialPilotOffer: offer
    });
    const responseRecord = buildQuickWorkflowCommercialResponseRecord(
      offer,
      "Approved for the 14-day pilot. Please attach the live proof receipt before kickoff and send the pilot calendar invite."
    );
    const pack = buildQuickWorkflowPilotKickoffPack({
      contract,
      responseRecord,
      kickoffStartDate: "2026-07-01"
    });
    const html = renderToStaticMarkup(createElement(QuickWorkflowPilotKickoffPackPanel, { contract, responseRecord }));

    expect(pack).toMatchObject({
      status: "ready",
      headline: "Pilot kickoff pack is ready",
      buyer: "Platform release lead",
      kickoffStartDate: "2026-07-01",
      endDate: "2026-07-31",
      readyCount: 5,
      blockedCount: 0,
      nextOwner: "Pilot sponsor"
    });
    expect(pack.tasks.map((task) => [task.id, task.dueDate, task.status])).toEqual([
      ["day-0-kickoff", "2026-07-01", "ready"],
      ["day-3-proof-recheck", "2026-07-04", "ready"],
      ["day-7-value-snapshot", "2026-07-08", "ready"],
      ["day-14-pilot-review", "2026-07-15", "ready"],
      ["day-30-value-acceptance", "2026-07-31", "ready"]
    ]);
    expect(pack.sendNoteBody).toContain(`Contract receipt: ${contract.receipt.receiptId} / fnv1a32:${contract.receipt.checksum}`);
    expect(pack.mailtoHref).toMatch(/^mailto:\?subject=/);
    expect(decodeURIComponent(pack.mailtoHref)).toContain("Pilot kickoff: Platform release lead");
    expect(pack.taskCsvText).toContain('"day","date","label","status","owner","action","acceptance","evidence"');
    expect(pack.taskCsvText).toContain('"Day 14","2026-07-15","Pilot review","ready","Buyer owner"');
    expect(pack.taskCsvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(pack.icsText).toContain("BEGIN:VCALENDAR");
    expect(pack.icsText).toContain("DTSTART;VALUE=DATE:20260701");
    expect(pack.icsText).toContain("SUMMARY:Day 14 Pilot review - Buyer owner");
    expect(pack.icsText).toContain(`Receipt: ${pack.receipt.receiptId}`);
    expect(pack.icsHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(pack.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-kickoff-pack-ready-20260701-[0-9a-f]{8}$/),
      checksumAlgorithm: "fnv1a32",
      checksum: expect.stringMatching(/^[0-9a-f]{8}$/)
    });
    expect(JSON.parse(pack.receipt.payloadJson)).toMatchObject({
      source: "quick-workflow-pilot-kickoff-pack",
      status: "ready",
      contractReceiptId: contract.receipt.receiptId,
      responseDecision: "approved"
    });
    expect(pack.exportMarkdown).toContain("# Quick workflow pilot kickoff pack");
    expect(pack.exportMarkdown).toContain("## Owner tasks");
    expect(decodeURIComponent(pack.exportHref.split(",")[1] ?? "")).toBe(pack.exportMarkdown);
    expect(html).toContain("Pilot kickoff pack");
    expect(html).toContain("Send note");
    expect(html).toContain("Import calendar");
    expect(html).toContain("Task CSV");
    expect(html).toContain("Pack receipt");
    expect(html).not.toMatch(/demo/i);
  });

  test("turns a kickoff pack and live evidence into a pilot run log closeout", () => {
    const note = [
      "Buyer: Platform release lead.",
      "Workflow: weekly release review is copied from tickets, CI logs, Cloud Run health, and customer-risk notes into a go/no-go memo before sponsor sign-off.",
      "Baseline: release proof is collected manually from tickets, GitHub, Cloud Run, and risk notes.",
      "Success: save 6 hours per review and make the release decision auditable.",
      "Team: 8 people",
      "Reviews: 5 reviews/month",
      "Manual: 28 hours/review",
      "Adoption: 75% adoption",
      "Hourly cost: ¥12000/h",
      "Risk: ¥240000/month",
      "Pilot: manual 1680 min, assisted 560 min, 5/5 accepted tasks.",
      "Reviewer: Platform sponsor.",
      "Deployment: https://release-agent.global.run.app",
      "ProtoPedia: https://protopedia.net/prototype/9999",
      "Walkthrough: https://youtu.be/abcd1234",
      "Pilot receipt: https://proof.opsbridge.ai/pilot-receipt.json",
      "Work order proof: https://github.com/example/release-agent/issues/42",
      "Accepted A2A trial: agent=ReleaseProofAgent, skill=release.review.verify, status accepted, score 92/100, artifact https://proof.opsbridge.ai/a2a-trial-receipt.json",
      "Data boundary: public redacted synthetic evidence only."
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);
    const offer = buildQuickWorkflowCommercialPilotOffer(draft, readiness, valueDiagnosis);
    const contract = buildQuickWorkflowValueAcceptanceContract({
      draft,
      readiness,
      valueDiagnosis,
      commercialPilotOffer: offer
    });
    const responseRecord = buildQuickWorkflowCommercialResponseRecord(
      offer,
      "Approved for the 14-day pilot. Please attach the live proof receipt before kickoff and send the pilot calendar invite."
    );
    const pack = buildQuickWorkflowPilotKickoffPack({
      contract,
      responseRecord,
      kickoffStartDate: "2026-07-01"
    });
    const evidenceText = [
      `Day 0 kickoff opened with the pilot sponsor and buyer owner. Contract receipt ${contract.receipt.receiptId} was attached.`,
      "Buyer owner accepted continue, revise, or stop criteria before work started.",
      "Day 3 live proof verification passed and the audit receipt was linked to the buyer room.",
      "Public proof URLs and proof links are still open.",
      "Day 7 assisted minutes saved were recorded, accepted tasks were 5/5, and the finance owner checked value trend at ¥616000/month.",
      "Day 14 pilot review completed with the buyer owner. The decision was continue with current evidence attached.",
      "Day 30 procurement owner accepted value floor, checked the stop-loss rule, and sponsor acceptance was recorded."
    ].join("\n");
    const log = buildQuickWorkflowPilotRunLog({ pack, evidenceText });
    const emptyLog = buildQuickWorkflowPilotRunLog({ pack, evidenceText: "" });
    const decisionBrief = buildQuickWorkflowPilotDecisionBrief({ log, contract });
    const emptyDecisionBrief = buildQuickWorkflowPilotDecisionBrief({ log: emptyLog, contract });
    const expansionEvidenceText = buildQuickWorkflowPilotExpansionRecheckEvidence({
      measuredMonthlyValueYen: 720000,
      ownerName: "Finance owner",
      ownerDecision: "approved",
      receiptChainAttached: true,
      nextWindow: "Next operating window with a 30-day value recheck before renewal",
      note: "",
      decisionBriefReceiptId: decisionBrief.receipt.receiptId
    });
    const expansionGuardrail = buildQuickWorkflowPilotExpansionGuardrail({
      brief: decisionBrief,
      log,
      contract,
      recheckEvidenceText: expansionEvidenceText
    });
    const stoppedExpansionGuardrail = buildQuickWorkflowPilotExpansionGuardrail({
      brief: decisionBrief,
      log,
      contract,
      recheckEvidenceText: `30-day value recheck recorded actual value ¥300,000/month. Decision receipt ${decisionBrief.receipt.receiptId} attached.`
    });
    const buyerExpansionPacket = buildQuickWorkflowBuyerExpansionPacket({
      commercialPilotOffer: offer,
      contract,
      kickoffPack: pack,
      runLog: log,
      decisionBrief,
      expansionGuardrail
    });
    const preRunBuyerExpansionPacket = buildQuickWorkflowBuyerExpansionPacket({
      commercialPilotOffer: offer,
      contract,
      kickoffPack: pack
    });
    const buyerExpansionHandoff = buyerExpansionPacket.procurementHandoff;
    const standaloneBuyerExpansionHandoff = buildQuickWorkflowBuyerExpansionHandoff(buyerExpansionPacket);
    const preRunBuyerExpansionHandoff = preRunBuyerExpansionPacket.procurementHandoff;
    const buyerExpansionRecheckCloseout = buildQuickWorkflowBuyerExpansionRecheckCloseout({
      signoff: buyerExpansionHandoff.signoff,
      evidenceText: buyerExpansionHandoff.signoff.operatingPacket.closeoutMarkdown
        .replace("Actual retained monthly value: ¥____/month.", "Actual retained monthly value: ¥680,000/month.")
        .replace("Value floor outcome stated: clears floor | below floor.", "Value floor outcome stated: clears floor.")
        .replace("Decision recorded: expand | revise | stop.", "Decision recorded: expand.")
    });
    const stoppedBuyerExpansionRecheckCloseout = buildQuickWorkflowBuyerExpansionRecheckCloseout({
      signoff: buyerExpansionHandoff.signoff,
      evidenceText: buyerExpansionHandoff.signoff.operatingPacket.closeoutMarkdown
        .replace("Actual retained monthly value: ¥____/month.", "Actual retained monthly value: ¥300,000/month.")
        .replace("Value floor outcome stated: clears floor | below floor.", "Value floor outcome stated: below floor.")
        .replace("Decision recorded: expand | revise | stop.", "Decision recorded: stop.")
    });
    const invalidBelowFloorExpansionCloseout = buildQuickWorkflowBuyerExpansionRecheckCloseout({
      signoff: buyerExpansionHandoff.signoff,
      evidenceText: buyerExpansionHandoff.signoff.operatingPacket.closeoutMarkdown
        .replace("Actual retained monthly value: ¥____/month.", "Actual retained monthly value: ¥300,000/month.")
        .replace("Value floor outcome stated: clears floor | below floor.", "Value floor outcome stated: below floor.")
        .replace("Decision recorded: expand | revise | stop.", "Decision recorded: expand.")
    });
    const buyerExpansionPacketHtml = renderToStaticMarkup(createElement(QuickWorkflowBuyerExpansionPacketPanel, { packet: buyerExpansionPacket }));
    const html = renderToStaticMarkup(createElement(QuickWorkflowPilotRunLogPanel, { pack, contract }));

    expect(emptyLog).toMatchObject({
      status: "watch",
      decision: "start-run-log",
      readyCount: 0,
      missingProofCount: 15
    });
    expect(log).toMatchObject({
      status: "ready",
      decision: "send-closeout-note",
      headline: "Pilot run log is ready for closeout",
      buyer: "Platform release lead",
      runWindow: "2026-07-01 to 2026-07-31",
      evidenceScore: 100,
      readyCount: 5,
      watchCount: 0,
      blockedCount: 0,
      missingProofCount: 0,
      nextOwner: "Pilot sponsor"
    });
    expect(log.tasks.map((task) => [task.id, task.status, task.missingSignals])).toEqual([
      ["day-0-kickoff", "ready", []],
      ["day-3-proof-recheck", "ready", []],
      ["day-7-value-snapshot", "ready", []],
      ["day-14-pilot-review", "ready", []],
      ["day-30-value-acceptance", "ready", []]
    ]);
    expect(log.closeoutNoteBody).toContain(`Kickoff receipt: ${pack.receipt.receiptId} / fnv1a32:${pack.receipt.checksum}`);
    expect(log.closeoutNoteBody).toContain("Evidence score: 100/100");
    expect(log.mailtoHref).toMatch(/^mailto:\?subject=/);
    expect(decodeURIComponent(log.mailtoHref)).toContain("Pilot closeout: Platform release lead");
    expect(log.taskCsvText).toContain('"day","date","task","status","owner","found_signals","missing_signals","next_action"');
    expect(log.taskCsvText).toContain('"Day 30","2026-07-31","Value acceptance","ready","Procurement owner"');
    expect(log.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-pilot-run-log-ready-[0-9a-f]{8}$/),
      receiptVersion: QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      checksum: expect.stringMatching(/^[0-9a-f]{8}$/),
      verificationApiPath: QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH
    });
    expect(JSON.parse(log.receipt.payloadJson)).toMatchObject({
      receiptVersion: QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
      source: "quick-workflow-pilot-run-log",
      status: "ready",
      decision: "send-closeout-note",
      sourceKickoffReceiptId: pack.receipt.receiptId,
      evidenceScore: 100
    });
    expect(JSON.parse(log.receipt.verificationRequestJson)).toMatchObject({
      checksum: log.receipt.checksum,
      payload: {
        receiptVersion: QUICK_WORKFLOW_PILOT_RUN_LOG_RECEIPT_VERSION,
        sourceKickoffReceiptId: pack.receipt.receiptId
      }
    });
    expect(decodeURIComponent(log.receipt.verificationRequestHref.split(",")[1] ?? "")).toBe(log.receipt.verificationRequestJson);
    expect(log.receipt.verifierHref).toContain("/receipt-verifier?");
    expect(log.receipt.verifierHref).toContain("verify=1");
    expect(log.exportMarkdown).toContain("# Quick workflow pilot run log");
    expect(log.exportMarkdown).toContain("## Closeout note");
    expect(log.exportMarkdown).toContain(`API verification: POST ${QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH}`);
    expect(decodeURIComponent(log.exportHref.split(",")[1] ?? "")).toBe(log.exportMarkdown);
    expect(decisionBrief).toMatchObject({
      status: "ready",
      decision: "expand-with-guardrails",
      headline: "Expansion decision brief is ready",
      buyer: "Platform release lead",
      nextOwner: "Procurement owner"
    });
    expect(decisionBrief.decisionAsk).toContain("Approve the next operating window");
    expect(decisionBrief.valueLine).toContain("accepted floor");
    expect(decisionBrief.riskLine).toContain("stop rule");
    expect(decisionBrief.runVerifierHref).toBe(log.receipt.verifierHref);
    expect(decisionBrief.contractVerifierHref).toBe(contract.receipt.verifierHref);
    expect(decisionBrief.actions.map((action) => [action.id, action.status])).toEqual([
      ["verify-run-receipt", "ready"],
      ["record-decision", "ready"],
      ["schedule-value-recheck", "ready"],
      ["hold-expansion", "ready"]
    ]);
    expect(decisionBrief.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-pilot-decision-brief-ready-[0-9a-f]{8}$/),
      receiptVersion: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      checksum: expect.stringMatching(/^[0-9a-f]{8}$/),
      verificationApiPath: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH
    });
    expect(JSON.parse(decisionBrief.receipt.payloadJson)).toMatchObject({
      receiptVersion: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
      source: "quick-workflow-pilot-decision-brief",
      status: "ready",
      decision: "expand-with-guardrails",
      runReceiptId: log.receipt.receiptId,
      contractReceiptId: contract.receipt.receiptId,
      actions: [
        { id: "verify-run-receipt", status: "ready" },
        { id: "record-decision", status: "ready" },
        { id: "schedule-value-recheck", status: "ready" },
        { id: "hold-expansion", status: "ready" }
      ]
    });
    expect(JSON.parse(decisionBrief.receipt.verificationRequestJson)).toMatchObject({
      checksum: decisionBrief.receipt.checksum,
      payload: {
        receiptVersion: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_RECEIPT_VERSION,
        runReceiptId: log.receipt.receiptId,
        contractReceiptId: contract.receipt.receiptId
      }
    });
    expect(decodeURIComponent(decisionBrief.receipt.payloadHref.split(",")[1] ?? "")).toBe(decisionBrief.receipt.payloadJson);
    expect(decodeURIComponent(decisionBrief.receipt.verificationRequestHref.split(",")[1] ?? "")).toBe(
      decisionBrief.receipt.verificationRequestJson
    );
    expect(decisionBrief.receipt.verifierHref).toContain("/receipt-verifier?");
    expect(decisionBrief.receipt.verifierHref).toContain("verify=1");
    expect(verifyQuickWorkflowPilotDecisionBriefRequest(JSON.parse(decisionBrief.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-pilot-decision-brief.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: decisionBrief.receipt.checksum,
          actualChecksum: decisionBrief.receipt.checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-pilot-decision-brief.v1",
          status: "ready",
          actionCount: 4,
          readyActionCount: 4,
          firstOpenAction: "none"
        }
      }
    });
    expect(decisionBrief.sendNoteBody).toContain(
      `Decision receipt: ${decisionBrief.receipt.receiptId} / fnv1a32:${decisionBrief.receipt.checksum}`
    );
    expect(decisionBrief.exportMarkdown).toContain("# Quick workflow pilot decision brief");
    expect(decisionBrief.exportMarkdown).toContain("Run verifier: /receipt-verifier?");
    expect(decisionBrief.exportMarkdown).toContain(`Decision receipt: ${decisionBrief.receipt.receiptId}`);
    expect(decisionBrief.exportMarkdown).toContain(`API verification: POST ${QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH}`);
    expect(decodeURIComponent(decisionBrief.exportHref.split(",")[1] ?? "")).toBe(decisionBrief.exportMarkdown);
    expect(expansionGuardrail).toMatchObject({
      status: "ready",
      decision: "expand-next-window",
      headline: "Expansion can move with guardrails",
      buyer: "Platform release lead",
      measuredMonthlyValueYen: 720000,
      valueFloorYen: contract.valueFloorYen,
      stopLossYen: contract.stopLossYen,
      valueRuler: {
        status: "ready",
        label: "Clears expansion floor"
      },
      nextOwner: "Procurement owner"
    });
    expect(expansionGuardrail.valueRuler.measuredPositionPercent).toBeGreaterThan(expansionGuardrail.valueRuler.floorPositionPercent);
    expect(expansionGuardrail.valueRuler.floorPositionPercent).toBeGreaterThan(expansionGuardrail.valueRuler.stopPositionPercent);
    expect(expansionEvidenceText).toContain("30-day value recheck recorded actual value ¥720,000/month.");
    expect(expansionEvidenceText).toContain("Finance owner approved expansion");
    expect(expansionEvidenceText).toContain(`Decision receipt ${decisionBrief.receipt.receiptId}`);
    expect(expansionEvidenceText).toContain("Next operating window scoped");
    expect(expansionGuardrail.checks.map((check) => [check.id, check.status])).toEqual([
      ["decision-brief-verified", "ready"],
      ["value-floor-met", "ready"],
      ["stop-rule-safe", "ready"],
      ["owner-acceptance-recorded", "ready"],
      ["receipt-chain-attached", "ready"],
      ["next-window-scoped", "ready"]
    ]);
    expect(expansionGuardrail.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-pilot-expansion-guardrail-ready-[0-9a-f]{8}$/),
      receiptVersion: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      checksum: expect.stringMatching(/^[0-9a-f]{8}$/),
      verificationApiPath: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH
    });
    expect(JSON.parse(expansionGuardrail.receipt.payloadJson)).toMatchObject({
      receiptVersion: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_RECEIPT_VERSION,
      source: "quick-workflow-pilot-expansion-guardrail",
      status: "ready",
      decision: "expand-next-window",
      measuredMonthlyValueYen: 720000,
      decisionBriefReceiptId: decisionBrief.receipt.receiptId,
      runReceiptId: log.receipt.receiptId,
      contractReceiptId: contract.receipt.receiptId
    });
    expect(verifyQuickWorkflowPilotExpansionGuardrailRequest(JSON.parse(expansionGuardrail.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-pilot-expansion-guardrail.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: expansionGuardrail.receipt.checksum,
          actualChecksum: expansionGuardrail.receipt.checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-pilot-expansion-guardrail.v1",
          status: "ready",
          checkCount: 6,
          readyCheckCount: 6,
          firstOpenCheck: "none"
        }
      }
    });
    expect(expansionGuardrail.exportMarkdown).toContain("# Quick workflow pilot expansion guardrail");
    expect(expansionGuardrail.exportMarkdown).toContain("Value band: Clears expansion floor");
    expect(expansionGuardrail.exportMarkdown).toContain(`API verification: POST ${QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH}`);
    expect(expansionGuardrail.sendNoteBody).toContain(`Expansion receipt: ${expansionGuardrail.receipt.receiptId}`);
    expect(decodeURIComponent(expansionGuardrail.exportHref.split(",")[1] ?? "")).toBe(expansionGuardrail.exportMarkdown);
    expect(buyerExpansionPacket).toMatchObject({
      status: "ready",
      headline: "Buyer expansion packet is ready",
      buyer: "Platform release lead",
      readyCount: 6,
      totalCount: 6,
      decisionAsk: `Approve the next operating window for Platform release lead with ${expansionGuardrail.receipt.receiptId} attached.`,
      nextOwner: "Procurement owner"
    });
    expect(buyerExpansionPacket.primaryMetric).toContain("clears the");
    expect(buyerExpansionPacket.receiptLine).toContain(expansionGuardrail.receipt.receiptId);
    expect(buyerExpansionPacket.stages.map((stage) => [stage.id, stage.status, Boolean(stage.receiptId)])).toEqual([
      ["offer", "ready", false],
      ["contract", "ready", true],
      ["kickoff", "ready", true],
      ["run", "ready", true],
      ["decision", "ready", true],
      ["expansion", "ready", true]
    ]);
    expect(buyerExpansionPacket.sendNoteBody).toContain(`Receipt: ${expansionGuardrail.receipt.receiptId}`);
    expect(buyerExpansionPacket.exportMarkdown).toContain("# Quick workflow buyer expansion packet");
    expect(buyerExpansionPacket.exportMarkdown).toContain(`Verifier: ${expansionGuardrail.receipt.verifierHref}`);
    expect(decodeURIComponent(buyerExpansionPacket.exportHref.split(",")[1] ?? "")).toBe(buyerExpansionPacket.exportMarkdown);
    expect(buyerExpansionPacket.exportHtml).toContain("<!doctype html>");
    expect(buyerExpansionPacket.exportHtml).toContain("Buyer expansion one-pager");
    expect(buyerExpansionPacket.exportHtml).toContain("6/6");
    expect(buyerExpansionPacket.exportHtml).toContain(expansionGuardrail.receipt.receiptId);
    expect(buyerExpansionPacket.exportHtml).toContain("Verify receipt");
    expect(buyerExpansionPacket.exportHtml).toContain("Procurement handoff");
    expect(buyerExpansionPacket.exportHtml).toContain(buyerExpansionPacket.procurementHandoff.handoffId);
    expect(buyerExpansionPacket.exportHtml).toContain("Schedule value recheck");
    expect(buyerExpansionPacket.exportHtml).toContain("Verify procurement handoff");
    expect(buyerExpansionPacket.exportHtml).toContain(buyerExpansionPacket.procurementHandoff.receipt.verifierHref.replaceAll("&", "&amp;"));
    expect(buyerExpansionPacket.exportHtml).toContain("Procurement signoff");
    expect(buyerExpansionPacket.exportHtml).toContain("Verify procurement signoff");
    expect(buyerExpansionPacket.exportHtml).toContain(buyerExpansionPacket.procurementHandoff.signoff.verifierHref.replaceAll("&", "&amp;"));
    expect(buyerExpansionPacket.exportHtml).toContain("Operating packet");
    expect(buyerExpansionPacket.exportHtml).toContain("Retained-value recheck");
    expect(buyerExpansionPacket.exportHtml).toContain("Download owner ledger");
    expect(buyerExpansionPacket.exportHtml).toContain("Download recheck calendar");
    expect(buyerExpansionPacket.exportHtml).toContain("Download closeout template");
    expect(buyerExpansionPacket.exportHtml).toContain("Ready for 30-day retained-value closeout");
    expect(buyerExpansionPacket.exportHtml).toContain("2026-07-31");
    expect(buyerExpansionPacket.exportHtmlHref).toMatch(/^data:text\/html;charset=utf-8,/);
    expect(decodeURIComponent(buyerExpansionPacket.exportHtmlHref.split(",")[1] ?? "")).toBe(buyerExpansionPacket.exportHtml);
    expect(preRunBuyerExpansionPacket).toMatchObject({
      status: "watch",
      headline: "Buyer packet is building its receipt chain",
      readyCount: 3,
      totalCount: 6
    });
    expect(preRunBuyerExpansionPacket.decisionAsk).toContain("Complete the pilot run evidence");
    expect(buyerExpansionPacketHtml).toContain("Buyer expansion packet");
    expect(buyerExpansionPacketHtml).toContain("Open one-pager");
    expect(buyerExpansionPacketHtml).toContain("Export markdown");
    expect(buyerExpansionPacketHtml).toContain("Receipt chain");
    expect(buyerExpansionPacketHtml).toContain("6/6");
    expect(buyerExpansionPacketHtml).toContain("Expansion guardrail");
    expect(buyerExpansionHandoff).toMatchObject({
      status: "ready",
      headline: "Procurement handoff is ready",
      buyer: "Platform release lead",
      readyCount: 4,
      totalCount: 4,
      nextOwner: "Procurement owner",
      nextAction: "Record procurement signoff, then schedule the next value recheck."
    });
    expect(standaloneBuyerExpansionHandoff).toEqual(buyerExpansionHandoff);
    expect(buyerExpansionHandoff.handoffId).toMatch(/^quick-buyer-expansion-handoff-ready-[0-9a-f]{8}$/);
    expect(buyerExpansionHandoff.checksumAlgorithm).toBe("fnv1a32");
    expect(buyerExpansionHandoff.approvalLine).toContain(expansionGuardrail.receipt.receiptId);
    expect(buyerExpansionHandoff.riskLine).toContain("retained-value recheck");
    expect(buyerExpansionHandoff.tasks.map((task) => [task.id, task.status, task.owner])).toEqual([
      ["attach-one-pager", "ready", "Pilot sponsor"],
      ["verify-receipt-chain", "ready", "Proof owner"],
      ["procurement-signoff", "ready", "Procurement owner"],
      ["value-recheck-window", "ready", "Finance owner"]
    ]);
    expect(buyerExpansionHandoff.tasks.find((task) => task.id === "procurement-signoff")?.href).toBe(expansionGuardrail.receipt.verifierHref);
    expect(buyerExpansionHandoff.taskCsvText).toContain('"task","status","owner","action","acceptance","proof"');
    expect(buyerExpansionHandoff.taskCsvText).toContain('"Record procurement signoff","ready","Procurement owner"');
    expect(buyerExpansionHandoff.taskCsvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(buyerExpansionHandoff.receipt).toMatchObject({
      receiptId: buyerExpansionHandoff.handoffId,
      receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      checksum: buyerExpansionHandoff.checksum,
      verificationApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH
    });
    expect(JSON.parse(buyerExpansionHandoff.receipt.payloadJson)).toMatchObject({
      receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_RECEIPT_VERSION,
      source: "quick-workflow-buyer-expansion-handoff",
      status: "ready",
      buyer: "Platform release lead",
      packetReadyCount: 6,
      packetTotalCount: 6,
      tasks: expect.arrayContaining([
        expect.objectContaining({
          id: "procurement-signoff",
          status: "ready",
          owner: "Procurement owner"
        })
      ])
    });
    expect(verifyQuickWorkflowBuyerExpansionHandoffRequest(JSON.parse(buyerExpansionHandoff.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-buyer-expansion-handoff.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: buyerExpansionHandoff.receipt.checksum,
          actualChecksum: buyerExpansionHandoff.receipt.checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-buyer-expansion-handoff.v1",
          status: "ready",
          taskCount: 4,
          readyTaskCount: 4,
          firstOpenTask: "none"
        }
      }
    });
    expect(buyerExpansionHandoff.signoff).toMatchObject({
      decision: "approve-next-window",
      status: "ready",
      label: "Procurement can approve the next window",
      checksumAlgorithm: "fnv1a32",
      verificationApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH
    });
    expect(buyerExpansionHandoff.signoff.receiptId).toMatch(/^quick-buyer-expansion-handoff-signoff-ready-[0-9a-f]{8}$/);
    expect(buyerExpansionHandoff.signoff.operatingPacket).toMatchObject({
      headline: "Approval carries an owner ledger",
      recheckWindow: "Before renewal or wider rollout",
      calendar: {
        status: "scheduled",
        startDate: "2026-07-31",
        endDate: "2026-08-01"
      },
      readyCount: 4,
      taskTotal: 4,
      firstDueLabel: "At approval"
    });
    expect(buyerExpansionHandoff.signoff.operatingPacket.tasks.map((task) => [task.id, task.status, task.owner, task.dueLabel])).toEqual([
      ["archive-signoff-verifier", "ready", "Procurement owner", "At approval"],
      ["schedule-retained-value-recheck", "ready", "Finance owner", "2026-07-31"],
      ["reopen-receipt-chain", "ready", "Proof owner", "Before 2026-07-31"],
      ["stop-or-repair-below-floor", "ready", "Pilot sponsor", "If value misses floor"]
    ]);
    expect(buyerExpansionHandoff.signoff.operatingPacket.csvText).toContain('"task","status","owner","due","action","acceptance","proof"');
    expect(buyerExpansionHandoff.signoff.operatingPacket.csvText).toContain('"Schedule retained-value recheck","ready","Finance owner"');
    expect(buyerExpansionHandoff.signoff.operatingPacket.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(buyerExpansionHandoff.signoff.operatingPacket.calendarFilename).toBe("quick-buyer-expansion-recheck-2026-07-31.ics");
    expect(buyerExpansionHandoff.signoff.operatingPacket.calendarText).toContain("BEGIN:VCALENDAR");
    expect(buyerExpansionHandoff.signoff.operatingPacket.calendarText).toContain("DTSTART;VALUE=DATE:20260731");
    expect(buyerExpansionHandoff.signoff.operatingPacket.calendarText).toContain("SUMMARY:Retained-value recheck - Finance owner");
    expect(buyerExpansionHandoff.signoff.operatingPacket.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(buyerExpansionHandoff.signoff.operatingPacket.recheckCloseout).toMatchObject({
      status: "recordable",
      label: "Ready for 30-day retained-value closeout",
      scheduledDate: "2026-07-31",
      sourceHandoffReceiptId: buyerExpansionHandoff.handoffId,
      sourceHandoffChecksum: `fnv1a32:${buyerExpansionHandoff.checksum}`
    });
    expect(buyerExpansionHandoff.signoff.operatingPacket.recheckCloseout.requiredSignals).toEqual([
      "signoff verifier verified HTTP 200",
      "retained-value recheck scheduled",
      "actual retained monthly value recorded",
      "value floor outcome stated",
      "receipt chain reopened",
      "expand, revise, or stop decision recorded"
    ]);
    expect(buyerExpansionHandoff.signoff.operatingPacket.recheckCloseout.evidenceTemplate).toContain("Actual retained monthly value: ¥____/month.");
    expect(buyerExpansionHandoff.signoff.operatingPacket.recheckCloseout.evidenceTemplate).toContain("Decision recorded: expand | revise | stop.");
    expect(buyerExpansionHandoff.signoff.operatingPacket.closeoutFilename).toBe("quick-buyer-expansion-recheck-closeout-2026-07-31.md");
    expect(buyerExpansionHandoff.signoff.operatingPacket.closeoutMarkdown).toContain("# Retained-value recheck closeout template");
    expect(buyerExpansionHandoff.signoff.operatingPacket.closeoutMarkdown).toContain(`Signoff receipt: ${buyerExpansionHandoff.signoff.receiptId}`);
    expect(buyerExpansionHandoff.signoff.operatingPacket.closeoutHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(buyerExpansionRecheckCloseout).toMatchObject({
      status: "ready",
      decision: "accept-expansion",
      actualMonthlyValueYen: 680000,
      valueFloorYen: contract.valueFloorYen,
      readyCheckCount: 5,
      checkCount: 5,
      receipt: {
        verificationApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
        payload: {
          receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_RECEIPT_VERSION,
          source: "quick-workflow-buyer-expansion-recheck-closeout",
          sourceSignoffReceiptId: buyerExpansionHandoff.signoff.receiptId,
          sourceHandoffReceiptId: buyerExpansionHandoff.handoffId
        }
      }
    });
    expect(buyerExpansionRecheckCloseout.receipt.receiptId).toMatch(/^quick-buyer-expansion-recheck-closeout-ready-[0-9a-f]{8}$/);
    expect(buyerExpansionRecheckCloseout.exportMarkdown).toContain("# Buyer expansion recheck closeout");
    expect(buyerExpansionRecheckCloseout.exportMarkdown).toContain(`API verification: POST ${QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH}`);
    expect(stoppedBuyerExpansionRecheckCloseout).toMatchObject({
      status: "ready",
      decision: "stop-expansion",
      actualMonthlyValueYen: 300000,
      valueFloorYen: contract.valueFloorYen,
      readyCheckCount: 5,
      checkCount: 5
    });
    expect(invalidBelowFloorExpansionCloseout).toMatchObject({
      status: "watch",
      decision: "hold-closeout",
      actualMonthlyValueYen: 300000,
      valueFloorYen: contract.valueFloorYen,
      readyCheckCount: 4,
      checkCount: 5
    });
    expect(invalidBelowFloorExpansionCloseout.checks.find((check) => check.id === "floor-decision")).toMatchObject({
      status: "watch",
      missingSignals: expect.arrayContaining(["floor decision aligned", "below floor routed to repair or stop"])
    });
    expect(verifyQuickWorkflowBuyerExpansionRecheckCloseoutRequest(JSON.parse(buyerExpansionRecheckCloseout.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-buyer-expansion-recheck-closeout.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: buyerExpansionRecheckCloseout.receipt.checksum,
          actualChecksum: buyerExpansionRecheckCloseout.receipt.checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-buyer-expansion-recheck-closeout.v1",
          status: "ready",
          decision: "accept-expansion",
          sourceSignoffReceiptId: buyerExpansionHandoff.signoff.receiptId,
          actualMonthlyValueYen: 680000,
          valueFloorYen: contract.valueFloorYen,
          readyCheckCount: 5,
          checkCount: 5
        }
      }
    });
    expect(verifyReceiptVerificationDeskRequest(JSON.parse(buyerExpansionRecheckCloseout.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "receipt-verifier.dispatch",
        status: "verified",
        verified: true,
        receiptType: "quick-workflow-buyer-expansion-recheck-closeout.v1",
        receiptLabel: "Buyer expansion recheck closeout",
        sourceVerifierApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
        nativeSkill: "quick-workflow-buyer-expansion-recheck-closeout.receipt.verify",
        handoff: {
          decision: "accept-for-review"
        }
      }
    });
    expect(buyerExpansionHandoff.signoff.operatingPacket.exportMarkdown).toContain("# Quick workflow buyer expansion operating packet");
    expect(buyerExpansionHandoff.signoff.operatingPacket.exportMarkdown).toContain("Before renewal or wider rollout");
    expect(buyerExpansionHandoff.signoff.operatingPacket.exportMarkdown).toContain("Calendar export: quick-buyer-expansion-recheck-2026-07-31.ics");
    expect(buyerExpansionHandoff.signoff.operatingPacket.exportMarkdown).toContain("Closeout export: quick-buyer-expansion-recheck-closeout-2026-07-31.md");
    expect(decodeURIComponent(buyerExpansionHandoff.signoff.operatingPacket.exportHref.split(",")[1] ?? "")).toBe(
      buyerExpansionHandoff.signoff.operatingPacket.exportMarkdown
    );
    expect(JSON.parse(buyerExpansionHandoff.signoff.payloadJson)).toMatchObject({
      receiptVersion: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_RECEIPT_VERSION,
      source: "quick-workflow-buyer-expansion-handoff-signoff",
      decision: "approve-next-window",
      handoffReceiptId: buyerExpansionHandoff.handoffId,
      handoffChecksum: `fnv1a32:${buyerExpansionHandoff.checksum}`,
      taskReadyCount: 4,
      taskTotalCount: 4,
      requiredProof: expect.arrayContaining([expect.stringContaining("Record procurement signoff")]),
      operatingPacket: expect.objectContaining({
        headline: "Approval carries an owner ledger",
        recheckWindow: "Before renewal or wider rollout",
        calendar: expect.objectContaining({
          status: "scheduled",
          startDate: "2026-07-31",
          endDate: "2026-08-01"
        }),
        recheckCloseout: expect.objectContaining({
          status: "recordable",
          scheduledDate: "2026-07-31",
          sourceHandoffReceiptId: buyerExpansionHandoff.handoffId
        }),
        tasks: expect.arrayContaining([
          expect.objectContaining({
            id: "schedule-retained-value-recheck",
            owner: "Finance owner",
            dueLabel: "2026-07-31"
          })
        ])
      })
    });
    expect(verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest(JSON.parse(buyerExpansionHandoff.signoff.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "quick-workflow-buyer-expansion-handoff-signoff.receipt.verify",
        verification: {
          status: "verified",
          expectedChecksum: buyerExpansionHandoff.signoff.checksum,
          actualChecksum: buyerExpansionHandoff.signoff.checksum
        },
        receipt: {
          receiptVersion: "quick-workflow-buyer-expansion-handoff-signoff.v1",
          decision: "approve-next-window",
          status: "ready",
          handoffReceiptId: buyerExpansionHandoff.handoffId,
          operatingPacket: {
            headline: "Approval carries an owner ledger",
            recheckWindow: "Before renewal or wider rollout",
            calendarStatus: "scheduled",
            calendarStartDate: "2026-07-31",
            closeoutStatus: "recordable",
            closeoutScheduledDate: "2026-07-31",
            taskCount: 4,
            firstDueLabel: "At approval"
          }
        }
      }
    });
    expect(buyerExpansionHandoff.sendNoteBody).toContain(`Handoff ID: ${buyerExpansionHandoff.handoffId}`);
    expect(buyerExpansionHandoff.sendNoteBody).toContain(`Verifier: ${buyerExpansionHandoff.receipt.verifierHref}`);
    expect(buyerExpansionHandoff.sendNoteBody).toContain(`Signoff verifier: ${buyerExpansionHandoff.signoff.verifierHref}`);
    expect(buyerExpansionHandoff.exportMarkdown).toContain("# Quick workflow buyer expansion procurement handoff");
    expect(buyerExpansionHandoff.exportMarkdown).toContain("## Owner tasks");
    expect(buyerExpansionHandoff.signoff.exportMarkdown).toContain("## Operating packet");
    expect(buyerExpansionHandoff.signoff.exportMarkdown).toContain("Owner tasks: 4/4");
    expect(buyerExpansionHandoff.exportMarkdown).toContain(`API verification: POST ${QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH}`);
    expect(buyerExpansionHandoff.exportMarkdown).toContain(`Signoff API verification: POST ${QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH}`);
    expect(decodeURIComponent(buyerExpansionHandoff.signoff.exportHref.split(",")[1] ?? "")).toBe(buyerExpansionHandoff.signoff.exportMarkdown);
    expect(decodeURIComponent(buyerExpansionHandoff.exportHref.split(",")[1] ?? "")).toBe(buyerExpansionHandoff.exportMarkdown);
    expect(preRunBuyerExpansionHandoff).toMatchObject({
      status: "watch",
      headline: "Procurement handoff is assembling",
      readyCount: 0,
      totalCount: 4
    });
    expect(preRunBuyerExpansionHandoff.approvalLine).toContain("Hold approval");
    expect(buyerExpansionPacketHtml).toContain("Procurement handoff");
    expect(buyerExpansionPacketHtml).toContain("Export handoff");
    expect(buyerExpansionPacketHtml).toContain("Download one-pager");
    expect(buyerExpansionPacketHtml).toContain("Task CSV");
    expect(buyerExpansionPacketHtml).toContain("Handoff receipt");
    expect(buyerExpansionPacketHtml).toContain("Verifier request");
    expect(buyerExpansionPacketHtml).toContain("Verify handoff");
    expect(buyerExpansionPacketHtml).toContain("Procurement signoff");
    expect(buyerExpansionPacketHtml).toContain("Operating packet");
    expect(buyerExpansionPacketHtml).toContain("Owner ledger");
    expect(buyerExpansionPacketHtml).toContain("Recheck calendar");
    expect(buyerExpansionPacketHtml).toContain("Closeout template");
    expect(buyerExpansionPacketHtml).toContain("Structured closeout input");
    expect(buyerExpansionPacketHtml).toContain("Actual retained value");
    expect(buyerExpansionPacketHtml).toContain("Apply structured evidence");
    expect(buyerExpansionPacketHtml).toContain("Enter actual value");
    expect(buyerExpansionPacketHtml).toContain("Projected closeout");
    expect(buyerExpansionPacketHtml).toContain("hold-closeout");
    expect(buyerExpansionPacketHtml).toContain("Recheck closeout evidence");
    expect(buyerExpansionPacketHtml).toContain("Verify closeout");
    expect(buyerExpansionPacketHtml).toContain("Signoff receipt");
    expect(buyerExpansionPacketHtml).toContain("Verify signoff");
    expect(stoppedExpansionGuardrail).toMatchObject({
      status: "blocked",
      decision: "stop-expansion",
      headline: "Stop expansion and repair value",
      valueRuler: {
        status: "blocked",
        label: "Below stop rule"
      }
    });
    expect(emptyDecisionBrief).toMatchObject({
      status: "watch",
      decision: "revise-evidence",
      headline: "Decision brief needs evidence repair"
    });
    expect(html).toContain("Pilot run log");
    expect(html).toContain("Paste live run evidence");
    expect(html).toContain("Send closeout");
    expect(html).toContain("Run receipt");
    expect(html).toContain("Verifier request");
    expect(html).toContain("Verify run");
    expect(html).toContain("Pilot decision brief");
    expect(html).toContain("Send decision");
    expect(html).toContain("Decision receipt");
    expect(html).toContain("Verify decision");
    expect(html).toContain("Verify contract");
    expect(html).toContain("Expansion guardrail ledger");
    expect(html).toContain("Structured value recheck builder");
    expect(html).toContain("Actual monthly value");
    expect(html).toContain("Generated evidence");
    expect(html).toContain("Expansion value ruler");
    expect(html).toContain("Awaiting value recheck");
    expect(html).toContain("Expansion receipt");
    expect(html).toContain("Verify expansion");
    expect(html).not.toMatch(/demo/i);
  });

  test("explains when a parsed A2A trial receipt uses a demo artifact URL", () => {
    const note = [
      "Buyer: Platform release lead.",
      "Workflow: weekly release review is copied from tickets, CI logs, and chat by hand.",
      "Success metric: save 6 hours per review and keep releases on schedule.",
      "Baseline: manual release review takes 28 hours/review across tickets, CI logs, and chat.",
      "Team: 8 people",
      "Reviews: 5 reviews/month",
      "Manual: 28 hours/review",
      "Adoption: 75% adoption",
      "Hourly cost: ¥12,000/h",
      "Pilot result: manual 1680 min, assisted 560 min, accepted 5/5 tasks.",
      "Reviewer: Platform sponsor",
      "Deployment: https://release-agent.global.run.app",
      "ProtoPedia: https://protopedia.net/prototype/9999",
      "Walkthrough: https://youtu.be/abcd1234",
      "Pilot receipt: https://proof.opsbridge.ai/pilot-receipt.json",
      "Work order proof: https://github.com/acme/release-agent/issues/42",
      "Accepted A2A trial: agent=ReleaseProofAgent, skill=release.review.verify, status accepted, score 92/100, artifact https://example.com/a2a-trial-receipt.json",
      "Data boundary: public redacted synthetic evidence only."
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);

    expect(draft.agentTrialEvidence).toMatchObject({
      agentName: "ReleaseProofAgent",
      skillId: "release.review.verify",
      score: 92,
      artifactUrl: "https://example.com/a2a-trial-receipt.json"
    });
    expect(draft.detectedSignals).toContain("accepted A2A trial receipt");
    expect(readiness).toMatchObject({
      status: "watch",
      readyCount: 5,
      totalCount: 6
    });
    expect(readiness.items.find((item) => item.id === "public-proof")).toMatchObject({
      status: "ready",
      evidence: "5/5 proof links: deployment, ProtoPedia, walkthrough, pilot receipt, work order proof."
    });
    expect(readiness.items.find((item) => item.id === "agent-trust")).toMatchObject({
      status: "watch",
      evidence: "ReleaseProofAgent / release.review.verify / 92/100, but artifact is example.com demo domain.",
      action: "Replace the accepted A2A trial artifact with a public HTTPS receipt URL."
    });
    expect(quickWorkflowApplyGate(readiness, true)).toMatchObject({
      canApply: false,
      message: "Cannot apply yet: Replace the accepted A2A trial artifact with a public HTTPS receipt URL."
    });
  });

  test("shows the break-even gap when a workflow is useful but too small", () => {
    const note = [
      "Buyer: Finance operations lead.",
      "Workflow: monthly exception review copies ERP notes into an approval memo before finance close.",
      "Baseline: review notes are copied by hand from spreadsheets and approval chat.",
      "Success: reduce prep time and make each exception decision auditable before close.",
      "Team 4, 2 reviews/month, manual 2 hours per review, 50% adoption, hourly cost 10000 yen.",
      "Pilot: manual 120 min, assisted 90 min, 2/3 accepted tasks.",
      "Data boundary: public-safe synthetic finance metadata.",
      "Evidence: https://proof.opsbridge.ai/finance-proof"
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);

    expect(valueDiagnosis).toMatchObject({
      status: "blocked",
      headline: "Workflow is too small for a paid pilot",
      summary: "Even perfect automation cannot reach ¥250,000/month at the current frequency and scope.",
      monthlyValueYen: 5000,
      monthlyHoursSaved: 0.5,
      pilotBudgetCeilingYen: 3000
    });
    expect(valueDiagnosis.items.find((item) => item.id === "measured-value")).toMatchObject({
      status: "watch",
      value: "¥5,000/month"
    });
    expect(valueDiagnosis.items.find((item) => item.id === "break-even")).toMatchObject({
      status: "watch",
      value: "1500m/run target",
      detail: "Current 30m/run must reach about 1500m/run at 2 cycles/month and 50% adoption."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "scope-fit")).toMatchObject({
      status: "blocked",
      value: "Scope too small",
      detail: "Break-even needs 1500m saved/run, but the whole manual run is 120m. Broaden to about 25 cycles/month at full automation."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "pilot-boundary")).toMatchObject({
      status: "watch",
      value: "¥3,000 cap",
      detail: "Measured value only supports a tiny cap; keep this unpaid or improve the workflow economics."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "next-fix")).toMatchObject({
      status: "blocked",
      value: "Scope fit",
      detail: "Broaden the workflow to about 25 cycles/month or pick a larger manual run before collecting more proof."
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "automation")).toMatchObject({
      status: "blocked",
      value: "0m assisted is still short",
      detail: "Perfect automation saves 120m/run, below the 1500m/run break-even."
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "scope")).toMatchObject({
      status: "watch",
      value: "25 cycles/month at full automation",
      detail: "Current savings would need 100 cycles/month; full automation lowers the target to 25.",
      targetField: "cyclesPerMonth",
      targetValue: "100",
      targetAction: "Use 100 cycles/month",
      targetEffect: "Clears the floor at current 30m/run savings.",
      targetMonthlyValueYen: 250000,
      targetMonthlyHoursSaved: 25,
      targetOutcome: "¥250,000/month / 25h/month"
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "adoption")).toMatchObject({
      status: "blocked",
      value: "2500% adoption required",
      detail: "Would need 2500% adoption, so adoption alone cannot close this at current savings and volume."
    });
    expect(valueDiagnosis.exportMarkdown).toContain("Break-even target: 1500m saved/run for ¥250,000/month");
    expect(valueDiagnosis.exportMarkdown).toContain("Scope fit: Break-even needs 1500m saved/run, but the whole manual run is 120m. Broaden to about 25 cycles/month at full automation.");
    expect(valueDiagnosis.exportMarkdown).toContain("Next action: Broaden the workflow to about 25 cycles/month or pick a larger manual run before collecting more proof.");
    expect(valueDiagnosis.exportMarkdown).toContain("[watch] Scope lever: 25 cycles/month at full automation. Current savings would need 100 cycles/month; full automation lowers the target to 25.");
    expect(valueDiagnosis.exportMarkdown).toContain("Target outcome: ¥250,000/month / 25h/month.");

    const offer = buildQuickWorkflowCommercialPilotOffer(draft, readiness, valueDiagnosis);
    expect(offer).toMatchObject({
      status: "blocked",
      decision: "Do not quote a paid pilot",
      suggestedPilotPriceYen: 0,
      priceLine: "No paid price yet",
      guardrail: "Keep the workflow in discovery until measured value clears the paid-pilot floor."
    });
    expect(offer.summary).toContain("does not justify a paid pilot");
    expect(offer.terms.find((term) => term.id === "price")).toMatchObject({
      status: "blocked",
      value: "No paid price yet"
    });
    expect(offer.approvalMemo).toMatchObject({
      status: "blocked",
      decision: "hold"
    });
    expect(offer.stressCases.every((stressCase) => stressCase.status === "blocked")).toBe(true);
    expect(offer.objections.find((objection) => objection.id === "price-defense")).toMatchObject({
      status: "blocked",
      answer: "There is no defensible paid price yet."
    });
    expect(offer.decisionPacket).toMatchObject({
      status: "blocked",
      mode: "hold",
      headline: "Decision packet is a hold notice"
    });
    expect(offer.decisionPacket.subject).toContain("Hold paid pilot");
    expect(offer.decisionPacket.attachments.find((attachment) => attachment.id === "offer")).toMatchObject({
      status: "blocked",
      value: "No paid offer"
    });
    const responseRecord = buildQuickWorkflowCommercialResponseRecord(offer, "No, this is too expensive and not approved for this quarter.");
    expect(responseRecord).toMatchObject({
      status: "blocked",
      decision: "declined",
      headline: "Buyer declined or paused the pilot",
      owner: "Workflow owner"
    });
    expect(responseRecord.detectedSignals).toContain("negative decision");
    expect(responseRecord.followUps.find((followUp) => followUp.id === "objection-log")).toMatchObject({
      status: "blocked"
    });
  });

  test("shows when stronger automation can make the same workflow valuable", () => {
    const note = [
      "Buyer: Support operations lead.",
      "Workflow: hourly escalation review turns support backlog signals into a supervisor approval memo.",
      "Baseline: supervisors copy support queues, risk notes, and Slack approvals into the memo by hand.",
      "Success: reduce review prep below 70 minutes and make escalation approval auditable.",
      "Team 12, 60 reviews/month, manual 2 hours per review, 100% adoption, hourly cost 5000 yen.",
      "Pilot: manual 120 min, assisted 80 min, 4/5 accepted tasks.",
      "Data boundary: public-safe synthetic support metadata.",
      "Evidence: https://proof.opsbridge.ai/support-proof"
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const valueDiagnosis = buildQuickWorkflowValueDiagnosis(draft, readiness);

    expect(valueDiagnosis).toMatchObject({
      status: "watch",
      headline: "Value needs stronger automation to clear the floor",
      monthlyValueYen: 200000,
      monthlyHoursSaved: 40
    });
    expect(valueDiagnosis.items.find((item) => item.id === "break-even")).toMatchObject({
      status: "watch",
      value: "50m/run target"
    });
    expect(valueDiagnosis.items.find((item) => item.id === "scope-fit")).toMatchObject({
      status: "watch",
      value: "Automation can close it",
      detail: "Reduce assisted time to 70m/run or better to clear the floor."
    });
    expect(valueDiagnosis.items.find((item) => item.id === "next-fix")).toMatchObject({
      status: "watch",
      value: "Scope fit",
      detail: "Reduce assisted time to 70m/run or better, then rerun the pilot measurement."
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "automation")).toMatchObject({
      status: "watch",
      value: "70m assisted target",
      detail: "Save 50m/run instead of 40m/run; 10m/run more closes the value gap.",
      targetField: "pilotAssistedMinutes",
      targetValue: "70",
      targetAction: "Use 70m assisted target",
      targetEffect: "Closes 10m/run value gap at current volume.",
      targetMonthlyValueYen: 250000,
      targetMonthlyHoursSaved: 50,
      targetOutcome: "¥250,000/month / 50h/month"
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "scope")).toMatchObject({
      status: "watch",
      value: "75 cycles/month target",
      detail: "Broaden from 60 to about 75 cycles/month at the current 40m/run savings.",
      targetField: "cyclesPerMonth",
      targetValue: "75",
      targetAction: "Use 75 cycles/month",
      targetEffect: "Clears the floor at current 40m/run savings.",
      targetMonthlyValueYen: 250000,
      targetMonthlyHoursSaved: 50,
      targetOutcome: "¥250,000/month / 50h/month"
    });
    expect(valueDiagnosis.levers.find((lever) => lever.id === "adoption")).toMatchObject({
      status: "blocked",
      value: "125% adoption required",
      detail: "Would need 125% adoption, so adoption alone cannot close this at current savings and volume."
    });
  });

  test("turns a workflow note without a trial receipt into an A2A trial starter", () => {
    const note = [
      "Buyer: Platform release lead.",
      "Workflow: weekly Cloud Run release-readiness review collects Jira blockers, GitHub deploy status, rollout checks, and customer-risk notes before sponsor approval.",
      "Baseline: release proof is rebuilt by hand from tickets, logs, and review chat.",
      "Success: reduce review prep to under 90 minutes and make the release decision auditable.",
      "Team 8, 5 reviews/month, manual 9 hours per review, 70% adoption, hourly cost 13000 yen.",
      "Pilot: manual 540 min, assisted 95 min, 5/6 accepted tasks.",
      "Reviewer: Platform sponsor.",
      "Data boundary: public-safe redacted release metadata only.",
      "Evidence: https://proof.opsbridge.ai/release-proof"
    ].join("\n");
    const draft = buildWorkflowIntakeDraftFromText(note);
    const readiness = buildQuickWorkflowInputReadiness(note, draft);
    const starter = buildQuickA2ATrialStarter(draft, readiness, note);
    const payload = JSON.parse(starter.payloadJson);

    expect(starter.status).toBe("watch");
    expect(starter.recommended).toMatchObject({
      agentId: "cloud-run-sre",
      name: "Cloud Run SRE"
    });
    expect(starter.trialMethod).toBe("message/send");
    expect(starter.candidates).toHaveLength(3);
    expect(payload).toMatchObject({
      protocol: "a2a.message/send",
      agentId: "cloud-run-sre",
      method: "message/send",
      buyer: "Platform release lead",
      dataBoundary: "public"
    });
    expect(payload.skillId).toMatch(/cloudrun|evidence|observe|release/);
    expect(payload.acceptanceCriteria).toContain("Show whether the run can satisfy: reduce review prep to under 90 minutes and make the release decision auditable.");
    expect(payload.proofLinks).toEqual(["https://proof.opsbridge.ai/release-proof"]);
    expect(starter.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a32",
      payloadChecksum: starter.receipt.checksum
    });
    expect(starter.receipt.receiptId).toMatch(/^quick-a2a-trial-cloud-run-sre-[a-f0-9]{8}$/);
  });

  test("server workflow extraction exposes audited fallback provenance when Gemini is unavailable", async () => {
    const result = await extractWorkflowIntakeDraft(QUICK_WORKFLOW_INTAKE_EXAMPLE, {
      apiKey: "",
      now: "2026-06-23T00:00:00.000Z"
    });

    expect(result).toMatchObject({
      source: "local-fallback",
      model: "deterministic-workflow-intake-v1",
      extractedAt: "2026-06-23T00:00:00.000Z",
      fallbackReason: "GEMINI_API_KEY is not configured."
    });
    expect(result.guardrails).toContain("Public proof URLs are accepted only when they appear in the pasted note.");
    expect(result.draft.detectedSignals).toContain("accepted A2A trial receipt");
    expect(result.draft.sourceTrace.find((item) => item.id === "agent-trial")).toMatchObject({
      status: "traced"
    });
    expect(result.draft.proofLinks).toMatchObject({
      targetUrl: SUBMISSION_PROOF.deployedUrl,
      pilotEvidenceUrl: `${SUBMISSION_PROOF.deployedUrl}${SAMPLE_PILOT_RECEIPT_PATH}`,
      workOrderEvidenceUrl: `${SUBMISSION_PROOF.deployedUrl}${SAMPLE_WORK_ORDER_PATH}`
    });
    expect(result.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH,
      verification: {
        status: "verified"
      },
      payload: {
        source: "local-fallback",
        fallbackReason: "GEMINI_API_KEY is not configured."
      }
    });
    expect(result.receipt.receiptId).toMatch(/^workflow-intake-local-fallback-[a-f0-9]{12}$/);
    const receiptMarkdown = decodeURIComponent(result.receipt.href.split(",")[1] ?? "");
    expect(receiptMarkdown).toContain("## Ignored model suggestions");
    expect(receiptMarkdown).toContain("- None.");
    expect(receiptMarkdown).toContain("## Source trace");
    expect(receiptMarkdown).toContain("extracted facts traced to source lines.");
    expect(receiptMarkdown).toContain("[traced] A2A trial receipt");
    expect(verifyWorkflowIntakeExtractionReceiptRequest(JSON.parse(result.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        skill: "workflow.intake.extract.verify",
        verification: {
          status: "verified"
        },
        receipt: {
          ignoredModelSuggestions: 0,
          sourceTrace: result.draft.sourceTrace.length,
          tracedSourceFacts: result.draft.sourceTrace.filter((item) => item.status === "traced").length
        }
      }
    });
  });

  test("server workflow extraction receipt verification rejects tampered payloads", async () => {
    const result = await extractWorkflowIntakeDraft(QUICK_WORKFLOW_INTAKE_EXAMPLE, {
      apiKey: "",
      now: "2026-06-23T00:00:00.000Z"
    });
    const request = JSON.parse(result.receipt.verificationRequestJson) as {
      payload: {
        draft: {
          confidence: number;
        };
      };
    };
    request.payload.draft.confidence = 1;

    expect(verifyWorkflowIntakeExtractionReceiptRequest(request)).toMatchObject({
      statusCode: 422,
      body: {
        verification: {
          status: "mismatch"
        }
      }
    });
  });

  test("server workflow extraction uses Gemini output without accepting invented proof URLs", async () => {
    const text = [
      "Buyer: RevOps lead",
      "Workflow: reconcile renewal exceptions from CRM notes and finance approvals.",
      "Success: save 4 hours per renewal review.",
      "Team 6 people, 4 reviews/month, manual 8 hours per review, 70% adoption, hourly ¥10000, risk ¥120000.",
      "Pilot: manual 240 min, assisted 90 min, 3 participants, 4/4 tasks accepted.",
      "Data: public-safe redacted evidence.",
      "Work order proof: https://proof.example.com/revops-work-order"
    ].join("\n");
    const result = await extractWorkflowIntakeDraft(text, {
      apiKey: "test-key",
      model: "gemini-test",
      now: "2026-06-23T00:00:00.000Z",
      generateContent: async () =>
        JSON.stringify({
          workOrder: {
            targetUser: "RevOps lead",
            request: "Reconcile renewal exceptions from CRM notes and finance approvals.",
            successMetric: "Save 4 hours per renewal review.",
            dataSensitivity: "public",
            evidenceUrl: "https://proof.example.com/revops-work-order"
          },
          buyerScenario: {
            teamSize: 6,
            cyclesPerMonth: 4,
            manualHoursPerCycle: 8,
            adoptionRatePercent: 70,
            hourlyCostYen: 10000,
            incidentRiskYenPerMonth: 120000
          },
          pilotRun: {
            observedManualMinutes: 240,
            observedAssistedMinutes: 90,
            participants: 3,
            acceptedTasks: 4,
            totalTasks: 4
          },
          proofLinks: {
            targetUrl: "https://invented.example.com/app",
            workOrderEvidenceUrl: "https://proof.example.com/revops-work-order"
          },
          confidence: 96,
          summary: "RevOps lead / renewal exception review / public proof attached",
          detectedSignals: ["Gemini structured workflow"],
          warnings: []
        })
    });

    expect(result).toMatchObject({
      source: "gemini",
      model: "gemini-test",
      extractedAt: "2026-06-23T00:00:00.000Z"
    });
    expect(result.draft.confidence).toBe(90);
    expect(result.draft.proofLinks.targetUrl).toBeUndefined();
    expect(result.draft.proofLinks.workOrderEvidenceUrl).toBe("https://proof.example.com/revops-work-order");
    expect(result.receipt).toMatchObject({
      checksumAlgorithm: "fnv1a-64",
      verificationApiPath: WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH,
      payload: {
        source: "gemini",
        model: "gemini-test"
      },
      verification: {
        status: "verified"
      }
    });
    const receiptMarkdown = decodeURIComponent(result.receipt.href.split(",")[1] ?? "");
    expect(receiptMarkdown).toContain("## Ignored model suggestions");
    expect(receiptMarkdown).toContain("Gemini suggested Deployed URL that was not present in the pasted note, so it was ignored.");
    expect(receiptMarkdown).toContain("## Source trace");
    expect(receiptMarkdown).toContain("[traced] Public proof");
    const receiptAudit = quickWorkflowExtractionGuardrailAudit(result.draft.warnings);
    expect(verifyWorkflowIntakeExtractionReceiptRequest(JSON.parse(result.receipt.verificationRequestJson))).toMatchObject({
      statusCode: 200,
      body: {
        verification: {
          status: "verified"
        },
        receipt: {
          ignoredModelSuggestions: receiptAudit.totalIgnored,
          sourceTrace: result.draft.sourceTrace.length
        }
      }
    });
    expect(result.draft.workOrder).toMatchObject({
      targetUser: "RevOps lead",
      dataSensitivity: "public",
      evidenceUrl: "https://proof.example.com/revops-work-order"
    });
    expect(result.draft.detectedSignals).toEqual(
      expect.arrayContaining(["workflow request", "target buyer", "success metric", "ROI assumptions", "measured minutes", "accepted tasks", "public evidence URL", "data boundary"])
    );
    expect(result.draft.detectedSignals).not.toContain("Gemini structured workflow");
    expect(result.draft.warnings).toContain("Gemini suggested Deployed URL that was not present in the pasted note, so it was ignored.");
  });

  test("server workflow extraction ignores Gemini facts that are not grounded in the pasted note", async () => {
    const text = "Buyer: Finance ops lead\nWorkflow: reconcile month-end exceptions with restricted customer data.";
    const result = await extractWorkflowIntakeDraft(text, {
      apiKey: "test-key",
      model: "gemini-test",
      now: "2026-06-23T00:00:00.000Z",
      generateContent: async () =>
        JSON.stringify({
          workOrder: {
            targetUser: "Finance ops lead",
            request: "reconcile month-end exceptions with restricted customer data.",
            successMetric: "Close 8 exceptions per month.",
            currentBaseline: "Finance analysts reconcile in spreadsheets.",
            dataSensitivity: "public",
            evidenceUrl: "https://invented.example.com/work-order"
          },
          buyerScenario: {
            teamSize: 12,
            cyclesPerMonth: 8,
            manualHoursPerCycle: 10,
            adoptionRatePercent: 90,
            hourlyCostYen: 15000,
            incidentRiskYenPerMonth: 500000
          },
          pilotRun: {
            observedManualMinutes: 600,
            observedAssistedMinutes: 80,
            participants: 5,
            acceptedTasks: 5,
            totalTasks: 5,
            evidenceUrl: "https://invented.example.com/pilot"
          },
          proofLinks: {
            targetUrl: "https://invented.example.com/app",
            workOrderEvidenceUrl: "https://invented.example.com/work-order"
          },
          agentTrialEvidence: {
            artifactUrl: "https://invented.example.com/a2a",
            agentName: "Cloud Run SRE",
            skillId: "cloudrun.release-proof",
            score: 99
          },
          confidence: 100,
          detectedSignals: ["Gemini structured workflow", "ROI assumptions", "public evidence URL", "accepted A2A trial receipt"],
          warnings: []
        })
    });
    const readiness = buildQuickWorkflowInputReadiness(text, result.draft);

    expect(result).toMatchObject({
      source: "gemini",
      model: "gemini-test"
    });
    expect(result.draft.workOrder).toMatchObject({
      targetUser: "Finance ops lead",
      request: "reconcile month-end exceptions with restricted customer data.",
      dataSensitivity: "restricted"
    });
    expect(result.draft.workOrder.successMetric).toBeUndefined();
    expect(result.draft.workOrder.currentBaseline).toBeUndefined();
    expect(result.draft.workOrder.evidenceUrl).toBeUndefined();
    expect(result.draft.buyerScenario).toEqual({});
    expect(result.draft.pilotRun).toEqual({});
    expect(result.draft.proofLinks).toEqual({});
    expect(result.draft.agentTrialEvidence).toBeUndefined();
    expect(result.draft.confidence).toBe(30);
    expect(result.draft.detectedSignals).toEqual(["workflow request", "target buyer", "data boundary"]);
    expect(result.draft.warnings).toEqual(
      expect.arrayContaining([
        "Gemini suggested success metric that was not present in the pasted note, so it was ignored.",
        "Gemini suggested current baseline that was not present in the pasted note, so it was ignored.",
        "Gemini suggested team size that was not present in the pasted note, so it was ignored.",
        "Gemini suggested manual minutes that was not present in the pasted note, so it was ignored.",
        "Gemini suggested A2A trial artifact URL that was not present in the pasted note, so it was ignored."
      ])
    );
    const audit = quickWorkflowExtractionGuardrailAudit(result.draft.warnings);
    expect(audit.totalIgnored).toBeGreaterThanOrEqual(5);
    expect(audit.ignoredSuggestions).toHaveLength(4);
    expect(audit.hiddenIgnored).toBe(audit.totalIgnored - 4);
    expect(result.draft.sourceTrace.find((item) => item.id === "success")).toMatchObject({ status: "missing" });
    expect(result.draft.sourceTrace.find((item) => item.id === "public-proof")).toMatchObject({ status: "missing" });
    expect(readiness.status).toBe("blocked");
    expect(quickWorkflowApplyGate(readiness, true)).toMatchObject({
      canApply: false,
      message: "Cannot apply yet: Add buyer, workflow, success metric, and current baseline."
    });
  });

  test("turns a quick workflow draft into a buyer room preview before workspace mutation", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 2);

    expect(preview.status).toBe("ready");
    expect(preview.headline).toBe("Buyer room preview is ready for Platform release lead");
    expect(preview.primaryAsk).toBe("Apply this draft, verify live links, then open the launch room.");
    expect(preview.closeRule).toContain("Current workspace has 2 open repair items");
    expect(preview.rows.map((row) => row.id)).toEqual(["scope", "value", "pilot", "proof", "a2a", "data"]);
    expect(preview.rows.every((row) => row.status === "ready")).toBe(true);
    expect(preview.rows.find((row) => row.id === "proof")).toMatchObject({
      value: "5/5 public proof URLs ready"
    });
    expect(preview.rows.find((row) => row.id === "a2a")?.proof).toContain(SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH);
    expect(preview.conversionReceipt).toMatchObject({
      status: "ready",
      headline: "Workflow note became a sendable buyer packet",
      receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      verificationApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
      payload: {
        receiptVersion: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERSION,
        source: "quick-workflow-intake",
        buyer: "Platform release lead",
        status: "ready"
      },
      verification: {
        status: "verified"
      }
    });
    expect(preview.conversionReceipt.receiptId).toMatch(/^quick-conversion-ready-[0-9a-f]{8}$/);
    expect(preview.conversionReceipt.verificationRequestJson).toContain(`"checksum": "${preview.conversionReceipt.checksum}"`);
    expect(preview.conversionReceipt.payloadHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(preview.conversionReceipt.verificationRequestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(preview.conversionReceipt.verifierHref).toContain("/receipt-verifier?request=");
    expect(new URL(preview.conversionReceipt.verifierHref, "https://example.com").searchParams.get("verify")).toBe("1");
    expect(new URL(preview.conversionReceipt.verifierHref, "https://example.com").searchParams.get("request")).toBe(preview.conversionReceipt.verificationRequestJson);
    expect(preview.conversionReceipt.items.map((item) => item.id)).toEqual(["buyer-facts", "artifact-pack", "proof-status", "decision-gate"]);
    expect(preview.conversionReceipt.items.find((item) => item.id === "buyer-facts")).toMatchObject({
      value: "6/6 ready"
    });
    expect(preview.evidencePack).toMatchObject({
      status: "ready",
      label: "Buyer-send evidence pack",
      headline: "Platform release lead can receive a verifiable evidence pack",
      verifierHref: preview.conversionReceipt.verifierHref,
      firstAction: {
        label: "Open receipt verifier",
        href: preview.conversionReceipt.verifierHref
      }
    });
    expect(preview.evidencePack.sendRule).toContain("Send only after live proof verification passes");
    expect(preview.evidencePack.artifacts.map((artifact) => artifact.id)).toEqual([
      "decision-case",
      "send-memo",
      "claim-ledger",
      "proof-repair",
      "redaction",
      "conversion-receipt",
      "pilot-week",
      "decision-close"
    ]);
    expect(preview.evidencePack.artifacts.filter((artifact) => artifact.requiredForSend).every((artifact) => artifact.status === "ready")).toBe(true);
    expect(preview.evidencePack.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(preview.evidencePack.exportMarkdown).toContain("# Buyer evidence pack");
    expect(preview.evidencePack.exportMarkdown).toContain("## Required before buyer send");
    expect(preview.evidencePack.exportMarkdown).toContain(preview.conversionReceipt.receiptId);
    const evidencePackShareUrl = new URL(preview.evidencePack.shareHref, "https://example.com");
    const evidencePackPayloadText = decodeQuickBuyerEvidencePackShareParam(evidencePackShareUrl.searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM));
    const evidencePackPayload = parseQuickBuyerEvidencePackSharePayload(evidencePackPayloadText);
    expect(evidencePackShareUrl.pathname).toBe("/quick-buyer-evidence-pack");
    expect(evidencePackPayloadText).toBe(preview.evidencePack.sharePayloadJson);
    expect(evidencePackPayload).not.toBeNull();
    if (!evidencePackPayload) throw new Error("Expected evidence pack share payload");
    expect(evidencePackPayload).toMatchObject({
      version: QUICK_BUYER_EVIDENCE_PACK_SHARE_VERSION,
      buyer: "Platform release lead",
      status: "ready",
      label: "Buyer-send evidence pack",
      verifierHref: preview.conversionReceipt.verifierHref,
      sourceReceiptId: preview.conversionReceipt.receiptId
    });
    expect(evidencePackPayload.sourceChecksum).toBe(`${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`);
    expect(evidencePackPayload.artifacts).toHaveLength(8);
    expect(evidencePackPayload.artifacts.every((artifact) => !artifact.href.startsWith("data:"))).toBe(true);
    expect(evidencePackPayload.artifacts.find((artifact) => artifact.id === "send-memo")?.href).toBe("");
    const evidenceDecisionCockpit = buildQuickBuyerEvidenceDecisionCockpit(evidencePackPayload);
    expect(evidenceDecisionCockpit).toMatchObject({
      status: "ready",
      recommendedDecision: "continue",
      headline: "Evidence can be accepted with the verifier attached",
      confidence: 100,
      requiredReady: 6,
      requiredTotal: 6,
      primaryQuestion: "Can this evidence pack be used for buyer send?",
      primaryAnswer: "Yes, if the receipt verifier stays attached to the buyer meeting.",
      nextAction: "Schedule the buyer decision meeting and attach the verified conversion receipt."
    });
    expect(evidenceDecisionCockpit.metrics.map((metric) => metric.id)).toEqual(["recommended-decision", "required-artifacts", "source-receipt", "first-action"]);
    expect(evidenceDecisionCockpit.metrics.find((metric) => metric.id === "source-receipt")).toMatchObject({
      status: "ready",
      value: preview.conversionReceipt.receiptId,
      href: preview.conversionReceipt.verifierHref
    });
    const evidenceDecisionReceipt = buildQuickBuyerEvidenceDecisionReceipt({
      payload: evidencePackPayload,
      reviewerName: "Platform sponsor",
      reviewerNote: "Evidence accepted with verifier attached.",
      generatedAt: "2026-06-25T06:00:00.000Z"
    });
    expect(evidenceDecisionReceipt).toMatchObject({
      decision: "continue",
      recommendedDecision: "continue",
      label: "Accept evidence",
      verification: {
        status: "verified"
      },
      payload: {
        decision: "continue",
        status: "ready",
        packetClearance: "external-review",
        testsReady: 6,
        testsTotal: 6,
        confidence: 100,
        manifestReceiptId: preview.conversionReceipt.receiptId
      }
    });
    expect(evidenceDecisionReceipt.verifierHref).toContain("/receipt-verifier?request=");
    expect(evidenceDecisionReceipt.requestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(evidenceDecisionReceipt).toMatchObject({
      owner: "Launch owner"
    });
    expect(evidenceDecisionReceipt.ownerRunbook.map((item) => item.id)).toEqual(["attach-decision-receipt", "schedule-buyer-meeting", "recheck-proof-window"]);
    expect(evidenceDecisionReceipt.ownerPacketHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(evidenceDecisionReceipt.ownerMailHref).toContain("mailto:");
    expect(evidenceDecisionReceipt.ownerPacketMarkdown).toContain("# Buyer evidence response owner packet");
    expect(evidenceDecisionReceipt.ownerPacketMarkdown).toContain("Owner: Launch owner");
    expect(evidenceDecisionReceipt.ownerPacketMarkdown).toContain("## Decision scorecard");
    expect(evidenceDecisionReceipt.scorecard).toMatchObject({
      status: "ready",
      headline: "Decision is externally defendable",
      readyCount: 5,
      totalCount: 5
    });
    expect(evidenceDecisionReceipt.scorecard.items.map((item) => item.id)).toEqual([
      "source-receipt",
      "required-artifacts",
      "reviewer-identity",
      "recommended-decision",
      "send-rule"
    ]);
    expect(evidenceDecisionReceipt.scorecard.items.find((item) => item.id === "reviewer-identity")).toMatchObject({
      status: "ready",
      value: "Platform sponsor"
    });
    expect(evidenceDecisionReceipt.followUpLedger).toMatchObject({
      status: "ready",
      headline: "Buyer response is ready to run",
      readyCount: 3,
      blockedCount: 0,
      taskTotal: 3,
      firstDueLabel: "Today",
      calendarStartDate: "2026-06-25",
      calendarEndDate: "2026-06-27"
    });
    expect(evidenceDecisionReceipt.followUpLedger.tasks.map((task) => task.id)).toEqual(["attach-decision-receipt", "schedule-buyer-meeting", "recheck-proof-window"]);
    expect(evidenceDecisionReceipt.followUpLedger.csv).toContain("taskId,label,status,owner,due,action,closeCondition,evidence,proof,href");
    expect(evidenceDecisionReceipt.followUpLedger.calendarText).toContain("BEGIN:VCALENDAR");
    expect(evidenceDecisionReceipt.followUpLedger.calendarText).toContain("SUMMARY:+1 business day Recheck proof window - Proof owner");
    expect(evidenceDecisionReceipt.followUpLedger.exportMarkdown).toContain("# Buyer evidence response follow-up ledger");
    const anonymousEvidenceDecisionReceipt = buildQuickBuyerEvidenceDecisionReceipt({
      payload: evidencePackPayload,
      generatedAt: "2026-06-25T06:00:00.000Z"
    });
    expect(anonymousEvidenceDecisionReceipt.payload).toMatchObject({
      decision: "continue",
      status: "watch",
      packetClearance: "internal-only",
      reviewerName: "Buyer reviewer"
    });
    expect(anonymousEvidenceDecisionReceipt.scorecard).toMatchObject({
      status: "watch",
      readyCount: 4
    });
    expect(anonymousEvidenceDecisionReceipt.scorecard.items.find((item) => item.id === "reviewer-identity")).toMatchObject({
      status: "watch",
      value: "name required"
    });
    const returnedEvidenceResponseUrl = new URL(evidenceDecisionReceipt.returnHref, "https://example.com");
    expect(returnedEvidenceResponseUrl.hash).toBe("#quick-workflow-intake");
    expect(returnedEvidenceResponseUrl.searchParams.has(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM)).toBe(true);
    expect(decodeQuickBuyerEvidenceResponseShareParam(returnedEvidenceResponseUrl.searchParams.get(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM))).toBe(
      evidenceDecisionReceipt.requestJson
    );
    const workspaceReturnReceipt = buildQuickBuyerEvidenceDecisionReceipt({
      payload: evidencePackPayload,
      reviewerName: "Platform sponsor",
      reviewerNote: "Evidence accepted with verifier attached.",
      generatedAt: "2026-06-25T06:00:00.000Z",
      returnBaseHref: "/?workspace=workspace_test#quick-workflow-intake"
    });
    const workspaceReturnedEvidenceResponseUrl = new URL(workspaceReturnReceipt.returnHref, "https://example.com");
    expect(workspaceReturnedEvidenceResponseUrl.pathname).toBe("/");
    expect(workspaceReturnedEvidenceResponseUrl.hash).toBe("#quick-workflow-intake");
    expect(workspaceReturnedEvidenceResponseUrl.searchParams.get("workspace")).toBe("workspace_test");
    expect(decodeQuickBuyerEvidenceResponseShareParam(workspaceReturnedEvidenceResponseUrl.searchParams.get(QUICK_BUYER_EVIDENCE_RESPONSE_SHARE_PARAM))).toBe(
      workspaceReturnReceipt.requestJson
    );
    const returnedEvidencePlan = buildQuickBuyerEvidenceResponseImportPlan(evidenceDecisionReceipt.returnHref, preview);
    expect(returnedEvidencePlan).toMatchObject({
      state: "verified",
      status: "ready",
      label: "Accept evidence",
      headline: "Platform release lead accepted the evidence pack",
      nextOwner: "Launch owner",
      nextAction: "Schedule the buyer decision meeting and attach the verified conversion receipt."
    });
    expect(returnedEvidencePlan.summary).toContain("Platform sponsor returned");
    expect(returnedEvidencePlan.verifierHref).toContain("/receipt-verifier?request=");
    expect(returnedEvidencePlan.evidencePackHref).toBe(preview.evidencePack.shareHref);
    expect(returnedEvidencePlan.packVerifierHref).toBe(preview.evidencePack.verifierHref);
    expect(returnedEvidencePlan.ownerPacketMarkdown).toContain("Attach decision receipt");
    expect(returnedEvidencePlan.ownerPacketHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(returnedEvidencePlan.ownerMailHref).toContain("mailto:");
    expect(returnedEvidencePlan.ownerPacketReceiptJson).toContain('"receiptVersion": "quick-buyer-evidence-response-owner-packet.v1"');
    const returnedEvidencePlanWithRouteReceiptDrift = buildQuickBuyerEvidenceResponseImportPlan(workspaceReturnReceipt.returnHref, {
      buyer: "Platform release lead",
      conversionReceipt: {
        receiptId: "route-derived-receipt-id",
        checksumAlgorithm: "fnv1a32",
        checksum: "00000000"
      },
      evidencePack: preview.evidencePack
    });
    expect(returnedEvidencePlanWithRouteReceiptDrift).toMatchObject({
      state: "verified",
      evidenceReceiptId: preview.conversionReceipt.receiptId,
      evidenceChecksum: `${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`
    });
    const repairEvidencePackPayload = {
      ...evidencePackPayload,
      status: "watch" as const,
      label: "Buyer-send evidence needs replacement proof",
      headline: "Platform release lead needs replacement proof before buyer send",
      summary: "Live audit found public proof blockers that must be replaced before buyer send.",
      sendRule: "Hold buyer send until replacement proof closeout verifies the repaired public links.",
      firstAction: {
        label: "Fix Public proof links",
        href: "/launch-evidence"
      },
      artifacts: evidencePackPayload.artifacts.map((artifact) =>
        artifact.id === "proof-repair" || artifact.id === "conversion-receipt"
          ? {
              ...artifact,
              status: "blocked" as const,
              href: artifact.id === "proof-repair" ? "http://127.0.0.1:8080/launch-evidence" : "http://127.0.0.1:8080/receipt-verifier",
              proof: `${artifact.proof} Live audit requires replacement proof.`
            }
          : artifact
      )
    };
    const closeoutRepairOrder = buildQuickBuyerEvidenceAuditRepairOrder(repairEvidencePackPayload, {
      checkedAt: "2026-06-25T06:10:00.000Z",
      verifiedCount: 0,
      totalCount: 2,
      score: 0,
      results: [
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
          url: "http://127.0.0.1:8080/receipt-verifier",
          evidence: "Only https URLs can be verified as buyer-facing proof.",
          action: "Replace Outcome receipt verifier with a secure https:// URL."
        }
      ]
    });
    const closeoutWorkspace = buildQuickBuyerEvidenceAuditReplacementWorkspace(closeoutRepairOrder);
    expect(closeoutWorkspace.slots.map((slot) => slot.id)).toEqual(["proof-repair", "conversion-receipt"]);
    const readyCloseout = buildQuickBuyerEvidenceAuditReplacementCloseout({
      workspace: closeoutWorkspace,
      replacements: {
        "proof-repair": "https://proof.example.com/replacement-proof",
        "conversion-receipt": "https://proof.example.com/replacement-receipt"
      },
      audit: {
        checkedAt: "2026-06-25T06:20:00.000Z",
        verifiedCount: 2,
        totalCount: 2,
        score: 100,
        results: closeoutWorkspace.slots.map((slot) => ({
          id: slot.id,
          label: slot.label,
          status: "pass" as const,
          url: slot.id === "proof-repair" ? "https://proof.example.com/replacement-proof" : "https://proof.example.com/replacement-receipt",
          evidence: "Public URL responded with HTTP 200.",
          action: "Keep this replacement proof attached to the buyer response.",
          httpStatus: 200
        }))
      }
    });
    const closeoutReceipt = buildSharedQuickBuyerEvidenceDecisionReceipt({
      payload: repairEvidencePackPayload,
      decision: "continue",
      reviewerName: "Platform sponsor",
      replacementCloseout: readyCloseout,
      generatedAt: "2026-06-25T06:25:00.000Z",
      returnBaseHref: "/?workspace=workspace_test#quick-workflow-intake"
    });
    expect(closeoutReceipt.payload).toMatchObject({
      decision: "continue",
      status: "ready",
      packetStatus: "ready",
      packetClearance: "external-review",
      testsReady: 6,
      testsTotal: 6,
      confidence: 100,
      replacementCloseout: {
        canReopen: true,
        readyCount: 2,
        slotTotal: 2
      }
    });
    expect(closeoutReceipt.payload.proof).toContain("replacement closeout 2/2");
    const closeoutResponseTarget = {
      ...preview,
      evidencePack: {
        ...preview.evidencePack,
        sharePayloadJson: JSON.stringify(repairEvidencePackPayload),
        shareHref: "/quick-buyer-evidence-pack?repair=1"
      }
    };
    const closeoutReturnedPlan = buildQuickBuyerEvidenceResponseImportPlan(closeoutReceipt.returnHref, closeoutResponseTarget);
    expect(closeoutReturnedPlan).toMatchObject({
      state: "verified",
      status: "ready",
      label: "Accept evidence",
      nextOwner: "Launch owner",
      nextAction: "Schedule the buyer decision meeting and attach the verified conversion receipt."
    });
    expect(closeoutReturnedPlan.ownerPacketMarkdown).toContain("Replacement closeout verified 2/2 repair slots");
    expect(closeoutReturnedPlan.followUpLedger.tasks.find((task) => task.id === "recheck-proof-window")).toMatchObject({
      status: "ready",
      action: expect.stringContaining("replacement closeout")
    });
    const markerOnlyResponse = JSON.parse(closeoutReceipt.requestJson) as {
      checksum: string;
      payload: QuickExternalReviewDecisionReceiptPayload;
    };
    delete markerOnlyResponse.payload.replacementCloseout;
    markerOnlyResponse.checksum = quickExternalReviewDecisionReceiptChecksum(markerOnlyResponse.payload);
    const markerOnlyPlan = buildQuickBuyerEvidenceResponseImportPlan(quickExternalReviewDecisionReceiptRequestJson(markerOnlyResponse), closeoutResponseTarget);
    expect(markerOnlyPlan).toMatchObject({
      state: "mismatch",
      status: "blocked",
      label: "Receipt checksum mismatch"
    });
    expect(JSON.parse(returnedEvidencePlan.ownerPacketReceiptJson)).toMatchObject({
      payload: {
        state: "verified",
        owner: "Launch owner",
        evidenceReceiptId: preview.conversionReceipt.receiptId,
        evidenceChecksum: `${preview.conversionReceipt.checksumAlgorithm}:${preview.conversionReceipt.checksum}`,
        responseReceiptChecksum: `fnv1a32:${evidenceDecisionReceipt.checksum}`,
        ownerPacketMarkdown: returnedEvidencePlan.ownerPacketMarkdown,
        runbook: expect.arrayContaining([expect.objectContaining({ id: "attach-decision-receipt" })])
      }
    });
    expect(returnedEvidencePlan.ownerPacketReceiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(returnedEvidencePlan.ownerPacketVerifierStorageKey).toMatch(/^quick-buyer-evidence-response-owner-[a-f0-9]{8}$/);
    const returnedEvidenceOwnerPacketVerifierUrl = new URL(returnedEvidencePlan.ownerPacketVerifierHref, "https://example.com");
    expect(returnedEvidenceOwnerPacketVerifierUrl.pathname).toBe("/receipt-verifier");
    expect(returnedEvidenceOwnerPacketVerifierUrl.searchParams.get("request")).toBe(returnedEvidencePlan.ownerPacketReceiptJson);
    expect(returnedEvidenceOwnerPacketVerifierUrl.searchParams.get("verify")).toBe("1");
    expect(returnedEvidenceOwnerPacketVerifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(returnedEvidencePlan.followUpLedger).toMatchObject({
      status: "ready",
      headline: "Buyer response is ready to run",
      readyCount: 3,
      watchCount: 0,
      blockedCount: 0,
      taskTotal: 3,
      firstDueLabel: "Today",
      calendarStartDate: "2026-06-25",
      calendarEndDate: "2026-06-27"
    });
    expect(returnedEvidencePlan.followUpLedger.tasks.map((task) => task.id)).toEqual(["attach-decision-receipt", "schedule-buyer-meeting", "recheck-proof-window"]);
    expect(returnedEvidencePlan.followUpLedger.tasks[0]).toMatchObject({
      dueLabel: "Today",
      owner: "Launch owner",
      closeCondition: expect.stringContaining("attaches the proof link")
    });
    expect(returnedEvidencePlan.followUpLedger.csv).toContain("taskId,label,status,owner,due,action,closeCondition,evidence,proof,href");
    expect(returnedEvidencePlan.followUpLedger.csv).toContain("schedule-buyer-meeting");
    expect(returnedEvidencePlan.followUpLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(returnedEvidencePlan.followUpLedger.calendarText).toContain("BEGIN:VCALENDAR");
    expect(returnedEvidencePlan.followUpLedger.calendarText).toContain("DTSTART;VALUE=DATE:20260625");
    expect(returnedEvidencePlan.followUpLedger.calendarText).toContain("DTSTART;VALUE=DATE:20260626");
    expect(returnedEvidencePlan.followUpLedger.calendarText).toContain("DTSTART;VALUE=DATE:20260627");
    expect(returnedEvidencePlan.followUpLedger.calendarText).toContain("SUMMARY:+2 business days Schedule buyer meeting - Launch owner");
    expect(returnedEvidencePlan.followUpLedger.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(returnedEvidencePlan.followUpLedger.exportMarkdown).toContain("# Buyer evidence response follow-up ledger");
    expect(returnedEvidencePlan.followUpLedger.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(returnedEvidencePlan.exportMarkdown).toContain("# Buyer evidence response intake");
    expect(returnedEvidencePlan.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    const wrongPackResponse = JSON.parse(evidenceDecisionReceipt.requestJson) as {
      checksum: string;
      payload: QuickExternalReviewDecisionReceiptPayload;
    };
    wrongPackResponse.payload = {
      ...wrongPackResponse.payload,
      manifestReceiptId: "quick-conversion-ready-deadbeef",
      manifestChecksum: "fnv1a32:deadbeef"
    };
    wrongPackResponse.checksum = quickExternalReviewDecisionReceiptChecksum(wrongPackResponse.payload);
    const wrongPackPlan = buildQuickBuyerEvidenceResponseImportPlan(quickExternalReviewDecisionReceiptRequestJson(wrongPackResponse), preview);
    expect(wrongPackPlan).toMatchObject({
      state: "wrong-pack",
      status: "blocked",
      label: "Receipt is for another evidence pack"
    });
    const evidencePackHtml = renderToStaticMarkup(createElement(QuickBuyerEvidencePackSharePage, { payloadText: evidencePackPayloadText }));
    expect(evidencePackHtml).toContain("Platform release lead can receive a verifiable evidence pack");
    expect(evidencePackHtml).toContain("Buyer decision cockpit");
    expect(evidencePackHtml).toContain("Buyer proof answers");
    expect(evidencePackHtml).toContain("Can I trust this evidence without a private walkthrough?");
    expect(evidencePackHtml).toContain("What still blocks an external buyer send?");
    expect(evidencePackHtml).toContain("Evidence disclosure boundary");
    expect(evidencePackHtml).toContain("Download boundary");
    expect(evidencePackHtml).toContain("Email boundary");
    expect(evidencePackHtml).toContain("Global procurement handoff");
    expect(evidencePackHtml).toContain("Download handoff");
    expect(evidencePackHtml).toContain("Email handoff");
    expect(evidencePackHtml).toContain("Buyer adoption risk ledger");
    expect(evidencePackHtml).toContain("Source trust");
    expect(evidencePackHtml).toContain("Proof reachability");
    expect(evidencePackHtml).toContain("Download risk ledger");
    expect(evidencePackHtml).toContain("Risk CSV");
    expect(evidencePackHtml).toContain("Email risk ledger");
    expect(evidencePackHtml).toContain("Risk disposition receipt");
    expect(evidencePackHtml).toContain("Disposition note");
    expect(evidencePackHtml).toContain("Risk receipt JSON");
    expect(evidencePackHtml).toContain("Verify risk receipt");
    expect(evidencePackHtml).toContain("Open risk verifier");
    expect(evidencePackHtml).toContain("Risk receipt memo");
    expect(evidencePackHtml).toContain("Risk disposition owner handoff");
    expect(evidencePackHtml).toContain("Attach risk disposition receipt");
    expect(evidencePackHtml).toContain("Owner handoff");
    expect(evidencePackHtml).toContain("Handoff CSV");
    expect(evidencePackHtml).toContain("Handoff calendar");
    expect(evidencePackHtml).toContain("Email risk owner");
    expect(evidencePackHtml).toContain("Risk owner closeout receipt");
    expect(evidencePackHtml).toContain("Risk closeout JSON");
    expect(evidencePackHtml).toContain("Verify risk closeout");
    expect(evidencePackHtml).toContain("Open risk closeout verifier");
    expect(evidencePackHtml).toContain("Risk closeout memo");
    expect(evidencePackHtml).toContain("Risk recheck packet");
    expect(evidencePackHtml).toContain("Recheck memo");
    expect(evidencePackHtml).toContain("Recheck calendar");
    expect(evidencePackHtml).toContain("Email recheck owner");
    expect(evidencePackHtml).toContain("Buyer-send risk control");
    expect(evidencePackHtml).toContain("Risk control JSON");
    expect(evidencePackHtml).toContain("Verify risk control");
    expect(evidencePackHtml).toContain("Risk control memo");
    expect(evidencePackHtml).toContain("Buyer decision meeting agenda");
    expect(evidencePackHtml).toContain("Download agenda");
    expect(evidencePackHtml).toContain("Email agenda");
    expect(evidencePackHtml).toContain("Buyer committee minutes");
    expect(evidencePackHtml).toContain("Download minutes");
    expect(evidencePackHtml).toContain("Email minutes");
    expect(evidencePackHtml).toContain("Buyer activation plan");
    expect(evidencePackHtml).toContain("Download activation");
    expect(evidencePackHtml).toContain("Activation calendar");
    expect(evidencePackHtml).toContain("Email activation");
    expect(evidencePackHtml).toContain("Buyer value checkpoint");
    expect(evidencePackHtml).toContain("Baseline value claim");
    expect(evidencePackHtml).toContain("Download checkpoint");
    expect(evidencePackHtml).toContain("Checkpoint CSV");
    expect(evidencePackHtml).toContain("Email checkpoint");
    expect(evidencePackHtml).toContain("Value checkpoint receipt");
    expect(evidencePackHtml).toContain("Actual value signal");
    expect(evidencePackHtml).toContain("Checkpoint receipt JSON");
    expect(evidencePackHtml).toContain("Verify checkpoint");
    expect(evidencePackHtml).toContain("Value checkpoint owner handoff");
    expect(evidencePackHtml).toContain("Attach checkpoint receipt");
    expect(evidencePackHtml).toContain("Owner handoff");
    expect(evidencePackHtml).toContain("Handoff CSV");
    expect(evidencePackHtml).toContain("Handoff calendar");
    expect(evidencePackHtml).toContain("Email value owner");
    expect(evidencePackHtml).toContain("Value owner closeout receipt");
    expect(evidencePackHtml).toContain("Closeout receipt JSON");
    expect(evidencePackHtml).toContain("Verify closeout");
    expect(evidencePackHtml).toContain("Open verifier");
    expect(evidencePackHtml).toContain("Closeout memo");
    expect(evidencePackHtml).toContain("Value next window packet");
    expect(evidencePackHtml).toContain("Next window memo");
    expect(evidencePackHtml).toContain("Next window calendar");
    expect(evidencePackHtml).toContain("Email next window");
    expect(evidencePackHtml).toContain("Buyer answer brief");
    expect(evidencePackHtml).toContain("Download brief");
    expect(evidencePackHtml).toContain("Brief CSV");
    expect(evidencePackHtml).toContain("Email brief");
    expect(evidencePackHtml).toContain("Evidence can be accepted with the verifier attached");
    expect(evidencePackHtml).toContain("Can this evidence pack be used for buyer send?");
    expect(evidencePackHtml).toContain("Recommended decision");
    expect(evidencePackHtml).toContain("Decision memo");
    expect(evidencePackHtml).toContain("Can I trust the evidence?");
    expect(evidencePackHtml).toContain("Download memo");
    expect(evidencePackHtml).toContain("Buyer response receipt");
    expect(evidencePackHtml).toContain("Decision scorecard");
    expect(evidencePackHtml).toContain("Reviewer identity");
    expect(evidencePackHtml).toContain("Accept evidence");
    expect(evidencePackHtml).toContain("Verify decision");
    expect(evidencePackHtml).toContain("Return response");
    expect(evidencePackHtml).toContain("Owner handoff");
    expect(evidencePackHtml).toContain("Owner packet");
    expect(evidencePackHtml).toContain("Email owner");
    expect(evidencePackHtml).toContain("Follow-up ledger");
    expect(evidencePackHtml).toContain("Ledger");
    expect(evidencePackHtml).toContain("CSV");
    expect(evidencePackHtml).toContain("Calendar");
    expect(evidencePackHtml).toContain("Required before buyer send");
    expect(evidencePackHtml).toContain(preview.conversionReceipt.receiptId);
    expect(evidencePackHtml).toContain("Receipt verifier");
    expect(preview.pilotWeekPlan.map((step) => step.id)).toEqual(["scope", "instrument", "trial", "verify", "decide"]);
    expect(preview.pilotWeekPlan.every((step) => step.status === "ready")).toBe(true);
    expect(preview.pilotWeekPlan.find((step) => step.id === "trial")).toMatchObject({
      day: "Day 2",
      owner: "Cloud Run SRE",
      href: "#agent-card-intake"
    });
    expect(preview.pilotWeekPlan.find((step) => step.id === "decide")).toMatchObject({
      day: "Day 5",
      owner: "Platform sponsor"
    });
    expect(preview.exportMarkdown).toContain("# Buyer room preview is ready for Platform release lead");
    expect(preview.exportMarkdown).toContain("## Buyer evidence pack");
    expect(preview.exportMarkdown).toContain("## Workflow conversion receipt");
    expect(preview.exportMarkdown).toContain(`Receipt: ${preview.conversionReceipt.receiptId}`);
    expect(preview.exportMarkdown).toContain(`API verification: POST ${QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH}`);
    expect(preview.exportMarkdown).toContain(`Verifier: ${preview.conversionReceipt.verifierHref}`);
    expect(preview.sourceTrace.find((item) => item.id === "workflow")).toMatchObject({
      status: "traced"
    });
    expect(preview.exportMarkdown).toContain("## Source trace");
    expect(preview.exportMarkdown).toContain("[traced] Workflow request");
    expect(preview.publicSafeRedactionPacket).toMatchObject({
      status: "ready",
      blockedCount: 0,
      watchCount: 0,
      headline: "Public-safe packet has no sensitive markers"
    });
    expect(preview.publicSafeRedactionPacket.receipt.receiptId).toMatch(/^quick-public-safe-ready-[0-9a-f]{8}$/);
    expect(preview.publicSafeRedactionPacket.exportMarkdown).toContain("## Redacted workflow note");
    expect(preview.publicSafeRedactionPacket.exportMarkdown).toContain("## Public-safe rewrite");
    expect(preview.publicSafeRedactionPacket.publicSafeWorkflowNote).toContain("Data: public-safe redacted evidence.");
    expect(decodeURIComponent(preview.publicSafeRedactionPacket.publicSafeWorkflowNoteHref.split(",")[1] ?? "")).toBe(preview.publicSafeRedactionPacket.publicSafeWorkflowNote);
    expect(preview.exportMarkdown).toContain("## Public-safe redaction packet");
    expect(preview.exportMarkdown).toContain("### Public-safe rewrite");
    expect(preview.exportMarkdown).toContain(`Receipt: ${preview.publicSafeRedactionPacket.receipt.receiptId}`);
    expect(preview.evidenceCompletionPacket).toMatchObject({
      status: "ready",
      openCount: 0,
      blockedCount: 0,
      watchCount: 0,
      headline: "Evidence completion packet is closed"
    });
    expect(preview.evidenceCompletionPacket.receipt.receiptId).toMatch(/^quick-evidence-completion-ready-[0-9a-f]{8}$/);
    expect(preview.evidenceCompletionPacket.exportMarkdown).toContain("## Completion note");
    expect(preview.exportMarkdown).toContain("## Evidence completion packet");
    expect(preview.exportMarkdown).toContain(`Receipt: ${preview.evidenceCompletionPacket.receipt.receiptId}`);
    expect(preview.exportMarkdown).toContain("## Buyer room contents");
    expect(preview.exportMarkdown).toContain("## Buyer decision case");
    expect(preview.exportMarkdown).toContain("## Buyer impact snapshot");
    expect(preview.exportMarkdown).toContain("## Buyer value map");
    expect(preview.exportMarkdown).toContain("## Buyer validation script");
    expect(preview.exportMarkdown).toContain("## Buyer validation rubric");
    expect(preview.exportMarkdown).toContain("## Buyer send memo");
    expect(preview.exportMarkdown).toContain("Subject: Buyer pilot packet ready: Platform release lead");
    expect(preview.exportMarkdown).toContain("## Pilot proof contract");
    expect(preview.exportMarkdown).toContain("## Buyer promise gate");
    expect(preview.exportMarkdown).toContain("## Stakeholder approval route");
    expect(preview.exportMarkdown).toContain("## Pilot contract terms");
    expect(preview.exportMarkdown).toContain("## Procurement alternative matrix");
    expect(preview.exportMarkdown).toContain("## 30-day adoption success plan");
    expect(preview.exportMarkdown).toContain("## Rollout command board");
    expect(preview.exportMarkdown).toContain("## Buyer handoff brief");
    expect(preview.exportMarkdown).toContain("## Proof repair plan");
    expect(preview.exportMarkdown).toContain("## Buyer objection brief");
    expect(preview.exportMarkdown).toContain("## Pilot week plan");
    expect(preview.exportMarkdown).toContain("Day 2 Run supervised A2A trial");
    expect(preview.exportMarkdown).toContain("## Pilot week kickoff");
    expect(preview.exportMarkdown).toContain("## Receipt");
    expect(preview.handoffBrief).toMatchObject({
      decision: "send-ready",
      label: "Send-ready after live check",
      headline: "Buyer can review a scoped pilot contract",
      promise: "Evidence shows 1120 minutes saved per run, about 70h/month or ¥840,000/month at the extracted adoption rate.",
      proofSummary: "5/5 public proof links / A2A trial 94/100",
      nextAction: {
        label: "Final live verification",
        owner: "Proof owner",
        href: "#launch-evidence-console",
        status: "ready"
      }
    });
    expect(preview.handoffBrief.buyerMessage).toEqual(
      expect.arrayContaining([
        "Approval ask: Apply this draft, verify live links, then open the launch room.",
        "Evidence shows 1120 minutes saved per run, about 70h/month or ¥840,000/month at the extracted adoption rate."
      ])
    );
    expect(preview.handoffBrief.handoffHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    const handoffText = decodeURIComponent(preview.handoffBrief.handoffHref.split(",")[1] ?? "");
    expect(handoffText).toContain("Decision: Send-ready after live check");
    expect(handoffText).toContain("Proof: 5/5 public proof links / A2A trial 94/100");
    expect(preview.decisionCase).toMatchObject({
      status: "ready",
      decision: "send",
      decisionLabel: "Send after live verification",
      headline: "Decision case is ready for buyer review",
      buyerQuestion: "Should Platform release lead pilot this workflow now?",
      owner: "Proof owner",
      nextAction: "Run live link verification once more after applying this draft."
    });
    expect(preview.decisionCase.answer).toContain("Buyer review can proceed after live proof verification.");
    expect(preview.decisionCase.valueEvidence).toContain("8 people / 5 cycles/month / 28h manual/cycle");
    expect(preview.decisionCase.proofEvidence).toContain("5/5 public proof links ready");
    expect(preview.decisionCase.trustEvidence).toContain("Cloud Run SRE / cloudrun.release-proof / 94/100");
    expect(preview.decisionCase.caseHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(decodeURIComponent(preview.decisionCase.caseHref.split(",")[1] ?? "")).toContain("Decision: Send after live verification");
    expect(preview.impactSnapshot).toMatchObject({
      status: "ready",
      headline: "Impact snapshot is buyer-ready",
      beforeState: "release proof is scattered across tickets, spreadsheets, Cloud Run checks, and review threads.",
      afterState: "Manual review becomes a supervised pilot with public proof and a decision gate.",
      nextAction: "Run live verification, then route the buyer room."
    });
    expect(preview.impactSnapshot.metrics.map((metric) => metric.id)).toEqual(["manual-burden", "monthly-value", "proof-risk", "decision-gate"]);
    expect(preview.impactSnapshot.metrics.every((metric) => metric.status === "ready")).toBe(true);
    expect(preview.impactSnapshot.metrics.find((metric) => metric.id === "manual-burden")?.value).toContain("1120 minutes saved/run");
    expect(preview.impactSnapshot.metrics.find((metric) => metric.id === "monthly-value")?.value).toContain("¥840,000/month");
    expect(preview.impactSnapshot.metrics.find((metric) => metric.id === "proof-risk")?.value).toBe("5/5 public proof URLs ready");
    expect(preview.impactSnapshot.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.impactSnapshot.exportHref.split(",")[1] ?? "")).toContain("## Metrics");
    expect(preview.valueMap).toMatchObject({
      status: "ready",
      headline: "Buyer value map is buyer-ready",
      beforeState: "release proof is scattered across tickets, spreadsheets, Cloud Run checks, and review threads.",
      buyerOutcome: "Evidence shows 1120 minutes saved per run, about 70h/month or ¥840,000/month at the extracted adoption rate.",
      nextAction: "Run live proof verification, then use this as the buyer story."
    });
    expect(preview.valueMap.items.map((item) => item.id)).toEqual(["before", "agent-run", "measured-value", "buyer-proof", "decision"]);
    expect(preview.valueMap.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.valueMap.items.find((item) => item.id === "agent-run")).toMatchObject({
      owner: "Cloud Run SRE",
      value: "Cloud Run SRE / cloudrun.release-proof / 94/100"
    });
    expect(preview.valueMap.items.find((item) => item.id === "measured-value")?.detail).toContain("8 people / 5 cycles/month / 28h manual/cycle");
    expect(preview.valueMap.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.valueMap.exportHref.split(",")[1] ?? "")).toContain("## Map");
    expect(preview.validationScript).toMatchObject({
      status: "ready",
      headline: "Buyer validation script is ready",
      nextAction: "Use the answers to confirm the pilot owner, then run live proof verification.",
      openingLine: "I want to verify whether this workflow is worth a bounded pilot for Platform release lead.",
      closeAsk: "If these answers hold, can Proof owner approve the pilot after live proof verification?"
    });
    expect(preview.validationScript.questions.map((question) => question.id)).toEqual(["pain", "frequency", "value", "trust", "commitment"]);
    expect(preview.validationScript.questions.every((question) => question.status === "ready")).toBe(true);
    expect(preview.validationScript.questions.find((question) => question.id === "trust")).toMatchObject({
      owner: "Proof owner",
      listenFor: "5/5 public proof URLs ready"
    });
    expect(preview.validationScript.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.validationScript.exportHref.split(",")[1] ?? "")).toContain("## Questions");
    expect(preview.validationRubric).toMatchObject({
      status: "ready",
      decision: "pilot-ready",
      headline: "Validation rubric clears the pilot ask",
      passCount: 5,
      totalCount: 5,
      nextAction: "Ask for continue, revise, or stop after live proof verification."
    });
    expect(preview.validationRubric.criteria.map((criterion) => criterion.id)).toEqual(["pain", "frequency", "value", "trust", "commitment"]);
    expect(preview.validationRubric.criteria.every((criterion) => criterion.status === "ready")).toBe(true);
    expect(preview.validationRubric.criteria.find((criterion) => criterion.id === "trust")).toMatchObject({
      owner: "Proof owner",
      passSignal: "Buyer can open the proof and agrees it is enough to trust the agent run."
    });
    expect(preview.validationRubric.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.validationRubric.exportHref.split(",")[1] ?? "")).toContain("## Criteria");
    expect(preview.validationAnswerSheet).toMatchObject({
      status: "ready",
      headline: "Buyer answer sheet is ready to use",
      readyCount: 5,
      totalCount: 5,
      nextAction: "Run the buyer conversation, fill the answer sheet, then record continue, revise, or stop."
    });
    expect(preview.validationAnswerSheet.items.map((item) => item.id)).toEqual(["pain", "frequency", "value", "trust", "commitment"]);
    expect(preview.validationAnswerSheet.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.validationAnswerSheet.items.find((item) => item.id === "trust")).toMatchObject({
      owner: "Proof owner",
      answerField: "Buyer answer: proof links opened, missing proof, and trust condition.",
      ownerAction: "Record the buyer answer beside the linked evidence before asking for approval."
    });
    expect(preview.validationAnswerSheet.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.validationAnswerSheet.exportHref.split(",")[1] ?? "")).toContain("## Answer fields");
    const validationCallBrief = buildQuickBuyerValidationCallBrief(preview);
    expect(validationCallBrief).toMatchObject({
      status: "ready",
      headline: "Run this buyer validation call before approval",
      readyCount: 5,
      totalCount: 5,
      recordLine: "Paste buyer answers after the call to create a receipt."
    });
    expect(validationCallBrief.primaryQuestion).toContain("can Proof owner approve the pilot after live proof verification");
    expect(validationCallBrief.nextAsk).toBe("Run the buyer conversation, fill the answer sheet, then record continue, revise, or stop.");
    expect(validationCallBrief.items.map((item) => item.id)).toEqual(["pain", "frequency", "value", "trust", "commitment"]);
    expect(validationCallBrief.items.find((item) => item.id === "trust")).toMatchObject({
      recordStatus: "not-recorded",
      answerField: "Buyer answer: proof links opened, missing proof, and trust condition.",
      recordEvidence: "Record the buyer answer beside the linked evidence before asking for approval."
    });
    expect(validationCallBrief.exportMarkdown).toContain("# Buyer validation call brief");
    expect(validationCallBrief.exportMarkdown).toContain("## Questions and answer fields");
    expect(validationCallBrief.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    const validationAnswerRecord = buildQuickBuyerValidationAnswerRecord(
      preview,
      [
        "Baseline owner Platform release lead confirmed current manual proof pain today.",
        "The platform team repeats this weekly every release cycle.",
        "Finance owner accepts value metric and ¥840,000 threshold.",
        "Buyer opened proof link https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app/proof/release-ready and verified receipt checksum, trust condition is enough.",
        "Sponsor approver approves a bounded pilot with stop rule and decision date Day 5."
      ].join(" ")
    );
    expect(validationAnswerRecord).toMatchObject({
      status: "ready",
      headline: "Buyer validation answers are recorded",
      answeredCount: 5,
      totalCount: 5,
      recommendedBuyerDecision: "continue",
      decisionReason: "All five answers matched required signals and proof is ready.",
      nextOwner: "Ready",
      nextAction: "Record continue, revise, or stop with the decision recorder.",
      sourceReceiptId: preview.conversionReceipt.receiptId,
      sourceChecksum: `fnv1a32:${preview.conversionReceipt.checksum}`
    });
    expect(validationAnswerRecord.confidence).toBeGreaterThanOrEqual(90);
    expect(validationAnswerRecord.items.every((item) => item.status === "ready")).toBe(true);
    expect(validationAnswerRecord.items.find((item) => item.id === "trust")).toMatchObject({
      matchedSignals: ["proof opened", "receipt or verifier stated", "trust condition stated"],
      missingSignals: []
    });
    const demoProofValidationAnswerRecord = buildQuickBuyerValidationAnswerRecord(
      preview,
      [
        "Baseline owner Platform release lead confirmed current manual proof pain today.",
        "The platform team repeats this weekly every release cycle.",
        "Finance owner accepts value metric and ¥840,000 threshold.",
        "Buyer opened proof link https://proof.example.com/release-ready and verified receipt checksum, trust condition is enough.",
        "Sponsor approver approves a bounded pilot with stop rule and decision date Day 5."
      ].join(" ")
    );
    expect(demoProofValidationAnswerRecord).toMatchObject({
      status: "watch",
      headline: "Buyer validation answers need proof review",
      answeredCount: 4,
      totalCount: 5,
      recommendedBuyerDecision: "revise",
      decisionReason: "Trust is missing proof opened.",
      nextOwner: "Proof owner"
    });
    expect(demoProofValidationAnswerRecord.items.find((item) => item.id === "trust")).toMatchObject({
      status: "watch",
      matchedSignals: ["receipt or verifier stated", "trust condition stated"],
      missingSignals: ["proof opened"],
      action: "Capture trust evidence: proof opened."
    });
    expect(demoProofValidationAnswerRecord.exportMarkdown).toContain("Recommended buyer decision: revise");
    expect(demoProofValidationAnswerRecord.exportMarkdown).toContain("missing proof opened");
    expect(validationAnswerRecord.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-validation-answer-ready-[0-9a-f]{8}$/),
      checksumAlgorithm: "fnv1a32",
      verificationApiPath: QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
      verification: {
        status: "verified"
      },
      payload: {
        receiptVersion: "quick-buyer-validation-answer-record.v1",
        answeredCount: 5,
        totalCount: 5,
        recommendedBuyerDecision: "continue"
      },
      generatedFrom: ["buyer-validation-answer-text", "validation-answer-sheet", "workflow-conversion-receipt"]
    });
    expect(validationAnswerRecord.receipt.verificationRequestJson).toContain('"receiptVersion": "quick-buyer-validation-answer-record.v1"');
    expect(validationAnswerRecord.receipt.verificationRequestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(validationAnswerRecord.verifierHref).toContain("/receipt-verifier?request=");
    expect(validationAnswerRecord.verifierHref).toContain("verify=1");
    const reviewKitWithAnswersHref = buyerReviewKitValidationAnswerRecordHref(
      validationAnswerRecord.receipt.verificationRequestJson,
      "/buyer-review-kit?replyRecordRequest=reply-json"
    );
    const acceptancePathWithAnswersHref = buyerAcceptancePathValidationAnswerRecordHref(
      validationAnswerRecord.receipt.verificationRequestJson,
      "/buyer-acceptance-path?replyRecordRequest=reply-json"
    );
    const reviewKitWithAnswersUrl = new URL(reviewKitWithAnswersHref, "https://example.com");
    const acceptancePathWithAnswersUrl = new URL(acceptancePathWithAnswersHref, "https://example.com");
    expect(reviewKitWithAnswersUrl.searchParams.get(BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM)).toBe("reply-json");
    expect(reviewKitWithAnswersUrl.searchParams.get(BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM)).toContain(
      '"receiptVersion": "quick-buyer-validation-answer-record.v1"'
    );
    expect(acceptancePathWithAnswersUrl.searchParams.get(BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM)).toBe("reply-json");
    expect(acceptancePathWithAnswersUrl.searchParams.get(BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM)).toContain(
      '"receiptVersion": "quick-buyer-validation-answer-record.v1"'
    );
    expect(validationAnswerRecord.exportMarkdown).toContain("# Buyer validation answer record");
    expect(validationAnswerRecord.exportMarkdown).toContain("Recommended buyer decision: continue");
    expect(validationAnswerRecord.exportMarkdown).toContain("## Buyer decision triage");
    expect(validationAnswerRecord.exportMarkdown).toContain(`API verification: POST ${QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH}`);
    expect(validationAnswerRecord.exportMarkdown).toContain("## Answer checks");
    expect(validationAnswerRecord.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(validationAnswerRecord.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    const recordedValidationCallBrief = buildQuickBuyerValidationCallBrief(preview, validationAnswerRecord);
    expect(recordedValidationCallBrief).toMatchObject({
      status: "ready",
      headline: "Buyer validation answers are recorded",
      recordLine: "5/5 validation fields ready at 96/100 confidence.",
      nextAsk: "Record continue, revise, or stop with the decision recorder."
    });
    expect(recordedValidationCallBrief.items.find((item) => item.id === "trust")).toMatchObject({
      recordStatus: "ready",
      recordEvidence: "Matched: proof opened, receipt or verifier stated, trust condition stated"
    });
    const validationDecisionHandoff = buildQuickBuyerValidationDecisionHandoff({
      record: validationAnswerRecord,
      proofRepairPlan: preview.proofRepairPlan,
      reviewKitHref: reviewKitWithAnswersHref,
      acceptancePathHref: acceptancePathWithAnswersHref
    });
    expect(validationDecisionHandoff).toMatchObject({
      status: "ready",
      headline: "Validation can move to buyer decision",
      steps: [
        expect.objectContaining({ id: "decision", status: "ready", owner: "Ready" }),
        expect.objectContaining({ id: "owner-repair", status: "ready", owner: "Pilot owner" }),
        expect.objectContaining({ id: "verify", status: "ready", owner: "Reviewer" })
      ]
    });
    expect(validationDecisionHandoff.copyText).toContain("# Buyer validation decision handoff");
    expect(validationDecisionHandoff.copyText).toContain("Recommended decision: continue");
    expect(validationDecisionHandoff.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(validationDecisionHandoff.mailtoHref).toMatch(/^mailto:/);
    expect(preview.sendMemo).toMatchObject({
      status: "ready",
      headline: "Send memo is ready after live proof",
      subject: "Buyer pilot packet ready: Platform release lead",
      nextAction: "Run live proof verification, then send the launch room."
    });
    expect(preview.sendMemo.items.map((item) => item.id)).toEqual(["decision", "value", "proof", "trust", "next-action"]);
    expect(preview.sendMemo.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.sendMemo.bodyText).toContain("Decision: Send after live verification");
    expect(preview.sendMemo.bodyText).toContain("Value proof: 8 people / 5 cycles/month / 28h manual/cycle");
    expect(preview.sendMemo.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(preview.sendMemo.mailtoHref).toContain("subject=Buyer%20pilot%20packet%20ready");
    expect(preview.pilotProofContract).toMatchObject({
      status: "ready",
      headline: "Pilot proof contract is buyer-defensible",
      nextOwner: "Proof owner",
      nextAction: "Run live proof verification before sending the buyer room."
    });
    expect(preview.pilotProofContract.items.map((item) => item.id)).toEqual([
      "buyer-promise",
      "value-floor",
      "proof-gate",
      "budget-cap",
      "stop-rule",
      "renewal-rule"
    ]);
    expect(preview.pilotProofContract.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.pilotProofContract.valueFloor).toMatch(/^¥[0-9,]+\/month risk-adjusted floor$/);
    expect(preview.pilotProofContract.budgetCap).toMatch(/^¥[0-9,]+ pilot cap$/);
    expect(preview.pilotProofContract.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.pilotProofContract.exportHref.split(",")[1] ?? "")).toContain("Recommended path: A2A pilot");
    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 5,
      missingCount: 0,
      invalidCount: 0,
      repairCount: 0,
      headline: "Public proof packet is complete",
      summary: "All five public proof links are attached. Run live verification before sending."
    });
    expect(preview.proofRepairPlan.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.proofRepairPlan.repairHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(decodeURIComponent(preview.proofRepairPlan.repairHref.split(",")[1] ?? "")).toContain("Ready: 5/5");
    expect(preview.objectionBrief).toMatchObject({
      readyCount: 5,
      unresolvedCount: 0,
      headline: "Buyer objections are answered",
      summary: "5/5 answers have buyer-safe evidence for Platform release lead."
    });
    expect(preview.objectionBrief.items.map((item) => item.id)).toEqual(["valueProof", "publicProof", "agentTrust", "dataBoundary", "adoptionPath"]);
    expect(preview.objectionBrief.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.objectionBrief.items.find((item) => item.id === "publicProof")).toMatchObject({
      question: "Can the reviewer open the proof?",
      answer: "All five public proof links are attached.",
      evidence: "5/5 public proof links ready"
    });
    expect(preview.objectionBrief.items.find((item) => item.id === "agentTrust")?.answer).toContain("Accepted A2A trial receipt: Cloud Run SRE / cloudrun.release-proof / 94/100.");
    expect(preview.objectionBrief.defenseHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(decodeURIComponent(preview.objectionBrief.defenseHref.split(",")[1] ?? "")).toContain("[ready] Public proof: Can the reviewer open the proof?");
    expect(preview.approvalRoute).toMatchObject({
      status: "ready",
      headline: "Stakeholder approval route is board-ready",
      readyCount: 4,
      blockedCount: 0
    });
    expect(preview.approvalRoute.steps.map((step) => step.id)).toEqual(["finance", "security", "pilot-owner", "procurement"]);
    expect(preview.approvalRoute.steps.find((step) => step.id === "finance")).toMatchObject({
      status: "ready",
      owner: "Finance owner",
      gate: "Does the downside case still justify a paid pilot?"
    });
    expect(preview.approvalRoute.routeHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.approvalRoute.routeHref.split(",")[1] ?? "")).toContain("[ready] Finance");
    expect(preview.approvalEmailPack).toMatchObject({
      status: "ready",
      headline: "Approval email pack is ready to send",
      nextRecipient: "Finance owner",
      approvalDeadline: "Before pilot budget is offered"
    });
    expect(preview.approvalEmailPack.messages.map((message) => message.id)).toEqual(["finance", "security", "pilot-owner", "procurement"]);
    expect(preview.approvalEmailPack.messages.find((message) => message.id === "finance")).toMatchObject({
      status: "ready",
      owner: "Finance owner",
      subject: "A2A pilot approval: Finance gate for Platform release lead",
      replyTarget: "Approve the gate or name one required revision."
    });
    expect(preview.approvalEmailPack.messages.find((message) => message.id === "finance")?.body).toContain("Budget cap: ¥115,000.");
    expect(preview.approvalEmailPack.messages.find((message) => message.id === "procurement")?.body).toContain("Recommended path: A2A pilot.");
    expect(preview.approvalEmailPack.messages.every((message) => message.mailtoHref.startsWith("mailto:?subject="))).toBe(true);
    expect(preview.approvalEmailPack.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.approvalEmailPack.exportHref.split(",")[1] ?? "")).toContain("# Stakeholder approval email pack");
    expect(preview.exportMarkdown).toContain("## Stakeholder approval email pack");
    expect(preview.pilotContractTerms).toMatchObject({
      status: "ready",
      headline: "Pilot contract terms are ready to send",
      budgetCapYen: 115000,
      effectiveWindow: "5 business days from pilot kickoff",
      clearCount: 6,
      blockedCount: 0
    });
    expect(preview.pilotContractTerms.terms.map((term) => term.id)).toEqual([
      "commercial-cap",
      "scope-boundary",
      "proof-gate",
      "data-boundary",
      "stop-rule",
      "signature-path"
    ]);
    expect(preview.pilotContractTerms.terms.find((term) => term.id === "proof-gate")).toMatchObject({
      status: "ready",
      owner: "Proof owner",
      acceptance: "5/5 public proof URLs ready"
    });
    expect(preview.pilotContractTerms.stopRules).toEqual(
      expect.arrayContaining([expect.stringContaining("Stop if live proof verification fails after publishing.")])
    );
    expect(preview.pilotContractTerms.contractHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.pilotContractTerms.contractHref.split(",")[1] ?? "")).toContain("## Stop rules");
    expect(preview.procurementMatrix).toMatchObject({
      status: "ready",
      headline: "A2A pilot is the procurement default",
      recommendedAlternativeId: "a2a-pilot"
    });
    expect(preview.procurementMatrix.alternatives.map((alternative) => alternative.id)).toEqual(["a2a-pilot", "manual-status-quo", "generic-ai", "internal-build"]);
    expect(preview.procurementMatrix.alternatives.find((alternative) => alternative.id === "a2a-pilot")).toMatchObject({
      status: "ready",
      monthlyValueYen: 328000,
      setupCostYen: 115000,
      paybackDays: 11,
      proofReadiness: "5/5 proof links, 4/4 stakeholder gates",
      decision: "Recommended as the paid pilot path."
    });
    expect(preview.procurementMatrix.alternatives.find((alternative) => alternative.id === "generic-ai")).toMatchObject({
      status: "watch",
      monthlyValueYen: 92000,
      setupCostYen: 52000,
      paybackDays: 17
    });
    expect(preview.procurementMatrix.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.procurementMatrix.exportHref.split(",")[1] ?? "")).toContain("Recommended: A2A pilot");
    expect(preview.claimProofLedger).toMatchObject({
      status: "ready",
      headline: "Every buyer claim is traceable",
      score: 100,
      readyCount: 8,
      watchCount: 0,
      blockedCount: 0,
      primaryRisk: "Every buyer-facing claim has an attached proof path.",
      receipt: {
        receiptId: expect.stringMatching(/^quick-claim-proof-ready-[0-9a-f]{8}$/),
        checksumAlgorithm: "fnv1a32",
        checksum: expect.stringMatching(/^[0-9a-f]{8}$/)
      }
    });
    expect(preview.claimProofLedger.items.map((item) => item.id)).toEqual([
      "workflow-scope",
      "value-model",
      "measured-run",
      "public-proof",
      "agent-trust",
      "data-boundary",
      "approval-path",
      "procurement-choice"
    ]);
    expect(preview.claimProofLedger.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.claimProofLedger.items.find((item) => item.id === "value-model")).toMatchObject({
      owner: "Finance owner",
      proof: "¥328,000/month risk-adjusted floor",
      sourceStatus: "traced",
      sourceTraceIds: ["value-model"]
    });
    expect(preview.claimProofLedger.csvText).toContain('"label","status","claim","evidence","source","sourceStatus","sourceLineNumber","sourceLine","proof","owner","verification","risk","nextAction","href"');
    expect(preview.claimProofLedger.csvText).toContain('"Procurement choice","ready"');
    expect(preview.claimProofLedger.csvText).toContain('"traced"');
    expect(preview.claimProofLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(preview.claimProofLedger.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(preview.claimProofLedger.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(decodeURIComponent(preview.claimProofLedger.exportHref.split(",")[1] ?? "")).toContain("# Claim-proof ledger");
    expect(decodeURIComponent(preview.claimProofLedger.exportHref.split(",")[1] ?? "")).toContain("Source status: traced");
    expect(preview.exportMarkdown).toContain("## Claim-proof ledger");
    expect(preview.exportMarkdown).toContain("Source: Pasted note");
    expect(preview.buyerPromiseGate).toMatchObject({
      status: "ready",
      headline: "Buyer promise is safe to publish after live proof",
      safeUse: "Website-ready claim, pending final live proof check",
      readyCount: 4,
      blockedCount: 0,
      publicPromise: expect.stringContaining("¥328,000/month floor")
    });
    expect(preview.buyerPromiseGate.publicPromise).toContain("¥115,000 capped pilot");
    expect(preview.buyerPromiseGate.items.map((item) => item.id)).toEqual(["value-promise", "proof-promise", "agent-promise", "commercial-promise"]);
    expect(preview.buyerPromiseGate.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.buyerPromiseGate.notAllowedClaims).toContain("Do not say live proof has passed until the live proof audit receipt is attached.");
    expect(decodeURIComponent(preview.buyerPromiseGate.exportHref.split(",")[1] ?? "")).toContain("# Buyer promise gate");
    expect(preview.adoptionSuccessPlan).toMatchObject({
      status: "ready",
      headline: "30-day adoption plan is expansion-ready",
      reviewWindow: "Day 30 operating review",
      adoptionTargetPercent: 75,
      retainedMonthlyValueYen: 246000,
      readyCount: 5,
      blockedCount: 0,
      renewalAsk: "Approve expansion after Day 30 operating review if retained value stays above ¥246,000/month."
    });
    expect(preview.adoptionSuccessPlan.metrics.map((metric) => metric.id)).toEqual([
      "value-retention",
      "repeat-usage",
      "proof-freshness",
      "owner-commitment",
      "trust-boundary"
    ]);
    expect(preview.adoptionSuccessPlan.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(["day-0", "day-7", "day-14", "day-30"]);
    expect(preview.adoptionSuccessPlan.checkpoints.every((checkpoint) => checkpoint.status === "ready")).toBe(true);
    expect(preview.adoptionSuccessPlan.expansionCriteria).toEqual(
      expect.arrayContaining([
        "Retained value stays at or above ¥246,000/month by Day 30.",
        "Accepted task rate stays at or above 90% on repeated runs."
      ])
    );
    expect(preview.adoptionSuccessPlan.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.adoptionSuccessPlan.exportHref.split(",")[1] ?? "")).toContain("# 30-day adoption success plan");
    expect(preview.rolloutCommandBoard).toMatchObject({
      status: "ready",
      headline: "Rollout command board is ready",
      readyCount: 5,
      blockedCount: 0,
      nextOwner: "Platform sponsor",
      nextCommand: "Open the pilot kickoff and assign the operating owner for weekly Cloud Run release-readiness review is copied from tickets, CI logs, rollout checks, and chat by hand before sponsor sign-off."
    });
    expect(preview.rolloutCommandBoard.commands.map((command) => command.id)).toEqual(["kickoff", "proof-recheck", "usage-review", "value-review", "expansion-decision"]);
    expect(preview.rolloutCommandBoard.commands.every((command) => command.status === "ready")).toBe(true);
    expect(preview.rolloutCommandBoard.commands.find((command) => command.id === "proof-recheck")).toMatchObject({
      window: "Day 3",
      owner: "Proof owner",
      evidence: "5/5 public proof links ready; 0 repair items."
    });
    expect(preview.rolloutCommandBoard.ownerLoads.find((load) => load.owner === "Proof owner")).toMatchObject({
      commandCount: 1,
      blockedCount: 0,
      nextCommand: "Ready"
    });
    expect(preview.rolloutCommandBoard.taskCsvText).toContain('"window","label","status","owner","command","evidence","risk","href"');
    expect(preview.rolloutCommandBoard.taskCsvText).toContain('"Day 3","Proof recheck","ready","Proof owner"');
    expect(preview.rolloutCommandBoard.taskCsvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(preview.rolloutCommandBoard.ownerBriefText).toContain("# Rollout owner brief");
    expect(preview.rolloutCommandBoard.ownerBriefText).toContain("Next owner: Platform sponsor");
    expect(preview.rolloutCommandBoard.ownerBriefHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(preview.rolloutCommandBoard.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-rollout-ready-[0-9a-f]{8}$/),
      checksumAlgorithm: "fnv1a32",
      checksum: expect.stringMatching(/^[0-9a-f]{8}$/)
    });
    expect(preview.rolloutCommandBoard.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(preview.rolloutCommandBoard.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    const rolloutMarkdown = decodeURIComponent(preview.rolloutCommandBoard.exportHref.split(",")[1] ?? "");
    expect(rolloutMarkdown).toContain("# Rollout command board");
    expect(rolloutMarkdown).toContain("## Import artifacts");
    expect(rolloutMarkdown).toContain(`Task CSV receipt: ${preview.rolloutCommandBoard.receipt.receiptId}`);
    const calendarExport = buildQuickRolloutCalendarExport(preview.rolloutCommandBoard, "2026-07-01");
    expect(calendarExport).toMatchObject({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      eventCount: 5,
      receipt: {
        receiptId: expect.stringMatching(/^quick-rollout-calendar-ready-20260701-[0-9a-f]{8}$/),
        checksumAlgorithm: "fnv1a32"
      }
    });
    expect(calendarExport?.icsText).toContain("BEGIN:VCALENDAR");
    expect(calendarExport?.icsText).toContain("DTSTART;VALUE=DATE:20260701");
    expect(calendarExport?.icsText).toContain("DTSTART;VALUE=DATE:20260704");
    expect(calendarExport?.icsText).toContain("SUMMARY:Day 3 Proof recheck - Proof owner");
    expect(calendarExport?.icsText).toContain(`Receipt: ${calendarExport?.receipt.receiptId}`);
    expect(calendarExport?.icsHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(calendarExport?.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(buildQuickRolloutCalendarExport(preview.rolloutCommandBoard, "2026-02-31")).toBeNull();
    expect(preview.decisionClosePack).toMatchObject({
      status: "ready",
      headline: "Decision close pack is buyer-send ready",
      agenda: {
        decisionLabel: "Send to buyer",
        readyCount: 4,
        agendaTotal: 4,
        firstAction: {
          label: "Copy send note",
          href: "#quick-decision-close-pack"
        }
      },
      followUpLedger: {
        mode: "buyer-send",
        readyCount: 4,
        taskTotal: 4,
        blockedCount: 0,
        attentionCount: 0,
        firstAction: {
          label: "Open buyer decision room",
          href: "#quick-decision-close-pack"
        }
      }
    });
    expect(preview.decisionClosePack.agenda.items.map((item) => item.id)).toEqual(["decision-request", "commercial-boundary", "proof-trust", "stop-rule"]);
    expect(preview.decisionClosePack.agenda.items.every((item) => item.status === "ready")).toBe(true);
    expect(preview.decisionClosePack.agenda.items.find((item) => item.id === "commercial-boundary")).toMatchObject({
      owner: "Sponsor owner",
      evidence: "A2A pilot: 115,000 yen first commitment, 11 day payback."
    });
    expect(preview.decisionClosePack.followUpLedger.tasks.every((task) => task.dueLabel === "Meeting day")).toBe(true);
    expect(preview.decisionClosePack.followUpLedger.csv).toContain("taskId,label,status,owner,due,nextStep,closeCondition,evidence,href");
    expect(preview.decisionClosePack.followUpLedger.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^buyer-decision-follow-up-buyer-send-[0-9a-f]{12}$/),
      checksumAlgorithm: "fnv1a-64",
      verification: {
        status: "verified"
      }
    });
    expect(preview.decisionClosePack.agendaHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(preview.decisionClosePack.followUpHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(preview.decisionClosePack.followUpLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(preview.decisionClosePack.followUpHtmlHref).toMatch(/^data:text\/html;charset=utf-8,/);
    expect(decodeURIComponent(preview.decisionClosePack.followUpHtmlHref.split(",")[1] ?? "")).toContain("Buyer decision follow-up ledger");
    expect(preview.decisionClosePack.followUpLedger.exportMarkdown).toContain("## Verification receipt");
    expect(preview.exportMarkdown).toContain("## Decision close pack");
    expect(preview.exportMarkdown).toContain("Next owner: Platform sponsor");
    expect(preview.pilotWeekTaskPacket.csvText).toContain('"day","label","status","owner","action","acceptance","proof","href"');
    expect(preview.pilotWeekTaskPacket.csvText).toContain('"Day 2","Run supervised A2A trial","ready","Cloud Run SRE"');
    expect(preview.pilotWeekTaskPacket.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(preview.pilotWeekTaskPacket.kickoffText).toContain("Pilot week kickoff: Platform release lead");
    expect(preview.pilotWeekTaskPacket.kickoffText).toContain("Primary ask: Apply this draft, verify live links, then open the launch room.");
    expect(preview.pilotWeekTaskPacket.kickoffHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(preview.pilotWeekTaskPacket.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-pilot-week-ready-[0-9a-f]{8}$/),
      checksumAlgorithm: "fnv1a32",
      checksum: expect.stringMatching(/^[0-9a-f]{8}$/),
      generatedFrom: [
        "quick buyer room preview",
        "buyer decision case",
        "claim-proof ledger",
        "stakeholder approval route",
        "stakeholder approval email pack",
        "pilot contract terms",
        "procurement alternative matrix",
        "adoption success plan",
        "rollout command board",
        "decision close pack",
        "pilot week plan",
        "task csv",
        "kickoff note",
        "buyer handoff brief",
        "proof repair plan",
        "buyer objection brief"
      ]
    });
    expect(preview.pilotWeekTaskPacket.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    const receiptText = decodeURIComponent(preview.pilotWeekTaskPacket.receiptHref.split(",")[1] ?? "");
    expect(receiptText).toContain(`"receiptId": "${preview.pilotWeekTaskPacket.receipt.receiptId}"`);
    expect(receiptText).toContain(`"checksum": "${preview.pilotWeekTaskPacket.receipt.checksum}"`);
    expect(preview.exportMarkdown).toContain(`Receipt: ${preview.pilotWeekTaskPacket.receipt.receiptId}`);
    expect(preview.exportMarkdown).toContain(`Checksum: fnv1a32:${preview.pilotWeekTaskPacket.receipt.checksum}`);
    expect(preview.exportMarkdown).not.toMatch(/demo/i);
  });

  test("condenses a quick buyer room preview into a sendable one-pager", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);

    expect(onePager).toMatchObject({
      status: "ready",
      label: "Buyer-sendable one-pager",
      buyer: "Platform release lead",
      nextOwner: "Proof owner"
    });
    expect(onePager.headline).toContain("Platform release lead");
    expect(onePager.decision).toBe("Send after live verification");
    expect(onePager.valueLine).toContain("1120 minutes saved/run");
    expect(onePager.proofLine).toBe("5/5 public proof URLs ready");
    expect(onePager.sourceTraceLine).toBe("9/9 source facts traced to the pasted workflow note");
    expect(onePager.sourceTraceAction).toBe("Keep the source trace attached when forwarding the one-pager.");
    expect(onePager.sourceTrace.find((item) => item.id === "workflow")).toMatchObject({
      status: "traced",
      sourceLineNumber: 2
    });
    expect(onePager.items.map((item) => item.id)).toEqual(["decision", "value", "proof", "contract"]);
    expect(onePager.items.every((item) => item.status === "ready")).toBe(true);
    expect(onePager.sendSubject).toBe("Buyer pilot packet ready: Platform release lead");
    expect(onePager.sendPreview).toContain("Buyer: Platform release lead");
    expect(onePager.exportMarkdown).toContain("# Platform release lead");
    expect(onePager.exportMarkdown).toContain("## Source trace");
    expect(onePager.exportMarkdown).toContain("9/9 source facts traced to the pasted workflow note");
    expect(onePager.exportMarkdown).toContain("[traced] Workflow request");
    expect(onePager.exportMarkdown).toContain("## Decision rows");
    expect(onePager.exportMarkdown).toContain("Subject: Buyer pilot packet ready: Platform release lead");
    expect(onePager.exportMarkdown).toContain("## Integrity receipt");
    expect(onePager.exportMarkdown).toContain(`Receipt: ${onePager.receipt.receiptId}`);
    expect(onePager.exportMarkdown).toContain(`Checksum: fnv1a32:${onePager.receipt.checksum}`);
    expect(onePager.exportMarkdown).toContain("## Receipt verification");
    expect(onePager.exportMarkdown).toContain("Result: Receipt matches signed payload");
    expect(onePager.exportMarkdown).toContain(`Payload checksum: fnv1a32:${onePager.receipt.verification.payloadChecksum}`);
    expect(onePager.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(onePager.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-buyer-one-pager-ready-[0-9a-f]{8}$/),
      checksumAlgorithm: "fnv1a32",
      generatedFrom: ["buyer-decision-case", "buyer-impact-snapshot", "proof-repair-plan", "pilot-proof-contract", "buyer-send-memo", "workflow-source-trace"],
      verification: {
        status: "verified",
        label: "Receipt matches signed payload",
        payloadChecksum: onePager.receipt.checksum,
        receiptChecksum: onePager.receipt.checksum
      }
    });
    expect(onePager.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(JSON.parse(decodeURIComponent(onePager.receiptHref.split(",")[1] ?? ""))).toMatchObject({
      receiptId: onePager.receipt.receiptId,
      checksum: onePager.receipt.checksum,
      verification: {
        status: "verified",
        payloadChecksum: onePager.receipt.checksum,
        receiptChecksum: onePager.receipt.checksum
      }
    });
    expect(onePager.mailtoHref).toMatch(/^mailto:/);
  });

  test("keeps the quick buyer one-pager internal when public proof is incomplete", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);

    expect(onePager).toMatchObject({
      status: "blocked",
      label: "Internal repair one-pager",
      buyer: "Platform release lead",
      nextOwner: "Proof owner"
    });
    expect(onePager.summary).toBe("Use this as the repair brief before sending anything to the buyer.");
    expect(onePager.proofLine).toBe("3/5 public proof URLs ready / 2 need repair");
    expect(onePager.sourceTraceLine).toBe("9/9 source facts traced to the pasted workflow note");
    expect(onePager.nextAction).toContain("ProtoPedia story page");
    expect(onePager.items.find((item) => item.id === "proof")).toMatchObject({
      status: "blocked",
      value: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(onePager.decision).toBe("Repair before buyer sharing");
    expect(onePager.exportMarkdown).toContain("Status: Internal repair one-pager");
    expect(onePager.exportMarkdown).toContain("Action: Publish the ProtoPedia story page");
    expect(onePager.receipt.receiptId).toMatch(/^quick-buyer-one-pager-blocked-[0-9a-f]{8}$/);
    expect(onePager.exportMarkdown).toContain(`Receipt: ${onePager.receipt.receiptId}`);
    expect(onePager.receipt.verification).toMatchObject({
      status: "verified",
      payloadChecksum: onePager.receipt.checksum,
      receiptChecksum: onePager.receipt.checksum
    });
  });

  test("flags a quick buyer one-pager receipt mismatch when the payload changes", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);

    expect(verifyQuickBuyerDecisionOnePagerReceipt("tampered one-pager payload", onePager.receipt)).toMatchObject({
      status: "mismatch",
      label: "Receipt does not match payload",
      receiptChecksum: onePager.receipt.checksum
    });
  });

  test("builds a buyer decision reply path from a sendable one-pager", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const replyDeck = buildQuickBuyerDecisionReplyDeck(preview, onePager);

    expect(replyDeck).toMatchObject({
      status: "ready",
      label: "Buyer reply path ready",
      recommendedOptionId: "continue",
      onePagerReceiptId: onePager.receipt.receiptId,
      onePagerChecksum: `fnv1a32:${onePager.receipt.checksum}`
    });
    expect(replyDeck.options.map((option) => option.id)).toEqual(["continue", "revise", "stop"]);
    expect(replyDeck.options.find((option) => option.id === "continue")).toMatchObject({
      status: "ready",
      recommended: true,
      headline: "Approve bounded pilot",
      nextOwner: "Platform release lead"
    });
    expect(replyDeck.options.find((option) => option.id === "revise")).toMatchObject({
      status: "watch",
      recommended: false
    });
    expect(replyDeck.options.find((option) => option.id === "stop")).toMatchObject({
      status: "watch",
      recommended: false
    });
    expect(replyDeck.options.find((option) => option.id === "continue")?.mailtoHref).toMatch(/^mailto:/);
    expect(replyDeck.exportMarkdown).toContain("# Buyer decision reply path");
    expect(replyDeck.exportMarkdown).toContain("Recommended reply: Continue");
    expect(replyDeck.exportMarkdown).toContain(`One-pager receipt: ${onePager.receipt.receiptId}`);
    expect(replyDeck.exportMarkdown).toContain("- [ready] Continue: Approve bounded pilot (recommended)");
    expect(replyDeck.exportMarkdown).toContain("## Recommended reply");
    expect(replyDeck.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
  });

  test("recommends revise in the buyer reply path while proof is incomplete", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const replyDeck = buildQuickBuyerDecisionReplyDeck(preview, onePager);

    expect(replyDeck).toMatchObject({
      status: "blocked",
      label: "Internal reply path",
      recommendedOptionId: "revise"
    });
    expect(replyDeck.summary).toBe("Keep the reply path internal until proof repair closes: 3/5 public proof URLs ready / 2 need repair.");
    expect(replyDeck.options.find((option) => option.id === "continue")).toMatchObject({
      status: "blocked",
      recommended: false,
      headline: "Locked until proof passes"
    });
    expect(replyDeck.options.find((option) => option.id === "revise")).toMatchObject({
      status: "ready",
      recommended: true,
      headline: "Request proof repair",
      nextOwner: "Proof owner"
    });
    expect(replyDeck.options.find((option) => option.id === "revise")?.replyText).toContain(`One-pager receipt: ${onePager.receipt.receiptId}`);
    expect(replyDeck.exportMarkdown).toContain("Recommended reply: Revise");
    expect(replyDeck.exportMarkdown).toContain("- [ready] Revise: Request proof repair (recommended)");
  });

  test("records a buyer continue reply as an auditable rollout work order", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const record = buildQuickBuyerDecisionReplyRecord(
      preview,
      onePager,
      "Approved. Continue with the bounded pilot and proceed to the launch room after live proof verification."
    );

    expect(record).toMatchObject({
      status: "ready",
      decision: "continue",
      label: "Continue recorded",
      onePagerReceiptId: onePager.receipt.receiptId,
      onePagerChecksum: `fnv1a32:${onePager.receipt.checksum}`
    });
    expect(record.confidence).toBeGreaterThanOrEqual(90);
    expect(record.matchedSignals).toContain("continue");
    expect(record.activation).toMatchObject({
      mode: "pilot-start",
      recommendedReply: "continue",
      sourceReceiptId: preview.rolloutCommandBoard.receipt.receiptId
    });
    expect(record.receipt).toMatchObject({
      receiptId: expect.stringMatching(/^quick-buyer-reply-continue-[0-9a-f]{8}$/),
      verificationApiPath: "/api/quick-buyer-decision-reply-record/verify",
      verification: {
        status: "verified",
        expectedChecksum: record.receipt.checksum,
        actualChecksum: record.receipt.checksum
      },
      payload: {
        receiptVersion: "quick-buyer-decision-reply-record.v1",
        decision: "continue",
        activation: {
          mode: "pilot-start"
        }
      },
      generatedFrom: ["buyer-reply-text", "buyer-reply-path", "buyer-one-pager", "decision-activation"]
    });
    expect(JSON.parse(record.receipt.verificationRequestJson)).toMatchObject({
      checksum: record.receipt.checksum,
      payload: {
        receiptVersion: "quick-buyer-decision-reply-record.v1",
        decision: "continue",
        onePagerReceiptId: onePager.receipt.receiptId
      }
    });
    expect(record.verifierHref).toContain("/receipt-verifier?request=");
    expect(record.verifierHref).toContain("&verify=1");
    const verifierUrl = new URL(record.verifierHref, "https://example.com");
    expect(verifierUrl.searchParams.get("verify")).toBe("1");
    expect(verifierUrl.searchParams.get("request")).toContain('"receiptVersion": "quick-buyer-decision-reply-record.v1"');
    expect(record.reviewKitHref).toContain("/buyer-review-kit?replyRecordRequest=");
    const reviewKitUrl = new URL(record.reviewKitHref, "https://example.com");
    expect(reviewKitUrl.searchParams.get("replyRecordRequest")).toContain('"receiptVersion": "quick-buyer-decision-reply-record.v1"');
    expect(
      buyerReviewKitReplyRecordHref(record.receipt.verificationRequestJson, "https://service.example/buyer-review-kit?decision=revise")
    ).toContain("https://service.example/buyer-review-kit?decision=revise&replyRecordRequest=");
    expect(record.acceptancePathHref).toContain("/buyer-acceptance-path?replyRecordRequest=");
    const acceptancePathUrl = new URL(record.acceptancePathHref, "https://example.com");
    expect(acceptancePathUrl.searchParams.get("replyRecordRequest")).toContain('"receiptVersion": "quick-buyer-decision-reply-record.v1"');
    expect(
      buyerAcceptancePathReplyRecordHref(record.receipt.verificationRequestJson, "https://service.example/buyer-acceptance-path?decision=revise")
    ).toContain("https://service.example/buyer-acceptance-path?decision=revise&replyRecordRequest=");
    expect(record.exportMarkdown).toContain("# Buyer decision reply record");
    expect(record.exportMarkdown).toContain("Decision: Continue");
    expect(record.exportMarkdown).toContain("## Activation work order");
    expect(record.exportMarkdown).toContain(`Receipt: ${record.receipt.receiptId}`);
    expect(record.exportMarkdown).toContain(`API verification: POST ${record.receipt.verificationApiPath}`);
    expect(record.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(record.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
  });

  test("records a buyer revision reply as proof repair work", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const record = buildQuickBuyerDecisionReplyRecord(
      preview,
      onePager,
      "Please revise before approval. The ProtoPedia proof and walkthrough video are missing."
    );

    expect(record).toMatchObject({
      status: "watch",
      decision: "revise",
      label: "Revision recorded",
      nextOwner: "Proof owner"
    });
    expect(record.matchedSignals).toEqual(expect.arrayContaining(["revise", "before", "missing"]));
    expect(record.activation).toMatchObject({
      mode: "proof-repair",
      recommendedReply: "revise",
      sourceReceiptId: onePager.receipt.receiptId
    });
    expect(record.activation.items.map((item) => item.label)).toEqual(["ProtoPedia URL", "Walkthrough video"]);
    expect(record.receipt.receiptId).toMatch(/^quick-buyer-reply-revise-[0-9a-f]{8}$/);
    expect(record.exportMarkdown).toContain("Decision: Revise");
    expect(record.exportMarkdown).toContain("Publish the ProtoPedia story page");
  });

  test("builds a buyer reply action packet from the recorded reply decision", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const record = buildQuickBuyerDecisionReplyRecord(
      preview,
      onePager,
      "Stop. Do not approve the pilot because the value case is not enough for procurement."
    );
    const handoff = buildQuickBuyerDecisionReplyHandoff(record);

    expect(record.decision).toBe("stop");
    expect(record.activation.mode).toBe("close-audit");
    expect(handoff).toMatchObject({
      status: "watch",
      headline: "Buyer reply is preserved as a closeout packet"
    });
    expect(handoff.steps.map((step) => step.id)).toEqual(["decision", "activation-close-audit", "verify"]);
    expect(handoff.steps.find((step) => step.id === "activation-close-audit")).toMatchObject({
      owner: record.nextOwner,
      action: "Record the missing condition and keep the proof packet as the audit trail."
    });
    expect(handoff.copyText).toContain("# Buyer reply action packet");
    expect(handoff.copyText).toContain("Activation mode: close-audit");
    expect(handoff.copyText).toContain(`Reply receipt: ${record.receipt.receiptId}`);
    expect(handoff.copyText).toContain(`Verifier: ${record.verifierHref}`);
  });

  test("turns a continue reply into the first rollout activation tasks", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const replyDeck = buildQuickBuyerDecisionReplyDeck(preview, onePager);
    const activation = buildQuickBuyerDecisionActivationBrief(preview, replyDeck, onePager);

    expect(activation).toMatchObject({
      mode: "pilot-start",
      status: "ready",
      label: "Pilot start work order",
      recommendedReply: "continue",
      sourceReceiptId: preview.rolloutCommandBoard.receipt.receiptId,
      sourceChecksum: `fnv1a32:${preview.rolloutCommandBoard.receipt.checksum}`,
      primaryHref: preview.rolloutCommandBoard.ownerBriefHref,
      primaryLabel: "Owner brief"
    });
    expect(activation.items.map((item) => item.id)).toEqual(["kickoff", "proof-recheck", "usage-review"]);
    expect(activation.items.every((item) => item.status === "ready")).toBe(true);
    expect(activation.exportMarkdown).toContain("# Buyer decision activation brief");
    expect(activation.exportMarkdown).toContain("Mode: pilot-start");
    expect(activation.exportMarkdown).toContain("Recommended reply: Continue");
    expect(activation.exportMarkdown).toContain(`Source receipt: ${preview.rolloutCommandBoard.receipt.receiptId}`);
    expect(activation.exportMarkdown).toContain("Day 0 Owner kickoff");
    expect(activation.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
  });

  test("turns a revise reply into proof repair activation tasks", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const replyDeck = buildQuickBuyerDecisionReplyDeck(preview, onePager);
    const activation = buildQuickBuyerDecisionActivationBrief(preview, replyDeck, onePager);

    expect(activation).toMatchObject({
      mode: "proof-repair",
      status: "watch",
      label: "Proof repair work order",
      recommendedReply: "revise",
      sourceReceiptId: onePager.receipt.receiptId,
      sourceChecksum: `fnv1a32:${onePager.receipt.checksum}`,
      primaryHref: "#quick-proof-repair-plan",
      primaryLabel: "Repair queue"
    });
    expect(activation.summary).toBe("2 proof repair tasks must close before buyer sharing resumes.");
    expect(activation.items.map((item) => item.label)).toEqual(["ProtoPedia URL", "Walkthrough video"]);
    expect(activation.items.map((item) => item.owner)).toEqual(["Publication owner", "Recording owner"]);
    expect(activation.exportMarkdown).toContain("Mode: proof-repair");
    expect(activation.exportMarkdown).toContain("Recommended reply: Revise");
    expect(activation.exportMarkdown).toContain(`Source receipt: ${onePager.receipt.receiptId}`);
    expect(activation.exportMarkdown).toContain("Publish the ProtoPedia story page");
  });

  test("builds a buyer success commitment from the adoption plan and one-pager receipt", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const commitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);

    expect(commitment).toMatchObject({
      status: "ready",
      label: "Success commitment",
      headline: "Day 30 success standard is buyer-ready",
      reviewWindow: "Day 30 operating review",
      retainedValueLine: "¥246,000/month retained floor",
      adoptionTargetLine: "75% adoption target",
      renewalAsk: "Approve expansion after Day 30 operating review if retained value stays above ¥246,000/month.",
      sourceReceiptId: onePager.receipt.receiptId,
      sourceChecksum: `fnv1a32:${onePager.receipt.checksum}`
    });
    expect(commitment.items.map((item) => item.id)).toEqual([
      "value-retention",
      "repeat-usage",
      "proof-freshness",
      "owner-commitment",
      "trust-boundary"
    ]);
    expect(commitment.summary).toContain("retained value, repeat usage, proof freshness, named owners, and trust boundary");
    expect(commitment.exportMarkdown).toContain("# Buyer success commitment");
    expect(commitment.exportMarkdown).toContain(`Source receipt: ${onePager.receipt.receiptId}`);
    expect(commitment.exportMarkdown).toContain("## Day 30 checkpoint");
    expect(commitment.exportMarkdown).toContain("## Value realization ledger");
    expect(commitment.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(commitment.valueRealizationLedger).toMatchObject({
      status: "ready",
      headline: "Value realization ledger is ready",
      readyCount: 4,
      blockedCount: 0,
      nextOwner: "Review owner",
      nextAction: "Attach the value calendar, CSV, and ledger receipt to the external review packet.",
      sourceReceiptId: onePager.receipt.receiptId,
      sourceChecksum: `fnv1a32:${onePager.receipt.checksum}`
    });
    expect(commitment.valueRealizationLedger.tasks.map((task) => task.id)).toEqual([
      "baseline-lock",
      "repeat-usage",
      "value-retention",
      "expand-stop"
    ]);
    expect(commitment.valueRealizationLedger.taskCsvText).toContain('"window","label","status","owner","action","evidence","close_criteria","proof","href"');
    expect(commitment.valueRealizationLedger.taskCsvText).toContain('"Day 30","Expand or stop recorded","ready","Procurement owner"');
    expect(commitment.valueRealizationLedger.taskCsvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(commitment.valueRealizationLedger.receipt.receiptId).toMatch(/^quick-value-realization-ready-[0-9a-f]{8}$/);
    expect(commitment.valueRealizationLedger.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(commitment.valueRealizationLedger.exportMarkdown).toContain("# Value realization ledger");
    expect(commitment.valueRealizationLedger.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    const valueCalendar = buildQuickValueRealizationCalendarExport(commitment.valueRealizationLedger, "2026-07-01");
    expect(valueCalendar).toMatchObject({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      eventCount: 4
    });
    expect(valueCalendar?.receipt.receiptId).toMatch(/^quick-value-realization-calendar-ready-20260701-[0-9a-f]{8}$/);
    expect(valueCalendar?.icsText).toContain("SUMMARY:Day 30 Expand or stop recorded - Procurement owner");
    expect(valueCalendar?.icsHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(buildQuickValueRealizationCalendarExport(commitment.valueRealizationLedger, "2026-02-31")).toBeNull();
  });

  test("verifies value realization closeout evidence against the buyer success ledger", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const commitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);
    const evidenceText = [
      "Day 0 baseline owner Global Platform VP named the metric, proof packet, stop rule, and review date.",
      "Day 7 repeat usage accepted: accepted task rate stayed at 95% with pilot receipt https://proof.example.com/day7.",
      "Day 14 finance retained value ¥280,000/month, above the retained target.",
      `Day 30 live proof verified from ${commitment.valueRealizationLedger.receipt.receiptId}; expansion approved with closeout proof https://proof.example.com/day30.`
    ].join("\n");
    const closeout = buildQuickValueRealizationCloseout({ preview, commitment, evidenceText });

    expect(closeout).toMatchObject({
      status: "ready",
      headline: "Value closeout is buyer-verifiable",
      completedCount: 4,
      blockedCount: 0,
      retainedValueYen: 280000,
      retainedValueTargetYen: preview.adoptionSuccessPlan.retainedMonthlyValueYen,
      decision: "expand",
      sourceLedgerReceiptId: commitment.valueRealizationLedger.receipt.receiptId,
      sourceLedgerChecksum: `fnv1a32:${commitment.valueRealizationLedger.receipt.checksum}`
    });
    expect(closeout.tasks.map((task) => task.status)).toEqual(["ready", "ready", "ready", "ready"]);
    expect(closeout.tasks.find((task) => task.id === "value-retention")).toMatchObject({
      outcome: "¥280,000/month clears the ¥246,000/month retained-value target."
    });
    expect(closeout.repairQueue).toMatchObject({
      status: "ready",
      itemCount: 0,
      sourceRepairCount: 0,
      evidenceGapCount: 0,
      nextOwner: "Ready"
    });
    expect(closeout.receipt.receiptId).toMatch(/^quick-value-closeout-ready-[0-9a-f]{8}$/);
    expect(closeout.receipt).toMatchObject({
      verificationApiPath: "/api/quick-value-realization-closeout/verify",
      verification: {
        status: "verified",
        expectedChecksum: closeout.receipt.checksum,
        actualChecksum: closeout.receipt.checksum
      },
      payload: {
        receiptVersion: "quick-value-realization-closeout.v1",
        status: "ready",
        decision: "expand",
        sourceLedgerReceiptId: commitment.valueRealizationLedger.receipt.receiptId,
        repairQueue: {
          status: "ready",
          itemCount: 0
        },
        tasks: expect.arrayContaining([expect.objectContaining({ id: "expand-stop", status: "ready" })])
      },
      generatedFrom: ["value-closeout-evidence", "value-realization-ledger", "buyer-success-commitment"]
    });
    expect(JSON.parse(closeout.receipt.verificationRequestJson)).toMatchObject({
      checksum: closeout.receipt.checksum,
      payload: {
        receiptVersion: "quick-value-realization-closeout.v1",
        decision: "expand"
      }
    });
    expect(closeout.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(closeout.verifierHref).toContain("/receipt-verifier?request=");
    expect(closeout.verifierHref).toContain("&verify=1");
    expect(closeout.exportMarkdown).toContain("# Value realization closeout");
    expect(closeout.exportMarkdown).toContain("Decision: expand");
    expect(closeout.exportMarkdown).toContain("## Repair queue");
    expect(closeout.exportMarkdown).toContain("API verification: POST /api/quick-value-realization-closeout/verify");
    expect(closeout.exportMarkdown).toContain('"receiptVersion": "quick-value-realization-closeout.v1"');
    expect(closeout.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const acknowledgement = buildQuickValueRealizationCloseoutRepairAcknowledgement({ closeout, ownerEvidenceText: "" });
    expect(acknowledgement).toMatchObject({
      status: "ready",
      acknowledgedCount: 0,
      requiredAcknowledgementCount: 0,
      nextOwner: "Ready"
    });
    expect(acknowledgement.receipt.receiptId).toMatch(/^quick-value-closeout-repair-ready-[0-9a-f]{8}$/);
    expect(acknowledgement.receipt.payload).toMatchObject({
      receiptVersion: "quick-value-realization-closeout-repair.v1",
      status: "ready",
      sourceCloseoutReceiptId: closeout.receipt.receiptId,
      repairQueueItemCount: 0
    });

    const acceptance = buildQuickValueRealizationAcceptancePacket({ closeout, repairAcknowledgement: acknowledgement });
    expect(acceptance).toMatchObject({
      status: "ready",
      decision: "accept-value-proof",
      nextOwner: "Ready",
      receipt: {
        verificationApiPath: "/api/quick-value-realization-acceptance/verify",
        payload: {
          receiptVersion: "quick-value-realization-acceptance.v1",
          sourceCloseoutReceiptId: closeout.receipt.receiptId,
          repairAcknowledgementReceiptId: acknowledgement.receipt.receiptId,
          retainedValueYen: 280000,
          closeoutDecision: "expand"
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(acceptance.receipt.receiptId).toMatch(/^quick-value-acceptance-ready-[0-9a-f]{8}$/);
    expect(acceptance.checks).toHaveLength(4);
    expect(acceptance.checks.every((check) => check.status === "ready")).toBe(true);

    const dossier = buildQuickValueRealizationBuyerReviewDossier({ closeout, repairAcknowledgement: acknowledgement, acceptance });
    expect(dossier).toMatchObject({
      status: "ready",
      decision: "review-expand",
      confidenceScore: 100,
      readyCount: 4,
      totalCount: 4,
      nextOwner: "Buyer reviewer"
    });
    expect(dossier.reviewQuestion).toContain("approve expansion");
    expect(dossier.items.map((item) => item.id)).toEqual(["value-claim", "receipt-chain", "day-30-decision", "operating-conditions"]);
    expect(dossier.items.every((item) => item.status === "ready")).toBe(true);
    expect(dossier.exportMarkdown).toContain("# Buyer value review dossier");
    expect(dossier.exportMarkdown).toContain(`Acceptance receipt: ${acceptance.receipt.receiptId}`);

    const executionPacket = buildQuickValueReviewExecutionPacket({ closeout, acceptance, dossier });
    expect(executionPacket).toMatchObject({
      status: "ready",
      decision: "expand-rollout",
      readyTaskCount: 5,
      taskCount: 5,
      blockedTaskCount: 0,
      nextOwner: "Execution owner",
      receipt: {
        verificationApiPath: "/api/quick-value-review-execution/verify",
        payload: {
          receiptVersion: "quick-value-review-execution.v1",
          sourceReviewDecision: "review-expand",
          sourceAcceptanceReceiptId: acceptance.receipt.receiptId,
          sourceCloseoutReceiptId: closeout.receipt.receiptId,
          readyTaskCount: 5
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(executionPacket.tasks.map((task) => task.id)).toEqual([
      "verify-acceptance-receipt",
      "record-review-decision",
      "assign-operating-owner",
      "schedule-value-recheck",
      "publish-executive-brief"
    ]);
    expect(executionPacket.tasks.every((task) => task.status === "ready")).toBe(true);
    expect(executionPacket.guardrails).toHaveLength(3);
    expect(executionPacket.verifierHref).toContain("/receipt-verifier?request=");
    expect(executionPacket.exportMarkdown).toContain("# Value review execution packet");
    expect(executionPacket.exportMarkdown).toContain("API verification: POST /api/quick-value-review-execution/verify");

    const executionCloseout = buildQuickValueReviewExecutionCloseout({
      executionPacket,
      evidenceText: [
        `Acceptance receipt ${acceptance.receipt.receiptId} verified HTTP 200 and verifier result attached.`,
        "Decision recorded for expand rollout; expansion approved with the source acceptance receipt attached.",
        "Platform sponsor operating owner accepted the next operating window within 1 business day.",
        "Finance scheduled the retained value recheck on the calendar with retained value target named.",
        "Executive brief published with buyer ask, decision rule, verifier link, and next owner."
      ].join("\n")
    });
    expect(executionCloseout).toMatchObject({
      status: "ready",
      decision: "accept-execution-closeout",
      readyTaskCount: 5,
      taskCount: 5,
      blockedTaskCount: 0,
      nextOwner: "Ready",
      receipt: {
        verificationApiPath: "/api/quick-value-review-execution-closeout/verify",
        payload: {
          receiptVersion: "quick-value-review-execution-closeout.v1",
          sourceExecutionReceiptId: executionPacket.receipt.receiptId,
          sourceAcceptanceReceiptId: acceptance.receipt.receiptId,
          readyTaskCount: 5
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(executionCloseout.tasks.every((task) => task.status === "ready")).toBe(true);
    expect(executionCloseout.receipt.receiptId).toMatch(/^quick-value-review-execution-closeout-ready-[0-9a-f]{8}$/);
    expect(executionCloseout.exportMarkdown).toContain("# Value review execution closeout");
    expect(executionCloseout.exportMarkdown).toContain("API verification: POST /api/quick-value-review-execution-closeout/verify");

    const successPanelHtml = renderToStaticMarkup(
      createElement(QuickBuyerDecisionSuccessPanel, {
        roomPreview: preview,
        decisionSuccessCommitment: commitment,
        valueRealizationCalendarExport: null,
        valueRealizationCloseout: closeout,
        valueRealizationCloseoutText: evidenceText,
        setValueRealizationCloseoutText: () => undefined,
        valueRealizationRepairAcknowledgement: acknowledgement,
        valueRealizationRepairAcknowledgementText: "",
        setValueRealizationRepairAcknowledgementText: () => undefined,
        valueRealizationAcceptancePacket: acceptance,
        valueRealizationBuyerReviewDossier: dossier,
        valueReviewExecutionPacket: executionPacket,
        valueReviewExecutionCloseout: executionCloseout,
        valueReviewExecutionCloseoutText: executionCloseout.evidenceSummary,
        setValueReviewExecutionCloseoutText: () => undefined
      })
    );
    expect(successPanelHtml).toContain("Value closeout evidence guide");
    expect(successPanelHtml).toContain("Copy closeout brief");
    expect(successPanelHtml).toContain("Value acceptance");
    expect(successPanelHtml).toContain("Value review dossier");
    expect(successPanelHtml).toContain("Execution packet");
    expect(successPanelHtml).toContain("Execution evidence guide");
    expect(successPanelHtml).toContain("Copy execution brief");
    expect(successPanelHtml).toContain("Execution closeout");
  });

  test("turns matched closeout evidence into source ledger repair tasks when the upstream ledger is not ready", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const commitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);
    const retainedTarget = `¥${Math.round(preview.adoptionSuccessPlan.retainedMonthlyValueYen).toLocaleString("en-US")}`;
    const evidenceText = [
      "Day 0 baseline owner Platform sponsor named the metric, proof packet, stop rule, and review date.",
      "Day 7 repeat usage accepted: accepted task rate stayed at 94% with pilot receipt https://proof.example.com/day7.",
      `Day 14 finance retained value ${retainedTarget}/month, above the retained target.`,
      `Day 30 live proof verified from ${commitment.valueRealizationLedger.receipt.receiptId}; expansion approved with closeout proof https://proof.example.com/day30.`
    ].join("\n");
    const closeout = buildQuickValueRealizationCloseout({ preview, commitment, evidenceText });

    expect(closeout.status).toBe("watch");
    expect(closeout.completedCount).toBeLessThan(4);
    expect(closeout.repairQueue.status).toBe("watch");
    expect(closeout.repairQueue.sourceRepairCount).toBeGreaterThan(0);
    expect(closeout.repairQueue.evidenceGapCount).toBe(0);
    expect(closeout.repairQueue.items.every((item) => item.reason === "source-ledger-repair")).toBe(true);
    expect(closeout.repairQueue.items.find((item) => item.taskId === "expand-stop")).toMatchObject({
      owner: "Procurement owner",
      sourceStatus: "watch",
      evidenceStatus: "ready",
      action: expect.stringContaining("Update the source Day 30 value ledger row to ready"),
      acceptance: expect.stringContaining("source value ledger")
    });
    expect(closeout.receipt.payload.repairQueue).toMatchObject({
      status: "watch",
      sourceRepairCount: closeout.repairQueue.sourceRepairCount,
      evidenceGapCount: 0
    });
    expect(closeout.repairQueue.exportMarkdown).toContain("# Value closeout repair queue");
    expect(closeout.repairQueue.exportMarkdown).toContain("Reason: source-ledger-repair");
    expect(closeout.repairQueue.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const acknowledgement = buildQuickValueRealizationCloseoutRepairAcknowledgement({
      closeout,
      ownerEvidenceText: [
        `Platform sponsor accepted Day 0 source ledger repair; source ledger ${closeout.sourceLedgerReceiptId} was re-exported ready.`,
        `Procurement owner accepted Day 30 source ledger repair; source ledger ${closeout.sourceLedgerReceiptId} was re-exported ready.`
      ].join("\n")
    });

    expect(acknowledgement).toMatchObject({
      status: "ready",
      acknowledgedCount: closeout.repairQueue.sourceRepairCount,
      requiredAcknowledgementCount: closeout.repairQueue.sourceRepairCount,
      nextOwner: "Ready"
    });
    expect(acknowledgement.items.map((item) => item.status)).toEqual(["ready", "ready"]);
    expect(acknowledgement.receipt).toMatchObject({
      verificationApiPath: "/api/quick-value-realization-closeout-repair/verify",
      verification: {
        status: "verified",
        expectedChecksum: acknowledgement.receipt.checksum,
        actualChecksum: acknowledgement.receipt.checksum
      },
      payload: {
        receiptVersion: "quick-value-realization-closeout-repair.v1",
        status: "ready",
        sourceCloseoutReceiptId: closeout.receipt.receiptId,
        sourceLedgerReceiptId: closeout.sourceLedgerReceiptId,
        acknowledgedCount: closeout.repairQueue.sourceRepairCount
      }
    });
    expect(acknowledgement.verifierHref).toContain("/receipt-verifier?request=");
    expect(acknowledgement.verifierHref).toContain("&verify=1");
    expect(acknowledgement.exportMarkdown).toContain("# Value closeout repair acknowledgement");
    expect(acknowledgement.exportMarkdown).toContain("API verification: POST /api/quick-value-realization-closeout-repair/verify");
    expect(acknowledgement.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const acceptance = buildQuickValueRealizationAcceptancePacket({ closeout, repairAcknowledgement: acknowledgement });
    expect(acceptance).toMatchObject({
      status: "ready",
      decision: "accept-value-proof",
      receipt: {
        payload: {
          sourceCloseoutReceiptId: closeout.receipt.receiptId,
          repairAcknowledgementReceiptId: acknowledgement.receipt.receiptId,
          acknowledgedCount: closeout.repairQueue.sourceRepairCount,
          sourceRepairCount: closeout.repairQueue.sourceRepairCount
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(acceptance.verifierHref).toContain("/receipt-verifier?request=");
    expect(acceptance.exportMarkdown).toContain("# Value realization acceptance packet");
    expect(acceptance.exportMarkdown).toContain("API verification: POST /api/quick-value-realization-acceptance/verify");
    expect(acceptance.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);

    const dossier = buildQuickValueRealizationBuyerReviewDossier({ closeout, repairAcknowledgement: acknowledgement, acceptance });
    expect(dossier).toMatchObject({
      status: "ready",
      decision: "review-expand",
      confidenceScore: 100,
      readyCount: 4,
      totalCount: 4
    });
    expect(dossier.items.find((item) => item.id === "receipt-chain")).toMatchObject({
      status: "ready",
      href: acceptance.verifierHref
    });
    expect(dossier.exportMarkdown).toContain("Decision: review-expand");
    expect(dossier.exportMarkdown).toContain("Verifier: /api/quick-value-realization-acceptance/verify");

    const executionPacket = buildQuickValueReviewExecutionPacket({ closeout, acceptance, dossier });
    expect(executionPacket).toMatchObject({
      status: "ready",
      decision: "expand-rollout",
      readyTaskCount: 5,
      taskCount: 5,
      receipt: {
        payload: {
          sourceAcceptanceReceiptId: acceptance.receipt.receiptId,
          sourceCloseoutReceiptId: closeout.receipt.receiptId
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(executionPacket.receipt.receiptId).toMatch(/^quick-value-review-execution-ready-[0-9a-f]{8}$/);
    expect(executionPacket.exportMarkdown).toContain(`Acceptance receipt: ${acceptance.receipt.receiptId}`);

    const executionCloseout = buildQuickValueReviewExecutionCloseout({
      executionPacket,
      evidenceText: [
        `Acceptance receipt ${acceptance.receipt.receiptId} verified HTTP 200 and verifier result attached.`,
        "Decision recorded for expand rollout; expansion approved with the source acceptance receipt attached.",
        "Platform sponsor operating owner accepted the next operating window within 1 business day.",
        "Finance scheduled the retained value recheck on the calendar with retained value target named.",
        "Executive brief published with buyer ask, decision rule, verifier link, and next owner."
      ].join("\n")
    });
    expect(executionCloseout).toMatchObject({
      status: "ready",
      decision: "accept-execution-closeout",
      readyTaskCount: 5,
      taskCount: 5,
      receipt: {
        payload: {
          sourceExecutionReceiptId: executionPacket.receipt.receiptId,
          sourceAcceptanceReceiptId: acceptance.receipt.receiptId
        },
        verification: {
          status: "verified"
        }
      }
    });
  });

  test("holds value realization closeout when retained value and decision proof are weak", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const commitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);
    const weakEvidenceText =
      "Day 7 repeated use was accepted with pilot receipt https://proof.example.com/day7. Finance retained value was only ¥120,000/month.";
    const closeout = buildQuickValueRealizationCloseout({
      preview,
      commitment,
      evidenceText: weakEvidenceText
    });

    expect(closeout.status).toBe("watch");
    expect(closeout.completedCount).toBe(1);
    expect(closeout.retainedValueYen).toBe(120000);
    expect(closeout.decision).toBe("missing");
    expect(closeout.tasks.find((task) => task.id === "value-retention")).toMatchObject({
      status: "watch",
      outcome: "Retained value evidence is below or missing the ¥246,000/month target."
    });
    expect(closeout.tasks.find((task) => task.id === "expand-stop")).toMatchObject({
      status: "watch",
      missingSignals: ["expand/revise/stop decision stated"]
    });
    expect(closeout.repairQueue).toMatchObject({
      status: "watch",
      sourceRepairCount: 0,
      evidenceGapCount: 3
    });
    expect(closeout.repairQueue.items.map((item) => item.reason)).toEqual(["evidence-gap", "evidence-gap", "evidence-gap"]);
    expect(closeout.repairQueue.items.find((item) => item.taskId === "value-retention")).toMatchObject({
      action: expect.stringContaining("retained value meets target"),
      sourceStatus: "ready",
      evidenceStatus: "watch"
    });
    const acknowledgement = buildQuickValueRealizationCloseoutRepairAcknowledgement({
      closeout,
      ownerEvidenceText: "Finance owner accepted the value repair."
    });
    expect(acknowledgement).toMatchObject({
      status: "blocked",
      acknowledgedCount: 0,
      requiredAcknowledgementCount: 0,
      nextAction: "Repair the operating evidence field before owner acknowledgement can close this item."
    });
    expect(acknowledgement.items.find((item) => item.taskId === "value-retention")).toMatchObject({
      status: "blocked",
      missingSignals: ["repair operating evidence first"]
    });
    expect(closeout.receipt.receiptId).toMatch(/^quick-value-closeout-watch-[0-9a-f]{8}$/);

    const acceptance = buildQuickValueRealizationAcceptancePacket({ closeout, repairAcknowledgement: acknowledgement });
    expect(acceptance).toMatchObject({
      status: "blocked",
      decision: "hold-for-operating-evidence",
      nextOwner: closeout.nextOwner,
      receipt: {
        payload: {
          sourceCloseoutReceiptId: closeout.receipt.receiptId,
          repairAcknowledgementReceiptId: acknowledgement.receipt.receiptId,
          retainedValueYen: 120000,
          closeoutDecision: "missing",
          evidenceGapCount: 3
        }
      }
    });
    expect(acceptance.checks.find((check) => check.id === "retained-value")).toMatchObject({
      status: "blocked"
    });
    expect(acceptance.checks.find((check) => check.id === "buyer-decision")).toMatchObject({
      status: "blocked"
    });

    const dossier = buildQuickValueRealizationBuyerReviewDossier({ closeout, repairAcknowledgement: acknowledgement, acceptance });
    expect(dossier).toMatchObject({
      status: "blocked",
      decision: "hold-review",
      nextOwner: closeout.nextOwner
    });
    expect(dossier.reviewQuestion).toContain("What must close");
    expect(dossier.buyerAsk).toContain("Hold review");
    expect(dossier.items.find((item) => item.id === "value-claim")).toMatchObject({
      status: "blocked"
    });
    expect(dossier.items.find((item) => item.id === "receipt-chain")).toMatchObject({
      status: "blocked"
    });

    const executionPacket = buildQuickValueReviewExecutionPacket({ closeout, acceptance, dossier });
    expect(executionPacket).toMatchObject({
      status: "blocked",
      decision: "hold-review",
      readyTaskCount: 0,
      taskCount: 5,
      blockedTaskCount: 5,
      nextOwner: closeout.nextOwner,
      receipt: {
        payload: {
          receiptVersion: "quick-value-review-execution.v1",
          sourceReviewDecision: "hold-review",
          sourceAcceptanceReceiptId: acceptance.receipt.receiptId
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(executionPacket.nextAction).toBe(acceptance.nextAction);
    expect(executionPacket.tasks.every((task) => task.status === "blocked")).toBe(true);
    expect(executionPacket.guardrails.join(" ")).toContain("Do not assign post-review work");

    const executionCloseout = buildQuickValueReviewExecutionCloseout({
      executionPacket,
      evidenceText: "Decision owner says work is done."
    });
    expect(executionCloseout).toMatchObject({
      status: "blocked",
      decision: "hold-execution-closeout",
      readyTaskCount: 0,
      taskCount: 5,
      blockedTaskCount: 5,
      nextAction: "Move the value review execution packet to ready before closing execution.",
      receipt: {
        payload: {
          receiptVersion: "quick-value-review-execution-closeout.v1",
          sourceExecutionReceiptId: executionPacket.receipt.receiptId
        },
        verification: {
          status: "verified"
        }
      }
    });
    expect(executionCloseout.tasks.every((task) => task.status === "blocked")).toBe(true);

    const weakPanelHtml = renderToStaticMarkup(
      createElement(QuickBuyerDecisionSuccessPanel, {
        roomPreview: preview,
        decisionSuccessCommitment: commitment,
        valueRealizationCalendarExport: null,
        valueRealizationCloseout: closeout,
        valueRealizationCloseoutText: weakEvidenceText,
        setValueRealizationCloseoutText: () => undefined,
        valueRealizationRepairAcknowledgement: acknowledgement,
        valueRealizationRepairAcknowledgementText: "Finance owner accepted the value repair.",
        setValueRealizationRepairAcknowledgementText: () => undefined,
        valueRealizationAcceptancePacket: acceptance,
        valueRealizationBuyerReviewDossier: dossier,
        valueReviewExecutionPacket: executionPacket,
        valueReviewExecutionCloseout: executionCloseout,
        valueReviewExecutionCloseoutText: "Decision owner says work is done.",
        setValueReviewExecutionCloseoutText: () => undefined
      })
    );
    expect(weakPanelHtml).toContain("Value closeout evidence guide");
    expect(weakPanelHtml).toContain("Copy closeout brief");
    expect(weakPanelHtml).toContain("retained value meets target");
    expect(weakPanelHtml).toContain("expand/revise/stop decision stated");
    expect(weakPanelHtml).toContain("Value acceptance");
    expect(weakPanelHtml).toContain("hold-for-operating-evidence");
    expect(weakPanelHtml).toContain("Execution evidence guide");
    expect(weakPanelHtml).toContain("Do not ask for completion proof until the execution packet is ready and verified.");
  });

  test("blocks the buyer success commitment while proof freshness is incomplete", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const onePager = buildQuickBuyerDecisionOnePager(preview);
    const commitment = buildQuickBuyerDecisionSuccessCommitment(preview, onePager);

    expect(commitment).toMatchObject({
      status: "watch",
      label: "Success commitment review",
      headline: "Day 30 success standard needs owner review",
      sourceReceiptId: onePager.receipt.receiptId
    });
    expect(commitment.items.find((item) => item.id === "proof-freshness")).toMatchObject({
      status: "watch",
      owner: "Proof owner",
      action: "Repair public proof before any expansion ask."
    });
    expect(commitment.summary).toBe("Hold renewal until Proof owner closes proof freshness: Repair public proof before any expansion ask.");
    expect(commitment.exportMarkdown).toContain("Status: watch");
    expect(commitment.exportMarkdown).toContain("Renewal ask: Hold expansion until proof freshness is ready.");
    expect(commitment.valueRealizationLedger).toMatchObject({
      status: "watch",
      headline: "Value realization ledger needs owner review",
      readyCount: 2,
      blockedCount: 0,
      nextOwner: "Platform sponsor"
    });
    expect(commitment.valueRealizationLedger.tasks.find((task) => task.id === "expand-stop")).toMatchObject({
      status: "watch",
      owner: "Procurement owner",
      proof: expect.stringContaining("All five public proof links pass live verification again at Day 30.")
    });
    expect(commitment.valueRealizationLedger.receipt.receiptId).toMatch(/^quick-value-realization-watch-[0-9a-f]{8}$/);
  });

  test("builds a publication kit with story copy, walkthrough shots, and public launch gaps", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const kit = buildQuickPublicationKit(draft, preview);

    expect(kit.status).toBe("blocked");
    expect(kit.headline).toContain("publication");
    expect(kit.items.map((item) => item.id)).toEqual(["story", "walkthrough", "proof", "tag"]);
    expect(kit.items.find((item) => item.id === "story")).toMatchObject({
      status: "ready",
      label: "ProtoPedia story"
    });
    expect(kit.items.find((item) => item.id === "walkthrough")).toMatchObject({
      status: "blocked",
      owner: "Recording owner"
    });
    expect(kit.items.find((item) => item.id === "tag")).toMatchObject({
      status: "watch",
      label: "Story publication",
      evidence: "Public story page URL missing"
    });
    expect(kit.storyText).toContain("Public story page");
    expect(kit.storyText).toContain("ProtoPedia story page URL pending");
    expect(kit.storyText).toContain("Why AI is necessary");
    expect(kit.storyText).not.toContain("findy_hackathon");
    expect(kit.storyText).not.toMatch(/demo/i);
    expect(kit.walkthroughText).toContain("Verify the extraction receipt");
    expect(kit.walkthroughText).toContain("Do not claim public launch readiness");
    expect(kit.exportMarkdown).toContain("## ProtoPedia story copy");
    expect(kit.exportMarkdown).toContain("## Walkthrough shot list");
    expect(kit.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(kit.storyHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(kit.walkthroughHref).toMatch(/^data:text\/plain;charset=utf-8,/);
  });

  test("builds a ready global publishability verdict from proof, submission, rollout, and success gates", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const liveProofAudit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: proofVerificationFor(quickProofLinksForVerification(preview.proofRepairPlan))
    });
    const verdict = buildQuickGlobalPublishabilityBrief(draft, preview, undefined, undefined, undefined, 0, {
      liveProofAudit,
      freshnessNowMs: Date.parse("2026-06-21T12:00:00.000Z")
    });

    expect(verdict).toMatchObject({
      status: "ready",
      score: 100,
      label: "Publishable proof room",
      headline: "Global publishability verdict is ready",
      primaryAction: "Open the publishable proof room and share the buyer one-pager."
    });
    expect(verdict.repairImpact).toBeNull();
    expect(verdict.freshness).toMatchObject({
      status: "ready",
      label: "Fresh proof receipt",
      auditReceiptId: liveProofAudit.receiptId,
      auditChecksum: `fnv1a32:${liveProofAudit.checksum}`,
      auditRowSummary: "5/5 live proof rows sealed in the audit receipt.",
      remainingHours: 12
    });
    expect(verdict.freshness.auditRows).toHaveLength(5);
    expect(verdict.freshness.auditRows.every((row) => row.status === "pass")).toBe(true);
    expect(verdict.freshness.exportMarkdown).toContain("## Sealed live proof rows");
    expect(verdict.freshness.exportMarkdown).toContain("- [pass] ProtoPedia URL:");
    expect(verdict.freshness.exportMarkdown).toContain("5/5 live proof rows sealed in the audit receipt.");
    expect(verdict.certificate).toMatchObject({
      status: "ready",
      clearance: "external-review",
      label: "External review allowed",
      headline: "Launch certificate clears external sharing"
    });
    expect(verdict.certificate.sharePolicy).toContain("can share the buyer one-pager, publication kit, and live proof audit");
    expect(verdict.certificate.holdReason).toBe("Recheck live proof before the freshness window expires.");
    expect(verdict.certificate.receipts.map((receipt) => receipt.label)).toEqual([
      "One-pager receipt",
      "One-pager checksum",
      "Claim ledger",
      "Rollout receipt",
      "Live proof audit",
      "Live proof rows",
      "Freshness window",
      "Publication kit"
    ]);
    expect(verdict.certificate.receipts.find((receipt) => receipt.label === "Live proof audit")).toMatchObject({
      value: `${liveProofAudit.receiptId} / fnv1a32:${liveProofAudit.checksum}`
    });
    expect(verdict.certificate.receipts.find((receipt) => receipt.label === "Live proof rows")).toMatchObject({
      value: "5/5 live proof rows sealed in the audit receipt."
    });
    expect(verdict.certificate.exportMarkdown).toContain("Clearance: External review allowed");
    expect(verdict.certificate.exportMarkdown).toContain(`Live proof audit: ${liveProofAudit.receiptId}`);
    expect(verdict.certificate.exportMarkdown).toContain("Live proof rows: 5/5 live proof rows sealed in the audit receipt.");
    expect(verdict.certificate.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.reviewerBrief).toMatchObject({
      status: "ready",
      clearance: "external-review",
      label: "Reviewer brief",
      headline: "Reviewer can start with four artifacts"
    });
    expect(verdict.reviewerBrief.reviewQuestion).toContain("continue, revise, or stop");
    expect(verdict.reviewerBrief.messageText).toContain("Start with the launch certificate");
    expect(verdict.reviewerBrief.readOrder.map((item) => item.label)).toEqual([
      "Launch certificate",
      "Buyer one-pager",
      "Fresh proof window",
      "Day 30 success rule"
    ]);
    expect(verdict.reviewerBrief.readOrder.every((item) => item.status === "ready")).toBe(true);
    expect(verdict.reviewerBrief.exportMarkdown).toContain("# Reviewer brief");
    expect(verdict.reviewerBrief.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.claimAudit).toMatchObject({
      status: "ready",
      label: "Decision-grade claims",
      headline: "Reviewer can challenge the business case claim by claim",
      traceScore: 100,
      readyCount: 9,
      totalCount: 9,
      primaryRisk: "Every buyer-facing claim has an attached proof path."
    });
    expect(verdict.claimAudit.rows.map((row) => row.id)).toEqual(["value-model", "measured-run", "public-proof", "agent-trust"]);
    expect(verdict.claimAudit.rows.every((row) => row.status === "ready")).toBe(true);
    expect(verdict.claimAudit.rows.find((row) => row.id === "value-model")).toMatchObject({
      owner: "Finance owner",
      proof: "¥328,000/month risk-adjusted floor"
    });
    expect(verdict.claimAudit.exportMarkdown).toContain("# Decision-grade claim audit");
    expect(verdict.claimAudit.exportMarkdown).toContain("Workflow: weekly Cloud Run release-readiness review");
    expect(verdict.claimAudit.exportMarkdown).toContain("Claim ledger receipt:");
    expect(verdict.claimAudit.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(verdict.claimAudit.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(verdict.claimAudit.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.valueRoute).toMatchObject({
      status: "ready",
      label: "Review-to-value route",
      headline: "Continue turns into a Day 30 value decision",
      retainedValueLine: "¥246,000/month retained value by Day 30"
    });
    expect(verdict.valueRoute.routeQuestion).toContain("prove retained value by Day 30");
    expect(verdict.valueRoute.steps.map((step) => step.id)).toEqual(["review-decision", "day-0", "day-7", "day-14", "day-30"]);
    expect(verdict.valueRoute.steps.every((step) => step.status === "ready")).toBe(true);
    expect(verdict.valueRoute.steps.find((step) => step.id === "day-30")).toMatchObject({
      owner: "Procurement owner",
      proof: "Approve expansion after Day 30 operating review if retained value stays above ¥246,000/month."
    });
    expect(verdict.valueRoute.exportMarkdown).toContain("# Review-to-value route");
    expect(verdict.valueRoute.exportMarkdown).toContain("Retained value: ¥246,000/month retained value by Day 30");
    expect(verdict.valueRoute.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.objectionDeck).toMatchObject({
      status: "ready",
      label: "Objection answers",
      headline: "Reviewer objections are answered with evidence",
      readyCount: 5,
      totalCount: 5,
      primaryQuestion: "Can a buyer challenge value, proof, trust, data, and adoption without finding a gap?"
    });
    expect(verdict.objectionDeck.rows.map((row) => row.id)).toEqual(["valueProof", "publicProof", "agentTrust", "dataBoundary", "adoptionPath"]);
    expect(verdict.objectionDeck.rows.every((row) => row.status === "ready")).toBe(true);
    expect(verdict.objectionDeck.rows.find((row) => row.id === "agentTrust")?.answer).toContain("Accepted A2A trial receipt");
    expect(verdict.objectionDeck.exportMarkdown).toContain("# Reviewer objection answers");
    expect(verdict.objectionDeck.exportMarkdown).toContain("Ready: 5/5");
    expect(verdict.objectionDeck.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.reviewPacket).toMatchObject({
      status: "ready",
      clearance: "external-review",
      label: "External review packet",
      headline: "One packet is ready to send",
      readyCount: 6,
      totalCount: 6,
      nextAction: "Send the packet with the launch certificate first."
    });
    expect(verdict.reviewPacket.sendRule).toContain("Forward after final live proof check");
    expect(verdict.reviewPacket.items.map((item) => item.label)).toEqual([
      "Launch certificate",
      "Reviewer brief",
      "Claim audit",
      "Review-to-value route",
      "Objection answers",
      "Proof freshness"
    ]);
    expect(verdict.reviewPacket.items.every((item) => item.status === "ready")).toBe(true);
    expect(verdict.reviewPacket.exportMarkdown).toContain("# External review packet");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Clearance: External review allowed");
    expect(verdict.reviewPacket.exportMarkdown).toContain("## Packet contents");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Trace score: 100/100");
    expect(verdict.reviewPacket.exportMarkdown).toContain("## Manifest receipt");
    expect(verdict.reviewPacket.exportMarkdown).toContain(`Live proof audit: ${liveProofAudit.receiptId} / fnv1a32:${liveProofAudit.checksum}`);
    expect(verdict.reviewPacket.exportMarkdown).toContain("Verifier: /receipt-verifier");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Artifact bundle: quick-external-review-artifact-bundle.json");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Verifier input: Paste the downloaded manifest JSON");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Launch certificate: markdown");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Live proof rows: 5/5 live proof rows sealed in the audit receipt.");
    expect(verdict.reviewPacket.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.reviewPacket.manifest).toMatchObject({
      receiptVersion: "quick-external-review-packet.v1",
      status: "ready",
      clearance: "external-review",
      buyer: "Platform release lead",
      score: 100,
      readyCount: 6,
      totalCount: 6,
      checksumAlgorithm: "fnv1a32",
      payloadChecksum: verdict.reviewPacket.manifest.checksum
    });
    expect(verdict.reviewPacket.manifest.receiptId).toMatch(/^quick-external-review-ready-[0-9a-f]{8}$/);
    expect(verdict.reviewPacket.manifest.artifacts.map((item) => item.requiredOrder)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(verdict.reviewPacket.manifest.artifacts.find((item) => item.id === "proof-freshness")).toMatchObject({
      status: "ready",
      role: "Live proof window"
    });
    expect(verdict.reviewPacket.manifest.sourceReceipts.map((receipt) => receipt.label)).toEqual(
      expect.arrayContaining(["One-pager receipt", "Claim ledger", "Live proof audit", "Review packet source", "Claim audit receipt"])
    );
    expect(verdict.reviewPacket.manifestJson).toContain(verdict.reviewPacket.manifest.receiptId);
    expect(verdict.reviewPacket.manifestHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(verdict.reviewPacket.artifactBundleHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(verdict.reviewPacket.artifactBundleJson).toContain("quick-external-review-artifact-bundle.v1");
    expect(verdict.reviewPacket.artifactBundleJson).toContain("## Sealed live proof rows");
    expect(verdict.reviewPacket.artifactBundleJson).toContain("- [pass] ProtoPedia URL:");
    expect(verdict.reviewPacket.manifestVerificationRequestJson).toContain('"manifest"');
    expect(verdict.reviewPacket.manifestVerificationRequestJson).toContain('"receiptVersion": "quick-external-review-packet.v1"');
    expect(verdict.reviewPacket.manifestVerificationStorageKey).toBe(verdict.reviewPacket.manifest.receiptId);
    const manifestVerifierUrl = new URL(verdict.reviewPacket.manifestVerifierHref, "https://example.com");
    expect(manifestVerifierUrl.pathname).toBe("/receipt-verifier");
    expect(manifestVerifierUrl.searchParams.get("request")).toBe(verdict.reviewPacket.manifestVerificationRequestJson);
    expect(manifestVerifierUrl.searchParams.get("verify")).toBe("1");
    expect(manifestVerifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(verdict.reviewPacket.reviewDeskHref).toContain("/external-review-packet?packet=");
    expect(verdict.reviewPacket.reviewDeskHref).toContain("verify=1");
    expect(verdict.reviewPacket.reviewDeskHref.length).toBeLessThan(12000);
    expect(verdict.reviewPacket.manifestVerifierHref.length).toBeLessThan(30000);
    expect(
      decodeQuickExternalReviewPacketShareParam(
        new URL(verdict.reviewPacket.reviewDeskHref, "https://example.com").searchParams.get(QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM)
      )
    ).toBe(verdict.reviewPacket.manifestVerificationRequestJson);
    expect(JSON.parse(decodeURIComponent(verdict.reviewPacket.manifestHref.split(",")[1] ?? ""))).toMatchObject({
      receiptId: verdict.reviewPacket.manifest.receiptId,
      checksum: verdict.reviewPacket.manifest.checksum,
      status: "ready",
      artifacts: expect.arrayContaining([
        expect.objectContaining({
          id: "launch-certificate",
          href: "#external-review-artifact-launch-certificate",
          contentKind: "markdown",
          contentLength: verdict.certificate.exportMarkdown.length,
          contentChecksum: expect.stringMatching(/^[0-9a-f]{8}$/),
          requiredOrder: 1
        })
      ])
    });
    expect(JSON.parse(decodeURIComponent(verdict.reviewPacket.artifactBundleHref.split(",")[1] ?? ""))).toMatchObject({
      receiptVersion: "quick-external-review-artifact-bundle.v1",
      manifestReceiptId: verdict.reviewPacket.manifest.receiptId,
      manifestChecksum: `fnv1a32:${verdict.reviewPacket.manifest.checksum}`,
      manifest: {
        receiptId: verdict.reviewPacket.manifest.receiptId
      },
      artifacts: expect.arrayContaining([
        expect.objectContaining({
          artifactId: "launch-certificate",
          label: "Launch certificate",
          contentKind: "markdown",
          content: verdict.certificate.exportMarkdown
        })
      ])
    });
    expect(JSON.parse(verdict.reviewPacket.artifactBundleJson).artifacts).toHaveLength(6);
    const launchCertificateArtifact = verdict.reviewPacket.manifest.artifacts.find((artifact) => artifact.id === "launch-certificate");
    expect(launchCertificateArtifact).toMatchObject({
      contentKind: "markdown",
      contentChecksum: fnv1a32(verdict.certificate.exportMarkdown),
      contentLength: verdict.certificate.exportMarkdown.length
    });
    expect(launchCertificateArtifact?.contentChecksum).not.toBe(fnv1a32(launchCertificateArtifact?.href ?? ""));
    const reviewerBriefArtifact = verdict.reviewPacket.manifest.artifacts.find((artifact) => artifact.id === "reviewer-brief");
    expect(reviewerBriefArtifact).toMatchObject({
      contentKind: "markdown",
      contentChecksum: fnv1a32(verdict.reviewerBrief.exportMarkdown),
      contentLength: verdict.reviewerBrief.exportMarkdown.length
    });
    expect(verdict.reviewPacket.manifest.artifacts.every((artifact) => !artifact.href.startsWith("data:"))).toBe(true);
    expect(verdict.reviewPacket.manifest.artifacts.every((artifact) => /^[0-9a-f]{8}$/.test(artifact.contentChecksum))).toBe(true);
    expect(verdict.reviewPacket.manifestVerificationRequestJson.length).toBeLessThan(9000);
    expect(verdict.decisionMemo).toMatchObject({
      status: "ready",
      decision: "accept-external-review",
      label: "Reviewer decision memo",
      reviewerOutcome: "Accept for external review",
      confidenceScore: 100,
      readyCount: 6,
      totalCount: 6
    });
    expect(verdict.decisionMemo.tests.map((test) => test.label)).toEqual([
      "Manifest verification",
      "Proof freshness",
      "External clearance",
      "Claim trace",
      "Review-to-value route",
      "Objection defense"
    ]);
    expect(verdict.decisionMemo.tests.every((test) => test.status === "ready")).toBe(true);
    expect(verdict.decisionMemo.exportMarkdown).toContain("# External reviewer decision memo");
    expect(verdict.decisionMemo.exportMarkdown).toContain("Decision: Accept for external review");
    expect(verdict.decisionMemo.exportMarkdown).toContain(`Manifest: ${verdict.reviewPacket.manifest.receiptId}`);
    expect(verdict.decisionMemo.reviewDeskHref).toBe(verdict.reviewPacket.reviewDeskHref);
    expect(verdict.decisionMemo.exportMarkdown).toContain(`Review desk: ${verdict.reviewPacket.reviewDeskHref}`);
    expect(verdict.decisionMemo.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(verdict.gates.map((gate) => gate.id)).toEqual(["buyer-decision", "public-proof", "proof-freshness", "submission-assets", "rollout-plan", "success-standard"]);
    expect(verdict.gates.every((gate) => gate.status === "ready")).toBe(true);
    expect(verdict.summary).toContain("buyer decision, public proof, submission assets, rollout plan, and success standard");
    expect(verdict.exportMarkdown).toContain("# Global publishability verdict");
    expect(verdict.exportMarkdown).toContain("## Proof freshness window");
    expect(verdict.exportMarkdown).toContain(`Audit receipt: ${liveProofAudit.receiptId}`);
    expect(verdict.exportMarkdown).toContain(`Audit checksum: fnv1a32:${liveProofAudit.checksum}`);
    expect(verdict.exportMarkdown).toContain("## Sealed live proof rows");
    expect(verdict.exportMarkdown).toContain("- [pass] ProtoPedia URL:");
    expect(verdict.exportMarkdown).toContain("## Launch certificate");
    expect(verdict.exportMarkdown).toContain("Clearance: External review allowed");
    expect(verdict.exportMarkdown).toContain("## Reviewer brief");
    expect(verdict.exportMarkdown).toContain("## Decision-grade claim audit");
    expect(verdict.exportMarkdown).toContain("Trace score: 100/100");
    expect(verdict.exportMarkdown).toContain("## Review-to-value route");
    expect(verdict.exportMarkdown).toContain("Question: If Platform release lead says continue");
    expect(verdict.exportMarkdown).toContain("## Reviewer objection answers");
    expect(verdict.exportMarkdown).toContain("Can a buyer challenge value, proof, trust, data, and adoption without finding a gap?");
    expect(verdict.exportMarkdown).toContain("## External review packet");
    expect(verdict.exportMarkdown).toContain("Send rule: Forward after final live proof check");
    expect(verdict.exportMarkdown).toContain("## External reviewer decision memo");
    expect(verdict.exportMarkdown).toContain("Decision: Accept for external review");
    expect(verdict.exportMarkdown).toContain("Remaining: 12 hours");
    expect(verdict.exportMarkdown).toContain(`Source receipt: ${verdict.sourceReceiptId}`);
    expect(verdict.exportMarkdown).toContain(`Claim ledger: ${preview.claimProofLedger.receipt.receiptId}`);
    expect(verdict.exportMarkdown).toContain("Link: data:text/markdown;charset=utf-8,");
    expect(verdict.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
  });

  test("imports a verified external reviewer response into a launch action plan", () => {
    const verdict = readyGlobalPublishabilityVerdict();
    const requestJson = externalReviewDecisionReceiptRequestJson(verdict);
    const plan = buildQuickExternalReviewResponseActionPlan(requestJson, verdict.reviewPacket);

    expect(plan).toMatchObject({
      state: "verified",
      status: "ready",
      label: "Continue accepted",
      headline: "Platform release lead can move from review to sponsor send",
      nextOwner: "Launch owner",
      nextAction: "Send the launch certificate and reviewer brief to the sponsor."
    });
    expect(plan.summary).toContain("Global reviewer recorded accept for external review");
    expect(plan.receiptLine).toContain(verdict.reviewPacket.manifest.receiptId);
    expect(plan.verifierHref).toContain("/receipt-verifier?request=");
    expect(new URL(plan.verifierHref, "https://example.com").searchParams.get("verify")).toBe("1");
    expect(new URL(plan.verifierHref, "https://example.com").searchParams.get("request")).toBe(requestJson);
    expect(plan.exportMarkdown).toContain("# External review response intake");
    expect(plan.exportMarkdown).toContain("Launch owner: Send the launch certificate and reviewer brief to the sponsor.");
    expect(plan.exportMarkdown).toContain("## Runbook");
    expect(plan.exportMarkdown).toContain("## Follow-up ledger");
    expect(plan.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(plan.followUpLedger).toMatchObject({
      status: "ready",
      headline: "Reviewer continue becomes sponsor-send work",
      readyCount: 2,
      watchCount: 1,
      blockedCount: 0,
      taskTotal: 3,
      firstDueLabel: "+2 business days"
    });
    expect(plan.followUpLedger.tasks.map((task) => task.id)).toEqual(["send-sponsor-handoff", "record-sponsor-reply", "recheck-proof-window"]);
    expect(plan.followUpLedger.tasks.find((task) => task.id === "record-sponsor-reply")).toMatchObject({
      dueLabel: "+2 business days",
      closeCondition: "Review coordinator records the sponsor continue, revise, or stop reply before any expansion ask."
    });
    expect(plan.followUpLedger.csv).toContain("taskId,label,status,owner,due,action,closeCondition,evidence,proof,href");
    expect(plan.followUpLedger.csv).toContain("record-sponsor-reply");
    expect(plan.followUpLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(plan.followUpLedger.calendarText).toContain("BEGIN:VCALENDAR");
    expect(plan.followUpLedger.calendarText).toContain("PRODID:-//A2A Agent Marketplace//External Review Response//EN");
    expect(plan.followUpLedger.calendarText).toContain("DTSTART;VALUE=DATE:20260621");
    expect(plan.followUpLedger.calendarText).toContain("DTSTART;VALUE=DATE:20260623");
    expect(plan.followUpLedger.calendarHref).toMatch(/^data:text\/calendar;charset=utf-8,/);
    expect(plan.followUpLedger.exportMarkdown).toContain("# External review response follow-up ledger");
    expect(plan.followUpLedger.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(plan.acceptanceCriteria).toEqual(
      expect.arrayContaining([
        "Attach the verified response receipt to the sponsor handoff.",
        "Send the launch certificate and reviewer brief before any additional artifact."
      ])
    );
    expect(plan.ownerPacketMarkdown).toContain("# External review owner packet");
    expect(plan.ownerPacketMarkdown).toContain("Owner: Launch owner");
    expect(plan.ownerPacketMarkdown).toContain("## Runbook");
    expect(plan.ownerPacketMarkdown).toContain("## Follow-up ledger");
    expect(plan.ownerPacketMarkdown).toContain("Attach the verified response receipt to the sponsor handoff.");
    expect(plan.ownerPacketHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(plan.ownerPacketHref.split(",")[1] ?? "")).toContain("Send the launch certificate and reviewer brief");
    expect(plan.ownerPacketReceiptJson).toContain('"receiptVersion": "quick-external-review-owner-packet.v1"');
    expect(JSON.parse(plan.ownerPacketReceiptJson)).toMatchObject({
      payload: {
        ownerPacketMarkdown: plan.ownerPacketMarkdown,
        regenerationNote: plan.regenerationNote,
        followUpLedger: expect.objectContaining({
          taskTotal: 3,
          firstDueLabel: "+2 business days"
        }),
        runbook: expect.arrayContaining([
          expect.objectContaining({
            id: "send-sponsor-handoff",
            owner: "Launch owner",
            status: "ready"
          })
        ])
      }
    });
    expect(plan.ownerPacketReceiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(plan.ownerPacketVerifierStorageKey).toMatch(/^quick-external-review-owner-packet-[a-f0-9]{8}$/);
    const ownerPacketVerifierUrl = new URL(plan.ownerPacketVerifierHref, "https://example.com");
    expect(ownerPacketVerifierUrl.pathname).toBe("/receipt-verifier");
    expect(ownerPacketVerifierUrl.searchParams.get("request")).toBe(plan.ownerPacketReceiptJson);
    expect(ownerPacketVerifierUrl.searchParams.get("verify")).toBe("1");
    expect(ownerPacketVerifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(JSON.parse(plan.ownerPacketReceiptJson)).toMatchObject({
      payload: {
        receiptVersion: "quick-external-review-owner-packet.v1",
        owner: "Launch owner",
        ownerPacketMarkdown: plan.ownerPacketMarkdown,
        regenerationNote: plan.regenerationNote,
        followUpLedger: expect.objectContaining({
          exportMarkdown: plan.followUpLedger.exportMarkdown
        }),
        runbook: expect.arrayContaining([expect.objectContaining({ id: "send-sponsor-handoff" })])
      }
    });
    expect(plan.regenerationNote).toContain(`External review manifest: ${verdict.reviewPacket.manifest.receiptId}`);
    expect(plan.regenerationNote).toContain("Reviewer note: Approved after checking the packet manifest and proof order.");
    expect(plan.regenerationHref).toMatch(/^data:text\/plain;charset=utf-8,/);

    const importedFromVerifierUrl = buildQuickExternalReviewResponseActionPlan(plan.verifierHref, verdict.reviewPacket);
    expect(importedFromVerifierUrl).toMatchObject({
      state: "verified",
      status: "ready",
      nextOwner: "Launch owner"
    });
  });

  test("restores the imported packet manifest context for a returned reviewer response", () => {
    const reviewedVerdict = readyGlobalPublishabilityVerdict();
    const currentDraft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const currentPreview = buildQuickBuyerRoomPreview(currentDraft, 0);
    const currentVerdict = buildQuickGlobalPublishabilityBrief(currentDraft, currentPreview);
    const requestJson = externalReviewDecisionReceiptRequestJson(reviewedVerdict);
    const importedPacket = importedQuickExternalReviewPacketFromRequestJson(reviewedVerdict.reviewPacket.manifestVerificationRequestJson);

    expect(importedPacket).toMatchObject({
      status: reviewedVerdict.reviewPacket.status,
      clearance: reviewedVerdict.reviewPacket.clearance,
      manifest: {
        receiptId: reviewedVerdict.reviewPacket.manifest.receiptId,
        checksum: reviewedVerdict.reviewPacket.manifest.checksum
      }
    });
    expect(importedPacket?.reviewDeskHref).toContain("/external-review-packet?packet=");
    const importedPacketVerifierUrl = new URL(importedPacket?.manifestVerifierHref ?? "", "https://example.com");
    expect(importedPacketVerifierUrl.pathname).toBe("/receipt-verifier");
    expect(importedPacketVerifierUrl.searchParams.get("request")).toBe(importedPacket?.manifestVerificationRequestJson);
    expect(importedPacketVerifierUrl.searchParams.has("requestKey")).toBe(false);

    const currentPlan = buildQuickExternalReviewResponseActionPlan(requestJson, currentVerdict.reviewPacket);
    const importedPlan = buildQuickExternalReviewResponseActionPlan(requestJson, importedPacket!);

    expect(currentVerdict.reviewPacket.manifest.receiptId).not.toBe(reviewedVerdict.reviewPacket.manifest.receiptId);
    expect(currentPlan).toMatchObject({
      state: "wrong-packet",
      status: "blocked",
      label: "Receipt is for another packet"
    });
    expect(importedPlan).toMatchObject({
      state: "verified",
      status: "ready",
      label: "Continue accepted",
      nextOwner: "Launch owner"
    });
    expect(importedPlan.receiptLine).toContain(reviewedVerdict.reviewPacket.manifest.receiptId);
    expect(importedPlan.packetVerifierHref).toBe(importedPacket?.manifestVerifierHref);
    expect(importedPlan.reviewDeskHref).toBe(importedPacket?.reviewDeskHref);
  });

  test("turns a verified stop response into a repair owner packet", () => {
    const verdict = readyGlobalPublishabilityVerdict();
    const requestJson = externalReviewDecisionReceiptRequestJson(verdict, {
      decision: "stop",
      status: "blocked",
      label: "External review stop",
      reviewOutcome: "Do not send this packet",
      nextAction: "Stop external sharing and repair the packet before requesting another review.",
      reviewerNote: "The reviewer found a proof gap that must be repaired before sharing."
    });
    const plan = buildQuickExternalReviewResponseActionPlan(requestJson, verdict.reviewPacket);

    expect(plan).toMatchObject({
      state: "verified",
      status: "blocked",
      label: "Stop preserved",
      headline: "Platform release lead packet is stopped before public sharing",
      nextOwner: "Review coordinator",
      nextAction: "Stop external sharing and repair the packet before requesting another review."
    });
    expect(plan.acceptanceCriteria).toEqual(
      expect.arrayContaining([
        "Do not send this packet to another external reviewer until the repair is complete.",
        "Regenerate the external review packet and verify the new manifest before requesting another reviewer response."
      ])
    );
    expect(plan.acceptanceCriteria.find((criterion) => criterion.startsWith("Repair target:"))).toContain("Send the packet with the launch certificate first.");
    expect(plan.followUpLedger).toMatchObject({
      status: "blocked",
      headline: "Reviewer stop becomes a no-send ledger",
      readyCount: 0,
      watchCount: 1,
      blockedCount: 2,
      taskTotal: 3,
      firstDueLabel: "Today"
    });
    expect(plan.followUpLedger.tasks.map((task) => task.id)).toEqual(["freeze-external-send", "repair-target", "regenerate-packet"]);
    expect(plan.followUpLedger.tasks[0]).toMatchObject({
      dueLabel: "Today",
      closeCondition: "Review coordinator clears the blocker before another reviewer receives the packet."
    });
    expect(plan.followUpLedger.exportMarkdown).toContain("# External review response follow-up ledger");
    expect(plan.followUpLedger.exportMarkdown).toContain("Reviewer stop becomes a no-send ledger");
    expect(plan.ownerPacketMarkdown).toContain("Owner: Review coordinator");
    expect(plan.ownerPacketMarkdown).toContain("Freeze external send");
    expect(plan.ownerPacketMarkdown).toContain("## Follow-up ledger");
    expect(plan.ownerPacketMarkdown).toContain("Stop external sharing and repair the packet before requesting another review.");
    expect(plan.ownerPacketReceiptJson).toContain('"owner": "Review coordinator"');
    expect(JSON.parse(plan.ownerPacketReceiptJson)).toMatchObject({
      payload: {
        followUpLedger: expect.objectContaining({
          taskTotal: 3,
          firstDueLabel: "Today"
        }),
        runbook: expect.arrayContaining([
          expect.objectContaining({
            id: "freeze-external-send",
            status: "blocked"
          }),
          expect.objectContaining({
            id: "repair-target"
          })
        ])
      }
    });
    const repairOwnerPacketVerifierUrl = new URL(plan.ownerPacketVerifierHref, "https://example.com");
    expect(repairOwnerPacketVerifierUrl.searchParams.get("request")).toBe(plan.ownerPacketReceiptJson);
    expect(repairOwnerPacketVerifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(plan.regenerationNote).toContain("Reviewer note: The reviewer found a proof gap");
    expect(plan.regenerationNote).toContain("Repair target: Send the packet with the launch certificate first.");
  });

  test("blocks a checksum-valid reviewer response for a different packet manifest", () => {
    const verdict = readyGlobalPublishabilityVerdict();
    const requestJson = externalReviewDecisionReceiptRequestJson(verdict, {
      manifestReceiptId: "quick-external-review-ready-deadbeef",
      manifestChecksum: "fnv1a32:deadbeef"
    });
    const plan = buildQuickExternalReviewResponseActionPlan(requestJson, verdict.reviewPacket);

    expect(plan).toMatchObject({
      state: "wrong-packet",
      status: "blocked",
      label: "Receipt is for another packet",
      headline: "Do not apply this response to the current packet",
      nextOwner: "Review coordinator",
      nextAction: "Open the matching packet or request a new reviewer response for the current manifest."
    });
    expect(plan.summary).toContain("quick-external-review-ready-deadbeef");
    expect(plan.summary).toContain(verdict.reviewPacket.manifest.receiptId);
    expect(plan.verifierHref).toContain("/receipt-verifier?request=");
  });

  test("closes an old stop receipt when a repaired packet manifest is ready for fresh review", () => {
    const oldDraft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const oldPreview = buildQuickBuyerRoomPreview(oldDraft, 0);
    const oldVerdict = buildQuickGlobalPublishabilityBrief(oldDraft, oldPreview);
    const repairedVerdict = readyGlobalPublishabilityVerdict();
    const requestJson = externalReviewDecisionReceiptRequestJson(oldVerdict, {
      decision: "stop",
      status: "blocked",
      label: "External review stop",
      reviewerNote: "The public packet was stopped until proof links and freshness are repaired.",
      packetStatus: oldVerdict.reviewPacket.status,
      packetClearance: oldVerdict.reviewPacket.clearance,
      testsReady: oldVerdict.reviewPacket.readyCount,
      testsTotal: oldVerdict.reviewPacket.totalCount,
      confidence: oldVerdict.decisionMemo.confidenceScore,
      reviewOutcome: "Do not send this packet",
      nextAction: "Stop external sharing until the public proof packet is repaired."
    });
    const request = JSON.parse(requestJson);
    const plan = buildQuickExternalReviewResponseActionPlan(requestJson, repairedVerdict.reviewPacket);

    expect(oldVerdict.reviewPacket.manifest.receiptId).not.toBe(repairedVerdict.reviewPacket.manifest.receiptId);
    expect(plan).toMatchObject({
      state: "closed",
      status: "watch",
      label: "Repair loop closed",
      headline: "Platform release lead has a repaired packet ready for a new review",
      nextOwner: "Review coordinator",
      nextAction: "Open the new review desk and request a fresh reviewer response for the current manifest."
    });
    expect(plan.summary).toContain(oldVerdict.reviewPacket.manifest.receiptId);
    expect(plan.summary).toContain(repairedVerdict.reviewPacket.manifest.receiptId);
    expect(plan.acceptanceCriteria).toEqual(
      expect.arrayContaining([
        "Keep the old reviewer stop or revision receipt attached as repair-closure evidence.",
        `Verify current packet manifest ${repairedVerdict.reviewPacket.manifest.receiptId} before sending it to a reviewer.`,
        "Request a fresh external reviewer response for the current manifest; do not reuse the old stop or revision receipt as approval."
      ])
    );
    expect(plan.packetVerifierHref).toBe(repairedVerdict.reviewPacket.manifestVerifierHref);
    expect(plan.reviewDeskHref).toBe(repairedVerdict.reviewPacket.reviewDeskHref);
    expect(plan.exportMarkdown).toContain("## Current packet");
    expect(plan.exportMarkdown).toContain(`Review desk: ${repairedVerdict.reviewPacket.reviewDeskHref}`);
    expect(plan.ownerPacketMarkdown).toContain("Decision: Repair loop closed");
    expect(plan.ownerPacketMarkdown).toContain(`Current review desk: ${repairedVerdict.reviewPacket.reviewDeskHref}`);
    expect(JSON.parse(plan.ownerPacketReceiptJson)).toMatchObject({
      payload: {
        status: "watch",
        label: "Repair loop closed",
        manifestReceiptId: repairedVerdict.reviewPacket.manifest.receiptId,
        manifestChecksum: `fnv1a32:${repairedVerdict.reviewPacket.manifest.checksum}`,
        responseReceiptChecksum: `fnv1a32:${request.checksum}`
      }
    });
  });

  test("blocks an otherwise ready global publishability verdict when live proof freshness expires", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const liveProofAudit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: proofVerificationFor(quickProofLinksForVerification(preview.proofRepairPlan))
    });
    const verdict = buildQuickGlobalPublishabilityBrief(draft, preview, undefined, undefined, undefined, 0, {
      liveProofAudit,
      freshnessNowMs: Date.parse("2026-06-23T01:00:00.000Z")
    });
    const readiness = buildQuickExternalReviewReadiness(verdict);
    const html = renderToStaticMarkup(
      createElement(QuickExternalReviewReadinessPanel, {
        readiness,
        proofVerifyStatus: "idle",
        onVerifyProofLinks: () => undefined
      })
    );

    expect(verdict).toMatchObject({
      status: "blocked",
      score: 86,
      label: "Publication blocked",
      headline: "Proof freshness blocks global launch",
      primaryAction: "Run live proof verification before public sharing.",
      primaryHref: "#quick-live-proof-audit"
    });
    expect(verdict.freshness).toMatchObject({
      status: "blocked",
      label: "Freshness expired",
      remainingHours: 0
    });
    expect(readiness.repairPath).toMatchObject({
      status: "blocked",
      headline: "Proof freshness is the next launch hold",
      targetLabel: "Proof freshness",
      owner: "Proof owner",
      action: "Run live proof verification before public sharing.",
      href: "#quick-live-proof-audit",
      currentScore: 86,
      projectedScore: 86,
      scoreDelta: 0
    });
    expect(readiness.repairPath?.proofLinkId).toBeUndefined();
    expect(readiness.repairPath?.sampleValue).toBeUndefined();
    expect(readiness.exportMarkdown).toContain("## First repair path");
    expect(readiness.exportMarkdown).toContain("Target: Proof freshness");
    expect(readiness.exportMarkdown).toContain("Target link: #quick-live-proof-audit");
    expect(html).toContain("Proof freshness is the next launch hold");
    expect(html).toContain("Check live proof");
    expect(html).not.toContain("Repair URL");
    expect(verdict.certificate).toMatchObject({
      status: "blocked",
      clearance: "internal-only",
      label: "Internal only",
      headline: "Proof freshness holds external sharing"
    });
    expect(verdict.certificate.sharePolicy).toContain("Keep the launch room internal until Proof owner closes proof freshness.");
    expect(verdict.certificate.holdReason).toBe("Proof owner: Run live proof verification before public sharing.");
    expect(verdict.reviewerBrief).toMatchObject({
      status: "blocked",
      clearance: "internal-only",
      label: "Hold brief",
      headline: "Reviewer packet stays internal"
    });
    expect(verdict.reviewerBrief.messageText).toContain("Do not forward a broad external link yet.");
    expect(verdict.reviewerBrief.readOrder.find((item) => item.label === "Fresh proof window")).toMatchObject({
      status: "blocked"
    });
    expect(verdict.claimAudit).toMatchObject({
      status: "blocked",
      label: "Claim audit hold",
      headline: "Proof freshness makes the claim packet internal-only",
      traceScore: 91,
      readyCount: 8,
      totalCount: 9
    });
    expect(verdict.claimAudit.primaryRisk).toContain("Live proof freshness");
    expect(verdict.claimAudit.rows[0]).toMatchObject({
      id: "proof-freshness",
      status: "blocked",
      owner: "Proof owner",
      nextAction: "Run live proof verification before public sharing."
    });
    expect(verdict.valueRoute).toMatchObject({
      status: "blocked",
      label: "Value route hold",
      headline: "Fresh proof must close before the value route is sendable"
    });
    expect(verdict.valueRoute.steps.find((step) => step.id === "day-30")).toMatchObject({
      status: "blocked",
      owner: "Procurement owner"
    });
    expect(verdict.objectionDeck).toMatchObject({
      status: "blocked",
      label: "Objection hold",
      headline: "Fresh proof must close before objections can be forwarded",
      readyCount: 5,
      totalCount: 6,
      primaryQuestion: "Is the proof fresh enough to forward?"
    });
    expect(verdict.objectionDeck.rows[0]).toMatchObject({
      id: "proofFreshness",
      status: "blocked",
      owner: "Proof owner"
    });
    expect(verdict.reviewPacket).toMatchObject({
      status: "blocked",
      clearance: "internal-only",
      label: "Packet hold",
      headline: "Proof freshness keeps the packet internal",
      readyCount: 0,
      totalCount: 6
    });
    expect(verdict.reviewPacket.sendRule).toContain("Keep internal until Proof freshness is ready.");
    expect(verdict.reviewPacket.items.find((item) => item.id === "proof-freshness")).toMatchObject({
      status: "blocked",
      role: "Live proof window"
    });
    expect(verdict.reviewPacket.exportMarkdown).toContain("# External review packet");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Clearance: Internal only");
    expect(verdict.reviewPacket.exportMarkdown).toContain("## Manifest receipt");
    const blockedManifestVerifierUrl = new URL(verdict.reviewPacket.manifestVerifierHref, "https://example.com");
    expect(blockedManifestVerifierUrl.searchParams.get("request")).toBe(verdict.reviewPacket.manifestVerificationRequestJson);
    expect(blockedManifestVerifierUrl.searchParams.has("requestKey")).toBe(false);
    expect(verdict.reviewPacket.exportMarkdown).toContain("Review desk: /external-review-packet");
    expect(verdict.reviewPacket.exportMarkdown).toContain("## Artifact content checksums");
    expect(verdict.reviewPacket.manifest).toMatchObject({
      receiptVersion: "quick-external-review-packet.v1",
      status: "blocked",
      clearance: "internal-only",
      readyCount: 0,
      totalCount: 6,
      checksumAlgorithm: "fnv1a32",
      payloadChecksum: verdict.reviewPacket.manifest.checksum
    });
    expect(verdict.reviewPacket.manifest.receiptId).toMatch(/^quick-external-review-blocked-[0-9a-f]{8}$/);
    expect(verdict.reviewPacket.manifest.artifacts.find((item) => item.id === "proof-freshness")).toMatchObject({
      status: "blocked",
      evidence: expect.stringContaining("expired")
    });
    expect(JSON.parse(decodeURIComponent(verdict.reviewPacket.manifestHref.split(",")[1] ?? ""))).toMatchObject({
      status: "blocked",
      clearance: "internal-only",
      sendRule: "Keep internal until Proof freshness is ready."
    });
    expect(verdict.decisionMemo).toMatchObject({
      status: "blocked",
      decision: "hold-for-recheck",
      label: "Reviewer hold memo",
      reviewerOutcome: "Hold internal until recheck",
      readyCount: 1,
      totalCount: 6,
      nextAction: "Proof freshness: Live proof is inside the 24-hour review window."
    });
    expect(verdict.decisionMemo.tests.find((test) => test.id === "proof-freshness")).toMatchObject({
      status: "blocked",
      evidence: expect.stringContaining("expired")
    });
    expect(verdict.decisionMemo.exportMarkdown).toContain("Decision: Hold internal until recheck");
    expect(verdict.decisionMemo.exportMarkdown).toContain("Proof freshness");
    expect(verdict.gates.find((gate) => gate.id === "proof-freshness")).toMatchObject({
      status: "blocked",
      href: "#quick-live-proof-audit"
    });
    expect(verdict.exportMarkdown).toContain("Live proof was checked at 2026-06-21T00:00:00.000Z");
    expect(verdict.exportMarkdown).toContain("Window: 24 hours");
  });

  test("blocks the global publishability verdict when public submission assets are incomplete", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const verdict = buildQuickGlobalPublishabilityBrief(draft, preview);

    expect(verdict.status).toBe("blocked");
    expect(verdict.label).toBe("Publication blocked");
    expect(verdict.score).toBe(40);
    expect(verdict.primaryHref).toBe("#quick-proof-repair-plan-protopediaUrl");
    expect(verdict.freshness).toMatchObject({
      status: "blocked",
      label: "Live proof not run",
      href: "#quick-live-proof-audit"
    });
    expect(verdict.certificate).toMatchObject({
      status: "blocked",
      clearance: "internal-only",
      label: "Internal only"
    });
    expect(verdict.certificate.sharePolicy).toContain("Keep the launch room internal");
    expect(verdict.certificate.exportMarkdown).toContain("Clearance: Internal only");
    expect(verdict.reviewerBrief).toMatchObject({
      clearance: "internal-only",
      label: "Hold brief"
    });
    expect(verdict.reviewerBrief.exportMarkdown).toContain("Clearance: Internal only");
    expect(verdict.claimAudit).toMatchObject({
      status: "blocked",
      label: "Claim audit hold",
      totalCount: 9
    });
    expect(verdict.claimAudit.rows[0]).toMatchObject({
      id: "proof-freshness",
      status: "blocked"
    });
    expect(verdict.claimAudit.exportMarkdown).toContain("# Decision-grade claim audit");
    expect(verdict.valueRoute).toMatchObject({
      status: "blocked",
      label: "Value route hold"
    });
    expect(verdict.valueRoute.exportMarkdown).toContain("# Review-to-value route");
    expect(verdict.objectionDeck).toMatchObject({
      status: "blocked",
      label: "Objection hold"
    });
    expect(verdict.objectionDeck.rows[0]).toMatchObject({
      id: "proofFreshness",
      status: "blocked"
    });
    expect(verdict.objectionDeck.exportMarkdown).toContain("# Reviewer objection answers");
    expect(verdict.reviewPacket).toMatchObject({
      status: "blocked",
      clearance: "internal-only",
      label: "Packet hold"
    });
    expect(verdict.reviewPacket.sendRule).toContain("Keep internal");
    expect(verdict.reviewPacket.exportMarkdown).toContain("Clearance: Internal only");
    expect(verdict.decisionMemo).toMatchObject({
      status: "blocked",
      decision: "do-not-send",
      label: "Do-not-send memo",
      reviewerOutcome: "Do not send this packet",
      readyCount: 1,
      totalCount: 6
    });
    expect(verdict.decisionMemo.confidenceScore).toBeLessThan(75);
    expect(verdict.decisionMemo.nextAction).toBe("Proof freshness: Live proof is inside the 24-hour review window.");
    expect(verdict.decisionMemo.exportMarkdown).toContain("Decision: Do not send this packet");
    expect(verdict.repairImpact).toMatchObject({
      targetLabel: "ProtoPedia URL",
      targetHref: "#quick-proof-repair-plan-protopediaUrl",
      currentScore: 40,
      projectedScore: 40,
      scoreDelta: 0,
      projectedStatus: "blocked"
    });
    expect(verdict.repairImpact?.summary).toContain("launch score stays 40/100");
    expect(verdict.repairImpact?.nextAction).toContain("Attach a public walkthrough video");
    expect(verdict.repairImpact?.ownerCommand).toMatchObject({
      owner: "Publication owner",
      action: "Publish the ProtoPedia story page and attach its public URL."
    });
    expect(verdict.repairImpact?.ownerCommand.acceptanceCriteria).toContain("ProtoPedia story page is public and reachable without private access.");
    expect(verdict.repairImpact?.ownerCommand.verification).toContain("next open gate moves to");
    expect(verdict.repairImpact?.ownerCommand.exportText).toContain("Repair owner command: ProtoPedia URL");
    expect(verdict.repairImpact?.ownerCommand.exportHref).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(verdict.summary).toContain("Do not publish globally");
    expect(verdict.gates.find((gate) => gate.id === "buyer-decision")).toMatchObject({
      status: "blocked",
      href: "#quick-proof-repair-plan-protopediaUrl"
    });
    expect(verdict.gates.find((gate) => gate.id === "public-proof")).toMatchObject({
      status: "watch",
      href: "#quick-proof-repair-plan-protopediaUrl"
    });
    expect(verdict.gates.find((gate) => gate.id === "proof-freshness")).toMatchObject({
      status: "blocked",
      href: "#quick-live-proof-audit"
    });
    expect(verdict.gates.find((gate) => gate.id === "submission-assets")).toMatchObject({
      status: "blocked",
      owner: "Recording owner",
      href: "#quick-proof-repair-plan-videoUrl"
    });
    expect(verdict.gates.find((gate) => gate.id === "success-standard")).toMatchObject({
      status: "watch",
      owner: "Proof owner"
    });
    expect(verdict.exportMarkdown).toContain("Status: blocked");
    expect(verdict.exportMarkdown).toContain("## Proof freshness window");
    expect(verdict.exportMarkdown).toContain("## Repair impact");
    expect(verdict.exportMarkdown).toContain("## Owner repair command");
    expect(verdict.exportMarkdown).toContain("ProtoPedia story page is public and reachable without private access.");
    expect(verdict.exportMarkdown).toContain("Projected score: 40/100");
    expect(verdict.exportMarkdown).toContain("Walkthrough video");
    expect(verdict.exportMarkdown).toContain("Link: #quick-proof-repair-plan-protopediaUrl");
  });

  test("shows the score jump when the remaining publication repair will make the verdict publishable", () => {
    const draft = withQuickProofLinkRepair(
      buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE),
      "protopediaUrl",
      "https://protopedia.net/prototype/release-ready"
    );
    const preview = buildQuickBuyerRoomPreview(draft, 2);
    const verdict = buildQuickGlobalPublishabilityBrief(draft, preview);

    expect(verdict).toMatchObject({
      status: "blocked",
      score: 40,
      primaryHref: "#quick-proof-repair-plan-videoUrl"
    });
    expect(verdict.repairImpact).toMatchObject({
      targetLabel: "Walkthrough video",
      targetHref: "#quick-proof-repair-plan-videoUrl",
      currentScore: 40,
      projectedScore: 86,
      scoreDelta: 46,
      projectedStatus: "blocked"
    });
    expect(verdict.repairImpact?.summary).toContain("moves launch score to 86/100");
    expect(verdict.repairImpact?.ownerCommand).toMatchObject({
      owner: "Recording owner",
      action: "Attach a public walkthrough video showing the buyer workflow from input to proof packet."
    });
    expect(verdict.repairImpact?.ownerCommand.acceptanceCriteria).toContain("Walkthrough shows intake, buyer proof room, one-pager, and proof packet in one pass.");
    expect(verdict.repairImpact?.ownerCommand.verification).toContain("score moves from 40/100 to 86/100");
    expect(verdict.repairImpact?.nextAction).toBe("Run live proof verification before public sharing.");
    expect(verdict.exportMarkdown).toContain("Score delta: +46");
    expect(verdict.exportMarkdown).toContain("Walkthrough shows intake, buyer proof room, one-pager, and proof packet in one pass.");
  });

  test("turns an applied quick workflow into a sendable launch packet", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const packet = buildQuickAppliedLaunchPacket(preview, {
      launchRoomHref: "https://service.example/launch-room?workspace=share",
      reviewKitHref: "https://service.example/buyer-review-kit?brief=share",
      acceptancePathHref: "https://service.example/buyer-acceptance-path?brief=share",
      decisionReceiptHref: "https://service.example/buyer-decision-receipt?decision=continue",
      trustManifestHref: "https://service.example/buyer-trust-manifest?brief=share",
      deliveryMemoHref: "https://service.example/buyer-delivery-memo?brief=share"
    });

    expect(packet.status).toBe("ready");
    expect(packet.label).toBe("Send-ready packet");
    expect(packet.headline).toBe("Applied workspace can be sent as a buyer room");
    expect(packet.links.map((link) => link.id)).toEqual(["launch-room", "review-kit", "acceptance-path", "decision-receipt", "trust-manifest", "delivery-memo"]);
    expect(packet.sendDesk).toMatchObject({
      headline: "Buyer send desk is ready",
      metrics: [
        { id: "decision", status: "ready", value: "Send after live verification" },
        { id: "proof", status: "ready" },
        { id: "pilot", status: "ready" }
      ],
      routes: [
        { id: "buyer", owner: "Platform release lead", status: "ready", href: "https://service.example/launch-room?workspace=share" },
        { id: "reviewer", status: "ready", href: "https://service.example/buyer-review-kit?brief=share" },
        { id: "proof-owner", owner: "Proof owner", status: "ready", href: "https://service.example/buyer-trust-manifest?brief=share" },
        { id: "operator", status: "ready", href: "https://service.example/buyer-delivery-memo?brief=share" }
      ],
      checks: [
        { id: "buyer-ask", status: "ready" },
        { id: "measured-value", status: "ready" },
        { id: "public-proof", status: "ready" },
        { id: "decision-record", status: "ready" }
      ]
    });
    expect(packet.subject).toBe("Buyer pilot room for Platform release lead: Send-ready packet");
    expect(packet.messageText).toContain("Launch room: https://service.example/launch-room?workspace=share");
    expect(packet.messageText).toContain("Buyer decision case: Send after live verification");
    expect(packet.messageText).toContain("Buyer question: Should Platform release lead pilot this workflow now?");
    expect(packet.messageText).toContain("Decision answer: Evidence shows 1120 minutes saved per run");
    expect(packet.messageText).toContain("The launch packet also includes review kit, acceptance path, receipt, trust manifest, and delivery memo links.");
    expect(packet.messageText).toContain("Proof status: 5/5 public proof links / A2A trial 94/100");
    expect(packet.messageText).toContain("Send desk:");
    expect(packet.messageText).toContain("- Buyer sponsor / Platform release lead: Open launch room and answer continue, revise, or stop.");
    expect(packet.messageText).toContain("Acceptance checks:");
    expect(packet.previewText).toContain("Launch room: use the Launch room link in this packet.");
    expect(packet.previewText).toContain("Decision case: Send after live verification. Should Platform release lead pilot this workflow now?");
    expect(packet.previewText).toContain("Review kit, acceptance path, receipt, trust manifest, and delivery memo links are included above.");
    expect(packet.previewText).toContain("Send desk: Buyer send desk is ready. 4 routes and 4 checks are staged.");
    expect(packet.previewText).not.toContain("https://service.example/launch-room?workspace=share");
    expect(packet.exportMarkdown).toContain("# Buyer pilot room for Platform release lead: Send-ready packet");
    expect(packet.exportMarkdown).toContain("## Buyer message");
    expect(packet.exportMarkdown).toContain("## Buyer decision case");
    expect(packet.exportMarkdown).toContain("Decision: Send after live verification");
    expect(packet.exportMarkdown).toContain("Question: Should Platform release lead pilot this workflow now?");
    expect(packet.exportMarkdown).toContain("Value evidence: 8 people / 5 cycles/month / 28h manual/cycle / 75% adoption / 1120 minutes saved/run / 5/5 accepted tasks / 4 reviewers");
    expect(packet.exportMarkdown).toContain("## Send desk");
    expect(packet.exportMarkdown).toContain("### Stakeholder routes");
    expect(packet.exportMarkdown).toContain("- [ready] Public proof can be opened: Recheck public proof immediately before sending.");
    expect(packet.exportMarkdown).toContain("Review kit: https://service.example/buyer-review-kit?brief=share");
    expect(packet.exportMarkdown).toContain("Acceptance path: https://service.example/buyer-acceptance-path?brief=share");
    expect(packet.exportMarkdown).toContain(`Receipt: ${preview.pilotWeekTaskPacket.receipt.receiptId}`);
    expect(packet.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
  });

  test("keeps an applied quick workflow in proof-repair mode when public proof is missing", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 6);
    const packet = buildQuickAppliedLaunchPacket(preview, {
      launchRoomHref: "https://service.example/launch-room?workspace=share",
      reviewKitHref: "https://service.example/buyer-review-kit?brief=share",
      acceptancePathHref: "https://service.example/buyer-acceptance-path?brief=share",
      decisionReceiptHref: "https://service.example/buyer-decision-receipt?decision=continue",
      trustManifestHref: "https://service.example/buyer-trust-manifest?brief=share",
      deliveryMemoHref: "https://service.example/buyer-delivery-memo?brief=share"
    });

    expect(packet.status).toBe("watch");
    expect(packet.label).toBe("Sponsor-review packet");
    expect(packet.headline).toBe("Applied workspace needs sponsor review first");
    expect(packet.summary).toBe("Workspace applied. Repair public proof before broad buyer sharing. Next: Add ProtoPedia URL and Walkthrough video.");
    expect(packet.sendDesk.metrics.find((metric) => metric.id === "proof")).toMatchObject({
      status: "watch",
      value: "3/5 public proof links / A2A trial 94/100",
      detail: "Publish the ProtoPedia story page and attach its public URL."
    });
    expect(packet.sendDesk.metrics.find((metric) => metric.id === "decision")).toMatchObject({
      status: "watch",
      value: "Repair before buyer sharing"
    });
    expect(packet.messageText).toContain("Buyer decision case: Repair before buyer sharing");
    expect(packet.messageText).toContain("Decision answer: Not yet. Proof owner: Attach ProtoPedia URL and Walkthrough video");
    expect(packet.exportMarkdown).toContain("Workspace applied. Repair public proof before broad buyer sharing.");
    expect(packet.exportMarkdown).toContain("Decision: Repair before buyer sharing");
    expect(packet.exportMarkdown).toContain("- [watch] Public proof can be opened: Publish the ProtoPedia story page and attach its public URL.");
  });

  test("turns missing external proof into a concrete repair plan", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 6);
    const repairByLabel = Object.fromEntries(preview.proofRepairPlan.items.map((item) => [item.label, item]));

    expect(preview.status).toBe("watch");
    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 3,
      missingCount: 2,
      invalidCount: 0,
      repairCount: 2,
      headline: "Add ProtoPedia URL and Walkthrough video"
    });
    expect(preview.evidencePack).toMatchObject({
      status: "watch",
      label: "Sponsor repair evidence pack",
      headline: "Hold buyer send until Public proof repair closes",
      firstAction: {
        label: "Fix Public proof repair",
        href: "#quick-proof-repair-plan-protopediaUrl"
      }
    });
    expect(preview.evidencePack.sendRule).toContain("Do not send externally until Public proof repair is ready");
    expect(preview.evidencePack.artifacts.find((artifact) => artifact.id === "proof-repair")).toMatchObject({
      status: "watch",
      role: "Publication owner",
      proof: "3/5 public proof URLs ready / 2 need repair",
      requiredForSend: true
    });
    expect(preview.evidencePack.exportMarkdown).toContain("Status: watch");
    expect(preview.evidencePack.exportMarkdown).toContain("Fix Public proof repair");
    const repairShareUrl = new URL(preview.evidencePack.shareHref, "https://example.com");
    const repairPayloadText = decodeQuickBuyerEvidencePackShareParam(repairShareUrl.searchParams.get(QUICK_BUYER_EVIDENCE_PACK_SHARE_PARAM));
    const repairPayload = parseQuickBuyerEvidencePackSharePayload(repairPayloadText);
    expect(repairPayload).toMatchObject({
      status: "watch",
      firstAction: {
        label: "Fix Public proof repair",
        href: "#quick-proof-repair-plan-protopediaUrl"
      }
    });
    expect(repairPayload?.sendRule).toContain("Do not send externally until Public proof repair is ready");
    if (!repairPayload) throw new Error("Expected repair evidence pack share payload");
    const repairDecisionCockpit = buildQuickBuyerEvidenceDecisionCockpit(repairPayload);
    expect(repairDecisionCockpit).toMatchObject({
      status: "watch",
      recommendedDecision: "revise",
      headline: "Repair the open proof before buyer send",
      confidence: 29,
      requiredReady: 1,
      requiredTotal: 6,
      primaryAnswer: "Not yet. Fix Public proof repair first.",
      nextAction: "Fix Public proof repair"
    });
    expect(repairDecisionCockpit.metrics.find((metric) => metric.id === "required-artifacts")).toMatchObject({
      status: "watch",
      value: "1/6 ready"
    });
    expect(repairDecisionCockpit.metrics.find((metric) => metric.id === "first-action")).toMatchObject({
      status: "watch",
      value: "Fix Public proof repair",
      href: "#quick-proof-repair-plan-protopediaUrl"
    });
    const repairDecisionReceipt = buildQuickBuyerEvidenceDecisionReceipt({
      payload: repairPayload,
      reviewerName: "Platform sponsor",
      reviewerNote: "Repair the public proof before buyer send.",
      generatedAt: "2026-06-25T06:05:00.000Z"
    });
    expect(repairDecisionReceipt).toMatchObject({
      decision: "revise",
      recommendedDecision: "revise",
      label: "Request repairs",
      verification: {
        status: "verified"
      },
      payload: {
        decision: "revise",
        status: "watch",
        packetClearance: "internal-only",
        testsReady: 1,
        testsTotal: 6,
        nextAction: "Fix Public proof repair"
      }
    });
    expect(repairDecisionReceipt.verifierHref).toContain("/receipt-verifier?request=");
    expect(repairDecisionReceipt.owner).toBe("Proof owner");
    expect(repairDecisionReceipt.ownerRunbook.map((item) => item.id)).toEqual(["record-repair-request", "repair-required-evidence", "regenerate-evidence-pack"]);
    expect(repairDecisionReceipt.ownerPacketMarkdown).toContain("Owner: Proof owner");
    expect(repairDecisionReceipt.ownerPacketMarkdown).toContain("Fix Public proof repair");
    expect(repairByLabel["ProtoPedia URL"]).toMatchObject({
      status: "blocked",
      owner: "Publication owner",
      action: "Publish the ProtoPedia story page and attach its public URL.",
      value: "Missing public URL",
      href: "#launch-evidence-console"
    });
    expect(repairByLabel["Walkthrough video"]).toMatchObject({
      status: "blocked",
      owner: "Recording owner",
      action: "Attach a public walkthrough video showing the buyer workflow from input to proof packet.",
      value: "Missing public URL"
    });
    expect(preview.handoffBrief.nextAction).toMatchObject({
      label: "Public proof",
      owner: "Proof owner",
      action: "Attach ProtoPedia URL and Walkthrough video and rerun live proof verification.",
      status: "watch"
    });
    expect(preview.decisionCase).toMatchObject({
      status: "watch",
      decision: "repair",
      decisionLabel: "Repair before buyer sharing",
      headline: "Decision case needs Public proof",
      owner: "Proof owner"
    });
    expect(preview.decisionCase.answer).toContain("Not yet. Proof owner: Attach ProtoPedia URL and Walkthrough video");
    expect(preview.decisionCase.proofEvidence).toContain("3/5 public proof links ready");
    expect(preview.impactSnapshot).toMatchObject({
      status: "watch",
      headline: "Impact snapshot needs proof closure",
      nextAction: "Proof owner: Attach ProtoPedia URL and Walkthrough video and rerun live proof verification."
    });
    expect(preview.impactSnapshot.metrics.find((metric) => metric.id === "proof-risk")).toMatchObject({
      status: "watch",
      value: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(preview.impactSnapshot.metrics.find((metric) => metric.id === "decision-gate")).toMatchObject({
      status: "watch",
      value: "Repair before buyer sharing"
    });
    expect(preview.impactSnapshot.exportMarkdown).toContain("## Metrics");
    expect(preview.valueMap).toMatchObject({
      status: "watch",
      headline: "Buyer value map needs proof closure",
      nextAction: "Proof owner: Attach ProtoPedia URL and Walkthrough video and rerun live proof verification."
    });
    expect(preview.valueMap.items.find((item) => item.id === "buyer-proof")).toMatchObject({
      status: "watch",
      owner: "Proof owner",
      value: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(preview.valueMap.items.find((item) => item.id === "decision")).toMatchObject({
      status: "watch",
      value: "Repair before buyer sharing"
    });
    expect(preview.validationScript).toMatchObject({
      status: "watch",
      headline: "Buyer validation script needs proof closure",
      nextAction: "Proof owner: Attach ProtoPedia URL and Walkthrough video and rerun live proof verification."
    });
    expect(preview.validationScript.questions.find((question) => question.id === "trust")).toMatchObject({
      status: "watch",
      owner: "Proof owner",
      listenFor: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(preview.validationScript.questions.find((question) => question.id === "commitment")).toMatchObject({
      status: "watch",
      owner: "Proof owner"
    });
    expect(preview.validationScript.exportMarkdown).toContain("## Questions");
    expect(preview.validationRubric).toMatchObject({
      status: "watch",
      decision: "needs-review",
      headline: "Validation rubric needs owner review",
      passCount: 3,
      totalCount: 5,
      nextAction: "Proof owner: Attach ProtoPedia URL and Walkthrough video and rerun live proof verification."
    });
    expect(preview.validationRubric.criteria.find((criterion) => criterion.id === "trust")).toMatchObject({
      status: "watch",
      failSignal: "Proof requires internal access, is stale, or does not show the workflow result."
    });
    expect(preview.validationRubric.criteria.find((criterion) => criterion.id === "commitment")).toMatchObject({
      status: "watch",
      owner: "Proof owner"
    });
    expect(preview.validationRubric.exportMarkdown).toContain("## Criteria");
    expect(preview.validationAnswerSheet).toMatchObject({
      status: "watch",
      headline: "Buyer answer sheet needs proof closure",
      readyCount: 3,
      totalCount: 5,
      nextAction: "Close public proof gaps before the answer can be used externally."
    });
    expect(preview.validationAnswerSheet.items.find((item) => item.id === "trust")).toMatchObject({
      status: "watch",
      owner: "Proof owner",
      ownerAction: "Close public proof gaps before the answer can be used externally."
    });
    expect(preview.validationAnswerSheet.items.find((item) => item.id === "commitment")).toMatchObject({
      status: "watch",
      owner: "Proof owner",
      ownerAction: "Name the approver and stop rule before pilot approval."
    });
    expect(preview.validationAnswerSheet.exportMarkdown).toContain("Do not use unanswered or ungrounded buyer validation as approval evidence.");
    const validationAnswerRecord = buildQuickBuyerValidationAnswerRecord(
      preview,
      [
        "Baseline owner confirmed current manual release-proof pain.",
        "The platform team repeats this weekly every release cycle.",
        "Finance owner accepts the value metric and ¥840,000 threshold.",
        "Sponsor approver accepts a bounded pilot with stop rule and decision date Day 5."
      ].join(" ")
    );
    expect(validationAnswerRecord).toMatchObject({
      status: "blocked",
      headline: "Buyer validation answers are incomplete",
      answeredCount: 3,
      totalCount: 5,
      recommendedBuyerDecision: "revise",
      nextOwner: "Proof owner",
      nextAction: "Close public proof gaps before the answer can be used externally."
    });
    expect(validationAnswerRecord.items.find((item) => item.id === "trust")).toMatchObject({
      status: "blocked",
      sourceStatus: "watch",
      matchedSignals: [],
      missingSignals: ["proof opened", "receipt or verifier stated", "trust condition stated"]
    });
    expect(validationAnswerRecord.receipt).toMatchObject({
      verificationApiPath: QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
      verification: {
        status: "verified"
      },
      payload: {
        receiptVersion: "quick-buyer-validation-answer-record.v1",
        status: "blocked",
        answeredCount: 3,
        totalCount: 5,
        recommendedBuyerDecision: "revise"
      }
    });
    expect(validationAnswerRecord.verifierHref).toContain("/receipt-verifier?request=");
    expect(validationAnswerRecord.exportMarkdown).toContain("missing proof opened, receipt or verifier stated, trust condition stated");
    const validationDecisionHandoff = buildQuickBuyerValidationDecisionHandoff({
      record: validationAnswerRecord,
      proofRepairPlan: preview.proofRepairPlan,
      reviewKitHref: "/buyer-review-kit",
      acceptancePathHref: "/buyer-acceptance-path"
    });
    expect(validationDecisionHandoff).toMatchObject({
      status: "blocked",
      headline: "Validation becomes an owner repair packet",
      steps: [
        expect.objectContaining({ id: "decision", status: "blocked", owner: "Proof owner" }),
        expect.objectContaining({
          id: "owner-repair",
          status: "blocked",
          owner: "Publication owner",
          action: "Repair ProtoPedia URL and Walkthrough video before buyer approval."
        }),
        expect.objectContaining({ id: "verify", status: "ready", owner: "Reviewer" })
      ]
    });
    expect(validationDecisionHandoff.copyText).toContain("Recommended decision: revise");
    expect(validationDecisionHandoff.copyText).toContain("Repair ProtoPedia URL and Walkthrough video");
    expect(preview.sendMemo).toMatchObject({
      status: "watch",
      headline: "Send memo is drafted, but held",
      subject: "Review buyer pilot packet: Platform release lead",
      nextAction: "Proof owner: Attach ProtoPedia URL and Walkthrough video and rerun live proof verification."
    });
    expect(preview.sendMemo.items.find((item) => item.id === "proof")).toMatchObject({
      status: "watch",
      value: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(preview.sendMemo.bodyText).toContain("Decision: Repair before buyer sharing");
    expect(preview.sendMemo.bodyText).toContain("Next action: Proof owner: Attach ProtoPedia URL and Walkthrough video");
    expect(preview.pilotProofContract).toMatchObject({
      status: "watch",
      headline: "Pilot proof contract needs owner review",
      nextOwner: "Proof owner",
      nextAction: "Attach ProtoPedia URL and Walkthrough video and rerun live proof verification."
    });
    expect(preview.pilotProofContract.items.find((item) => item.id === "proof-gate")).toMatchObject({
      status: "watch",
      owner: "Proof owner",
      value: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(preview.exportMarkdown).toContain("Next owner: Proof owner");
    expect(preview.exportMarkdown).toContain("## Buyer value map");
    expect(preview.exportMarkdown).toContain("## Buyer validation script");
    expect(preview.exportMarkdown).toContain("## Buyer validation rubric");
    expect(preview.exportMarkdown).toContain("## Buyer validation answer sheet");
    expect(preview.exportMarkdown).toContain("## Pilot proof contract");
    expect(preview.objectionBrief).toMatchObject({
      readyCount: 3,
      unresolvedCount: 2,
      headline: "2 buyer questions need evidence"
    });
    expect(preview.objectionBrief.items.find((item) => item.id === "publicProof")).toMatchObject({
      status: "watch",
      answer: "Attach ProtoPedia URL and Walkthrough video before buyer sharing.",
      evidence: "3/5 public proof links ready"
    });
    expect(preview.objectionBrief.items.find((item) => item.id === "adoptionPath")).toMatchObject({
      status: "watch",
      owner: "Proof owner"
    });
    expect(preview.rolloutCommandBoard).toMatchObject({
      status: "watch",
      headline: "Rollout command board needs owner review",
      readyCount: 3,
      blockedCount: 0,
      nextOwner: "Publication owner"
    });
    expect(preview.rolloutCommandBoard.nextCommand).toContain("Attach ProtoPedia URL and Walkthrough video");
    expect(preview.rolloutCommandBoard.commands.find((command) => command.id === "proof-recheck")).toMatchObject({
      status: "watch",
      window: "Day 3",
      owner: "Publication owner"
    });
    expect(preview.rolloutCommandBoard.ownerLoads.find((load) => load.owner === "Publication owner")).toMatchObject({
      commandCount: 1,
      blockedCount: 0
    });
    expect(preview.rolloutCommandBoard.taskCsvText).toContain('"Day 3","Proof recheck","watch","Publication owner"');
    expect(preview.rolloutCommandBoard.ownerBriefText).toContain("Next owner: Publication owner");
    expect(preview.rolloutCommandBoard.ownerBriefText).toContain("Attach ProtoPedia URL and Walkthrough video");
    expect(preview.rolloutCommandBoard.receipt.receiptId).toMatch(/^quick-rollout-watch-[0-9a-f]{8}$/);
    expect(preview.exportMarkdown).toContain("## Proof repair plan");
    expect(preview.exportMarkdown).toContain("## Buyer decision case");
    expect(preview.exportMarkdown).toContain("Subject: Review buyer pilot packet: Platform release lead");
    expect(preview.exportMarkdown).toContain("## Buyer objection brief");
    expect(preview.exportMarkdown).toContain("## Rollout command board");
    expect(preview.exportMarkdown).toContain("Next owner: Publication owner");
    expect(preview.exportMarkdown).toContain("- [blocked] ProtoPedia URL (Publication owner)");
    expect(preview.exportMarkdown).toContain("- [watch] Public proof (Proof owner): Can the reviewer open the proof?");
    expect(decodeURIComponent(preview.proofRepairPlan.repairHref.split(",")[1] ?? "")).toContain("[blocked] Walkthrough video - Recording owner");
    expect(preview.proofRepairPlan.impact).toMatchObject({
      status: "watch",
      headline: "2 proof repair items still hold buyer send",
      readinessScore: 60,
      readyCount: 3,
      repairCount: 2,
      firstOpenLabel: "ProtoPedia URL",
      firstOpenOwner: "Publication owner"
    });
    expect(preview.proofRepairPlan.impact.items.map((item) => item.id)).toEqual(["proof-slots", "live-verification", "buyer-send", "global-review"]);
    expect(preview.proofRepairPlan.impact.items.find((item) => item.id === "live-verification")).toMatchObject({
      status: "blocked",
      nextAction: "Attach or replace ProtoPedia URL, then rerun live proof verification."
    });
    expect(preview.proofRepairPlan.impact.exportMarkdown).toContain("# Proof repair impact preview");
    expect(preview.proofRepairPlan.impact.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(decodeURIComponent(preview.proofRepairPlan.repairHref.split(",")[1] ?? "")).toContain("Impact preview");
    expect(decodeURIComponent(preview.objectionBrief.defenseHref.split(",")[1] ?? "")).toContain("Attach ProtoPedia URL and Walkthrough video before buyer sharing.");
  });

  test("lets proof-link repairs turn the quick buyer room from watch to send-ready", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);

    expect(preview.status).toBe("ready");
    expect(preview.rows.find((row) => row.id === "proof")).toMatchObject({
      status: "ready",
      value: "5/5 public proof URLs ready"
    });
    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 5,
      missingCount: 0,
      invalidCount: 0,
      repairCount: 0,
      headline: "Public proof packet is complete"
    });
    expect(preview.proofRepairPlan.impact).toMatchObject({
      status: "ready",
      headline: "Proof repair unlocks buyer-send preparation",
      readinessScore: 100,
      readyCount: 5,
      repairCount: 0,
      firstOpenLabel: "none",
      nextVerifierAction: "Run live proof verification and attach the timestamped audit receipt before buyer send."
    });
    expect(preview.proofRepairPlan.impact.items.find((item) => item.id === "buyer-send")).toMatchObject({
      status: "ready",
      evidence: "Buyer evidence pack can be regenerated with complete proof links."
    });
    expect(preview.proofRepairPlan.impact.items.find((item) => item.id === "global-review")).toMatchObject({
      status: "watch",
      nextAction: "Run live proof, then refresh the launch certificate."
    });
    expect(preview.handoffBrief).toMatchObject({
      decision: "send-ready",
      nextAction: {
        label: "Final live verification",
        status: "ready"
      }
    });
    expect(preview.objectionBrief).toMatchObject({
      readyCount: 5,
      unresolvedCount: 0,
      headline: "Buyer objections are answered"
    });
    expect(preview.economicsStressTest).toMatchObject({
      status: "ready",
      headline: "Pilot economics survive the downside case",
      riskAdjustedMonthlyValueYen: 328000,
      monthlyValueRange: "¥328,000 - ¥1,235,000/month"
    });
    expect(preview.economicsStressTest.scenarios.map((scenario) => scenario.id)).toEqual(["downside", "base", "upside"]);
    expect(preview.economicsStressTest.scenarios[0]).toMatchObject({
      id: "downside",
      label: "Downside",
      status: "ready",
      monthlyHoursSaved: 26.6,
      monthlyValueYen: 328000
    });
    expect(preview.approvalRoute).toMatchObject({
      status: "ready",
      headline: "Stakeholder approval route is board-ready",
      readyCount: 4,
      blockedCount: 0
    });
    expect(preview.approvalRoute.steps.find((step) => step.id === "finance")).toMatchObject({
      status: "ready",
      evidence: "Risk-adjusted floor ¥328,000/month; range ¥328,000 - ¥1,235,000/month."
    });
    expect(preview.approvalRoute.steps.find((step) => step.id === "procurement")).toMatchObject({
      status: "ready",
      nextAction: "Route the decision case with proof links, stop rule, and live verification receipt."
    });
    expect(preview.pilotContractTerms).toMatchObject({
      status: "ready",
      headline: "Pilot contract terms are ready to send",
      budgetCapYen: 115000,
      clearCount: 6,
      blockedCount: 0
    });
    expect(preview.pilotContractTerms.terms.find((term) => term.id === "commercial-cap")).toMatchObject({
      status: "ready",
      clause: "Pilot spend is capped at ¥115,000 until the reviewer accepts the measured outcome."
    });
    expect(preview.procurementMatrix).toMatchObject({
      status: "ready",
      headline: "A2A pilot is the procurement default",
      recommendedAlternativeId: "a2a-pilot"
    });
    expect(preview.procurementMatrix.summary).toContain("¥328,000/month floor");
    expect(preview.procurementMatrix.alternatives.find((alternative) => alternative.id === "internal-build")).toMatchObject({
      status: "watch",
      setupCostYen: 600000,
      monthlyValueYen: 236000,
      paybackDays: 77
    });
    expect(preview.adoptionSuccessPlan).toMatchObject({
      status: "ready",
      headline: "30-day adoption plan is expansion-ready",
      adoptionTargetPercent: 75,
      retainedMonthlyValueYen: 246000,
      readyCount: 5,
      blockedCount: 0
    });
    expect(preview.adoptionSuccessPlan.checkpoints.find((checkpoint) => checkpoint.id === "day-30")).toMatchObject({
      status: "ready",
      owner: "Procurement owner",
      exitCriteria: "Expansion is approved only if value, proof, trust boundary, and owners remain current."
    });
    expect(preview.exportMarkdown).toContain("https://protopedia.net/prototype/release-ready");
    expect(preview.exportMarkdown).toContain("https://youtu.be/releaseReady12345");
    expect(preview.exportMarkdown).toContain("## Pilot economics stress test");
    expect(preview.exportMarkdown).toContain("Risk-adjusted floor: ¥328,000/month");
    expect(preview.exportMarkdown).toContain("## Stakeholder approval route");
    expect(preview.exportMarkdown).toContain("## Pilot contract terms");
    expect(preview.exportMarkdown).toContain("## Procurement alternative matrix");
    expect(preview.exportMarkdown).toContain("## 30-day adoption success plan");
    expect(preview.exportMarkdown).toContain("[ready] Procurement");
    expect(preview.pilotWeekTaskPacket.receipt.receiptId).toMatch(/^quick-pilot-week-ready-[0-9a-f]{8}$/);
  });

  test("builds a live verification request from repaired quick proof URLs", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);

    expect(links).toEqual([
      { id: "targetUrl", label: "Deployed URL", value: SUBMISSION_PROOF.deployedUrl },
      { id: "protopediaUrl", label: "ProtoPedia URL", value: "https://protopedia.net/prototype/release-ready" },
      { id: "videoUrl", label: "Walkthrough video", value: "https://youtu.be/releaseReady12345" },
      { id: "pilotEvidenceUrl", label: "Pilot receipt", value: `${SUBMISSION_PROOF.deployedUrl}${SAMPLE_PILOT_RECEIPT_PATH}` },
      { id: "workOrderEvidenceUrl", label: "Work order proof", value: `${SUBMISSION_PROOF.deployedUrl}${SAMPLE_WORK_ORDER_PATH}` }
    ]);
  });

  test("keeps missing quick proof links visible before live verification runs", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const audit = buildQuickLiveProofAudit({ proofRepairPlan: preview.proofRepairPlan });

    expect(links.find((link) => link.id === "protopediaUrl")).toMatchObject({ value: "" });
    expect(links.find((link) => link.id === "videoUrl")).toMatchObject({ value: "" });
    expect(audit.status).toBe("not-run");
    expect(audit.headline).toBe("Live proof audit has not run");
    expect(audit.receiptId).toMatch(/^workflow-live-proof-not-run-[0-9a-f]{8}$/);
    expect(audit.checksumAlgorithm).toBe("fnv1a32");
    expect(audit.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(audit.rows.find((row) => row.id === "protopediaUrl")).toMatchObject({
      status: "missing",
      url: "",
      action: "Attach a public URL for ProtoPedia URL."
    });
    expect(audit.summary).toContain("Run live verification");
    expect(audit.exportMarkdown).toContain("- [missing] ProtoPedia URL: missing");
  });

  test("blocks the proof verification handoff while quick proof slots are unrepaired", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const preview = buildQuickBuyerRoomPreview(draft, 0);
    const audit = buildQuickLiveProofAudit({ proofRepairPlan: preview.proofRepairPlan });
    const handoff = buildQuickProofVerificationHandoff({ proofRepairPlan: preview.proofRepairPlan, liveProofAudit: audit });

    expect(handoff.status).toBe("blocked");
    expect(handoff.headline).toBe("Buyer-send proof handoff is blocked");
    expect(handoff.buyerSendDecision).toBe("Buyer-send held until public proof slots are repaired");
    expect(handoff.readyCount).toBe(0);
    expect(handoff.firstOpenLabel).toBe("ProtoPedia URL");
    expect(handoff.items.find((item) => item.id === "protopediaUrl")).toMatchObject({
      status: "blocked",
      verificationStatus: "missing",
      url: "",
      nextAction: "Publish the ProtoPedia story page and attach its public URL."
    });
    expect(handoff.exportMarkdown).toContain("Buyer-send decision: Buyer-send held until public proof slots are repaired");
  });

  test("keeps repaired quick proof in handoff review until the live receipt exists", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const audit = buildQuickLiveProofAudit({ proofRepairPlan: preview.proofRepairPlan });
    const handoff = buildQuickProofVerificationHandoff({ proofRepairPlan: preview.proofRepairPlan, liveProofAudit: audit });

    expect(handoff.status).toBe("watch");
    expect(handoff.headline).toBe("Buyer-send proof handoff needs live receipt");
    expect(handoff.buyerSendDecision).toBe("Buyer-send held until live proof receipt exists");
    expect(handoff.readyCount).toBe(0);
    expect(handoff.items.every((item) => item.status === "watch")).toBe(true);
    expect(handoff.items.find((item) => item.id === "videoUrl")).toMatchObject({
      label: "Walkthrough video",
      verificationStatus: "watch",
      evidence: "Public URL is attached but no live verifier receipt has been issued.",
      nextAction: "Run live proof verification before buyer-send."
    });
    expect(handoff.exportHref).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(handoff.exportMarkdown).toContain("Verified: 0/5");
  });

  test("renders quick live proof audit failures as buyer-facing repair actions", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const requestLinks = quickProofLinksForVerification(preview.proofRepairPlan);
    const results = requestLinks.map((link) => {
      const status: BuyerShareGateCheckStatus = link.id === "videoUrl" ? "block" : "pass";
      return {
        id: link.id,
        label: link.label,
        status,
        httpStatus: status === "pass" ? 200 : 404,
        evidence: status === "pass" ? "HTTP 200 live verification" : "HTTP 404 unreachable",
        action: status === "pass" ? "Keep this verified proof URL attached." : `Open a reachable public proof URL for ${link.label}.`
      };
    });
    const verification: BuyerShareGateProofVerificationSummary = {
      checkedAt: "2026-06-22T00:00:00.000Z",
      verifiedCount: 4,
      totalCount: 5,
      score: 84,
      results
    };
    const audit = buildQuickLiveProofAudit({ proofRepairPlan: preview.proofRepairPlan, proofVerification: verification });

    expect(audit.status).toBe("action-required");
    expect(audit.headline).toBe("Live proof audit needs repair");
    expect(audit.receiptId).toMatch(/^workflow-live-proof-action-required-[0-9a-f]{8}$/);
    expect(audit.exportMarkdown).toContain(`Receipt: ${audit.receiptId}`);
    expect(audit.exportMarkdown).toContain(`Checksum: fnv1a32:${audit.checksum}`);
    expect(audit.summary).toContain("4/5 proof links responded live. 1 link still needs repair.");
    expect(audit.rows.find((row) => row.id === "videoUrl")).toMatchObject({
      label: "Walkthrough video",
      status: "block",
      evidence: "HTTP 404 unreachable",
      action: "Open a reachable public proof URL for Walkthrough video."
    });
    expect(audit.nextAction).toBe("Open a reachable public proof URL for Walkthrough video.");
    expect(audit.copyText).toContain("[block] Walkthrough video");
  });

  test("keeps failed live proof rows in the handoff gate", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const audit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: proofVerificationFor(links, { videoUrl: "block" })
    });
    const handoff = buildQuickProofVerificationHandoff({ proofRepairPlan: preview.proofRepairPlan, liveProofAudit: audit });

    expect(handoff.status).toBe("blocked");
    expect(handoff.buyerSendDecision).toBe("Buyer-send held until live proof repair is closed");
    expect(handoff.readyCount).toBe(4);
    expect(handoff.firstOpenLabel).toBe("Walkthrough video");
    expect(handoff.items.find((item) => item.id === "videoUrl")).toMatchObject({
      status: "blocked",
      verificationStatus: "block",
      evidence: "HTTP 404 unreachable",
      nextAction: "Open a reachable public proof URL for Walkthrough video."
    });
    expect(handoff.exportMarkdown).toContain("- [blocked] Walkthrough video");
  });

  test("issues a verified live proof audit receipt for a repaired quick packet", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const requestLinks = quickProofLinksForVerification(preview.proofRepairPlan);
    const verification: BuyerShareGateProofVerificationSummary = {
      checkedAt: "2026-06-22T00:00:00.000Z",
      verifiedCount: requestLinks.length,
      totalCount: requestLinks.length,
      score: 100,
      results: requestLinks.map((link) => ({
        id: link.id,
        label: link.label,
        status: "pass",
        httpStatus: 200,
        evidence: "HTTP 200 live verification",
        action: "Keep this verified proof URL attached."
      }))
    };
    const audit = buildQuickLiveProofAudit({ proofRepairPlan: preview.proofRepairPlan, proofVerification: verification });

    expect(audit.status).toBe("verified");
    expect(audit.headline).toBe("Live proof audit is buyer-ready");
    expect(audit.summary).toBe("5/5 proof links responded live. All launch proof links are reachable for external review.");
    expect(audit.receiptId).toMatch(/^workflow-live-proof-verified-[0-9a-f]{8}$/);
    expect(audit.score).toBe(100);
    expect(audit.verifiedCount).toBe(5);
    expect(audit.nextAction).toBe("Attach this audit receipt to the launch room and recheck before the next buyer review.");
    expect(audit.exportMarkdown).toContain("Status: verified");
    expect(audit.copyText).toContain("Live Proof Audit: Live proof audit is buyer-ready");
  });

  test("unlocks the proof verification handoff after live proof is verified", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const audit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: proofVerificationFor(links)
    });
    const handoff = buildQuickProofVerificationHandoff({
      proofRepairPlan: preview.proofRepairPlan,
      liveProofAudit: audit,
      nowMs: Date.parse("2026-06-21T12:00:00.000Z")
    });

    expect(handoff.status).toBe("ready");
    expect(handoff.headline).toBe("Buyer-send proof handoff is verified");
    expect(handoff.buyerSendDecision).toBe("Buyer-send unlocked with live proof receipt");
    expect(handoff.receiptId).toBe(audit.receiptId);
    expect(handoff.readyCount).toBe(5);
    expect(handoff.items.every((item) => item.status === "ready" && item.verificationStatus === "pass")).toBe(true);
    expect(handoff.exportMarkdown).toContain(`Receipt: ${audit.receiptId}`);
  });

  test("holds the proof verification handoff when the verified live receipt is stale", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const audit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: proofVerificationFor(links)
    });
    const handoff = buildQuickProofVerificationHandoff({
      proofRepairPlan: preview.proofRepairPlan,
      liveProofAudit: audit,
      nowMs: Date.parse("2026-06-22T02:00:00.000Z")
    });

    expect(handoff.status).toBe("watch");
    expect(handoff.headline).toBe("Buyer-send proof handoff needs a fresh receipt");
    expect(handoff.buyerSendDecision).toBe("Buyer-send held until live proof receipt is refreshed");
    expect(handoff.readyCount).toBe(0);
    expect(handoff.items.every((item) => item.status === "watch" && item.verificationStatus === "pass")).toBe(true);
    expect(handoff.items[0]).toMatchObject({
      evidence: expect.stringContaining("24-hour buyer-send window has expired"),
      nextAction: "Rerun live proof verification before buyer-send."
    });
    expect(handoff.exportMarkdown).toContain("Freshness: Freshness expired");
  });

  test("turns quick proof repairs into a buyer proof replacement packet", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const initialPacket = buildQuickProofReplacementPacket(draft);

    expect(initialPacket.mode).toBe("replace");
    expect(initialPacket.status).toBe("blocked");
    expect(initialPacket.blockedCount).toBe(4);
    expect(initialPacket.attentionCount).toBe(1);
    expect(initialPacket.primaryAction).toMatchObject({ label: "Replace ProtoPedia story", href: "#quick-proof-repair-plan" });
    expect(initialPacket.items.find((item) => item.id === "protopediaUrl")).toMatchObject({
      status: "blocked",
      state: "missing"
    });
    expect(initialPacket.items.find((item) => item.id === "pilotEvidenceUrl")).toMatchObject({
      status: "blocked",
      state: "starter"
    });

    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(
        withQuickProofLinkRepair(
          withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
          "videoUrl",
          "https://youtu.be/releaseReady12345"
        ),
        "pilotEvidenceUrl",
        "https://proof.opsbridge.ai/pilot-receipt.json"
      ),
      "workOrderEvidenceUrl",
      "https://proof.opsbridge.ai/work-order.md"
    );
    const verifyPacket = buildQuickProofReplacementPacket(repairedDraft);

    expect(verifyPacket.mode).toBe("verify");
    expect(verifyPacket.status).toBe("attention");
    expect(verifyPacket.blockedCount).toBe(0);
    expect(verifyPacket.attentionCount).toBe(5);
    expect(verifyPacket.primaryAction).toMatchObject({ label: "Verify Live product", href: "#quick-live-proof-audit" });
    expect(verifyPacket.buyerHandoff.copyText).toContain("5 proof links still need live verification");

    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const verifiedPacket = buildQuickProofReplacementPacket(repairedDraft, {
      proofVerification: proofVerificationFor(links),
      launchRoomHref: "https://app.example.com/launch-room?ws=abc"
    });

    expect(verifiedPacket.mode).toBe("send");
    expect(verifiedPacket.status).toBe("ready");
    expect(verifiedPacket.readyCount).toBe(5);
    expect(verifiedPacket.primaryAction).toMatchObject({ label: "Open launch room", href: "https://app.example.com/launch-room?ws=abc" });
    expect(verifiedPacket.sendPacket.headline).toBe("Buyer send packet is ready");
    expect(verifiedPacket.buyerHandoff.decisionRequest).toBe("Please review the launch room and reply with continue, revise, or stop.");
    expect(verifiedPacket.receipt.verification.status).toBe("verified");
    expect(verifiedPacket.receipt.verificationRequestJson).toContain('"receiptVersion": "buyer-proof-replacement.v1"');
    expect(verifiedPacket.exportMarkdown).toContain("## Buyer handoff");
    expect(verifiedPacket.csv).toContain("Live product,ready,own-public");
  });

  test("keeps quick replacement packet blocked when live proof fails", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(
        withQuickProofLinkRepair(
          withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
          "videoUrl",
          "https://youtu.be/releaseReady12345"
        ),
        "pilotEvidenceUrl",
        "https://proof.opsbridge.ai/pilot-receipt.json"
      ),
      "workOrderEvidenceUrl",
      "https://proof.opsbridge.ai/work-order.md"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const links = quickProofLinksForVerification(preview.proofRepairPlan);
    const packet = buildQuickProofReplacementPacket(repairedDraft, {
      proofVerification: proofVerificationFor(links, { videoUrl: "block" })
    });

    expect(packet.mode).toBe("replace");
    expect(packet.status).toBe("blocked");
    expect(packet.blockedCount).toBe(1);
    expect(packet.primaryAction).toMatchObject({ label: "Replace Walkthrough video", href: "#quick-proof-repair-plan" });
    expect(packet.items.find((item) => item.id === "videoUrl")).toMatchObject({
      status: "blocked",
      state: "failed",
      action: "Open a reachable public proof URL for Walkthrough video."
    });
    expect(packet.buyerHandoff.copyText).toContain("do not forward this packet to the buyer");
  });

  test("keeps the launch URL out of copied handoff until live proof is verified", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://protopedia.net/prototype/release-ready"),
      "videoUrl",
      "https://youtu.be/releaseReady12345"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const packet = buildQuickAppliedLaunchPacket(preview, {
      launchRoomHref: "https://service.example/launch-room?workspace=share",
      reviewKitHref: "https://service.example/buyer-review-kit?brief=share",
      acceptancePathHref: "https://service.example/buyer-acceptance-path?brief=share",
      decisionReceiptHref: "https://service.example/buyer-decision-receipt?decision=continue",
      trustManifestHref: "https://service.example/buyer-trust-manifest?brief=share",
      deliveryMemoHref: "https://service.example/buyer-delivery-memo?brief=share"
    });
    const notRunAudit = buildQuickLiveProofAudit({ proofRepairPlan: preview.proofRepairPlan });
    const pendingMessage = buildQuickLiveProofPendingMessage(packet, notRunAudit);
    const pendingExport = buildQuickLiveProofPendingExportMarkdown(packet, notRunAudit);
    const requestLinks = quickProofLinksForVerification(preview.proofRepairPlan);
    const verifiedAudit = buildQuickLiveProofAudit({
      proofRepairPlan: preview.proofRepairPlan,
      proofVerification: {
        checkedAt: "2026-06-22T00:00:00.000Z",
        verifiedCount: requestLinks.length,
        totalCount: requestLinks.length,
        score: 100,
        results: requestLinks.map((link) => ({
          id: link.id,
          label: link.label,
          status: "pass",
          httpStatus: 200,
          evidence: "HTTP 200 live verification",
          action: "Keep this verified proof URL attached."
        }))
      }
    });
    const freshNowMs = Date.parse("2026-06-22T12:00:00.000Z");
    const verifiedLaunchRoomHref = buildQuickVerifiedLaunchRoomHref("https://service.example/launch-room?workspace=share", verifiedAudit, freshNowMs);
    const verifiedLaunchRoomUrl = new URL(verifiedLaunchRoomHref);
    const verifiedMessage = buildQuickVerifiedLaunchMessage(packet, verifiedAudit, verifiedLaunchRoomHref);
    const verifiedExport = buildQuickVerifiedLaunchExportMarkdown(packet, verifiedAudit, verifiedLaunchRoomHref);

    expect(pendingMessage).toContain("Hold buyer sharing until live proof verification passes.");
    expect(pendingMessage).toContain(`Receipt: ${notRunAudit.receiptId}`);
    expect(pendingMessage).not.toContain("https://service.example/launch-room?workspace=share");
    expect(pendingExport).toContain("## Live proof gate");
    expect(pendingExport).not.toContain("Launch room: https://service.example/launch-room?workspace=share");
    expect(verifiedLaunchRoomUrl.searchParams.get("quickPacket")).toBe("verified");
    expect(verifiedLaunchRoomUrl.searchParams.get("quickAuditReceipt")).toBe(verifiedAudit.receiptId);
    expect(verifiedLaunchRoomUrl.searchParams.get("quickAuditChecksum")).toBe(`fnv1a32:${verifiedAudit.checksum}`);
    expect(verifiedLaunchRoomUrl.searchParams.get("quickAuditStatus")).toBe("verified");
    expect(verifiedLaunchRoomUrl.searchParams.get("quickAuditFreshUntil")).toBe("2026-06-23T00:00:00.000Z");
    expect(verifiedLaunchRoomUrl.searchParams.get("quickAuditScore")).toBe("100");
    expect(verifiedLaunchRoomUrl.searchParams.get("quickAuditVerified")).toBe("5/5");
    expect(buildQuickVerifiedLaunchRoomHref("https://service.example/launch-room?workspace=share", verifiedAudit, Date.parse("2026-06-23T01:00:00.000Z"))).toBe("");
    expect(verifiedMessage).toContain(`Verified launch room: ${verifiedLaunchRoomHref}`);
    expect(verifiedMessage).toContain(`Receipt: ${verifiedAudit.receiptId}`);
    expect(verifiedMessage).toContain("Status: verified");
    expect(verifiedExport).toContain("## Live proof audit receipt");
    expect(verifiedExport).toContain(`Verified launch room: ${verifiedLaunchRoomHref}`);
    expect(verifiedExport).toContain(`Checksum: fnv1a32:${verifiedAudit.checksum}`);
    expect(verifiedExport).toContain("- [pass] ProtoPedia URL: https://protopedia.net/prototype/release-ready");
  });

  test("blocks quick buyer claims when extracted values are not grounded in source lines", () => {
    const groundedDraft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const ungroundedDraft = {
      ...groundedDraft,
      sourceTrace: groundedDraft.sourceTrace.map((item) =>
        item.id === "value-model"
          ? {
              ...item,
              status: "missing" as const,
              extracted: "Missing",
              sourceLine: "",
              sourceLineNumber: null,
              action: "Add the value model source line before exporting buyer claims."
            }
          : item
      )
    };
    const preview = buildQuickBuyerRoomPreview(ungroundedDraft, 0);
    const valueRow = preview.rows.find((row) => row.id === "value");
    const valueClaim = preview.claimProofLedger.items.find((item) => item.id === "value-model");

    expect(preview.status).toBe("blocked");
    expect(valueRow).toMatchObject({
      status: "blocked"
    });
    expect(valueRow?.proof).toContain("Source missing");
    expect(preview.conversionReceipt).toMatchObject({
      status: "blocked",
      headline: "Workflow note became an internal repair packet"
    });
    expect(valueClaim).toMatchObject({
      status: "blocked",
      sourceStatus: "missing",
      sourceTraceIds: ["value-model"],
      sourceLineNumber: null,
      nextAction: "Add a source line for value model in the workflow note before using this claim."
    });
    expect(preview.claimProofLedger.status).toBe("blocked");
    expect(preview.claimProofLedger.primaryRisk).toContain("Value model");
    expect(preview.claimProofLedger.exportMarkdown).toContain("Source status: missing");
    expect(preview.exportMarkdown).toContain("Source: Pasted note: Value model missing (missing)");
  });

  test("keeps repaired proof links in watch when the domain is not buyer-safe", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(draft, "protopediaUrl", "https://example.com/prototype/release-ready"),
      "videoUrl",
      "https://example.com/video"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const repairByLabel = Object.fromEntries(preview.proofRepairPlan.items.map((item) => [item.label, item]));

    expect(preview.status).toBe("watch");
    expect(preview.rows.find((row) => row.id === "proof")).toMatchObject({
      status: "watch",
      value: "3/5 public proof URLs ready / 2 need repair"
    });
    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 3,
      missingCount: 0,
      invalidCount: 2,
      repairCount: 2,
      headline: "Replace ProtoPedia URL and Walkthrough video"
    });
    expect(repairByLabel["ProtoPedia URL"]).toMatchObject({
      status: "watch",
      action: "Replace the example.com demo domain with a real public artifact URL reviewers can open.",
      value: "https://example.com/prototype/release-ready"
    });
    expect(repairByLabel["Walkthrough video"]).toMatchObject({
      status: "watch",
      action: "Replace the example.com demo domain with a real public artifact URL reviewers can open.",
      value: "https://example.com/video"
    });
    expect(preview.handoffBrief.nextAction).toMatchObject({
      action: "Replace ProtoPedia URL and Walkthrough video and rerun live proof verification.",
      status: "watch"
    });
    expect(preview.objectionBrief.items.find((item) => item.id === "publicProof")).toMatchObject({
      status: "watch",
      answer: "Replace ProtoPedia URL and Walkthrough video before buyer sharing."
    });
  });

  test("keeps generic proof slots in repair when they use demo domains", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(
        withQuickProofLinkRepair(
          withQuickProofLinkRepair(
            withQuickProofLinkRepair(draft, "targetUrl", "https://app.example.com/release-ready"),
            "pilotEvidenceUrl",
            "https://proof.example.com/pilot-receipt"
          ),
          "workOrderEvidenceUrl",
          "https://proof.example.com/work-order"
        ),
        "protopediaUrl",
        "https://protopedia.net/prototype/release-ready"
      ),
      "videoUrl",
      "https://youtu.be/release-ready"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const repairByLabel = Object.fromEntries(preview.proofRepairPlan.items.map((item) => [item.label, item]));

    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 2,
      missingCount: 0,
      invalidCount: 3,
      repairCount: 3,
      headline: "Repair 3 proof links"
    });
    expect(repairByLabel["Deployed URL"]).toMatchObject({
      status: "watch",
      action: "Replace the example.com demo domain with a real public artifact URL reviewers can open.",
      value: "https://app.example.com/release-ready"
    });
    expect(repairByLabel["Pilot receipt"]).toMatchObject({
      status: "watch",
      action: "Replace the example.com demo domain with a real public artifact URL reviewers can open.",
      value: "https://proof.example.com/pilot-receipt"
    });
    expect(repairByLabel["Work order proof"]).toMatchObject({
      status: "watch",
      action: "Replace the example.com demo domain with a real public artifact URL reviewers can open.",
      value: "https://proof.example.com/work-order"
    });
  });

  test("keeps valid-host placeholder proof URLs in repair", () => {
    const draft = buildWorkflowIntakeDraftFromText(QUICK_WORKFLOW_INTAKE_EXAMPLE);
    const repairedDraft = withQuickProofLinkRepair(
      withQuickProofLinkRepair(
        withQuickProofLinkRepair(
          withQuickProofLinkRepair(
            withQuickProofLinkRepair(draft, "targetUrl", "https://proof.opsbridge.ai/..."),
            "protopediaUrl",
            "https://protopedia.net/prototype/..."
          ),
          "videoUrl",
          "https://youtu.be/..."
        ),
        "pilotEvidenceUrl",
        "https://proof.opsbridge.ai/pilot-receipt"
      ),
      "workOrderEvidenceUrl",
      "https://proof.opsbridge.ai/work-order"
    );
    const preview = buildQuickBuyerRoomPreview(repairedDraft, 0);
    const repairByLabel = Object.fromEntries(preview.proofRepairPlan.items.map((item) => [item.label, item]));

    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 2,
      missingCount: 0,
      invalidCount: 3,
      repairCount: 3,
      headline: "Repair 3 proof links"
    });
    expect(repairByLabel["Deployed URL"]).toMatchObject({
      status: "watch",
      action: "Replace the placeholder proof URL with a real public artifact URL reviewers can open.",
      value: "https://proof.opsbridge.ai/..."
    });
    expect(repairByLabel["ProtoPedia URL"]).toMatchObject({
      status: "watch",
      action: "Replace the placeholder proof URL with a real public artifact URL reviewers can open.",
      value: "https://protopedia.net/prototype/..."
    });
    expect(repairByLabel["Walkthrough video"]).toMatchObject({
      status: "watch",
      action: "Replace the placeholder proof URL with a real public artifact URL reviewers can open.",
      value: "https://youtu.be/..."
    });
  });

  test("keeps the buyer room preview blocked when a pasted workflow lacks proof, value, and receipt evidence", () => {
    const draft = buildWorkflowIntakeDraftFromText("Target user: Finance ops lead\nWorkflow: reconcile month-end exceptions with restricted customer data.");
    const preview = buildQuickBuyerRoomPreview(draft, 6);
    const rowById = Object.fromEntries(preview.rows.map((row) => [row.id, row]));
    const completionItemById = Object.fromEntries(preview.evidenceCompletionPacket.items.map((item) => [item.id, item]));

    expect(preview.status).toBe("blocked");
    expect(preview.primaryAsk).toContain("Close");
    expect(preview.closeRule).toContain("Do not send externally");
    expect(preview.closeRule).toContain("6 open repair items");
    expect(rowById.value).toMatchObject({ status: "blocked" });
    expect(rowById.pilot).toMatchObject({ status: "blocked" });
    expect(rowById.proof).toMatchObject({ status: "blocked" });
    expect(rowById.data).toMatchObject({ status: "blocked", value: "restricted data" });
    expect(rowById.data.proof).toContain("Public-safe packet blocks external sharing");
    expect(preview.publicSafeRedactionPacket).toMatchObject({
      status: "blocked",
      blockedCount: 1,
      watchCount: 0,
      headline: "Public-safe packet blocks external sharing"
    });
    expect(preview.publicSafeRedactionPacket.findings[0]).toMatchObject({
      label: "Customer/person data marker",
      status: "blocked",
      sourceLabel: "Workflow request",
      sourceLineNumber: 2,
      redactedLine: "Workflow: reconcile month-end exceptions with [redacted data boundary]."
    });
    expect(preview.publicSafeRedactionPacket.exportMarkdown).toContain("## Redacted workflow note");
    expect(preview.publicSafeRedactionPacket.exportMarkdown).toContain("## Public-safe rewrite");
    expect(preview.publicSafeRedactionPacket.exportMarkdown).toContain("[redacted data boundary]");
    expect(preview.publicSafeRedactionPacket.exportMarkdown).not.toContain("restricted customer data");
    expect(preview.publicSafeRedactionPacket.publicSafeWorkflowNote).toContain("Workflow: reconcile month-end exceptions with public-safe redacted evidence.");
    expect(preview.publicSafeRedactionPacket.publicSafeWorkflowNote).toContain("Data: public-safe redacted evidence.");
    expect(preview.publicSafeRedactionPacket.publicSafeWorkflowNote).not.toContain("restricted customer data");
    expect(preview.publicSafeRedactionPacket.publicSafeWorkflowNote).not.toContain("[redacted data boundary]");
    expect(preview.publicSafeRedactionPacket.rewriteLineCount).toBe(3);
    expect(decodeURIComponent(preview.publicSafeRedactionPacket.publicSafeWorkflowNoteHref.split(",")[1] ?? "")).toBe(preview.publicSafeRedactionPacket.publicSafeWorkflowNote);
    expect(preview.exportMarkdown).toContain("## Public-safe redaction packet");
    expect(preview.exportMarkdown).toContain("### Public-safe rewrite");
    expect(preview.evidenceCompletionPacket).toMatchObject({
      status: "blocked",
      openCount: 10,
      blockedCount: 10,
      watchCount: 0,
      headline: "Evidence completion packet gives the next source lines"
    });
    expect(preview.evidenceCompletionPacket.receipt.receiptId).toMatch(/^quick-evidence-completion-blocked-[0-9a-f]{8}$/);
    expect(completionItemById["row-scope"]).toMatchObject({
      label: "Buyer scope",
      owner: "Finance ops lead"
    });
    expect(completionItemById["row-scope"].sourceLine).toContain("Baseline: <current manual/scattered baseline>");
    expect(completionItemById["row-scope"].sourceLine).toContain("Success: <measurable buyer outcome and close rule>");
    expect(completionItemById["row-value"]).toMatchObject({
      label: "Value model",
      owner: "Finance owner",
      sourceLine: "Team <team size> people, <cycles per month> reviews/month, manual <manual hours per cycle> hours per review, <adoption percent>% adoption, hourly ¥<hourly cost yen>, risk ¥<monthly risk yen>."
    });
    expect(completionItemById["row-pilot"].sourceLine).toBe("Pilot: manual <manual minutes> min, assisted <assisted minutes> min, <participants> participants, <accepted tasks>/<total tasks> tasks accepted.");
    expect(completionItemById["proof-targetUrl"].sourceLine).toBe(`Deployment: ${PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl}`);
    expect(completionItemById["row-a2a"].sourceLine).toBe("Accepted A2A trial receipt: <agent name> / <skill id> / score <score> / <https receipt url>.");
    expect(completionItemById["row-data"].sourceLine).toBe("Data: public-safe redacted evidence.");
    expect(preview.evidenceCompletionPacket.completionNote).toContain("Workflow: reconcile month-end exceptions with public-safe redacted evidence.");
    expect(preview.evidenceCompletionPacket.completionNote).toContain("Success: <measurable buyer outcome and close rule>");
    expect(preview.evidenceCompletionPacket.completionNote).toContain("Team <team size> people");
    expect(preview.evidenceCompletionPacket.completionNote).toContain("Accepted A2A trial receipt: <agent name>");
    expect(preview.evidenceCompletionPacket.completionNote).not.toContain("restricted customer data");
    expect(decodeURIComponent(preview.evidenceCompletionPacket.completionNoteHref.split(",")[1] ?? "")).toBe(preview.evidenceCompletionPacket.completionNote);
    const completionDraft = buildWorkflowIntakeDraftFromText(preview.evidenceCompletionPacket.completionNote);
    expect(JSON.stringify(completionDraft)).not.toContain("restricted customer data");
    expect(completionDraft.workOrder).toMatchObject({
      request: "reconcile month-end exceptions with public-safe redacted evidence.",
      targetUser: "Finance ops lead",
      dataSensitivity: "public"
    });
    expect(completionDraft.workOrder.successMetric).toBeUndefined();
    expect(completionDraft.workOrder.currentBaseline).toBeUndefined();
    expect(completionDraft.proofLinks).toEqual({});
    expect(completionDraft.pilotRun).toEqual({});
    expect(completionDraft.detectedSignals).toEqual(
      expect.arrayContaining(["workflow request", "target buyer", "data boundary"])
    );
    expect(completionDraft.detectedSignals).not.toContain("success metric");
    expect(completionDraft.detectedSignals).not.toContain("baseline");
    expect(completionDraft.detectedSignals).not.toContain("public evidence URL");
    expect(completionDraft.detectedSignals).not.toContain("deployed URL");
    expect(completionDraft.detectedSignals).not.toContain("ProtoPedia URL");
    expect(completionDraft.detectedSignals).not.toContain("walkthrough URL");
    expect(completionDraft.detectedSignals).not.toContain("accepted A2A trial receipt");
    expect(completionDraft.warnings).toContain("Replace placeholder source lines before using this workflow externally.");
    expect(completionDraft.sourceTrace.find((item) => item.id === "workflow")).toMatchObject({
      status: "traced",
      sourceLine: "Workflow: reconcile month-end exceptions with public-safe redacted evidence."
    });
    expect(completionDraft.sourceTrace.find((item) => item.id === "baseline")).toMatchObject({
      status: "missing",
      sourceLine: "Baseline: <current manual/scattered baseline>"
    });
    expect(completionDraft.sourceTrace.find((item) => item.id === "success")).toMatchObject({
      status: "missing",
      sourceLine: "Success: <measurable buyer outcome and close rule>"
    });
    expect(completionDraft.sourceTrace.find((item) => item.id === "public-proof")).toMatchObject({
      status: "missing"
    });
    expect(completionDraft.sourceTrace.find((item) => item.id === "agent-trial")).toMatchObject({
      status: "missing",
      sourceLine: "Accepted A2A trial receipt: <agent name> / <skill id> / score <score> / <https receipt url>."
    });
    const completionReadiness = buildQuickWorkflowInputReadiness(preview.evidenceCompletionPacket.completionNote, completionDraft);
    expect(completionReadiness).toMatchObject({
      status: "blocked",
      readyCount: 1,
      totalCount: 6
    });
    expect(quickWorkflowApplyGate(completionReadiness, true)).toMatchObject({
      canApply: false,
      message: "Cannot apply yet: Add buyer, workflow, success metric, and current baseline."
    });
    expect(preview.evidenceCompletionPacket.exportMarkdown).toContain("## Owner asks");
    expect(preview.evidenceCompletionPacket.exportMarkdown).toContain("## Completion note");
    expect(preview.exportMarkdown).toContain("## Evidence completion packet");
    expect(preview.exportMarkdown).toContain("### Completion note");
    expect(preview.pilotWeekPlan.find((step) => step.id === "instrument")).toMatchObject({ status: "blocked" });
    expect(preview.pilotWeekPlan.find((step) => step.id === "verify")).toMatchObject({ status: "blocked", owner: "Proof owner" });
    expect(preview.pilotWeekPlan.find((step) => step.id === "decide")).toMatchObject({ status: "blocked" });
    expect(preview.pilotWeekTaskPacket.csvText).toContain('"Day 3","Verify public proof","blocked","Proof owner"');
    expect(preview.pilotWeekTaskPacket.kickoffText).toContain("Status: blocked");
    expect(preview.handoffBrief).toMatchObject({
      decision: "do-not-send",
      label: "Do not send",
      headline: "Repair Value model before buyer review",
      nextAction: {
        label: "Value model",
        owner: "Value owner",
        href: "#buyer-value-simulator",
        status: "blocked"
      }
    });
    expect(preview.handoffBrief.promise).toBe("The buyer value claim is not ready until savings, frequency, and acceptance evidence are attached.");
    expect(preview.handoffBrief.buyerMessage[0]).toBe("Do not send to Finance ops lead yet.");
    expect(preview.decisionCase).toMatchObject({
      status: "blocked",
      decision: "hold",
      decisionLabel: "Hold internal",
      headline: "Decision case is blocked by Value model",
      owner: "Value owner",
      nextAction: "Complete team size, cycle frequency, manual hours, adoption rate, and cost assumptions."
    });
    expect(preview.decisionCase.answer).toContain("No. Keep this internal until Value model is repaired.");
    expect(preview.conversionReceipt).toMatchObject({
      status: "blocked",
      headline: "Workflow note became an internal repair packet"
    });
    expect(preview.conversionReceipt.items.find((item) => item.id === "proof-status")).toMatchObject({
      status: "blocked"
    });
    expect(preview.exportMarkdown).toContain("## Workflow conversion receipt");
    expect(preview.economicsStressTest).toMatchObject({
      status: "blocked",
      headline: "Pilot economics are not defendable yet",
      riskAdjustedMonthlyValueYen: 0,
      monthlyValueRange: "¥0 - ¥0/month"
    });
    expect(preview.economicsStressTest.scenarios.every((scenario) => scenario.status === "blocked")).toBe(true);
    expect(preview.economicsStressTest.scenarios[0].evidence).toContain("Missing measured minutes");
    expect(preview.approvalRoute).toMatchObject({
      status: "blocked",
      headline: "Stakeholder approval route is blocked",
      readyCount: 0,
      blockedCount: 4
    });
    expect(preview.approvalRoute.steps.find((step) => step.id === "finance")).toMatchObject({
      status: "blocked",
      nextAction: "Complete measured minutes, cycles/month, adoption rate, and hourly cost before finance review."
    });
    expect(preview.approvalRoute.steps.find((step) => step.id === "security")).toMatchObject({
      status: "blocked",
      nextAction: "Get security approval for restricted data before any buyer sharing."
    });
    expect(preview.approvalEmailPack).toMatchObject({
      status: "blocked",
      headline: "Approval email pack is blocked",
      nextRecipient: "Finance owner",
      approvalDeadline: "Before pilot budget is offered"
    });
    expect(preview.approvalEmailPack.messages.find((message) => message.id === "finance")).toMatchObject({
      status: "blocked",
      replyTarget: "Name the exact evidence needed before this gate can proceed.",
      risk: "Do not route externally until this gate has new evidence."
    });
    expect(preview.approvalEmailPack.messages.find((message) => message.id === "security")?.body).toContain("Data term: Restricted data cannot leave the team");
    expect(preview.pilotContractTerms).toMatchObject({
      status: "blocked",
      headline: "Pilot contract terms are not signable",
      budgetCapYen: 0,
      clearCount: 0,
      blockedCount: 6
    });
    expect(preview.pilotContractTerms.terms.find((term) => term.id === "commercial-cap")).toMatchObject({
      status: "blocked",
      clause: "Pilot spend is not offered until the value model has measured minutes, adoption, cycles, and hourly cost."
    });
    expect(preview.pilotContractTerms.terms.find((term) => term.id === "data-boundary")).toMatchObject({
      status: "blocked",
      owner: "Security owner"
    });
    expect(preview.procurementMatrix).toMatchObject({
      status: "blocked",
      headline: "Procurement choice is not defensible yet",
      recommendedAlternativeId: "manual-status-quo",
      summary: "Manual status quo is the only defensible fallback until value, proof, approval, and contract evidence are repaired."
    });
    expect(preview.procurementMatrix.alternatives.find((alternative) => alternative.id === "a2a-pilot")).toMatchObject({
      status: "blocked",
      monthlyValueYen: 0,
      setupCostYen: 0,
      paybackDays: null,
      decision: "Do not route to procurement yet."
    });
    expect(decodeURIComponent(preview.procurementMatrix.exportHref.split(",")[1] ?? "")).toContain("Recommended: Manual status quo");
    expect(preview.claimProofLedger).toMatchObject({
      status: "blocked",
      headline: "Claim-proof ledger blocks buyer sharing",
      readyCount: 0,
      watchCount: 0,
      blockedCount: 8,
      receipt: {
        receiptId: expect.stringMatching(/^quick-claim-proof-blocked-[0-9a-f]{8}$/),
        checksumAlgorithm: "fnv1a32"
      }
    });
    expect(preview.claimProofLedger.primaryRisk).toContain("Value model");
    expect(preview.claimProofLedger.items.find((item) => item.id === "value-model")).toMatchObject({
      status: "blocked",
      owner: "Finance owner",
      nextAction: "Add measured minutes, cycles/month, adoption rate and hourly cost to defend the economics."
    });
    expect(preview.claimProofLedger.items.find((item) => item.id === "public-proof")).toMatchObject({
      status: "blocked",
      owner: "Release owner"
    });
    expect(preview.claimProofLedger.exportMarkdown).toContain("Primary risk: Value model");
    expect(preview.claimProofLedger.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(preview.claimProofLedger.receiptHref).toMatch(/^data:application\/json;charset=utf-8,/);
    expect(preview.buyerPromiseGate).toMatchObject({
      status: "blocked",
      headline: "Buyer promise is not publishable yet",
      safeUse: "Internal repair only",
      readyCount: 0,
      blockedCount: 4,
      publicPromise: expect.stringContaining("Do not publish a buyer value promise yet")
    });
    expect(preview.buyerPromiseGate.items.find((item) => item.id === "value-promise")).toMatchObject({
      status: "blocked",
      allowedClaim: "Internal only: do not quote a monthly yen outcome yet."
    });
    expect(preview.buyerPromiseGate.notAllowedClaims).toContain(
      "Do not claim guaranteed ROI or a monthly yen result without traced measured minutes, volume, adoption, and cost."
    );
    expect(preview.buyerPromiseGate.exportMarkdown).toContain("## Do not claim yet");
    expect(preview.adoptionSuccessPlan).toMatchObject({
      status: "blocked",
      headline: "30-day adoption plan is not operable yet",
      adoptionTargetPercent: 0,
      retainedMonthlyValueYen: 0,
      readyCount: 0,
      blockedCount: 5,
      renewalAsk: "Hold expansion until value retention is ready."
    });
    expect(preview.adoptionSuccessPlan.metrics.every((metric) => metric.status === "blocked")).toBe(true);
    expect(preview.adoptionSuccessPlan.checkpoints.find((checkpoint) => checkpoint.id === "day-30")).toMatchObject({
      status: "blocked",
      owner: "Procurement owner"
    });
    expect(decodeURIComponent(preview.adoptionSuccessPlan.exportHref.split(",")[1] ?? "")).toContain("Retained value threshold: not ready");
    expect(preview.rolloutCommandBoard).toMatchObject({
      status: "blocked",
      headline: "Rollout command board is blocked",
      readyCount: 0,
      blockedCount: 4,
      nextOwner: "Finance ops lead"
    });
    expect(preview.rolloutCommandBoard.nextCommand).toContain("Open the pilot kickoff");
    expect(preview.rolloutCommandBoard.commands.find((command) => command.id === "kickoff")).toMatchObject({
      status: "watch",
      owner: "Finance ops lead"
    });
    expect(preview.rolloutCommandBoard.commands.find((command) => command.id === "proof-recheck")).toMatchObject({
      status: "blocked",
      owner: "Release owner",
      evidence: "0/5 public proof links ready; 5 repair items."
    });
    expect(preview.rolloutCommandBoard.ownerLoads.some((load) => load.blockedCount > 0)).toBe(true);
    expect(preview.rolloutCommandBoard.taskCsvText).toContain('"Day 3","Proof recheck","blocked","Release owner"');
    expect(preview.rolloutCommandBoard.ownerBriefText).toContain("Status: blocked");
    expect(preview.rolloutCommandBoard.ownerBriefText).toContain("Next owner: Finance ops lead");
    expect(preview.rolloutCommandBoard.receipt.receiptId).toMatch(/^quick-rollout-blocked-[0-9a-f]{8}$/);
    expect(decodeURIComponent(preview.rolloutCommandBoard.exportHref.split(",")[1] ?? "")).toContain("Status: blocked");
    expect(preview.decisionClosePack).toMatchObject({
      status: "blocked",
      headline: "Decision close pack blocks external send",
      agenda: {
        decisionLabel: "Hold internal",
        readyCount: 0,
        agendaTotal: 4,
        firstAction: {
          label: "Fix Decision request",
          href: "#buyer-value-simulator"
        }
      },
      followUpLedger: {
        mode: "blocker-closure",
        readyCount: 0,
        taskTotal: 4,
        blockedCount: 4,
        attentionCount: 0,
        firstDueLabel: "Before external send"
      }
    });
    expect(preview.decisionClosePack.agenda.items.every((item) => item.status === "blocked")).toBe(true);
    expect(preview.decisionClosePack.agenda.items.find((item) => item.id === "proof-trust")).toMatchObject({
      owner: "Proof owner",
      evidence: expect.stringContaining("18/100 proof score")
    });
    expect(preview.decisionClosePack.followUpLedger.tasks.find((task) => task.id === "decision-request")).toMatchObject({
      status: "blocked",
      owner: "Finance ops lead",
      dueLabel: "Before external send",
      nextStep: "Name the exact approve/revise/stop decision and who can sign it."
    });
    expect(preview.decisionClosePack.followUpLedger.escalationRules).toContain("Do not send the buyer room while 4 follow-up tasks remain open.");
    expect(preview.decisionClosePack.followUpLedger.receipt.receiptId).toMatch(/^buyer-decision-follow-up-blocker-closure-[0-9a-f]{12}$/);
    expect(preview.decisionClosePack.followUpLedger.receipt.verification.status).toBe("verified");
    expect(preview.decisionClosePack.followUpLedger.exportMarkdown).toContain("## CSV ledger");
    expect(preview.decisionClosePack.followUpHtmlHref).toMatch(/^data:text\/html;charset=utf-8,/);
    expect(preview.proofRepairPlan).toMatchObject({
      readyCount: 0,
      missingCount: 5,
      invalidCount: 0,
      repairCount: 5,
      headline: "Add 5 missing proof links"
    });
    expect(preview.proofRepairPlan.items.every((item) => item.status === "blocked")).toBe(true);
    expect(preview.objectionBrief).toMatchObject({
      readyCount: 0,
      unresolvedCount: 5,
      headline: "5 buyer questions need evidence"
    });
    expect(preview.objectionBrief.items.find((item) => item.id === "valueProof")).toMatchObject({
      status: "blocked",
      answer: "ROI assumptions and measured pilot savings need complete proof before buyer review."
    });
    expect(preview.objectionBrief.items.find((item) => item.id === "dataBoundary")).toMatchObject({
      status: "blocked",
      answer: "Restricted data needs security approval before sharing."
    });
    expect(preview.pilotWeekTaskPacket.receipt.receiptId).toMatch(/^quick-pilot-week-blocked-[0-9a-f]{8}$/);
    expect(preview.exportMarkdown).toContain("Decision: Do not send");
    expect(preview.exportMarkdown).toContain("Decision: Hold internal");
    expect(preview.exportMarkdown).toContain("## Stakeholder approval route");
    expect(preview.exportMarkdown).toContain("## Pilot contract terms");
    expect(preview.exportMarkdown).toContain("## Procurement alternative matrix");
    expect(preview.exportMarkdown).toContain("## 30-day adoption success plan");
    expect(preview.exportMarkdown).toContain("## Rollout command board");
    expect(preview.exportMarkdown).toContain("## Decision close pack");
    expect(preview.exportMarkdown).toContain("## Buyer objection brief");
    expect(preview.exportMarkdown).toContain(`Receipt: ${preview.pilotWeekTaskPacket.receipt.receiptId}`);
  });

  test("quick workflow intake example can produce a publish-ready outcome snapshot", () => {
    const draft = buildWorkflowIntakeDraftFromText(
      buildQuickWorkflowIntakeExample({
        protopediaUrl: "https://protopedia.net/prototype/release-ready",
        videoUrl: "https://youtu.be/releaseReady12345"
      })
    );
    const workOrder = normalizeBuyerWorkOrderInput(draft.workOrder);
    const buyerScenarioInput = normalizeBuyerValueScenarioInput(draft.buyerScenario);
    const pilotRun = normalizePilotRunReceiptInput(draft.pilotRun);
    const projectBrief = buildWorkflowIntakeBrief({ workOrder, buyerScenario: buyerScenarioInput, pilotRun });
    const recommendation = recommendSquad(projectBrief, ["market-broker", "cloud-run-sre", "gemini-strategist"], 140);
    const valueBlueprint = buildValueBlueprint(recommendation, projectBrief);
    const buyerScenario = buildBuyerValueScenario(recommendation, buyerScenarioInput);
    const trial = draft.agentTrialEvidence;
    if (!trial) throw new Error("quick example should include accepted A2A trial evidence");
    const snapshot = buildOutcomeSnapshot({
      recommendation,
      valueBlueprint,
      buyerScenario,
      pilotRun,
      workspace: {
        targetUrl: draft.proofLinks.targetUrl || "",
        protopediaUrl: draft.proofLinks.protopediaUrl || "",
        videoUrl: draft.proofLinks.videoUrl || "",
        agentTrialEvidence: [
          {
            id: "trial-proof-quick-intake-cloud-run-sre-cloudrun-release-proof",
            receiptId: "quick-intake-cloud-run-sre-cloudrun-release-proof",
            agentId: "cloud-run-sre",
            agentName: trial.agentName || "Cloud Run SRE",
            skillId: trial.skillId || "cloudrun.release-proof",
            status: "accepted",
            score: trial.score,
            artifactUrl: trial.artifactUrl,
            evidenceSource: trial.evidenceSource,
            headline: "Accepted A2A trial receipt attached from workflow intake",
            summary: "Cloud Run SRE has a user-provided accepted A2A trial receipt at 94/100.",
            attachedAt: "2026-06-22T00:00:00.000Z"
          }
        ]
      }
    });

    expect(buyerScenario.readiness).toBe("scales-now");
    expect(snapshot.readiness).toBe("publish-ready");
    expect(snapshot.checks.every((check) => check.status === "complete")).toBe(true);
  });

  test("keeps underspecified A2A trial notes out of the evidence ledger", () => {
    const draft = buildWorkflowIntakeDraftFromText(`
Buyer: Platform release lead
Workflow: weekly release readiness review.
A2A trial receipt: accepted by Cloud Run SRE at https://proof.example.com/release-ready/a2a-trial-receipt
`);

    expect(draft.agentTrialEvidence).toBeUndefined();
    expect(draft.detectedSignals).not.toContain("accepted A2A trial receipt");
    expect(draft.warnings).toContain("Accepted A2A trial receipt needs an HTTPS artifact URL and numeric score.");
  });

  test("ships starter notes that extract into useful buyer packets", () => {
    expect(WORKFLOW_INTAKE_STARTERS.map((starter) => starter.id)).toEqual(["release-readiness", "security-signoff", "support-escalation"]);

    for (const starter of WORKFLOW_INTAKE_STARTERS) {
      const draft = buildWorkflowIntakeDraftFromText(starter.note);
      const workOrder = normalizeBuyerWorkOrderInput(draft.workOrder);
      const buyerScenario = normalizeBuyerValueScenarioInput(draft.buyerScenario);
      const pilotRun = normalizePilotRunReceiptInput(draft.pilotRun);
      const readiness = buildWorkflowIntakeReadiness({ workOrder, buyerScenario, pilotRun });
      const previewRows = buildWorkflowIntakePreviewRows(draft);
      const previewById = Object.fromEntries(previewRows.map((row) => [row.id, row]));

	      expect(starter.title).not.toMatch(/demo/i);
	      expect(starter.note).not.toMatch(/demo/i);
	      expect(starter.note).not.toContain("proof.example.com");
	      expect(draft.confidence).toBeGreaterThanOrEqual(80);
	      expect(draft.detectedSignals).toEqual(
	        expect.arrayContaining(["workflow request", "target buyer", "success metric", "baseline", "ROI assumptions", "measured minutes", "accepted tasks", "data boundary"])
	      );
	      expect(draft.detectedSignals).not.toContain("public evidence URL");
	      expect(draft.warnings).toContain("Public evidence URL is still missing.");
	      expect(workOrder.targetUser).toBe(starter.buyer);
	      expect(workOrder.evidenceUrl).toBe("");
	      expect(workOrder.dataSensitivity).toBe("public");
	      expect(pilotRun.observedManualMinutes).toBeGreaterThan(pilotRun.observedAssistedMinutes);
	      expect(pilotRun.acceptedTasks).toBeGreaterThanOrEqual(4);
	      expect(readiness.decision).toBe("needs-proof");
	      expect(previewRows.map((row) => row.id)).toEqual(["buyer", "workflow", "success", "value", "pilot", "proof", "data"]);
	      expect(previewById.buyer).toMatchObject({ value: starter.buyer, status: "ready" });
	      expect(previewById.workflow.status).toBe("ready");
	      expect(previewById.workflow.value.length).toBeGreaterThan(30);
	      expect(previewById.value).toMatchObject({ status: "ready" });
	      expect(previewById.pilot.value).toContain("tasks accepted");
	      expect(previewById.proof).toMatchObject({ value: "Missing public proof URL", status: "missing" });
	      expect(previewById.data).toMatchObject({ value: "public data", status: "ready" });
	    }
	  });

  test("marks extraction preview rows as missing before workspace mutation is safe", () => {
    const draft = buildWorkflowIntakeDraftFromText("Target user: Finance ops lead\nWorkflow: reconcile month-end exceptions with restricted customer data.");
    const previewRows = buildWorkflowIntakePreviewRows(draft);
    const previewById = Object.fromEntries(previewRows.map((row) => [row.id, row]));

    expect(previewById.buyer).toMatchObject({ value: "Finance ops lead", status: "ready" });
    expect(previewById.proof).toMatchObject({ value: "Missing public proof URL", status: "missing" });
    expect(previewById.pilot).toMatchObject({ value: "Missing measured pilot run", status: "missing" });
    expect(previewById.data).toMatchObject({ value: "restricted data", status: "watch" });
  });

  test("extracts buyer packet inputs from a pasted workflow note", () => {
    const draft = buildWorkflowIntakeDraftFromText(`
Buyer: Platform security lead
Workflow: weekly security sign-off is copied from tickets, CI logs, and chat by hand before every release.
Baseline: evidence is scattered across tickets, spreadsheets, CI logs, and review threads.
Success: save 6 hours per sign-off and close 4 proof gaps before sponsor review.
Team 7 people, 5 reviews/month, manual 12 hours per review, 72% adoption, hourly ¥11000, risk ¥250000.
Pilot: manual 360 min, assisted 115 min, 3 participants, 4/5 tasks accepted.
Data: internal redacted evidence.
Evidence: ${WORKFLOW_TEST_SECURITY_PROOF_URL}
`);

    expect(draft.workOrder).toMatchObject({
      targetUser: "Platform security lead",
      dataSensitivity: "public",
      evidenceUrl: WORKFLOW_TEST_SECURITY_PROOF_URL
    });
    expect(draft.sourceTrace.find((item) => item.id === "buyer")).toMatchObject({
      status: "traced",
      sourceLine: "Buyer: Platform security lead"
    });
    expect(draft.sourceTrace.find((item) => item.id === "value-model")).toMatchObject({
      status: "traced"
    });
    expect(draft.sourceTrace.find((item) => item.id === "agent-trial")).toMatchObject({
      status: "missing"
    });
    expect(draft.workOrder.request).toContain("weekly security sign-off");
    expect(draft.workOrder.successMetric).toContain("save 6 hours");
    expect(draft.workOrder.currentBaseline).toContain("evidence is scattered");
    expect(draft.buyerScenario).toMatchObject({
      teamSize: 7,
      cyclesPerMonth: 5,
      manualHoursPerCycle: 12,
      adoptionRatePercent: 72,
      hourlyCostYen: 11000,
      incidentRiskYenPerMonth: 250000
    });
    expect(draft.pilotRun).toMatchObject({
      observedManualMinutes: 360,
      observedAssistedMinutes: 115,
      participants: 3,
      acceptedTasks: 4,
      totalTasks: 5,
      evidenceUrl: WORKFLOW_TEST_SECURITY_PROOF_URL
    });
    expect(draft.detectedSignals).toContain("public evidence URL");
    expect(draft.confidence).toBeGreaterThanOrEqual(80);
  });

  test("keeps extraction warnings explicit when the pasted note lacks proof and measured timings", () => {
    const draft = buildWorkflowIntakeDraftFromText("Target user: Finance ops lead\nWorkflow: reconcile month-end exceptions with restricted customer data.");

    expect(draft.workOrder).toMatchObject({
      targetUser: "Finance ops lead",
      dataSensitivity: "restricted"
    });
    expect(draft.pilotRun.evidenceUrl).toBeUndefined();
    expect(draft.warnings).toContain("Public evidence URL is still missing.");
    expect(draft.warnings).toContain("Measured manual/assisted minutes were not both explicit.");
  });

  test("turns an extracted note into the generated brief used by the workspace", () => {
    const draft = buildWorkflowIntakeDraftFromText(`
Buyer: Platform security lead
Workflow: weekly security sign-off is copied from tickets, CI logs, and chat by hand before every release.
Baseline: evidence is scattered across tickets, spreadsheets, CI logs, and review threads.
Success: save 6 hours per sign-off and close 4 proof gaps before sponsor review.
Team 7 people, 5 reviews/month, manual 12 hours per review, 72% adoption, hourly ¥11000, risk ¥250000.
Pilot: manual 360 min, assisted 115 min, 3 participants, 4/5 tasks accepted.
Evidence: ${WORKFLOW_TEST_SECURITY_PROOF_URL}
`);
    const workOrder = normalizeBuyerWorkOrderInput(draft.workOrder);
    const buyerScenario = normalizeBuyerValueScenarioInput(draft.buyerScenario);
    const pilotRun = normalizePilotRunReceiptInput(draft.pilotRun);
    const brief = buildWorkflowIntakeBrief({ workOrder, buyerScenario, pilotRun });
    const readiness = buildWorkflowIntakeReadiness({ workOrder, buyerScenario, pilotRun });

    expect(brief).toContain("Platform security lead needs");
    expect(brief).toContain("weekly security sign-off");
    expect(brief).toContain("Value model: 7 people, 5 cycles/month, 12 manual hours/cycle, 72% expected adoption.");
    expect(brief).toContain("245 minutes saved/run");
    expect(readiness.decision).not.toBe("do-not-share");
    expect(readiness.checks.find((check) => check.id === "public-proof")).toMatchObject({ status: "clear" });
  });

  test("builds a buyer-ready project brief from structured intake fields", () => {
    const brief = buildWorkflowIntakeBrief({
      workOrder: {
        request: "Turn one weekly security sign-off into an A2A proof packet with owners and stop rules.",
        targetUser: "Platform security lead",
        successMetric: "Close four proof gaps and save six hours per sign-off",
        currentBaseline: "Evidence is copied from tickets, CI logs, and chat threads by hand.",
        dataSensitivity: "internal",
        evidenceUrl: "https://proof.example.com/security-signoff"
      },
      buyerScenario: {
        teamSize: 7,
        hourlyCostYen: 11000,
        cyclesPerMonth: 5,
        manualHoursPerCycle: 12,
        adoptionRatePercent: 72,
        incidentRiskYenPerMonth: 250000
      },
      pilotRun: {
        observedManualMinutes: 360,
        observedAssistedMinutes: 115,
        participants: 3,
        acceptedTasks: 4,
        totalTasks: 5,
        evidenceUrl: "",
        reviewerName: "Security sponsor",
        notes: "First replay"
      }
    });

    expect(brief).toContain("Platform security lead needs");
    expect(brief).toContain("Value model: 7 people, 5 cycles/month, 12 manual hours/cycle, 72% expected adoption.");
    expect(brief).toContain("245 minutes saved/run");
    expect(brief).toContain("4/5 accepted tasks");
    expect(brief).toContain("Proof boundary: internal data. Evidence: https://proof.example.com/security-signoff.");
  });

  test("keeps missing proof explicit instead of pretending the intake is ready", () => {
    const brief = buildWorkflowIntakeBrief({
      workOrder: {
        request: "",
        targetUser: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "restricted",
        evidenceUrl: ""
      },
      buyerScenario: {
        teamSize: 2,
        hourlyCostYen: 9000,
        cyclesPerMonth: 1,
        manualHoursPerCycle: 3,
        adoptionRatePercent: 30,
        incidentRiskYenPerMonth: 0
      },
      pilotRun: {
        observedManualMinutes: 90,
        observedAssistedMinutes: 120,
        participants: 1,
        acceptedTasks: 0,
        totalTasks: 2,
        evidenceUrl: "",
        reviewerName: "",
        notes: ""
      }
    });

    expect(brief).toContain("Target buyer needs");
    expect(brief).toContain("0 minutes saved/run");
    expect(brief).toContain("Evidence: public proof URL still pending");
    expect(brief).toContain("Proof boundary: restricted data.");
  });

  test("scores a complete workflow as pilot-ready", () => {
    const readiness = buildWorkflowIntakeReadiness({
      workOrder: {
        request: "Turn one weekly release readiness review into a buyer proof packet with owners, evidence, and stop rules.",
        targetUser: "Platform release lead",
        successMetric: "Save six hours per release and close all public proof gaps before sponsor review.",
        currentBaseline: "Release proof is copied by hand from tickets, CI logs, Cloud Run checks, and spreadsheets.",
        dataSensitivity: "public",
        evidenceUrl: WORKFLOW_TEST_RELEASE_PROOF_URL
      },
      buyerScenario: {
        teamSize: 8,
        hourlyCostYen: 12000,
        cyclesPerMonth: 5,
        manualHoursPerCycle: 16,
        adoptionRatePercent: 75,
        incidentRiskYenPerMonth: 240000
      },
      pilotRun: {
        observedManualMinutes: 480,
        observedAssistedMinutes: 140,
        participants: 4,
        acceptedTasks: 5,
        totalTasks: 5,
        evidenceUrl: "",
        reviewerName: "Platform sponsor",
        notes: "Accepted replay"
      }
    });

    expect(readiness.decision).toBe("pilot-ready");
    expect(readiness.score).toBe(100);
    expect(readiness.checks.every((check) => check.status === "clear")).toBe(true);
    expect(readiness.nextAction).toContain("open the buyer room");
  });

  test("clears the external share gate when intake, proof, and review artifacts are closed", () => {
    const links = proofSlots();
    const gate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: links,
      proofVerification: proofVerificationFor(links),
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });

    expect(gate.decision).toBe("share-ready");
    expect(gate.score).toBe(100);
    expect(gate.primaryActionLabel).toBe("Open launch room");
    expect(gate.primaryActionHref).toContain("/launch-room");
    expect(gate.sealedProofCount).toBe(5);
    expect(gate.liveVerifiedCount).toBe(5);
    expect(gate.checks.every((check) => check.status === "clear")).toBe(true);
  });

  test("builds a copyable live proof audit receipt from verification results", () => {
    const links = proofSlots();
    const verification = proofVerificationFor(links);
    const audit = buildWorkflowLiveProofAudit({ proofLinks: links, proofVerification: verification });

    expect(audit.status).toBe("verified");
    expect(audit.headline).toBe("Live proof audit is buyer-ready");
    expect(audit.receiptId).toMatch(/^workflow-live-proof-verified-[0-9a-f]{8}$/);
    expect(audit.checksumAlgorithm).toBe("fnv1a32");
    expect(audit.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(audit.verifiedCount).toBe(5);
    expect(audit.rows.every((row) => row.status === "pass")).toBe(true);
    expect(audit.copyText).toContain(`Receipt: ${audit.receiptId}`);
    expect(audit.copyText).toContain(`Checksum: fnv1a32:${audit.checksum}`);
    expect(audit.copyText).toContain("Live Proof Audit: Live proof audit is buyer-ready");
    expect(audit.exportMarkdown).toContain("## Proof links");
  });

  test("keeps failed live proof audit rows actionable instead of hiding them", () => {
    const links = proofSlots();
    const verification = proofVerificationFor(links, { videoUrl: "block" });
    const audit = buildWorkflowLiveProofAudit({ proofLinks: links, proofVerification: verification });

    expect(audit.status).toBe("action-required");
    expect(audit.headline).toBe("Live proof audit needs repair");
    expect(audit.summary).toContain("1 link still needs repair.");
    expect(audit.rows.find((row) => row.id === "videoUrl")).toMatchObject({
      status: "block",
      action: "Open a reachable public proof URL for Demo video."
    });
    expect(audit.nextAction).toBe("Open a reachable public proof URL for Demo video.");
    expect(audit.copyText).toContain("[block] Demo video");
  });

  test("keeps complete public proof in internal review until live verification runs", () => {
    const gate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: proofSlots(),
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });

    expect(gate.decision).toBe("internal-review");
    expect(gate.score).toBeLessThan(100);
    expect(gate.nextAction).toContain("Run live verification");
    expect(gate.checks.find((check) => check.id === "live-proof")).toMatchObject({
      status: "watch",
      evidence: "5/5 proof slots have public HTTPS URLs; live verification has not run."
    });
  });

  test("blocks external sharing when live proof verification fails", () => {
    const links = proofSlots();
    const gate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: links,
      proofVerification: proofVerificationFor(links, { videoUrl: "block" }),
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });

    expect(gate.decision).toBe("blocked");
    expect(gate.primaryActionLabel).toBe("Fix blocker");
    expect(gate.nextAction).toContain("Demo video");
    expect(gate.checks.find((check) => check.id === "live-proof")).toMatchObject({
      status: "blocked",
      href: "#launch-evidence-console"
    });
  });

  test("builds a sendable delivery memo only after the share gate is verified", () => {
    const links = proofSlots();
    const proofVerification = proofVerificationFor(links);
    const shareGate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: links,
      proofVerification,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });
    const memo = buildWorkflowDeliveryMemo({
      ...completeWorkflowInput(),
      proofLinks: links,
      proofVerification,
      shareGate,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc",
      value: workflowValueSummary
    });

    expect(memo.decision).toBe("send-to-buyer");
    expect(memo.subject).toContain("Buyer pilot packet ready");
    expect(memo.body).toContain("340 minutes saved/run");
    expect(memo.decisionBridge.headline).toBe("Send with measured proof and live links");
    expect(memo.decisionBridge.measuredSupport).toBe("Measured run backs 14% of modeled monthly value using labor savings only.");
    expect(memo.decisionBridge.metrics.find((metric) => metric.id === "measured-run")).toMatchObject({
      value: "256,000 yen / month",
      status: "ready"
    });
    expect(memo.proofRows.every((row) => row.status === "verified")).toBe(true);
    expect(memo.exportMarkdown).toContain("Decision: send-to-buyer");
    expect(memo.exportMarkdown).toContain("## Buyer decision bridge");
    expect(memo.copyText).toContain("Launch room: https://app.example.com/launch-room?ws=abc");
    expect(memo.copyText).toContain("Decision bridge: Send with measured proof and live links");
  });

  test("keeps the delivery memo internal when proof URLs are attached but not verified", () => {
    const links = proofSlots();
    const shareGate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: links,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });
    const memo = buildWorkflowDeliveryMemo({
      ...completeWorkflowInput(),
      proofLinks: links,
      proofVerification: null,
      shareGate,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc",
      value: workflowValueSummary
    });

    expect(memo.decision).toBe("internal-review");
    expect(memo.subject).toContain("Review buyer pilot packet");
    expect(memo.riskSummary).toContain("Run live verification");
    expect(memo.proofRows.every((row) => row.status === "attached")).toBe(true);
    expect(memo.nextSteps).toContain("Send only after the external share gate reads share-ready.");
  });

  test("holds the delivery memo inside the workspace when a gate blocker remains", () => {
    const input = completeWorkflowInput();
    input.workOrder.dataSensitivity = "restricted";
    const links = proofSlots();
    const proofVerification = proofVerificationFor(links);
    const shareGate = buildWorkflowIntakeShareGate({
      ...input,
      proofLinks: links,
      proofVerification,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });
    const memo = buildWorkflowDeliveryMemo({
      ...input,
      proofLinks: links,
      proofVerification,
      shareGate,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc",
      value: workflowValueSummary
    });

    expect(memo.decision).toBe("hold-internal");
    expect(memo.primaryAsk).toContain("Do not send externally");
    expect(memo.riskSummary).toContain("Buyer packet");
    expect(memo.exportMarkdown).toContain("Decision: hold-internal");
  });

  test("renders the delivery memo as escaped public HTML with artifact links", () => {
    const links = proofSlots();
    const proofVerification = proofVerificationFor(links);
    const shareGate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: links,
      proofVerification,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });
    const memo = buildWorkflowDeliveryMemo({
      ...completeWorkflowInput(),
      workOrder: {
        ...completeWorkflowInput().workOrder,
        targetUser: "Platform <script>alert(1)</script>"
      },
      proofLinks: links,
      proofVerification,
      shareGate,
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc",
      value: workflowValueSummary
    });
    const html = renderWorkflowDeliveryMemoHtml(memo, {
      jsonUrl: "https://app.example.com/api/buyer-delivery-memo?brief=x",
      markdownUrl: "https://app.example.com/buyer-delivery-memo.md?brief=x",
      appUrl: "https://app.example.com",
      launchRoomUrl: "https://app.example.com/launch-room?workspace=abc",
      proofAuditUrl: "https://app.example.com/buyer-proof-audit?brief=x",
      trustManifestUrl: "https://app.example.com/buyer-trust-manifest?brief=x"
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Buyer Delivery Memo");
    expect(html).toContain("Buyer decision bridge");
    expect(html).toContain("Measured run backs 14% of modeled monthly value using labor savings only.");
    expect(html).toContain("JSON");
    expect(html).toContain("Markdown");
    expect(html).toContain("https://app.example.com/buyer-proof-audit?brief=x");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Platform &lt;script&gt;alert(1)&lt;/script&gt;");
  });

  test("keeps a valid workflow in internal review when submission proof slots are missing", () => {
    const gate = buildWorkflowIntakeShareGate({
      ...completeWorkflowInput(),
      proofLinks: proofSlots({
        targetUrl: "",
        protopediaUrl: "",
        videoUrl: "",
        pilotEvidenceUrl: WORKFLOW_TEST_PILOT_PROOF_URL,
        workOrderEvidenceUrl: WORKFLOW_TEST_WORK_ORDER_PROOF_URL
      }),
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });

    expect(gate.decision).toBe("internal-review");
    expect(gate.primaryActionLabel).toBe("Review proof audit");
    expect(gate.sealedProofCount).toBe(2);
    expect(gate.checks.find((check) => check.id === "live-proof")).toMatchObject({ status: "watch" });
    expect(gate.checks.find((check) => check.id === "submission-assets")).toMatchObject({ status: "watch" });
  });

  test("blocks the external share gate when the workflow packet itself is restricted", () => {
    const input = completeWorkflowInput();
    input.workOrder.dataSensitivity = "restricted";
    const gate = buildWorkflowIntakeShareGate({
      ...input,
      proofLinks: proofSlots(),
      launchRoomHref: "https://app.example.com/launch-room?ws=abc",
      proofAuditHref: "https://app.example.com/buyer-proof-audit?ws=abc",
      trustManifestHref: "https://app.example.com/buyer-trust-manifest?ws=abc"
    });

    expect(gate.decision).toBe("blocked");
    expect(gate.primaryActionLabel).toBe("Fix blocker");
    expect(gate.checks.find((check) => check.id === "buyer-packet")).toMatchObject({ status: "blocked" });
    expect(gate.nextAction).toContain("Remove restricted data");
  });

  test("keeps otherwise complete workflows in proof mode when evidence is plain HTTP", () => {
    const readiness = buildWorkflowIntakeReadiness({
      workOrder: {
        request: "Turn one weekly release readiness review into a buyer proof packet with owners, evidence, and stop rules.",
        targetUser: "Platform release lead",
        successMetric: "Save six hours per release and close all public proof gaps before sponsor review.",
        currentBaseline: "Release proof is copied by hand from tickets, CI logs, Cloud Run checks, and spreadsheets.",
        dataSensitivity: "public",
        evidenceUrl: "http://proof.example.com/release-ready"
      },
      buyerScenario: {
        teamSize: 8,
        hourlyCostYen: 12000,
        cyclesPerMonth: 5,
        manualHoursPerCycle: 16,
        adoptionRatePercent: 75,
        incidentRiskYenPerMonth: 240000
      },
      pilotRun: {
        observedManualMinutes: 480,
        observedAssistedMinutes: 140,
        participants: 4,
        acceptedTasks: 5,
        totalTasks: 5,
        evidenceUrl: "",
        reviewerName: "Platform sponsor",
        notes: "Accepted replay"
      }
    });

    expect(readiness.decision).toBe("needs-proof");
    expect(readiness.checks.find((check) => check.id === "public-proof")).toMatchObject({ status: "watch" });
  });

  test("blocks restricted or unmeasured workflows from external sharing", () => {
    const readiness = buildWorkflowIntakeReadiness({
      workOrder: {
        request: "Internal demo",
        targetUser: "",
        successMetric: "",
        currentBaseline: "",
        dataSensitivity: "restricted",
        evidenceUrl: ""
      },
      buyerScenario: {
        teamSize: 1,
        hourlyCostYen: 9000,
        cyclesPerMonth: 1,
        manualHoursPerCycle: 2,
        adoptionRatePercent: 20,
        incidentRiskYenPerMonth: 0
      },
      pilotRun: {
        observedManualMinutes: 90,
        observedAssistedMinutes: 110,
        participants: 1,
        acceptedTasks: 0,
        totalTasks: 3,
        evidenceUrl: "",
        reviewerName: "",
        notes: ""
      }
    });

    expect(readiness.decision).toBe("do-not-share");
    expect(readiness.score).toBeLessThan(60);
    expect(readiness.checks.find((check) => check.id === "data-boundary")).toMatchObject({ status: "blocked" });
    expect(readiness.checks.find((check) => check.id === "measured-run")).toMatchObject({ status: "blocked" });
  });
});
