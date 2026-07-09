import { GoogleGenAI } from "@google/genai";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { AGENT_CARD_DILIGENCE_SKILL_ID, renderAgentCardDiligenceHtml, runAgentCardDiligence } from "./agentCardDiligence.js";
import { discoverAgentCardFromUrl } from "./agentCardDiscovery.js";
import { AGENT_CARD_SHORTLIST_SKILL_ID, MAX_AGENT_CARD_SHORTLIST_URLS, renderAgentCardShortlistHtml, runAgentCardShortlist } from "./agentCardShortlist.js";
import {
  AGENT_CARD_TRIAL_HANDOFF_SKILL_ID,
  buildAgentCardTrialHandoff,
  renderAgentCardTrialHandoffHtml,
  runAgentCardTrialHandoff
} from "./agentCardTrialHandoff.js";
import { AGENT_CARD_TRIAL_PLAN_SKILL_ID, renderAgentCardTrialPlanHtml, runAgentCardTrialPlan } from "./agentCardTrialPlan.js";
import {
  AGENT_CARD_TRIAL_VERIFICATION_SKILL_ID,
  buildAgentCardTrialVerification,
  renderAgentCardTrialVerificationHtml,
  runAgentCardTrialVerification,
  sampleTrialResponseFor
} from "./agentCardTrialVerification.js";
import { ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH, verifyAdoptionSuccessReceiptRequest } from "./adoptionSuccessReceiptVerifier.js";
import { BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH, verifyBuyerAcceptancePathReceiptRequest } from "./buyerAcceptancePathReceiptVerifier.js";
import { BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH, verifyBuyerDecisionFollowUpReceiptRequest } from "./buyerDecisionFollowUpReceiptVerifier.js";
import { BUYER_DECISION_RECEIPT_VERIFY_PATH, verifyBuyerDecisionReceiptRequest } from "./buyerDecisionReceiptVerifier.js";
import { BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH, verifyBuyerEvidenceBoardReceiptRequest } from "./buyerEvidenceBoardReceiptVerifier.js";
import {
  QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH,
  verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest
} from "./quickBuyerEvidenceResponseOwnerPacketReceiptVerifier.js";
import {
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH,
  verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest,
  verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest,
  verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest
} from "./quickBuyerEvidenceAdoptionRiskDispositionReceiptVerifier.js";
import {
  QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH,
  QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH,
  verifyQuickBuyerEvidenceValueCheckpointRequest,
  verifyQuickBuyerEvidenceValueOwnerCloseoutRequest
} from "./quickBuyerEvidenceValueCheckpointReceiptVerifier.js";
import { QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH, verifyQuickBuyerDecisionReplyRecordRequest } from "./quickBuyerDecisionReplyRecordReceiptVerifier.js";
import {
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
  verifyQuickBuyerValidationAnswerRecordRequest
} from "./quickBuyerValidationAnswerRecordReceiptVerifier.js";
import { QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH, verifyQuickValueRealizationCloseoutRequest } from "./quickValueRealizationCloseoutReceiptVerifier.js";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest
} from "./quickValueRealizationCloseoutRepairReceiptVerifier.js";
import {
  QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
  verifyQuickValueRealizationAcceptanceRequest
} from "./quickValueRealizationAcceptanceReceiptVerifier.js";
import { BUYER_VALUE_ACCEPTANCE_VERIFY_PATH, verifyBuyerValueAcceptanceReceiptRequest } from "./buyerValueAcceptanceReceiptVerifier.js";
import { QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH, verifyQuickValueReviewExecutionRequest } from "./quickValueReviewExecutionReceiptVerifier.js";
import {
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueReviewExecutionCloseoutRequest
} from "./quickValueReviewExecutionCloseoutReceiptVerifier.js";
import { QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH, verifyQuickWorkflowConversionReceiptRequest } from "./quickWorkflowConversionReceiptVerifier.js";
import {
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
  verifyQuickWorkflowValueAcceptanceContractRequest
} from "./quickWorkflowValueAcceptanceContractReceiptVerifier.js";
import {
  QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH,
  verifyQuickWorkflowPilotRunLogRequest
} from "./quickWorkflowPilotRunLogReceiptVerifier.js";
import {
  QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH,
  verifyQuickWorkflowPilotDecisionBriefRequest
} from "./quickWorkflowPilotDecisionBriefReceiptVerifier.js";
import {
  QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH,
  verifyQuickWorkflowPilotExpansionGuardrailRequest
} from "./quickWorkflowPilotExpansionGuardrailReceiptVerifier.js";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionHandoffRequest
} from "./quickWorkflowBuyerExpansionHandoffReceiptVerifier.js";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest
} from "./quickWorkflowBuyerExpansionHandoffSignoffReceiptVerifier.js";
import {
  QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
  verifyQuickWorkflowBuyerExpansionRecheckCloseoutRequest
} from "./quickWorkflowBuyerExpansionRecheckCloseoutReceiptVerifier.js";
import { QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH, verifyQuickPublicValueReleaseReceiptRequest } from "./quickPublicValueReleaseReceiptVerifier.js";
import { QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH, verifyQuickExternalReviewDecisionReceiptRequest } from "./quickExternalReviewDecisionReceiptVerifier.js";
import { QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH, verifyQuickExternalReviewOwnerPacketReceiptRequest } from "./quickExternalReviewOwnerPacketReceiptVerifier.js";
import {
  QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_VERIFY_PATH,
  QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_SET_VERIFY_PATH,
  QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERIFY_PATH,
  verifyQuickExternalReviewPacketArtifactSetRequest,
  verifyQuickExternalReviewPacketArtifactContentRequest,
  verifyQuickExternalReviewPacketManifestRequest
} from "./quickExternalReviewPacketReceiptVerifier.js";
import { QUICK_EXTERNAL_REVIEW_PACKET_REVIEW_PATH, renderQuickExternalReviewPacketReviewHtml } from "./quickExternalReviewPacketReview.js";
import { BUYER_PROOF_VERIFIER_API_PATH, verifyBuyerProofManifestRequest } from "./buyerProofVerifier.js";
import { BUYER_PROOF_AUDIT_SKILL_ID, buyerWorkspaceProofAuditLinks, renderBuyerProofAuditHtml, runBuyerProofAudit, sampleBuyerProofAuditLinks } from "./buyerProofAudit.js";
import { BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH, verifyBuyerProofPacketReceiptRequest } from "./buyerProofPacketReceiptVerifier.js";
import { BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH, verifyBuyerProofRecoveryReceiptRequest } from "./buyerProofRecoveryReceiptVerifier.js";
import { BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH, verifyBuyerProofReplacementReceiptRequest } from "./buyerProofReplacementReceiptVerifier.js";
import { BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH, verifyBuyerPilotContractReceiptRequest } from "./buyerPilotContractReceiptVerifier.js";
import { BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH, verifyBuyerShareGateReceiptRequest } from "./buyerShareGateReceiptVerifier.js";
import { BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH, verifyBuyerTrustManifestReceiptRequest } from "./buyerTrustManifestReceiptVerifier.js";
import { COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH, verifyCommercialOfferReceiptRequest } from "./commercialOfferReceiptVerifier.js";
import { GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH, verifyGlobalProofDossierReceiptRequest } from "./globalProofDossierReceiptVerifier.js";
import { GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH, verifyGlobalPublishabilityReceiptRequest } from "./globalPublishabilityReceiptVerifier.js";
import { GLOBAL_PUBLISHABILITY_REPAIR_CHECK_PATH, runGlobalPublishabilityRepairCheck } from "./globalPublishabilityRepairCheck.js";
import { GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH, runGlobalPublishabilityReviewResponse } from "./globalPublishabilityReviewResponse.js";
import {
  GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH,
  verifyGlobalPublishabilityRepairCheckReceiptRequest
} from "./globalPublishabilityRepairCheckReceiptVerifier.js";
import {
  GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH,
  verifyGlobalPublishabilityReviewResponseRequest
} from "./globalPublishabilityReviewResponseReceiptVerifier.js";
import { HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH, verifyHomepageOutcomeArtifactReceiptRequest } from "./homepageOutcomeArtifactReceiptVerifier.js";
import { HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH, verifyHomepageOutcomeSpineReceiptRequest } from "./homepageOutcomeSpineReceiptVerifier.js";
import { HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH, verifyHomepageValueLensReceiptRequest } from "./homepageValueLensReceiptVerifier.js";
import { HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH, verifyHeroOutcomeReplayReceiptRequest } from "./heroOutcomeReplayReceiptVerifier.js";
import { getClientIp, ipAllowlistMiddleware, ipAllowlistSummary } from "./ipAllowlist.js";
import { LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH, verifyLaunchRoomFollowUpReceiptRequest } from "./launchRoomFollowUpReceiptVerifier.js";
import { LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH, verifyLaunchRoomHandoffReceiptRequest } from "./launchRoomHandoffReceiptVerifier.js";
import { verifyPublicProofLinks } from "./proofLinkVerifier.js";
import {
  RECEIPT_VERIFICATION_DESK_API_PATH,
  RECEIPT_VERIFICATION_DESK_PATH,
  renderReceiptVerificationDeskHtml,
  verifyReceiptVerificationDeskRequest
} from "./receiptVerificationDesk.js";
import { WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH, verifyWorkflowLiveProofAuditRequest } from "./workflowLiveProofAuditReceiptVerifier.js";
import { SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH, verifySubmissionFinalSubmitReceiptRequest } from "./submissionFinalSubmitReceiptVerifier.js";
import { ACCEPTANCE_MATRIX_LOCK_TAG, ACCEPTANCE_MATRIX_REQUIRED_SIGNAL, ACCEPTANCE_MATRIX_SKILL_ID, buildJudgeAcceptanceMatrix, renderAcceptanceMatrixHtml } from "../src/acceptanceMatrix.js";
import { buildAdoptionOperatingPlan, renderAdoptionOperatingPlanHtml } from "../src/adoptionOperatingPlan.js";
import { localGeminiRecommendation, recommendSquad } from "../src/agentEngine.js";
import { buildArchitecturePack, renderArchitecturePackHtml } from "../src/architecturePack.js";
import { buildWinningAutopilot, renderWinningAutopilotHtml, WIN_AUTOPILOT_LOCK_TAG, WIN_AUTOPILOT_REQUIRED_SIGNAL, WIN_AUTOPILOT_SKILL_ID } from "../src/autopilot.js";
import { buildAutonomyLedger } from "../src/autonomyLedger.js";
import { buildAutonomySnapshot, renderAutonomySnapshotHtml } from "../src/autonomySnapshot.js";
import { ciStatusFromBadge } from "../src/ciProof.js";
import { buildCompetitiveBattlecard, COMPETITIVE_WIN_LOSS_LOCK_TAG, COMPETITIVE_WIN_LOSS_REQUIRED_SIGNAL } from "../src/competitiveBattlecard.js";
import {
  buildCompetitiveDecisionMatrix,
  COMPETITIVE_DECISION_MATRIX_LOCK_TAG,
  COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL,
  COMPETITIVE_DECISION_MATRIX_SKILL_ID,
  renderCompetitiveDecisionMatrixHtml
} from "../src/competitiveDecisionMatrix.js";
import { buildCompetitiveSnapshot, renderCompetitiveSnapshotHtml } from "../src/competitiveSnapshot.js";
import { buildSquadContract } from "../src/contracts.js";
import { decodeCustomAgentsParam, mergeAgentCatalog } from "../src/customAgent.js";
import { buildDeployRecoveryPlan, renderDeployRecoveryHtml } from "../src/deployRecovery.js";
import { buildJudgeDemoReceipt } from "../src/demoReceipt.js";
import { buildDemoConcierge } from "../src/demoConcierge.js";
import { buildDemoRunway } from "../src/demoRunway.js";
import {
  buildSubmissionDossier,
  renderSubmissionDossierHtml,
  SUBMISSION_DOSSIER_LOCK_TAG,
  SUBMISSION_DOSSIER_REQUIRED_SIGNAL,
  SUBMISSION_DOSSIER_SKILL_ID
} from "../src/dossier.js";
import { buildSubmissionAssetsPage, renderSubmissionAssetsHtml } from "../src/submissionAssets.js";
import {
  buildExternalEvidenceRun,
  EXTERNAL_EVIDENCE_LOCK_TAG,
  EXTERNAL_EVIDENCE_REQUIRED_SIGNAL,
  EXTERNAL_EVIDENCE_SKILL_ID,
  renderExternalEvidenceHtml,
  type ExternalEvidenceProbe
} from "../src/externalEvidence.js";
import { buildFinalistSimulation } from "../src/finalist.js";
import { buildFirstClickProof, FIRST_CLICK_REQUIRED_SIGNAL, FIRST_CLICK_ROUTE_LOCK_TAG, FIRST_CLICK_SKILL_ID } from "../src/firstClick.js";
import { buildGlobalLaunchAudit, renderGlobalLaunchAuditHtml } from "../src/globalLaunchAudit.js";
import { buildGlobalProofDossier, renderGlobalProofDossierHtml } from "../src/globalProofDossier.js";
import { buildGlobalProofDossierReceipt } from "../src/globalProofDossierReceipt.js";
import {
  GLOBAL_PUBLISHABILITY_SKILL_ID,
  buildGlobalPublishabilityReport,
  renderGlobalPublishabilityReportHtml,
  type GlobalPublishabilityReportLinks
} from "../src/globalPublishabilityReport.js";
import {
  buildFirstClickSmokeLock,
  FIRST_CLICK_SMOKE_LOCK_TAG,
  FIRST_CLICK_SMOKE_REQUIRED_SIGNAL,
  FIRST_CLICK_SMOKE_SENTINELS,
  FIRST_CLICK_SMOKE_SKILL_ID,
  renderFirstClickSmokeHtml,
  type FirstClickSmokeProbe
} from "../src/firstClickSmoke.js";
import { buildImpactCase } from "../src/impact.js";
import { buildJudgeBrief } from "../src/judgeBrief.js";
import { buildJudgeCommandCenter, JUDGE_COMMAND_LOCK_TAG, JUDGE_COMMAND_REQUIRED_SIGNAL, JUDGE_COMMAND_SKILL_ID, renderJudgeCommandCenterHtml } from "../src/judgeCommandCenter.js";
import { buildJudgeDrill } from "../src/judgeDrill.js";
import { buildJudgeSnapshot, renderJudgeSnapshotHtml } from "../src/judgeSnapshot.js";
import { buildJudgeRehearsalRoom } from "../src/judgeRehearsal.js";
import { buildJudgeTour } from "../src/judgeTour.js";
import { buildLaunchEvidenceDecision, renderLaunchEvidenceHtml } from "../src/launchEvidence.js";
import { buildLiveEvidenceRun, type LiveEvidenceStatus } from "../src/liveEvidence.js";
import {
  LAUNCH_ROOM_ACCEPTANCE_PATH_QUERY_PARAM,
  buildLaunchRoom,
  buildLaunchRoomQuickAuditReceipt,
  launchRoomHandoffCopyText,
  renderLaunchRoomHtml,
  type LaunchRoom,
  type LaunchRoomAcceptancePathAttachment,
  type LaunchRoomHtmlLinks,
  type LaunchRoomQuickAuditReceipt
} from "../src/launchRoom.js";
import { DEFAULT_PROJECT_BRIEF, MARKET_AGENTS } from "../src/market.js";
import { attachSourceProofLock, buildMarketIntelReport, probeMarketIntelSources } from "../src/marketIntel.js";
import { buildMissionRun } from "../src/mission.js";
import { buildMoatStressTest } from "../src/moatStress.js";
import { buildMvpAudit } from "../src/mvpAudit.js";
import { buildMvpSnapshot, renderMvpSnapshotHtml } from "../src/mvpSnapshot.js";
import { buildObservabilityOracle, OBSERVABILITY_ORACLE_LOCK_TAG, OBSERVABILITY_ORACLE_REQUIRED_SIGNAL, OBSERVABILITY_ORACLE_SKILL_ID, renderObservabilityOracleHtml } from "../src/observabilityOracle.js";
import { buildObjectionArena, renderObjectionArenaHtml } from "../src/objectionArena.js";
import { buildOpsDrill } from "../src/ops.js";
import { decodeAgentTrialEvidenceParam, type AgentTrialEvidenceRecord } from "../src/agentTrialEvidence.js";
import { buildBuyerDecisionMatrix, renderBuyerDecisionMatrixHtml } from "../src/buyerDecisionMatrix.js";
import { buildBuyerDecisionAgendaSnapshot, type BuyerDecisionAgendaStatus } from "../src/buyerDecisionAgenda.js";
import { buildBuyerDecisionFollowUpLedger, renderBuyerDecisionFollowUpHtml } from "../src/buyerDecisionFollowUp.js";
import { buildBuyerDecisionReceipt, renderBuyerDecisionReceiptHtml, type BuyerDecisionReceiptChoice, type BuyerDecisionReceiptInput } from "../src/buyerDecisionReceipt.js";
import { buildBuyerEvidenceBoard, renderBuyerEvidenceBoardHtml, type BuyerEvidenceBoardHtmlLinks } from "../src/buyerEvidenceBoard.js";
import { buildBuyerEvidenceTrace, renderBuyerEvidenceTraceHtml } from "../src/buyerEvidenceTrace.js";
import { buildBuyerPilotCommand } from "../src/buyerPilotCommand.js";
import { buildBuyerPilotMeasuredRunSummary } from "../src/buyerPilotMeasuredRun.js";
import { buildBuyerPilotRunCalibration } from "../src/buyerPilotRunCalibration.js";
import { buildBuyerProcurementDecision, renderBuyerProcurementDecisionHtml } from "../src/buyerProcurementDecision.js";
import { buildBuyerOutcomeBrief, renderBuyerOutcomeBriefHtml } from "../src/buyerOutcomeBrief.js";
import { buildBuyerShareGate, renderBuyerShareGateHtml } from "../src/buyerShareGate.js";
import { buildBuyerProofMonitor, renderBuyerProofMonitorHtml } from "../src/buyerProofMonitor.js";
import { buildBuyerProofRecoveryPlan, renderBuyerProofRecoveryPlanHtml } from "../src/buyerProofRecoveryPlan.js";
import { buildBuyerProofRecoveryReceipt } from "../src/buyerProofRecoveryReceipt.js";
import { buildProductionHardeningSnapshot, renderProductionHardeningHtml } from "../src/productionHardening.js";
import { buildBuyerWorkOrderBrief, normalizeBuyerWorkOrderInput, renderBuyerWorkOrderBriefHtml, type BuyerWorkOrderSensitivity } from "../src/buyerWorkOrder.js";
import { decodeQuickExternalReviewPacketShareParam, QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM } from "../src/quickExternalReviewPacketShare.js";
import { buildBuyerTrustCenter, renderBuyerTrustCenterHtml } from "../src/buyerTrustCenter.js";
import { buildBuyerTrustManifest, renderBuyerTrustManifestHtml, type BuyerTrustManifestLinks } from "../src/buyerTrustManifest.js";
import { buildBuyerProofVerifierReport, renderBuyerProofVerifierHtml } from "../src/buyerProofVerifier.js";
import { BUYER_PROOF_ROOM_MANIFEST_AT_PARAM, BUYER_PROOF_ROOM_PATH, buildBuyerProofRoom, renderBuyerProofRoomHtml, type BuyerProofRoomLinks } from "../src/buyerProofRoom.js";
import { buildBuyerAcceptancePath, renderBuyerAcceptancePathHtml, type BuyerAcceptancePathLinks } from "../src/buyerAcceptancePath.js";
import {
  BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM,
  BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM,
  buildBuyerReviewKit,
  renderBuyerReviewKitHtml,
  type BuyerReviewKitLinks,
  type BuyerReviewKitReplyRecord,
  type BuyerReviewKitValidationAnswerRecord
} from "../src/buyerReviewKit.js";
import { buildBuyerValueScenario, normalizeBuyerValueScenarioInput } from "../src/buyerValueScenario.js";
import { buildBuyerValueReport, renderBuyerValueReportHtml } from "../src/buyerValueReport.js";
import { buildBuyerDiligenceRoom, renderBuyerDiligenceHtml } from "../src/buyerDiligence.js";
import { buildBuyerProofPacket, renderBuyerProofPacketHtml } from "../src/buyerProofPacket.js";
import { buildCommercialOffer, renderCommercialOfferHtml } from "../src/commercialOffer.js";
import { buildBuyerPilotContract, renderBuyerPilotContractHtml, type BuyerPilotContractLinks } from "../src/buyerPilotContract.js";
import { buildPilotEconomics } from "../src/pilotEconomics.js";
import { buildPilotAgreement, renderPilotAgreementHtml } from "../src/pilotAgreement.js";
import { buildPilotEvidenceLedger, renderPilotEvidenceLedgerHtml } from "../src/pilotEvidenceLedger.js";
import { buildPilotExecutionHandoff, renderPilotExecutionHtml } from "../src/pilotExecution.js";
import { buildPilotProposal, renderPilotProposalHtml } from "../src/pilotProposal.js";
import { buildPilotRunReceipt, normalizePilotRunReceiptInput, renderPilotRunReceiptHtml } from "../src/pilotRunReceipt.js";
import { buildPilotValueSnapshot, renderPilotValueSnapshotHtml } from "../src/pilotValueSnapshot.js";
import { buildPilotWorkflowPlan, renderPilotWorkflowHtml } from "../src/pilotWorkflow.js";
import { buildPitchRun } from "../src/pitch.js";
import { buildJudgeProof, type CiProof, type JudgeProof } from "../src/proof.js";
import {
  buildPrizeStrategyBoard,
  PRIZE_STRATEGY_LOCK_TAG,
  PRIZE_STRATEGY_REQUIRED_SIGNAL,
  PRIZE_STRATEGY_SKILL_ID,
  renderPrizeStrategyHtml
} from "../src/prizeStrategy.js";
import {
  buildProtoPediaPublisherLiveAudit,
  buildProtoPediaPublisher,
  publisherProofLinks,
  renderProtoPediaPublisherHtml,
  SUBMISSION_PUBLISH_LOCK_TAG,
  SUBMISSION_PUBLISH_REQUIRED_SIGNAL,
  SUBMISSION_PUBLISH_SKILL_ID
} from "../src/publisher.js";
import { buildRecordingScriptPage, renderRecordingScriptHtml } from "../src/recordingScript.js";
import { buildReleaseDriftGuard, type ReleaseDriftProbe } from "../src/releaseDrift.js";
import {
  buildProofBackedSampleWorkspaceDraft,
  SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH,
  SAMPLE_AGENT_CARD_SHORTLIST_PATH,
  SAMPLE_AGENT_CARD_THIN_AGENT_PATH,
  SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH,
  SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH,
  SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH,
  SAMPLE_BUYER_BRIEF_PATH,
  SAMPLE_BUYER_PROOF_AUDIT_PATH,
  SAMPLE_BUYER_TRACE_PATH,
  SAMPLE_PILOT_RECEIPT_PATH,
  SAMPLE_PROCUREMENT_DECISION_PATH,
  SAMPLE_PROTOPEDIA_STORY_PATH,
  SAMPLE_WALKTHROUGH_VIDEO_PATH,
  SAMPLE_WORK_ORDER_PATH
} from "../src/sampleWorkspace.js";
import { buildSecurityReview } from "../src/security.js";
import { buildSponsorDecisionReceipt, buildSponsorReviewRoom, renderSponsorReviewRoomHtml } from "../src/sponsorReviewRoom.js";
import { buildSquadOptimizer } from "../src/squadOptimizer.js";
import { buildSubmissionCloseoutWorkbench } from "../src/submissionCloseout.js";
import { buildSubmissionLaunchGate, renderSubmissionLaunchHtml } from "../src/submissionLaunch.js";
import { buildFinalSubmissionRunway } from "../src/submissionRunway.js";
import { SUBMISSION_PROOF } from "../src/submission.js";
import { buildAgentTaskBoard } from "../src/taskBoard.js";
import { buildWinningStrategy } from "../src/strategy.js";
import type { GeminiRecommendation, MarketAgent } from "../src/types.js";
import { buildValueBlueprint } from "../src/valueBlueprint.js";
import { buildUserPilotLab } from "../src/userPilot.js";
import { buildWinGapRadar } from "../src/winGapRadar.js";
import { buildWorkspaceDraft, decodeWorkspaceShareParam, defaultWorkspaceDraft, encodeWorkspaceShareParam, normalizeWorkspaceDraft, WORKSPACE_SHARE_PARAM, type WorkspaceDraft } from "../src/workspaceDraft.js";
import { workspaceArtifactQuerySuffix } from "../src/workspacePublicLinks.js";
import { buildWinnerSufficiencyLock, renderWinnerSufficiencyHtml, WINNER_SUFFICIENCY_LOCK_TAG, WINNER_SUFFICIENCY_REQUIRED_SIGNAL, WINNER_SUFFICIENCY_SKILL_ID } from "../src/winnerSufficiency.js";
import { buildWinnerProofPacket, renderWinnerProofPacketHtml } from "../src/winnerPacket.js";
import { buildWorkflowDeliveryMemo, renderWorkflowDeliveryMemoHtml } from "../src/workflowDeliveryMemo.js";
import { buildWorkflowIntakeShareGate } from "../src/workflowIntakeShareGate.js";
import { normalizeLiveEvidenceBaseUrl, shouldForwardSelfProbeHeaders } from "./liveEvidenceTarget.js";
import {
  WORKFLOW_INTAKE_EXTRACT_API_PATH,
  WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH,
  extractWorkflowIntakeDraft,
  verifyWorkflowIntakeExtractionReceiptRequest
} from "./workflowIntakeExtractor.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const RecommendSchema = z.object({
  projectBrief: z.string().trim().min(1).max(20000),
  selectedAgentIds: z.array(z.string()).max(8).default([])
});
const PublisherSchema = RecommendSchema.extend({
  targetUrl: z.string().trim().max(1000).optional(),
  protopediaUrl: z.string().trim().max(1000).optional(),
  videoUrl: z.string().trim().max(1000).optional()
});

const AgentCardDiscoverySchema = z.object({
  url: z.string().trim().min(1).max(1000)
});
const AgentCardDiligenceQuerySchema = z.object({
  url: z.string().trim().min(1).max(1000)
});
const AgentCardTrialVerificationSchema = z.object({
  url: z.string().trim().min(1).max(1000),
  response: z.union([z.string().trim().min(1).max(50000), z.record(z.string(), z.unknown())])
});
const AgentCardTrialHandoffSchema = AgentCardTrialVerificationSchema.extend({
  workspace: z.unknown().optional(),
  workspaceAgentId: z.string().trim().min(1).max(120).optional()
});
const ProofLinkVerificationSchema = z.object({
  links: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(100),
        label: z.string().trim().min(1).max(120),
        value: z.string().trim().max(1000)
      })
    )
    .max(8)
});
const WorkflowIntakeExtractSchema = z.object({
  text: z.string().trim().min(1).max(8000)
});

const MissionSchema = RecommendSchema.extend({
  objective: z.string().trim().max(20000).optional()
});

const OpsDrillSchema = RecommendSchema.extend({
  observed: z
    .object({
      latencyP95Ms: z.number().nonnegative().max(60000).optional(),
      errorRatePercent: z.number().nonnegative().max(100).optional(),
      healthOk: z.boolean().optional(),
      fallbackActive: z.boolean().optional(),
      budgetBurnPercent: z.number().nonnegative().max(100).optional(),
      submissionUrlsReady: z.boolean().optional()
    })
    .optional()
});
const LaunchSchema = RecommendSchema.extend({
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional()
});
const SquadOptimizerSchema = RecommendSchema.extend({
  budget: z.number().int().positive().max(300).default(140),
  maxSquadSize: z.number().int().min(1).max(6).default(4)
});
const LiveEvidenceSchema = SquadOptimizerSchema.extend({
  targetUrl: z.string().url().optional()
});
const ReleaseDriftSchema = RecommendSchema.extend({
  targetUrl: z.string().url().optional()
});
const QueryStringSchema = (max = 1000) =>
  z.preprocess((value) => (Array.isArray(value) ? value[0] : value), z.string().trim().max(max).optional());
const QueryNumberSchema = z.preprocess((value) => {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === undefined || candidate === "" ? undefined : candidate;
}, z.coerce.number().optional());
const BuyerProposalQuerySchema = z.object({
  [WORKSPACE_SHARE_PARAM]: QueryStringSchema(30000),
  brief: QueryStringSchema(4000),
  agents: QueryStringSchema(400),
  selectedAgentIds: QueryStringSchema(400),
  targetUrl: QueryStringSchema(),
  protopediaUrl: QueryStringSchema(),
  videoUrl: QueryStringSchema(),
  customAgents: QueryStringSchema(12000),
  trialEvidence: QueryStringSchema(12000),
  teamSize: QueryNumberSchema,
  hourlyCostYen: QueryNumberSchema,
  cyclesPerMonth: QueryNumberSchema,
  manualHoursPerCycle: QueryNumberSchema,
  adoptionRatePercent: QueryNumberSchema,
  incidentRiskYenPerMonth: QueryNumberSchema,
  pilotManualMinutes: QueryNumberSchema,
  pilotAssistedMinutes: QueryNumberSchema,
  pilotParticipants: QueryNumberSchema,
  pilotAcceptedTasks: QueryNumberSchema,
  pilotTotalTasks: QueryNumberSchema,
  pilotEvidenceUrl: QueryStringSchema(),
  pilotReviewer: QueryStringSchema(200),
  pilotNotes: QueryStringSchema(800)
});
const PublisherQuerySchema = z.object({
  targetUrl: QueryStringSchema(),
  protopediaUrl: QueryStringSchema(),
  videoUrl: QueryStringSchema()
});
const WorkOrderBriefQuerySchema = BuyerProposalQuerySchema.extend({
  workOrder: QueryStringSchema(4000),
  workOrderTargetUser: QueryStringSchema(240),
  workOrderSuccessMetric: QueryStringSchema(240),
  workOrderBaseline: QueryStringSchema(240),
  workOrderDataSensitivity: QueryStringSchema(30),
  workOrderEvidenceUrl: QueryStringSchema()
});
const BuyerDecisionReceiptQuerySchema = z.object({
  decision: z.preprocess((value) => {
    const candidate = Array.isArray(value) ? value[0] : value;
    return candidate === "" ? undefined : candidate;
  }, z.enum(["continue", "revise", "stop"]).optional()),
  reviewerName: QueryStringSchema(160),
  buyerNote: QueryStringSchema(1000),
  conditionNote: QueryStringSchema(1000),
  decidedAt: QueryStringSchema(80)
});
const ReceiptVerifierQuerySchema = z.object({
  request: QueryStringSchema(30000),
  [QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM]: QueryStringSchema(60000),
  requestKey: QueryStringSchema(260),
  verify: QueryStringSchema(8)
});
const BuyerReviewKitQuerySchema = z.object({
  [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM]: QueryStringSchema(30000),
  [BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM]: QueryStringSchema(30000)
});
const LaunchRoomQuerySchema = z.object({
  [WORKSPACE_SHARE_PARAM]: QueryStringSchema(30000),
  [LAUNCH_ROOM_ACCEPTANCE_PATH_QUERY_PARAM]: QueryStringSchema(120000),
  quickPacket: QueryStringSchema(24),
  quickAuditReceipt: QueryStringSchema(80),
  quickAuditChecksum: QueryStringSchema(80),
  quickAuditStatus: QueryStringSchema(24),
  quickAuditCheckedAt: QueryStringSchema(80),
  quickAuditScore: QueryStringSchema(8),
  quickAuditVerified: QueryStringSchema(24)
});
const FirstClickSmokeSchema = z.object({
  targetUrl: z.string().url().optional()
});
const DeployRecoverySchema = ReleaseDriftSchema.extend({
  lastDeployError: z.string().trim().max(20000).optional(),
  skipReleaseDrift: z.boolean().optional()
});
const AcceptanceMatrixSchema = RecommendSchema.extend({
  targetUrl: z.string().url().optional(),
  skipReleaseDrift: z.boolean().optional(),
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional()
});
const CommandCenterSchema = AcceptanceMatrixSchema.extend({
  protopediaUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  currentDate: z.string().optional()
});
type CommandCenterInput = z.infer<typeof CommandCenterSchema>;
type BuyerProposalRequestInput = {
  projectBrief: string;
  selectedAgentIds: string[];
  customAgents: MarketAgent[];
  buyerScenario: ReturnType<typeof normalizeBuyerValueScenarioInput>;
  workspace: {
    targetUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    agentTrialEvidence: AgentTrialEvidenceRecord[];
    proofVerification: WorkspaceDraft["proofVerification"];
  };
  pilotRun: ReturnType<typeof normalizePilotRunReceiptInput>;
};
type WorkOrderBriefRequestInput = BuyerProposalRequestInput & {
  workOrder: ReturnType<typeof normalizeBuyerWorkOrderInput>;
};
type LaunchRoomRequestInput = {
  workspace: WorkspaceDraft;
  workspaceParam: string;
  isPublicSample?: boolean;
  quickAuditReceipt?: LaunchRoomQuickAuditReceipt;
  acceptancePathRequestJson?: string;
  acceptancePath?: LaunchRoomAcceptancePathAttachment;
};

function publicBaseUrl(req: express.Request) {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.header("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

function isLocalBaseUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
  } catch {
    return true;
  }
}

const PUBLIC_SITEMAP_ENTRIES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/launch-room", changefreq: "daily", priority: "0.9" },
  { path: "/global-publishability", changefreq: "daily", priority: "0.9" },
  { path: "/global-proof-dossier", changefreq: "daily", priority: "0.8" },
  { path: "/global-launch-audit", changefreq: "daily", priority: "0.8" },
  { path: "/buyer-evidence-board", changefreq: "daily", priority: "0.8" },
  { path: BUYER_PROOF_ROOM_PATH, changefreq: "daily", priority: "0.9" },
  { path: "/buyer-pilot-contract", changefreq: "daily", priority: "0.8" },
  { path: "/buyer-trust-manifest", changefreq: "weekly", priority: "0.8" },
  { path: "/buyer-proof-verifier", changefreq: "weekly", priority: "0.7" },
  { path: RECEIPT_VERIFICATION_DESK_PATH, changefreq: "weekly", priority: "0.7" },
  { path: QUICK_EXTERNAL_REVIEW_PACKET_REVIEW_PATH, changefreq: "weekly", priority: "0.7" },
  { path: "/.well-known/agent-card.json", changefreq: "weekly", priority: "0.6" },
  { path: "/.well-known/buyer-proof.json", changefreq: "weekly", priority: "0.6" }
] as const;

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function publicDiscoveryUrl(baseUrl: string, pathName: string) {
  return `${baseUrl.replace(/\/$/, "")}${pathName}`;
}

function publicRobotsTxt(baseUrl: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${publicDiscoveryUrl(normalizedBase, "/sitemap.xml")}`,
    `# Agent Card: ${publicDiscoveryUrl(normalizedBase, "/.well-known/agent-card.json")}`,
    `# Buyer proof manifest: ${publicDiscoveryUrl(normalizedBase, "/.well-known/buyer-proof.json")}`
  ].join("\n");
}

function publicSitemapXml(baseUrl: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const urls = PUBLIC_SITEMAP_ENTRIES.map(
    (entry) => `  <url>
    <loc>${xmlEscape(publicDiscoveryUrl(normalizedBase, entry.path))}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function agentCardDiligenceTargetBaseUrl(baseUrl: string) {
  return isLocalBaseUrl(baseUrl) ? SUBMISSION_PROOF.deployedUrl : baseUrl;
}

function agentCardDiligenceEndpointSet(baseUrl: string) {
  const target = `${agentCardDiligenceTargetBaseUrl(baseUrl)}/.well-known/agent-card.json`;
  const encodedTarget = encodeURIComponent(target);
  return {
    agentCardDiligenceEndpoint: `${baseUrl}/agent-card-diligence?url=${encodedTarget}`,
    agentCardDiligenceJsonEndpoint: `${baseUrl}/api/agent-card/diligence?url=${encodedTarget}`,
    agentCardDiligenceMarkdownEndpoint: `${baseUrl}/agent-card-diligence.md?url=${encodedTarget}`
  };
}

function agentCardTrialPlanEndpointSet(baseUrl: string) {
  const target = `${agentCardDiligenceTargetBaseUrl(baseUrl)}/.well-known/agent-card.json`;
  const encodedTarget = encodeURIComponent(target);
  return {
    sampleAgentCardTrialPlanEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}`,
    sampleAgentCardTrialPlanJsonEndpoint: `${baseUrl}/api${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}`,
    sampleAgentCardTrialPlanMarkdownEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}.md`,
    agentCardTrialPlanEndpoint: `${baseUrl}/agent-card-trial-plan?url=${encodedTarget}`,
    agentCardTrialPlanJsonEndpoint: `${baseUrl}/api/agent-card/trial-plan?url=${encodedTarget}`,
    agentCardTrialPlanMarkdownEndpoint: `${baseUrl}/agent-card-trial-plan.md?url=${encodedTarget}`
  };
}

function agentCardTrialVerificationEndpointSet(baseUrl: string) {
  return {
    sampleAgentCardTrialVerificationEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`,
    sampleAgentCardTrialVerificationJsonEndpoint: `${baseUrl}/api${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`,
    sampleAgentCardTrialVerificationMarkdownEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}.md`,
    agentCardTrialVerificationJsonEndpoint: `${baseUrl}/api/agent-card/trial-verification`
  };
}

function agentCardTrialHandoffEndpointSet(baseUrl: string) {
  return {
    sampleAgentCardTrialHandoffEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}`,
    sampleAgentCardTrialHandoffJsonEndpoint: `${baseUrl}/api${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}`,
    sampleAgentCardTrialHandoffMarkdownEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}.md`,
    agentCardTrialHandoffJsonEndpoint: `${baseUrl}/api/agent-card/trial-handoff`
  };
}

function sampleAgentCardShortlistUrls(baseUrl: string) {
  const targetBase = agentCardDiligenceTargetBaseUrl(baseUrl);
  return [
    `${targetBase}/.well-known/agent-card.json`,
    `${targetBase}${SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH}`,
    `${targetBase}${SAMPLE_AGENT_CARD_THIN_AGENT_PATH}`
  ];
}

function agentCardShortlistQueryString(urls: string[]) {
  const params = new URLSearchParams();
  for (const url of urls) params.append("url", url);
  return params.toString();
}

function agentCardShortlistEndpointSet(baseUrl: string) {
  const query = agentCardShortlistQueryString(sampleAgentCardShortlistUrls(baseUrl));
  return {
    sampleAgentCardShortlistEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_SHORTLIST_PATH}`,
    sampleAgentCardShortlistJsonEndpoint: `${baseUrl}/api${SAMPLE_AGENT_CARD_SHORTLIST_PATH}`,
    sampleAgentCardShortlistMarkdownEndpoint: `${baseUrl}${SAMPLE_AGENT_CARD_SHORTLIST_PATH}.md`,
    agentCardShortlistEndpoint: `${baseUrl}/agent-card-shortlist?${query}`,
    agentCardShortlistJsonEndpoint: `${baseUrl}/api/agent-card/shortlist?${query}`,
    agentCardShortlistMarkdownEndpoint: `${baseUrl}/agent-card-shortlist.md?${query}`
  };
}

function selfProbeHeaders(req: express.Request, extraHeaders: Record<string, string> = {}) {
  const clientIp = getClientIp(req);
  return {
    ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
    "X-Forwarded-Proto": req.header("x-forwarded-proto") || req.protocol,
    ...extraHeaders
  };
}

function submissionUrlEvidence(input: { protopediaUrl?: string; videoUrl?: string }) {
  return {
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl
  };
}

function splitAgentQuery(value: string | undefined) {
  return (value ?? "market-broker,cloud-run-sre,gemini-strategist")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function querySuffix(req: express.Request) {
  const index = req.originalUrl.indexOf("?");
  return index >= 0 ? req.originalUrl.slice(index) : "";
}

function querySuffixWithout(req: express.Request, keys: string[]) {
  const index = req.originalUrl.indexOf("?");
  if (index < 0) return "";
  const params = new URLSearchParams(req.originalUrl.slice(index + 1));
  keys.forEach((key) => params.delete(key));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringField(value: unknown, key: string) {
  if (!isUnknownRecord(value)) return "";
  const field = value[key];
  return typeof field === "string" ? field : "";
}

function numberField(value: unknown, key: string) {
  if (!isUnknownRecord(value)) return undefined;
  const field = value[key];
  return typeof field === "number" ? field : undefined;
}

function stringArrayField(value: unknown, key: string) {
  if (!isUnknownRecord(value)) return [];
  const field = value[key];
  return Array.isArray(field) ? field.filter((item): item is string => typeof item === "string") : [];
}

function hasQueryString(req: express.Request) {
  return req.originalUrl.includes("?");
}

function agentCardDiligenceQuery(req: express.Request) {
  const parsed = AgentCardDiligenceQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };
  return { success: true as const, url: parsed.data.url };
}

function agentCardDiligenceLinks(req: express.Request, sourceUrl: string) {
  const query = new URLSearchParams({ url: sourceUrl }).toString();
  return {
    jsonUrl: `${publicBaseUrl(req)}/api/agent-card/diligence?${query}`,
    markdownUrl: `${publicBaseUrl(req)}/agent-card-diligence.md?${query}`,
    trialPlanUrl: `${publicBaseUrl(req)}/agent-card-trial-plan?${query}`,
    appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
  };
}

function queryStringValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => queryStringValues(item));
  return typeof value === "string" ? [value] : [];
}

function agentCardShortlistQuery(req: express.Request) {
  const urls = [...queryStringValues(req.query.url), ...queryStringValues(req.query.urls).flatMap((value) => value.split(","))]
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueUrls = [...new Set(urls)].slice(0, MAX_AGENT_CARD_SHORTLIST_URLS);
  if (uniqueUrls.length === 0) return { success: false as const, error: "At least one url query parameter is required." };
  return { success: true as const, urls: uniqueUrls };
}

function agentCardShortlistLinks(req: express.Request, urls: string[]) {
  const query = agentCardShortlistQueryString(urls);
  return {
    jsonUrl: `${publicBaseUrl(req)}/api/agent-card/shortlist?${query}`,
    markdownUrl: `${publicBaseUrl(req)}/agent-card-shortlist.md?${query}`,
    trialPlanBaseUrl: `${publicBaseUrl(req)}/agent-card-trial-plan`,
    appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
  };
}

function agentCardTrialPlanLinks(req: express.Request, sourceUrl: string) {
  const query = new URLSearchParams({ url: sourceUrl }).toString();
  return {
    jsonUrl: `${publicBaseUrl(req)}/api/agent-card/trial-plan?${query}`,
    markdownUrl: `${publicBaseUrl(req)}/agent-card-trial-plan.md?${query}`,
    diligenceUrl: `${publicBaseUrl(req)}/agent-card-diligence?${query}`,
    appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
  };
}

function sampleReleaseStewardAgentCard(baseUrl: string) {
  return {
    protocolVersion: "0.3.0",
    name: "Global Release Steward",
    description: "Runs A2A release handoffs, validates MCP tools, checks Cloud Run evidence, and writes buyer safety receipts.",
    url: `${baseUrl}${SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH}`,
    provider: { organization: "Buddypia Sample Agents", url: baseUrl },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json"],
    skills: [
      { id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." },
      { id: "receipt.write", name: "Receipt writer", description: "Writes buyer handoff receipts with acceptance gates." },
      { id: "rollback.plan", name: "Rollback planner", description: "Creates Cloud Run rollback and owner action receipts." }
    ],
    mcp: { name: "release-steward", tools: ["read_checks", "read_logs", "write_receipt", "verify_cloud_run"] }
  };
}

function sampleThinAgentCard(baseUrl: string) {
  return {
    name: "Thin Automation Agent",
    description: "Small helper with limited public metadata.",
    url: `${baseUrl}${SAMPLE_AGENT_CARD_THIN_AGENT_PATH}`,
    provider: { organization: "" },
    skills: [{ id: "helper", name: "Helper", description: "Does a task." }]
  };
}

function buyerProposalQueryInput(req: express.Request) {
  const parsed = BuyerProposalQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };
  const data = parsed.data;
  const rawWorkspace = data[WORKSPACE_SHARE_PARAM];
  if (rawWorkspace) {
    return {
      success: true as const,
      input: buyerProposalInputFromWorkspace(decodeWorkspaceShareParam(rawWorkspace, defaultWorkspaceDraft()))
    };
  }

  return {
    success: true as const,
    input: {
      projectBrief: data.brief || DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: splitAgentQuery(data.agents || data.selectedAgentIds),
      customAgents: decodeCustomAgentsParam(data.customAgents),
      buyerScenario: normalizeBuyerValueScenarioInput({
        teamSize: data.teamSize,
        hourlyCostYen: data.hourlyCostYen,
        cyclesPerMonth: data.cyclesPerMonth,
        manualHoursPerCycle: data.manualHoursPerCycle,
        adoptionRatePercent: data.adoptionRatePercent,
        incidentRiskYenPerMonth: data.incidentRiskYenPerMonth
      }),
      workspace: {
        targetUrl: data.targetUrl ?? "",
        protopediaUrl: data.protopediaUrl ?? "",
        videoUrl: data.videoUrl ?? "",
        agentTrialEvidence: decodeAgentTrialEvidenceParam(data.trialEvidence),
        proofVerification: null
      },
      pilotRun: normalizePilotRunReceiptInput({
        observedManualMinutes: data.pilotManualMinutes,
        observedAssistedMinutes: data.pilotAssistedMinutes,
        participants: data.pilotParticipants,
        acceptedTasks: data.pilotAcceptedTasks,
        totalTasks: data.pilotTotalTasks,
        evidenceUrl: data.pilotEvidenceUrl,
        reviewerName: data.pilotReviewer,
        notes: data.pilotNotes
      })
    }
  };
}

function workOrderBriefQueryInput(req: express.Request) {
  const parsed = WorkOrderBriefQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };
  const data = parsed.data;
  const rawWorkspace = data[WORKSPACE_SHARE_PARAM];
  if (rawWorkspace) {
    return {
      success: true as const,
      input: workOrderInputFromWorkspace(decodeWorkspaceShareParam(rawWorkspace, defaultWorkspaceDraft()))
    };
  }
  const base = buyerProposalQueryInput(req);
  if (!base.success) return base;

  return {
    success: true as const,
    input: {
      ...base.input,
      workOrder: normalizeBuyerWorkOrderInput({
        request: data.workOrder,
        targetUser: data.workOrderTargetUser,
        successMetric: data.workOrderSuccessMetric,
        currentBaseline: data.workOrderBaseline,
        dataSensitivity: data.workOrderDataSensitivity as BuyerWorkOrderSensitivity | undefined,
        evidenceUrl: data.workOrderEvidenceUrl
      })
    }
  };
}

function receiptVerifierQueryInput(req: express.Request) {
  const parsed = ReceiptVerifierQuerySchema.safeParse(req.query);
  if (!parsed.success) return { requestJson: "", requestKey: "", autoVerify: false };
  const packetRequestJson = decodeQuickExternalReviewPacketShareParam(parsed.data[QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM]);
  return {
    requestJson: parsed.data.request?.trim() || packetRequestJson,
    requestKey: parsed.data.requestKey?.trim() ?? "",
    autoVerify: parsed.data.verify === "1"
  };
}

function receiptVerifierPrefillUrl(req: express.Request, requestJson: string) {
  const params = new URLSearchParams({
    request: requestJson,
    verify: "1"
  });
  return `${publicBaseUrl(req)}${RECEIPT_VERIFICATION_DESK_PATH}?${params.toString()}`;
}

function invalidBuyerReviewKitReplyRecord(req: express.Request, requestJson: string): BuyerReviewKitReplyRecord {
  return {
    status: "invalid_request",
    verified: false,
    receiptType: "unknown",
    receiptLabel: "Buyer reply record",
    decision: "unknown",
    checksum: "",
    verifierUrl: receiptVerifierPrefillUrl(req, requestJson),
    nextAction: "Paste the exact generated buyer reply verification request JSON before accepting the reply."
  };
}

function buyerReviewKitReplyRecordInput(req: express.Request) {
  const parsed = BuyerReviewKitQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };

  const requestJson = parsed.data[BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM]?.trim() ?? "";
  if (!requestJson) return { success: true as const, requestJson, replyRecord: undefined };

  let verificationRequest: unknown;
  try {
    verificationRequest = JSON.parse(requestJson) as unknown;
  } catch {
    return {
      success: true as const,
      requestJson,
      replyRecord: invalidBuyerReviewKitReplyRecord(req, requestJson)
    };
  }

  const result = verifyReceiptVerificationDeskRequest(verificationRequest);
  const body = result.body;
  const summary = isUnknownRecord(body.summary) ? body.summary : {};
  const verification = isUnknownRecord(body.verification) ? body.verification : {};
  const isReplyRecord = body.receiptType === "quick-buyer-decision-reply-record.v1";
  const checksum = stringField(verification, "expectedChecksum") || stringField(verificationRequest, "checksum") || stringField(verification, "expectedDigest");
  const receiptLabel = isReplyRecord ? body.receiptLabel : "Buyer reply record";

  return {
    success: true as const,
    requestJson,
    replyRecord: {
      status: isReplyRecord ? body.status : "unsupported",
      verified: isReplyRecord ? body.verified : false,
      receiptType: body.receiptType,
      receiptLabel,
      decision: stringField(summary, "decision") || "unknown",
      checksum,
      buyer: stringField(summary, "buyer") || undefined,
      confidence: numberField(summary, "confidence"),
      sourceVerifierApiPath: isReplyRecord ? body.sourceVerifierApiPath : undefined,
      verifierUrl: receiptVerifierPrefillUrl(req, requestJson),
      nextAction: isReplyRecord ? body.nextAction : "Use a buyer reply record verification request for this review kit link."
    } satisfies BuyerReviewKitReplyRecord
  };
}

function invalidBuyerReviewKitValidationAnswerRecord(req: express.Request, requestJson: string): BuyerReviewKitValidationAnswerRecord {
  return {
    status: "invalid_request",
    verified: false,
    receiptType: "unknown",
    receiptLabel: "Buyer validation answer record",
    answerStatus: "unknown",
    checksum: "",
    verifierUrl: receiptVerifierPrefillUrl(req, requestJson),
    nextAction: "Paste the exact generated buyer validation answer record verification request JSON before accepting the answers."
  };
}

function buyerReviewKitValidationAnswerRecordInput(req: express.Request) {
  const parsed = BuyerReviewKitQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };

  const requestJson = parsed.data[BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM]?.trim() ?? "";
  if (!requestJson) return { success: true as const, requestJson, validationAnswerRecord: undefined };

  let verificationRequest: unknown;
  try {
    verificationRequest = JSON.parse(requestJson) as unknown;
  } catch {
    return {
      success: true as const,
      requestJson,
      validationAnswerRecord: invalidBuyerReviewKitValidationAnswerRecord(req, requestJson)
    };
  }

  const result = verifyReceiptVerificationDeskRequest(verificationRequest);
  const body = result.body;
  const summary = isUnknownRecord(body.summary) ? body.summary : {};
  const verification = isUnknownRecord(body.verification) ? body.verification : {};
  const isValidationAnswerRecord = body.receiptType === "quick-buyer-validation-answer-record.v1";
  const checksum = stringField(verification, "expectedChecksum") || stringField(verificationRequest, "checksum") || stringField(verification, "expectedDigest");
  const receiptLabel = isValidationAnswerRecord ? body.receiptLabel : "Buyer validation answer record";

  return {
    success: true as const,
    requestJson,
    validationAnswerRecord: {
      status: isValidationAnswerRecord ? body.status : "unsupported",
      verified: isValidationAnswerRecord ? body.verified : false,
      receiptType: body.receiptType,
      receiptLabel,
      answerStatus: stringField(summary, "status") || "unknown",
      checksum,
      buyer: stringField(summary, "buyer") || undefined,
      confidence: numberField(summary, "confidence"),
      answeredCount: numberField(summary, "answeredCount"),
      totalCount: numberField(summary, "totalCount"),
      sourceReceiptId: stringField(summary, "sourceReceiptId") || undefined,
      sourceVerifierApiPath: isValidationAnswerRecord ? body.sourceVerifierApiPath : undefined,
      verifierUrl: receiptVerifierPrefillUrl(req, requestJson),
      nextAction: isValidationAnswerRecord
        ? stringField(summary, "nextAction") || body.nextAction
        : "Use a buyer validation answer record verification request for this review kit link."
    } satisfies BuyerReviewKitValidationAnswerRecord
  };
}

function invalidLaunchRoomAcceptancePath(req: express.Request, requestJson: string): LaunchRoomAcceptancePathAttachment {
  return {
    status: "invalid_request",
    verified: false,
    receiptType: "unknown",
    pathId: "unverified-acceptance-path",
    pathStatus: "unknown",
    decision: "unknown",
    buyer: "Buyer reviewer",
    checksum: "",
    verifierUrl: receiptVerifierPrefillUrl(req, requestJson),
    stageCount: 0,
    readyCount: 0,
    reviewCount: 0,
    blockedCount: 0,
    continueCriteria: [],
    nextAction: "Paste the exact generated buyer acceptance path verification request JSON before attaching it to the launch room."
  };
}

function launchRoomAcceptancePathInput(req: express.Request, requestJson: string) {
  const trimmedRequestJson = requestJson.trim();
  if (!trimmedRequestJson) return undefined;

  let verificationRequest: unknown;
  try {
    verificationRequest = JSON.parse(trimmedRequestJson) as unknown;
  } catch {
    return invalidLaunchRoomAcceptancePath(req, trimmedRequestJson);
  }

  const result = verifyReceiptVerificationDeskRequest(verificationRequest);
  const body = result.body;
  const summary = isUnknownRecord(body.summary) ? body.summary : {};
  const verification = isUnknownRecord(body.verification) ? body.verification : {};
  const isAcceptancePath = body.receiptType === "buyer-acceptance-path.v1";
  const status = isAcceptancePath ? body.status : body.status === "invalid_request" ? "invalid_request" : "unsupported";
  const readyCount = numberField(summary, "readyCount") ?? 0;
  const reviewCount = numberField(summary, "reviewCount") ?? 0;
  const blockedCount = numberField(summary, "blockedCount") ?? 0;
  const stageCount = numberField(summary, "stageCount") ?? readyCount + reviewCount + blockedCount;
  const decisionRecommendation = stringField(summary, "decisionRecommendation") || undefined;
  const selectedDecision = stringField(summary, "selectedDecision") || undefined;
  const decisionAlignment = stringField(summary, "decisionAlignment") || undefined;
  const openDecisionConditionCount = numberField(summary, "openDecisionConditionCount");
  const blockedDecisionConditionCount = numberField(summary, "blockedDecisionConditionCount");
  const watchDecisionConditionCount = numberField(summary, "watchDecisionConditionCount");
  const blockingSummary = stringField(summary, "blockingSummary") || undefined;
  const overrideWarning = stringField(summary, "overrideWarning") || undefined;
  const continueCriteria = stringArrayField(summary, "continueCriteria");
  const checksum = stringField(verification, "expectedChecksum") || stringField(verificationRequest, "checksum") || stringField(verification, "expectedDigest");
  const verifiedAcceptanceNextAction =
    decisionAlignment === "overridden"
      ? `${overrideWarning || "Decision does not match the evidence recommendation."} Repair the acceptance path before launch-room handoff.`
      : body.nextAction;

  return {
    status,
    verified: isAcceptancePath ? body.verified : false,
    receiptType: body.receiptType,
    pathId: stringField(summary, "pathId") || "unverified-acceptance-path",
    pathStatus: stringField(summary, "status") || "unknown",
    decision: stringField(summary, "decision") || "unknown",
    ...(decisionRecommendation ? { decisionRecommendation } : {}),
    ...(selectedDecision ? { selectedDecision } : {}),
    ...(decisionAlignment ? { decisionAlignment } : {}),
    ...(typeof openDecisionConditionCount === "number" ? { openDecisionConditionCount } : {}),
    ...(typeof blockedDecisionConditionCount === "number" ? { blockedDecisionConditionCount } : {}),
    ...(typeof watchDecisionConditionCount === "number" ? { watchDecisionConditionCount } : {}),
    ...(blockingSummary ? { blockingSummary } : {}),
    ...(overrideWarning ? { overrideWarning } : {}),
    continueCriteria,
    buyer: stringField(summary, "buyer") || "Buyer reviewer",
    checksum,
    verifierUrl: receiptVerifierPrefillUrl(req, trimmedRequestJson),
    stageCount,
    readyCount,
    reviewCount,
    blockedCount,
    nextAction: isAcceptancePath
      ? verifiedAcceptanceNextAction
      : body.status === "invalid_request"
        ? body.nextAction
        : "Attach a buyer acceptance path verification request generated from the acceptance path page."
  } satisfies LaunchRoomAcceptancePathAttachment;
}

function launchRoomQueryInput(req: express.Request) {
  const parsed = LaunchRoomQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };
  const rawWorkspace = parsed.data[WORKSPACE_SHARE_PARAM];
  const publicSampleWorkspace = sampleWorkspaceForRequest(req);
  const workspace = rawWorkspace ? decodeWorkspaceShareParam(rawWorkspace, publicSampleWorkspace) : publicSampleWorkspace;
  const acceptancePathRequestJson = parsed.data[LAUNCH_ROOM_ACCEPTANCE_PATH_QUERY_PARAM]?.trim() ?? "";
  const acceptancePath = launchRoomAcceptancePathInput(req, acceptancePathRequestJson);

  return {
    success: true as const,
    input: {
      workspace,
      workspaceParam: encodeWorkspaceShareParam(workspace),
      isPublicSample: !rawWorkspace,
      quickAuditReceipt: buildLaunchRoomQuickAuditReceipt({
        packet: parsed.data.quickPacket,
        receiptId: parsed.data.quickAuditReceipt,
        checksum: parsed.data.quickAuditChecksum,
        status: parsed.data.quickAuditStatus,
        checkedAt: parsed.data.quickAuditCheckedAt,
        score: parsed.data.quickAuditScore,
        verified: parsed.data.quickAuditVerified
      }) ?? undefined,
      ...(acceptancePathRequestJson ? { acceptancePathRequestJson } : {}),
      ...(acceptancePath ? { acceptancePath } : {})
    }
  };
}

function launchRoomShareUrl(req: express.Request, input: LaunchRoomRequestInput, pathName = "/", extraParams: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (!input.isPublicSample) params.set(WORKSPACE_SHARE_PARAM, input.workspaceParam);
  if (input.quickAuditReceipt) {
    params.set("quickPacket", "verified");
    params.set("quickAuditReceipt", input.quickAuditReceipt.receiptId);
    params.set("quickAuditChecksum", input.quickAuditReceipt.checksum);
    params.set("quickAuditStatus", input.quickAuditReceipt.status);
    params.set("quickAuditCheckedAt", input.quickAuditReceipt.checkedAt);
    params.set("quickAuditScore", String(input.quickAuditReceipt.score));
    params.set("quickAuditVerified", `${input.quickAuditReceipt.verifiedCount}/${input.quickAuditReceipt.totalCount}`);
  }
  if (
    (["/api/launch-room", "/launch-room", "/launch-room.md"].includes(pathName) ||
      pathName.startsWith("/api/launch-room/") ||
      pathName.startsWith("/launch-room/")) &&
    input.acceptancePathRequestJson
  ) {
    params.set(LAUNCH_ROOM_ACCEPTANCE_PATH_QUERY_PARAM, input.acceptancePathRequestJson);
  }
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return `${publicBaseUrl(req)}${pathName}${query ? `?${query}` : ""}`;
}

function buildBuyerProposalForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 200, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  return buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
}

function buildWorkOrderBriefForRequest(req: express.Request, input: WorkOrderBriefRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  return buildBuyerWorkOrderBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: input.workOrder
  });
}

function sampleWorkspaceForRequest(req: express.Request, updatedAt?: string) {
  const configured = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const requestBaseUrl = publicBaseUrl(req).replace(/\/$/, "");
  const sampleBaseUrl = configured || (isLocalBaseUrl(requestBaseUrl) ? SUBMISSION_PROOF.deployedUrl : requestBaseUrl);
  return buildProofBackedSampleWorkspaceDraft(updatedAt, sampleBaseUrl);
}

function buyerProposalInputFromWorkspace(workspace: WorkspaceDraft): BuyerProposalRequestInput {
  return {
    projectBrief: workspace.projectBrief,
    selectedAgentIds: workspace.selectedAgentIds,
    customAgents: workspace.customAgents,
    buyerScenario: workspace.buyerScenario,
    workspace: {
      targetUrl: workspace.targetUrl,
      protopediaUrl: workspace.protopediaUrl,
      videoUrl: workspace.videoUrl,
      agentTrialEvidence: workspace.agentTrialEvidence,
      proofVerification: workspace.proofVerification
    },
    pilotRun: workspace.pilotRun
  };
}

function workOrderInputFromWorkspace(workspace: WorkspaceDraft): WorkOrderBriefRequestInput {
  return {
    ...buyerProposalInputFromWorkspace(workspace),
    workOrder: workspace.buyerWorkOrder
  };
}

function launchRoomInputFromWorkOrderInput(input: WorkOrderBriefRequestInput, updatedAt?: string): LaunchRoomRequestInput {
  const workspaceDraft = buildWorkspaceDraft({
    activeTemplateId: "custom",
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    customAgents: input.customAgents,
    agentTrialEvidence: input.workspace.agentTrialEvidence,
    buyerScenario: input.buyerScenario,
    pilotRun: input.pilotRun,
    buyerWorkOrder: input.workOrder,
    targetUrl: input.workspace.targetUrl,
    protopediaUrl: input.workspace.protopediaUrl,
    videoUrl: input.workspace.videoUrl,
    proofVerification: input.workspace.proofVerification,
    updatedAt
  });
  const workspace = workspaceDraft;
  return {
    workspace,
    workspaceParam: encodeWorkspaceShareParam(workspace)
  };
}

function publicWorkOrderInputOrSample(req: express.Request, sampleUpdatedAt?: string) {
  if (hasQueryString(req)) {
    const parsed = workOrderBriefQueryInput(req);
    return parsed.success ? { success: true as const, input: parsed.input, suffix: querySuffix(req), sample: false } : parsed;
  }

  const workspace = sampleWorkspaceForRequest(req, sampleUpdatedAt);
  return {
    success: true as const,
    input: workOrderInputFromWorkspace(workspace),
    suffix: workspaceArtifactQuerySuffix(workspace),
    sample: true
  };
}

function hasQueryStringExcept(req: express.Request, ignoredKeys: string[]) {
  const index = req.originalUrl.indexOf("?");
  if (index < 0) return false;
  const params = new URLSearchParams(req.originalUrl.slice(index + 1));
  ignoredKeys.forEach((key) => params.delete(key));
  return params.toString().length > 0;
}

function publicWorkOrderInputOrSampleExcept(req: express.Request, ignoredKeys: string[], sampleUpdatedAt?: string) {
  if (hasQueryStringExcept(req, ignoredKeys)) {
    const parsed = workOrderBriefQueryInput(req);
    return parsed.success ? { success: true as const, input: parsed.input, suffix: querySuffixWithout(req, ignoredKeys), sample: false } : parsed;
  }

  const workspace = sampleWorkspaceForRequest(req, sampleUpdatedAt);
  return {
    success: true as const,
    input: workOrderInputFromWorkspace(workspace),
    suffix: workspaceArtifactQuerySuffix(workspace),
    sample: true
  };
}

function sampleLaunchRoomInput(req: express.Request): LaunchRoomRequestInput {
  const workspace = sampleWorkspaceForRequest(req);
  return {
    workspace,
    workspaceParam: encodeWorkspaceShareParam(workspace),
    isPublicSample: true
  };
}

async function buildSampleBuyerProofAuditForRequest(req: express.Request) {
  const workspace = sampleWorkspaceForRequest(req);
  const baseUrl = (workspace.targetUrl || publicBaseUrl(req)).replace(/\/$/, "");
  return runBuyerProofAudit(sampleBuyerProofAuditLinks(baseUrl));
}

async function buildBuyerProofAuditForRequest(req: express.Request, input: WorkOrderBriefRequestInput) {
  return runBuyerProofAudit(
    buyerWorkspaceProofAuditLinks({
      targetUrl: input.workspace.targetUrl,
      protopediaUrl: input.workspace.protopediaUrl,
      videoUrl: input.workspace.videoUrl,
      pilotEvidenceUrl: input.pilotRun.evidenceUrl,
      workOrderEvidenceUrl: input.workOrder.evidenceUrl,
      appUrl: publicBaseUrl(req)
    })
  );
}

async function buildSampleAgentCardTrialVerificationForRequest(req: express.Request) {
  const target = `${agentCardDiligenceTargetBaseUrl(publicBaseUrl(req))}/.well-known/agent-card.json`;
  const plan = await runAgentCardTrialPlan(target);
  return buildAgentCardTrialVerification(plan, sampleTrialResponseFor(plan));
}

async function buildSampleAgentCardTrialHandoffForRequest(req: express.Request) {
  const target = `${agentCardDiligenceTargetBaseUrl(publicBaseUrl(req))}/.well-known/agent-card.json`;
  const plan = await runAgentCardTrialPlan(target);
  const verification = buildAgentCardTrialVerification(plan, sampleTrialResponseFor(plan));
  return buildAgentCardTrialHandoff({
    verification,
    baseUrl: publicBaseUrl(req),
    workspace: sampleWorkspaceForRequest(req)
  });
}

function buildLaunchRoomForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  return buildLaunchRoom({
    workspace: input.workspace,
    baseUrl: publicBaseUrl(req),
    appUrl: launchRoomShareUrl(req, input),
    quickAuditReceipt: input.quickAuditReceipt,
    ...(input.acceptancePath ? { acceptancePath: input.acceptancePath } : {})
  });
}

function launchRoomArtifactPath(artifactId: string) {
  const paths: Record<string, string> = {
    "work-order-brief": "/work-order-brief",
    "buyer-value": "/buyer-value",
    "buyer-proof-packet": "/buyer-proof-packet",
    "live-proof-audit": "/buyer-proof-audit",
    "sponsor-review": "/sponsor-review",
    "pilot-run-receipt": "/pilot-run-receipt",
    "adoption-plan": "/adoption-plan",
    "trust-center": "/trust-center",
    "commercial-offer": "/commercial-offer",
    "buyer-pilot-contract": "/buyer-pilot-contract",
    "delivery-memo": "/buyer-delivery-memo",
    workspace: "/"
  };
  return paths[artifactId];
}

function launchRoomHtmlLinks(req: express.Request, input: LaunchRoomRequestInput, room: LaunchRoom): LaunchRoomHtmlLinks {
  return {
    appUrl: launchRoomShareUrl(req, input),
    shareGateUrl: launchRoomShareUrl(req, input, "/buyer-share-gate"),
    jsonUrl: launchRoomShareUrl(req, input, "/api/launch-room"),
    markdownUrl: launchRoomShareUrl(req, input, "/launch-room.md"),
    quickAuditReceipt: room.quickAuditReceipt,
    handoffVerifyRequestUrl: launchRoomShareUrl(req, input, "/api/launch-room/handoff-receipt/request"),
    handoffCopyUrl: launchRoomShareUrl(req, input, "/api/launch-room/handoff-copy"),
    followUpVerifyRequestUrl: launchRoomShareUrl(req, input, "/api/launch-room/follow-up-receipt/request"),
    artifactUrls: Object.fromEntries(
      room.artifacts.flatMap((artifact) => {
        const pathName = launchRoomArtifactPath(artifact.id);
        return pathName ? [[artifact.id, launchRoomShareUrl(req, input, pathName)]] : [];
      })
    ),
    valueProofLedgerUrl: launchRoomShareUrl(req, input, "/launch-room/value-proof-ledger.md"),
    buyerCoverSheetUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-cover-sheet.md"),
    stakeholderBriefUrls: Object.fromEntries(
      room.stakeholderBriefs.map((brief) => [
        brief.id,
        launchRoomShareUrl(req, input, "/launch-room/stakeholder-brief.md", { brief: brief.id })
      ])
    ),
    buyerActivityTrailUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-activity-trail.md"),
    buyerActivityCrmNoteUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-follow-up-crm-note.md"),
    buyerActivitySlackUpdateUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-follow-up-slack-update.txt"),
    buyerActivityTaskCsvUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-follow-up-tasks.csv"),
    buyerFollowUpReceiptUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-follow-up-receipt.md"),
    buyerFollowUpReplayPayloadUrl: launchRoomShareUrl(req, input, "/launch-room/buyer-follow-up-replay-payload.json"),
    handoffDecisionReceiptUrl: launchRoomShareUrl(req, input, "/launch-room/handoff-decision-receipt.md"),
    handoffDecisionReplayPayloadUrl: launchRoomShareUrl(req, input, "/launch-room/handoff-replay-payload.json")
  };
}

function sendLaunchRoomJson(req: express.Request, res: express.Response, select: (room: LaunchRoom) => unknown) {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(select(buildLaunchRoomForRequest(req, parsed.input)));
}

function sendLaunchRoomText(req: express.Request, res: express.Response, contentType: string, select: (room: LaunchRoom) => string | null) {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const body = select(buildLaunchRoomForRequest(req, parsed.input));
  if (body === null) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.type(contentType).send(body);
}

function buildGlobalLaunchAuditForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const workspace = input.workspace;
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, workspace.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const launchRoom = buildLaunchRoomForRequest(req, input);
  return buildGlobalLaunchAudit({
    projectBrief: workspace.projectBrief,
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotRun: workspace.pilotRun,
    buyerWorkOrder: workspace.buyerWorkOrder,
    workspace,
    launchRoom
  });
}

function buildBuyerOutcomeBriefForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const workspace = input.workspace;
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, workspace.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const launchRoom = buildLaunchRoomForRequest(req, input);
  return buildBuyerOutcomeBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace,
    pilotRun: workspace.pilotRun,
    launchRoom
  });
}

function buyerShareGateProofLinks(workspace: WorkspaceDraft) {
  return [
    { id: "targetUrl", label: "Deployed URL", value: workspace.targetUrl, href: "#launch-evidence-console" },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: workspace.protopediaUrl, href: "#launch-evidence-console" },
    { id: "videoUrl", label: "Demo video", value: workspace.videoUrl, href: "#launch-evidence-console" },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: workspace.pilotRun.evidenceUrl, href: "#pilot-run-receipt" },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: workspace.buyerWorkOrder.evidenceUrl, href: "#buyer-work-order-studio" }
  ];
}

function buyerDeliveryMemoProofLinks(input: WorkOrderBriefRequestInput, baseUrl: string) {
  const proofFallback = `${baseUrl}/#launch-evidence-console`;
  const href = (value: string, fallback: string) => (/^https?:\/\//i.test(value.trim()) ? value.trim() : fallback);
  return [
    { id: "targetUrl", label: "Deployed URL", value: input.workspace.targetUrl, href: href(input.workspace.targetUrl, proofFallback) },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: input.workspace.protopediaUrl, href: href(input.workspace.protopediaUrl, proofFallback) },
    { id: "videoUrl", label: "Demo video", value: input.workspace.videoUrl, href: href(input.workspace.videoUrl, proofFallback) },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: input.pilotRun.evidenceUrl, href: href(input.pilotRun.evidenceUrl, `${baseUrl}/#pilot-run-receipt`) },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: input.workOrder.evidenceUrl, href: href(input.workOrder.evidenceUrl, `${baseUrl}/#buyer-work-order-studio`) }
  ];
}

function deliveryMemoLinks(req: express.Request, suffix = querySuffix(req)) {
  const baseUrl = publicBaseUrl(req);
  return {
    appUrl: baseUrl,
    jsonUrl: `${baseUrl}/api/buyer-delivery-memo${suffix}`,
    markdownUrl: `${baseUrl}/buyer-delivery-memo.md${suffix}`,
    deliveryMemoUrl: `${baseUrl}/buyer-delivery-memo${suffix}`,
    proofAuditUrl: `${baseUrl}/buyer-proof-audit${suffix}`,
    trustManifestUrl: `${baseUrl}/buyer-trust-manifest${suffix}`
  };
}

async function buildBuyerDeliveryMemoForRequest(req: express.Request, input: WorkOrderBriefRequestInput, links = deliveryMemoLinks(req)) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proofLinks = buyerDeliveryMemoProofLinks(input, baseUrl);
  const proofSummary = await verifyPublicProofLinks(proofLinks.map((link) => ({ id: link.id, label: link.label, value: link.value })));
  const proofVerification = {
    checkedAt: proofSummary.checkedAt,
    verifiedCount: proofSummary.verifiedCount,
    totalCount: proofSummary.totalCount,
    score: proofSummary.score,
    results: proofSummary.results.map((result) => ({
      id: result.id,
      label: result.label,
      status: result.status,
      httpStatus: result.httpStatus,
      evidence: result.evidence,
      action: result.action
    }))
  };
  const workspace = buildWorkspaceDraft({
    activeTemplateId: "custom",
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    customAgents: input.customAgents,
    agentTrialEvidence: input.workspace.agentTrialEvidence,
    buyerScenario: input.buyerScenario,
    pilotRun: input.pilotRun,
    buyerWorkOrder: input.workOrder,
    targetUrl: input.workspace.targetUrl,
    protopediaUrl: input.workspace.protopediaUrl,
    videoUrl: input.workspace.videoUrl,
    proofVerification
  });
  const launchRoomInput = {
    workspace,
    workspaceParam: encodeWorkspaceShareParam(workspace)
  };
  const launchRoomHref = launchRoomShareUrl(req, launchRoomInput, "/launch-room");
  const shareGate = buildWorkflowIntakeShareGate({
    workOrder: input.workOrder,
    buyerScenario: input.buyerScenario,
    pilotRun: input.pilotRun,
    proofLinks,
    proofVerification,
    launchRoomHref,
    proofAuditHref: links.proofAuditUrl,
    trustManifestHref: links.trustManifestUrl
  });

  return {
    memo: buildWorkflowDeliveryMemo({
      workOrder: input.workOrder,
      buyerScenario: input.buyerScenario,
      pilotRun: input.pilotRun,
      proofLinks,
      proofVerification,
      shareGate,
      launchRoomHref,
      proofAuditHref: links.proofAuditUrl,
      trustManifestHref: links.trustManifestUrl,
      value: {
        monthlyGrossValueYen: buyerScenario.monthlyGrossValueYen,
        paybackDays: buyerScenario.paybackDays,
        confidenceScore: buyerScenario.confidenceScore
      }
    }),
    launchRoomUrl: launchRoomHref
  };
}

function buildBuyerShareGateForRequest(req: express.Request, input: LaunchRoomRequestInput, room = buildLaunchRoomForRequest(req, input)) {
  const workspace = input.workspace;
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const command = buildBuyerPilotCommand(room);
  const measuredRun = buildBuyerPilotMeasuredRunSummary(workspace.pilotRun, buyerScenario);
  const runCalibration = buildBuyerPilotRunCalibration(workspace.pilotRun, buyerScenario);
  return buildBuyerShareGate({
    command,
    proofLinks: buyerShareGateProofLinks(workspace),
    measuredRun,
    runCalibration,
    proofVerification: workspace.proofVerification ?? undefined
  });
}

function buildBuyerEvidenceTraceForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const workspace = input.workspace;
  const room = buildLaunchRoomForRequest(req, input);
  const shareGate = buildBuyerShareGateForRequest(req, input, room);
  const proofPacket = buildBuyerProofPacketForRequest(req, buyerProposalInputFromWorkspace(workspace));
  return buildBuyerEvidenceTrace({ room, shareGate, proofPacketReceipt: proofPacket.receipt });
}

function buildBuyerProofMonitorForRequest(_req: express.Request, input: LaunchRoomRequestInput) {
  return buildBuyerProofMonitor({
    proofLinks: buyerShareGateProofLinks(input.workspace),
    verification: input.workspace.proofVerification
  });
}

function buildBuyerProofRecoveryForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const proofLinks = buyerShareGateProofLinks(input.workspace);
  const monitor = buildBuyerProofMonitorForRequest(req, input);
  return buildBuyerProofRecoveryPlan({
    proofLinks,
    monitor,
    verification: input.workspace.proofVerification
  });
}

function buyerEvidenceBoardArtifactLinks(req: express.Request, input: LaunchRoomRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const artifactSuffix = workspaceArtifactQuerySuffix(input.workspace);
  const workspaceUrl = launchRoomShareUrl(req, input);
  return {
    workspaceUrl,
    publicPageUrl: launchRoomShareUrl(req, input, "/buyer-evidence-board"),
    launchRoomUrl: launchRoomShareUrl(req, input, "/launch-room"),
    valueReportUrl: `${baseUrl}/buyer-value${artifactSuffix}`,
    deliveryMemoUrl: `${baseUrl}/buyer-delivery-memo${artifactSuffix}`,
    proofAuditUrl: `${baseUrl}/buyer-proof-audit${artifactSuffix}`,
    trustManifestUrl: `${baseUrl}/buyer-trust-manifest${artifactSuffix}`,
    jsonUrl: launchRoomShareUrl(req, input, "/api/buyer-evidence-board"),
    markdownUrl: launchRoomShareUrl(req, input, "/buyer-evidence-board.md")
  };
}

function buildBuyerEvidenceBoardForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const workspace = input.workspace;
  const recommendation = recommendSquad(workspace.projectBrief, workspace.selectedAgentIds, 260, mergeAgentCatalog(workspace.customAgents));
  const buyerScenario = buildBuyerValueScenario(recommendation, workspace.buyerScenario);
  const room = buildLaunchRoomForRequest(req, input);
  const command = buildBuyerPilotCommand(room);
  const links = buyerEvidenceBoardArtifactLinks(req, input);
  return buildBuyerEvidenceBoard({
    projectBrief: workspace.projectBrief,
    buyerScenario,
    pilotRun: workspace.pilotRun,
    buyerWorkOrder: workspace.buyerWorkOrder,
    agentTrialEvidence: workspace.agentTrialEvidence,
    command,
    proofVerification: workspace.proofVerification,
    issuedAt: workspace.updatedAt,
    hrefs: {
      workflowIntake: `${links.workspaceUrl}#quick-workflow-intake`,
      valueReport: links.valueReportUrl,
      measuredRun: links.deliveryMemoUrl,
      proofAudit: links.proofAuditUrl,
      trustManifest: links.trustManifestUrl,
      launchRoom: links.launchRoomUrl,
      publicPage: links.publicPageUrl
    }
  });
}

function buyerEvidenceBoardHtmlLinks(req: express.Request, input: LaunchRoomRequestInput): BuyerEvidenceBoardHtmlLinks {
  const links = buyerEvidenceBoardArtifactLinks(req, input);
  return {
    appUrl: links.workspaceUrl,
    launchRoomUrl: links.launchRoomUrl,
    proofAuditUrl: links.proofAuditUrl,
    jsonUrl: links.jsonUrl,
    markdownUrl: links.markdownUrl
  };
}

function productionHardeningLinks(req: express.Request, input: LaunchRoomRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const artifactSuffix = workspaceArtifactQuerySuffix(input.workspace);
  return {
    appUrl: launchRoomShareUrl(req, input),
    launchRoomUrl: launchRoomShareUrl(req, input, "/launch-room"),
    proofAuditUrl: `${baseUrl}/buyer-proof-audit${artifactSuffix}`,
    deliveryMemoUrl: `${baseUrl}/buyer-delivery-memo${artifactSuffix}`,
    trustManifestUrl: `${baseUrl}/buyer-trust-manifest${artifactSuffix}`,
    jsonUrl: launchRoomShareUrl(req, input, "/api/production-hardening"),
    markdownUrl: launchRoomShareUrl(req, input, "/production-hardening.md")
  };
}

function buildProductionHardeningForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const links = productionHardeningLinks(req, input);
  return buildProductionHardeningSnapshot({
    workspace: input.workspace,
    workflowIntakeHref: `${links.appUrl}#marketplace-workbench`,
    currentAuditHref: links.proofAuditUrl,
    deliveryMemoHref: links.deliveryMemoUrl,
    trustManifestHref: links.trustManifestUrl,
    launchRoomHref: links.launchRoomUrl
  });
}

async function buildGlobalProofDossierForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const audit = buildGlobalLaunchAuditForRequest(req, input);
  const liveProof = await verifyPublicProofLinks(
    audit.proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      value: link.value
    }))
  );
  return buildGlobalProofDossier({ audit, liveProof });
}

function globalPublishabilityLinks(req: express.Request, input: LaunchRoomRequestInput): GlobalPublishabilityReportLinks {
  return {
    appUrl: launchRoomShareUrl(req, input),
    launchRoomUrl: launchRoomShareUrl(req, input, "/launch-room"),
    globalAuditUrl: launchRoomShareUrl(req, input, "/global-launch-audit"),
    proofDossierUrl: launchRoomShareUrl(req, input, "/global-proof-dossier"),
    launchEvidenceUrl: launchRoomShareUrl(req, input, "/launch-evidence"),
    buyerOutcomeUrl: launchRoomShareUrl(req, input, "/buyer-outcome-brief"),
    buyerShareGateUrl: launchRoomShareUrl(req, input, "/buyer-share-gate"),
    buyerReviewKitUrl: launchRoomShareUrl(req, input, "/buyer-review-kit"),
    acceptancePathUrl: launchRoomShareUrl(req, input, "/buyer-acceptance-path"),
    jsonUrl: launchRoomShareUrl(req, input, "/api/global-publishability"),
    markdownUrl: launchRoomShareUrl(req, input, "/global-publishability.md")
  };
}

async function buildGlobalPublishabilityReportForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const audit = buildGlobalLaunchAuditForRequest(req, input);
  const liveProof = await verifyPublicProofLinks(
    audit.proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      value: link.value
    }))
  );
  const dossier = buildGlobalProofDossier({ audit, liveProof });
  return buildGlobalPublishabilityReport({
    audit,
    dossier,
    links: globalPublishabilityLinks(req, input)
  });
}

async function buildLaunchEvidenceDecisionForRequest(req: express.Request, input: LaunchRoomRequestInput) {
  const workspace = input.workspace;
  const sharedInput = {
    projectBrief: workspace.projectBrief,
    selectedAgentIds: workspace.selectedAgentIds
  };
  const targetBaseUrl = (workspace.targetUrl || SUBMISSION_PROOF.deployedUrl).replace(/\/$/, "");
  const proofArtifacts = buyerShareGateProofLinks(workspace);
  const [liveEvidence, externalEvidence, releaseDrift, proofVerification] = await Promise.all([
    buildLiveEvidenceForRequest(req, {
      ...sharedInput,
      targetUrl: targetBaseUrl,
      budget: 140,
      maxSquadSize: 4
    }),
    buildExternalEvidenceForRequest(req, {
      ...sharedInput,
      protopediaUrl: workspace.protopediaUrl,
      videoUrl: workspace.videoUrl
    }),
    buildReleaseDriftForTarget({
      currentBaseUrl: publicBaseUrl(req),
      targetBaseUrl,
      projectBrief: workspace.projectBrief,
      selectedAgentIds: workspace.selectedAgentIds,
      forwardedHeaders: selfProbeHeaders(req)
    }),
    verifyPublicProofLinks(proofArtifacts.map((link) => ({ id: link.id, label: link.label, value: link.value })))
  ]);

  return buildLaunchEvidenceDecision({
    liveEvidence,
    externalEvidence,
    releaseDrift,
    proofArtifacts,
    proofVerification,
    agentTrialEvidence: workspace.agentTrialEvidence
  });
}

function buildBuyerValueReportForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  return buildBuyerValueReport({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotRun: input.pilotRun
  });
}

function buildPilotExecutionForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 200, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  return buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: publicBaseUrl(req) });
}

function buildBuyerDiligenceForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const handoff = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: publicBaseUrl(req) });
  return buildBuyerDiligenceRoom({
    proposal,
    handoff,
    buyerScenario,
    valueBlueprint,
    recommendation,
    baseUrl: publicBaseUrl(req)
  });
}

function buildPilotWorkflowForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  return buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
}

function buildPilotRunReceiptForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  return buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
}

function buildBuyerDecisionMatrixForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  return buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
}

function buildBuyerProcurementDecisionForRequest(req: express.Request, input: WorkOrderBriefRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  return buildBuyerProcurementDecision({
    recommendation,
    valueBlueprint,
    buyerScenario,
    buyerWorkOrder: input.workOrder,
    pilotRun: input.pilotRun
  });
}

function buildPilotAgreementForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  return buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
}

function buildPilotEvidenceLedgerForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, publicBaseUrl(req));
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl: publicBaseUrl(req) });
  return buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution
  });
}

function buildAdoptionOperatingPlanForRequest(req: express.Request, input: WorkOrderBriefRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: input.workOrder
  });
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl });
  const ledger = buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution
  });
  const diligence = buildBuyerDiligenceRoom({
    proposal,
    handoff: execution,
    buyerScenario,
    valueBlueprint,
    recommendation,
    baseUrl
  });
  const sponsorReview = buildSponsorReviewRoom({
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence,
    execution
  });
  const proofPacket = buildBuyerProofPacket({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence,
    execution,
    sponsorReview
  });
  const sponsorDecisionReceipt = buildSponsorDecisionReceipt(sponsorReview);
  return buildAdoptionOperatingPlan({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder,
    workflow,
    pilotReceipt,
    agreement,
    ledger,
    proofPacketReceipt: proofPacket.receipt,
    sponsorDecisionReceipt
  });
}

function buildBuyerTrustCenterForRequest(req: express.Request, input: WorkOrderBriefRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: input.workOrder
  });
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl });
  const ledger = buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution
  });
  const adoptionPlan = buildAdoptionOperatingPlan({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder,
    workflow,
    pilotReceipt,
    agreement,
    ledger
  });
  return buildBuyerTrustCenter({
    recommendation,
    valueBlueprint,
    workOrder,
    workOrderInput: input.workOrder,
    pilotReceipt,
    agreement,
    ledger,
    adoptionPlan,
    workspace: input.workspace
  });
}

function buildCommercialOfferForRequest(req: express.Request, input: WorkOrderBriefRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const workOrder = buildBuyerWorkOrderBrief({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder: input.workOrder
  });
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl });
  const ledger = buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution
  });
  const adoptionPlan = buildAdoptionOperatingPlan({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workOrder,
    workflow,
    pilotReceipt,
    agreement,
    ledger
  });
  const trustCenter = buildBuyerTrustCenter({
    recommendation,
    valueBlueprint,
    workOrder,
    workOrderInput: input.workOrder,
    pilotReceipt,
    agreement,
    ledger,
    adoptionPlan,
    workspace: input.workspace
  });
  return buildCommercialOffer({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt,
    decisionMatrix,
    agreement,
    adoptionPlan,
    trustCenter
  });
}

function buyerPilotContractLinks(req: express.Request, suffix = querySuffix(req)): BuyerPilotContractLinks {
  const baseUrl = publicBaseUrl(req);
  return {
    valueReportUrl: `${baseUrl}/buyer-value${suffix}`,
    commercialOfferUrl: `${baseUrl}/commercial-offer${suffix}`,
    agreementUrl: `${baseUrl}/pilot-agreement${suffix}`,
    adoptionPlanUrl: `${baseUrl}/adoption-plan${suffix}`,
    trustCenterUrl: `${baseUrl}/trust-center${suffix}`,
    launchRoomUrl: `${baseUrl}/launch-room${suffix}`,
    jsonUrl: `${baseUrl}/api/buyer-pilot-contract${suffix}`,
    markdownUrl: `${baseUrl}/buyer-pilot-contract.md${suffix}`,
    appUrl: baseUrl
  };
}

function buildBuyerPilotContractForRequest(req: express.Request, input: WorkOrderBriefRequestInput, links = buyerPilotContractLinks(req)) {
  const valueReport = buildBuyerValueReportForRequest(req, input);
  const pilotReceipt = buildPilotRunReceiptForRequest(req, input);
  const agreement = buildPilotAgreementForRequest(req, input);
  const adoptionPlan = buildAdoptionOperatingPlanForRequest(req, input);
  const trustCenter = buildBuyerTrustCenterForRequest(req, input);
  const commercialOffer = buildCommercialOfferForRequest(req, input);
  return buildBuyerPilotContract({
    valueReport,
    pilotReceipt,
    agreement,
    adoptionPlan,
    trustCenter,
    commercialOffer,
    links
  });
}

function agendaStatusFrom(value: string): BuyerDecisionAgendaStatus {
  if (["ready", "share-ready", "buy-now", "trust-ready", "offer-ready", "ready-to-sign", "clear"].includes(value)) return "ready";
  if (["attention", "needs-evidence", "pilot-first", "needs-review", "needs-redlines", "watch"].includes(value)) return "attention";
  return "blocked";
}

function buyerDecisionFollowUpLinks(req: express.Request, suffix = querySuffix(req)) {
  const baseUrl = publicBaseUrl(req);
  return {
    agendaUrl: `${baseUrl}/procurement-decision${suffix}`,
    procurementDecisionUrl: `${baseUrl}/procurement-decision${suffix}`,
    proofPacketUrl: `${baseUrl}/buyer-proof-packet${suffix}`,
    trustCenterUrl: `${baseUrl}/trust-center${suffix}`,
    commercialOfferUrl: `${baseUrl}/commercial-offer${suffix}`,
    jsonUrl: `${baseUrl}/api/buyer-decision-follow-up${suffix}`,
    markdownUrl: `${baseUrl}/buyer-decision-follow-up.md${suffix}`,
    csvUrl: `${baseUrl}/buyer-decision-follow-up.csv${suffix}`,
    appUrl: baseUrl
  };
}

function buyerDecisionReceiptLinks(req: express.Request, suffix = querySuffix(req)) {
  const baseUrl = publicBaseUrl(req);
  return {
    procurementDecisionUrl: `${baseUrl}/procurement-decision${suffix}`,
    proofVerifierUrl: `${baseUrl}/buyer-proof-verifier${suffix}`,
    trustManifestUrl: `${baseUrl}/buyer-trust-manifest${suffix}`,
    followUpUrl: `${baseUrl}/buyer-decision-follow-up${suffix}`,
    jsonUrl: `${baseUrl}/api/buyer-decision-receipt${suffix}`,
    markdownUrl: `${baseUrl}/buyer-decision-receipt.md${suffix}`,
    appUrl: baseUrl
  };
}

function buyerReviewKitLinks(
  req: express.Request,
  suffix = querySuffix(req),
  reviewKitSuffix = suffix,
  validationAnswerRecordVerifierUrl?: string,
  replyRecordVerifierUrl?: string
): BuyerReviewKitLinks {
  const baseUrl = publicBaseUrl(req);
  return {
    trustManifestUrl: `${baseUrl}/buyer-trust-manifest${suffix}`,
    proofVerifierUrl: `${baseUrl}/buyer-proof-verifier${suffix}`,
    decisionReceiptUrl: `${baseUrl}/buyer-decision-receipt${suffix}`,
    validationAnswerRecordVerifierUrl,
    replyRecordVerifierUrl,
    followUpUrl: `${baseUrl}/buyer-decision-follow-up${suffix}`,
    acceptancePathUrl: `${baseUrl}/buyer-acceptance-path${suffix}`,
    jsonUrl: `${baseUrl}/api/buyer-review-kit${reviewKitSuffix}`,
    markdownUrl: `${baseUrl}/buyer-review-kit.md${reviewKitSuffix}`,
    appUrl: baseUrl
  };
}

function buyerAcceptancePathLinks(
  req: express.Request,
  suffix = querySuffix(req),
  acceptancePathSuffix = suffix,
  validationAnswerRecordVerifierUrl?: string,
  replyRecordVerifierUrl?: string
): BuyerAcceptancePathLinks {
  const baseUrl = publicBaseUrl(req);
  return {
    reviewKitUrl: `${baseUrl}/buyer-review-kit${acceptancePathSuffix}`,
    validationAnswerRecordVerifierUrl,
    replyRecordVerifierUrl,
    procurementDecisionUrl: `${baseUrl}/procurement-decision${suffix}`,
    commercialOfferUrl: `${baseUrl}/commercial-offer${suffix}`,
    adoptionPlanUrl: `${baseUrl}/adoption-plan${suffix}`,
    followUpUrl: `${baseUrl}/buyer-decision-follow-up${suffix}`,
    jsonUrl: `${baseUrl}/api/buyer-acceptance-path${acceptancePathSuffix}`,
    markdownUrl: `${baseUrl}/buyer-acceptance-path.md${acceptancePathSuffix}`,
    appUrl: baseUrl
  };
}

function buyerDecisionReceiptInput(req: express.Request) {
  const parsed = BuyerDecisionReceiptQuerySchema.safeParse(req.query);
  if (!parsed.success) return parsed;
  const input: BuyerDecisionReceiptInput = {
    choice: parsed.data.decision as BuyerDecisionReceiptChoice | undefined,
    reviewerName: parsed.data.reviewerName,
    buyerNote: parsed.data.buyerNote,
    conditionNote: parsed.data.conditionNote,
    decidedAt: parsed.data.decidedAt
  };
  return { success: true as const, input };
}

function buildBuyerDecisionFollowUpForRequest(req: express.Request, input: WorkOrderBriefRequestInput, links = buyerDecisionFollowUpLinks(req)) {
  const procurementDecision = buildBuyerProcurementDecisionForRequest(req, input);
  const proofPacket = buildBuyerProofPacketForRequest(req, input);
  const trustCenter = buildBuyerTrustCenterForRequest(req, input);
  const commercialOffer = buildCommercialOfferForRequest(req, input);
  const recommendedTier = commercialOffer.tiers.find((tier) => tier.id === commercialOffer.recommendedTierId) ?? commercialOffer.tiers[0];
  const proofStatus = agendaStatusFrom(proofPacket.readiness);
  const trustStatus = agendaStatusFrom(trustCenter.readiness);
  const commercialStatus = agendaStatusFrom(commercialOffer.readiness);
  const procurementStatus = agendaStatusFrom(procurementDecision.readiness);
  const contractStatus = agendaStatusFrom(procurementDecision.decisionContract.readiness);
  const agenda = buildBuyerDecisionAgendaSnapshot({
    proofChain: {
      status: proofStatus,
      verdict: proofPacket.readiness,
      score: proofPacket.packetScore,
      primaryAction: {
        label: proofPacket.nextAction ? `Fix ${proofPacket.nextAction.label}` : "Open proof packet",
        href: links.proofPacketUrl ?? "#",
        external: false
      }
    },
    publicDecisionPath: {
      status: procurementStatus,
      decision: procurementDecision.readiness === "buy-now" ? "send-to-buyer" : procurementDecision.readiness === "pilot-first" ? "sponsor-review" : "hold-internal",
      headline: procurementDecision.headline,
      buyerLine: procurementDecision.hardTruth,
      firstAction: {
        label: "Open procurement decision",
        href: links.procurementDecisionUrl ?? "#",
        external: false
      },
      guardrails: procurementDecision.decisionContract.stopRules.slice(0, 2)
    },
    pilotContract: {
      status: contractStatus,
      buyer: procurementDecision.targetBuyer,
      pilotOffer: procurementDecision.decisionContract.approvalAsk,
      firstCommitmentYen: procurementDecision.firstCommitmentYen,
      expectedMonthlyValueYen: procurementDecision.monthlyValueYen,
      paybackDays: procurementDecision.paybackDays,
      proofLine: procurementDecision.decisionContract.summary,
      stopRule: procurementDecision.decisionContract.stopRules[0] ?? "Stop if measured proof, trust, or public evidence no longer supports the buyer decision.",
      firstAction: {
        label: "Open decision contract",
        href: links.procurementDecisionUrl ?? "#",
        external: false
      },
      sendNote: {
        status: contractStatus,
        subject: procurementDecision.decisionContract.approvalAsk,
        instruction: procurementDecision.decisionContract.summary,
        body: [procurementDecision.hardTruth, procurementDecision.decisionContract.summary]
      }
    },
    trustSnapshot: {
      status: trustStatus,
      trustScore: trustCenter.trustScore,
      headline: trustCenter.headline,
      dataBoundary: trustCenter.dataBoundary,
      firstAction: {
        label: "Open trust center",
        href: links.trustCenterUrl ?? "#",
        external: false
      }
    },
    commercialOffer: {
      status: commercialStatus,
      recommendedTier: recommendedTier?.label ?? commercialOffer.recommendedTierId,
      firstCommitmentYen: commercialOffer.totalFirstCommitmentYen,
      expectedMonthlyValueYen: commercialOffer.expectedMonthlyValueYen,
      paybackDays: recommendedTier?.paybackDays ?? procurementDecision.paybackDays,
      contractLine: commercialOffer.contractAsk,
      firstAction: {
        label: "Open commercial offer",
        href: links.commercialOfferUrl ?? "#",
        external: false
      }
    }
  });

  return buildBuyerDecisionFollowUpLedger(agenda);
}

function buildBuyerDecisionReceiptForRequest(
  req: express.Request,
  input: WorkOrderBriefRequestInput,
  receiptInput: BuyerDecisionReceiptInput,
  suffix = querySuffix(req),
  links = buyerDecisionReceiptLinks(req, suffix)
) {
  const procurementDecision = buildBuyerProcurementDecisionForRequest(req, input);
  const followUpLedger = buildBuyerDecisionFollowUpForRequest(req, input, buyerDecisionFollowUpLinks(req, suffix));
  const manifest = buildBuyerTrustManifestForRequest(req, input, buyerTrustManifestLinks(req, suffix), buyerDecisionFollowUpLinks(req, suffix));
  const proofVerifier = buildBuyerProofVerifierReport({ manifest });
  return buildBuyerDecisionReceipt({
    procurementDecision,
    proofVerifier,
    trustManifest: manifest,
    followUpLedger,
    input: receiptInput,
    links
  });
}

function buildBuyerReviewKitForRequest(
  req: express.Request,
  input: WorkOrderBriefRequestInput,
  receiptInput: BuyerDecisionReceiptInput,
  suffix = querySuffix(req),
  links = buyerReviewKitLinks(req, suffix),
  validationAnswerRecord?: BuyerReviewKitValidationAnswerRecord,
  replyRecord?: BuyerReviewKitReplyRecord
) {
  const followUpLedger = buildBuyerDecisionFollowUpForRequest(req, input, buyerDecisionFollowUpLinks(req, suffix));
  const manifest = buildBuyerTrustManifestForRequest(req, input, buyerTrustManifestLinks(req, suffix), buyerDecisionFollowUpLinks(req, suffix));
  const proofVerifier = buildBuyerProofVerifierReport({ manifest });
  const decisionReceipt = buildBuyerDecisionReceiptForRequest(req, input, receiptInput, suffix, buyerDecisionReceiptLinks(req, suffix));
  return buildBuyerReviewKit({
    manifest,
    proofVerifier,
    decisionReceipt,
    followUpLedger,
    validationAnswerRecord,
    replyRecord,
    links
  });
}

function buildBuyerAcceptancePathForRequest(
  req: express.Request,
  input: WorkOrderBriefRequestInput,
  receiptInput: BuyerDecisionReceiptInput,
  suffix = querySuffix(req),
  links = buyerAcceptancePathLinks(req, suffix),
  validationAnswerRecord?: BuyerReviewKitValidationAnswerRecord,
  replyRecord?: BuyerReviewKitReplyRecord,
  reviewKitSuffix = suffix
) {
  const followUpLedger = buildBuyerDecisionFollowUpForRequest(req, input, buyerDecisionFollowUpLinks(req, suffix));
  const reviewKit = buildBuyerReviewKitForRequest(
    req,
    input,
    receiptInput,
    suffix,
    buyerReviewKitLinks(req, suffix, reviewKitSuffix, validationAnswerRecord?.verifierUrl, replyRecord?.verifierUrl),
    validationAnswerRecord,
    replyRecord
  );
  const procurementDecision = buildBuyerProcurementDecisionForRequest(req, input);
  const commercialOffer = buildCommercialOfferForRequest(req, input);
  const adoptionPlan = buildAdoptionOperatingPlanForRequest(req, input);
  return buildBuyerAcceptancePath({
    reviewKit,
    validationAnswerRecord,
    replyRecord,
    procurementDecision,
    commercialOffer,
    adoptionPlan,
    followUpLedger,
    links
  });
}

function buyerTrustManifestLinks(req: express.Request, suffix = querySuffix(req)): BuyerTrustManifestLinks {
  const baseUrl = publicBaseUrl(req);
  return {
    valueReportUrl: `${baseUrl}/buyer-value${suffix}`,
    workOrderUrl: `${baseUrl}/work-order-brief${suffix}`,
    pilotReceiptUrl: `${baseUrl}/pilot-run-receipt${suffix}`,
    ledgerUrl: `${baseUrl}/pilot-evidence-ledger${suffix}`,
    deliveryMemoUrl: `${baseUrl}/buyer-delivery-memo${suffix}`,
    proofPacketUrl: `${baseUrl}/buyer-proof-packet${suffix}`,
    sponsorReviewUrl: `${baseUrl}/sponsor-review${suffix}`,
    adoptionPlanUrl: `${baseUrl}/adoption-plan${suffix}`,
    trustCenterUrl: `${baseUrl}/trust-center${suffix}`,
    commercialOfferUrl: `${baseUrl}/commercial-offer${suffix}`,
    buyerPilotContractUrl: `${baseUrl}/buyer-pilot-contract${suffix}`,
    agreementUrl: `${baseUrl}/pilot-agreement${suffix}`,
    launchRoomUrl: `${baseUrl}/launch-room${suffix}`,
    decisionFollowUpUrl: `${baseUrl}/buyer-decision-follow-up${suffix}`,
    proofAuditUrl: `${baseUrl}/buyer-proof-audit${suffix}`,
    jsonUrl: `${baseUrl}/api/buyer-trust-manifest${suffix}`,
    markdownUrl: `${baseUrl}/buyer-trust-manifest.md${suffix}`,
    wellKnownUrl: `${baseUrl}/.well-known/buyer-proof.json`,
    verifierUrl: `${baseUrl}/buyer-proof-verifier${suffix}`,
    appUrl: baseUrl
  };
}

function buildBuyerTrustManifestForRequest(
  req: express.Request,
  input: WorkOrderBriefRequestInput,
  links = buyerTrustManifestLinks(req),
  followUpLinks = buyerDecisionFollowUpLinks(req),
  generatedAt?: string
) {
  const proofPacket = buildBuyerProofPacketForRequest(req, input);
  const sponsorReview = buildSponsorReviewRoomForRequest(req, input);
  const sponsorDecisionReceipt = buildSponsorDecisionReceipt(sponsorReview);
  const adoptionPlan = buildAdoptionOperatingPlanForRequest(req, input);
  const trustCenter = buildBuyerTrustCenterForRequest(req, input);
  const commercialOffer = buildCommercialOfferForRequest(req, input);
  const buyerPilotContract = buildBuyerPilotContractForRequest(req, input, {
    valueReportUrl: links.valueReportUrl,
    commercialOfferUrl: links.commercialOfferUrl,
    agreementUrl: links.agreementUrl,
    adoptionPlanUrl: links.adoptionPlanUrl,
    trustCenterUrl: links.trustCenterUrl,
    launchRoomUrl: links.launchRoomUrl,
    appUrl: links.appUrl
  });
  const decisionFollowUpLedger = buildBuyerDecisionFollowUpForRequest(req, input, followUpLinks);
  const buyerEvidenceBoardInput = launchRoomInputFromWorkOrderInput(input, generatedAt);
  const buyerEvidenceBoard = buildBuyerEvidenceBoardForRequest(req, buyerEvidenceBoardInput);
  const manifestLinks = {
    ...links,
    buyerEvidenceBoardUrl: links.buyerEvidenceBoardUrl ?? launchRoomShareUrl(req, buyerEvidenceBoardInput, "/buyer-evidence-board")
  };
  return buildBuyerTrustManifest({
    proofPacket,
    sponsorReview,
    sponsorDecisionReceipt,
    adoptionPlan,
    trustCenter,
    commercialOffer,
    buyerPilotContract,
    decisionFollowUpLedger,
    buyerEvidenceBoardReceipt: buyerEvidenceBoard.receipt,
    generatedAt,
    links: manifestLinks
  });
}

function buyerProofRoomLinks(req: express.Request, suffix = querySuffix(req)): BuyerProofRoomLinks {
  const baseUrl = publicBaseUrl(req);
  return {
    roomUrl: `${baseUrl}${BUYER_PROOF_ROOM_PATH}${suffix}`,
    jsonUrl: `${baseUrl}/api${BUYER_PROOF_ROOM_PATH}${suffix}`,
    markdownUrl: `${baseUrl}${BUYER_PROOF_ROOM_PATH}.md${suffix}`,
    trustManifestUrl: `${baseUrl}${BUYER_PROOF_ROOM_PATH}/manifest${suffix}`,
    trustManifestJsonUrl: `${baseUrl}/api${BUYER_PROOF_ROOM_PATH}/manifest${suffix}`,
    proofVerifierUrl: `${baseUrl}${BUYER_PROOF_ROOM_PATH}/verifier${suffix}`,
    proofVerifierApiUrl: `${baseUrl}${BUYER_PROOF_VERIFIER_API_PATH}`,
    pilotContractUrl: `${baseUrl}/buyer-pilot-contract${suffix}`,
    receiptVerifierUrl: `${baseUrl}${RECEIPT_VERIFICATION_DESK_PATH}${suffix}`,
    decisionReceiptUrl: `${baseUrl}/buyer-decision-receipt${suffix}`,
    reviewKitUrl: `${baseUrl}/buyer-review-kit${suffix}`,
    acceptancePathUrl: `${baseUrl}/buyer-acceptance-path${suffix}`,
    appUrl: baseUrl,
    heroImageUrl: `${baseUrl}/assets/agent-marketplace-hero.webp`
  };
}

function buyerProofRoomPublicSuffix(parsed: { sample?: boolean; suffix: string }) {
  return parsed.sample ? "" : parsed.suffix;
}

function buyerProofRoomManifestLinks(req: express.Request, suffix = querySuffix(req)) {
  const baseUrl = publicBaseUrl(req);
  return {
    ...buyerTrustManifestLinks(req, suffix),
    jsonUrl: `${baseUrl}/api${BUYER_PROOF_ROOM_PATH}/manifest${suffix}`,
    markdownUrl: `${baseUrl}${BUYER_PROOF_ROOM_PATH}/manifest.md${suffix}`,
    verifierUrl: `${baseUrl}${BUYER_PROOF_ROOM_PATH}/verifier${suffix}`
  };
}

function buyerProofRoomManifestGeneratedAt(req: express.Request) {
  const value = req.query[BUYER_PROOF_ROOM_MANIFEST_AT_PARAM];
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string" || candidate.length > 80) return undefined;
  return Number.isNaN(Date.parse(candidate)) ? undefined : candidate;
}

function urlWithQueryParam(href: string, key: string, value: string | undefined) {
  if (!value) return href;
  const url = new URL(href);
  url.searchParams.set(key, value);
  return url.toString();
}

function buildBuyerProofRoomForRequest(
  req: express.Request,
  input: WorkOrderBriefRequestInput,
  suffix = querySuffix(req),
  links = buyerProofRoomLinks(req, suffix),
  generatedAt = new Date().toISOString()
) {
  const manifestLinks = buyerProofRoomManifestLinks(req, suffix);
  const manifest = buildBuyerTrustManifestForRequest(req, input, manifestLinks, buyerDecisionFollowUpLinks(req, suffix), generatedAt);
  const proofVerifier = buildBuyerProofVerifierReport({ manifest });
  const pilotContract = buildBuyerPilotContractForRequest(req, input, buyerPilotContractLinks(req, suffix));
  return buildBuyerProofRoom({
    manifest,
    proofVerifier,
    pilotContract,
    links
  });
}

function buildSponsorReviewRoomForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl });
  const ledger = buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution
  });
  const diligence = buildBuyerDiligenceRoom({
    proposal,
    handoff: execution,
    buyerScenario,
    valueBlueprint,
    recommendation,
    baseUrl
  });
  return buildSponsorReviewRoom({
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence,
    execution
  });
}

function buildBuyerProofPacketForRequest(req: express.Request, input: BuyerProposalRequestInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds, 260, mergeAgentCatalog(input.customAgents));
  const valueBlueprint = buildValueBlueprint(recommendation, input.projectBrief, baseUrl);
  const buyerScenario = buildBuyerValueScenario(recommendation, input.buyerScenario);
  const proposal = buildPilotProposal({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workspace: input.workspace
  });
  const workflow = buildPilotWorkflowPlan({
    recommendation,
    valueBlueprint,
    buyerScenario
  });
  const pilotReceipt = buildPilotRunReceipt({
    recommendation,
    valueBlueprint,
    buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  const decisionMatrix = buildBuyerDecisionMatrix({
    recommendation,
    valueBlueprint,
    buyerScenario,
    pilotReceipt
  });
  const agreement = buildPilotAgreement({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    decisionMatrix,
    pilotReceipt
  });
  const execution = buildPilotExecutionHandoff({ proposal, recommendation, baseUrl });
  const ledger = buildPilotEvidenceLedger({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    execution
  });
  const diligence = buildBuyerDiligenceRoom({
    proposal,
    handoff: execution,
    buyerScenario,
    valueBlueprint,
    recommendation,
    baseUrl
  });
  const sponsorReview = buildSponsorReviewRoom({
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence,
    execution
  });
  return buildBuyerProofPacket({
    recommendation,
    valueBlueprint,
    buyerScenario,
    proposal,
    workflow,
    pilotReceipt,
    decisionMatrix,
    agreement,
    ledger,
    diligence,
    execution,
    sponsorReview
  });
}

function agentCard(baseUrl: string) {
  return {
    protocolVersion: "0.3.0",
    name: "Agent-To-Agent Marketplace Broker",
    description:
      "必要な能力を持つAIエージェントを市場から探索し、スキル/MCP/A2A能力を数値化して、DevOps改善タスクを委任するブローカー。",
    url: `${baseUrl}/a2a`,
    preferredTransport: "JSONRPC",
    provider: {
      organization: "A2A Agent Marketplace",
      url: baseUrl
    },
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["application/json"],
    metadata: {
      proof: {
        buyerProofRoomEndpoint: `${baseUrl}${BUYER_PROOF_ROOM_PATH}`,
        buyerProofRoomJsonEndpoint: `${baseUrl}/api${BUYER_PROOF_ROOM_PATH}`,
        buyerProofRoomMarkdownEndpoint: `${baseUrl}${BUYER_PROOF_ROOM_PATH}.md`,
        buyerTrustManifestEndpoint: `${baseUrl}/buyer-trust-manifest`,
        buyerTrustManifestJsonEndpoint: `${baseUrl}/api/buyer-trust-manifest`,
        buyerTrustManifestMarkdownEndpoint: `${baseUrl}/buyer-trust-manifest.md`,
        buyerTrustManifestWellKnownEndpoint: `${baseUrl}/.well-known/buyer-proof.json`,
        buyerTrustManifestReceiptVerifyEndpoint: `${baseUrl}${BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH}`,
        buyerProofVerifierEndpoint: `${baseUrl}/buyer-proof-verifier`,
        buyerProofVerifierJsonEndpoint: `${baseUrl}${BUYER_PROOF_VERIFIER_API_PATH}`,
        receiptVerifierEndpoint: `${baseUrl}${RECEIPT_VERIFICATION_DESK_PATH}`,
        receiptVerifierJsonEndpoint: `${baseUrl}${RECEIPT_VERIFICATION_DESK_API_PATH}`,
        buyerEvidenceBoardEndpoint: `${baseUrl}/buyer-evidence-board`,
        buyerEvidenceBoardJsonEndpoint: `${baseUrl}/api/buyer-evidence-board`,
        buyerEvidenceBoardMarkdownEndpoint: `${baseUrl}/buyer-evidence-board.md`,
        buyerEvidenceBoardReceiptVerifyEndpoint: `${baseUrl}${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}`,
        buyerDecisionFollowUpEndpoint: `${baseUrl}/buyer-decision-follow-up`,
        buyerDecisionFollowUpJsonEndpoint: `${baseUrl}/api/buyer-decision-follow-up`,
        buyerDecisionFollowUpMarkdownEndpoint: `${baseUrl}/buyer-decision-follow-up.md`,
        buyerDecisionFollowUpCsvEndpoint: `${baseUrl}/buyer-decision-follow-up.csv`,
        buyerDecisionReceiptEndpoint: `${baseUrl}/buyer-decision-receipt`,
        buyerDecisionReceiptJsonEndpoint: `${baseUrl}/api/buyer-decision-receipt`,
        buyerDecisionReceiptMarkdownEndpoint: `${baseUrl}/buyer-decision-receipt.md`,
        buyerDecisionReceiptVerifyEndpoint: `${baseUrl}${BUYER_DECISION_RECEIPT_VERIFY_PATH}`,
        buyerReviewKitEndpoint: `${baseUrl}/buyer-review-kit`,
        buyerReviewKitJsonEndpoint: `${baseUrl}/api/buyer-review-kit`,
        buyerReviewKitMarkdownEndpoint: `${baseUrl}/buyer-review-kit.md`,
        buyerAcceptancePathEndpoint: `${baseUrl}/buyer-acceptance-path`,
        buyerAcceptancePathJsonEndpoint: `${baseUrl}/api/buyer-acceptance-path`,
        buyerAcceptancePathMarkdownEndpoint: `${baseUrl}/buyer-acceptance-path.md`,
        buyerAcceptancePathReceiptVerifyEndpoint: `${baseUrl}${BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH}`,
        buyerPilotContractEndpoint: `${baseUrl}/buyer-pilot-contract`,
        buyerPilotContractJsonEndpoint: `${baseUrl}/api/buyer-pilot-contract`,
        buyerPilotContractMarkdownEndpoint: `${baseUrl}/buyer-pilot-contract.md`,
        buyerPilotContractReceiptVerifyEndpoint: `${baseUrl}${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}`,
        globalPublishabilityEndpoint: `${baseUrl}/global-publishability`,
        globalPublishabilityJsonEndpoint: `${baseUrl}/api/global-publishability`,
        globalPublishabilityMarkdownEndpoint: `${baseUrl}/global-publishability.md`,
        buyerDeliveryMemoEndpoint: `${baseUrl}/buyer-delivery-memo`,
        buyerDeliveryMemoJsonEndpoint: `${baseUrl}/api/buyer-delivery-memo`,
        buyerDeliveryMemoMarkdownEndpoint: `${baseUrl}/buyer-delivery-memo.md`,
        buyerProofAuditEndpoint: `${baseUrl}/buyer-proof-audit`,
        buyerProofAuditJsonEndpoint: `${baseUrl}/api/buyer-proof-audit`,
        buyerProofAuditMarkdownEndpoint: `${baseUrl}/buyer-proof-audit.md`,
        sampleBuyerProofAuditEndpoint: `${baseUrl}${SAMPLE_BUYER_PROOF_AUDIT_PATH}`,
        sampleBuyerProofAuditJsonEndpoint: `${baseUrl}/api/sample/buyer-proof-audit`,
        sampleBuyerProofAuditMarkdownEndpoint: `${baseUrl}${SAMPLE_BUYER_PROOF_AUDIT_PATH}.md`,
        submissionAssetsEndpoint: `${baseUrl}/submission-assets`,
        submissionAssetsJsonEndpoint: `${baseUrl}/api/submission-assets`,
        workflowIntakeExtractEndpoint: `${baseUrl}${WORKFLOW_INTAKE_EXTRACT_API_PATH}`,
        workflowIntakeExtractVerifyEndpoint: `${baseUrl}${WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH}`,
        ...agentCardDiligenceEndpointSet(baseUrl),
        ...agentCardShortlistEndpointSet(baseUrl),
        ...agentCardTrialPlanEndpointSet(baseUrl),
        ...agentCardTrialVerificationEndpointSet(baseUrl),
        ...agentCardTrialHandoffEndpointSet(baseUrl)
      }
    },
    skills: [
      {
        id: "market.discover",
        name: "Discover AI agents by capability",
        description: "プロジェクトブリーフから必要能力を抽出し、A2A/MCP/スキル成熟度で候補をランク付けする。",
        tags: ["marketplace", "a2a", "mcp", "devops"],
        examples: ["Cloud Runへ出す前に足りない能力を持つAIを探して"]
      },
      {
        id: "agent-card.discover",
        name: "Import a public Agent Card",
        description: "公開Agent Card URLを検証付きで取得し、マーケット候補として採用できる能力カードへ変換する。",
        tags: ["agent-card", "marketplace", "discovery", "ssrf-guard"],
        examples: [`${SUBMISSION_PROOF.deployedUrl}/.well-known/agent-card.json を候補として取り込んで`]
      },
      {
        id: AGENT_CARD_DILIGENCE_SKILL_ID,
        name: "Publish an Agent Card diligence report",
        description: "公開Agent Card URLをライブ取得し、買い手向けの採用可否、リスク、試験タスク、修復アクションをHTML/JSON/Markdownで返す。",
        tags: ["agent-card", "diligence", "buyer-value", "live-proof", "get-proof"],
        examples: [`${SUBMISSION_PROOF.deployedUrl}/.well-known/agent-card.json の採用可否を買い手向けに監査して`]
      },
      {
        id: AGENT_CARD_SHORTLIST_SKILL_ID,
        name: "Compare public Agent Cards for a buyer shortlist",
        description: "複数の公開Agent Cardをライブ取得し、採用候補、proof task候補、reject候補へ順位付けして共有可能なshortlistを返す。",
        tags: ["agent-card", "shortlist", "buyer-value", "procurement", "live-proof", "get-proof"],
        examples: ["3つのAgent Card URLを比較して、最初に試すべき候補と却下理由を出して"]
      },
      {
        id: AGENT_CARD_TRIAL_PLAN_SKILL_ID,
        name: "Generate a supervised Agent Card trial plan",
        description: "公開Agent Cardをライブ監査し、A2A message/send payload、受入条件、証拠契約、停止条件を含む買い手向けtrial planを返す。",
        tags: ["agent-card", "trial-plan", "buyer-value", "a2a", "live-proof", "get-proof"],
        examples: ["このAgent Cardを安全に試すためのA2A trial planを作って"]
      },
      {
        id: AGENT_CARD_TRIAL_VERIFICATION_SKILL_ID,
        name: "Verify an Agent Card trial response",
        description: "trial planに返されたJSONレスポンスをreceiptId、skillId、公開artifact、証拠source、安全境界で検証し、買い手向けreceipt判定を返す。",
        tags: ["agent-card", "trial-verification", "buyer-value", "proof-receipt", "get-proof"],
        examples: ["このAgent Card trial responseを買い手に添付してよいか検証して"]
      },
      {
        id: AGENT_CARD_TRIAL_HANDOFF_SKILL_ID,
        name: "Attach an Agent Card trial to a buyer workspace",
        description: "accepted trial verificationをworkspace evidenceへ変換し、launch room、proof packet、procurement decision、proof monitorへの共有リンクを返す。",
        tags: ["agent-card", "trial-handoff", "buyer-workspace", "proof-receipt", "get-proof"],
        examples: ["検証済みのAgent Card trial receiptを買い手用workspaceに接続して"]
      },
      {
        id: "agent.hire",
        name: "Hire a squad",
        description: "予算内でエージェントを購入し、企画・実装・運用・統制スコアの改善量を返す。",
        tags: ["gamification", "capability-score", "squad"]
      },
      {
        id: "contract.issue",
        name: "Issue agent contracts",
        description: "選択したAIごとの成果物、受入条件、SLA、検証コマンド、支払い条件を生成する。",
        tags: ["contract", "procurement", "acceptance", "sla", "marketplace"]
      },
      {
        id: "task.delegate",
        name: "Delegate DevOps task",
        description: "選ばれたエージェントへA2A message/send形式で検証可能な仕事票、受入条件、証拠URLを渡す。",
        tags: ["json-rpc", "handoff", "cloud-run"]
      },
      {
        id: "strategy.audit",
        name: "Audit competitive strategy",
        description: "競合、SWOT、審査スコア、提出準備を評価し、次に雇うべきAI能力を返す。",
        tags: ["competitive-analysis", "swot", "judge-score", "submission"]
      },
      {
        id: "value.blueprint",
        name: "Build a buyer-ready value blueprint",
        description: "プロジェクトbriefと選択AIから、対象ユーザー、ROI、導入ロードマップ、検収条件、エクスポート可能なMarkdownを生成する。",
        tags: ["buyer-value", "roi", "pilot-plan", "acceptance", "markdown-export"]
      },
      {
        id: "buyer.proposal",
        name: "Open a shareable buyer pilot proposal",
        description: "現在のbrief、選択AI、ROI前提、公開URLから、買い手が直接開ける提案ページとJSON/Markdown receiptを生成する。",
        tags: ["buyer-value", "pilot-proposal", "shareable-page", "roi", "get-proof"]
      },
      {
        id: "workflow.intake.extract",
        name: "Extract a buyer pilot room from a workflow note",
        description: "雑多なworkflow noteをGemini支援または監査済みfallbackでbuyer、価値モデル、実測run、proof repair、A2A trial evidenceへ構造化する。",
        tags: ["buyer-value", "workflow-intake", "gemini", "proof-repair", "a2a"],
        examples: ["買い手の業務メモからpilot roomとproof repair planを作って"]
      },
      {
        id: "workflow.intake.extract.verify",
        name: "Verify a workflow intake extraction receipt",
        description: "buyer room抽出のreplay payloadとchecksumを照合し、転送されたAI抽出結果が改ざんされていないか検証する。",
        tags: ["buyer-value", "workflow-intake", "receipt", "verification", "get-proof"],
        examples: ["このworkflow intake receiptが元の抽出結果と一致するか検証して"]
      },
      {
        id: "pilot.execute",
        name: "Open a buyer pilot execution handoff",
        description: "買い手向け提案を、担当者・証拠ゲート・継続/修正/停止条件付きの実行引き継ぎに変換する。",
        tags: ["pilot-execution", "handoff", "buyer-value", "get-proof"]
      },
      {
        id: "buyer.diligence",
        name: "Open a buyer due diligence room",
        description: "提案、実行引き継ぎ、ROI、証拠ギャップ、リスク、承認質問を1つの買い手向け確認室にまとめる。",
        tags: ["buyer-value", "due-diligence", "approval", "risk-register", "get-proof"]
      },
      {
        id: "sponsor.review",
        name: "Open a sponsor review room",
        description: "提案、実行証拠、決裁条件をスポンサー向けQ&Aに束ね、承認前に残っている証拠ギャップを示す。",
        tags: ["buyer-value", "sponsor-review", "approval", "proof-ledger", "get-proof"]
      },
      {
        id: "buyer.proof-packet",
        name: "Open a buyer proof packet",
        description: "ROI、実測、調達判断、契約境界、スポンサーQ&Aを1つの買い手向け証拠パックに束ねる。",
        tags: ["buyer-value", "proof-packet", "approval", "export", "get-proof"]
      },
      {
        id: "buyer.adoption-plan",
        name: "Open a buyer adoption operating plan",
        description: "買い手価値、仕事票、実測receipt、証拠ledger、契約条件を30日運用cadence・owner・介入条件・拡張基準へ束ねる。",
        tags: ["buyer-value", "adoption", "operating-plan", "customer-success", "get-proof"]
      },
      {
        id: "buyer.trust-center",
        name: "Open a buyer trust center",
        description: "データ境界、Security owner、Agent trial proof、実測receipt、監査trail、stop ruleを買い手向けの信頼artifactに束ねる。",
        tags: ["buyer-value", "trust-center", "security", "data-boundary", "get-proof"]
      },
      {
        id: "buyer.commercial-offer",
        name: "Open a proof-backed commercial offer",
        description: "ROI、実測receipt、decision matrix、契約cap、adoption gate、trust gateから価格・範囲・更新条件を買い手向けofferに束ねる。",
        tags: ["buyer-value", "commercial-offer", "pricing", "procurement", "get-proof"]
      },
      {
        id: "buyer.pilot-contract",
        name: "Open a receipt-backed buyer pilot contract",
        description: "価値report、商用offer、pilot agreement、adoption plan、trust centerを、承認条件・停止条件・検証receipt付きの買い手pilot contractに束ねる。",
        tags: ["buyer-value", "pilot-contract", "receipt-verification", "procurement", "get-proof"]
      },
      {
        id: "buyer.proof-room",
        name: "Open a buyer proof room",
        description: "Value、contract、trust manifest、proof verifier、receipt deskを、外部レビュアーが最初に開く公開proof roomへ束ねる。",
        tags: ["buyer-value", "proof-room", "external-review", "receipt-verification", "get-proof"]
      },
      {
        id: "buyer.trust-manifest",
        name: "Open a buyer trust manifest",
        description: "Proof packet digest、sponsor decision、adoption gate、trust center、commercial offerを外部監査可能なJSON/HTML manifestへ束ねる。",
        tags: ["buyer-value", "trust-manifest", "machine-readable", "proof-receipt", "get-proof"]
      },
      {
        id: "buyer.proof-verifier",
        name: "Verify a buyer trust manifest",
        description: "受け取ったbuyer trust manifestをdigest、artifact drift、publication gate、review windowで再検証し、外部レビュー用reportへ束ねる。",
        tags: ["buyer-value", "proof-verifier", "machine-readable", "receipt-verification", "get-proof"]
      },
      {
        id: "receipt.verifier",
        name: "Verify an exported buyer receipt",
        description: "Proof packet、evidence board、trust manifest、commercial offer、pilot contractのverification requestを自動判定し、該当する厳密verifierへルーティングする。",
        tags: ["buyer-value", "receipt-verification", "proof-receipt", "external-review", "get-proof"]
      },
      {
        id: "buyer.decision-receipt",
        name: "Issue a buyer decision receipt",
        description: "検証済みproof、調達判断、契約条件、follow-up ledgerからcontinue/revise/stopを記録し、checksum検証できるbuyer receiptを発行する。",
        tags: ["buyer-value", "decision-receipt", "procurement", "proof-receipt", "get-proof"]
      },
      {
        id: "buyer.review-kit",
        name: "Open a buyer review kit",
        description: "Trust manifest、proof verifier、decision receipt、follow-up ledgerを4ステップの外部レビュー手順として束ねる。",
        tags: ["buyer-value", "review-kit", "proof-verification", "decision-receipt", "get-proof"]
      },
      {
        id: "buyer.acceptance-path",
        name: "Open a buyer acceptance path",
        description: "外部レビュー、調達判断、商用条件、導入運用、owner follow-upをgo/no-go承認パスとして束ねる。",
        tags: ["buyer-value", "acceptance-path", "go-no-go", "procurement", "get-proof"]
      },
      {
        id: GLOBAL_PUBLISHABILITY_SKILL_ID,
        name: "Open the global publishability report",
        description: "公開URL、実測価値、proof dossier、運用/信頼境界、buyer decision pathをhard gateで束ね、公開してよいかを判定する。",
        tags: ["publishability", "global-launch", "buyer-value", "live-proof", "go-no-go", "get-proof"]
      },
      {
        id: "buyer.delivery-memo",
        name: "Publish a live-verified buyer delivery memo",
        description: "現在のbuyer workspaceから証拠URLをライブ検査し、買い手へ送れる/内部レビュー/保留の判断付きdelivery memoをHTML/JSON/Markdownで返す。",
        tags: ["buyer-value", "delivery-memo", "live-proof", "current-workspace", "get-proof"]
      },
      {
        id: "buyer.proof-audit.current",
        name: "Run the current buyer proof audit",
        description: "現在のworkspace queryからdeployed URL、ProtoPedia、動画、pilot receipt、work order proofをライブ検査し、修復先つきのauditを返す。",
        tags: ["buyer-value", "proof-audit", "current-workspace", "live-proof", "get-proof"]
      },
      {
        id: "buyer.procurement-decision",
        name: "Open a procurement decision proof",
        description: "仕事票、ROI、実測receipt、data boundary、public proofを、買い手がそのまま共有できるbuy/pilot/hold判断ページに束ねる。",
        tags: ["buyer-value", "procurement", "decision-proof", "pilot-receipt", "get-proof"]
      },
      {
        id: BUYER_PROOF_AUDIT_SKILL_ID,
        name: "Run a live buyer proof audit",
        description: "公開product、Agent Card、仕事票、実測receipt、調達判断ページを実際に検査し、買い手が共有できるproof audit receiptに束ねる。",
        tags: ["buyer-value", "proof-audit", "live-proof", "cloud-run", "get-proof"]
      },
      {
        id: "market.intel",
        name: "Build source-backed market intelligence",
        description: "公式ソース付き競合比較、差別化仮説、審査回答、次アクションを提出向けに返す。",
        tags: ["market-intelligence", "competitive-analysis", "sources", "swot", "judge-score"]
      },
      {
        id: "moat.stress",
        name: "Stress-test competitive moat",
        description: "ADK、A2A Marketplace、LangGraph、CrewAI、Dify、AgentOpsからの反論を想定し、証拠付き回答と録画順を返す。",
        tags: ["competitive-analysis", "moat", "judge-qa", "swot", "proof"]
      },
      {
        id: "competitive.battlecard",
        name: "Build competitor battlecards",
        description: "公式ソース、SWOT、競合反論、Criteria Duel、見せる証拠を競合別の審査回答カードに束ね、Competitive Proof Lockで検収する。",
        tags: ["competitive-analysis", "battlecard", "swot", "judge-qa", "criteria-duel", COMPETITIVE_WIN_LOSS_LOCK_TAG, "proof", "proof-lock"]
      },
      {
        id: "competitive.snapshot",
        name: "Open competitive SWOT snapshot",
        description: "6競合、SWOT 4象限、公式ソース、Criteria Duel、Proof LockをGETで読める審査用HTMLへ束ねる。",
        tags: ["competitive-analysis", "swot", "source-ledger", "judge-qa", "get-proof"]
      },
      {
        id: COMPETITIVE_DECISION_MATRIX_SKILL_ID,
        name: "Open head-to-head competitive decision matrix",
        description: "5審査項目 x 主要競合の勝敗、SWOT signal、開く証拠URLをGET証拠ページに束ねる。",
        tags: ["competitive-analysis", "swot", "head-to-head", COMPETITIVE_DECISION_MATRIX_LOCK_TAG, "judge-qa", "get-proof"]
      },
      {
        id: "judge.snapshot",
        name: "Open the public reviewer proof snapshot",
        description: "POST専用の深い証拠群を、外部レビュー担当者がGETで直接開ける初回証拠スナップショットへ束ねる。",
        tags: ["reviewer-snapshot", "get-proof", "first-click", "proof"]
      },
      {
        id: FIRST_CLICK_SKILL_ID,
        name: "Route the reviewer first click",
        description: "トップ画面直下から14本のGET証拠ページへ迷わず到達できる初回レビュー導線を固定する。",
        tags: ["first-click", FIRST_CLICK_ROUTE_LOCK_TAG, "get-proof", "win-autopilot", "reviewer-snapshot", "winner-packet", "objection-arena", "competitive-decision-matrix", "mvp-readiness", "deploy-recovery", "architecture-pack", "publication-launch"]
      },
      {
        id: FIRST_CLICK_SMOKE_SKILL_ID,
        name: "Smoke-test first-click proof pages",
        description: "First-ClickのGET証拠ページがSPA fallbackではなく固有のレビュー証拠HTMLを返しているかをsentinelで検収する。",
        tags: ["first-click", FIRST_CLICK_SMOKE_LOCK_TAG, "smoke-test", "get-proof", "release-drift"]
      },
      {
        id: "mvp.audit",
        name: "Audit MVP readiness with hard gates",
        description: "必須技術、審査5項目、DevOps証拠、提出3点をハードゲートで判定し、未達をwatch/failとして返す。",
        tags: ["mvp", "audit", "hard-gates", "judge-score", "submission"]
      },
      {
        id: "mvp.snapshot",
        name: "Open the MVP readiness snapshot",
        description: "MVP Audit、Acceptance Matrix、Release Drift、外部提出gapをGETで読める提出可否ページへ束ねる。",
        tags: ["mvp", "readiness", "acceptance", "release-drift", "get-proof"]
      },
      {
        id: ACCEPTANCE_MATRIX_SKILL_ID,
        name: "Build the reviewer acceptance matrix",
        description: "必須技術、レビュー基準、公開証拠、共有物、receiptをGET証拠ページのaccepted/watch/blocked受入表に束ねる。",
        tags: ["acceptance", ACCEPTANCE_MATRIX_LOCK_TAG, "mvp", "review-score", "proof", "publication", "get-proof"]
      },
      {
        id: "judge.brief",
        name: "Build the one-page reviewer brief",
        description: "競合差別化、MVP監査、証拠、30秒導線、残リスクを外部レビュー担当者向けの1枚に束ねる。",
        tags: ["reviewer-brief", "mvp", "market-intelligence", "publication"]
      },
      {
        id: JUDGE_COMMAND_SKILL_ID,
        name: "Build the reviewer command center",
        description: "Reviewer Tour、Acceptance Matrix、Release Drift、Pilot Economics、Win Autopilotを初回レビュー導線のGET証拠ページへ束ねる。",
        tags: ["reviewer-command", JUDGE_COMMAND_LOCK_TAG, "first-run", "acceptance", "release-drift", "proof", "get-proof"]
      },
      {
        id: "judge.rehearsal",
        name: "Rehearse the 90-second reviewer run",
        description: "Reviewer Command、Reviewer Concierge、Prize Strategy、Reviewer Drill、Closeoutを90秒台本、Recording Lock、最終質疑Defense Lockへ束ねる。",
        tags: ["reviewer-rehearsal", "proof", "recording-lock", "first-run", "usability", "pitch", "qa-defense"]
      },
      {
        id: "winner.packet",
        name: "Package reviewer proof for decision criteria",
        description: "レビュー基準ごとに主張、証拠URL、競合/SWOT反論、録画cue、公開copyを1枚の証拠packetへ束ねる。",
        tags: ["reviewer-packet", "review-score", "proof", "swot", "pitch", "winner-release-lock", "release-drift", "get-proof"]
      },
      {
        id: WINNER_SUFFICIENCY_SKILL_ID,
        name: "Decide if the project is adoption-sufficient",
        description: "MVP、競合/SWOT、公開証拠、first-click、feature freeze、公開URLを束ね、採用候補として十分かをyes/no判定する。",
        tags: ["adoption-sufficiency", WINNER_SUFFICIENCY_LOCK_TAG, "get-proof", "mvp", "competitive-analysis", "swot", "publication"]
      },
      {
        id: "judge.objection-arena",
        name: "Answer final reviewer objections",
        description: "Proof Packetから、競合/SWOT、AI中心性、実用性、公開revisionへの厳しい質問を証拠URL付きの最終質疑レーンへ束ねる。",
        tags: ["reviewer-qa", "objection-lock", "competitive-analysis", "swot", "get-proof"]
      },
      {
        id: PRIZE_STRATEGY_SKILL_ID,
        name: "Build the prize strategy board",
        description: "審査5項目の目標点、現在証拠、Prize Usability Lock、Prize Criteria Lock、最終ピッチ順をGET証拠ページ付きの優勝作戦へ束ねる。",
        tags: ["prize-strategy", PRIZE_STRATEGY_LOCK_TAG, "judge-score", "pitch", "swot", "proof", "usability-lock", "criteria-lock", "get-proof"]
      },
      {
        id: "win.gap.radar",
        name: "Turn competitive analysis into MVP gap bets",
        description: "競合分析、SWOT、MVP監査、最終候補判定、提出ゲートを横断し、勝つために閉じる機能仮説、Feature Freeze Lock、cut listを返す。",
        tags: ["mvp", "competitive-analysis", "swot", "gap-radar", "feature-freeze-lock", "winning-strategy"]
      },
      {
        id: "judge.tour",
        name: "Build the 90-second reviewer walkthrough",
        description: "外部レビュー担当者が開く順番、話す台詞、反論、証拠リンク、残ブロッカーを90秒導線へ束ねる。",
        tags: ["reviewer-tour", "walkthrough", "evidence", "publication"]
      },
      {
        id: "user.pilot",
        name: "Run target-user first-run pilot",
        description: "開発リード、Platform/SRE、提出者が最初の3分で価値へ到達できるかを検証する。",
        tags: ["usability", "pilot", "persona", "first-run", "judge-score"]
      },
      {
        id: "squad.optimize",
        name: "Optimize the winning squad under budget",
        description: "予算内のエージェント編成を総当たりし、審査スコア、必須技術カバレッジ、交換計画、追加予算ギャップを返す。",
        tags: ["squad", "optimizer", "budget", "judge-score", "marketplace"]
      },
      {
        id: "evidence.monitor",
        name: "Monitor live public proof",
        description: "Cloud Run health、Agent Card、A2A、Squad Optimizer、GitHub Actions CIを公開環境でプローブし、ライブ証拠スコアを返す。",
        tags: ["live-proof", "cloud-run", "a2a", "ci", "submission"]
      },
      {
        id: OBSERVABILITY_ORACLE_SKILL_ID,
        name: "Turn operations signals into buyer proof",
        description: "Live Evidence、Ops Drill、Pilot Economicsを束ね、公開継続/復旧判断、買い手価値、次のAI雇用をGET証拠ページへ変換する。",
        tags: ["observability", "cloud-run", "ops", "roi", "a2a", OBSERVABILITY_ORACLE_LOCK_TAG, "get-proof"]
      },
      {
        id: "release.drift",
        name: "Detect Cloud Run release drift",
        description: "公開Cloud Runが最新Agent Card、必須skill tag、Acceptance Matrix、A2A artifactを出しているかを検知し、古いrevisionを提出前に止める。",
        tags: ["cloud-run", "release", "drift", "agent-card-signals", "ci", "deployment"]
      },
      {
        id: "deploy.recover",
        name: "Recover stale Cloud Run deployment",
        description: "release drift、gcloud認証、Workload Identity bootstrap、GitHub Actions deploy lane、Cloud Build、必須Agent Card signal、公開再検証を復旧計画へ変換する。",
        tags: ["cloud-run", "cloud-build", "github-actions-deploy", "workload-identity", "recovery", "agent-card-signals", "deployment", "runbook", "get-proof"]
      },
      {
        id: "demo.receipt",
        name: "Seal the reviewer proof receipt",
        description: "外部レビュー導線、競合反論、編成判断、公開証拠、外部提出URLを1枚のsha256 receiptとして封印し、Reviewer Route LockとReceipt Integrity Lockで再検証する。",
        tags: ["proof", "receipt", "submission", "reviewer-proof", "sha256", "integrity", "route-lock"]
      },
      {
        id: "autonomy.ledger",
        name: "Build the agent autonomy ledger",
        description: "市場探索、判断、契約、A2A委任、検証、運用、提出の連鎖を審査員向けの自律性台帳にする。",
        tags: ["autonomy", "agent-centrality", "a2a", "evidence", "devops"]
      },
      {
        id: "autonomy.snapshot",
        name: "Open the agent autonomy snapshot",
        description: "Autonomy LedgerとAgent Task Boardを束ね、AIが価値の中心だとGETで読める審査用HTML証拠にする。",
        tags: ["autonomy", "agent-centrality", "a2a", "get-proof", "judge-score"]
      },
      {
        id: "mission.run",
        name: "Run autonomous submission mission",
        description: "審査で弱い項目を見つけ、A2A委任、検証runbook、ProtoPedia提出パックを生成する。",
        tags: ["autonomy", "evidence", "submission-pack", "devops"]
      },
      {
        id: "submission.package",
        name: "Package ProtoPedia submission assets",
        description: "動画ストーリーボード、システム構成図、ストーリー、必須タグ、提出チェックリストを返す。",
        tags: ["protopedia", "video", "architecture", "findy_hackathon", "get-proof"]
      },
      {
        id: "submission.assets",
        name: "Open human-readable submission assets",
        description: "ProtoPedia提出に必要な動画台本、構成図、ストーリー、タグ、提出URLをGETで読めるページに束ねる。",
        tags: ["protopedia", "submission-assets", "video", "architecture", "findy_hackathon"]
      },
      {
        id: "recording.script",
        name: "Open the 30-second recording script",
        description: "Pitch Director、Demo Runway、Submission Closeoutを束ね、録画担当者が直接読める30秒動画台本をGETで返す。",
        tags: ["recording-script", "video", "protopedia", "submission", "get-proof"]
      },
      {
        id: SUBMISSION_PUBLISH_SKILL_ID,
        name: "Prepare paste-ready ProtoPedia publication",
        description: "ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップ、作品性のPublication Policy LockをGET証拠ページ付きで返す。",
        tags: ["protopedia", "publishing", SUBMISSION_PUBLISH_LOCK_TAG, "publication-policy-lock", "video", "submission", "findy_hackathon", "get-proof"]
      },
      {
        id: "demo.runway",
        name: "Run the 30-second reviewer proof runway",
        description: "外部レビュー担当者が最初に見る30秒の画面順、証拠リンク、録画キュー、残リスクを束ねる。",
        tags: ["reviewer-runway", "reviewer-experience", "video", "proof", "publication"]
      },
      {
        id: WIN_AUTOPILOT_SKILL_ID,
        name: "Run the one-click winning autopilot",
        description: "競合/SWOT、証拠、最終候補判定、提出、運用を一括実行し、GET証拠ページで勝てる状態と残アクションを返す。",
        tags: ["autopilot", "winning-strategy", "judge-proof", "submission", "cloud-run", WIN_AUTOPILOT_LOCK_TAG, "get-proof"]
      },
      {
        id: SUBMISSION_DOSSIER_SKILL_ID,
        name: "Build the final submission dossier",
        description: "ProtoPedia本文、動画録画順、提出リンク、証拠デッキ、最終チェックをGET証拠ページ付きの提出ドシエに束ねる。",
        tags: ["submission", "protopedia", "dossier", SUBMISSION_DOSSIER_LOCK_TAG, "video", "judge-proof", "get-proof"]
      },
      {
        id: "submission.launch",
        name: "Validate final submission launch gate",
        description: "ProtoPedia作品URLと動画URLを受け取り、提出3点、タグ、本文、CI、証拠receipt、Final Submit LockをGET/JSONで最終判定する。",
        tags: ["submission", "launch-gate", "final-submit-lock", "submit-form-lock", "protopedia", "video", "mvp", "get-proof"]
      },
      {
        id: EXTERNAL_EVIDENCE_SKILL_ID,
        name: "Verify external submission evidence",
        description: "公開GitHub、Cloud Run、ProtoPedia作品URL、動画URLが審査員から開けるかをGET証拠ページとJSONでライブ検証する。",
        tags: ["submission", "external-proof", EXTERNAL_EVIDENCE_LOCK_TAG, "protopedia", "video", "live-proof", "get-proof"]
      },
      {
        id: "submission.closeout",
        name: "Close out external submission work",
        description: "ProtoPedia貼付、構成図、30秒動画、外部URL、最終提出フォームを順番付きの作業台に束ね、Policy/Dry Run/Asset Lockで検収する。",
        tags: ["submission", "closeout", "protopedia", "publication-policy-lock", "video", "launch-gate", "dry-run-lock", "asset-lock"]
      },
      {
        id: "submission.runway",
        name: "Run the final submission deadline runway",
        description: "2026/7/10 23:59 JSTの提出締切から逆算し、動画、ProtoPedia、構成図、最終フォームを検収順に束ねる。",
        tags: ["submission", "deadline", "runway", "protopedia", "video", "devops"]
      },
      {
        id: "demo.concierge",
        name: "Guide first-click reviewer concierge",
        description: "外部レビュー担当者、買い手、公開担当者の最初の1クリック、台詞、証拠URL、成功条件を固定し、機能過多の迷いを減らす。",
        tags: ["reviewer-concierge", "first-run", "usability", "practicality", "reviewer-experience"]
      },
      {
        id: "security.review",
        name: "Review public security boundaries",
        description: "Secret Manager、IP allowlist、Zod入力制限、A2A信頼境界、CIを外部レビュー向けの安全性証拠に変換する。",
        tags: ["security", "trust-boundary", "secret-manager", "a2a", "cloud-run"]
      },
      {
        id: "impact.case",
        name: "Build practical value impact case",
        description: "対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を実用性・体験価値の証拠へ変換する。",
        tags: ["impact", "practicality", "user-value", "roi", "judge-score"]
      },
      {
        id: "pilot.economics",
        name: "Build pilot economics and buyer proof",
        description: "時間短縮、導入費用、回収日数、価格レーン、買い手の反論を投資判断の証拠へ変換する。",
        tags: ["pilot", "economics", "roi", "pricing", "buyer-objection"]
      },
      {
        id: "pilot.value.snapshot",
        name: "Open the practical pilot value snapshot",
        description: "Impact Case、User Pilot、Pilot Economicsを束ね、実用性・体験価値・導入採算をGETで読める証拠にする。",
        tags: ["pilot-value", "practicality", "usability", "roi", "buyer-proof", "get-proof"]
      },
      {
        id: "ops.drill",
        name: "Run Cloud Run operations drill",
        description: "公開デモの稼働シグナルを読み、継続・ロールバック・追加雇用を判断してDevOps証跡を返す。",
        tags: ["cloud-run", "sre", "rollback", "observability", "devops"]
      },
      {
        id: "ci.verify",
        name: "Verify GitHub Actions quality gate",
        description: "公開GitHub Actionsの最新main runを読み、typecheck/test/build/architecture checkの証跡を返す。",
        tags: ["github-actions", "ci", "quality-gate", "devops"]
      },
      {
        id: "pitch.director",
        name: "Direct the 30-second submission pitch",
        description: "審査員が30秒で価値を理解できる録画順、字幕、証拠リンク、提出残リスクを生成する。",
        tags: ["pitch", "video", "protopedia", "judge-experience", "submission"]
      },
      {
        id: "judge.drill",
        name: "Prepare skeptical judge rebuttals",
        description: "審査5項目と主要競合への厳しめ質問、短い回答、60秒回答パス、証拠リンク、次アクションを生成する。",
        tags: ["judge-drill", "qa", "rebuttal", "cross-exam", "evidence", "scorecard"]
      },
      {
        id: "finalist.simulate",
        name: "Simulate finalist judging panel",
        description: "審査員5役の模擬判定で、最終候補スコア、Release Drift、Finalist Internal Lock、外部URL status、次の一手を返す。",
        tags: ["finalist", "judge-panel", "mvp", "scorecard", "release-drift", "submission", "internal-lock", "submission-url"]
      },
      {
        id: "judge.proof",
        name: "Build one-click judge proof bundle",
        description: "Gemini Proof Lock、Usability Proof Lock、Cloud Run、A2A、競合/SWOT、Mission、Ops、CI、Pitch、Judge Drill、Finalist、提出URLを1つの審査証拠束として返す。",
        tags: [
          "judge-proof",
          "gemini",
          "gemini-proof-lock",
          "usability-proof-lock",
          "cloud-run",
          "a2a",
          "ci",
          "pitch",
          "judge-drill",
          "finalist",
          "submission"
        ]
      }
    ],
    supportsAuthenticatedExtendedCard: false
  };
}

function parseJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
  return JSON.parse(candidate);
}

async function runGemini(projectBrief: string, selectedAgentIds: string[]): Promise<GeminiRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);

  if (!apiKey) {
    return localGeminiRecommendation(recommendation, "GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = [
    "You are the strategy agent for a Japanese DevOps x AI Agent hackathon entry.",
    "Return strict JSON only. No markdown.",
    "",
    "Product:",
    "Agent-To-Agent Marketplace | エージェント市場 | 必要な能力を持つAIを探し雇い連携する",
    "",
    "Mandatory technology:",
    "- A2A protocol style Agent Card and message delegation",
    "- Google Cloud Run",
    "- Gemini 3.5 Flash",
    "",
    "Project brief:",
    projectBrief,
    "",
    "Selected agents:",
    recommendation.selected.map((agent) => `- ${agent.name}: ${agent.headline}`).join("\n"),
    "",
    "Current score:",
    JSON.stringify({ before: recommendation.before, after: recommendation.after, uplift: recommendation.uplift }, null, 2),
    "",
    "Competitive strategy:",
    JSON.stringify(
      {
        strategicThesis: strategy.strategicThesis,
        judgeScore: strategy.judgeScore,
        mvpScore: strategy.mvpScore,
        moatScore: strategy.moatScore,
        topCompetitors: strategy.competitors.slice(0, 4).map((competitor) => ({
          name: competitor.name,
          category: competitor.category,
          counterPosition: competitor.counterPosition,
          counterMove: competitor.counterMove
        })),
        swot: strategy.swot,
        nextBestAgent: strategy.nextBestAgent
          ? {
              name: strategy.nextBestAgent.agent.name,
              reason: strategy.nextBestAgent.reason,
              expectedLift: strategy.nextBestAgent.expectedLift
            }
          : null
      },
      null,
      2
    ),
    "",
    "JSON schema:",
    JSON.stringify(
      {
        source: "gemini",
        model,
        executiveSummary: "one sentence",
        winningAngle: "why this can win",
        risks: ["risk"],
        nextActions: ["action"],
        pitchScript: "30 second Japanese pitch"
      },
      null,
      2
    )
  ].join("\n");

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.35
    }
  });

  const parsed = parseJson(response.text ?? "{}") as GeminiRecommendation;
  return {
    ...parsed,
    source: "gemini",
    model
  };
}

async function runGeminiWithRetry(projectBrief: string, selectedAgentIds: string[], attempts = 2): Promise<GeminiRecommendation> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await runGemini(projectBrief, selectedAgentIds);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}

type GitHubWorkflowRunsResponse = {
  workflow_runs?: Array<{
    id: number;
    name?: string;
    display_title?: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    updated_at: string;
  }>;
};

const ciRunsApiUrl = "https://api.github.com/repos/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/runs?branch=main&per_page=1";
const ciBadgeUrl = "https://github.com/buddypia/DevOps-AIAgent/actions/workflows/ci.yml/badge.svg?branch=main";

function ciUnavailable(reason: string, status: CiProof["status"] = "watch"): CiProof {
  return {
    status,
    conclusion: "unavailable",
    url: SUBMISSION_PROOF.ciWorkflowUrl,
    workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
    branch: "main",
    checkedAt: new Date().toISOString(),
    evidence: `GitHub Actions status could not be read (${reason}); workflow URL remains public.`
  };
}

function ciStatus(status: string, conclusion: string | null): CiProof["status"] {
  if (status !== "completed") return "watch";
  return conclusion === "success" ? "passed" : "missing";
}

function geminiSecretConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

async function fetchCiProof(): Promise<CiProof> {
  try {
    const response = await fetch(ciRunsApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "a2a-agent-marketplace"
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) return fetchCiBadgeProof(`GitHub API HTTP ${response.status}`);

    const payload = (await response.json()) as GitHubWorkflowRunsResponse;
    const run = payload.workflow_runs?.[0];
    if (!run) return ciUnavailable("no workflow run on main yet");

    const status = ciStatus(run.status, run.conclusion);
    const conclusion = run.conclusion ?? run.status;
    return {
      status,
      conclusion,
      url: run.html_url || SUBMISSION_PROOF.ciWorkflowUrl,
      workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
      branch: run.head_branch || "main",
      checkedAt: run.updated_at,
      runId: run.id,
      evidence:
        status === "passed"
          ? `Latest main CI run ${run.id} completed successfully: ${run.display_title ?? run.name ?? "CI"}.`
          : `Latest main CI run ${run.id} is ${run.status}/${conclusion}: ${run.display_title ?? run.name ?? "CI"}.`
    };
  } catch (error) {
    return fetchCiBadgeProof(error instanceof Error ? error.message : "request failed");
  }
}

async function fetchCiBadgeProof(apiReason: string): Promise<CiProof> {
  try {
    const response = await fetch(ciBadgeUrl, {
      headers: {
        Accept: "image/svg+xml",
        "User-Agent": "a2a-agent-marketplace"
      },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return ciUnavailable(`${apiReason}; badge HTTP ${response.status}`);

    const svg = await response.text();
    const status = ciStatusFromBadge(svg);
    if (status === "watch") return ciUnavailable(`${apiReason}; workflow badge is not conclusive`);

    return {
      status,
      conclusion: status === "passed" ? "badge-passing" : "badge-failing",
      url: SUBMISSION_PROOF.ciWorkflowUrl,
      workflowUrl: SUBMISSION_PROOF.ciWorkflowUrl,
      branch: "main",
      checkedAt: new Date().toISOString(),
      evidence:
        status === "passed"
          ? `GitHub API fallback used because ${apiReason}; public workflow badge reports passing.`
          : `GitHub API fallback used because ${apiReason}; public workflow badge does not report passing.`
    };
  } catch (error) {
    return ciUnavailable(`${apiReason}; badge fallback failed: ${error instanceof Error ? error.message : "request failed"}`);
  }
}

function evidenceScore(status: LiveEvidenceStatus) {
  if (status === "passed") return 100;
  if (status === "watch") return 72;
  return 30;
}

async function liveJsonProbe(input: {
  id: string;
  label: string;
  url: string;
  required: boolean;
  init?: RequestInit;
  timeoutMs?: number;
  evaluate: (payload: unknown) => { status: LiveEvidenceStatus; score?: number; evidence: string };
}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(input.url, {
      ...input.init,
      signal: AbortSignal.timeout(input.timeoutMs ?? 3500)
    });
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        id: input.id,
        label: input.label,
        status: "missing" as const,
        score: 30,
        url: input.url,
        evidence: `HTTP ${response.status}`,
        latencyMs,
        required: input.required
      };
    }

    const payload = (await response.json()) as unknown;
    const evaluated = input.evaluate(payload);
    return {
      id: input.id,
      label: input.label,
      status: evaluated.status,
      score: evaluated.score ?? evidenceScore(evaluated.status),
      url: input.url,
      evidence: evaluated.evidence,
      latencyMs,
      required: input.required
    };
  } catch (error) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 30,
      url: input.url,
      evidence: error instanceof Error ? error.message : "probe failed",
      latencyMs: Date.now() - startedAt,
      required: input.required
    };
  }
}

async function liveFirstClickHtmlProbe(input: {
  sentinel: (typeof FIRST_CLICK_SMOKE_SENTINELS)[number];
  targetBaseUrl: string;
  init?: RequestInit;
  timeoutMs?: number;
}): Promise<FirstClickSmokeProbe> {
  const url = `${input.targetBaseUrl.replace(/\/$/, "")}${input.sentinel.href}`;
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      ...input.init,
      signal: AbortSignal.timeout(input.timeoutMs ?? 30000)
    });
    const latencyMs = Date.now() - startedAt;
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    if (!response.ok) {
      return {
        ...input.sentinel,
        url,
        status: "missing",
        score: 24,
        evidence: `HTTP ${response.status}`,
        latencyMs
      };
    }
    if (!text.includes(input.sentinel.sentinel)) {
      return {
        ...input.sentinel,
        url,
        status: "missing",
        score: 24,
        evidence: `HTTP ${response.status} ${contentType || "unknown content-type"}, but missing sentinel ${input.sentinel.sentinel}.`,
        latencyMs
      };
    }
    const html = contentType.includes("text/html");
    return {
      ...input.sentinel,
      url,
      status: html ? "passed" : "watch",
      score: html ? 100 : 82,
      evidence: `${input.sentinel.sentinel} found in ${contentType || "unknown content-type"}.`,
      latencyMs
    };
  } catch (error) {
    return {
      ...input.sentinel,
      url,
      status: "missing",
      score: 24,
      evidence: error instanceof Error ? error.message : "HTML smoke probe failed",
      latencyMs: Date.now() - startedAt
    };
  }
}

function parsedHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function externalUrlAllowed(id: ExternalEvidenceProbe["id"], value: string) {
  const parsed = parsedHttpsUrl(value);
  if (!parsed) return false;
  const host = parsed.hostname.replace(/^www\./, "");
  if (id === "github-url") return host === "github.com";
  if (id === "deployed-url") return host.endsWith(".run.app");
  if (id === "protopedia-url") return host === "protopedia.net" || host.endsWith(".protopedia.net");
  return host === "youtube.com" || host === "youtu.be" || host === "vimeo.com" || host === "drive.google.com";
}

async function externalUrlProbe(input: {
  id: ExternalEvidenceProbe["id"];
  label: string;
  url: string;
  fetchUrl?: string;
  init?: RequestInit;
  required: boolean;
  missingEvidence: string;
  invalidEvidence: string;
}) {
  const url = input.url.trim();
  if (!url) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 30,
      url: "",
      evidence: input.missingEvidence,
      required: input.required
    };
  }
  if (!externalUrlAllowed(input.id, url)) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 20,
      url,
      evidence: input.invalidEvidence,
      required: input.required
    };
  }

  const startedAt = Date.now();
  try {
    const inputHeaders = input.init?.headers instanceof Headers ? Object.fromEntries(input.init.headers.entries()) : (input.init?.headers as Record<string, string> | undefined);
    const response = await fetch(input.fetchUrl ?? url, {
      ...input.init,
      method: "GET",
      headers: {
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "User-Agent": "a2a-agent-marketplace",
        ...inputHeaders
      },
      redirect: "follow",
      signal: AbortSignal.timeout(4500)
    });
    await response.body?.cancel().catch(() => undefined);
    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        id: input.id,
        label: input.label,
        status: "missing" as const,
        score: 30,
        url,
        evidence: `HTTP ${response.status} from public fetch.`,
        latencyMs,
        required: input.required
      };
    }
    const driveWatch = input.id === "video-url" && parsedHttpsUrl(url)?.hostname.replace(/^www\./, "") === "drive.google.com";
    return {
      id: input.id,
      label: input.label,
      status: driveWatch ? ("watch" as const) : ("passed" as const),
      score: driveWatch ? 72 : 100,
      url,
      evidence: driveWatch
        ? `Google Drive returned HTTP ${response.status}; keep this as backup only because Submission Launch Gate seals YouTube/Vimeo URLs.`
        : `Public fetch returned HTTP ${response.status}.`,
      latencyMs,
      required: input.required
    };
  } catch (error) {
    return {
      id: input.id,
      label: input.label,
      status: "missing" as const,
      score: 30,
      url,
      evidence: error instanceof Error ? error.message : "external URL probe failed",
      latencyMs: Date.now() - startedAt,
      required: input.required
    };
  }
}

function staticExternalEvidenceProbes(): ExternalEvidenceProbe[] {
  return [
    {
      id: "github-url",
      label: "Public GitHub repository",
      status: "passed",
      score: 100,
      url: SUBMISSION_PROOF.publicGitHubUrl,
      evidence: "Public GitHub URL is configured for final submission.",
      required: true
    },
    {
      id: "deployed-url",
      label: "Deployed Cloud Run URL",
      status: "passed",
      score: 100,
      url: SUBMISSION_PROOF.deployedUrl,
      evidence: "Cloud Run URL is configured and separately covered by health/release drift probes.",
      required: true
    },
    {
      id: "protopedia-url",
      label: "ProtoPedia work URL",
      status: "missing",
      score: 30,
      url: "",
      evidence: "ProtoPedia work URL is not present in this A2A request.",
      required: true
    },
    {
      id: "video-url",
      label: "Demo video URL",
      status: "missing",
      score: 30,
      url: "",
      evidence: "Demo video URL is not present in this A2A request.",
      required: true
    }
  ];
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(ipAllowlistMiddleware);

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/api/healthz", (_req, res) => {
  res.json({
    ok: true,
    service: "a2a-agent-marketplace",
    model,
    agents: MARKET_AGENTS.length,
    ipAllowlist: ipAllowlistSummary
  });
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(publicRobotsTxt(publicBaseUrl(req)));
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").send(publicSitemapXml(publicBaseUrl(req)));
});

app.get("/api/market", (_req, res) => {
  res.json({ agents: MARKET_AGENTS });
});

app.post("/api/agent-card/discover", async (req, res) => {
  const parsed = AgentCardDiscoverySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: "rejected", error: "invalid_request", warnings: [], signals: [], issues: parsed.error.issues });
    return;
  }

  const result = await discoverAgentCardFromUrl(parsed.data.url);
  res.status(result.status === "accepted" ? 200 : 400).json(result);
});

app.get("/api/agent-card/diligence", async (req, res) => {
  const parsed = agentCardDiligenceQuery(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await runAgentCardDiligence(parsed.url));
});

app.get("/agent-card-diligence", async (req, res) => {
  const parsed = agentCardDiligenceQuery(req);
  if (!parsed.success) {
    res.status(400).type("text/plain").send("Missing required url query parameter.");
    return;
  }

  const report = await runAgentCardDiligence(parsed.url);
  res.type("html").send(renderAgentCardDiligenceHtml(report, agentCardDiligenceLinks(req, parsed.url)));
});

app.get("/agent-card-diligence.md", async (req, res) => {
  const parsed = agentCardDiligenceQuery(req);
  if (!parsed.success) {
    res.status(400).type("text/plain").send("Missing required url query parameter.");
    return;
  }

  res.type("text/markdown").send((await runAgentCardDiligence(parsed.url)).exportMarkdown);
});

app.get("/api/agent-card/trial-plan", async (req, res) => {
  const parsed = agentCardDiligenceQuery(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await runAgentCardTrialPlan(parsed.url));
});

app.get("/agent-card-trial-plan", async (req, res) => {
  const parsed = agentCardDiligenceQuery(req);
  if (!parsed.success) {
    res.status(400).type("text/plain").send("Missing required url query parameter.");
    return;
  }

  const plan = await runAgentCardTrialPlan(parsed.url);
  res.type("html").send(renderAgentCardTrialPlanHtml(plan, agentCardTrialPlanLinks(req, parsed.url)));
});

app.get("/agent-card-trial-plan.md", async (req, res) => {
  const parsed = agentCardDiligenceQuery(req);
  if (!parsed.success) {
    res.status(400).type("text/plain").send("Missing required url query parameter.");
    return;
  }

  res.type("text/markdown").send((await runAgentCardTrialPlan(parsed.url)).exportMarkdown);
});

app.get(SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH, (req, res) => {
  res.json(sampleReleaseStewardAgentCard(publicBaseUrl(req)));
});

app.get(SAMPLE_AGENT_CARD_THIN_AGENT_PATH, (req, res) => {
  res.json(sampleThinAgentCard(publicBaseUrl(req)));
});

app.get("/api/agent-card/shortlist", async (req, res) => {
  const parsed = agentCardShortlistQuery(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error });
    return;
  }

  res.json(await runAgentCardShortlist(parsed.urls));
});

app.get("/agent-card-shortlist", async (req, res) => {
  const parsed = agentCardShortlistQuery(req);
  if (!parsed.success) {
    res.status(400).type("text/plain").send(parsed.error);
    return;
  }

  const shortlist = await runAgentCardShortlist(parsed.urls);
  res.type("html").send(renderAgentCardShortlistHtml(shortlist, agentCardShortlistLinks(req, parsed.urls)));
});

app.get("/agent-card-shortlist.md", async (req, res) => {
  const parsed = agentCardShortlistQuery(req);
  if (!parsed.success) {
    res.status(400).type("text/plain").send(parsed.error);
    return;
  }

  res.type("text/markdown").send((await runAgentCardShortlist(parsed.urls)).exportMarkdown);
});

app.get(`/api${SAMPLE_AGENT_CARD_SHORTLIST_PATH}`, async (req, res) => {
  res.json(await runAgentCardShortlist(sampleAgentCardShortlistUrls(publicBaseUrl(req))));
});

app.get(SAMPLE_AGENT_CARD_SHORTLIST_PATH, async (req, res) => {
  const urls = sampleAgentCardShortlistUrls(publicBaseUrl(req));
  const shortlist = await runAgentCardShortlist(urls);
  res.type("html").send(
    renderAgentCardShortlistHtml(shortlist, {
      jsonUrl: `${publicBaseUrl(req)}/api${SAMPLE_AGENT_CARD_SHORTLIST_PATH}`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_SHORTLIST_PATH}.md`,
      trialPlanBaseUrl: `${publicBaseUrl(req)}/agent-card-trial-plan`,
      appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
    })
  );
});

app.get(`${SAMPLE_AGENT_CARD_SHORTLIST_PATH}.md`, async (req, res) => {
  res.type("text/markdown").send((await runAgentCardShortlist(sampleAgentCardShortlistUrls(publicBaseUrl(req)))).exportMarkdown);
});

app.get(`/api${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}`, async (req, res) => {
  res.json(await runAgentCardTrialPlan(`${agentCardDiligenceTargetBaseUrl(publicBaseUrl(req))}/.well-known/agent-card.json`));
});

app.get(SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH, async (req, res) => {
  const target = `${agentCardDiligenceTargetBaseUrl(publicBaseUrl(req))}/.well-known/agent-card.json`;
  const plan = await runAgentCardTrialPlan(target);
  res.type("html").send(
    renderAgentCardTrialPlanHtml(plan, {
      jsonUrl: `${publicBaseUrl(req)}/api${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}.md`,
      diligenceUrl: `${publicBaseUrl(req)}/agent-card-diligence?url=${encodeURIComponent(target)}`,
      verificationUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`,
      appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
    })
  );
});

app.get(`${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}.md`, async (req, res) => {
  res.type("text/markdown").send((await runAgentCardTrialPlan(`${agentCardDiligenceTargetBaseUrl(publicBaseUrl(req))}/.well-known/agent-card.json`)).exportMarkdown);
});

app.post("/api/agent-card/trial-verification", async (req, res) => {
  const parsed = AgentCardTrialVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await runAgentCardTrialVerification(parsed.data.url, parsed.data.response));
});

app.get(`/api${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`, async (req, res) => {
  res.json(await buildSampleAgentCardTrialVerificationForRequest(req));
});

app.get(SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH, async (req, res) => {
  const target = `${agentCardDiligenceTargetBaseUrl(publicBaseUrl(req))}/.well-known/agent-card.json`;
  const verification = await buildSampleAgentCardTrialVerificationForRequest(req);
  res.type("html").send(
    renderAgentCardTrialVerificationHtml(verification, {
      jsonUrl: `${publicBaseUrl(req)}/api${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}.md`,
      trialPlanUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH}`,
      diligenceUrl: `${publicBaseUrl(req)}/agent-card-diligence?url=${encodeURIComponent(target)}`,
      handoffUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}`,
      appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
    })
  );
});

app.get(`${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}.md`, async (req, res) => {
  res.type("text/markdown").send((await buildSampleAgentCardTrialVerificationForRequest(req)).exportMarkdown);
});

app.post("/api/agent-card/trial-handoff", async (req, res) => {
  const parsed = AgentCardTrialHandoffSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const fallbackWorkspace = sampleWorkspaceForRequest(req);
  const workspace = parsed.data.workspace ? normalizeWorkspaceDraft(parsed.data.workspace, fallbackWorkspace) : fallbackWorkspace;
  res.json(
    await runAgentCardTrialHandoff({
      sourceUrl: parsed.data.url,
      rawResponse: parsed.data.response,
      baseUrl: publicBaseUrl(req),
      workspace,
      workspaceAgentId: parsed.data.workspaceAgentId
    })
  );
});

app.get(`/api${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}`, async (req, res) => {
  res.json(await buildSampleAgentCardTrialHandoffForRequest(req));
});

app.get(SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH, async (req, res) => {
  const handoff = await buildSampleAgentCardTrialHandoffForRequest(req);
  res.type("html").send(
    renderAgentCardTrialHandoffHtml(handoff, {
      jsonUrl: `${publicBaseUrl(req)}/api${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}.md`,
      verificationUrl: `${publicBaseUrl(req)}${SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH}`,
      appUrl: `${publicBaseUrl(req)}/#agent-card-intake`
    })
  );
});

app.get(`${SAMPLE_AGENT_CARD_TRIAL_HANDOFF_PATH}.md`, async (req, res) => {
  res.type("text/markdown").send((await buildSampleAgentCardTrialHandoffForRequest(req)).exportMarkdown);
});

app.post(WORKFLOW_INTAKE_EXTRACT_API_PATH, async (req, res) => {
  const parsed = WorkflowIntakeExtractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await extractWorkflowIntakeDraft(parsed.data.text, { model }));
});

app.post(WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH, (req, res) => {
  const result = verifyWorkflowIntakeExtractionReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowConversionReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowValueAcceptanceContractRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowPilotRunLogRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowPilotDecisionBriefRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowPilotExpansionGuardrailRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowBuyerExpansionHandoffRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickWorkflowBuyerExpansionRecheckCloseoutRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickPublicValueReleaseReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post("/api/proof-links/verify", async (req, res) => {
  const parsed = ProofLinkVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const result = await verifyPublicProofLinks(parsed.data.links);
  res.json(result);
});

app.post(WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH, (req, res) => {
  const result = verifyWorkflowLiveProofAuditRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifySubmissionFinalSubmitReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(LAUNCH_ROOM_HANDOFF_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyLaunchRoomHandoffReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(LAUNCH_ROOM_FOLLOW_UP_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyLaunchRoomFollowUpReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerShareGateReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerEvidenceBoardReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyHomepageOutcomeArtifactReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyHomepageOutcomeSpineReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyHomepageValueLensReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyHeroOutcomeReplayReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(BUYER_PROOF_REPLACEMENT_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerProofReplacementReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post("/api/strategy", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  res.json(buildWinningStrategy(recommendation));
});

app.post("/api/value-blueprint", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  res.json(buildValueBlueprint(recommendation, parsed.data.projectBrief, publicBaseUrl(req)));
});

app.get("/api/launch-room", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildLaunchRoomForRequest(req, parsed.input));
});

app.get("/launch-room", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const room = buildLaunchRoomForRequest(req, parsed.input);
  const roomInput = { ...parsed.input, quickAuditReceipt: room.quickAuditReceipt };
  res.type("html").send(renderLaunchRoomHtml(room, launchRoomHtmlLinks(req, roomInput, room)));
});

app.get("/launch-room.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildLaunchRoomForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/launch-room/handoff-receipt/request", (req, res) => {
  sendLaunchRoomJson(req, res, (room) => ({
    checksum: room.handoffPacket.decisionReceipt.checksum,
    replayPayload: room.handoffPacket.decisionReceipt.replayPayload
  }));
});

app.get("/api/launch-room/handoff-copy", (req, res) => {
  sendLaunchRoomJson(req, res, (room) => ({ text: launchRoomHandoffCopyText(room) }));
});

app.get("/api/launch-room/follow-up-receipt/request", (req, res) => {
  sendLaunchRoomJson(req, res, (room) => ({
    checksum: room.buyerActivityTrail.followUpReceipt.checksum,
    replayPayload: room.buyerActivityTrail.followUpReceipt.replayPayload
  }));
});

app.get("/launch-room/value-proof-ledger.md", (req, res) => {
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.valueProofLedger.exportMarkdown);
});

app.get("/launch-room/buyer-cover-sheet.md", (req, res) => {
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.buyerCoverSheet.copyText);
});

app.get("/launch-room/stakeholder-brief.md", (req, res) => {
  const briefId = queryStringValues(req.query.brief)[0]?.trim() ?? "";
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.stakeholderBriefs.find((brief) => brief.id === briefId)?.copyText ?? null);
});

app.get("/launch-room/buyer-activity-trail.md", (req, res) => {
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.buyerActivityTrail.copyText);
});

app.get("/launch-room/buyer-follow-up-crm-note.md", (req, res) => {
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.buyerActivityTrail.crmNote);
});

app.get("/launch-room/buyer-follow-up-slack-update.txt", (req, res) => {
  sendLaunchRoomText(req, res, "text/plain", (room) => room.buyerActivityTrail.slackUpdate);
});

app.get("/launch-room/buyer-follow-up-tasks.csv", (req, res) => {
  sendLaunchRoomText(req, res, "text/csv", (room) => room.buyerActivityTrail.taskCsv);
});

app.get("/launch-room/buyer-follow-up-receipt.md", (req, res) => {
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.buyerActivityTrail.followUpReceipt.copyText);
});

app.get("/launch-room/buyer-follow-up-replay-payload.json", (req, res) => {
  sendLaunchRoomJson(req, res, (room) => room.buyerActivityTrail.followUpReceipt.replayPayload);
});

app.get("/launch-room/handoff-decision-receipt.md", (req, res) => {
  sendLaunchRoomText(req, res, "text/markdown", (room) => room.handoffPacket.decisionReceipt.copyText);
});

app.get("/launch-room/handoff-replay-payload.json", (req, res) => {
  sendLaunchRoomJson(req, res, (room) => room.handoffPacket.decisionReceipt.replayPayload);
});

app.get("/api/buyer-evidence-board", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerEvidenceBoardForRequest(req, parsed.input));
});

app.get("/buyer-evidence-board", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const board = buildBuyerEvidenceBoardForRequest(req, parsed.input);
  res.type("html").send(renderBuyerEvidenceBoardHtml(board, buyerEvidenceBoardHtmlLinks(req, parsed.input)));
});

app.get("/buyer-evidence-board.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerEvidenceBoardForRequest(req, parsed.input).memoMarkdown);
});

app.get("/api/buyer-outcome-brief", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerOutcomeBriefForRequest(req, parsed.input));
});

app.get("/buyer-outcome-brief", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const brief = buildBuyerOutcomeBriefForRequest(req, parsed.input);
  res.type("html").send(
    renderBuyerOutcomeBriefHtml(brief, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      proofDossierUrl: launchRoomShareUrl(req, parsed.input, "/global-proof-dossier"),
      globalAuditUrl: launchRoomShareUrl(req, parsed.input, "/global-launch-audit"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/buyer-outcome-brief"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/buyer-outcome-brief.md")
    })
  );
});

app.get("/buyer-outcome-brief.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerOutcomeBriefForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-share-gate", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerShareGateForRequest(req, parsed.input));
});

app.get("/buyer-share-gate", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const gate = buildBuyerShareGateForRequest(req, parsed.input);
  res.type("html").send(
    renderBuyerShareGateHtml(gate, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      proofMonitorUrl: launchRoomShareUrl(req, parsed.input, "/buyer-proof-monitor"),
      recoveryUrl: launchRoomShareUrl(req, parsed.input, "/buyer-proof-recovery"),
      evidenceTraceUrl: launchRoomShareUrl(req, parsed.input, "/buyer-evidence-trace"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/buyer-share-gate"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/buyer-share-gate.md")
    })
  );
});

app.get("/buyer-share-gate.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerShareGateForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-evidence-trace", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerEvidenceTraceForRequest(req, parsed.input));
});

app.get("/buyer-evidence-trace", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const trace = buildBuyerEvidenceTraceForRequest(req, parsed.input);
  res.type("html").send(
    renderBuyerEvidenceTraceHtml(trace, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      buyerBriefUrl: launchRoomShareUrl(req, parsed.input, "/buyer-outcome-brief"),
      proofDossierUrl: launchRoomShareUrl(req, parsed.input, "/global-proof-dossier"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/buyer-evidence-trace"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/buyer-evidence-trace.md")
    })
  );
});

app.get("/buyer-evidence-trace.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerEvidenceTraceForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-proof-monitor", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerProofMonitorForRequest(req, parsed.input));
});

app.get("/buyer-proof-monitor", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const monitor = buildBuyerProofMonitorForRequest(req, parsed.input);
  res.type("html").send(
    renderBuyerProofMonitorHtml(monitor, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      recoveryUrl: launchRoomShareUrl(req, parsed.input, "/buyer-proof-recovery"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/buyer-proof-monitor"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/buyer-proof-monitor.md")
    })
  );
});

app.get("/buyer-proof-monitor.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerProofMonitorForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-proof-recovery", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerProofRecoveryForRequest(req, parsed.input));
});

app.post(BUYER_PROOF_RECOVERY_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerProofRecoveryReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/buyer-proof-recovery", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const recovery = buildBuyerProofRecoveryForRequest(req, parsed.input);
  const receipt = buildBuyerProofRecoveryReceipt(recovery);
  res.type("html").send(
    renderBuyerProofRecoveryPlanHtml(recovery, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      monitorUrl: launchRoomShareUrl(req, parsed.input, "/buyer-proof-monitor"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/buyer-proof-recovery"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/buyer-proof-recovery.md")
    }, receipt)
  );
});

app.get("/buyer-proof-recovery.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerProofRecoveryForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/production-hardening", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildProductionHardeningForRequest(req, parsed.input));
});

app.get("/production-hardening", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const snapshot = buildProductionHardeningForRequest(req, parsed.input);
  res.type("html").send(renderProductionHardeningHtml(snapshot, productionHardeningLinks(req, parsed.input)));
});

app.get("/production-hardening.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildProductionHardeningForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/global-launch-audit", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildGlobalLaunchAuditForRequest(req, parsed.input));
});

app.get("/global-launch-audit", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const audit = buildGlobalLaunchAuditForRequest(req, parsed.input);
  res.type("html").send(
    renderGlobalLaunchAuditHtml(audit, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      proofDossierUrl: launchRoomShareUrl(req, parsed.input, "/global-proof-dossier"),
      publishabilityUrl: launchRoomShareUrl(req, parsed.input, "/global-publishability"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/global-launch-audit"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/global-launch-audit.md")
    })
  );
});

app.get("/global-launch-audit.md", (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildGlobalLaunchAuditForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/global-proof-dossier", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildGlobalProofDossierForRequest(req, parsed.input));
});

app.post(GLOBAL_PROOF_DOSSIER_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyGlobalProofDossierReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/global-proof-dossier", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const dossier = await buildGlobalProofDossierForRequest(req, parsed.input);
  const receipt = buildGlobalProofDossierReceipt(dossier);
  res.type("html").send(
    renderGlobalProofDossierHtml(dossier, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      globalAuditUrl: launchRoomShareUrl(req, parsed.input, "/global-launch-audit"),
      publishabilityUrl: launchRoomShareUrl(req, parsed.input, "/global-publishability"),
      launchEvidenceUrl: launchRoomShareUrl(req, parsed.input, "/launch-evidence"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/global-proof-dossier"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/global-proof-dossier.md")
    }, receipt)
  );
});

app.get("/global-proof-dossier.md", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send((await buildGlobalProofDossierForRequest(req, parsed.input)).exportMarkdown);
});

app.get("/api/global-publishability", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildGlobalPublishabilityReportForRequest(req, parsed.input));
});

app.post(GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyGlobalPublishabilityReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(GLOBAL_PUBLISHABILITY_REPAIR_CHECK_PATH, async (req, res) => {
  const result = await runGlobalPublishabilityRepairCheck(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyGlobalPublishabilityRepairCheckReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH, (req, res) => {
  const result = runGlobalPublishabilityReviewResponse(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH, (req, res) => {
  const result = verifyGlobalPublishabilityReviewResponseRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/global-publishability", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const links = globalPublishabilityLinks(req, parsed.input);
  const report = await buildGlobalPublishabilityReportForRequest(req, parsed.input);
  res.type("html").send(renderGlobalPublishabilityReportHtml(report, links));
});

app.get("/global-publishability.md", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send((await buildGlobalPublishabilityReportForRequest(req, parsed.input)).exportMarkdown);
});

app.get("/api/launch-evidence", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildLaunchEvidenceDecisionForRequest(req, parsed.input));
});

app.get("/launch-evidence", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const decision = await buildLaunchEvidenceDecisionForRequest(req, parsed.input);
  res.type("html").send(
    renderLaunchEvidenceHtml(decision, {
      appUrl: launchRoomShareUrl(req, parsed.input),
      launchRoomUrl: launchRoomShareUrl(req, parsed.input, "/launch-room"),
      globalAuditUrl: launchRoomShareUrl(req, parsed.input, "/global-launch-audit"),
      jsonUrl: launchRoomShareUrl(req, parsed.input, "/api/launch-evidence"),
      markdownUrl: launchRoomShareUrl(req, parsed.input, "/launch-evidence.md")
    })
  );
});

app.get("/launch-evidence.md", async (req, res) => {
  const parsed = launchRoomQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send((await buildLaunchEvidenceDecisionForRequest(req, parsed.input)).exportMarkdown);
});

function escapeSampleProofHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sampleStoryProof(baseUrl: string) {
  return {
    title: "Buyer Pilot Contract Builder",
    subtitle: "ProtoPedia-ready story proof for the sample buyer pilot",
    verdict: "A platform team can approve a bounded AI-agent pilot when the workflow, measured run, public proof, trust boundary, price, and stop rule are visible in one room.",
    audience: "Platform / DevOps Lead",
    proofLinks: [
      `${baseUrl}${SAMPLE_BUYER_BRIEF_PATH}`,
      `${baseUrl}${SAMPLE_WORK_ORDER_PATH}`,
      `${baseUrl}${SAMPLE_PILOT_RECEIPT_PATH}`,
      `${baseUrl}${SAMPLE_PROCUREMENT_DECISION_PATH}`,
      `${baseUrl}${SAMPLE_BUYER_PROOF_AUDIT_PATH}`
    ],
    sections: [
      {
        label: "Problem",
        body: "Release-readiness proof is scattered across CI links, Cloud Run checks, review comments, and manual notes, so buyers cannot tell whether an AI agent pilot is safe to approve."
      },
      {
        label: "Solution",
        body: "The product turns one bounded workflow into an AI squad, value model, measured receipt, proof audit, trust boundary, commercial offer, and buyer-sendable pilot contract."
      },
      {
        label: "Result",
        body: "The sample shows 5/5 proof links, 2 accepted A2A trials, 1260 minutes saved per run, and a sendable contract note with attached evidence."
      }
    ]
  };
}

function sampleWalkthroughProof(baseUrl: string) {
  return {
    title: "Sample Buyer Walkthrough",
    subtitle: "Recording proof for the sample buyer pilot",
    runtime: "90 seconds",
    verdict: "Show the buyer contract first, then inspect value, measured proof, live proof, trust, and the stop rule.",
    proofLinks: [
      `${baseUrl}${SAMPLE_BUYER_BRIEF_PATH}`,
      `${baseUrl}${SAMPLE_BUYER_TRACE_PATH}`,
      `${baseUrl}${SAMPLE_PROCUREMENT_DECISION_PATH}`
    ],
    sections: [
      {
        label: "0-20s",
        body: "Open the Buyer Pilot Contract Builder and point to the send note, first commitment, and buyer close checklist."
      },
      {
        label: "20-55s",
        body: "Open the proof attachments: buyer brief, work order, pilot receipt, proof audit, and procurement decision."
      },
      {
        label: "55-90s",
        body: "Explain the stop rule, owner commitments, trust boundary, and the continue/revise/hold decision path."
      }
    ]
  };
}

type SampleProofArtifact = ReturnType<typeof sampleStoryProof> | ReturnType<typeof sampleWalkthroughProof>;

function renderSampleProofArtifactHtml(artifact: SampleProofArtifact, links: { jsonUrl: string; markdownUrl: string; appUrl: string }) {
  const sections = artifact.sections
    .map(
      (section) => `
        <article>
          <span>${escapeSampleProofHtml(section.label)}</span>
          <p>${escapeSampleProofHtml(section.body)}</p>
        </article>`
    )
    .join("");
  const proofLinks = artifact.proofLinks.map((link) => `<a href="${escapeSampleProofHtml(link)}">${escapeSampleProofHtml(link)}</a>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeSampleProofHtml(artifact.title)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #5b686e; --paper: #fffdf7; --line: rgba(23,33,38,.14); --green: #0d5e51; }
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: #edf3ef; }
      main { width: min(1040px, calc(100% - 32px)); margin: 0 auto; padding: 34px 0; display: grid; gap: 14px; }
      header, section { border: 1px solid var(--line); border-radius: 8px; background: var(--paper); box-shadow: 0 18px 42px rgba(23,33,38,.08); }
      header { display: grid; gap: 12px; padding: 24px; border-left: 7px solid var(--green); }
      .eyebrow, article span { color: var(--green); font-size: .74rem; font-weight: 900; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(2rem, 5vw, 4.2rem); line-height: .95; letter-spacing: 0; }
      p { margin: 0; color: var(--muted); line-height: 1.55; }
      strong { font-size: 1.05rem; line-height: 1.35; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; }
      a { color: var(--ink); font-weight: 850; text-decoration: none; }
      nav a, .proof-links a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 11px; background: rgba(13,94,81,.08); }
      section { padding: 14px; display: grid; gap: 10px; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      article { min-width: 0; display: grid; align-content: start; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,255,255,.48); }
      .proof-links { display: grid; gap: 8px; }
      .proof-links a { overflow-wrap: anywhere; border-radius: 8px; }
      @media (max-width: 760px) { main { width: min(100% - 22px, 1040px); padding: 18px 0; } header { padding: 18px; } .grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <span class="eyebrow">${escapeSampleProofHtml(artifact.subtitle)}</span>
        <h1>${escapeSampleProofHtml(artifact.title)}</h1>
        <strong>${escapeSampleProofHtml(artifact.verdict)}</strong>
        <p>Target reviewer: ${escapeSampleProofHtml("audience" in artifact ? artifact.audience : artifact.runtime)}</p>
        <nav>
          <a href="${escapeSampleProofHtml(links.appUrl)}">Open sample workspace</a>
          <a href="${escapeSampleProofHtml(links.jsonUrl)}">JSON</a>
          <a href="${escapeSampleProofHtml(links.markdownUrl)}">Markdown</a>
        </nav>
      </header>
      <section>
        <div class="grid">${sections}</div>
      </section>
      <section class="proof-links">
        <span class="eyebrow">Attached proof</span>
        ${proofLinks}
      </section>
    </main>
  </body>
</html>`;
}

function sampleProofArtifactMarkdown(artifact: SampleProofArtifact) {
  return [
    `# ${artifact.title}`,
    "",
    artifact.subtitle,
    "",
    artifact.verdict,
    "",
    "## Sections",
    ...artifact.sections.map((section) => `- ${section.label}: ${section.body}`),
    "",
    "## Proof links",
    ...artifact.proofLinks.map((link) => `- ${link}`)
  ].join("\n");
}

app.get("/api/sample/protopedia-story", (req, res) => {
  res.json(sampleStoryProof(publicBaseUrl(req)));
});

app.get(SAMPLE_PROTOPEDIA_STORY_PATH, (req, res) => {
  const baseUrl = publicBaseUrl(req);
  res.type("html").send(
    renderSampleProofArtifactHtml(sampleStoryProof(baseUrl), {
      jsonUrl: `${baseUrl}/api/sample/protopedia-story`,
      markdownUrl: `${baseUrl}${SAMPLE_PROTOPEDIA_STORY_PATH}.md`,
      appUrl: launchRoomShareUrl(req, sampleLaunchRoomInput(req))
    })
  );
});

app.get(`${SAMPLE_PROTOPEDIA_STORY_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(sampleProofArtifactMarkdown(sampleStoryProof(publicBaseUrl(req))));
});

app.get("/api/sample/walkthrough-video", (req, res) => {
  res.json(sampleWalkthroughProof(publicBaseUrl(req)));
});

app.get(SAMPLE_WALKTHROUGH_VIDEO_PATH, (req, res) => {
  const baseUrl = publicBaseUrl(req);
  res.type("html").send(
    renderSampleProofArtifactHtml(sampleWalkthroughProof(baseUrl), {
      jsonUrl: `${baseUrl}/api/sample/walkthrough-video`,
      markdownUrl: `${baseUrl}${SAMPLE_WALKTHROUGH_VIDEO_PATH}.md`,
      appUrl: launchRoomShareUrl(req, sampleLaunchRoomInput(req))
    })
  );
});

app.get(`${SAMPLE_WALKTHROUGH_VIDEO_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(sampleProofArtifactMarkdown(sampleWalkthroughProof(publicBaseUrl(req))));
});

app.get("/api/sample/buyer-outcome-brief", (req, res) => {
  res.json(buildBuyerOutcomeBriefForRequest(req, sampleLaunchRoomInput(req)));
});

app.get(SAMPLE_BUYER_BRIEF_PATH, (req, res) => {
  const input = sampleLaunchRoomInput(req);
  const brief = buildBuyerOutcomeBriefForRequest(req, input);
  res.type("html").send(
    renderBuyerOutcomeBriefHtml(brief, {
      appUrl: launchRoomShareUrl(req, input),
      launchRoomUrl: launchRoomShareUrl(req, input, "/launch-room"),
      proofDossierUrl: launchRoomShareUrl(req, input, "/global-proof-dossier"),
      globalAuditUrl: launchRoomShareUrl(req, input, "/global-launch-audit"),
      jsonUrl: `${publicBaseUrl(req)}/api/sample/buyer-outcome-brief`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_BUYER_BRIEF_PATH}.md`
    })
  );
});

app.get(`${SAMPLE_BUYER_BRIEF_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(buildBuyerOutcomeBriefForRequest(req, sampleLaunchRoomInput(req)).exportMarkdown);
});

app.get("/api/sample/buyer-evidence-trace", (req, res) => {
  res.json(buildBuyerEvidenceTraceForRequest(req, sampleLaunchRoomInput(req)));
});

app.get(SAMPLE_BUYER_TRACE_PATH, (req, res) => {
  const input = sampleLaunchRoomInput(req);
  const trace = buildBuyerEvidenceTraceForRequest(req, input);
  res.type("html").send(
    renderBuyerEvidenceTraceHtml(trace, {
      appUrl: launchRoomShareUrl(req, input),
      launchRoomUrl: launchRoomShareUrl(req, input, "/launch-room"),
      buyerBriefUrl: `${publicBaseUrl(req)}${SAMPLE_BUYER_BRIEF_PATH}`,
      proofDossierUrl: launchRoomShareUrl(req, input, "/global-proof-dossier"),
      jsonUrl: `${publicBaseUrl(req)}/api/sample/buyer-evidence-trace`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_BUYER_TRACE_PATH}.md`
    })
  );
});

app.get(`${SAMPLE_BUYER_TRACE_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(buildBuyerEvidenceTraceForRequest(req, sampleLaunchRoomInput(req)).exportMarkdown);
});

app.get("/api/sample/pilot-run-receipt", (req, res) => {
  res.json(buildPilotRunReceiptForRequest(req, buyerProposalInputFromWorkspace(sampleWorkspaceForRequest(req))));
});

app.get(SAMPLE_PILOT_RECEIPT_PATH, (req, res) => {
  const input = sampleLaunchRoomInput(req);
  const receipt = buildPilotRunReceiptForRequest(req, buyerProposalInputFromWorkspace(input.workspace));
  res.type("html").send(
    renderPilotRunReceiptHtml(receipt, {
      jsonUrl: `${publicBaseUrl(req)}/api/sample/pilot-run-receipt`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_PILOT_RECEIPT_PATH}.md`,
      appUrl: launchRoomShareUrl(req, input)
    })
  );
});

app.get(`${SAMPLE_PILOT_RECEIPT_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(buildPilotRunReceiptForRequest(req, buyerProposalInputFromWorkspace(sampleWorkspaceForRequest(req))).exportMarkdown);
});

app.get("/api/sample/work-order-brief", (req, res) => {
  res.json(buildWorkOrderBriefForRequest(req, workOrderInputFromWorkspace(sampleWorkspaceForRequest(req))));
});

app.get(SAMPLE_WORK_ORDER_PATH, (req, res) => {
  const input = sampleLaunchRoomInput(req);
  const brief = buildWorkOrderBriefForRequest(req, workOrderInputFromWorkspace(input.workspace));
  res.type("html").send(
    renderBuyerWorkOrderBriefHtml(brief, {
      jsonUrl: `${publicBaseUrl(req)}/api/sample/work-order-brief`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_WORK_ORDER_PATH}.md`,
      appUrl: launchRoomShareUrl(req, input)
    })
  );
});

app.get(`${SAMPLE_WORK_ORDER_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(buildWorkOrderBriefForRequest(req, workOrderInputFromWorkspace(sampleWorkspaceForRequest(req))).exportMarkdown);
});

app.get("/api/sample/procurement-decision", (req, res) => {
  res.json(buildBuyerProcurementDecisionForRequest(req, workOrderInputFromWorkspace(sampleWorkspaceForRequest(req))));
});

app.get(SAMPLE_PROCUREMENT_DECISION_PATH, (req, res) => {
  const input = sampleLaunchRoomInput(req);
  const decision = buildBuyerProcurementDecisionForRequest(req, workOrderInputFromWorkspace(input.workspace));
  res.type("html").send(
    renderBuyerProcurementDecisionHtml(decision, {
      valueReportUrl: `${publicBaseUrl(req)}/buyer-value`,
      workOrderUrl: `${publicBaseUrl(req)}${SAMPLE_WORK_ORDER_PATH}`,
      pilotReceiptUrl: `${publicBaseUrl(req)}${SAMPLE_PILOT_RECEIPT_PATH}`,
      decisionMatrixUrl: `${publicBaseUrl(req)}/buyer-decision`,
      commercialOfferUrl: `${publicBaseUrl(req)}/commercial-offer`,
      jsonUrl: `${publicBaseUrl(req)}/api/sample/procurement-decision`,
      markdownUrl: `${publicBaseUrl(req)}${SAMPLE_PROCUREMENT_DECISION_PATH}.md`,
      appUrl: launchRoomShareUrl(req, input)
    })
  );
});

app.get(`${SAMPLE_PROCUREMENT_DECISION_PATH}.md`, (req, res) => {
  res.type("text/markdown").send(buildBuyerProcurementDecisionForRequest(req, workOrderInputFromWorkspace(sampleWorkspaceForRequest(req))).exportMarkdown);
});

app.get("/api/sample/buyer-proof-audit", async (req, res) => {
  try {
    res.json(await buildSampleBuyerProofAuditForRequest(req));
  } catch (error) {
    res.status(502).json({ error: "proof_audit_failed", message: error instanceof Error ? error.message : "Buyer proof audit failed." });
  }
});

app.get(SAMPLE_BUYER_PROOF_AUDIT_PATH, async (req, res) => {
  try {
    const audit = await buildSampleBuyerProofAuditForRequest(req);
    res.type("html").send(
      renderBuyerProofAuditHtml(audit, {
        jsonUrl: `${publicBaseUrl(req)}/api/sample/buyer-proof-audit`,
        markdownUrl: `${publicBaseUrl(req)}${SAMPLE_BUYER_PROOF_AUDIT_PATH}.md`,
        appUrl: publicBaseUrl(req)
      })
    );
  } catch (error) {
    res.status(502).type("text/plain").send(error instanceof Error ? error.message : "Buyer proof audit failed.");
  }
});

app.get(`${SAMPLE_BUYER_PROOF_AUDIT_PATH}.md`, async (req, res) => {
  try {
    res.type("text/markdown").send((await buildSampleBuyerProofAuditForRequest(req)).exportMarkdown);
  } catch (error) {
    res.status(502).type("text/plain").send(error instanceof Error ? error.message : "Buyer proof audit failed.");
  }
});

app.get("/api/buyer-proof-audit", async (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    res.json(await buildBuyerProofAuditForRequest(req, parsed.input));
  } catch (error) {
    res.status(502).json({ error: "proof_audit_failed", message: error instanceof Error ? error.message : "Buyer proof audit failed." });
  }
});

app.get("/buyer-proof-audit", async (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  try {
    const audit = await buildBuyerProofAuditForRequest(req, parsed.input);
    res.type("html").send(
      renderBuyerProofAuditHtml(audit, {
        jsonUrl: `${baseUrl}/api/buyer-proof-audit${parsed.suffix}`,
        markdownUrl: `${baseUrl}/buyer-proof-audit.md${parsed.suffix}`,
        manifestUrl: `${baseUrl}/buyer-trust-manifest${parsed.suffix}`,
        appUrl: baseUrl
      })
    );
  } catch (error) {
    res.status(502).type("text/plain").send(error instanceof Error ? error.message : "Buyer proof audit failed.");
  }
});

app.get("/buyer-proof-audit.md", async (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    res.type("text/markdown").send((await buildBuyerProofAuditForRequest(req, parsed.input)).exportMarkdown);
  } catch (error) {
    res.status(502).type("text/plain").send(error instanceof Error ? error.message : "Buyer proof audit failed.");
  }
});

app.get("/api/buyer-delivery-memo", async (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    res.json((await buildBuyerDeliveryMemoForRequest(req, parsed.input, deliveryMemoLinks(req, parsed.suffix))).memo);
  } catch (error) {
    res.status(502).json({ error: "delivery_memo_failed", message: error instanceof Error ? error.message : "Buyer delivery memo failed." });
  }
});

app.get("/buyer-delivery-memo", async (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    const links = deliveryMemoLinks(req, parsed.suffix);
    const bundle = await buildBuyerDeliveryMemoForRequest(req, parsed.input, links);
    res.type("html").send(
      renderWorkflowDeliveryMemoHtml(bundle.memo, {
        jsonUrl: links.jsonUrl,
        markdownUrl: links.markdownUrl,
        appUrl: links.appUrl,
        launchRoomUrl: bundle.launchRoomUrl,
        proofAuditUrl: links.proofAuditUrl,
        trustManifestUrl: links.trustManifestUrl
      })
    );
  } catch (error) {
    res.status(502).type("text/plain").send(error instanceof Error ? error.message : "Buyer delivery memo failed.");
  }
});

app.get("/buyer-delivery-memo.md", async (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    res.type("text/markdown").send((await buildBuyerDeliveryMemoForRequest(req, parsed.input, deliveryMemoLinks(req, parsed.suffix))).memo.exportMarkdown);
  } catch (error) {
    res.status(502).type("text/plain").send(error instanceof Error ? error.message : "Buyer delivery memo failed.");
  }
});

app.get("/api/buyer-proposal", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerProposalForRequest(req, parsed.input));
});

app.get("/buyer-proposal", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderPilotProposalHtml(buildBuyerProposalForRequest(req, parsed.input), {
      jsonUrl: `${publicBaseUrl(req)}/api/buyer-proposal${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/buyer-proposal.md${suffix}`,
      executionUrl: `${publicBaseUrl(req)}/pilot-execution${suffix}`,
      diligenceUrl: `${publicBaseUrl(req)}/buyer-diligence${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/buyer-proposal.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerProposalForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-value", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerValueReportForRequest(req, parsed.input));
});

app.get("/buyer-value", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderBuyerValueReportHtml(buildBuyerValueReportForRequest(req, parsed.input), {
      proposalUrl: `${publicBaseUrl(req)}/buyer-proposal${suffix}`,
      diligenceUrl: `${publicBaseUrl(req)}/buyer-diligence${suffix}`,
      workflowUrl: `${publicBaseUrl(req)}/pilot-workflow${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/buyer-value${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/buyer-value.md${suffix}`,
      selfUrl: `${publicBaseUrl(req)}/buyer-value${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/buyer-value.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerValueReportForRequest(req, parsed.input).exportMarkdown);
});

app.post(BUYER_VALUE_ACCEPTANCE_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerValueAcceptanceReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/api/work-order-brief", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildWorkOrderBriefForRequest(req, parsed.input));
});

app.get("/work-order-brief", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  const baseUrl = publicBaseUrl(req);
  res.type("html").send(
    renderBuyerWorkOrderBriefHtml(buildWorkOrderBriefForRequest(req, parsed.input), {
      jsonUrl: `${baseUrl}/api/work-order-brief${suffix}`,
      markdownUrl: `${baseUrl}/work-order-brief.md${suffix}`,
      appUrl: baseUrl
    })
  );
});

app.get("/work-order-brief.md", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildWorkOrderBriefForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/pilot-execution", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPilotExecutionForRequest(req, parsed.input));
});

app.get("/pilot-execution", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderPilotExecutionHtml(buildPilotExecutionForRequest(req, parsed.input), {
      proposalUrl: `${publicBaseUrl(req)}/buyer-proposal${suffix}`,
      diligenceUrl: `${publicBaseUrl(req)}/buyer-diligence${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/pilot-execution${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/pilot-execution.md${suffix}`
    })
  );
});

app.get("/pilot-execution.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildPilotExecutionForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/pilot-workflow", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPilotWorkflowForRequest(req, parsed.input));
});

app.get("/pilot-workflow", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderPilotWorkflowHtml(buildPilotWorkflowForRequest(req, parsed.input), {
      proposalUrl: `${publicBaseUrl(req)}/buyer-proposal${suffix}`,
      diligenceUrl: `${publicBaseUrl(req)}/buyer-diligence${suffix}`,
      executionUrl: `${publicBaseUrl(req)}/pilot-execution${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/pilot-workflow${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/pilot-workflow.md${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/pilot-workflow.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildPilotWorkflowForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/pilot-run-receipt", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPilotRunReceiptForRequest(req, parsed.input));
});

app.get("/pilot-run-receipt", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderPilotRunReceiptHtml(buildPilotRunReceiptForRequest(req, parsed.input), {
      valueReportUrl: `${publicBaseUrl(req)}/buyer-value${suffix}`,
      workflowUrl: `${publicBaseUrl(req)}/pilot-workflow${suffix}`,
      executionUrl: `${publicBaseUrl(req)}/pilot-execution${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/pilot-run-receipt${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/pilot-run-receipt.md${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/pilot-run-receipt.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildPilotRunReceiptForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-decision", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerDecisionMatrixForRequest(req, parsed.input));
});

app.get("/buyer-decision", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderBuyerDecisionMatrixHtml(buildBuyerDecisionMatrixForRequest(req, parsed.input), {
      valueReportUrl: `${publicBaseUrl(req)}/buyer-value${suffix}`,
      pilotReceiptUrl: `${publicBaseUrl(req)}/pilot-run-receipt${suffix}`,
      diligenceUrl: `${publicBaseUrl(req)}/buyer-diligence${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/buyer-decision${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/buyer-decision.md${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/buyer-decision.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerDecisionMatrixForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/procurement-decision", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerProcurementDecisionForRequest(req, parsed.input));
});

app.get("/procurement-decision", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const baseUrl = publicBaseUrl(req);
  const suffix = querySuffix(req);
  res.type("html").send(
    renderBuyerProcurementDecisionHtml(buildBuyerProcurementDecisionForRequest(req, parsed.input), {
      valueReportUrl: `${baseUrl}/buyer-value${suffix}`,
      workOrderUrl: `${baseUrl}/work-order-brief${suffix}`,
      pilotReceiptUrl: `${baseUrl}/pilot-run-receipt${suffix}`,
      decisionMatrixUrl: `${baseUrl}/buyer-decision${suffix}`,
      commercialOfferUrl: `${baseUrl}/commercial-offer${suffix}`,
      jsonUrl: `${baseUrl}/api/procurement-decision${suffix}`,
      markdownUrl: `${baseUrl}/procurement-decision.md${suffix}`,
      appUrl: baseUrl
    })
  );
});

app.get("/procurement-decision.md", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerProcurementDecisionForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/pilot-agreement", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPilotAgreementForRequest(req, parsed.input));
});

app.get("/pilot-agreement", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderPilotAgreementHtml(buildPilotAgreementForRequest(req, parsed.input), {
      proposalUrl: `${publicBaseUrl(req)}/buyer-proposal${suffix}`,
      decisionUrl: `${publicBaseUrl(req)}/buyer-decision${suffix}`,
      receiptUrl: `${publicBaseUrl(req)}/pilot-run-receipt${suffix}`,
      diligenceUrl: `${publicBaseUrl(req)}/buyer-diligence${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/pilot-agreement${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/pilot-agreement.md${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/pilot-agreement.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildPilotAgreementForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/pilot-evidence-ledger", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPilotEvidenceLedgerForRequest(req, parsed.input));
});

app.get("/pilot-evidence-ledger", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderPilotEvidenceLedgerHtml(buildPilotEvidenceLedgerForRequest(req, parsed.input), {
      proposalUrl: `${publicBaseUrl(req)}/buyer-proposal${suffix}`,
      workflowUrl: `${publicBaseUrl(req)}/pilot-workflow${suffix}`,
      receiptUrl: `${publicBaseUrl(req)}/pilot-run-receipt${suffix}`,
      decisionUrl: `${publicBaseUrl(req)}/buyer-decision${suffix}`,
      agreementUrl: `${publicBaseUrl(req)}/pilot-agreement${suffix}`,
      executionUrl: `${publicBaseUrl(req)}/pilot-execution${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/pilot-evidence-ledger${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/pilot-evidence-ledger.md${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/pilot-evidence-ledger.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildPilotEvidenceLedgerForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/adoption-plan", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildAdoptionOperatingPlanForRequest(req, parsed.input));
});

app.post(ADOPTION_SUCCESS_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyAdoptionSuccessReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/adoption-plan", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const baseUrl = publicBaseUrl(req);
  const suffix = querySuffix(req);
  res.type("html").send(
    renderAdoptionOperatingPlanHtml(buildAdoptionOperatingPlanForRequest(req, parsed.input), {
      workOrderUrl: `${baseUrl}/work-order-brief${suffix}`,
      receiptUrl: `${baseUrl}/pilot-run-receipt${suffix}`,
      ledgerUrl: `${baseUrl}/pilot-evidence-ledger${suffix}`,
      agreementUrl: `${baseUrl}/pilot-agreement${suffix}`,
      proofPacketUrl: `${baseUrl}/buyer-proof-packet${suffix}`,
      sponsorReviewUrl: `${baseUrl}/sponsor-review${suffix}`,
      trustManifestUrl: `${baseUrl}/buyer-trust-manifest${suffix}`,
      jsonUrl: `${baseUrl}/api/adoption-plan${suffix}`,
      markdownUrl: `${baseUrl}/adoption-plan.md${suffix}`,
      appUrl: baseUrl
    })
  );
});

app.get("/adoption-plan.md", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildAdoptionOperatingPlanForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/trust-center", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerTrustCenterForRequest(req, parsed.input));
});

app.get("/trust-center", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const baseUrl = publicBaseUrl(req);
  const suffix = querySuffix(req);
  res.type("html").send(
    renderBuyerTrustCenterHtml(buildBuyerTrustCenterForRequest(req, parsed.input), {
      proofPacketUrl: `${baseUrl}/buyer-proof-packet${suffix}`,
      agreementUrl: `${baseUrl}/pilot-agreement${suffix}`,
      ledgerUrl: `${baseUrl}/pilot-evidence-ledger${suffix}`,
      adoptionPlanUrl: `${baseUrl}/adoption-plan${suffix}`,
      manifestUrl: `${baseUrl}/buyer-trust-manifest${suffix}`,
      jsonUrl: `${baseUrl}/api/trust-center${suffix}`,
      markdownUrl: `${baseUrl}/trust-center.md${suffix}`,
      appUrl: baseUrl
    })
  );
});

app.get("/trust-center.md", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerTrustCenterForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/commercial-offer", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildCommercialOfferForRequest(req, parsed.input));
});

app.post(COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyCommercialOfferReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/commercial-offer", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const baseUrl = publicBaseUrl(req);
  const suffix = querySuffix(req);
  res.type("html").send(
    renderCommercialOfferHtml(buildCommercialOfferForRequest(req, parsed.input), {
      decisionUrl: `${baseUrl}/buyer-decision${suffix}`,
      agreementUrl: `${baseUrl}/pilot-agreement${suffix}`,
      adoptionPlanUrl: `${baseUrl}/adoption-plan${suffix}`,
      trustCenterUrl: `${baseUrl}/trust-center${suffix}`,
      trustManifestUrl: `${baseUrl}/buyer-trust-manifest${suffix}`,
      jsonUrl: `${baseUrl}/api/commercial-offer${suffix}`,
      markdownUrl: `${baseUrl}/commercial-offer.md${suffix}`,
      appUrl: baseUrl
    })
  );
});

app.get("/commercial-offer.md", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildCommercialOfferForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-pilot-contract", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerPilotContractForRequest(req, parsed.input));
});

app.post(BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerPilotContractReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/buyer-pilot-contract", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const links = buyerPilotContractLinks(req);

  res.type("html").send(renderBuyerPilotContractHtml(buildBuyerPilotContractForRequest(req, parsed.input, links), links));
});

app.get("/buyer-pilot-contract.md", (req, res) => {
  const parsed = workOrderBriefQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerPilotContractForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-decision-follow-up", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerDecisionFollowUpForRequest(req, parsed.input, buyerDecisionFollowUpLinks(req, parsed.suffix)));
});

app.post(BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerDecisionFollowUpReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/buyer-decision-follow-up", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const links = buyerDecisionFollowUpLinks(req, parsed.suffix);
  res.type("html").send(renderBuyerDecisionFollowUpHtml(buildBuyerDecisionFollowUpForRequest(req, parsed.input, links), links));
});

app.get("/buyer-decision-follow-up.md", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerDecisionFollowUpForRequest(req, parsed.input, buyerDecisionFollowUpLinks(req, parsed.suffix)).exportMarkdown);
});

app.get("/buyer-decision-follow-up.csv", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/csv").send(buildBuyerDecisionFollowUpForRequest(req, parsed.input, buyerDecisionFollowUpLinks(req, parsed.suffix)).csv);
});

app.post(BUYER_DECISION_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerDecisionReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerDecisionReplyRecordRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerValidationAnswerRecordRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickValueRealizationCloseoutRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH, (req, res) => {
  const result = verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH, (req, res) => {
  const result = verifyQuickValueRealizationAcceptanceRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH, (req, res) => {
  const result = verifyQuickValueReviewExecutionRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickValueReviewExecutionCloseoutRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerEvidenceValueCheckpointRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickBuyerEvidenceValueOwnerCloseoutRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickExternalReviewDecisionReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickExternalReviewOwnerPacketReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickExternalReviewPacketManifestRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_VERIFY_PATH, (req, res) => {
  const result = verifyQuickExternalReviewPacketArtifactContentRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_SET_VERIFY_PATH, (req, res) => {
  const result = verifyQuickExternalReviewPacketArtifactSetRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerAcceptancePathReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/api/buyer-decision-receipt", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }

  const suffix = querySuffix(req) || parsed.suffix;
  res.json(buildBuyerDecisionReceiptForRequest(req, parsed.input, receiptParsed.input, suffix, buyerDecisionReceiptLinks(req, suffix)));
});

app.get("/buyer-decision-receipt", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }

  const suffix = querySuffix(req) || parsed.suffix;
  const links = buyerDecisionReceiptLinks(req, suffix);
  res.type("html").send(renderBuyerDecisionReceiptHtml(buildBuyerDecisionReceiptForRequest(req, parsed.input, receiptParsed.input, suffix, links), links));
});

app.get("/buyer-decision-receipt.md", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }

  const suffix = querySuffix(req) || parsed.suffix;
  res.type("text/markdown").send(buildBuyerDecisionReceiptForRequest(req, parsed.input, receiptParsed.input, suffix, buyerDecisionReceiptLinks(req, suffix)).exportMarkdown);
});

app.get("/api/buyer-review-kit", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }
  const replyRecordParsed = buyerReviewKitReplyRecordInput(req);
  if (!replyRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: replyRecordParsed.error.issues });
    return;
  }
  const validationAnswerRecordParsed = buyerReviewKitValidationAnswerRecordInput(req);
  if (!validationAnswerRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: validationAnswerRecordParsed.error.issues });
    return;
  }

  const reviewKitSuffix = querySuffix(req) || parsed.suffix;
  const hasAttachedRecord = Boolean(replyRecordParsed.requestJson || validationAnswerRecordParsed.requestJson);
  const artifactSuffix = hasAttachedRecord
    ? querySuffixWithout(req, [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM])
    : reviewKitSuffix;
  const links = buyerReviewKitLinks(req, artifactSuffix, reviewKitSuffix, validationAnswerRecordParsed.validationAnswerRecord?.verifierUrl, replyRecordParsed.replyRecord?.verifierUrl);
  res.json(
    buildBuyerReviewKitForRequest(req, parsed.input, receiptParsed.input, artifactSuffix, links, validationAnswerRecordParsed.validationAnswerRecord, replyRecordParsed.replyRecord)
  );
});

app.get("/buyer-review-kit", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }
  const replyRecordParsed = buyerReviewKitReplyRecordInput(req);
  if (!replyRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: replyRecordParsed.error.issues });
    return;
  }
  const validationAnswerRecordParsed = buyerReviewKitValidationAnswerRecordInput(req);
  if (!validationAnswerRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: validationAnswerRecordParsed.error.issues });
    return;
  }

  const reviewKitSuffix = querySuffix(req) || parsed.suffix;
  const hasAttachedRecord = Boolean(replyRecordParsed.requestJson || validationAnswerRecordParsed.requestJson);
  const artifactSuffix = hasAttachedRecord
    ? querySuffixWithout(req, [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM])
    : reviewKitSuffix;
  const links = buyerReviewKitLinks(req, artifactSuffix, reviewKitSuffix, validationAnswerRecordParsed.validationAnswerRecord?.verifierUrl, replyRecordParsed.replyRecord?.verifierUrl);
  res
    .type("html")
    .send(
      renderBuyerReviewKitHtml(
        buildBuyerReviewKitForRequest(req, parsed.input, receiptParsed.input, artifactSuffix, links, validationAnswerRecordParsed.validationAnswerRecord, replyRecordParsed.replyRecord),
        links
      )
    );
});

app.get("/buyer-review-kit.md", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }
  const replyRecordParsed = buyerReviewKitReplyRecordInput(req);
  if (!replyRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: replyRecordParsed.error.issues });
    return;
  }
  const validationAnswerRecordParsed = buyerReviewKitValidationAnswerRecordInput(req);
  if (!validationAnswerRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: validationAnswerRecordParsed.error.issues });
    return;
  }

  const reviewKitSuffix = querySuffix(req) || parsed.suffix;
  const hasAttachedRecord = Boolean(replyRecordParsed.requestJson || validationAnswerRecordParsed.requestJson);
  const artifactSuffix = hasAttachedRecord
    ? querySuffixWithout(req, [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM])
    : reviewKitSuffix;
  const links = buyerReviewKitLinks(req, artifactSuffix, reviewKitSuffix, validationAnswerRecordParsed.validationAnswerRecord?.verifierUrl, replyRecordParsed.replyRecord?.verifierUrl);
  res
    .type("text/markdown")
    .send(
      buildBuyerReviewKitForRequest(req, parsed.input, receiptParsed.input, artifactSuffix, links, validationAnswerRecordParsed.validationAnswerRecord, replyRecordParsed.replyRecord)
        .exportMarkdown
    );
});

app.get("/api/buyer-acceptance-path", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }
  const replyRecordParsed = buyerReviewKitReplyRecordInput(req);
  if (!replyRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: replyRecordParsed.error.issues });
    return;
  }
  const validationAnswerRecordParsed = buyerReviewKitValidationAnswerRecordInput(req);
  if (!validationAnswerRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: validationAnswerRecordParsed.error.issues });
    return;
  }

  const acceptancePathSuffix = querySuffix(req) || parsed.suffix;
  const hasAttachedRecord = Boolean(replyRecordParsed.requestJson || validationAnswerRecordParsed.requestJson);
  const artifactSuffix = hasAttachedRecord
    ? querySuffixWithout(req, [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM])
    : acceptancePathSuffix;
  const links = buyerAcceptancePathLinks(req, artifactSuffix, acceptancePathSuffix, validationAnswerRecordParsed.validationAnswerRecord?.verifierUrl, replyRecordParsed.replyRecord?.verifierUrl);
  res.json(
    buildBuyerAcceptancePathForRequest(
      req,
      parsed.input,
      receiptParsed.input,
      artifactSuffix,
      links,
      validationAnswerRecordParsed.validationAnswerRecord,
      replyRecordParsed.replyRecord,
      acceptancePathSuffix
    )
  );
});

app.get("/buyer-acceptance-path", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }
  const replyRecordParsed = buyerReviewKitReplyRecordInput(req);
  if (!replyRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: replyRecordParsed.error.issues });
    return;
  }
  const validationAnswerRecordParsed = buyerReviewKitValidationAnswerRecordInput(req);
  if (!validationAnswerRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: validationAnswerRecordParsed.error.issues });
    return;
  }

  const acceptancePathSuffix = querySuffix(req) || parsed.suffix;
  const hasAttachedRecord = Boolean(replyRecordParsed.requestJson || validationAnswerRecordParsed.requestJson);
  const artifactSuffix = hasAttachedRecord
    ? querySuffixWithout(req, [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM])
    : acceptancePathSuffix;
  const links = buyerAcceptancePathLinks(req, artifactSuffix, acceptancePathSuffix, validationAnswerRecordParsed.validationAnswerRecord?.verifierUrl, replyRecordParsed.replyRecord?.verifierUrl);
  res.type("html").send(
    renderBuyerAcceptancePathHtml(
      buildBuyerAcceptancePathForRequest(
        req,
        parsed.input,
        receiptParsed.input,
        artifactSuffix,
        links,
        validationAnswerRecordParsed.validationAnswerRecord,
        replyRecordParsed.replyRecord,
        acceptancePathSuffix
      ),
      links
    )
  );
});

app.get("/buyer-acceptance-path.md", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const receiptParsed = buyerDecisionReceiptInput(req);
  if (!receiptParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: receiptParsed.error.issues });
    return;
  }
  const replyRecordParsed = buyerReviewKitReplyRecordInput(req);
  if (!replyRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: replyRecordParsed.error.issues });
    return;
  }
  const validationAnswerRecordParsed = buyerReviewKitValidationAnswerRecordInput(req);
  if (!validationAnswerRecordParsed.success) {
    res.status(400).json({ error: "invalid_request", issues: validationAnswerRecordParsed.error.issues });
    return;
  }

  const acceptancePathSuffix = querySuffix(req) || parsed.suffix;
  const hasAttachedRecord = Boolean(replyRecordParsed.requestJson || validationAnswerRecordParsed.requestJson);
  const artifactSuffix = hasAttachedRecord
    ? querySuffixWithout(req, [BUYER_REVIEW_KIT_REPLY_RECORD_QUERY_PARAM, BUYER_REVIEW_KIT_VALIDATION_ANSWER_RECORD_QUERY_PARAM])
    : acceptancePathSuffix;
  const links = buyerAcceptancePathLinks(req, artifactSuffix, acceptancePathSuffix, validationAnswerRecordParsed.validationAnswerRecord?.verifierUrl, replyRecordParsed.replyRecord?.verifierUrl);
  res
    .type("text/markdown")
    .send(
      buildBuyerAcceptancePathForRequest(
        req,
        parsed.input,
        receiptParsed.input,
        artifactSuffix,
        links,
        validationAnswerRecordParsed.validationAnswerRecord,
        replyRecordParsed.replyRecord,
        acceptancePathSuffix
      ).exportMarkdown
    );
});

app.get("/api/buyer-trust-manifest", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerTrustManifestForRequest(req, parsed.input, buyerTrustManifestLinks(req, parsed.suffix), buyerDecisionFollowUpLinks(req, parsed.suffix)));
});

app.get(`/api${BUYER_PROOF_ROOM_PATH}`, (req, res) => {
  const generatedAt = new Date().toISOString();
  const parsed = publicWorkOrderInputOrSample(req, generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  res.json(buildBuyerProofRoomForRequest(req, parsed.input, suffix, buyerProofRoomLinks(req, suffix), generatedAt));
});

app.get(`/api${BUYER_PROOF_ROOM_PATH}/manifest`, (req, res) => {
  const generatedAt = buyerProofRoomManifestGeneratedAt(req);
  const parsed = publicWorkOrderInputOrSampleExcept(req, [BUYER_PROOF_ROOM_MANIFEST_AT_PARAM], generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  res.json(buildBuyerTrustManifestForRequest(req, parsed.input, buyerProofRoomManifestLinks(req, suffix), buyerDecisionFollowUpLinks(req, suffix), generatedAt));
});

app.post(BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerTrustManifestReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(BUYER_PROOF_VERIFIER_API_PATH, (req, res) => {
  const result = verifyBuyerProofManifestRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.post(RECEIPT_VERIFICATION_DESK_API_PATH, (req, res) => {
  const result = verifyReceiptVerificationDeskRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get(RECEIPT_VERIFICATION_DESK_PATH, (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const hasReceiptVerifierQuery =
    typeof req.query.request !== "undefined" ||
    typeof req.query.requestKey !== "undefined" ||
    typeof req.query.verify !== "undefined" ||
    typeof req.query[QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM] !== "undefined";
  const cleanSuffix = hasReceiptVerifierQuery
    ? querySuffixWithout(req, ["request", "requestKey", "verify", QUICK_EXTERNAL_REVIEW_PACKET_SHARE_PARAM])
    : parsed.suffix;
  const receiptVerifierInput = receiptVerifierQueryInput(req);
  const links = buyerTrustManifestLinks(req, cleanSuffix);
  const manifest = buildBuyerTrustManifestForRequest(req, parsed.input, links, buyerDecisionFollowUpLinks(req, cleanSuffix));
  res.type("html").send(
    renderReceiptVerificationDeskHtml({
      apiUrl: `${baseUrl}${RECEIPT_VERIFICATION_DESK_API_PATH}`,
      sampleRequestJson: receiptVerifierInput.requestJson || manifest.verification.verificationRequestJson,
      initialStatusLabel: receiptVerifierInput.requestJson
        ? receiptVerifierInput.autoVerify
          ? "Verification request loaded from the URL. Running verifier..."
          : "Verification request loaded from the URL."
        : receiptVerifierInput.requestKey
          ? receiptVerifierInput.autoVerify
            ? "Stored verification request key loaded. Running verifier..."
            : "Stored verification request key loaded."
        : undefined,
      autoVerify: receiptVerifierInput.requestJson || receiptVerifierInput.requestKey ? receiptVerifierInput.autoVerify : false,
      storedRequestKey: receiptVerifierInput.requestKey || undefined,
      links: {
        trustManifestUrl: `${baseUrl}/buyer-trust-manifest${cleanSuffix}`,
        proofVerifierUrl: `${baseUrl}/buyer-proof-verifier${cleanSuffix}`,
        appUrl: baseUrl
      }
    })
  );
});

app.get(QUICK_EXTERNAL_REVIEW_PACKET_REVIEW_PATH, (req, res) => {
  const baseUrl = publicBaseUrl(req);
  const reviewPacketInput = receiptVerifierQueryInput(req);

  res.type("html").send(
    renderQuickExternalReviewPacketReviewHtml({
      apiUrl: `${baseUrl}${QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERIFY_PATH}`,
      artifactApiUrl: `${baseUrl}${QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_VERIFY_PATH}`,
      artifactSetApiUrl: `${baseUrl}${QUICK_EXTERNAL_REVIEW_PACKET_ARTIFACT_SET_VERIFY_PATH}`,
      decisionApiUrl: `${baseUrl}${QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH}`,
      sampleRequestJson: reviewPacketInput.requestJson,
      initialStatusLabel: reviewPacketInput.requestJson
        ? reviewPacketInput.autoVerify
          ? "Packet manifest loaded from the URL. Running verifier..."
          : "Packet manifest loaded from the URL."
        : reviewPacketInput.requestKey
          ? reviewPacketInput.autoVerify
            ? "Stored packet manifest key loaded. Running verifier..."
            : "Stored packet manifest key loaded."
          : undefined,
      autoVerify: reviewPacketInput.requestJson || reviewPacketInput.requestKey ? reviewPacketInput.autoVerify : false,
      storedRequestKey: reviewPacketInput.requestKey || undefined,
      links: {
        receiptVerifierUrl: `${baseUrl}${RECEIPT_VERIFICATION_DESK_PATH}`,
        appUrl: baseUrl
      }
    })
  );
});

app.get("/buyer-proof-verifier", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const links = buyerTrustManifestLinks(req, parsed.suffix);
  const manifest = buildBuyerTrustManifestForRequest(req, parsed.input, links, buyerDecisionFollowUpLinks(req, parsed.suffix));
  const report = buildBuyerProofVerifierReport({ manifest });
  res.type("html").send(
    renderBuyerProofVerifierHtml({
      report,
      manifestJson: JSON.stringify(manifest, null, 2),
      links: {
        apiUrl: `${baseUrl}${BUYER_PROOF_VERIFIER_API_PATH}`,
        currentManifestUrl: links.jsonUrl ?? `${baseUrl}/api/buyer-trust-manifest${parsed.suffix}`,
        trustManifestUrl: `${baseUrl}/buyer-trust-manifest${parsed.suffix}`,
        wellKnownUrl: links.wellKnownUrl ?? `${baseUrl}/.well-known/buyer-proof.json`,
        decisionReceiptUrl: `${baseUrl}/buyer-decision-receipt${parsed.suffix}`,
        appUrl: baseUrl
      }
    })
  );
});

app.get(BUYER_PROOF_ROOM_PATH, (req, res) => {
  const generatedAt = new Date().toISOString();
  const parsed = publicWorkOrderInputOrSample(req, generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  res.type("html").send(renderBuyerProofRoomHtml(buildBuyerProofRoomForRequest(req, parsed.input, suffix, buyerProofRoomLinks(req, suffix), generatedAt)));
});

app.get(`${BUYER_PROOF_ROOM_PATH}.md`, (req, res) => {
  const generatedAt = new Date().toISOString();
  const parsed = publicWorkOrderInputOrSample(req, generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  res.type("text/markdown").send(buildBuyerProofRoomForRequest(req, parsed.input, suffix, buyerProofRoomLinks(req, suffix), generatedAt).exportMarkdown);
});

app.get(`${BUYER_PROOF_ROOM_PATH}/manifest`, (req, res) => {
  const generatedAt = buyerProofRoomManifestGeneratedAt(req);
  const parsed = publicWorkOrderInputOrSampleExcept(req, [BUYER_PROOF_ROOM_MANIFEST_AT_PARAM], generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  const links = buyerProofRoomManifestLinks(req, suffix);
  const manifest = buildBuyerTrustManifestForRequest(req, parsed.input, links, buyerDecisionFollowUpLinks(req, suffix), generatedAt);
  res.type("html").send(renderBuyerTrustManifestHtml(manifest, links));
});

app.get(`${BUYER_PROOF_ROOM_PATH}/manifest.md`, (req, res) => {
  const generatedAt = buyerProofRoomManifestGeneratedAt(req);
  const parsed = publicWorkOrderInputOrSampleExcept(req, [BUYER_PROOF_ROOM_MANIFEST_AT_PARAM], generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  res.type("text/markdown").send(
    buildBuyerTrustManifestForRequest(req, parsed.input, buyerProofRoomManifestLinks(req, suffix), buyerDecisionFollowUpLinks(req, suffix), generatedAt).exportMarkdown
  );
});

app.get(`${BUYER_PROOF_ROOM_PATH}/verifier`, (req, res) => {
  const generatedAt = buyerProofRoomManifestGeneratedAt(req);
  const parsed = publicWorkOrderInputOrSampleExcept(req, [BUYER_PROOF_ROOM_MANIFEST_AT_PARAM], generatedAt);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const suffix = buyerProofRoomPublicSuffix(parsed);
  const baseUrl = publicBaseUrl(req);
  const links = buyerProofRoomManifestLinks(req, suffix);
  const manifest = buildBuyerTrustManifestForRequest(req, parsed.input, links, buyerDecisionFollowUpLinks(req, suffix), generatedAt);
  const report = buildBuyerProofVerifierReport({ manifest });
  const trustManifestUrl = urlWithQueryParam(`${baseUrl}${BUYER_PROOF_ROOM_PATH}/manifest${suffix}`, BUYER_PROOF_ROOM_MANIFEST_AT_PARAM, generatedAt);
  res.type("html").send(
    renderBuyerProofVerifierHtml({
      report,
      manifestJson: JSON.stringify(manifest, null, 2),
      links: {
        apiUrl: `${baseUrl}${BUYER_PROOF_VERIFIER_API_PATH}`,
        currentManifestUrl: urlWithQueryParam(links.jsonUrl, BUYER_PROOF_ROOM_MANIFEST_AT_PARAM, generatedAt),
        trustManifestUrl,
        wellKnownUrl: links.wellKnownUrl ?? `${baseUrl}/.well-known/buyer-proof.json`,
        decisionReceiptUrl: `${baseUrl}/buyer-decision-receipt${suffix}`,
        appUrl: baseUrl
      }
    })
  );
});

app.get("/buyer-trust-manifest", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const links = buyerTrustManifestLinks(req, parsed.suffix);
  const manifest = buildBuyerTrustManifestForRequest(req, parsed.input, links, buyerDecisionFollowUpLinks(req, parsed.suffix));
  res.type("html").send(renderBuyerTrustManifestHtml(manifest, links));
});

app.get("/buyer-trust-manifest.md", (req, res) => {
  const parsed = publicWorkOrderInputOrSample(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(
    buildBuyerTrustManifestForRequest(req, parsed.input, buyerTrustManifestLinks(req, parsed.suffix), buyerDecisionFollowUpLinks(req, parsed.suffix)).exportMarkdown
  );
});

app.get("/.well-known/buyer-proof.json", (req, res) => {
  const workspace = sampleWorkspaceForRequest(req);
  const suffix = workspaceArtifactQuerySuffix(workspace);
  res.json(buildBuyerTrustManifestForRequest(req, workOrderInputFromWorkspace(workspace), buyerTrustManifestLinks(req, suffix), buyerDecisionFollowUpLinks(req, suffix)));
});

app.get("/api/sponsor-review", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const room = buildSponsorReviewRoomForRequest(req, parsed.input);
  const proofPacket = buildBuyerProofPacketForRequest(req, parsed.input);
  res.json({ ...room, proofPacketReceipt: proofPacket.receipt });
});

app.get("/sponsor-review", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const baseUrl = publicBaseUrl(req);
  const suffix = querySuffix(req);
  const room = buildSponsorReviewRoomForRequest(req, parsed.input);
  const proofPacket = buildBuyerProofPacketForRequest(req, parsed.input);
  res.type("html").send(
    renderSponsorReviewRoomHtml(
      room,
      {
      "value-report": `${baseUrl}/buyer-value${suffix}`,
      proposal: `${baseUrl}/buyer-proposal${suffix}`,
      workflow: `${baseUrl}/pilot-workflow${suffix}`,
      receipt: `${baseUrl}/pilot-run-receipt${suffix}`,
      decision: `${baseUrl}/buyer-decision${suffix}`,
      agreement: `${baseUrl}/pilot-agreement${suffix}`,
      ledger: `${baseUrl}/pilot-evidence-ledger${suffix}`,
      diligence: `${baseUrl}/buyer-diligence${suffix}`,
      execution: `${baseUrl}/pilot-execution${suffix}`,
      "proof-packet": `${baseUrl}/buyer-proof-packet${suffix}`,
      "trust-manifest": `${baseUrl}/buyer-trust-manifest${suffix}`,
      json: `${baseUrl}/api/sponsor-review${suffix}`,
      markdown: `${baseUrl}/sponsor-review.md${suffix}`,
      app: baseUrl
      },
      proofPacket.receipt
    )
  );
});

app.get("/sponsor-review.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildSponsorReviewRoomForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-proof-packet", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerProofPacketForRequest(req, parsed.input));
});

app.post(BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH, (req, res) => {
  const result = verifyBuyerProofPacketReceiptRequest(req.body);
  res.status(result.statusCode).json(result.body);
});

app.get("/buyer-proof-packet", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const baseUrl = publicBaseUrl(req);
  const suffix = querySuffix(req);
  res.type("html").send(
    renderBuyerProofPacketHtml(buildBuyerProofPacketForRequest(req, parsed.input), {
      "value-report": `${baseUrl}/buyer-value${suffix}`,
      proposal: `${baseUrl}/buyer-proposal${suffix}`,
      workflow: `${baseUrl}/pilot-workflow${suffix}`,
      receipt: `${baseUrl}/pilot-run-receipt${suffix}`,
      decision: `${baseUrl}/buyer-decision${suffix}`,
      agreement: `${baseUrl}/pilot-agreement${suffix}`,
      ledger: `${baseUrl}/pilot-evidence-ledger${suffix}`,
      diligence: `${baseUrl}/buyer-diligence${suffix}`,
      execution: `${baseUrl}/pilot-execution${suffix}`,
      review: `${baseUrl}/sponsor-review${suffix}`,
      manifest: `${baseUrl}/buyer-trust-manifest${suffix}`,
      json: `${baseUrl}/api/buyer-proof-packet${suffix}`,
      markdown: `${baseUrl}/buyer-proof-packet.md${suffix}`,
      app: baseUrl
    })
  );
});

app.get("/buyer-proof-packet.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerProofPacketForRequest(req, parsed.input).exportMarkdown);
});

app.get("/api/buyer-diligence", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildBuyerDiligenceForRequest(req, parsed.input));
});

app.get("/buyer-diligence", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  const suffix = querySuffix(req);
  res.type("html").send(
    renderBuyerDiligenceHtml(buildBuyerDiligenceForRequest(req, parsed.input), {
      proposalUrl: `${publicBaseUrl(req)}/buyer-proposal${suffix}`,
      executionUrl: `${publicBaseUrl(req)}/pilot-execution${suffix}`,
      jsonUrl: `${publicBaseUrl(req)}/api/buyer-diligence${suffix}`,
      markdownUrl: `${publicBaseUrl(req)}/buyer-diligence.md${suffix}`,
      appUrl: publicBaseUrl(req)
    })
  );
});

app.get("/buyer-diligence.md", (req, res) => {
  const parsed = buyerProposalQueryInput(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.type("text/markdown").send(buildBuyerDiligenceForRequest(req, parsed.input).exportMarkdown);
});

app.post("/api/market-intel", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const sourceProofLock = await probeMarketIntelSources({
    sourceLedger: marketIntel.sourceLedger,
    timeoutMs: 6000
  });
  res.json(attachSourceProofLock(marketIntel, sourceProofLock));
});

app.post("/api/moat-stress", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });

  res.json(
    buildMoatStressTest({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      marketIntel
    })
  );
});

app.post("/api/competitive-battlecard", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntelBase = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const sourceProofLock = await probeMarketIntelSources({
    sourceLedger: marketIntelBase.sourceLedger,
    timeoutMs: 6000
  });
  const marketIntel = attachSourceProofLock(marketIntelBase, sourceProofLock);
  const moatStress = buildMoatStressTest({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel
  });

  res.json(
    buildCompetitiveBattlecard({
      baseUrl: publicBaseUrl(req),
      strategy,
      marketIntel,
      moatStress
    })
  );
});

function competitiveSnapshotQueryInput(req: express.Request) {
  return {
    liveSourceProof: req.query.live === "1" || req.query.live === "true"
  };
}

async function buildCompetitiveSnapshotForRequest(req: express.Request, input: { liveSourceProof?: boolean } = {}) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntelBase = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const marketIntel = input.liveSourceProof
    ? attachSourceProofLock(
        marketIntelBase,
        await probeMarketIntelSources({
          sourceLedger: marketIntelBase.sourceLedger,
          timeoutMs: 6000
        })
      )
    : marketIntelBase;
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });

  return buildCompetitiveSnapshot({
    baseUrl,
    projectBrief,
    selectedAgentIds,
    strategy,
    marketIntel,
    battlecard
  });
}

app.get("/api/competitive-swot", async (req, res) => {
  res.json(await buildCompetitiveSnapshotForRequest(req, competitiveSnapshotQueryInput(req)));
});

app.get("/competitive-swot", async (req, res) => {
  res.type("html").send(renderCompetitiveSnapshotHtml(await buildCompetitiveSnapshotForRequest(req, competitiveSnapshotQueryInput(req))));
});

function defaultCompetitiveDecisionInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

async function buildCompetitiveDecisionMatrixForRequest(
  req: express.Request,
  input: z.infer<typeof RecommendSchema>,
  options: { liveSourceProof?: boolean } = {}
) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntelBase = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const marketIntel = options.liveSourceProof
    ? attachSourceProofLock(
        marketIntelBase,
        await probeMarketIntelSources({
          sourceLedger: marketIntelBase.sourceLedger,
          timeoutMs: 6000
        })
      )
    : marketIntelBase;
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });

  return buildCompetitiveDecisionMatrix({
    baseUrl,
    strategy,
    battlecard
  });
}

app.get("/api/competitive-decision-matrix", async (req, res) => {
  res.json(await buildCompetitiveDecisionMatrixForRequest(req, defaultCompetitiveDecisionInput(), competitiveSnapshotQueryInput(req)));
});

app.get("/competitive-decision-matrix", async (req, res) => {
  res
    .type("html")
    .send(renderCompetitiveDecisionMatrixHtml(await buildCompetitiveDecisionMatrixForRequest(req, defaultCompetitiveDecisionInput(), competitiveSnapshotQueryInput(req))));
});

app.post("/api/competitive-decision-matrix", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildCompetitiveDecisionMatrixForRequest(req, parsed.data, { liveSourceProof: req.query.live === "1" || req.query.live === "true" }));
});

async function buildJudgeSnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "外部レビュー担当者がGETで直接開ける初回証拠スナップショットを生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /api/judge-snapshot keeps first-click proof stable; POST /api/proof runs live Gemini."),
    ci
  });
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const liveReleaseDrift = req.query.live === "1" || req.query.live === "true";
  const targetUrlValue = typeof req.query.targetUrl === "string" ? req.query.targetUrl : undefined;
  const targetUrl = targetUrlValue ? z.string().url().safeParse(targetUrlValue) : undefined;
  if (targetUrl && !targetUrl.success) {
    return { error: { error: "invalid_request", issues: targetUrl.error.issues } };
  }
  const releaseDrift = liveReleaseDrift
    ? await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: targetUrl?.data ?? SUBMISSION_PROOF.deployedUrl,
        projectBrief,
        selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      })
    : undefined;

  return {
    snapshot: buildJudgeSnapshot({
      baseUrl,
      projectBrief,
      selectedAgentIds,
      proof,
      battlecard,
      agentCardSkillIds: agentCard(baseUrl).skills.map((skill) => skill.id),
      releaseDrift
    })
  };
}

app.get("/api/judge-snapshot", async (req, res) => {
  const result = await buildJudgeSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(result.snapshot);
});

app.get("/judge-snapshot", async (req, res) => {
  const result = await buildJudgeSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderJudgeSnapshotHtml(result.snapshot));
});

async function buildMvpSnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "MVP本体、外部提出gap、公開revisionを単一判断に束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /mvp-readiness keeps first-click proof stable; POST /api/proof runs live Gemini."),
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const submissionLaunch = buildSubmissionLaunchGate({ mvpAudit, dossier, proof, publisher });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief,
    selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const liveReleaseDrift = req.query.live === "1" || req.query.live === "true";
  const targetUrlValue = typeof req.query.targetUrl === "string" ? req.query.targetUrl : undefined;
  const targetUrl = targetUrlValue ? z.string().url().safeParse(targetUrlValue) : undefined;
  if (targetUrl && !targetUrl.success) {
    return { error: { error: "invalid_request", issues: targetUrl.error.issues } };
  }
  const releaseDrift = liveReleaseDrift
    ? await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: targetUrl?.data ?? SUBMISSION_PROOF.deployedUrl,
        projectBrief,
        selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      })
    : undefined;
  const deployRecovery = releaseDrift
    ? buildDeployRecoveryPlan({
        baseUrl,
        releaseDrift
      })
    : undefined;
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift,
    submissionLaunch
  });

  return {
    snapshot: buildMvpSnapshot({
      baseUrl,
      projectBrief,
      selectedAgentIds,
      mvpAudit,
      acceptance,
      releaseDrift,
      deployRecovery
    })
  };
}

app.get("/api/mvp-readiness", async (req, res) => {
  const result = await buildMvpSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(result.snapshot);
});

app.get("/mvp-readiness", async (req, res) => {
  const result = await buildMvpSnapshotForRequest(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderMvpSnapshotHtml(result.snapshot));
});

function winnerSufficiencyQueryInput(req: express.Request) {
  const parsed = CommandCenterSchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: false,
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : { targetUrl: publicBaseUrl(req) }),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildWinnerSufficiencyForRequest(req: express.Request, input: CommandCenterInput) {
  const baseUrl = publicBaseUrl(req);
  const mvpResult = await buildMvpSnapshotForRequest(req);
  if ("error" in mvpResult) return { error: mvpResult.error };
  const competitiveSnapshot = await buildCompetitiveSnapshotForRequest(req, competitiveSnapshotQueryInput(req));
  const winGapBundle = await buildWinGapRadarBundleForInput(req, input);
  const firstClickSmoke = await buildFirstClickSmokeForRequest(req, { targetUrl: input.targetUrl || baseUrl });
  const releaseDrift = winGapBundle.releaseDrift;
  const mvpSnapshot = releaseDrift
    ? {
        ...mvpResult.snapshot,
        readiness:
          releaseDrift.verdict === "deploy-drift" || releaseDrift.verdict === "release-blocked"
            ? "mvp-release-drift"
            : mvpResult.snapshot.readiness,
        summary: {
          ...mvpResult.snapshot.summary,
          releaseVerdict: releaseDrift.verdict
        },
        releaseLock: {
          verdict: releaseDrift.verdict,
          targetBaseUrl: releaseDrift.targetBaseUrl,
          missingSkills: releaseDrift.missingSkills,
          missingAgentCardSignals: releaseDrift.missingAgentCardSignals,
          probes: releaseDrift.probes.map((probe) => ({
            id: probe.id,
            status: probe.status,
            score: probe.score,
            url: probe.url
          }))
        }
      }
    : mvpResult.snapshot;

  return {
    lock: buildWinnerSufficiencyLock({
      baseUrl,
      mvpSnapshot,
      competitiveSnapshot,
      winGapRadar: winGapBundle.radar,
      firstClickSmoke,
      submissionLaunch: winGapBundle.submissionLaunch
    })
  };
}

app.get("/api/winner-sufficiency", async (req, res) => {
  const result = winnerSufficiencyQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  const lock = await buildWinnerSufficiencyForRequest(req, result.input);
  if ("error" in lock) {
    res.status(400).json(lock.error);
    return;
  }
  res.json(lock.lock);
});

app.get("/winner-sufficiency", async (req, res) => {
  const result = winnerSufficiencyQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  const lock = await buildWinnerSufficiencyForRequest(req, result.input);
  if ("error" in lock) {
    res.status(400).json(lock.error);
    return;
  }
  res.type("html").send(renderWinnerSufficiencyHtml(lock.lock));
});

async function buildAutonomySnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "AIエージェント中心性を、判断、委任、検証、運用、提出のGET証拠に束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /autonomy-snapshot keeps first-click proof stable; POST /api/autonomy-ledger runs live Gemini."),
    ci
  });
  const autonomyLedger = buildAutonomyLedger({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    proof
  });
  const taskBoard = buildAgentTaskBoard({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract
  });

  return buildAutonomySnapshot({
    baseUrl,
    projectBrief,
    selectedAgentIds,
    autonomyLedger,
    taskBoard,
    mission
  });
}

app.get("/api/autonomy-snapshot", async (req, res) => {
  res.json(await buildAutonomySnapshotForRequest(req));
});

app.get("/autonomy-snapshot", async (req, res) => {
  res.type("html").send(renderAutonomySnapshotHtml(await buildAutonomySnapshotForRequest(req)));
});

app.post("/api/mission", (req, res) => {
  const parsed = MissionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  res.json(buildMissionRun(recommendation, strategy, parsed.data.objective));
});

app.get("/api/submission-kit", (_req, res) => {
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy);
  res.json({
    title: mission.submissionPack.protopediaTitle,
    tags: mission.submissionPack.tags,
    story: mission.submissionPack.story,
    demoScript: mission.submissionPack.demoScript,
    videoStoryboard: mission.submissionPack.videoStoryboard,
    architectureDiagramUrl: mission.submissionPack.architectureDiagramUrl,
    storyMarkdownPath: mission.submissionPack.storyMarkdownPath,
    publicGitHubUrl: mission.submissionPack.publicGitHubUrl,
    ciWorkflowUrl: mission.submissionPack.ciWorkflowUrl,
    deployedUrl: mission.submissionPack.deployedUrl,
    protopediaUrl: mission.submissionPack.protopediaUrl,
    videoUrl: mission.submissionPack.videoUrl,
    requirements: mission.submissionPack.requirements
  });
});

function buildSubmissionAssetsForRequest(req: express.Request) {
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy);
  return buildSubmissionAssetsPage({
    baseUrl: publicBaseUrl(req),
    mission
  });
}

app.get("/api/submission-assets", (req, res) => {
  res.json(buildSubmissionAssetsForRequest(req));
});

app.get("/submission-assets", (req, res) => {
  const page = buildSubmissionAssetsForRequest(req);
  res.type("html").send(renderSubmissionAssetsHtml(page));
});

async function buildRecordingScriptForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const projectBrief = DEFAULT_PROJECT_BRIEF;
  const recommendation = recommendSquad(projectBrief, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const battlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const mission = buildMissionRun(recommendation, strategy, "30秒動画の録画台本を審査員・提出者が直接開けるGETページにする。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher, battlecard });
  const ci = await fetchCiProof();
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "GET /recording-script keeps the teleprompter stable; POST /api/proof runs live Gemini."),
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const launchGate = buildSubmissionLaunchGate({
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const closeout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate
  });

  return buildRecordingScriptPage({
    baseUrl,
    pitch,
    demoRunway,
    closeout
  });
}

app.get("/api/recording-script", async (req, res) => {
  res.json(await buildRecordingScriptForRequest(req));
});

app.get("/recording-script", async (req, res) => {
  res.type("html").send(renderRecordingScriptHtml(await buildRecordingScriptForRequest(req)));
});

function buildArchitecturePackForRequest(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "ProtoPediaに貼るシステム構成図と、必須技術・A2A・DevOps証拠の対応表を生成する。");

  return buildArchitecturePack({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission
  });
}

function defaultArchitecturePackInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

app.get("/api/architecture-pack", (req, res) => {
  res.json(buildArchitecturePackForRequest(req, defaultArchitecturePackInput()));
});

app.get("/architecture-pack", (req, res) => {
  res.type("html").send(renderArchitecturePackHtml(buildArchitecturePackForRequest(req, defaultArchitecturePackInput())));
});

app.post("/api/architecture-pack", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildArchitecturePackForRequest(req, parsed.data));
});

function defaultPublisherInput(): z.infer<typeof PublisherSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

function publisherInputFromQuery(req: express.Request) {
  const parsed = PublisherQuerySchema.safeParse(req.query);
  if (!parsed.success) return { success: false as const, error: parsed.error };
  return {
    success: true as const,
    input: {
      ...defaultPublisherInput(),
      targetUrl: parsed.data.targetUrl,
      protopediaUrl: parsed.data.protopediaUrl,
      videoUrl: parsed.data.videoUrl
    }
  };
}

function buildPublisherForRequest(req: express.Request, input: z.infer<typeof PublisherSchema>) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "ProtoPediaに貼る本文、タグ、動画台本、提出URL、残ギャップを一括生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });

  return buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    submissionUrls: {
      deployedUrl: input.targetUrl,
      protopediaUrl: input.protopediaUrl,
      videoUrl: input.videoUrl
    }
  });
}

app.get("/api/publisher", (req, res) => {
  res.json(buildPublisherForRequest(req, defaultPublisherInput()));
});

app.get("/publisher", (req, res) => {
  const parsed = publisherInputFromQuery(req);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }
  res.type("html").send(
    renderProtoPediaPublisherHtml(buildPublisherForRequest(req, parsed.input), {
      projectBrief: parsed.input.projectBrief,
      selectedAgentIds: parsed.input.selectedAgentIds,
      liveAuditApiPath: "/api/publisher/live-audit"
    })
  );
});

app.post("/api/publisher", (req, res) => {
  const parsed = PublisherSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(buildPublisherForRequest(req, parsed.data));
});

app.post("/api/publisher/live-audit", async (req, res) => {
  const parsed = PublisherSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const publisher = buildPublisherForRequest(req, parsed.data);
  const verification = await verifyPublicProofLinks(
    publisherProofLinks(publisher).map((link) => ({
      id: link.id,
      label: link.label,
      value: link.value
    }))
  );
  res.json(buildProtoPediaPublisherLiveAudit({ publisher, proofVerification: verification }));
});

app.post("/api/demo-run", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel
  });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    moatStress
  });
  const mission = buildMissionRun(recommendation, strategy, "審査員が30秒で価値、証拠、提出準備、運用性を理解できる順番を生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });

  res.json(
    buildDemoRunway({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      finalist,
      publisher,
      battlecard: competitiveBattlecard
    })
  );
});

function winAutopilotQueryInput(req: express.Request) {
  const selectedAgentIds =
    typeof req.query.selectedAgentIds === "string"
      ? req.query.selectedAgentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const parsed = RecommendSchema.safeParse({
    projectBrief: typeof req.query.projectBrief === "string" ? req.query.projectBrief : DEFAULT_PROJECT_BRIEF,
    selectedAgentIds
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildWinningAutopilotForInput(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "優勝に必要な証拠、審査適合、提出準備、運用性を一括判定する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });

  return buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
}

app.get("/api/win-autopilot", async (req, res) => {
  const result = winAutopilotQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildWinningAutopilotForInput(req, result.input));
});

app.get("/win-autopilot", async (req, res) => {
  const result = winAutopilotQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderWinningAutopilotHtml(await buildWinningAutopilotForInput(req, result.input)));
});

app.post("/api/win-run", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildWinningAutopilotForInput(req, parsed.data));
});

function defaultDossierInput(): z.infer<typeof RecommendSchema> {
  return {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"]
  };
}

async function buildDossierForRequest(req: express.Request, input: z.infer<typeof RecommendSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl,
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({
    baseUrl,
    recommendation,
    strategy,
    marketIntel
  });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia提出本文、動画録画順、証拠リンク、残ギャップを1つの提出ドシエに束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher,
    battlecard: competitiveBattlecard
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });

  return buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof,
    battlecard: competitiveBattlecard,
    impactCase,
    pilotEconomics
  });
}

app.get("/api/dossier", async (req, res) => {
  res.json(await buildDossierForRequest(req, defaultDossierInput()));
});

app.get("/dossier", async (req, res) => {
  res.type("html").send(renderSubmissionDossierHtml(await buildDossierForRequest(req, defaultDossierInput())));
});

app.post("/api/dossier", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildDossierForRequest(req, parsed.data));
});

app.post("/api/mvp-audit", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "MVPとして提出できるかを、必須技術、審査基準、DevOps証拠、提出3点で監査する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });

  res.json(
    buildMvpAudit({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      finalist,
      autopilot,
      dossier,
      proof,
      marketIntel
    })
  );
});

app.post("/api/judge-brief", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "審査員が30秒で価値、証拠、MVP状態、残リスクを理解できる1枚を生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });

  res.json(
    buildJudgeBrief({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      marketIntel,
      mvpAudit,
      autopilot,
      dossier,
      proof,
      finalist
    })
  );
});

app.post("/api/judge-tour", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl,
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "審査員が90秒で競合差別化、実用性、安全性、実行証拠、提出状態を理解できる導線を生成する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });

  res.json(
    buildJudgeTour({
      baseUrl,
      recommendation,
      strategy,
      marketIntel,
      judgeBrief,
      impactCase,
      securityReview,
      proof,
      demoRunway,
      submissionLaunch
    })
  );
});

app.post("/api/user-pilot", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "対象ユーザーが最初の3分でAI能力調達の価値へ到達できるかを検証する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });

  res.json(
    buildUserPilotLab({
      recommendation,
      strategy,
      impactCase,
      opsDrill,
      securityReview,
      squadContract
    })
  );
});

app.post("/api/squad-optimizer", (req, res) => {
  const parsed = SquadOptimizerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(
    buildSquadOptimizer({
      projectBrief: parsed.data.projectBrief,
      selectedAgentIds: parsed.data.selectedAgentIds,
      budget: parsed.data.budget,
      maxSquadSize: parsed.data.maxSquadSize
    })
  );
});

function liveStatusFromScore(score: number): LiveEvidenceStatus {
  if (score >= 90) return "passed";
  if (score >= 65) return "watch";
  return "missing";
}

function buildProofBackedLiveEvidence(input: { baseUrl: string; proof: JudgeProof; ci: CiProof }) {
  const baseUrl = input.baseUrl.replace(/\/$/, "");
  const cloudRunStatus = liveStatusFromScore(input.proof.scores.cloudRun);
  const a2aStatus = liveStatusFromScore(input.proof.scores.a2a);
  const ciStatus = input.ci.status === "passed" ? "passed" : input.ci.status;

  return buildLiveEvidenceRun({
    baseUrl,
    probes: [
      {
        id: "proof-cloud-run",
        label: "Cloud Run proof score",
        status: cloudRunStatus,
        score: input.proof.scores.cloudRun,
        url: `${baseUrl}/api/healthz`,
        evidence: `Judge Proof Cloud Run score ${input.proof.scores.cloudRun}; /api/live-evidence performs live public probes.`,
        required: true
      },
      {
        id: "proof-agent-card",
        label: "A2A proof score",
        status: a2aStatus,
        score: input.proof.scores.a2a,
        url: `${baseUrl}/.well-known/agent-card.json`,
        evidence: `Judge Proof A2A score ${input.proof.scores.a2a}; Agent Card and /a2a expose the current skill surface.`,
        required: true
      },
      {
        id: "observability-oracle",
        label: "Observability Oracle endpoint",
        status: "passed",
        score: 100,
        url: `${baseUrl}/api/observability-oracle`,
        evidence: "Observability Oracle endpoint is part of the current public proof surface.",
        required: true
      },
      {
        id: "ci-main",
        label: "GitHub Actions CI",
        status: ciStatus,
        score: input.ci.status === "passed" ? 100 : evidenceScore(ciStatus),
        url: input.ci.url,
        evidence: input.ci.evidence,
        required: true
      }
    ]
  });
}

async function buildLiveEvidenceForRequest(req: express.Request, input: z.infer<typeof LiveEvidenceSchema>) {
  const currentBaseUrl = publicBaseUrl(req);
  const baseUrl = normalizeLiveEvidenceBaseUrl(currentBaseUrl, input.targetUrl);
  const selectedAgentIds = input.selectedAgentIds;
  const forwardedHeaders = shouldForwardSelfProbeHeaders(currentBaseUrl, baseUrl) ? selfProbeHeaders(req) : undefined;
  const [healthProbe, cardProbe, optimizerProbe, a2aProbe, ci] = await Promise.all([
    liveJsonProbe({
      id: "health",
      label: "Cloud Run health endpoint",
      url: `${baseUrl}/api/healthz`,
      required: true,
      init: forwardedHeaders ? { headers: forwardedHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { ok?: boolean; service?: string };
        return body.ok && body.service === "a2a-agent-marketplace"
          ? { status: "passed", score: 100, evidence: "Health endpoint returned ok for a2a-agent-marketplace." }
          : { status: "missing", score: 30, evidence: "Health payload did not match expected service contract." };
      }
    }),
    liveJsonProbe({
      id: "agent-card",
      label: "A2A Agent Card",
      url: `${baseUrl}/.well-known/agent-card.json`,
      required: true,
      init: forwardedHeaders ? { headers: forwardedHeaders } : undefined,
      evaluate: (payload) => {
        const skills = Array.isArray((payload as { skills?: unknown[] }).skills) ? ((payload as { skills: Array<{ id?: string }> }).skills) : [];
        const hasTaskDelegate = skills.some((skill) => skill.id === "task.delegate");
        const hasEvidence = skills.some((skill) => skill.id === "evidence.monitor");
        const hasOptimizer = skills.some((skill) => skill.id === "squad.optimize");
        const hasMoat = skills.some((skill) => skill.id === "moat.stress");
        const hasBattlecard = skills.some((skill) => skill.id === "competitive.battlecard");
        const hasCompetitiveSnapshot = skills.some((skill) => skill.id === "competitive.snapshot");
        const hasJudgeSnapshot = skills.some((skill) => skill.id === "judge.snapshot");
        const hasMvpSnapshot = skills.some((skill) => skill.id === "mvp.snapshot");
        const hasReceipt = skills.some((skill) => skill.id === "demo.receipt");
        const hasAcceptance = skills.some((skill) => skill.id === "acceptance.matrix");
        const hasReleaseDrift = skills.some((skill) => skill.id === "release.drift");
        const hasAutonomySnapshot = skills.some((skill) => skill.id === "autonomy.snapshot");
        const hasPilotEconomics = skills.some((skill) => skill.id === "pilot.economics");
        const hasPilotValueSnapshot = skills.some((skill) => skill.id === "pilot.value.snapshot");
        const hasDemoConcierge = skills.some((skill) => skill.id === "demo.concierge");
        const hasJudgeCommand = skills.some((skill) => skill.id === "judge.command");
        const hasJudgeRehearsal = skills.some((skill) => skill.id === "judge.rehearsal");
        const hasWinnerPacket = skills.some((skill) => skill.id === "winner.packet");
        const hasWinAutopilot = skills.some((skill) => skill.id === WIN_AUTOPILOT_SKILL_ID);
        const hasPrizeStrategy = skills.some((skill) => skill.id === PRIZE_STRATEGY_SKILL_ID);
        const hasWinGapRadar = skills.some((skill) => skill.id === "win.gap.radar");
        const hasSubmissionCloseout = skills.some((skill) => skill.id === "submission.closeout");
        const hasSubmissionRunway = skills.some((skill) => skill.id === "submission.runway");
        const hasSubmissionAssets = skills.some((skill) => skill.id === "submission.assets");
        const hasRecordingScript = skills.some((skill) => skill.id === "recording.script");
        const hasExternalEvidence = skills.some((skill) => skill.id === "external.evidence");
        const hasDeployRecovery = skills.some((skill) => skill.id === "deploy.recover");
        const hasObservabilityOracle = skills.some((skill) => skill.id === "observability.oracle");
        return hasTaskDelegate &&
          hasEvidence &&
          hasOptimizer &&
          hasMoat &&
          hasBattlecard &&
          hasCompetitiveSnapshot &&
          hasJudgeSnapshot &&
          hasMvpSnapshot &&
          hasReceipt &&
          hasAcceptance &&
          hasReleaseDrift &&
          hasAutonomySnapshot &&
          hasPilotEconomics &&
          hasPilotValueSnapshot &&
          hasDemoConcierge &&
          hasJudgeCommand &&
          hasJudgeRehearsal &&
          hasWinnerPacket &&
          hasWinAutopilot &&
          hasPrizeStrategy &&
          hasWinGapRadar &&
          hasSubmissionCloseout &&
          hasSubmissionRunway &&
          hasSubmissionAssets &&
          hasRecordingScript &&
          hasExternalEvidence &&
          hasDeployRecovery &&
          hasObservabilityOracle &&
          skills.length >= 52
          ? {
              status: "passed",
              score: 100,
              evidence: `Agent Card exposes ${skills.length} skills including autonomy.snapshot, observability.oracle, task.delegate, external.evidence, winner.packet, win.autopilot, submission.runway, submission.assets, recording.script, pilot.value.snapshot, judge.rehearsal, submission.closeout, win.gap.radar, demo.concierge, prize.strategy, competitive.battlecard, competitive.snapshot, judge.snapshot, mvp.snapshot, deploy.recover, judge.command, pilot.economics, release.drift, acceptance.matrix, demo.receipt, moat.stress, evidence.monitor, and squad.optimize.`
            }
          : {
              status: "watch",
              score: 72,
              evidence: `Agent Card exposes ${skills.length} skills; expected autonomy snapshot, observability oracle, task delegate, external evidence, winner packet, win autopilot, submission runway, submission assets, recording script, pilot value snapshot, judge rehearsal, submission closeout, win gap radar, demo concierge, prize strategy, battlecard, competitive snapshot, judge snapshot, MVP snapshot, deploy recovery, judge command, pilot economics, release drift, acceptance, receipt, moat, live evidence, and optimizer skills.`
            };
      }
    }),
    liveJsonProbe({
      id: "squad-optimizer",
      label: "Squad Optimizer API",
      url: `${baseUrl}/api/squad-optimizer`,
      required: true,
      init: {
        method: "POST",
        headers: { ...(forwardedHeaders ?? {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief: input.projectBrief,
          selectedAgentIds,
          budget: input.budget,
          maxSquadSize: input.maxSquadSize
        })
      },
      evaluate: (payload) => {
        const body = payload as { readiness?: string; budgetGap?: number; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "squad.optimize" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Optimizer returned ${body.readiness}; budget gap ${body.budgetGap ?? 0}.` }
          : { status: "missing", score: 30, evidence: "Optimizer payload did not include squad.optimize evidence." };
      }
    }),
    liveJsonProbe({
      id: "a2a",
      label: "A2A JSON-RPC artifact",
      url: `${baseUrl}/a2a`,
      required: true,
      init: {
        method: "POST",
        headers: { ...(forwardedHeaders ?? {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "live-evidence-monitor",
          method: "message/send",
          params: { text: input.projectBrief }
        })
      },
      evaluate: (payload) => {
        const data = (payload as { result?: { artifacts?: Array<{ parts?: Array<{ data?: Record<string, unknown> }> }> } }).result?.artifacts?.[0]?.parts?.[0]?.data;
        return data?.squadOptimizerEndpoint &&
          data?.liveEvidenceEndpoint &&
          data?.moatStressEndpoint &&
          data?.competitiveBattlecardEndpoint &&
          data?.competitiveSwotSnapshotEndpoint &&
          data?.competitiveDecisionMatrixEndpoint &&
          data?.competitiveDecisionMatrixPageEndpoint &&
          data?.judgeSnapshotEndpoint &&
          data?.judgeSnapshotPageEndpoint &&
          data?.mvpReadinessSnapshotEndpoint &&
          data?.autonomySnapshotEndpoint &&
          data?.autonomySnapshotJsonEndpoint &&
          data?.demoReceiptEndpoint &&
          data?.acceptanceMatrixEndpoint &&
          data?.acceptanceMatrixPageEndpoint &&
          data?.releaseDriftEndpoint &&
          data?.taskBoardEndpoint &&
          data?.externalEvidenceEndpoint &&
          data?.externalEvidencePageEndpoint &&
          data?.pilotEconomicsEndpoint &&
          data?.pilotValueSnapshotEndpoint &&
          data?.pilotValueSnapshotJsonEndpoint &&
          data?.demoConciergeEndpoint &&
          data?.judgeCommandEndpoint &&
          data?.judgeCommandPageEndpoint &&
          data?.judgeRehearsalEndpoint &&
          data?.winnerPacketEndpoint &&
          data?.winnerPacketPageEndpoint &&
          data?.winnerSufficiencyEndpoint &&
          data?.winnerSufficiencyPageEndpoint &&
          data?.winAutopilotEndpoint &&
          data?.winAutopilotPageEndpoint &&
          data?.submissionRunwayEndpoint &&
          data?.submissionAssetsPageEndpoint &&
          data?.submissionAssetsJsonEndpoint &&
          data?.submissionLaunchEndpoint &&
          data?.submissionLaunchPageEndpoint &&
          data?.recordingScriptPageEndpoint &&
          data?.recordingScriptJsonEndpoint &&
          data?.prizeStrategyEndpoint &&
          data?.prizeStrategyPageEndpoint &&
          data?.publisherEndpoint &&
          data?.publisherPageEndpoint &&
          data?.dossierEndpoint &&
          data?.dossierPageEndpoint &&
          data?.winGapRadarEndpoint &&
          data?.submissionCloseoutEndpoint &&
          data?.deployRecoveryEndpoint &&
          data?.deployRecoveryPageEndpoint &&
          data?.observabilityOracleEndpoint &&
          data?.observabilityOraclePageEndpoint
          ? {
              status: "passed",
              score: 100,
              evidence:
                "A2A artifact exposes autonomySnapshotEndpoint, autonomySnapshotJsonEndpoint, observabilityOracleEndpoint, observabilityOraclePageEndpoint, squadOptimizerEndpoint, liveEvidenceEndpoint, externalEvidenceEndpoint, externalEvidencePageEndpoint, moatStressEndpoint, competitiveBattlecardEndpoint, competitiveSwotSnapshotEndpoint, competitiveDecisionMatrixEndpoint, competitiveDecisionMatrixPageEndpoint, judgeSnapshotEndpoint, judgeSnapshotPageEndpoint, mvpReadinessSnapshotEndpoint, demoReceiptEndpoint, acceptanceMatrixEndpoint, acceptanceMatrixPageEndpoint, releaseDriftEndpoint, taskBoardEndpoint, pilotEconomicsEndpoint, pilotValueSnapshotEndpoint, demoConciergeEndpoint, judgeCommandEndpoint, judgeCommandPageEndpoint, judgeRehearsalEndpoint, winnerPacketEndpoint, winnerPacketPageEndpoint, winnerSufficiencyEndpoint, winnerSufficiencyPageEndpoint, winAutopilotEndpoint, winAutopilotPageEndpoint, submissionRunwayEndpoint, submissionAssetsPageEndpoint, submissionAssetsJsonEndpoint, submissionLaunchEndpoint, submissionLaunchPageEndpoint, recordingScriptPageEndpoint, recordingScriptJsonEndpoint, prizeStrategyEndpoint, prizeStrategyPageEndpoint, publisherEndpoint, publisherPageEndpoint, dossierEndpoint, dossierPageEndpoint, winGapRadarEndpoint, submissionCloseoutEndpoint, deployRecoveryEndpoint, and deployRecoveryPageEndpoint."
            }
          : { status: "watch", score: 72, evidence: "A2A artifact returned, but autonomy snapshot/observability oracle/external evidence API/page/task board/winner packet/winner sufficiency/win autopilot/submission runway/submission assets/submission launch/recording script/pilot value snapshot/judge rehearsal/submission closeout/win gap radar/demo concierge/prize strategy API/page/publisher API/page/dossier API/page/battlecard/decision matrix/judge snapshot/MVP snapshot/deploy recovery page/judge command API/page/pilot economics/release drift/acceptance API/page/receipt/moat/live evidence endpoints were not visible." };
      }
    }),
    fetchCiProof()
  ]);
  const ciProbe = {
    id: "ci",
    label: "GitHub Actions CI",
    status: ci.status === "passed" ? ("passed" as const) : ci.status,
    score: ci.status === "passed" ? 100 : evidenceScore(ci.status),
    url: ci.url,
    evidence: ci.evidence,
    required: true
  };

  return buildLiveEvidenceRun({
    baseUrl,
    probes: [healthProbe, cardProbe, optimizerProbe, a2aProbe, ciProbe]
  });
}

app.post("/api/live-evidence", async (req, res) => {
  const parsed = LiveEvidenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildLiveEvidenceForRequest(req, parsed.data));
});

function observabilityOracleQueryInput(req: express.Request) {
  const selectedAgentIds =
    typeof req.query.selectedAgentIds === "string"
      ? req.query.selectedAgentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const parsed = LiveEvidenceSchema.safeParse({
    projectBrief: typeof req.query.projectBrief === "string" ? req.query.projectBrief : DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    budget: typeof req.query.budget === "string" ? Number(req.query.budget) : 140,
    maxSquadSize: typeof req.query.maxSquadSize === "string" ? Number(req.query.maxSquadSize) : 4
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildObservabilityOracleForInput(req: express.Request, input: z.infer<typeof LiveEvidenceSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "公開運用シグナルを読み、継続/復旧/買い手価値/次のAI雇用を1つのObservability Oracleに束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const [liveEvidence, ci] = await Promise.all([buildLiveEvidenceForRequest(req, input), fetchCiProof()]);
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });

  return buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence,
    opsDrill,
    pilotEconomics
  });
}

app.get("/api/observability-oracle", async (req, res) => {
  const result = observabilityOracleQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildObservabilityOracleForInput(req, result.input));
});

app.get("/observability-oracle", async (req, res) => {
  const result = observabilityOracleQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderObservabilityOracleHtml(await buildObservabilityOracleForInput(req, result.input)));
});

app.post("/api/observability-oracle", async (req, res) => {
  const parsed = LiveEvidenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildObservabilityOracleForInput(req, parsed.data));
});

function externalEvidenceQueryInput(req: express.Request) {
  const candidate = {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  };
  const parsed = LaunchSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildExternalEvidenceForRequest(req: express.Request, input: z.infer<typeof LaunchSchema>) {
  const [githubProbe, deployedProbe, protopediaProbe, videoProbe] = await Promise.all([
    externalUrlProbe({
      id: "github-url",
      label: "Public GitHub repository",
      url: SUBMISSION_PROOF.publicGitHubUrl,
      required: true,
      missingEvidence: "Public GitHub URL is not configured.",
      invalidEvidence: "Public GitHub URL must be an https://github.com URL."
    }),
    externalUrlProbe({
      id: "deployed-url",
      label: "Deployed Cloud Run URL",
      url: SUBMISSION_PROOF.deployedUrl,
      fetchUrl: `${publicBaseUrl(req)}/api/healthz`,
      init: { headers: selfProbeHeaders(req) },
      required: true,
      missingEvidence: "Cloud Run deployed URL is not configured.",
      invalidEvidence: "Cloud Run deployed URL must be an https://*.run.app URL."
    }),
    externalUrlProbe({
      id: "protopedia-url",
      label: "ProtoPedia work URL",
      url: input.protopediaUrl ?? "",
      required: true,
      missingEvidence: "ProtoPedia work URL is still missing.",
      invalidEvidence: "ProtoPedia work URL must be an https://protopedia.net URL."
    }),
    externalUrlProbe({
      id: "video-url",
      label: "Demo video URL",
      url: input.videoUrl ?? "",
      required: true,
      missingEvidence: "Demo video URL is still missing.",
      invalidEvidence: "Video URL must be YouTube or Vimeo over https for final submit."
    })
  ]);

  return buildExternalEvidenceRun({
    baseUrl: publicBaseUrl(req),
    probes: [githubProbe, deployedProbe, protopediaProbe, videoProbe]
  });
}

app.get("/api/external-evidence", async (req, res) => {
  const result = externalEvidenceQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildExternalEvidenceForRequest(req, result.input));
});

app.get("/external-evidence", async (req, res) => {
  const result = externalEvidenceQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderExternalEvidenceHtml(await buildExternalEvidenceForRequest(req, result.input)));
});

app.post("/api/external-evidence", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildExternalEvidenceForRequest(req, parsed.data));
});

async function buildReleaseDriftForTarget(input: {
  currentBaseUrl: string;
  targetBaseUrl: string;
  projectBrief: string;
  selectedAgentIds: string[];
  forwardedHeaders?: Record<string, string>;
}) {
  const currentBaseUrl = input.currentBaseUrl.replace(/\/$/, "");
  const targetBaseUrl = input.targetBaseUrl.replace(/\/$/, "");
  const targetProbeHeaders = input.forwardedHeaders && currentBaseUrl === targetBaseUrl ? input.forwardedHeaders : undefined;
  const expectedSkillIds = agentCard(currentBaseUrl).skills.map((skill) => skill.id);
  const requiredAgentCardSignals = [
    "judge.rehearsal:tag:recording-lock",
    "win.gap.radar:tag:feature-freeze-lock",
    "winner.packet:tag:winner-release-lock",
    "winner.packet:tag:get-proof",
    WINNER_SUFFICIENCY_REQUIRED_SIGNAL,
    WIN_AUTOPILOT_REQUIRED_SIGNAL,
    "judge.objection-arena:tag:objection-lock",
    "finalist.simulate:tag:release-drift",
    ACCEPTANCE_MATRIX_REQUIRED_SIGNAL,
    "competitive.battlecard:tag:criteria-duel",
    COMPETITIVE_WIN_LOSS_REQUIRED_SIGNAL,
    "competitive.snapshot:tag:get-proof",
    COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL,
    "judge.snapshot:tag:get-proof",
    FIRST_CLICK_REQUIRED_SIGNAL,
    FIRST_CLICK_SMOKE_REQUIRED_SIGNAL,
    "mvp.snapshot:tag:get-proof",
    "autonomy.snapshot:tag:get-proof",
    EXTERNAL_EVIDENCE_REQUIRED_SIGNAL,
    OBSERVABILITY_ORACLE_REQUIRED_SIGNAL,
    JUDGE_COMMAND_REQUIRED_SIGNAL,
    "recording.script:tag:get-proof",
    PRIZE_STRATEGY_REQUIRED_SIGNAL,
    SUBMISSION_PUBLISH_REQUIRED_SIGNAL,
    SUBMISSION_DOSSIER_REQUIRED_SIGNAL,
    "submission.launch:tag:get-proof",
    "submission.package:tag:get-proof",
    "pilot.value.snapshot:tag:get-proof",
    "deploy.recover:tag:get-proof"
  ];
  const requiredSkillIds = [
    "task.delegate",
    "external.evidence",
    "evidence.monitor",
    "observability.oracle",
    "demo.receipt",
    "acceptance.matrix",
    "release.drift",
    "mvp.snapshot",
    "autonomy.snapshot",
    "pilot.economics",
    "pilot.value.snapshot",
    "demo.concierge",
    "judge.command",
    "judge.rehearsal",
    "winner.packet",
    WINNER_SUFFICIENCY_SKILL_ID,
    "judge.objection-arena",
    "submission.launch",
    "submission.runway",
    "submission.assets",
    "recording.script",
    PRIZE_STRATEGY_SKILL_ID,
    SUBMISSION_DOSSIER_SKILL_ID,
    "win.gap.radar",
    "submission.closeout",
    "deploy.recover",
    "competitive.battlecard",
    "competitive.snapshot",
    COMPETITIVE_DECISION_MATRIX_SKILL_ID,
    "judge.snapshot",
    FIRST_CLICK_SKILL_ID,
    FIRST_CLICK_SMOKE_SKILL_ID,
    "win.autopilot"
  ];
  let observedSkillIds: string[] = [];
  let observedAgentCardSignals: string[] = [];

  const [
    healthProbe,
    cardProbe,
    acceptanceProbe,
    mvpReadinessProbe,
    autonomySnapshotProbe,
    recordingScriptProbe,
    architecturePackProbe,
    submissionLaunchProbe,
    pilotValueProbe,
    objectionArenaProbe,
    firstClickSmokeProbe,
    a2aProbe,
    ci
  ] = await Promise.all([
    liveJsonProbe({
      id: "target-health",
      label: "Target Cloud Run health",
      url: `${targetBaseUrl}/api/healthz`,
      required: true,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { ok?: boolean; service?: string };
        return body.ok && body.service === "a2a-agent-marketplace"
          ? { status: "passed", score: 100, evidence: "Target health endpoint returned ok for a2a-agent-marketplace." }
          : { status: "missing", score: 24, evidence: "Target health payload did not match the expected service contract." };
      }
    }),
    liveJsonProbe({
      id: "agent-card-skill-surface",
      label: "Target Agent Card skill surface",
      url: `${targetBaseUrl}/.well-known/agent-card.json`,
      required: true,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const skills = Array.isArray((payload as { skills?: unknown[] }).skills)
          ? ((payload as { skills: Array<{ id?: string; tags?: string[] }> }).skills)
          : [];
        observedSkillIds = skills.map((skill) => skill.id).filter((id): id is string => Boolean(id));
        const judgeRehearsal = skills.find((skill) => skill.id === "judge.rehearsal");
        const winGapRadar = skills.find((skill) => skill.id === "win.gap.radar");
        const winnerPacket = skills.find((skill) => skill.id === "winner.packet");
        const winnerSufficiency = skills.find((skill) => skill.id === WINNER_SUFFICIENCY_SKILL_ID);
        const winAutopilot = skills.find((skill) => skill.id === WIN_AUTOPILOT_SKILL_ID);
        const objectionArena = skills.find((skill) => skill.id === "judge.objection-arena");
        const finalistSimulate = skills.find((skill) => skill.id === "finalist.simulate");
        const acceptanceMatrix = skills.find((skill) => skill.id === ACCEPTANCE_MATRIX_SKILL_ID);
        const competitiveBattlecard = skills.find((skill) => skill.id === "competitive.battlecard");
        const competitiveSnapshot = skills.find((skill) => skill.id === "competitive.snapshot");
        const competitiveDecisionMatrix = skills.find((skill) => skill.id === COMPETITIVE_DECISION_MATRIX_SKILL_ID);
        const judgeSnapshot = skills.find((skill) => skill.id === "judge.snapshot");
        const firstClick = skills.find((skill) => skill.id === FIRST_CLICK_SKILL_ID);
        const firstClickSmoke = skills.find((skill) => skill.id === FIRST_CLICK_SMOKE_SKILL_ID);
        const mvpSnapshot = skills.find((skill) => skill.id === "mvp.snapshot");
        const autonomySnapshot = skills.find((skill) => skill.id === "autonomy.snapshot");
        const externalEvidence = skills.find((skill) => skill.id === EXTERNAL_EVIDENCE_SKILL_ID);
        const observabilityOracle = skills.find((skill) => skill.id === OBSERVABILITY_ORACLE_SKILL_ID);
        const judgeCommand = skills.find((skill) => skill.id === JUDGE_COMMAND_SKILL_ID);
        const recordingScript = skills.find((skill) => skill.id === "recording.script");
        const prizeStrategy = skills.find((skill) => skill.id === PRIZE_STRATEGY_SKILL_ID);
        const submissionPublish = skills.find((skill) => skill.id === SUBMISSION_PUBLISH_SKILL_ID);
        const submissionDossier = skills.find((skill) => skill.id === SUBMISSION_DOSSIER_SKILL_ID);
        const submissionLaunch = skills.find((skill) => skill.id === "submission.launch");
        const submissionPackage = skills.find((skill) => skill.id === "submission.package");
        const pilotValueSnapshot = skills.find((skill) => skill.id === "pilot.value.snapshot");
        const deployRecover = skills.find((skill) => skill.id === "deploy.recover");
        observedAgentCardSignals = [
          ...(judgeRehearsal?.tags?.includes("recording-lock") ? ["judge.rehearsal:tag:recording-lock"] : []),
          ...(winGapRadar?.tags?.includes("feature-freeze-lock") ? ["win.gap.radar:tag:feature-freeze-lock"] : []),
          ...(winnerPacket?.tags?.includes("winner-release-lock") ? ["winner.packet:tag:winner-release-lock"] : []),
          ...(winnerPacket?.tags?.includes("get-proof") ? ["winner.packet:tag:get-proof"] : []),
          ...(winnerSufficiency?.tags?.includes(WINNER_SUFFICIENCY_LOCK_TAG) ? [WINNER_SUFFICIENCY_REQUIRED_SIGNAL] : []),
          ...(winAutopilot?.tags?.includes(WIN_AUTOPILOT_LOCK_TAG) ? [WIN_AUTOPILOT_REQUIRED_SIGNAL] : []),
          ...(objectionArena?.tags?.includes("objection-lock") ? ["judge.objection-arena:tag:objection-lock"] : []),
          ...(finalistSimulate?.tags?.includes("release-drift") ? ["finalist.simulate:tag:release-drift"] : []),
          ...(acceptanceMatrix?.tags?.includes(ACCEPTANCE_MATRIX_LOCK_TAG) ? [ACCEPTANCE_MATRIX_REQUIRED_SIGNAL] : []),
          ...(competitiveBattlecard?.tags?.includes("criteria-duel") ? ["competitive.battlecard:tag:criteria-duel"] : []),
          ...(competitiveBattlecard?.tags?.includes(COMPETITIVE_WIN_LOSS_LOCK_TAG) ? [COMPETITIVE_WIN_LOSS_REQUIRED_SIGNAL] : []),
          ...(competitiveSnapshot?.tags?.includes("get-proof") ? ["competitive.snapshot:tag:get-proof"] : []),
          ...(competitiveDecisionMatrix?.tags?.includes(COMPETITIVE_DECISION_MATRIX_LOCK_TAG) ? [COMPETITIVE_DECISION_MATRIX_REQUIRED_SIGNAL] : []),
          ...(judgeSnapshot?.tags?.includes("get-proof") ? ["judge.snapshot:tag:get-proof"] : []),
          ...(firstClick?.tags?.includes(FIRST_CLICK_ROUTE_LOCK_TAG) ? [FIRST_CLICK_REQUIRED_SIGNAL] : []),
          ...(firstClickSmoke?.tags?.includes(FIRST_CLICK_SMOKE_LOCK_TAG) ? [FIRST_CLICK_SMOKE_REQUIRED_SIGNAL] : []),
          ...(mvpSnapshot?.tags?.includes("get-proof") ? ["mvp.snapshot:tag:get-proof"] : []),
          ...(autonomySnapshot?.tags?.includes("get-proof") ? ["autonomy.snapshot:tag:get-proof"] : []),
          ...(externalEvidence?.tags?.includes(EXTERNAL_EVIDENCE_LOCK_TAG) ? [EXTERNAL_EVIDENCE_REQUIRED_SIGNAL] : []),
          ...(observabilityOracle?.tags?.includes(OBSERVABILITY_ORACLE_LOCK_TAG) ? [OBSERVABILITY_ORACLE_REQUIRED_SIGNAL] : []),
          ...(judgeCommand?.tags?.includes(JUDGE_COMMAND_LOCK_TAG) ? [JUDGE_COMMAND_REQUIRED_SIGNAL] : []),
          ...(recordingScript?.tags?.includes("get-proof") ? ["recording.script:tag:get-proof"] : []),
          ...(prizeStrategy?.tags?.includes(PRIZE_STRATEGY_LOCK_TAG) ? [PRIZE_STRATEGY_REQUIRED_SIGNAL] : []),
          ...(submissionPublish?.tags?.includes(SUBMISSION_PUBLISH_LOCK_TAG) ? [SUBMISSION_PUBLISH_REQUIRED_SIGNAL] : []),
          ...(submissionDossier?.tags?.includes(SUBMISSION_DOSSIER_LOCK_TAG) ? [SUBMISSION_DOSSIER_REQUIRED_SIGNAL] : []),
          ...(submissionLaunch?.tags?.includes("get-proof") ? ["submission.launch:tag:get-proof"] : []),
          ...(submissionPackage?.tags?.includes("get-proof") ? ["submission.package:tag:get-proof"] : []),
          ...(pilotValueSnapshot?.tags?.includes("get-proof") ? ["pilot.value.snapshot:tag:get-proof"] : []),
          ...(deployRecover?.tags?.includes("get-proof") ? ["deploy.recover:tag:get-proof"] : [])
        ];
        const missing = requiredSkillIds.filter((skill) => !observedSkillIds.includes(skill));
        const missingSignals = requiredAgentCardSignals.filter((signal) => !observedAgentCardSignals.includes(signal));
        const hasExpectedCount = observedSkillIds.length >= expectedSkillIds.length;
        if (missing.length === 0 && missingSignals.length === 0 && hasExpectedCount) {
          return {
            status: "passed",
            score: 100,
            evidence: `Target Agent Card exposes ${observedSkillIds.length}/${expectedSkillIds.length} expected skills and ${observedAgentCardSignals.length}/${requiredAgentCardSignals.length} required signals.`
          };
        }
        return {
          status: missing.length > 0 || missingSignals.length > 0 ? "watch" : "passed",
          score: missing.length > 0 || missingSignals.length > 0 ? 58 : 92,
          evidence: `Target Agent Card exposes ${observedSkillIds.length}/${expectedSkillIds.length} skills; missing skills ${missing.join(", ") || "none"}; missing signals ${missingSignals.join(", ") || "none"}.`
        };
      }
    }),
    liveJsonProbe({
      id: "acceptance-endpoint",
      label: "Target Acceptance Matrix endpoint",
      url: `${targetBaseUrl}/api/acceptance-matrix`,
      required: true,
      timeoutMs: 20000,
      init: {
        method: "POST",
        headers: { ...(targetProbeHeaders ?? {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief: input.projectBrief,
          selectedAgentIds: input.selectedAgentIds,
          skipReleaseDrift: true
        })
      },
      evaluate: (payload) => {
        const body = payload as { verdict?: string; rows?: unknown[]; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "acceptance.matrix" && Array.isArray(body.rows) && body.rows.length >= 13
          ? { status: "passed", score: 100, evidence: `Acceptance Matrix returned ${body.verdict}; ${body.rows.length} rows.` }
          : { status: "missing", score: 24, evidence: "Acceptance Matrix endpoint did not return the current acceptance.matrix JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "mvp-readiness-endpoint",
      label: "Target MVP Readiness endpoint",
      url: `${targetBaseUrl}/api/mvp-readiness`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "mvp.snapshot" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `MVP Readiness Snapshot returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "MVP Readiness endpoint did not return the current mvp.snapshot JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "autonomy-snapshot-endpoint",
      label: "Target Autonomy Snapshot endpoint",
      url: `${targetBaseUrl}/api/autonomy-snapshot`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "autonomy.snapshot" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Autonomy Snapshot returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "Autonomy Snapshot endpoint did not return the current autonomy.snapshot JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "recording-script-endpoint",
      label: "Target Recording Script endpoint",
      url: `${targetBaseUrl}/api/recording-script`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "recording.script" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Recording Script returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "Recording Script endpoint did not return the current recording.script JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "architecture-pack-endpoint",
      label: "Target Architecture Pack endpoint",
      url: `${targetBaseUrl}/api/architecture-pack`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; architectureScore?: number; a2aPayload?: { skill?: string }; nodes?: unknown[]; requirements?: unknown[] };
        return body.a2aPayload?.skill === "submission.package" && typeof body.readiness === "string" && Array.isArray(body.nodes) && Array.isArray(body.requirements)
          ? { status: "passed", score: 100, evidence: `Architecture Pack returned ${body.readiness}; score ${body.architectureScore ?? "unknown"}.` }
          : { status: "missing", score: 24, evidence: "Architecture Pack endpoint did not return the current submission.package JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "submission-launch-endpoint",
      label: "Target Submission Launch endpoint",
      url: `${targetBaseUrl}/api/submission-launch`,
      required: true,
      timeoutMs: 20000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; launchScore?: number; finalSubmitLock?: { readiness?: string }; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "submission.launch" && typeof body.readiness === "string" && body.finalSubmitLock?.readiness
          ? { status: "passed", score: 100, evidence: `Submission Launch returned ${body.readiness}; final submit ${body.finalSubmitLock.readiness}; score ${body.launchScore ?? "unknown"}.` }
          : { status: "missing", score: 24, evidence: "Submission Launch endpoint did not return the current submission.launch JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "pilot-value-endpoint",
      label: "Target Pilot Value endpoint",
      url: `${targetBaseUrl}/api/pilot-value`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string } };
        return body.a2aPayload?.skill === "pilot.value.snapshot" && typeof body.readiness === "string"
          ? { status: "passed", score: 100, evidence: `Pilot Value Snapshot returned ${body.readiness}.` }
          : { status: "missing", score: 24, evidence: "Pilot Value endpoint did not return the current pilot.value.snapshot JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "objection-arena-endpoint",
      label: "Target Objection Arena endpoint",
      url: `${targetBaseUrl}/api/objection-arena`,
      required: true,
      timeoutMs: 16000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string }; lanes?: unknown[] };
        return body.a2aPayload?.skill === "judge.objection-arena" && typeof body.readiness === "string" && Array.isArray(body.lanes)
          ? { status: "passed", score: 100, evidence: `Objection Arena returned ${body.readiness}; ${body.lanes.length} Q&A lanes.` }
          : { status: "missing", score: 24, evidence: "Objection Arena endpoint did not return the current judge.objection-arena JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "first-click-smoke-endpoint",
      label: "Target First-Click Smoke endpoint",
      url: `${targetBaseUrl}/api/first-click-smoke`,
      required: true,
      timeoutMs: 45000,
      init: targetProbeHeaders ? { headers: targetProbeHeaders } : undefined,
      evaluate: (payload) => {
        const body = payload as { readiness?: string; a2aPayload?: { skill?: string }; probes?: unknown[]; missingCount?: number };
        return body.a2aPayload?.skill === FIRST_CLICK_SMOKE_SKILL_ID && typeof body.readiness === "string" && Array.isArray(body.probes)
          ? {
              status: body.missingCount === 0 ? "passed" : "watch",
              score: body.missingCount === 0 ? 100 : 58,
              evidence: `First-Click Smoke returned ${body.readiness}; ${body.probes.length} sentinel probes; missing ${body.missingCount ?? "unknown"}.`
            }
          : { status: "missing", score: 24, evidence: "First-Click Smoke endpoint did not return the current judge.first-click-smoke JSON payload." };
      }
    }),
    liveJsonProbe({
      id: "a2a-artifact",
      label: "Target A2A artifact endpoints",
      url: `${targetBaseUrl}/a2a`,
      required: true,
      init: {
        method: "POST",
        headers: { ...(targetProbeHeaders ?? {}), "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "release-drift-guard",
          method: "message/send",
          params: { text: input.projectBrief }
        })
      },
      evaluate: (payload) => {
        const data = (payload as { result?: { artifacts?: Array<{ parts?: Array<{ data?: Record<string, unknown> }> }> } }).result?.artifacts?.[0]?.parts?.[0]?.data;
        return data?.releaseDriftEndpoint &&
          data?.taskBoardEndpoint &&
          data?.externalEvidenceEndpoint &&
          data?.externalEvidencePageEndpoint &&
          data?.acceptanceMatrixEndpoint &&
          data?.acceptanceMatrixPageEndpoint &&
          data?.demoReceiptEndpoint &&
          data?.pilotEconomicsEndpoint &&
          data?.demoConciergeEndpoint &&
          data?.judgeCommandEndpoint &&
          data?.judgeCommandPageEndpoint &&
          data?.judgeRehearsalEndpoint &&
          data?.winnerPacketEndpoint &&
          data?.winnerPacketPageEndpoint &&
          data?.winnerSufficiencyEndpoint &&
          data?.winnerSufficiencyPageEndpoint &&
          data?.winAutopilotEndpoint &&
          data?.winAutopilotPageEndpoint &&
          data?.submissionRunwayEndpoint &&
          data?.submissionAssetsPageEndpoint &&
          data?.submissionAssetsJsonEndpoint &&
          data?.submissionLaunchEndpoint &&
          data?.submissionLaunchPageEndpoint &&
          data?.architecturePackEndpoint &&
          data?.architecturePackPageEndpoint &&
          data?.recordingScriptPageEndpoint &&
          data?.recordingScriptJsonEndpoint &&
          data?.pilotValueSnapshotEndpoint &&
          data?.pilotValueSnapshotJsonEndpoint &&
          data?.prizeStrategyEndpoint &&
          data?.prizeStrategyPageEndpoint &&
          data?.publisherEndpoint &&
          data?.publisherPageEndpoint &&
          data?.dossierEndpoint &&
          data?.dossierPageEndpoint &&
          data?.winGapRadarEndpoint &&
          data?.submissionCloseoutEndpoint &&
          data?.competitiveBattlecardEndpoint &&
          data?.competitiveSwotSnapshotEndpoint &&
          data?.competitiveDecisionMatrixEndpoint &&
          data?.competitiveDecisionMatrixPageEndpoint &&
          data?.judgeSnapshotEndpoint &&
          data?.judgeSnapshotPageEndpoint &&
          data?.firstClickProof &&
          data?.firstClickSmokeEndpoint &&
          data?.firstClickSmokePageEndpoint &&
          data?.objectionArenaEndpoint &&
          data?.objectionArenaPageEndpoint &&
          data?.mvpReadinessSnapshotEndpoint &&
          data?.autonomySnapshotEndpoint &&
          data?.autonomySnapshotJsonEndpoint &&
          data?.observabilityOracleEndpoint &&
          data?.observabilityOraclePageEndpoint &&
          data?.deployRecoveryEndpoint &&
          data?.deployRecoveryPageEndpoint
          ? {
            status: "passed",
            score: 100,
              evidence: "A2A artifact exposes releaseDriftEndpoint, taskBoardEndpoint, externalEvidenceEndpoint, externalEvidencePageEndpoint, acceptanceMatrixEndpoint, acceptanceMatrixPageEndpoint, demoReceiptEndpoint, pilotEconomicsEndpoint, pilotValueSnapshotEndpoint, demoConciergeEndpoint, judgeCommandEndpoint, judgeCommandPageEndpoint, judgeRehearsalEndpoint, winnerPacketEndpoint, winnerPacketPageEndpoint, winnerSufficiencyEndpoint, winnerSufficiencyPageEndpoint, winAutopilotEndpoint, winAutopilotPageEndpoint, objectionArenaEndpoint, objectionArenaPageEndpoint, submissionRunwayEndpoint, submissionAssetsPageEndpoint, submissionAssetsJsonEndpoint, submissionLaunchEndpoint, submissionLaunchPageEndpoint, architecturePackEndpoint, architecturePackPageEndpoint, recordingScriptPageEndpoint, recordingScriptJsonEndpoint, prizeStrategyEndpoint, prizeStrategyPageEndpoint, publisherEndpoint, publisherPageEndpoint, dossierEndpoint, dossierPageEndpoint, winGapRadarEndpoint, submissionCloseoutEndpoint, competitiveBattlecardEndpoint, competitiveSwotSnapshotEndpoint, competitiveDecisionMatrixEndpoint, competitiveDecisionMatrixPageEndpoint, judgeSnapshotEndpoint, judgeSnapshotPageEndpoint, firstClickProof, firstClickSmokeEndpoint, firstClickSmokePageEndpoint, mvpReadinessSnapshotEndpoint, autonomySnapshotEndpoint, autonomySnapshotJsonEndpoint, observabilityOracleEndpoint, observabilityOraclePageEndpoint, deployRecoveryEndpoint, and deployRecoveryPageEndpoint."
            }
          : { status: "watch", score: 62, evidence: "A2A artifact is reachable, but autonomy snapshot/observability oracle/external evidence API/page/task board/winner packet/winner sufficiency/win autopilot/objection arena/submission runway/submission assets/submission launch/architecture pack/recording script/pilot value snapshot/judge rehearsal/submission closeout/win gap radar/demo concierge/prize strategy API/page/publisher API/page/dossier API/page/battlecard/decision matrix/judge snapshot/first-click proof/first-click smoke/MVP snapshot/deploy recovery page/judge command API/page/pilot economics/release drift/acceptance API/page/receipt endpoints are not all visible." };
      }
    }),
    fetchCiProof()
  ]);

  const ciProbe: ReleaseDriftProbe = {
    id: "ci-main",
    label: "Latest main CI",
    status: ci.status === "passed" ? "passed" : ci.status === "watch" ? "watch" : "missing",
    score: ci.status === "passed" ? 100 : ci.status === "watch" ? 70 : 24,
    url: ci.url,
    evidence: ci.evidence,
    required: true
  };

  return buildReleaseDriftGuard({
    currentBaseUrl,
    targetBaseUrl,
    expectedSkillIds,
    observedSkillIds,
    requiredSkillIds,
    requiredAgentCardSignals,
    observedAgentCardSignals,
    probes: [
      healthProbe,
      cardProbe,
      acceptanceProbe,
      mvpReadinessProbe,
      autonomySnapshotProbe,
      recordingScriptProbe,
      architecturePackProbe,
      submissionLaunchProbe,
      pilotValueProbe,
      objectionArenaProbe,
      firstClickSmokeProbe,
      a2aProbe,
      ciProbe
    ]
  });
}

app.post("/api/release-drift", async (req, res) => {
  const parsed = ReleaseDriftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const currentBaseUrl = publicBaseUrl(req);
  const targetBaseUrl = (parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl).replace(/\/$/, "");

  res.json(
    await buildReleaseDriftForTarget({
      currentBaseUrl,
      targetBaseUrl,
      projectBrief: parsed.data.projectBrief,
      selectedAgentIds: parsed.data.selectedAgentIds,
      forwardedHeaders: selfProbeHeaders(req)
    })
  );
});

function deployRecoveryQueryInput(req: express.Request) {
  const parsed = DeployRecoverySchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !(req.query.live === "1" || typeof req.query.targetUrl === "string"),
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.lastDeployError === "string" ? { lastDeployError: req.query.lastDeployError } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

function buildFastDeployRecoveryReleaseDrift(currentBaseUrl: string, targetBaseUrl: string) {
  const skills = agentCard(currentBaseUrl).skills;
  const skillIds = skills.map((skill) => skill.id);
  const deployRecover = skills.find((skill) => skill.id === "deploy.recover");
  const firstClickSmoke = skills.find((skill) => skill.id === FIRST_CLICK_SMOKE_SKILL_ID);
  const requiredAgentCardSignals = ["deploy.recover:tag:get-proof", FIRST_CLICK_SMOKE_REQUIRED_SIGNAL];
  const observedAgentCardSignals = [
    ...(deployRecover?.tags?.includes("get-proof") ? ["deploy.recover:tag:get-proof"] : []),
    ...(firstClickSmoke?.tags?.includes(FIRST_CLICK_SMOKE_LOCK_TAG) ? [FIRST_CLICK_SMOKE_REQUIRED_SIGNAL] : [])
  ];
  const proofModeEvidence = "Fast Deploy Recovery GET proof mode; use /deploy-recovery?live=1 for recursive release-drift probes.";
  const probe = (id: string, label: string, url: string): ReleaseDriftProbe => ({
    id,
    label,
    status: "passed",
    score: 100,
    url,
    evidence: proofModeEvidence,
    required: true
  });

  return buildReleaseDriftGuard({
    currentBaseUrl,
    targetBaseUrl,
    expectedSkillIds: skillIds,
    observedSkillIds: skillIds,
    requiredSkillIds: ["deploy.recover", FIRST_CLICK_SMOKE_SKILL_ID],
    requiredAgentCardSignals,
    observedAgentCardSignals,
    probes: [
      probe("target-health", "Target Cloud Run health", `${targetBaseUrl}/api/healthz`),
      probe("agent-card-skill-surface", "Target Agent Card skill surface", `${targetBaseUrl}/.well-known/agent-card.json`),
      probe("deploy-recovery-page", "Deploy Recovery proof page", `${targetBaseUrl}/deploy-recovery`),
      probe("ci-main", "Latest main CI", SUBMISSION_PROOF.ciWorkflowUrl)
    ]
  });
}

async function buildDeployRecoveryForRequest(req: express.Request, input: z.infer<typeof DeployRecoverySchema>) {
  const currentBaseUrl = publicBaseUrl(req);
  const targetBaseUrl = (input.targetUrl || SUBMISSION_PROOF.deployedUrl).replace(/\/$/, "");
  const releaseDrift = input.skipReleaseDrift
    ? buildFastDeployRecoveryReleaseDrift(currentBaseUrl, targetBaseUrl)
    : await buildReleaseDriftForTarget({
        currentBaseUrl,
        targetBaseUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });

  return buildDeployRecoveryPlan({
    baseUrl: currentBaseUrl,
    releaseDrift,
    lastDeployError: input.lastDeployError,
    mode: input.skipReleaseDrift ? "fast-proof" : "live-drift"
  });
}

app.get("/api/deploy-recovery", async (req, res) => {
  const result = deployRecoveryQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildDeployRecoveryForRequest(req, result.input));
});

app.get("/deploy-recovery", async (req, res) => {
  const result = deployRecoveryQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderDeployRecoveryHtml(await buildDeployRecoveryForRequest(req, result.input)));
});

app.post("/api/deploy-recovery", async (req, res) => {
  const parsed = DeployRecoverySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildDeployRecoveryForRequest(req, parsed.data));
});

app.post("/api/demo-receipt", (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });

  res.json(
    buildJudgeDemoReceipt({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      moatStress,
      squadOptimizer,
      protopediaUrl: parsed.data.protopediaUrl,
      videoUrl: parsed.data.videoUrl
    })
  );
});

function acceptanceMatrixQueryInput(req: express.Request) {
  const parsed = AcceptanceMatrixSchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !(req.query.live === "1" || typeof req.query.targetUrl === "string"),
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildAcceptanceMatrixForRequest(req: express.Request, input: z.infer<typeof AcceptanceMatrixSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目、必須技術、提出物、公開証拠を受入表として閉じる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer,
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl
  });
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });

  return buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift,
    submissionLaunch
  });
}

app.get("/api/acceptance-matrix", async (req, res) => {
  const result = acceptanceMatrixQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildAcceptanceMatrixForRequest(req, result.input));
});

app.get("/acceptance-matrix", async (req, res) => {
  const result = acceptanceMatrixQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderAcceptanceMatrixHtml(await buildAcceptanceMatrixForRequest(req, result.input)));
});

app.post("/api/acceptance-matrix", async (req, res) => {
  const parsed = AcceptanceMatrixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildAcceptanceMatrixForRequest(req, parsed.data));
});

function commandCenterQueryInput(req: express.Request) {
  const parsed = CommandCenterSchema.safeParse({
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !(req.query.live === "1" || typeof req.query.targetUrl === "string"),
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {}),
    ...(typeof req.query.currentDate === "string" ? { currentDate: req.query.currentDate } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildJudgeCommandCenterForRequest(req: express.Request, input: z.infer<typeof CommandCenterSchema>) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員が最初の90秒で見る証拠、残ブロッカー、次クリックを1画面に束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });

  return buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
}

app.get("/api/judge-command-center", async (req, res) => {
  const result = commandCenterQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildJudgeCommandCenterForRequest(req, result.input));
});

app.get("/judge-command-center", async (req, res) => {
  const result = commandCenterQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderJudgeCommandCenterHtml(await buildJudgeCommandCenterForRequest(req, result.input)));
});

app.post("/api/judge-command-center", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildJudgeCommandCenterForRequest(req, parsed.data));
});

app.post("/api/demo-concierge", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査員、買い手、提出者の最初の1クリックと証拠URLを固定する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });

  res.json(
    buildDemoConcierge({
      baseUrl,
      strategy,
      acceptance,
      command,
      battlecard: competitiveBattlecard,
      userPilot,
      pilotEconomics
    })
  );
});

function prizeStrategyQueryPayload(req: express.Request) {
  const selectedAgentIds =
    typeof req.query.selectedAgentIds === "string"
      ? req.query.selectedAgentIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const targetUrl = typeof req.query.targetUrl === "string" && req.query.targetUrl.trim().length > 0 ? req.query.targetUrl : undefined;
  return {
    projectBrief: typeof req.query.projectBrief === "string" && req.query.projectBrief.trim().length > 0 ? req.query.projectBrief : DEFAULT_PROJECT_BRIEF,
    selectedAgentIds,
    skipReleaseDrift: !(req.query.live === "1" || targetUrl),
    targetUrl,
    protopediaUrl: typeof req.query.protopediaUrl === "string" ? req.query.protopediaUrl : undefined,
    videoUrl: typeof req.query.videoUrl === "string" ? req.query.videoUrl : undefined,
    currentDate: typeof req.query.currentDate === "string" ? req.query.currentDate : undefined
  };
}

async function buildPrizeStrategyForRequest(req: express.Request, input: CommandCenterInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目の目標点、現在証拠、最終ピッチ順を優勝作戦として束ねる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });

  return buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
}

app.get("/api/prize-strategy", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(prizeStrategyQueryPayload(req));
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildPrizeStrategyForRequest(req, parsed.data));
});

app.get("/prize-strategy", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(prizeStrategyQueryPayload(req));
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const board = await buildPrizeStrategyForRequest(req, parsed.data);
  res.type("html").send(renderPrizeStrategyHtml(board));
});

app.post("/api/prize-strategy", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildPrizeStrategyForRequest(req, parsed.data));
});

async function buildWinGapRadarBundleForInput(req: express.Request, input: CommandCenterInput) {
  const parsed = { data: input };
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "競合/SWOTとMVP監査を、勝つために閉じる機能仮説へ変換する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl,
    strategy,
    marketIntel,
    moatStress
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl,
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const command = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });

  return {
    radar: buildWinGapRadar({
      baseUrl,
      strategy,
      marketIntel,
      moatStress,
      battlecard: competitiveBattlecard,
      mvpAudit,
      finalist,
      acceptance,
      prizeStrategy,
      observabilityOracle,
      demoConcierge,
      submissionLaunch
    }),
    submissionLaunch,
    releaseDrift
  };
}

app.post("/api/win-gap-radar", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json((await buildWinGapRadarBundleForInput(req, parsed.data)).radar);
});

app.post("/api/task-board", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "選択したAIへA2A仕事票を渡し、受入条件と証拠URLで検収する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });

  res.json(
    buildAgentTaskBoard({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      squadContract
    })
  );
});

app.post("/api/autonomy-ledger", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "AIエージェント中心性を、判断、委任、検証、運用、提出の証拠台帳として証明する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });

  res.json(
    buildAutonomyLedger({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      squadContract,
      proof
    })
  );
});

function submissionLaunchQueryInput(req: express.Request) {
  const candidate = {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  };
  const parsed = LaunchSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildSubmissionLaunchForRequest(req: express.Request, input: z.infer<typeof LaunchSchema>) {
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia作品URLと動画URLを受け取り、提出可能かを最終判定する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini,
    ci
  });
  const autopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });

  return buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
}

app.get("/api/submission-launch", async (req, res) => {
  const result = submissionLaunchQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildSubmissionLaunchForRequest(req, result.input));
});

app.get("/submission-launch", async (req, res) => {
  const result = submissionLaunchQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderSubmissionLaunchHtml(await buildSubmissionLaunchForRequest(req, result.input)));
});

app.post("/api/submission-launch", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildSubmissionLaunchForRequest(req, parsed.data));
});

app.post("/api/submission-closeout", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const mission = buildMissionRun(recommendation, strategy, "ProtoPedia貼付、動画公開、外部URL、最終提出を一画面でcloseoutする。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher,
    battlecard: competitiveBattlecard
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const launchGate = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });

  res.json(
    buildSubmissionCloseoutWorkbench({
      baseUrl,
      publisher,
      dossier,
      demoRunway,
      proof,
      launchGate
    })
  );
});

app.post("/api/judge-rehearsal", async (req, res) => {
  const parsed = LaunchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "初見審査員に90秒で価値、差別化、実用性、提出状態を伝えるリハーサルを作る。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const demoRunway = buildDemoRunway({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher
  });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({ baseUrl, recommendation, strategy, moatStress, squadOptimizer });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    securityReview,
    demoReceipt
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics
  });

  res.json(
    buildJudgeRehearsalRoom({
      baseUrl,
      acceptance,
      command: judgeCommand,
      concierge: demoConcierge,
      tour: judgeTour,
      prize: prizeStrategy,
      closeout: submissionCloseout,
      judgeDrill
    })
  );
});

function winnerPacketQueryInput(req: express.Request) {
  const liveReleaseDrift = req.query.live === "1" || req.query.live === "true";
  const candidate = {
    projectBrief: DEFAULT_PROJECT_BRIEF,
    selectedAgentIds: ["market-broker", "gemini-strategist", "cloud-run-sre"],
    skipReleaseDrift: !liveReleaseDrift,
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {}),
    ...(typeof req.query.protopediaUrl === "string" ? { protopediaUrl: req.query.protopediaUrl } : {}),
    ...(typeof req.query.videoUrl === "string" ? { videoUrl: req.query.videoUrl } : {})
  };
  const parsed = CommandCenterSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildWinnerPacketForRequest(req: express.Request, input: CommandCenterInput) {
  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(input.projectBrief, input.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "審査5項目の勝ち証拠を1つのpacketへ束ね、録画と質疑で迷わない状態にする。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(input)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(input.projectBrief, input.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: input.projectBrief,
    selectedAgentIds: input.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({ baseUrl, recommendation, strategy, moatStress, squadOptimizer });
  const releaseDrift = input.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: input.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: input.projectBrief,
        selectedAgentIds: input.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: input.protopediaUrl,
    videoUrl: input.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const judgeRehearsal = buildJudgeRehearsalRoom({
    baseUrl,
    acceptance,
    command: judgeCommand,
    concierge: demoConcierge,
    tour: judgeTour,
    prize: prizeStrategy,
    closeout: submissionCloseout,
    judgeDrill
  });

  return buildWinnerProofPacket({
    baseUrl,
    acceptance,
    battlecard: competitiveBattlecard,
    pilotEconomics,
    prize: prizeStrategy,
    rehearsal: judgeRehearsal,
    closeout: submissionCloseout,
    releaseDrift
  });
}

app.get("/api/winner-packet", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildWinnerPacketForRequest(req, result.input));
});

app.get("/winner-packet", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderWinnerProofPacketHtml(await buildWinnerPacketForRequest(req, result.input)));
});

app.post("/api/winner-packet", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildWinnerPacketForRequest(req, parsed.data));
});

async function buildObjectionArenaForRequest(req: express.Request, input: CommandCenterInput) {
  return buildObjectionArena(await buildWinnerPacketForRequest(req, input));
}

app.get("/api/objection-arena", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildObjectionArenaForRequest(req, result.input));
});

app.get("/objection-arena", async (req, res) => {
  const result = winnerPacketQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderObjectionArenaHtml(await buildObjectionArenaForRequest(req, result.input)));
});

app.post("/api/objection-arena", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildObjectionArenaForRequest(req, parsed.data));
});

function firstClickSmokeQueryInput(req: express.Request) {
  const parsed = FirstClickSmokeSchema.safeParse({
    ...(typeof req.query.targetUrl === "string" ? { targetUrl: req.query.targetUrl } : {})
  });
  if (!parsed.success) {
    return { error: { error: "invalid_request", issues: parsed.error.issues } };
  }
  return { input: parsed.data };
}

async function buildFirstClickSmokeForRequest(req: express.Request, input: z.infer<typeof FirstClickSmokeSchema>) {
  const currentBaseUrl = publicBaseUrl(req).replace(/\/$/, "");
  const targetBaseUrl = (input.targetUrl || currentBaseUrl).replace(/\/$/, "");
  const probeHeaders = currentBaseUrl === targetBaseUrl ? selfProbeHeaders(req) : undefined;
  const probes = await Promise.all(
    FIRST_CLICK_SMOKE_SENTINELS.map((sentinel) =>
      liveFirstClickHtmlProbe({
        sentinel,
        targetBaseUrl,
        init: probeHeaders ? { headers: probeHeaders } : undefined,
        timeoutMs: 30000
      })
    )
  );

  return buildFirstClickSmokeLock({ targetBaseUrl, probes });
}

app.get("/api/first-click-smoke", async (req, res) => {
  const result = firstClickSmokeQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.json(await buildFirstClickSmokeForRequest(req, result.input));
});

app.get("/first-click-smoke", async (req, res) => {
  const result = firstClickSmokeQueryInput(req);
  if ("error" in result) {
    res.status(400).json(result.error);
    return;
  }
  res.type("html").send(renderFirstClickSmokeHtml(await buildFirstClickSmokeForRequest(req, result.input)));
});

app.post("/api/first-click-smoke", async (req, res) => {
  const parsed = FirstClickSmokeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  res.json(await buildFirstClickSmokeForRequest(req, parsed.data));
});

app.post("/api/submission-runway", async (req, res) => {
  const parsed = CommandCenterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const marketIntel = buildMarketIntelReport({ baseUrl, recommendation, strategy });
  const mission = buildMissionRun(recommendation, strategy, "提出締切から逆算し、動画、ProtoPedia、構成図、最終フォームを検収順に閉じる。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({ baseUrl, recommendation, strategy, mission, opsDrill });
  const judgeDrill = buildJudgeDrill({ baseUrl, recommendation, strategy, mission, opsDrill, pitch });
  const finalist = buildFinalistSimulation({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract,
    submissionUrls: submissionUrlEvidence(parsed.data)
  });
  const publisher = buildProtoPediaPublisher({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist });
  const demoRunway = buildDemoRunway({ baseUrl, recommendation, strategy, mission, opsDrill, pitch, finalist, publisher });
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");
  const proof = buildJudgeProof({ baseUrl, recommendation, strategy, mission, opsDrill, gemini, ci });
  const autopilot = buildWinningAutopilot({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    dossier,
    proof,
    finalist
  });
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl,
    recommendation,
    strategy,
    liveEvidence: buildProofBackedLiveEvidence({ baseUrl, proof, ci }),
    opsDrill,
    pilotEconomics
  });
  const moatStress = buildMoatStressTest({ baseUrl, recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({ baseUrl, strategy, marketIntel, moatStress });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: parsed.data.projectBrief,
    selectedAgentIds: parsed.data.selectedAgentIds,
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({ baseUrl, recommendation, strategy, moatStress, squadOptimizer });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });
  const submissionLaunch = buildSubmissionLaunchGate({
    protopediaUrl: parsed.data.protopediaUrl,
    videoUrl: parsed.data.videoUrl,
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl,
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
  });
  const judgeTour = buildJudgeTour({
    baseUrl,
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl,
    acceptance,
    autopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl,
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl,
    strategy,
    acceptance,
    autopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const judgeRehearsal = buildJudgeRehearsalRoom({
    baseUrl,
    acceptance,
    command: judgeCommand,
    concierge: demoConcierge,
    tour: judgeTour,
    prize: prizeStrategy,
    closeout: submissionCloseout,
    judgeDrill
  });
  const winnerPacket = buildWinnerProofPacket({
    baseUrl,
    acceptance,
    battlecard: competitiveBattlecard,
    pilotEconomics,
    prize: prizeStrategy,
    rehearsal: judgeRehearsal,
    closeout: submissionCloseout,
    releaseDrift
  });

  res.json(
    buildFinalSubmissionRunway({
      baseUrl,
      currentDate: parsed.data.currentDate,
      winnerPacket,
      closeout: submissionCloseout,
      launchGate: submissionLaunch
    })
  );
});

app.post("/api/ops-drill", (req, res) => {
  const parsed = OpsDrillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  res.json(buildOpsDrill(recommendation, strategy, parsed.data.observed));
});

app.post("/api/security-review", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const ci = await fetchCiProof();
  res.json(
    buildSecurityReview({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      allowlist: ipAllowlistSummary,
      ci,
      geminiSecretConfigured: geminiSecretConfigured()
    })
  );
});

app.post("/api/impact-case", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  res.json(buildImpactCase({ recommendation, strategy, opsDrill, securityReview }));
});

app.post("/api/pilot-economics", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "導入費用、回収日数、価格レーン、買い手の反論をpilot economicsとして検証する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });

  res.json(
    buildPilotEconomics({
      recommendation,
      strategy,
      impactCase,
      userPilot,
      squadContract,
      opsDrill,
      securityReview
    })
  );
});

async function buildPilotValueSnapshotForRequest(req: express.Request) {
  const baseUrl = publicBaseUrl(req);
  const selectedAgentIds = ["market-broker", "gemini-strategist", "cloud-run-sre"];
  const recommendation = recommendSquad(DEFAULT_PROJECT_BRIEF, selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "実用性、初回体験、導入採算を審査員が直接開けるGET証拠にする。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const ci = await fetchCiProof();
  const securityReview = buildSecurityReview({
    baseUrl,
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci,
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({ recommendation, strategy, opsDrill, securityReview });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });

  return buildPilotValueSnapshot({
    baseUrl,
    impactCase,
    userPilot,
    pilotEconomics
  });
}

app.get("/api/pilot-value", async (req, res) => {
  res.json(await buildPilotValueSnapshotForRequest(req));
});

app.get("/pilot-value", async (req, res) => {
  res.type("html").send(renderPilotValueSnapshotHtml(await buildPilotValueSnapshotForRequest(req)));
});

app.post("/api/contracts", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "選択したAIを成果物、受入条件、SLA、検証コマンド付きで雇う。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  res.json(buildSquadContract({ recommendation, strategy, mission, opsDrill }));
});

app.post("/api/pitch", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "30秒で審査員に価値、AI自律性、DevOps証跡、提出準備を伝える。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  res.json(
    buildPitchRun({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill
    })
  );
});

app.post("/api/judge-drill", (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員からの厳しい質問に、短い回答と証拠リンクで反証する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  res.json(
    buildJudgeDrill({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch
    })
  );
});

app.post("/api/finalist", async (req, res) => {
  const parsed = AcceptanceMatrixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const baseUrl = publicBaseUrl(req);
  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員5役で最終候補に残せるかを模擬判定し、落選理由と次の一手を出す。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl,
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const releaseDrift = parsed.data.skipReleaseDrift
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: parsed.data.targetUrl || SUBMISSION_PROOF.deployedUrl,
        projectBrief: parsed.data.projectBrief,
        selectedAgentIds: parsed.data.selectedAgentIds,
        forwardedHeaders: selfProbeHeaders(req)
      });

  res.json(
    buildFinalistSimulation({
      baseUrl,
      recommendation,
      strategy,
      mission,
      opsDrill,
      pitch,
      judgeDrill,
      squadContract,
      submissionUrls: submissionUrlEvidence(parsed.data),
      releaseDrift
    })
  );
});

app.post("/api/proof", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  const recommendation = recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds);
  const strategy = buildWinningStrategy(recommendation);
  const mission = buildMissionRun(recommendation, strategy, "審査員に1クリックで提出可能性、AI実行、Cloud Run運用、A2A委任を証明する。");
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const [geminiResult, ciResult] = await Promise.allSettled([
    runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds),
    fetchCiProof()
  ]);
  const gemini =
    geminiResult.status === "fulfilled"
      ? geminiResult.value
      : localGeminiRecommendation(
          recommendation,
          geminiResult.reason instanceof Error ? geminiResult.reason.message : "Gemini request failed"
        );
  const ci = ciResult.status === "fulfilled" ? ciResult.value : ciUnavailable("CI status promise rejected");

  res.json(
    buildJudgeProof({
      baseUrl: publicBaseUrl(req),
      recommendation,
      strategy,
      mission,
      opsDrill,
      gemini,
      ci
    })
  );
});

app.post("/api/recommend", async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    return;
  }

  try {
    const result = await runGeminiWithRetry(parsed.data.projectBrief, parsed.data.selectedAgentIds);
    res.json(result);
  } catch (error) {
    const fallback = localGeminiRecommendation(
      recommendSquad(parsed.data.projectBrief, parsed.data.selectedAgentIds),
      error instanceof Error ? error.message : "Gemini request failed"
    );
    res.json(fallback);
  }
});

app.get("/.well-known/agent-card.json", (req, res) => {
  res.json(agentCard(publicBaseUrl(req)));
});

app.post("/a2a", async (req, res) => {
  const id = typeof req.body?.id === "undefined" ? randomUUID() : req.body.id;
  const method = String(req.body?.method || "message/send");
  const text =
    req.body?.params?.message?.parts?.find((part: { text?: string }) => typeof part.text === "string")?.text ||
    req.body?.params?.text ||
    "DevOps x AI Agent marketplace request";
  const baseUrl = publicBaseUrl(req);
  const isReleaseDriftGuardProbe = id === "release-drift-guard";
  const isEndpointSurfaceProbe = isReleaseDriftGuardProbe || id === "live-evidence-monitor";
  const recommendation = recommendSquad(String(text), ["market-broker", "gemini-strategist", "cloud-run-sre"], 140);
  const strategy = buildWinningStrategy(recommendation);
  const ci = isEndpointSurfaceProbe ? ciUnavailable("A2A endpoint-surface probe skips live CI to avoid recursive proof calls") : await fetchCiProof();
  const mission = buildMissionRun(recommendation, strategy, String(text));
  const opsDrill = buildOpsDrill(recommendation, strategy);
  const squadContract = buildSquadContract({ recommendation, strategy, mission, opsDrill });
  const pitch = buildPitchRun({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill
  });
  const judgeDrill = buildJudgeDrill({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch
  });
  const finalist = buildFinalistSimulation({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    judgeDrill,
    squadContract
  });
  const publisher = buildProtoPediaPublisher({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist
  });
  const marketIntel = buildMarketIntelReport({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy
  });
  const moatStress = buildMoatStressTest({ baseUrl: publicBaseUrl(req), recommendation, strategy, marketIntel });
  const competitiveBattlecard = buildCompetitiveBattlecard({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    moatStress
  });
  const demoRunway = buildDemoRunway({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    pitch,
    finalist,
    publisher,
    battlecard: competitiveBattlecard
  });
  const proof = buildJudgeProof({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    gemini: localGeminiRecommendation(recommendation, "A2A synchronous artifact uses /api/proof for live Gemini evidence"),
    ci
  });
  const winAutopilot = buildWinningAutopilot({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    pitch,
    finalist,
    publisher,
    demoRunway,
    proof
  });
  const dossier = buildSubmissionDossier({
    recommendation,
    strategy,
    mission,
    pitch,
    finalist,
    publisher,
    demoRunway,
    autopilot: winAutopilot,
    proof
  });
  const mvpAudit = buildMvpAudit({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    finalist,
    autopilot: winAutopilot,
    dossier,
    proof,
    marketIntel
  });
  const judgeBrief = buildJudgeBrief({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel,
    mvpAudit,
    autopilot: winAutopilot,
    dossier,
    proof,
    finalist
  });
  const autonomyLedger = buildAutonomyLedger({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract,
    proof
  });
  const taskBoard = buildAgentTaskBoard({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission,
    opsDrill,
    squadContract
  });
  const externalEvidence = buildExternalEvidenceRun({
    baseUrl: publicBaseUrl(req),
    probes: staticExternalEvidenceProbes()
  });
  const submissionLaunch = buildSubmissionLaunchGate({
    mvpAudit,
    dossier,
    proof,
    publisher
  });
  const submissionCloseout = buildSubmissionCloseoutWorkbench({
    baseUrl: publicBaseUrl(req),
    publisher,
    dossier,
    demoRunway,
    proof,
    launchGate: submissionLaunch
  });
  const securityReview = buildSecurityReview({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    allowlist: ipAllowlistSummary,
    ci: ciUnavailable("A2A synchronous artifact uses /api/security-review for live CI evidence"),
    geminiSecretConfigured: geminiSecretConfigured()
  });
  const impactCase = buildImpactCase({
    recommendation,
    strategy,
    opsDrill,
    securityReview
  });
  const userPilot = buildUserPilotLab({
    recommendation,
    strategy,
    impactCase,
    opsDrill,
    securityReview,
    squadContract
  });
  const pilotEconomics = buildPilotEconomics({
    recommendation,
    strategy,
    impactCase,
    userPilot,
    squadContract,
    opsDrill,
    securityReview
  });
  const artifactLiveEvidence = buildLiveEvidenceRun({
    baseUrl: publicBaseUrl(req),
    probes: [
      {
        id: "agent-card",
        label: "A2A Agent Card",
        status: "passed",
        score: 100,
        url: `${publicBaseUrl(req)}/.well-known/agent-card.json`,
        evidence: "A2A synchronous artifact exposes the current Agent Card endpoint; /api/live-evidence performs live public probes.",
        required: true
      },
      {
        id: "observability-oracle",
        label: "Observability Oracle endpoint",
        status: "passed",
        score: 100,
        url: `${publicBaseUrl(req)}/api/observability-oracle`,
        evidence: "Observability Oracle endpoint is present in the A2A artifact surface.",
        required: true
      },
      {
        id: "ci",
        label: "GitHub Actions CI",
        status: ci.status === "passed" ? "passed" : "watch",
        score: ci.status === "passed" ? 100 : 72,
        url: ci.url,
        evidence: ci.evidence,
        required: true
      }
    ]
  });
  const observabilityOracle = buildObservabilityOracle({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    liveEvidence: artifactLiveEvidence,
    opsDrill,
    pilotEconomics
  });
  const squadOptimizer = buildSquadOptimizer({
    projectBrief: String(text),
    selectedAgentIds: recommendation.selected.map((agent) => agent.id),
    budget: 140,
    maxSquadSize: 4
  });
  const demoReceipt = buildJudgeDemoReceipt({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    moatStress,
    squadOptimizer
  });
  const judgeTour = buildJudgeTour({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    marketIntel,
    judgeBrief,
    impactCase,
    securityReview,
    proof,
    demoRunway,
    submissionLaunch
  });
  const releaseDrift = isEndpointSurfaceProbe
    ? undefined
    : await buildReleaseDriftForTarget({
        currentBaseUrl: baseUrl,
        targetBaseUrl: SUBMISSION_PROOF.deployedUrl,
        projectBrief: String(text),
        selectedAgentIds: recommendation.selected.map((agent) => agent.id),
        forwardedHeaders: selfProbeHeaders(req)
      });
  const acceptance = buildJudgeAcceptanceMatrix({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    mvpAudit,
    autopilot: winAutopilot,
    proof,
    userPilot,
    impactCase,
    pilotEconomics,
    observabilityOracle,
    securityReview,
    demoReceipt,
    releaseDrift
  });
  const judgeCommand = buildJudgeCommandCenter({
    baseUrl: publicBaseUrl(req),
    acceptance,
    autopilot: winAutopilot,
    competitiveBattlecard,
    judgeTour,
    pilotEconomics,
    releaseDrift
  });
  const demoConcierge = buildDemoConcierge({
    baseUrl: publicBaseUrl(req),
    strategy,
    acceptance,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    userPilot,
    pilotEconomics
  });
  const prizeStrategy = buildPrizeStrategyBoard({
    baseUrl: publicBaseUrl(req),
    strategy,
    acceptance,
    autopilot: winAutopilot,
    command: judgeCommand,
    battlecard: competitiveBattlecard,
    demoConcierge,
    pilotEconomics,
    observabilityOracle,
    releaseDrift
  });
  const judgeRehearsal = buildJudgeRehearsalRoom({
    baseUrl: publicBaseUrl(req),
    acceptance,
    command: judgeCommand,
    concierge: demoConcierge,
    tour: judgeTour,
    prize: prizeStrategy,
    closeout: submissionCloseout,
    judgeDrill
  });
  const winnerPacket = buildWinnerProofPacket({
    baseUrl: publicBaseUrl(req),
    acceptance,
    battlecard: competitiveBattlecard,
    pilotEconomics,
    prize: prizeStrategy,
    rehearsal: judgeRehearsal,
    closeout: submissionCloseout,
    releaseDrift
  });
  const submissionRunway = buildFinalSubmissionRunway({
    baseUrl: publicBaseUrl(req),
    winnerPacket,
    closeout: submissionCloseout,
    launchGate: submissionLaunch
  });
  const winGapRadar = buildWinGapRadar({
    baseUrl: publicBaseUrl(req),
    strategy,
    marketIntel,
    moatStress,
    battlecard: competitiveBattlecard,
    mvpAudit,
    finalist,
    acceptance,
    prizeStrategy,
    observabilityOracle,
    demoConcierge,
    submissionLaunch
  });
  const architecturePack = buildArchitecturePack({
    baseUrl: publicBaseUrl(req),
    recommendation,
    strategy,
    mission
  });

  res.json({
    jsonrpc: "2.0",
    id,
    result: {
      id: randomUUID(),
      kind: "task",
      contextId: randomUUID(),
      status: {
        state: "completed",
        message: {
          role: "agent",
          parts: [
            {
              kind: "text",
              text: `${method}: ${recommendation.headline}`
            }
          ]
        }
      },
      artifacts: [
        {
          name: "marketplace-recommendation",
          parts: [
            {
              kind: "data",
              data: {
                selected: recommendation.selected.map((agent) => agent.name),
                after: recommendation.after,
                timeline: recommendation.a2aTimeline,
                strategy: {
                  judgeScore: strategy.judgeScore,
                  mvpScore: strategy.mvpScore,
                  moatScore: strategy.moatScore,
                  nextBestAgent: strategy.nextBestAgent?.agent.name ?? null,
                  swot: strategy.swot
                },
                marketIntel: {
                  id: marketIntel.id,
                  marketScore: marketIntel.marketScore,
                  status: marketIntel.status,
                  sourceCount: marketIntel.sources.length,
                  sourceProofLock: {
                    score: marketIntel.sourceProofLock.score,
                    readiness: marketIntel.sourceProofLock.readiness,
                    liveProbeCount: marketIntel.sourceProofLock.liveProbeCount,
                    failedCount: marketIntel.sourceProofLock.failedCount
                  },
                  competitors: marketIntel.comparisons.map((comparison) => ({
                    id: comparison.id,
                    sourceIds: comparison.sourceIds,
                    threatLevel: comparison.threatLevel
                  })),
                  moves: marketIntel.moves.map((move) => ({
                    id: move.id,
                    priority: move.priority,
                    action: move.action
                  }))
                },
                competitiveBattlecard: {
                  id: competitiveBattlecard.id,
                  battleScore: competitiveBattlecard.battleScore,
                  readiness: competitiveBattlecard.readiness,
                  cards: competitiveBattlecard.cards.map((card) => ({
                    id: card.id,
                    competitor: card.competitor,
                    status: card.status,
                    score: card.score,
                    sourceCount: card.sourceUrls.length
                  })),
                  topRisks: competitiveBattlecard.topRisks.map((risk) => ({
                    id: risk.id,
                    severity: risk.severity
                  })),
                  objectionReplay: {
                    replayScore: competitiveBattlecard.objectionReplay.replayScore,
                    readiness: competitiveBattlecard.objectionReplay.readiness,
                    weakestCompetitor: competitiveBattlecard.objectionReplay.weakestCompetitor,
                    steps: competitiveBattlecard.objectionReplay.steps.map((step) => ({
                      id: step.id,
                      status: step.status,
                      proofUrl: step.proofUrl
                    }))
                  },
                  winLossLock: {
                    winLossScore: competitiveBattlecard.winLossLock.winLossScore,
                    readiness: competitiveBattlecard.winLossLock.readiness,
                    lossRiskCount: competitiveBattlecard.winLossLock.lossRiskCount,
                    rows: competitiveBattlecard.winLossLock.rows.map((row) => ({
                      id: row.id,
                      status: row.status,
                      mustShowProofUrl: row.mustShowProofUrl,
                      judgeCriterionId: row.judgeCriterionId
                    }))
                  }
                },
                demoConcierge: {
                  id: demoConcierge.id,
                  conciergeScore: demoConcierge.conciergeScore,
                  readiness: demoConcierge.readiness,
                  singleNextClick: demoConcierge.singleNextClick,
                  routeLock: {
                    lockScore: demoConcierge.routeLock.lockScore,
                    readiness: demoConcierge.routeLock.readiness,
                    routeStepScore: demoConcierge.routeLock.routeStepScore,
                    proofLinkScore: demoConcierge.routeLock.proofLinkScore,
                    lockedSteps: demoConcierge.routeLock.lockedSteps.map((step) => ({
                      id: step.id,
                      status: step.status,
                      proofUrl: step.proofUrl
                    }))
                  },
                  focusLock: {
                    focusScore: demoConcierge.focusLock.focusScore,
                    readiness: demoConcierge.focusLock.readiness,
                    firstScreen: demoConcierge.focusLock.firstScreen,
                    deferredCount: demoConcierge.focusLock.deferredCount,
                    rules: demoConcierge.focusLock.rules.map((rule) => ({
                      id: rule.id,
                      action: rule.action,
                      status: rule.status
                    }))
                  },
                  lanes: demoConcierge.lanes.map((lane) => ({
                    id: lane.id,
                    persona: lane.persona,
                    firstClick: lane.firstClick,
                    scoreLift: lane.scoreLift,
                    firstEndpoint: lane.steps[0]?.endpoint
                  })),
                  successCriteria: demoConcierge.successCriteria.map((item) => ({
                    id: item.id,
                    status: item.status
                  }))
                },
                prizeStrategy: {
                  id: prizeStrategy.id,
                  prizeScore: prizeStrategy.prizeScore,
                  readiness: prizeStrategy.readiness,
                  proofMode: isEndpointSurfaceProbe ? "endpoint-surface" : "live-release-drift",
                  liveProofEndpoint: `${publicBaseUrl(req)}/api/prize-strategy`,
                  criteria: prizeStrategy.criteria.map((criterion) => ({
                    id: criterion.id,
                    score: criterion.currentScore,
                    target: criterion.targetScore,
                    status: criterion.status
                  })),
                  proofMoves: prizeStrategy.proofMoves.map((move) => ({
                    id: move.id,
                    score: move.score,
                    endpoint: move.endpoint
                  })),
                  risks: prizeStrategy.risks.map((risk) => ({
                    id: risk.id,
                    priority: risk.priority,
                    owner: risk.owner
                  }))
                },
                judgeRehearsal: {
                  id: judgeRehearsal.id,
                  rehearsalScore: judgeRehearsal.rehearsalScore,
                  readiness: judgeRehearsal.readiness,
                  nextRun: judgeRehearsal.nextRun,
                  segments: judgeRehearsal.segments.map((segment) => ({
                    id: segment.id,
                    status: segment.status,
                    proofUrl: segment.proofUrl
                  })),
                  questionDeck: judgeRehearsal.questionDeck.map((question) => ({
                    id: question.id,
                    status: question.status,
                    proofUrl: question.proofUrl
                  })),
                  defenseLock: {
                    defenseScore: judgeRehearsal.defenseLock.defenseScore,
                    readiness: judgeRehearsal.defenseLock.readiness,
                    hardQuestion: judgeRehearsal.defenseLock.hardQuestion,
                    checks: judgeRehearsal.defenseLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status,
                      proofUrl: check.proofUrl
                    }))
                  }
                },
                winnerPacket: {
                  id: winnerPacket.id,
                  packetScore: winnerPacket.packetScore,
                  readiness: winnerPacket.readiness,
                  nextAction: winnerPacket.nextAction,
                  criteria: winnerPacket.criteria.map((criterion) => ({
                    id: criterion.id,
                    status: criterion.status,
                    proofUrl: criterion.proofUrl
                  })),
                  missingExternal: winnerPacket.submissionCopy.missingExternal
                },
                submissionRunway: {
                  id: submissionRunway.id,
                  runwayScore: submissionRunway.runwayScore,
                  readiness: submissionRunway.readiness,
                  deadline: submissionRunway.deadline,
                  daysRemaining: submissionRunway.daysRemaining,
                  nextAction: {
                    id: submissionRunway.nextAction.id,
                    dueDate: submissionRunway.nextAction.dueDate,
                    status: submissionRunway.nextAction.status,
                    proofUrl: submissionRunway.nextAction.proofUrl
                  },
                  tracks: submissionRunway.tracks.map((track) => ({
                    id: track.id,
                    status: track.status,
                    score: track.score
                  }))
                },
                winGapRadar: {
                  id: winGapRadar.id,
                  radarScore: winGapRadar.radarScore,
                  readiness: winGapRadar.readiness,
                  mvpDecision: winGapRadar.mvpDecision,
                  lanes: winGapRadar.lanes.map((lane) => ({
                    id: lane.id,
                    status: lane.status,
                    score: lane.score,
                    priority: lane.priority,
                    proofUrl: lane.proofUrl,
                    demoCue: lane.demoCue,
                    mvpEvidence: lane.mvpEvidence
                  })),
                  featureBets: winGapRadar.featureBets.map((bet) => ({
                    id: bet.id,
                    priority: bet.priority,
                    status: bet.status,
                    proofUrl: bet.proofUrl
                  })),
                  externalGaps: winGapRadar.externalGaps.map((gap) => gap.id)
                },
                mvpAudit: {
                  id: mvpAudit.id,
                  mvpScore: mvpAudit.mvpScore,
                  band: mvpAudit.band,
                  verdict: mvpAudit.verdict,
                  gates: mvpAudit.gates.map((gate) => ({
                    id: gate.id,
                    status: gate.status,
                    score: gate.score
                  })),
                  blockers: mvpAudit.blockers.map((action) => ({
                    id: action.id,
                    priority: action.priority,
                    action: action.action
                  }))
                },
                judgeBrief: {
                  id: judgeBrief.id,
                  briefScore: judgeBrief.briefScore,
                  readiness: judgeBrief.readiness,
                  oneLineVerdict: judgeBrief.oneLineVerdict,
                  metrics: judgeBrief.keyMetrics.map((metric) => ({
                    id: metric.id,
                    value: metric.value,
                    tone: metric.tone
                  })),
                  risks: judgeBrief.riskRegister.map((risk) => ({
                    id: risk.id,
                    tone: risk.tone,
                    action: risk.action
                  }))
                },
                autonomyLedger: {
                  id: autonomyLedger.id,
                  ledgerScore: autonomyLedger.ledgerScore,
                  verdict: autonomyLedger.verdict,
                  phases: autonomyLedger.chain.map((event) => ({
                    id: event.id,
                    phase: event.phase,
                    status: event.status
                  })),
                  handoffs: autonomyLedger.handoffs.map((handoff) => ({
                    id: handoff.id,
                    status: handoff.status
                  })),
                  receipt: autonomyLedger.receipt.digest
                },
                taskBoard: {
                  id: taskBoard.id,
                  taskScore: taskBoard.taskScore,
                  readiness: taskBoard.readiness,
                  workOrders: taskBoard.workOrders.map((order) => ({
                    id: order.id,
                    agentId: order.agentId,
                    status: order.status,
                    proofUrl: order.proofUrl
                  })),
                  receipt: taskBoard.receipt.digest
                },
                externalEvidence: {
                  id: externalEvidence.id,
                  evidenceScore: externalEvidence.evidenceScore,
                  readiness: externalEvidence.readiness,
                  finalUrlsReady: externalEvidence.a2aPayload.finalUrlsReady,
                  probes: externalEvidence.probes.map((probe) => ({
                    id: probe.id,
                    status: probe.status,
                    url: probe.url || null
                  }))
                },
                submissionLaunch: {
                  id: submissionLaunch.id,
                  launchScore: submissionLaunch.launchScore,
                  readiness: submissionLaunch.readiness,
                  verdict: submissionLaunch.verdict,
                  urls: submissionLaunch.urlStatuses.map((item) => ({
                    id: item.id,
                    status: item.status
                  }))
                },
                submissionCloseout: {
                  id: submissionCloseout.id,
                  closeoutScore: submissionCloseout.closeoutScore,
                  readiness: submissionCloseout.readiness,
                  nextAction: {
                    id: submissionCloseout.nextAction.id,
                    status: submissionCloseout.nextAction.status,
                    endpoint: submissionCloseout.nextAction.endpoint
                  },
                  workItems: submissionCloseout.workItems.map((item) => ({
                    id: item.id,
                    status: item.status,
                    priority: item.priority
                  })),
                  protopediaQualityLock: {
                    qualityScore: submissionCloseout.protopediaQualityLock.qualityScore,
                    readiness: submissionCloseout.protopediaQualityLock.readiness,
                    checks: submissionCloseout.protopediaQualityLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status
                    }))
                  },
                  videoProofLock: {
                    lockScore: submissionCloseout.videoProofLock.lockScore,
                    readiness: submissionCloseout.videoProofLock.readiness,
                    checks: submissionCloseout.videoProofLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status,
                      evidenceUrl: check.evidenceUrl
                    }))
                  },
                  urlStatuses: submissionCloseout.urlStatuses.map((item) => ({
                    id: item.id,
                    status: item.status
                  }))
                },
                securityReview: {
                  id: securityReview.id,
                  securityScore: securityReview.securityScore,
                  posture: securityReview.posture,
                  verdict: securityReview.verdict,
                  controls: securityReview.controls.map((control) => ({
                    id: control.id,
                    status: control.status,
                    score: control.score
                  })),
                  threats: securityReview.threats.map((threat) => ({
                    id: threat.id,
                    severity: threat.severity,
                    likelihood: threat.likelihood
                  })),
                  nextSecurityHire: securityReview.nextSecurityHire?.name ?? null
                },
                impactCase: {
                  id: impactCase.id,
                  impactScore: impactCase.impactScore,
                  posture: impactCase.posture,
                  verdict: impactCase.verdict,
                  metrics: impactCase.metrics.map((metric) => ({
                    id: metric.id,
                    before: metric.before,
                    after: metric.after,
                    delta: metric.delta,
                    unit: metric.unit
                  })),
                  personas: impactCase.personas.map((persona) => ({
                    id: persona.id,
                    kpi: persona.kpi
                  })),
                  nextImpactHire: impactCase.nextImpactHire?.name ?? null
                },
                userPilot: {
                  id: userPilot.id,
                  pilotScore: userPilot.pilotScore,
                  readiness: userPilot.readiness,
                  timeToValueSeconds: userPilot.timeToValueSeconds,
                  usabilityLift: userPilot.usabilityLift,
                  paths: userPilot.paths.map((path) => ({
                    id: path.id,
                    persona: path.persona,
                    seconds: path.timeToValueSeconds
                  })),
                  frictions: userPilot.frictions.map((friction) => ({
                    id: friction.id,
                    severity: friction.severity,
                    owner: friction.owner
                  })),
                  guideRails: userPilot.guideRails.map((rail) => ({
                    id: rail.id,
                    screen: rail.screen,
                    reducesSeconds: rail.reducesSeconds
                  })),
                  nextClicks: userPilot.nextClicks.map((click) => ({
                    id: click.id,
                    screen: click.screen,
                    button: click.button
                  }))
                },
                pilotEconomics: {
                  id: pilotEconomics.id,
                  economicsScore: pilotEconomics.economicsScore,
                  posture: pilotEconomics.posture,
                  evidenceLock: {
                    lockScore: pilotEconomics.evidenceLock.lockScore,
                    readiness: pilotEconomics.evidenceLock.readiness,
                    checks: pilotEconomics.evidenceLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status,
                      evidenceRoute: check.evidenceRoute
                    }))
                  },
                  paybackDays: pilotEconomics.unitEconomics.paybackDays,
                  monthlyValueYen: pilotEconomics.unitEconomics.monthlyValueYen,
                  pilotCostYen: pilotEconomics.unitEconomics.pilotCostYen,
                  pricingLanes: pilotEconomics.pricingLanes.map((lane) => ({
                    id: lane.id,
                    priceYen: lane.priceYen,
                    status: lane.status
                  })),
                  buyerObjections: pilotEconomics.buyerObjections.map((objection) => ({
                    id: objection.id,
                    status: objection.status
                  }))
                },
                observabilityOracle: {
                  id: observabilityOracle.id,
                  oracleScore: observabilityOracle.oracleScore,
                  readiness: observabilityOracle.readiness,
                  decisiveDecision: observabilityOracle.a2aPayload.decisiveDecision,
                  receipts: observabilityOracle.receipts.map((receipt) => ({
                    id: receipt.id,
                    status: receipt.status,
                    metric: receipt.metric
                  })),
                  loop: observabilityOracle.loop.map((step) => ({
                    id: step.id,
                    phase: step.phase,
                    status: step.status,
                    proofUrl: step.proofUrl
                  }))
                },
                squadOptimizer: {
                  id: squadOptimizer.id,
                  optimizerScore: squadOptimizer.optimizerScore,
                  readiness: squadOptimizer.readiness,
                  budget: squadOptimizer.budget,
                  recommended: {
                    agentIds: squadOptimizer.recommended.agentIds,
                    totalPrice: squadOptimizer.recommended.totalPrice,
                    totalScore: squadOptimizer.recommended.totalScore,
                    coverageScore: squadOptimizer.recommended.coverageScore
                  },
                  stretch: squadOptimizer.stretch
                    ? {
                        agentIds: squadOptimizer.stretch.agentIds,
                        budgetGap: squadOptimizer.budgetGap,
                        totalScore: squadOptimizer.stretch.totalScore,
                        coverageScore: squadOptimizer.stretch.coverageScore
                      }
                    : null,
                  swapPlan: squadOptimizer.swapPlan.map((step) => ({
                    action: step.action,
                    label: step.label,
                    scoreImpact: step.scoreImpact
                  }))
                },
                judgeTour: {
                  id: judgeTour.id,
                  tourScore: judgeTour.tourScore,
                  readiness: judgeTour.readiness,
                  totalSeconds: judgeTour.totalSeconds,
                  headline: judgeTour.headline,
                  steps: judgeTour.steps.map((step) => ({
                    id: step.id,
                    status: step.status,
                    endpoint: step.endpoint
                  })),
                  claims: judgeTour.claims.map((claim) => ({
                    id: claim.id,
                    score: claim.score
                  })),
                  blockers: judgeTour.blockers.map((blocker) => ({
                    id: blocker.id,
                    severity: blocker.severity
                  }))
                },
                judgeCommand: {
                  id: judgeCommand.id,
                  commandScore: judgeCommand.commandScore,
                  readiness: judgeCommand.readiness,
                  openingMove: judgeCommand.openingMove,
                  metrics: judgeCommand.metrics.map((metric) => ({
                    id: metric.id,
                    value: metric.value,
                    status: metric.status
                  })),
                  proofButtons: judgeCommand.proofButtons.map((button) => ({
                    id: button.id,
                    status: button.status,
                    endpoint: button.endpoint
                  })),
                  blockers: judgeCommand.blockers.map((blocker) => ({
                    id: blocker.id,
                    priority: blocker.priority,
                    owner: blocker.owner
                  }))
                },
                mission: {
                  id: mission.id,
                  summary: mission.summary,
                  autonomyScore: mission.autonomyScore,
                  weakestCriterion: mission.weakestCriterion.label,
                  verificationCommands: mission.verificationCommands,
                  submissionPack: mission.submissionPack
                },
                opsDrill: {
                  id: opsDrill.id,
                  severity: opsDrill.severity,
                  readinessScore: opsDrill.readinessScore,
                  rollbackRecommended: opsDrill.rollbackRecommended,
                  nextOpsAgent: opsDrill.nextOpsAgent?.name ?? null,
                  runbookCommands: opsDrill.runbookCommands
                },
                contract: {
                  id: squadContract.id,
                  contractScore: squadContract.contractScore,
                  totalPrice: squadContract.totalPrice,
                  remainingBudget: squadContract.remainingBudget,
                  contracts: squadContract.contracts.map((contract) => ({
                    agentId: contract.agentId,
                    risk: contract.risk,
                    acceptanceCriteria: contract.acceptanceCriteria
                  }))
                },
                pitch: {
                  id: pitch.id,
                  readinessScore: pitch.readinessScore,
                  totalSeconds: pitch.totalSeconds,
                  scenes: pitch.scenes.map((scene) => ({
                    id: scene.id,
                    timeRange: scene.timeRange,
                    screen: scene.screen,
                    proof: scene.proof
                  })),
                  warnings: pitch.submissionWarnings.map((item) => item.id)
                },
                judgeDrill: {
                  id: judgeDrill.id,
                  readinessScore: judgeDrill.readinessScore,
                  hardestQuestion: judgeDrill.hardestQuestion,
                  crossExamDeck: judgeDrill.crossExamDeck.map((card) => ({
                    id: card.id,
                    competitor: card.competitor,
                    risk: card.risk,
                    scoreLift: card.scoreLift,
                    firstProof: card.proofSteps[0]?.endpoint
                  })),
                  timeboxedAnswer: judgeDrill.timeboxedAnswer,
                  objections: judgeDrill.objections.map((objection) => ({
                    criterionId: objection.criterionId,
                    risk: objection.risk,
                    question: objection.question
                  }))
                },
                finalist: {
                  id: finalist.id,
                  finalistScore: finalist.finalistScore,
                  finalistBand: finalist.finalistBand,
                  judgeConsensus: finalist.judgeConsensus,
                  topConcern: finalist.topConcern,
                  gaps: finalist.gaps.map((gap) => ({
                    id: gap.id,
                    severity: gap.severity,
                    action: gap.action
                  }))
                },
                publisher: {
                  id: publisher.id,
                  publishScore: publisher.publishScore,
                  readiness: publisher.readiness,
                  qualityLock: {
                    qualityScore: publisher.qualityLock.qualityScore,
                    readiness: publisher.qualityLock.readiness,
                    checks: publisher.qualityLock.checks.map((check) => ({
                      id: check.id,
                      status: check.status
                    }))
                  },
                  pasteFields: publisher.pasteFields.map((field) => field.id),
                  missingExternal: publisher.missingExternal.map((item) => item.id)
                },
                demoRunway: {
                  id: demoRunway.id,
                  demoScore: demoRunway.demoScore,
                  readiness: demoRunway.readiness,
                  totalSeconds: demoRunway.totalSeconds,
                  steps: demoRunway.steps.map((step) => ({
                    id: step.id,
                    status: step.status,
                    evidenceUrl: step.evidenceUrl
                  })),
                  risks: demoRunway.risks.map((risk) => ({
                    id: risk.id,
                    mitigation: risk.mitigation
                  }))
                },
                winAutopilot: {
                  id: winAutopilot.id,
                  winScore: winAutopilot.winScore,
                  readiness: winAutopilot.readiness,
                  blockers: winAutopilot.blockers.map((action) => ({
                    id: action.id,
                    priority: action.priority,
                    command: action.command
                  })),
                  lanes: winAutopilot.lanes.map((lane) => ({
                    id: lane.id,
                    score: lane.score,
                    status: lane.status
                  }))
                },
                dossier: {
                  id: dossier.id,
                  dossierScore: dossier.dossierScore,
                  readiness: dossier.readiness,
                  copyBlocks: dossier.copyBlocks.map((block) => block.id),
                  missingLinks: dossier.links.filter((link) => link.status === "watch").map((link) => link.id),
                  handoffPacket: {
                    submitFields: dossier.handoffPacket.submitFields.map((field) => ({ id: field.id, status: field.status })),
                    qualityLock: {
                      qualityScore: dossier.handoffPacket.qualityLock.qualityScore,
                      readiness: dossier.handoffPacket.qualityLock.readiness,
                      checks: dossier.handoffPacket.qualityLock.checks.map((check) => ({
                        id: check.id,
                        status: check.status
                      }))
                    },
                    videoChapters: dossier.handoffPacket.videoChapters.map((chapter) => ({
                      id: chapter.id,
                      timeRange: chapter.timeRange,
                      screen: chapter.screen,
                      status: chapter.status
                    })),
                    architecturePack: {
                      score: dossier.handoffPacket.architecturePack.architectureScore,
                      readiness: dossier.handoffPacket.architecturePack.readiness,
                      diagramUrl: dossier.handoffPacket.architecturePack.diagramUrl,
                      requirements: dossier.handoffPacket.architecturePack.requirements.map((requirement) => ({
                        id: requirement.id,
                        status: requirement.status
                      }))
                    },
                    missingOnly: dossier.handoffPacket.missingOnly.map((item) => item.id)
                  },
                  finalChecks: dossier.finalChecks.map((check) => ({
                    id: check.id,
                    status: check.status
                  }))
                },
                architecturePack: {
                  id: architecturePack.id,
                  architectureScore: architecturePack.architectureScore,
                  readiness: architecturePack.readiness,
                  diagramUrl: architecturePack.diagramUrl,
                  nodes: architecturePack.nodes.map((node) => ({ id: node.id, layer: node.layer })),
                  requirements: architecturePack.requirements.map((requirement) => ({
                    id: requirement.id,
                    status: requirement.status
                  }))
                },
                architecturePackEndpoint: `${publicBaseUrl(req)}/api/architecture-pack`,
                architecturePackPageEndpoint: `${publicBaseUrl(req)}/architecture-pack`,
                dossierEndpoint: `${publicBaseUrl(req)}/api/dossier`,
                dossierPageEndpoint: `${publicBaseUrl(req)}/dossier`,
                marketIntelEndpoint: `${publicBaseUrl(req)}/api/market-intel`,
                moatStressEndpoint: `${publicBaseUrl(req)}/api/moat-stress`,
                competitiveBattlecardEndpoint: `${publicBaseUrl(req)}/api/competitive-battlecard`,
                competitiveSwotSnapshotEndpoint: `${publicBaseUrl(req)}/competitive-swot`,
                competitiveDecisionMatrixEndpoint: `${publicBaseUrl(req)}/api/competitive-decision-matrix`,
                competitiveDecisionMatrixPageEndpoint: `${publicBaseUrl(req)}/competitive-decision-matrix`,
                judgeSnapshotEndpoint: `${publicBaseUrl(req)}/api/judge-snapshot`,
                judgeSnapshotPageEndpoint: `${publicBaseUrl(req)}/judge-snapshot`,
                firstClickProof: buildFirstClickProof(publicBaseUrl(req)),
                firstClickSmokeEndpoint: `${publicBaseUrl(req)}/api/first-click-smoke`,
                firstClickSmokePageEndpoint: `${publicBaseUrl(req)}/first-click-smoke`,
                mvpReadinessSnapshotEndpoint: `${publicBaseUrl(req)}/mvp-readiness`,
                mvpReadinessSnapshotJsonEndpoint: `${publicBaseUrl(req)}/api/mvp-readiness`,
                autonomySnapshotEndpoint: `${publicBaseUrl(req)}/autonomy-snapshot`,
                autonomySnapshotJsonEndpoint: `${publicBaseUrl(req)}/api/autonomy-snapshot`,
                demoConciergeEndpoint: `${publicBaseUrl(req)}/api/demo-concierge`,
                prizeStrategyEndpoint: `${publicBaseUrl(req)}/api/prize-strategy`,
                prizeStrategyPageEndpoint: `${publicBaseUrl(req)}/prize-strategy`,
                judgeRehearsalEndpoint: `${publicBaseUrl(req)}/api/judge-rehearsal`,
                winnerPacketEndpoint: `${publicBaseUrl(req)}/api/winner-packet`,
                winnerPacketPageEndpoint: `${publicBaseUrl(req)}/winner-packet`,
                winnerPacketJsonEndpoint: `${publicBaseUrl(req)}/api/winner-packet`,
                winnerSufficiencyEndpoint: `${publicBaseUrl(req)}/api/winner-sufficiency`,
                winnerSufficiencyPageEndpoint: `${publicBaseUrl(req)}/winner-sufficiency`,
                objectionArenaEndpoint: `${publicBaseUrl(req)}/api/objection-arena`,
                objectionArenaPageEndpoint: `${publicBaseUrl(req)}/objection-arena`,
                submissionRunwayEndpoint: `${publicBaseUrl(req)}/api/submission-runway`,
                submissionAssetsPageEndpoint: `${publicBaseUrl(req)}/submission-assets`,
                submissionAssetsJsonEndpoint: `${publicBaseUrl(req)}/api/submission-assets`,
                recordingScriptPageEndpoint: `${publicBaseUrl(req)}/recording-script`,
                recordingScriptJsonEndpoint: `${publicBaseUrl(req)}/api/recording-script`,
                winGapRadarEndpoint: `${publicBaseUrl(req)}/api/win-gap-radar`,
                mvpAuditEndpoint: `${publicBaseUrl(req)}/api/mvp-audit`,
                judgeBriefEndpoint: `${publicBaseUrl(req)}/api/judge-brief`,
                autonomyLedgerEndpoint: `${publicBaseUrl(req)}/api/autonomy-ledger`,
                taskBoardEndpoint: `${publicBaseUrl(req)}/api/task-board`,
                externalEvidenceEndpoint: `${publicBaseUrl(req)}/api/external-evidence`,
                externalEvidencePageEndpoint: `${publicBaseUrl(req)}/external-evidence`,
                submissionLaunchEndpoint: `${publicBaseUrl(req)}/api/submission-launch`,
                submissionLaunchPageEndpoint: `${publicBaseUrl(req)}/submission-launch`,
                submissionCloseoutEndpoint: `${publicBaseUrl(req)}/api/submission-closeout`,
                securityReviewEndpoint: `${publicBaseUrl(req)}/api/security-review`,
                impactCaseEndpoint: `${publicBaseUrl(req)}/api/impact-case`,
                pilotEconomicsEndpoint: `${publicBaseUrl(req)}/api/pilot-economics`,
                pilotValueSnapshotEndpoint: `${publicBaseUrl(req)}/pilot-value`,
                pilotValueSnapshotJsonEndpoint: `${publicBaseUrl(req)}/api/pilot-value`,
                buyerProposalEndpoint: `${publicBaseUrl(req)}/buyer-proposal`,
                buyerProposalJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-proposal`,
                buyerProposalMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-proposal.md`,
                buyerDecisionEndpoint: `${publicBaseUrl(req)}/buyer-decision`,
                buyerDecisionJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-decision`,
                buyerDecisionMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-decision.md`,
                procurementDecisionEndpoint: `${publicBaseUrl(req)}/procurement-decision`,
                procurementDecisionJsonEndpoint: `${publicBaseUrl(req)}/api/procurement-decision`,
                procurementDecisionMarkdownEndpoint: `${publicBaseUrl(req)}/procurement-decision.md`,
                buyerProofRoomEndpoint: `${publicBaseUrl(req)}${BUYER_PROOF_ROOM_PATH}`,
                buyerProofRoomJsonEndpoint: `${publicBaseUrl(req)}/api${BUYER_PROOF_ROOM_PATH}`,
                buyerProofRoomMarkdownEndpoint: `${publicBaseUrl(req)}${BUYER_PROOF_ROOM_PATH}.md`,
                buyerTrustManifestEndpoint: `${publicBaseUrl(req)}/buyer-trust-manifest`,
                buyerTrustManifestJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-trust-manifest`,
                buyerTrustManifestMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-trust-manifest.md`,
                buyerTrustManifestWellKnownEndpoint: `${publicBaseUrl(req)}/.well-known/buyer-proof.json`,
                buyerTrustManifestReceiptVerifyEndpoint: `${publicBaseUrl(req)}${BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH}`,
                buyerProofVerifierEndpoint: `${publicBaseUrl(req)}/buyer-proof-verifier`,
                buyerProofVerifierJsonEndpoint: `${publicBaseUrl(req)}${BUYER_PROOF_VERIFIER_API_PATH}`,
                receiptVerifierEndpoint: `${publicBaseUrl(req)}${RECEIPT_VERIFICATION_DESK_PATH}`,
                receiptVerifierJsonEndpoint: `${publicBaseUrl(req)}${RECEIPT_VERIFICATION_DESK_API_PATH}`,
                buyerEvidenceBoardEndpoint: `${publicBaseUrl(req)}/buyer-evidence-board`,
                buyerEvidenceBoardJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-evidence-board`,
                buyerEvidenceBoardMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-evidence-board.md`,
                buyerEvidenceBoardReceiptVerifyEndpoint: `${publicBaseUrl(req)}${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}`,
                buyerDecisionFollowUpEndpoint: `${publicBaseUrl(req)}/buyer-decision-follow-up`,
                buyerDecisionFollowUpJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-decision-follow-up`,
                buyerDecisionFollowUpMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-decision-follow-up.md`,
                buyerDecisionFollowUpCsvEndpoint: `${publicBaseUrl(req)}/buyer-decision-follow-up.csv`,
                buyerDecisionReceiptEndpoint: `${publicBaseUrl(req)}/buyer-decision-receipt`,
                buyerDecisionReceiptJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-decision-receipt`,
                buyerDecisionReceiptMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-decision-receipt.md`,
                buyerDecisionReceiptVerifyEndpoint: `${publicBaseUrl(req)}${BUYER_DECISION_RECEIPT_VERIFY_PATH}`,
                buyerReviewKitEndpoint: `${publicBaseUrl(req)}/buyer-review-kit`,
                buyerReviewKitJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-review-kit`,
                buyerReviewKitMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-review-kit.md`,
                buyerAcceptancePathEndpoint: `${publicBaseUrl(req)}/buyer-acceptance-path`,
                buyerAcceptancePathJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-acceptance-path`,
                buyerAcceptancePathMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-acceptance-path.md`,
                buyerAcceptancePathReceiptVerifyEndpoint: `${publicBaseUrl(req)}${BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH}`,
                globalPublishabilityEndpoint: `${publicBaseUrl(req)}/global-publishability`,
                globalPublishabilityJsonEndpoint: `${publicBaseUrl(req)}/api/global-publishability`,
                globalPublishabilityMarkdownEndpoint: `${publicBaseUrl(req)}/global-publishability.md`,
                sampleBuyerProofAuditEndpoint: `${publicBaseUrl(req)}${SAMPLE_BUYER_PROOF_AUDIT_PATH}`,
                sampleBuyerProofAuditJsonEndpoint: `${publicBaseUrl(req)}/api/sample/buyer-proof-audit`,
                sampleBuyerProofAuditMarkdownEndpoint: `${publicBaseUrl(req)}${SAMPLE_BUYER_PROOF_AUDIT_PATH}.md`,
                ...agentCardDiligenceEndpointSet(publicBaseUrl(req)),
                ...agentCardShortlistEndpointSet(publicBaseUrl(req)),
                ...agentCardTrialPlanEndpointSet(publicBaseUrl(req)),
                ...agentCardTrialVerificationEndpointSet(publicBaseUrl(req)),
                ...agentCardTrialHandoffEndpointSet(publicBaseUrl(req)),
                pilotAgreementEndpoint: `${publicBaseUrl(req)}/pilot-agreement`,
                pilotAgreementJsonEndpoint: `${publicBaseUrl(req)}/api/pilot-agreement`,
                pilotAgreementMarkdownEndpoint: `${publicBaseUrl(req)}/pilot-agreement.md`,
                pilotEvidenceLedgerEndpoint: `${publicBaseUrl(req)}/pilot-evidence-ledger`,
                pilotEvidenceLedgerJsonEndpoint: `${publicBaseUrl(req)}/api/pilot-evidence-ledger`,
                pilotEvidenceLedgerMarkdownEndpoint: `${publicBaseUrl(req)}/pilot-evidence-ledger.md`,
                adoptionPlanEndpoint: `${publicBaseUrl(req)}/adoption-plan`,
                adoptionPlanJsonEndpoint: `${publicBaseUrl(req)}/api/adoption-plan`,
                adoptionPlanMarkdownEndpoint: `${publicBaseUrl(req)}/adoption-plan.md`,
                trustCenterEndpoint: `${publicBaseUrl(req)}/trust-center`,
                trustCenterJsonEndpoint: `${publicBaseUrl(req)}/api/trust-center`,
                trustCenterMarkdownEndpoint: `${publicBaseUrl(req)}/trust-center.md`,
                commercialOfferEndpoint: `${publicBaseUrl(req)}/commercial-offer`,
                commercialOfferJsonEndpoint: `${publicBaseUrl(req)}/api/commercial-offer`,
                commercialOfferMarkdownEndpoint: `${publicBaseUrl(req)}/commercial-offer.md`,
                buyerPilotContractEndpoint: `${publicBaseUrl(req)}/buyer-pilot-contract`,
                buyerPilotContractJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-pilot-contract`,
                buyerPilotContractMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-pilot-contract.md`,
                buyerPilotContractReceiptVerifyEndpoint: `${publicBaseUrl(req)}${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}`,
                sponsorReviewEndpoint: `${publicBaseUrl(req)}/sponsor-review`,
                sponsorReviewJsonEndpoint: `${publicBaseUrl(req)}/api/sponsor-review`,
                sponsorReviewMarkdownEndpoint: `${publicBaseUrl(req)}/sponsor-review.md`,
                buyerProofPacketEndpoint: `${publicBaseUrl(req)}/buyer-proof-packet`,
                buyerProofPacketJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-proof-packet`,
                buyerProofPacketMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-proof-packet.md`,
                pilotExecutionEndpoint: `${publicBaseUrl(req)}/pilot-execution`,
                pilotExecutionJsonEndpoint: `${publicBaseUrl(req)}/api/pilot-execution`,
                pilotExecutionMarkdownEndpoint: `${publicBaseUrl(req)}/pilot-execution.md`,
                buyerDiligenceEndpoint: `${publicBaseUrl(req)}/buyer-diligence`,
                buyerDiligenceJsonEndpoint: `${publicBaseUrl(req)}/api/buyer-diligence`,
                buyerDiligenceMarkdownEndpoint: `${publicBaseUrl(req)}/buyer-diligence.md`,
                observabilityOracleEndpoint: `${publicBaseUrl(req)}/api/observability-oracle`,
                observabilityOraclePageEndpoint: `${publicBaseUrl(req)}/observability-oracle`,
                judgeCommandEndpoint: `${publicBaseUrl(req)}/api/judge-command-center`,
                judgeCommandPageEndpoint: `${publicBaseUrl(req)}/judge-command-center`,
                deployRecoveryEndpoint: `${publicBaseUrl(req)}/api/deploy-recovery`,
                deployRecoveryPageEndpoint: `${publicBaseUrl(req)}/deploy-recovery`,
                userPilotEndpoint: `${publicBaseUrl(req)}/api/user-pilot`,
                squadOptimizerEndpoint: `${publicBaseUrl(req)}/api/squad-optimizer`,
                liveEvidenceEndpoint: `${publicBaseUrl(req)}/api/live-evidence`,
                releaseDriftEndpoint: `${publicBaseUrl(req)}/api/release-drift`,
                winAutopilotEndpoint: `${publicBaseUrl(req)}/api/win-autopilot`,
                winAutopilotPageEndpoint: `${publicBaseUrl(req)}/win-autopilot`,
                demoReceiptEndpoint: `${publicBaseUrl(req)}/api/demo-receipt`,
                acceptanceMatrixEndpoint: `${publicBaseUrl(req)}/api/acceptance-matrix`,
                acceptanceMatrixPageEndpoint: `${publicBaseUrl(req)}/acceptance-matrix`,
                judgeTourEndpoint: `${publicBaseUrl(req)}/api/judge-tour`,
                winRunEndpoint: `${publicBaseUrl(req)}/api/win-run`,
                demoRunEndpoint: `${publicBaseUrl(req)}/api/demo-run`,
                proofEndpoint: `${publicBaseUrl(req)}/api/proof`,
                finalistEndpoint: `${publicBaseUrl(req)}/api/finalist`,
                publisherEndpoint: `${publicBaseUrl(req)}/api/publisher`,
                publisherPageEndpoint: `${publicBaseUrl(req)}/publisher`,
                ciWorkflowUrl: SUBMISSION_PROOF.ciWorkflowUrl
              }
            }
          ]
        }
      ]
    }
  });
});

const distPath = path.resolve(process.cwd(), "dist");
app.use("/docs", express.static(path.resolve(process.cwd(), "docs")));
app.use(express.static(distPath));
app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`A2A Agent Marketplace listening on http://${displayHost}:${port}`);
});
