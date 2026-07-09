import {
  BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH,
  verifyBuyerEvidenceBoardReceiptRequest
} from "./buyerEvidenceBoardReceiptVerifier.js";
import {
  BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH,
  verifyBuyerDecisionFollowUpReceiptRequest
} from "./buyerDecisionFollowUpReceiptVerifier.js";
import {
  BUYER_DECISION_RECEIPT_VERIFY_PATH,
  verifyBuyerDecisionReceiptRequest
} from "./buyerDecisionReceiptVerifier.js";
import {
  QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH,
  verifyQuickBuyerDecisionReplyRecordRequest
} from "./quickBuyerDecisionReplyRecordReceiptVerifier.js";
import {
  QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
  verifyQuickBuyerValidationAnswerRecordRequest
} from "./quickBuyerValidationAnswerRecordReceiptVerifier.js";
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
import {
  QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH,
  verifyQuickExternalReviewDecisionReceiptRequest
} from "./quickExternalReviewDecisionReceiptVerifier.js";
import {
  QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH,
  verifyQuickExternalReviewOwnerPacketReceiptRequest
} from "./quickExternalReviewOwnerPacketReceiptVerifier.js";
import {
  QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERIFY_PATH,
  verifyQuickExternalReviewPacketManifestRequest
} from "./quickExternalReviewPacketReceiptVerifier.js";
import {
  BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH,
  verifyBuyerAcceptancePathReceiptRequest
} from "./buyerAcceptancePathReceiptVerifier.js";
import {
  BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH,
  verifyBuyerProofPacketReceiptRequest
} from "./buyerProofPacketReceiptVerifier.js";
import {
  BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
  verifyBuyerTrustManifestReceiptRequest
} from "./buyerTrustManifestReceiptVerifier.js";
import {
  COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH,
  verifyCommercialOfferReceiptRequest
} from "./commercialOfferReceiptVerifier.js";
import {
  BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH,
  verifyBuyerPilotContractReceiptRequest
} from "./buyerPilotContractReceiptVerifier.js";
import {
  GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH,
  verifyGlobalPublishabilityReceiptRequest
} from "./globalPublishabilityReceiptVerifier.js";
import {
  GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH,
  verifyGlobalPublishabilityRepairCheckReceiptRequest
} from "./globalPublishabilityRepairCheckReceiptVerifier.js";
import {
  GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH,
  verifyGlobalPublishabilityReviewResponseRequest
} from "./globalPublishabilityReviewResponseReceiptVerifier.js";
import {
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
  verifyHomepageOutcomeArtifactReceiptRequest
} from "./homepageOutcomeArtifactReceiptVerifier.js";
import {
  HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH,
  verifyHomepageOutcomeSpineReceiptRequest
} from "./homepageOutcomeSpineReceiptVerifier.js";
import {
  HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH,
  verifyHomepageValueLensReceiptRequest
} from "./homepageValueLensReceiptVerifier.js";
import {
  HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH,
  verifyHeroOutcomeReplayReceiptRequest
} from "./heroOutcomeReplayReceiptVerifier.js";
import {
  QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
  verifyQuickWorkflowConversionReceiptRequest
} from "./quickWorkflowConversionReceiptVerifier.js";
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
import {
  QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH,
  verifyQuickPublicValueReleaseReceiptRequest
} from "./quickPublicValueReleaseReceiptVerifier.js";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutRequest
} from "./quickValueRealizationCloseoutReceiptVerifier.js";
import {
  QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
  verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest
} from "./quickValueRealizationCloseoutRepairReceiptVerifier.js";
import {
  QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
  verifyQuickValueRealizationAcceptanceRequest
} from "./quickValueRealizationAcceptanceReceiptVerifier.js";
import {
  BUYER_VALUE_ACCEPTANCE_VERIFY_PATH,
  verifyBuyerValueAcceptanceReceiptRequest
} from "./buyerValueAcceptanceReceiptVerifier.js";
import { QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH, verifyQuickValueReviewExecutionRequest } from "./quickValueReviewExecutionReceiptVerifier.js";
import {
  QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
  verifyQuickValueReviewExecutionCloseoutRequest
} from "./quickValueReviewExecutionCloseoutReceiptVerifier.js";
import {
  SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH,
  verifySubmissionFinalSubmitReceiptRequest
} from "./submissionFinalSubmitReceiptVerifier.js";
import { WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH, verifyWorkflowLiveProofAuditRequest } from "./workflowLiveProofAuditReceiptVerifier.js";

export const RECEIPT_VERIFICATION_DESK_API_PATH = "/api/receipt-verifier";
export const RECEIPT_VERIFICATION_DESK_PATH = "/receipt-verifier";

type ReceiptVerificationDeskStatus = "verified" | "mismatch" | "invalid_request" | "unsupported";
type ReceiptProofField = "checksum" | "digest";
export type ReceiptVerificationHandoffDecision =
  | "accept-for-review"
  | "accept-with-review-note"
  | "accept-receipt-hold-packet"
  | "hold-for-re-export"
  | "hold-for-valid-request";

export type ReceiptVerificationDeskHandoff = {
  decision: ReceiptVerificationHandoffDecision;
  title: string;
  summary: string;
  reviewerNote: string;
  nextAction: string;
  memoMarkdown: string;
};

type NativeVerificationResult = {
  statusCode: number;
  body: {
    error?: string;
    issues?: unknown;
    skill?: string;
    verification?: {
      status?: "verified" | "mismatch";
      [key: string]: unknown;
    };
    receipt?: unknown;
    manifest?: unknown;
  };
};

type ReceiptDispatcher = (input: unknown) => NativeVerificationResult;

export type SupportedReceiptDescriptor = {
  receiptType: string;
  label: string;
  proofField: ReceiptProofField;
  verifierApiPath: string;
  buyerUse: string;
  dispatch: ReceiptDispatcher;
};

export type ReceiptVerificationDeskBody = {
  skill: "receipt-verifier.dispatch";
  status: ReceiptVerificationDeskStatus;
  verified: boolean;
  receiptType: string;
  receiptLabel: string;
  proofField?: ReceiptProofField;
  sourceVerifierApiPath?: string;
  nativeSkill?: string;
  verification?: unknown;
  summary?: unknown;
  error?: string;
  issues?: unknown;
  nextAction: string;
  handoff: ReceiptVerificationDeskHandoff;
  supportedReceipts: Array<Omit<SupportedReceiptDescriptor, "dispatch">>;
};

export type ReceiptVerificationDeskResult = {
  statusCode: number;
  body: ReceiptVerificationDeskBody;
};

const SUPPORTED_RECEIPTS: SupportedReceiptDescriptor[] = [
  {
    receiptType: "homepage-outcome-artifact.v1",
    label: "Homepage outcome artifact",
    proofField: "checksum",
    verifierApiPath: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the first-screen buyer packet, proof gate, value claim, and decision handoff have not changed after export.",
    dispatch: verifyHomepageOutcomeArtifactReceiptRequest
  },
  {
    receiptType: "homepage-outcome-spine.v1",
    label: "Homepage outcome spine",
    proofField: "checksum",
    verifierApiPath: HOMEPAGE_OUTCOME_SPINE_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the first buyer decision route, proof readiness, packet readiness, publishability decision, reviewer decision, and step actions have not changed after export.",
    dispatch: verifyHomepageOutcomeSpineReceiptRequest
  },
  {
    receiptType: "homepage-value-lens.v1",
    label: "Homepage value lens",
    proofField: "checksum",
    verifierApiPath: HOMEPAGE_VALUE_LENS_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the first-screen value assumptions, modeled value, measured support, payback, confidence score, and actions have not changed after export.",
    dispatch: verifyHomepageValueLensReceiptRequest
  },
  {
    receiptType: "hero-outcome-replay.v1",
    label: "Hero outcome replay",
    proofField: "checksum",
    verifierApiPath: HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the first-screen buyer decision replay, approval path, decision receipt link, and downside sensitivity have not changed after export.",
    dispatch: verifyHeroOutcomeReplayReceiptRequest
  },
  {
    receiptType: "global-publishability.v1",
    label: "Global publishability report",
    proofField: "checksum",
    verifierApiPath: GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the public launch decision, gate scores, repair runbook, launch packet, and handoff memo have not changed after export.",
    dispatch: verifyGlobalPublishabilityReceiptRequest
  },
  {
    receiptType: "global-publishability-repair-check.v1",
    label: "Global publishability repair check",
    proofField: "checksum",
    verifierApiPath: GLOBAL_PUBLISHABILITY_REPAIR_CHECK_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms a repair proof check still matches the selected runbook step, required proof URLs, source publishability receipt, and rerun or hold decision.",
    dispatch: verifyGlobalPublishabilityRepairCheckReceiptRequest
  },
  {
    receiptType: "global-publishability-review-response.v1",
    label: "Global publishability review response",
    proofField: "checksum",
    verifierApiPath: GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_VERIFY_PATH,
    buyerUse: "Confirms an external reviewer response still matches the source publishability receipt, inspected proof IDs, decision outcome, and next action.",
    dispatch: verifyGlobalPublishabilityReviewResponseRequest
  },
  {
    receiptType: "quick-workflow-conversion.v1",
    label: "Quick workflow conversion",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_CONVERSION_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the pasted workflow note still matches the generated buyer room rows, proof repair state, decision gate, and pilot-week receipt.",
    dispatch: verifyQuickWorkflowConversionReceiptRequest
  },
  {
    receiptType: "quick-workflow-value-acceptance-contract.v1",
    label: "Quick workflow value acceptance contract",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
    buyerUse: "Confirms the generated value acceptance contract still matches the buyer, workflow, pilot price, value floor, stop rule, acceptance line, and contract gates.",
    dispatch: verifyQuickWorkflowValueAcceptanceContractRequest
  },
  {
    receiptType: "quick-workflow-pilot-run-log.v1",
    label: "Quick workflow pilot run log",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_PILOT_RUN_LOG_VERIFY_PATH,
    buyerUse: "Confirms the pilot run log still matches the buyer, kickoff receipt, run window, evidence score, missing proof count, and task evidence status.",
    dispatch: verifyQuickWorkflowPilotRunLogRequest
  },
  {
    receiptType: "quick-workflow-pilot-decision-brief.v1",
    label: "Quick workflow pilot decision brief",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_PILOT_DECISION_BRIEF_VERIFY_PATH,
    buyerUse: "Confirms the expansion decision brief still matches the source run and contract receipts, buyer ask, value and risk guardrails, next owner, and decision actions.",
    dispatch: verifyQuickWorkflowPilotDecisionBriefRequest
  },
  {
    receiptType: "quick-workflow-pilot-expansion-guardrail.v1",
    label: "Quick workflow pilot expansion guardrail",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_PILOT_EXPANSION_GUARDRAIL_VERIFY_PATH,
    buyerUse: "Confirms the expansion ledger still matches the source receipts, measured monthly value, value floor, stop rule, owner acceptance, receipt chain, and next-window scope.",
    dispatch: verifyQuickWorkflowPilotExpansionGuardrailRequest
  },
  {
    receiptType: "quick-workflow-buyer-expansion-handoff.v1",
    label: "Quick workflow buyer expansion handoff",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_VERIFY_PATH,
    buyerUse: "Confirms the procurement handoff still matches the one-pager, approval control, receipt chain, owner tasks, and next value recheck before approval.",
    dispatch: verifyQuickWorkflowBuyerExpansionHandoffRequest
  },
  {
    receiptType: "quick-workflow-buyer-expansion-handoff-signoff.v1",
    label: "Quick workflow buyer expansion handoff signoff",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_HANDOFF_SIGNOFF_VERIFY_PATH,
    buyerUse: "Confirms the procurement signoff decision still matches the source handoff, approval control, required proof, next retained-value action, operating owner ledger, and calendar status.",
    dispatch: verifyQuickWorkflowBuyerExpansionHandoffSignoffRequest
  },
  {
    receiptType: "quick-public-value-release.v1",
    label: "Public value release gate",
    proofField: "checksum",
    verifierApiPath: QUICK_PUBLIC_VALUE_RELEASE_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the monthly value claim is still locked or released by the source conversion receipt, sponsor gate, publication kit, and live proof audit.",
    dispatch: verifyQuickPublicValueReleaseReceiptRequest
  },
  {
    receiptType: "buyer-proof-packet.v1",
    label: "Buyer proof packet",
    proofField: "digest",
    verifierApiPath: BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the approval packet rows, gaps, and artifact coverage have not changed after export.",
    dispatch: verifyBuyerProofPacketReceiptRequest
  },
  {
    receiptType: "buyer-evidence-board.v1",
    label: "Buyer evidence board",
    proofField: "checksum",
    verifierApiPath: BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the scope, value, measured run, live proof, agent trust, and decision route board is intact.",
    dispatch: verifyBuyerEvidenceBoardReceiptRequest
  },
  {
    receiptType: "buyer-trust-manifest.v1",
    label: "Buyer trust manifest",
    proofField: "digest",
    verifierApiPath: BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the public manifest, artifact index, publication window, and receipt digest are aligned.",
    dispatch: verifyBuyerTrustManifestReceiptRequest
  },
  {
    receiptType: "buyer-decision-receipt.v1",
    label: "Buyer decision receipt",
    proofField: "checksum",
    verifierApiPath: BUYER_DECISION_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the recorded continue, revise, or stop decision matches the proof and procurement conditions.",
    dispatch: verifyBuyerDecisionReceiptRequest
  },
  {
    receiptType: "quick-buyer-decision-reply-record.v1",
    label: "Buyer reply record",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_DECISION_REPLY_RECORD_VERIFY_PATH,
    buyerUse: "Confirms the pasted buyer reply, detected decision, owner action, and activation work order have not changed after export.",
    dispatch: verifyQuickBuyerDecisionReplyRecordRequest
  },
  {
    receiptType: "quick-buyer-validation-answer-record.v1",
    label: "Buyer validation answer record",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_VALIDATION_ANSWER_RECORD_VERIFY_PATH,
    buyerUse: "Confirms the pasted buyer validation answers, matched evidence signals, missing proof, recommended buyer decision, source conversion receipt, and next owner action have not changed after export.",
    dispatch: verifyQuickBuyerValidationAnswerRecordRequest
  },
  {
    receiptType: "quick-value-realization-closeout.v1",
    label: "Value realization closeout",
    proofField: "checksum",
    verifierApiPath: QUICK_VALUE_REALIZATION_CLOSEOUT_VERIFY_PATH,
    buyerUse: "Confirms the Day 0/7/14/30 operating evidence, retained value, decision, source ledger, and closeout task outcomes have not changed after export.",
    dispatch: verifyQuickValueRealizationCloseoutRequest
  },
  {
    receiptType: "quick-value-realization-closeout-repair.v1",
    label: "Value closeout repair acknowledgement",
    proofField: "checksum",
    verifierApiPath: QUICK_VALUE_REALIZATION_CLOSEOUT_REPAIR_VERIFY_PATH,
    buyerUse: "Confirms owner acknowledgements for source-ledger closeout repairs still match the source closeout receipt, source ledger receipt, and repair item outcomes.",
    dispatch: verifyQuickValueRealizationCloseoutRepairAcknowledgementRequest
  },
  {
    receiptType: "quick-value-realization-acceptance.v1",
    label: "Value realization acceptance packet",
    proofField: "checksum",
    verifierApiPath: QUICK_VALUE_REALIZATION_ACCEPTANCE_VERIFY_PATH,
    buyerUse: "Confirms the final buyer-facing value proof decision still matches the closeout receipt, repair acknowledgement receipt, retained value, and acceptance checks.",
    dispatch: verifyQuickValueRealizationAcceptanceRequest
  },
  {
    receiptType: "buyer-value-acceptance.v1",
    label: "Buyer value acceptance receipt",
    proofField: "checksum",
    verifierApiPath: BUYER_VALUE_ACCEPTANCE_VERIFY_PATH,
    buyerUse: "Confirms the sponsor ask decision still matches the buyer value report, assumption audit, measured pilot proof, public receipt, and acceptance checks.",
    dispatch: verifyBuyerValueAcceptanceReceiptRequest
  },
  {
    receiptType: "quick-value-review-execution.v1",
    label: "Value review execution packet",
    proofField: "checksum",
    verifierApiPath: QUICK_VALUE_REVIEW_EXECUTION_VERIFY_PATH,
    buyerUse: "Confirms the post-review execution owners, due windows, guardrails, and task acceptance checks still match the accepted value proof.",
    dispatch: verifyQuickValueReviewExecutionRequest
  },
  {
    receiptType: "quick-value-review-execution-closeout.v1",
    label: "Value review execution closeout",
    proofField: "checksum",
    verifierApiPath: QUICK_VALUE_REVIEW_EXECUTION_CLOSEOUT_VERIFY_PATH,
    buyerUse: "Confirms the post-review work was actually completed with task-level evidence, owner acceptance, and the source execution receipt attached.",
    dispatch: verifyQuickValueReviewExecutionCloseoutRequest
  },
  {
    receiptType: "quick-workflow-buyer-expansion-recheck-closeout.v1",
    label: "Buyer expansion recheck closeout",
    proofField: "checksum",
    verifierApiPath: QUICK_WORKFLOW_BUYER_EXPANSION_RECHECK_CLOSEOUT_VERIFY_PATH,
    buyerUse: "Confirms the 30-day retained-value recheck evidence, actual value, floor decision, and reopened receipt chain still match the source procurement signoff.",
    dispatch: verifyQuickWorkflowBuyerExpansionRecheckCloseoutRequest
  },
  {
    receiptType: "workflow-live-proof-audit.v1",
    label: "Workflow live proof audit",
    proofField: "checksum",
    verifierApiPath: WORKFLOW_LIVE_PROOF_AUDIT_VERIFY_PATH,
    buyerUse: "Confirms the live proof audit rows, checked timestamp, score, verifier outcome, and next action have not changed after export.",
    dispatch: verifyWorkflowLiveProofAuditRequest
  },
  {
    receiptType: "submission-final-submit-live-receipt.v1",
    label: "Final submission live receipt",
    proofField: "checksum",
    verifierApiPath: SUBMISSION_FINAL_SUBMIT_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the final GitHub, Cloud Run, ProtoPedia, video URL reachability check, deadline, and submit hold rule have not changed after export.",
    dispatch: verifySubmissionFinalSubmitReceiptRequest
  },
  {
    receiptType: "quick-buyer-evidence-response-owner-packet.v1",
    label: "Buyer evidence response owner packet",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_EVIDENCE_RESPONSE_OWNER_PACKET_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the returned buyer evidence response, conversion evidence receipt, owner runbook, and handoff packet have not changed after export.",
    dispatch: verifyQuickBuyerEvidenceResponseOwnerPacketReceiptRequest
  },
  {
    receiptType: "quick-buyer-evidence-adoption-risk-disposition.v1",
    label: "Buyer adoption risk disposition",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_DISPOSITION_VERIFY_PATH,
    buyerUse: "Confirms the buyer adoption risk ledger, reviewer disposition, clearance score, risk rows, and next owner action have not changed after export.",
    dispatch: verifyQuickBuyerEvidenceAdoptionRiskDispositionRequest
  },
  {
    receiptType: "quick-buyer-evidence-adoption-risk-owner-closeout.v1",
    label: "Buyer adoption risk owner closeout",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_OWNER_CLOSEOUT_VERIFY_PATH,
    buyerUse: "Confirms owner task closures, evidence note, source disposition receipt, handoff status, and next buyer-send action have not changed after export.",
    dispatch: verifyQuickBuyerEvidenceAdoptionRiskOwnerCloseoutRequest
  },
  {
    receiptType: "quick-buyer-evidence-adoption-risk-send-control.v1",
    label: "Buyer-send adoption risk control",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_EVIDENCE_ADOPTION_RISK_SEND_CONTROL_VERIFY_PATH,
    buyerUse: "Confirms the final buyer-send risk gate, closeout checksum, recheck window, stop rule, control criteria, and next owner action have not changed after export.",
    dispatch: verifyQuickBuyerEvidenceAdoptionRiskSendControlRequest
  },
  {
    receiptType: "quick-buyer-evidence-value-checkpoint.v1",
    label: "Buyer value checkpoint receipt",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_EVIDENCE_VALUE_CHECKPOINT_VERIFY_PATH,
    buyerUse: "Confirms the Day 7 buyer value checkpoint, actual value signal, source evidence pack, owner action, and next decision have not changed after export.",
    dispatch: verifyQuickBuyerEvidenceValueCheckpointRequest
  },
  {
    receiptType: "quick-buyer-evidence-value-owner-closeout.v1",
    label: "Buyer value owner closeout",
    proofField: "checksum",
    verifierApiPath: QUICK_BUYER_EVIDENCE_VALUE_OWNER_CLOSEOUT_VERIFY_PATH,
    buyerUse: "Confirms owner task closures, evidence note, source checkpoint receipt, handoff status, and next value action have not changed after export.",
    dispatch: verifyQuickBuyerEvidenceValueOwnerCloseoutRequest
  },
  {
    receiptType: "quick-external-review-packet.v1",
    label: "External review packet manifest",
    proofField: "checksum",
    verifierApiPath: QUICK_EXTERNAL_REVIEW_PACKET_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the external review packet artifacts, source receipts, clearance, send rule, and checksum are intact.",
    dispatch: verifyQuickExternalReviewPacketManifestRequest
  },
  {
    receiptType: "quick-external-review-decision.v1",
    label: "External review decision",
    proofField: "checksum",
    verifierApiPath: QUICK_EXTERNAL_REVIEW_DECISION_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the reviewer response, source packet manifest, readiness count, and next action have not changed after export.",
    dispatch: verifyQuickExternalReviewDecisionReceiptRequest
  },
  {
    receiptType: "quick-external-review-owner-packet.v1",
    label: "External review owner packet",
    proofField: "checksum",
    verifierApiPath: QUICK_EXTERNAL_REVIEW_OWNER_PACKET_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the owner repair packet, regeneration note, acceptance criteria, source response, and packet manifest have not changed after export.",
    dispatch: verifyQuickExternalReviewOwnerPacketReceiptRequest
  },
  {
    receiptType: "buyer-acceptance-path.v1",
    label: "Buyer acceptance path",
    proofField: "checksum",
    verifierApiPath: BUYER_ACCEPTANCE_PATH_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the external review, buyer reply, procurement case, commercial offer, adoption operation, follow-up, and guardrails are the exported approval path.",
    dispatch: verifyBuyerAcceptancePathReceiptRequest
  },
  {
    receiptType: "buyer-decision-follow-up.v1",
    label: "Buyer follow-up ledger",
    proofField: "checksum",
    verifierApiPath: BUYER_DECISION_FOLLOW_UP_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms meeting owners, due windows, close conditions, and CSV ledger rows have not changed after export.",
    dispatch: verifyBuyerDecisionFollowUpReceiptRequest
  },
  {
    receiptType: "commercial-offer.v1",
    label: "Commercial offer",
    proofField: "checksum",
    verifierApiPath: COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the commercial tier, value stress test, guardrails, and approval memo are the exported offer.",
    dispatch: verifyCommercialOfferReceiptRequest
  },
  {
    receiptType: "buyer-pilot-contract.v1",
    label: "Buyer pilot contract",
    proofField: "checksum",
    verifierApiPath: BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH,
    buyerUse: "Confirms the buyer pilot scope, first commitment, proof gates, trust boundary, owner path, and stop rules are the exported contract.",
    dispatch: verifyBuyerPilotContractReceiptRequest
  }
];

export const SUPPORTED_RECEIPT_TYPES = SUPPORTED_RECEIPTS.map(({ dispatch: _dispatch, ...receipt }) => receipt);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

type ReceiptVerificationDeskBodySeed = Omit<ReceiptVerificationDeskBody, "handoff" | "supportedReceipts">;

const RECEIPT_STATE_FIELDS = [
  "status",
  "readiness",
  "decision",
  "sourceReceiptDecision",
  "clearance",
  "packetStatus",
  "routeStatus",
  "approvalDecision",
  "decisionRecommendation",
  "selectedDecision",
  "replyDecision",
  "recommendedDecision",
  "launchDecision",
  "trailStatus"
];

const RECEIPT_BLOCKING_COUNT_FIELDS = ["blockedItems", "blockedCount", "missingProofCount", "blockedDecisionConditionCount", "openDecisionConditionCount"];

function compactText(value: unknown, fallback = "none") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function verificationInstruction(value: unknown) {
  if (!isRecord(value)) return null;
  return typeof value.instruction === "string" ? value.instruction : null;
}

function receiptStateValues(summary: unknown) {
  if (!isRecord(summary)) return [];
  return RECEIPT_STATE_FIELDS.flatMap((field) => {
    const value = summary[field];
    if (typeof value === "string" || typeof value === "number") return [`${field}=${value}`];
    return [];
  });
}

function receiptStateLine(summary: unknown) {
  const values = receiptStateValues(summary);
  return values.length ? values.join("; ") : "No summarized readiness fields were returned.";
}

function hasPositiveCount(summary: unknown, fields: string[]) {
  if (!isRecord(summary)) return false;
  return fields.some((field) => {
    const value = summary[field];
    return typeof value === "number" && value > 0;
  });
}

function hasHardHoldSignal(summary: unknown) {
  if (hasPositiveCount(summary, RECEIPT_BLOCKING_COUNT_FIELDS)) return true;
  return receiptStateValues(summary).some((entry) => {
    const value = entry.split("=").slice(1).join("=").toLowerCase();
    return (
      value === "blocked" ||
      value === "block" ||
      value === "internal-only" ||
      value === "repair-before-share" ||
      value === "no-send" ||
      value === "do-not-publish" ||
      value === "revise" ||
      value === "hold" ||
      value === "stop" ||
      value === "declined" ||
      value === "failed" ||
      value.startsWith("needs-") ||
      value.includes("blocked") ||
      value.includes("repair")
    );
  });
}

function hasReviewSignal(summary: unknown) {
  return receiptStateValues(summary).some((entry) => {
    const value = entry.split("=").slice(1).join("=").toLowerCase();
    return value === "watch" || value === "attention" || value === "conditional" || value === "sponsor-review" || value.includes("review");
  });
}

function handoffDecisionFor(body: ReceiptVerificationDeskBodySeed): ReceiptVerificationHandoffDecision {
  if (body.verified) {
    if (hasHardHoldSignal(body.summary)) return "accept-receipt-hold-packet";
    if (hasReviewSignal(body.summary)) return "accept-with-review-note";
    return "accept-for-review";
  }
  if (body.status === "mismatch") return "hold-for-re-export";
  return "hold-for-valid-request";
}

function handoffTextFor(decision: ReceiptVerificationHandoffDecision) {
  if (decision === "accept-for-review") {
    return {
      title: "Receipt can move into review",
      summary: "The verifier accepted this receipt and the summary does not name a blocker.",
      nextAction: "Attach this memo to the reviewer packet before any downstream send decision."
    };
  }
  if (decision === "accept-with-review-note") {
    return {
      title: "Receipt can move into review with a note",
      summary: "The verifier accepted this receipt, but the summarized state asks the reviewer to inspect a watch or review condition.",
      nextAction: "Attach this memo and ask the reviewer to inspect the watch condition before sharing the packet."
    };
  }
  if (decision === "accept-receipt-hold-packet") {
    return {
      title: "Receipt verified, packet stays on hold",
      summary: "The checksum or digest matches, but the receipt summary names a blocked, internal-only, repair, or revise state.",
      nextAction: "Keep the packet internal until the named blocker is cleared, then re-export and run the verifier again."
    };
  }
  if (decision === "hold-for-re-export") {
    return {
      title: "Hold this receipt for re-export",
      summary: "The verifier detected a checksum or digest mismatch.",
      nextAction: "Ask the workspace owner to re-export the artifact from the source system before accepting it."
    };
  }
  return {
    title: "Hold this receipt before review",
    summary: "The verifier could not turn this input into a supported receipt.",
    nextAction: "Use a generated verification request JSON file and run the verifier again."
  };
}

function buildReceiptVerificationHandoff(body: ReceiptVerificationDeskBodySeed, httpStatus: number): ReceiptVerificationDeskHandoff {
  const decision = handoffDecisionFor(body);
  const copy = handoffTextFor(decision);
  const stateLine = receiptStateLine(body.summary);
  const verifier = compactText(body.sourceVerifierApiPath || body.error || "none");
  const instruction = compactText(
    verificationInstruction(body.verification) || body.nextAction,
    "Review the verifier response before sharing this receipt."
  );
  const reviewerNote = `${instruction} Receipt state: ${stateLine}`;
  const nextAction = body.verified ? copy.nextAction : compactText(body.nextAction, copy.nextAction);
  const memoMarkdown = [
    "# Receipt verification handoff",
    "",
    `Decision: ${decision}`,
    `HTTP status: ${httpStatus}`,
    `Receipt type: ${compactText(body.receiptType, "unknown")}`,
    `Receipt label: ${compactText(body.receiptLabel, "Unknown receipt")}`,
    `Source verifier: ${verifier}`,
    `Verified: ${body.verified ? "yes" : "no"}`,
    `Receipt state: ${stateLine}`,
    "",
    "## Reviewer note",
    reviewerNote,
    "",
    "## Next action",
    nextAction
  ].join("\n");

  return {
    decision,
    title: copy.title,
    summary: copy.summary,
    reviewerNote,
    nextAction,
    memoMarkdown
  };
}

function buildReceiptVerificationDeskResult(statusCode: number, seed: ReceiptVerificationDeskBodySeed): ReceiptVerificationDeskResult {
  return {
    statusCode,
    body: {
      ...seed,
      handoff: buildReceiptVerificationHandoff(seed, statusCode),
      supportedReceipts: SUPPORTED_RECEIPT_TYPES
    }
  };
}

function receiptTypeFromRecord(record: Record<string, unknown>) {
  const type = typeof record.receiptVersion === "string" ? record.receiptVersion : record.manifestVersion;
  return typeof type === "string" ? type : null;
}

function receiptTypeFrom(input: unknown) {
  if (!isRecord(input)) return null;
  if (isRecord(input.payload)) {
    const payloadType = receiptTypeFromRecord(input.payload);
    if (payloadType) return payloadType;
  }
  if (isRecord(input.manifest)) {
    const manifestType = receiptTypeFromRecord(input.manifest);
    if (manifestType) return manifestType;
  }
  return receiptTypeFromRecord(input);
}

function nextActionFor(status: ReceiptVerificationDeskStatus, label: string) {
  if (status === "verified") {
    return `${label} receipt is verified. The exported payload matches its checksum or digest.`;
  }
  if (status === "mismatch") {
    return `Do not accept this ${label.toLowerCase()} receipt. Ask the workspace owner to re-export the artifact from the source system.`;
  }
  if (status === "unsupported") {
    return "Use one of the supported generated verification request JSON files, or add a dispatcher before accepting this receipt externally.";
  }
  return "Paste the generated verification request JSON exactly as exported from the product.";
}

function nativeSummary(body: NativeVerificationResult["body"]) {
  return body.receipt ?? body.manifest ?? null;
}

function normalizeNativeResult(descriptor: SupportedReceiptDescriptor, native: NativeVerificationResult): ReceiptVerificationDeskResult {
  const verificationStatus = native.body.verification?.status;
  const status: ReceiptVerificationDeskStatus =
    verificationStatus === "verified" || verificationStatus === "mismatch" ? verificationStatus : "invalid_request";

  return buildReceiptVerificationDeskResult(native.statusCode, {
    skill: "receipt-verifier.dispatch",
    status,
    verified: status === "verified",
    receiptType: descriptor.receiptType,
    receiptLabel: descriptor.label,
    proofField: descriptor.proofField,
    sourceVerifierApiPath: descriptor.verifierApiPath,
    nativeSkill: native.body.skill,
    verification: native.body.verification ?? null,
    summary: nativeSummary(native.body),
    error: native.body.error,
    issues: native.body.issues,
    nextAction: nextActionFor(status, descriptor.label)
  });
}

export function verifyReceiptVerificationDeskRequest(input: unknown): ReceiptVerificationDeskResult {
  const receiptType = receiptTypeFrom(input);
  if (!receiptType) {
    return buildReceiptVerificationDeskResult(400, {
      skill: "receipt-verifier.dispatch",
      status: "invalid_request",
      verified: false,
      receiptType: "unknown",
      receiptLabel: "Unknown receipt",
      error: "invalid_request",
      nextAction: nextActionFor("invalid_request", "receipt")
    });
  }

  const descriptor = SUPPORTED_RECEIPTS.find((receipt) => receipt.receiptType === receiptType);
  if (!descriptor) {
    return buildReceiptVerificationDeskResult(422, {
      skill: "receipt-verifier.dispatch",
      status: "unsupported",
      verified: false,
      receiptType,
      receiptLabel: "Unsupported receipt",
      error: "unsupported_receipt",
      nextAction: nextActionFor("unsupported", "receipt")
    });
  }

  return normalizeNativeResult(descriptor, descriptor.dispatch(input));
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value: string) {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function renderSupportedReceipts() {
  return SUPPORTED_RECEIPT_TYPES.map(
    (receipt) => `<article>
      <span>${escapeHtml(receipt.proofField)}</span>
      <h2>${escapeHtml(receipt.label)}</h2>
      <p>${escapeHtml(receipt.buyerUse)}</p>
      <code>${escapeHtml(receipt.receiptType)}</code>
      <small>${escapeHtml(receipt.verifierApiPath)}</small>
    </article>`
  ).join("");
}

export function renderReceiptVerificationDeskHtml(input: {
  apiUrl: string;
  sampleRequestJson: string;
  initialStatusLabel?: string;
  autoVerify?: boolean;
  storedRequestKey?: string;
  links?: {
    trustManifestUrl?: string;
    proofVerifierUrl?: string;
    appUrl?: string;
  };
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt Verification Desk</title>
    <style>
      :root { color-scheme: light; --ink: #182023; --muted: #60706b; --paper: #f3f0e8; --panel: #fffdf7; --line: #cbd6d1; --teal: #0f766e; --blue: #2457a6; --amber: #b98112; --red: #a82135; }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: var(--paper); font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 380px); gap: 12px; padding: 30px 0 12px; align-items: stretch; }
      .hero, .api-plate, .desk, .result, .handoff, article { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 16px 34px rgba(24,32,35,.07); }
      .hero { padding: 24px; }
      .api-plate { display: grid; align-content: end; gap: 8px; padding: 18px; color: #fffdf7; background: linear-gradient(140deg, #16201e, var(--teal) 58%, var(--blue)); }
      .eyebrow, article span, .result span { color: var(--teal); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 820px; margin: 8px 0 10px; font-size: clamp(2.1rem, 4.8vw, 4.4rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0; font-size: 1.05rem; line-height: 1.12; letter-spacing: 0; }
      p, small, li { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, button { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: #fff; font: inherit; font-size: .86rem; font-weight: 900; text-decoration: none; cursor: pointer; }
      button.primary { color: #fffdf7; border-color: #14201d; background: #14201d; }
      button:disabled { cursor: default; opacity: .72; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; }
      .api-plate code { padding: 10px; border-radius: 8px; background: rgba(255,255,255,.14); color: #fffdf7; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .desk { display: grid; grid-template-columns: minmax(0, .92fr) minmax(280px, .46fr); gap: 12px; padding: 14px; }
      textarea { width: 100%; min-height: 390px; resize: vertical; border: 1px solid var(--line); border-radius: 8px; padding: 12px; color: var(--ink); background: #f9fbf8; font: 500 .84rem/1.48 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: normal; }
      .side { display: grid; align-content: start; gap: 10px; }
      .status-line { min-height: 24px; font-weight: 850; color: var(--muted); overflow-wrap: anywhere; }
      .result { display: none; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 12px; padding: 14px; border-left: 6px solid var(--amber); }
      .result[data-open="true"] { display: grid; }
      .result[data-status="verified"] { border-left-color: var(--teal); background: #edf8f1; }
      .result[data-status="mismatch"], .result[data-status="invalid_request"], .result[data-status="unsupported"] { border-left-color: var(--red); background: #fff4f4; }
      .handoff { display: none; grid-template-columns: minmax(0, .9fr) minmax(280px, .48fr); gap: 12px; padding: 14px; border-left: 6px solid var(--amber); }
      .handoff[data-open="true"] { display: grid; }
      .handoff[data-status="verified"] { border-left-color: var(--teal); background: #f2fbf5; }
      .handoff[data-status="mismatch"], .handoff[data-status="invalid_request"], .handoff[data-status="unsupported"] { border-left-color: var(--red); background: #fff7f7; }
      .verdict { display: grid; gap: 8px; align-content: start; min-width: 0; }
      .handoff-main { min-width: 0; display: grid; align-content: start; gap: 8px; }
      .handoff-main span { color: var(--teal); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .handoff-main p { margin: 0; }
      .handoff-actions { display: grid; align-content: start; gap: 8px; }
      .handoff-actions a, .handoff-actions button { width: 100%; text-align: center; }
      .handoff-actions a:first-child { color: #fffdf7; border-color: #14201d; background: #14201d; }
      .metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .metrics b { display: block; margin-top: 2px; color: var(--ink); font-size: 1rem; overflow-wrap: anywhere; }
      .metrics div { min-width: 0; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.76); color: var(--muted); font-size: .8rem; font-weight: 850; }
      pre { min-width: 0; max-height: 360px; margin: 0; padding: 12px; border-radius: 8px; color: #fffdf7; background: #14201d; white-space: pre-wrap; overflow: auto; }
      .supported { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      article { min-width: 0; display: grid; gap: 8px; padding: 14px; border-top: 5px solid var(--blue); }
      article p, article small { margin: 0; }
      article code { color: var(--ink); font-size: .82rem; }
      footer { padding-bottom: 26px; color: var(--muted); font-size: .82rem; }
      @media (max-width: 940px) { header, .desk, .result, .handoff, .supported { grid-template-columns: 1fr; } .api-plate { min-height: 150px; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero, .desk, .result, .handoff, article { padding: 12px; } nav a, button { width: 100%; } .metrics { grid-template-columns: 1fr; } textarea { min-height: 320px; } }
    </style>
  </head>
  <body>
    <header>
      <section class="hero">
        <span class="eyebrow">Receipt Verification Desk</span>
        <h1>Check exported proof before it leaves the room.</h1>
        <p>Paste any supported verification request. The desk routes it to the same strict verifier used by the artifact that created the receipt.</p>
        <nav>
          ${input.links?.trustManifestUrl ? `<a href="${escapeHtml(input.links.trustManifestUrl)}">Trust manifest</a>` : ""}
          ${input.links?.proofVerifierUrl ? `<a href="${escapeHtml(input.links.proofVerifierUrl)}">Manifest verifier</a>` : ""}
          ${input.links?.appUrl ? `<a href="${escapeHtml(input.links.appUrl)}">Open workbench</a>` : ""}
        </nav>
      </section>
      <aside class="api-plate">
        <span class="eyebrow">Universal API</span>
        <code>${escapeHtml(input.apiUrl)}</code>
        <small>Dispatches to the artifact-specific verifier after identifying a payload or manifest receipt version.</small>
      </aside>
    </header>
    <main>
      <section class="desk" aria-label="Receipt verification workbench">
        <div>
          <textarea id="receipt-verifier-input" spellcheck="false" aria-label="Receipt verification request JSON">${escapeHtml(input.sampleRequestJson)}</textarea>
        </div>
        <aside class="side">
          <span class="eyebrow">Verification input</span>
          <h2>Generated receipt JSON only</h2>
          <p>The expected input is an exported verification request, manifest, or payload with its checksum or digest.</p>
          <button class="primary" id="receipt-verifier-submit" type="button">Verify receipt</button>
          <button id="receipt-verifier-reset" type="button">Restore sample</button>
          <small class="status-line" id="receipt-verifier-status">${escapeHtml(input.initialStatusLabel ?? "Sample request loaded from the current buyer trust manifest.")}</small>
        </aside>
      </section>
      <section class="result" id="receipt-verifier-result" data-open="false" aria-live="polite">
        <div class="verdict">
          <span id="receipt-verifier-result-kicker">No receipt checked yet</span>
          <h2 id="receipt-verifier-result-title">Waiting for verification</h2>
          <p id="receipt-verifier-result-action">Paste a generated verification request and run the check.</p>
          <div class="metrics">
            <div>Receipt type<b id="receipt-verifier-result-type">none</b></div>
            <div>Source verifier<b id="receipt-verifier-result-source">none</b></div>
          </div>
        </div>
        <pre id="receipt-verifier-result-json">{}</pre>
      </section>
      <section class="handoff" id="receipt-verifier-handoff" data-open="false" data-status="waiting" aria-live="polite">
        <div class="handoff-main">
          <span id="receipt-verifier-handoff-kicker">Review handoff</span>
          <h2 id="receipt-verifier-handoff-title">Run verification to create a handoff memo</h2>
          <p id="receipt-verifier-handoff-summary">The memo turns the verifier response into a reviewer-ready accept or hold note.</p>
          <pre id="receipt-verifier-handoff-memo">No handoff generated yet.</pre>
        </div>
        <div class="handoff-actions">
          <a id="receipt-verifier-handoff-download" href="#" download="receipt-verification-handoff.md">Download handoff</a>
          <button id="receipt-verifier-handoff-copy" type="button">Copy handoff</button>
        </div>
      </section>
      <section class="supported" aria-label="Supported receipt types">
        ${renderSupportedReceipts()}
      </section>
    </main>
    <footer>Receipt desk API: ${escapeHtml(input.apiUrl)}</footer>
    <script type="application/json" id="receipt-verifier-sample">${escapeScriptJson(input.sampleRequestJson)}</script>
    <script>
      (() => {
        const apiUrl = ${JSON.stringify(input.apiUrl)};
        const autoVerify = ${JSON.stringify(input.autoVerify === true)};
        const storedRequestKey = ${JSON.stringify(input.storedRequestKey ?? "")};
        const textarea = document.getElementById("receipt-verifier-input");
        const submit = document.getElementById("receipt-verifier-submit");
        const reset = document.getElementById("receipt-verifier-reset");
        const status = document.getElementById("receipt-verifier-status");
        const result = document.getElementById("receipt-verifier-result");
        const kicker = document.getElementById("receipt-verifier-result-kicker");
        const title = document.getElementById("receipt-verifier-result-title");
        const action = document.getElementById("receipt-verifier-result-action");
        const type = document.getElementById("receipt-verifier-result-type");
        const source = document.getElementById("receipt-verifier-result-source");
        const json = document.getElementById("receipt-verifier-result-json");
        const handoff = document.getElementById("receipt-verifier-handoff");
        const handoffKicker = document.getElementById("receipt-verifier-handoff-kicker");
        const handoffTitle = document.getElementById("receipt-verifier-handoff-title");
        const handoffSummary = document.getElementById("receipt-verifier-handoff-summary");
        const handoffMemo = document.getElementById("receipt-verifier-handoff-memo");
        const handoffDownload = document.getElementById("receipt-verifier-handoff-download");
        const handoffCopy = document.getElementById("receipt-verifier-handoff-copy");
        const sample = document.getElementById("receipt-verifier-sample")?.textContent || "";
        if (!textarea || !submit || !reset || !status || !result || !kicker || !title || !action || !type || !source || !json || !handoff || !handoffKicker || !handoffTitle || !handoffSummary || !handoffMemo || !handoffDownload || !handoffCopy) return;
        const storageKey = storedRequestKey ? "receipt-verifier-request:" + storedRequestKey : "";
        let storedRequest = "";
        if (storageKey) {
          try {
            storedRequest = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey) || "";
          } catch {
            storedRequest = "";
          }
          if (storedRequest) {
            textarea.value = storedRequest;
            status.textContent = autoVerify ? "Stored verification request loaded. Running verifier..." : "Stored verification request loaded.";
          } else {
            status.textContent = "Stored verification request was not found. Return to the packet and use Verify again.";
          }
        }

        function compact(value) {
          return String(value ?? "").replace(/\\s+/g, " ").trim();
        }

        function handoffDecision(body) {
          if (body.handoff?.decision) return body.handoff.decision;
          const state = compact(body.summary?.status || body.summary?.readiness || body.summary?.decision || body.summary?.clearance || "");
          if (body.verified && /blocked|repair|revise|internal-only|needs-/i.test(state)) return "accept-receipt-hold-packet";
          if (body.verified) return "accept-for-review";
          if (body.status === "mismatch") return "hold-for-re-export";
          return "hold-for-valid-request";
        }

        function handoffMarkdown(body, httpStatus) {
          if (body.handoff?.memoMarkdown) return body.handoff.memoMarkdown;
          const decision = handoffDecision(body);
          const verifier = compact(body.sourceVerifierApiPath || body.error || "none");
          const instruction = compact(body.verification?.instruction || body.nextAction || "Review the verifier response before sharing this receipt.");
          return [
            "# Receipt verification handoff",
            "",
            "Decision: " + decision,
            "HTTP status: " + httpStatus,
            "Receipt type: " + compact(body.receiptType || "unknown"),
            "Receipt label: " + compact(body.receiptLabel || "Unknown receipt"),
            "Source verifier: " + verifier,
            "Verified: " + (body.verified ? "yes" : "no"),
            "",
            "## Reviewer note",
            instruction,
            "",
            "## Next action",
            compact(body.nextAction || "Review the verifier response before sharing this receipt.")
          ].join("\\n");
        }

        function renderHandoff(body, httpStatus) {
          const memo = handoffMarkdown(body, httpStatus);
          const handoffBody = body.handoff || {};
          handoff.dataset.open = "true";
          handoff.dataset.status = body.status || "invalid_request";
          handoffKicker.textContent = "Review handoff / " + handoffDecision(body);
          handoffTitle.textContent = handoffBody.title || (body.verified ? "Receipt can move into review" : "Hold this receipt before review");
          handoffSummary.textContent = handoffBody.summary || (body.verified
            ? "The verifier accepted this receipt and the summary does not name a blocker."
            : "The verifier did not accept this receipt. Keep the packet internal until the owner re-exports or repairs it.");
          handoffMemo.textContent = memo;
          handoffDownload.setAttribute("href", "data:text/markdown;charset=utf-8," + encodeURIComponent(memo));
          handoffDownload.setAttribute("download", (body.receiptType || "receipt").replace(/[^a-z0-9.-]+/gi, "-") + "-handoff.md");
          handoffCopy.onclick = async () => {
            try {
              await navigator.clipboard.writeText(memo);
              handoffCopy.textContent = "Copied handoff";
              window.setTimeout(() => {
                handoffCopy.textContent = "Copy handoff";
              }, 1800);
            } catch {
              handoffCopy.textContent = "Copy failed";
            }
          };
        }

        function render(body, httpStatus) {
          result.dataset.open = "true";
          result.dataset.status = body.status || "invalid_request";
          kicker.textContent = "HTTP " + httpStatus + " / " + (body.status || "invalid_request");
          title.textContent = body.verified ? "Receipt verified" : body.status === "mismatch" ? "Receipt mismatch" : "Receipt was not verified";
          action.textContent = body.nextAction || "Review the verifier response before sharing this receipt.";
          type.textContent = body.receiptType || "unknown";
          source.textContent = body.sourceVerifierApiPath || body.error || "none";
          json.textContent = JSON.stringify(body, null, 2);
          renderHandoff(body, httpStatus);
        }

        submit.addEventListener("click", async () => {
          submit.disabled = true;
          status.textContent = "Verifying receipt...";
          try {
            const parsed = JSON.parse(textarea.value || "{}");
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(parsed)
            });
            const body = await response.json();
            render(body, response.status);
            status.textContent = body.verified ? "Verified." : "Review required.";
          } catch (error) {
            render({
              status: "invalid_request",
              verified: false,
              receiptType: "unknown",
              error: "client_parse_error",
              nextAction: error instanceof Error ? error.message : "The JSON could not be parsed."
            }, 0);
            status.textContent = "JSON parse failed.";
          } finally {
            submit.disabled = false;
          }
        });

        reset.addEventListener("click", () => {
          textarea.value = sample;
          status.textContent = "Sample request restored.";
        });

        if (autoVerify && (!storedRequestKey || storedRequest)) {
          window.requestAnimationFrame(() => submit.click());
        }
      })();
    </script>
  </body>
</html>`;
}
