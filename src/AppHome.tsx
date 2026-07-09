import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Coins,
  Crosshair,
  Download,
  ExternalLink,
  FileText,
  Film,
  Gauge,
  GitBranch,
  Lightbulb,
  Mail,
  Network,
  Play,
  Radar,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Terminal,
  TrendingUp,
  Trophy,
  Upload,
  Workflow
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import type { JudgeAcceptanceMatrix } from "./acceptanceMatrix";
import { recommendSquad } from "./agentEngine";
import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import type { AutonomyLedger } from "./autonomyLedger";
import type { AgentTaskBoard } from "./taskBoard";
import type { WinningAutopilotRun } from "./autopilot";
import { BLUEPRINT_TEMPLATES, type BlueprintTemplate } from "./blueprintTemplates";
import { buildBuyerPilotCommand, type BuyerPilotCommand } from "./buyerPilotCommand";
import { buildBuyerPilotMeasurementPlan } from "./buyerPilotMeasurementPlan";
import { buildBuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun";
import { buildBuyerPilotRunCalibration } from "./buyerPilotRunCalibration";
import { mergeWorkflowProofIntake, type BuyerPilotProofIntake } from "./buyerPilotProofIntake";
import { buildBuyerEvidenceTrace, type BuyerEvidenceTrace } from "./buyerEvidenceTrace";
import { buildBuyerProofMonitor } from "./buyerProofMonitor";
import { buildBuyerProofRecoveryPlan } from "./buyerProofRecoveryPlan";
import type { BuyerProofRepairProofKey } from "./buyerProofRepairQueue";
import { buildBuyerShareGate, type BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import { buildBuyerValueCommitment, type BuyerValueCommitment, type BuyerValueCommitmentCondition, type BuyerValueCommitmentRedLine } from "./buyerValueCommitment";
import { buildBuyerValueScenario, normalizeBuyerValueScenarioInput, type BuyerValueScenario, type BuyerValueScenarioInput } from "./buyerValueScenario";
import { buildBuyerValueSensitivity } from "./buyerValueSensitivity";
import { normalizeBuyerWorkOrderInput, type BuyerWorkOrderInput } from "./buyerWorkOrder";
import type { CompetitiveBattlecard } from "./competitiveBattlecard";
import type { SquadContract } from "./contracts";
import type { DeployRecoveryPlan } from "./deployRecovery";
import type { JudgeDemoReceipt } from "./demoReceipt";
import type { DemoConcierge } from "./demoConcierge";
import type { DemoRunway } from "./demoRunway";
import type { ExternalEvidenceRun } from "./externalEvidence";
import type { FinalistSimulation } from "./finalist";
import { FIRST_CLICK_PROOF_LINKS, FIRST_CLICK_SCORECARDS, type FirstClickProofLink } from "./firstClick";
import { buildGlobalLaunchAudit, type GlobalLaunchAudit, type GlobalLaunchAuditStatus } from "./globalLaunchAudit";
import { buildHomepageBuyerDecisionCockpitFromWorkspace } from "./homepageBuyerDecisionCockpit";
import { buildHomepageRouteLock, type HomepageRouteLock } from "./homepageRouteLock";
import {
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
  HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
  homepageOutcomeArtifactCanonicalJson,
  homepageOutcomeArtifactReceiptChecksum,
  verifyHomepageOutcomeArtifactReceipt,
  type HomepageOutcomeArtifactReceiptVerification
} from "./homepageOutcomeArtifactReceipt";
import type { ImpactCase } from "./impact";
import type { JudgeBrief } from "./judgeBrief";
import type { JudgeCommandCenter } from "./judgeCommandCenter";
import type { JudgeDrill } from "./judgeDrill";
import type { JudgeRehearsalRoom } from "./judgeRehearsal";
import type { JudgeTour } from "./judgeTour";
import { buildLaunchRoom, type LaunchRoom } from "./launchRoom";
import type { LiveEvidenceRun } from "./liveEvidence";
import { CAPABILITY_LABELS, MARKET_AGENTS } from "./market";
import { MarketHeroUnlockBrief } from "./MarketHeroUnlockBrief";
import type { MarketIntelReport } from "./marketIntel";
import type { MoatStressTest } from "./moatStress";
import type { MvpAuditReport } from "./mvpAudit";
import type { ObservabilityOracle } from "./observabilityOracle";
import type { PilotEconomics } from "./pilotEconomics";
import { normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt";
import type { PitchRun } from "./pitch";
import type { JudgeProof } from "./proof";
import { buildBuyerOutcomeBrief, type BuyerOutcomeBrief } from "./buyerOutcomeBrief";
import { isBuyerFacingProofUrl, normalizeBuyerFacingProofUrl, PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { PrizeStrategyBoard } from "./prizeStrategy";
import type { ReleaseDriftGuard } from "./releaseDrift";
import { buildProofTransformation, type ProofTransformation } from "./proofTransformation";
import {
  buildProofBackedSampleWorkspaceDraft,
  SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH,
  SAMPLE_AGENT_CARD_THIN_AGENT_PATH,
  SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH,
  SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH,
  SAMPLE_BUYER_BRIEF_PATH,
  SAMPLE_BUYER_PROOF_AUDIT_PATH,
  SAMPLE_PROCUREMENT_DECISION_PATH
} from "./sampleWorkspace";
import type { SecurityReview } from "./security";
import { SUBMISSION_PROOF } from "./submission";
import type { OptimizedSquadCandidate, SquadOptimizerRun } from "./squadOptimizer";
import type { SubmissionDossier } from "./dossier";
import type { SubmissionCloseoutWorkbench } from "./submissionCloseout";
import type { SubmissionLaunchGate } from "./submissionLaunch";
import type { FinalSubmissionRunway } from "./submissionRunway";
import { buildWinningStrategy } from "./strategy";
import type { CapabilityKey, GeminiRecommendation, MarketAgent, Recommendation } from "./types";
import type { UserPilotLab } from "./userPilot";
import { buildValueBlueprint, type ValueBlueprint } from "./valueBlueprint";
import { buildWorkflowIntakeBrief } from "./workflowIntake";
import type { WorkflowIntakeAgentTrialEvidence, WorkflowIntakeDraft } from "./workflowIntakeDraft";
import type { WorkflowIntakeProofSlot } from "./workflowIntakeShareGate";
import type { QuickBuyerEvidenceResponseImportTarget } from "./QuickWorkflowIntakePanel";
import type { WinGapRadar } from "./winGapRadar";
import type { WinnerProofPacket } from "./winnerPacket";
import HeroBuyerDecisionBriefPanel, { buildHeroBuyerDecisionBrief, type HeroBuyerDecisionBrief } from "./HeroBuyerDecisionBrief";
import { buildHomepageValueLensSnapshot } from "./HomepageValueLens";
import {
  buildWorkspaceDraft,
  buildWorkspaceResumePacket,
  buildWorkspaceShareUrl,
  decodeWorkspaceDraft,
  decodeWorkspaceShareParam,
  defaultWorkspaceDraft,
  encodeWorkspaceDraft,
  encodeWorkspaceShareParam,
  parseWorkspaceImport,
  workspaceDraftFromTemplate,
  WORKSPACE_SHARE_PARAM,
  WORKSPACE_STORAGE_KEY,
  type WorkspaceDraft
} from "./workspaceDraft";
import { workspaceMatchesPublicSample, workspacePublicArtifactHref } from "./workspacePublicLinks";
import "./styles.css";

const STAGE_LABELS: Record<string, string> = {
  all: "All",
  plan: "Plan",
  build: "Build",
  deploy: "Deploy",
  operate: "Operate",
  govern: "Govern"
};

const TOP_CAPABILITIES: CapabilityKey[] = ["a2a", "mcp", "cloudRun", "testing", "ux"];

const LaunchCommandQueuePanel = lazy(() => import("./LaunchCommandQueuePanel"));
const LaunchEvidenceConsole = lazy(() => import("./LaunchEvidenceConsole"));
const BuyerA2ATrialReceiptPanel = lazy(() => import("./BuyerA2ATrialReceiptPanel"));
const BuyerOutcomeBriefPanel = lazy(() => import("./BuyerOutcomeBriefPanel"));
const OutcomeSnapshotPanel = lazy(() => import("./OutcomeSnapshotPanel"));
const BuyerWorkOrderStudioPanel = lazy(() => import("./BuyerWorkOrderStudioPanel"));
const BuyerJourneyNavigator = lazy(() => import("./BuyerJourneyNavigator"));
const ContractDesk = lazy(() => import("./ContractDesk"));
const BuyerProcurementDecisionDesk = lazy(() => import("./BuyerProcurementDecisionDesk"));
const SponsorHandoffPanel = lazy(() => import("./SponsorHandoffPanel"));
const SponsorReviewRoomPanel = lazy(() => import("./SponsorReviewRoomPanel"));
const BuyerProofPacketPanel = lazy(() => import("./BuyerProofPacketPanel"));
const AgentCardIntakePanel = lazy(() => import("./AgentCardIntakePanel"));
const BuyerDiligencePanel = lazy(() => import("./BuyerDiligencePanel"));
const PilotProposalPanel = lazy(() => import("./PilotProposalPanel"));
const PilotWorkflowPanel = lazy(() => import("./PilotWorkflowPanel"));
const PilotRunReceiptPanel = lazy(() => import("./PilotRunReceiptPanel"));
const BuyerDecisionMatrixPanel = lazy(() => import("./BuyerDecisionMatrixPanel"));
const PilotAgreementPanel = lazy(() => import("./PilotAgreementPanel"));
const PilotEvidenceLedgerPanel = lazy(() => import("./PilotEvidenceLedgerPanel"));
const AdoptionOperatingPlanPanel = lazy(() => import("./AdoptionOperatingPlanPanel"));
const BuyerTrustCenterPanel = lazy(() => import("./BuyerTrustCenterPanel"));
const CommercialOfferPanel = lazy(() => import("./CommercialOfferPanel"));
const GlobalLaunchAuditPanel = lazy(() => import("./GlobalLaunchAuditPanel"));
const OpsDrillPanel = lazy(() => import("./OpsDrillPanel"));
const BuyerValueSimulatorPanel = lazy(() => import("./BuyerValueSimulatorPanel"));
const BuyerEvidenceTracePanel = lazy(() => import("./BuyerEvidenceTracePanel"));
const BuyerLaunchHandoffComposer = lazy(() => import("./BuyerLaunchHandoffComposer"));
const BuyerWorkflowIntakePanelLazy = lazy(() => import("./BuyerWorkflowIntakePanel"));
const BuyerDecisionAgendaPanel = lazy(() => import("./BuyerDecisionAgendaPanel"));
const BuyerDecisionFollowUpPanel = lazy(() => import("./BuyerDecisionFollowUpPanel"));
const BuyerDemoResidueAuditPanel = lazy(() => import("./BuyerDemoResidueAuditPanel"));
const ProductionHardeningPanel = lazy(() => import("./ProductionHardeningPanel"));
const BuyerPublicationWindowPanel = lazy(() => import("./BuyerPublicationWindowPanel"));
const BuyerValueTunerStrip = lazy(() => import("./BuyerValueTunerStrip"));
const HomepageValueLensPanel = lazy(() => import("./HomepageValueLensPanel"));
const HomepageBuyerBoardMemoPanel = lazy(() => import("./HomepageBuyerBoardMemoPanel"));
const BuyerProofFocusPlanPanel = lazy(() => import("./BuyerProofFocusPlanPanel"));
const BuyerProofSendabilityContractStrip = lazy(() => import("./BuyerProofSendabilityContractStrip"));
const BuyerProofMonitorPanel = lazy(() => import("./BuyerProofMonitorPanel"));
const BuyerProofRecoveryPanel = lazy(() => import("./BuyerProofRecoveryPanel"));
const BuyerProofReplacementPacketPanel = lazy(() => import("./BuyerProofReplacementPacketPanel"));
const BuyerProofRepairQueuePanel = lazy(() => import("./BuyerProofRepairQueuePanel"));
const BuyerLaunchReadinessLane = lazy(() => import("./BuyerLaunchReadinessLane"));
const BuyerProofAnswerDeck = lazy(() => import("./BuyerProofAnswerDeck"));
const BuyerRoleDecisionPackets = lazy(() => import("./BuyerRoleDecisionPackets"));
const BuyerObjectionRehearsal = lazy(() => import("./BuyerObjectionRehearsal"));
const QuickWorkflowIntakePanel = lazy(() => import("./QuickWorkflowIntakePanel"));
const BuyerEvidenceBoardPanel = lazy(() => import("./BuyerEvidenceBoardPanel"));
const ProofTransformationHero = lazy(() => import("./ProofTransformationHero"));
const HeroPublishabilityVerdict = lazy(() => import("./HeroPublishabilityVerdict"));
const HeroWorkflowIntakeConsolePanel = lazy(() => import("./HeroWorkflowIntakeConsole"));
const HomepageOutcomeSpinePanel = lazy(() => import("./HomepageOutcomeSpinePanel"));
const HomepageFirstRunValueProofCommandPanel = lazy(() => import("./HomepageFirstRunValueProofCommandPanel"));
const HomepageHeroPacketVerifierPanel = lazy(() => import("./HomepageHeroPacketVerifier"));
const HomepageHeroProofRoutePanel = lazy(() => import("./HomepageProofEntryPanels").then((module) => ({ default: module.HomepageHeroProofRoute })));
const HomepageProofEntryRailPanel = lazy(() => import("./HomepageProofEntryPanels").then((module) => ({ default: module.HomepageProofEntryRail })));
const HomepageExternalReviewerDockPanel = lazy(() => import("./HomepageExternalReviewerDockPanel"));
const HomepageOutcomeArtifactPanel = lazy(() => import("./HomepageOutcomeArtifactPanel").then((module) => ({ default: module.HomepageOutcomeArtifactPanel })));
const HomepageReviewerHandoffKitPanel = lazy(() => import("./HomepageReviewerHandoffKitPanel"));
const MarketHeroProofSummary = lazy(() => import("./MarketHeroProofSummary"));
const MarketHeroAcceptanceContract = lazy(() => import("./MarketHeroAcceptanceContract"));
const HeroAgentCardAuditLauncher = lazy(() => import("./HeroAgentCardAuditLauncher"));
const HeroOutcomeReplayStrip = lazy(() => import("./HeroOutcomeReplayStrip"));
const MissionControl = lazy(() => import("./MissionControl"));
const StrategyWarRoom = lazy(() => import("./StrategyWarRoom"));
const SubmissionPublisherPanel = lazy(() => import("./SubmissionPublisherPanel"));
const SubmissionCloseoutFinalHandoffPanel = lazy(() => import("./SubmissionCloseoutFinalHandoffPanel"));
const ReviewerProofRouteBoard = lazy(() => import("./ReviewerProofRouteBoard"));
const BuyerPilotSendNotePanel = lazy(() => import("./BuyerPilotSendNotePanel"));
const HomepageReferenceModeBridge = lazy(() => import("./HomepageReferenceModeBridge"));

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function DeferredPanel({
  label,
  minHeight = 260,
  rootMargin = "700px",
  children
}: {
  label: string;
  minHeight?: number;
  rootMargin?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <div ref={ref} className={cx("deferred-panel", shouldRender && "is-loaded")} style={{ minHeight }} aria-busy={!shouldRender} aria-label={label}>
      {shouldRender ? children : <div className="deferred-panel-placeholder" aria-hidden="true" />}
    </div>
  );
}

function DeferredSuspensePanel({ label, minHeight, children }: { label: string; minHeight?: number; children: ReactNode }) {
  return (
    <DeferredPanel label={label} minHeight={minHeight}>
      <Suspense fallback={<div className="deferred-panel-placeholder" aria-hidden="true" />}>{children}</Suspense>
    </DeferredPanel>
  );
}

export type InitialWorkspaceSource = "sample" | "saved" | "shared";

export type InitialWorkspaceLoad = {
  draft: WorkspaceDraft;
  source: InitialWorkspaceSource;
};

export function loadInitialWorkspaceDraft(input: {
  href: string;
  storedWorkspace: string | null | undefined;
  sampleWorkspace: WorkspaceDraft;
  fallbackWorkspace?: WorkspaceDraft;
}): InitialWorkspaceLoad {
  const fallbackWorkspace = input.fallbackWorkspace ?? defaultWorkspaceDraft();
  try {
    const shared = new URL(input.href).searchParams.get(WORKSPACE_SHARE_PARAM);
    if (shared) {
      return { draft: decodeWorkspaceShareParam(shared, fallbackWorkspace), source: "shared" };
    }
    if (input.storedWorkspace) {
      return { draft: decodeWorkspaceDraft(input.storedWorkspace, fallbackWorkspace), source: "saved" };
    }
    return { draft: input.sampleWorkspace, source: "sample" };
  } catch {
    return { draft: input.sampleWorkspace, source: "sample" };
  }
}

function loadWorkspaceDraft(): InitialWorkspaceLoad {
  const sampleWorkspace = buildProofBackedSampleWorkspaceDraft(undefined, runtimeProofSampleBaseUrl());
  if (typeof window === "undefined") return { draft: sampleWorkspace, source: "sample" };
  return loadInitialWorkspaceDraft({
    href: window.location.href,
    storedWorkspace: window.localStorage.getItem(WORKSPACE_STORAGE_KEY),
    sampleWorkspace,
    fallbackWorkspace: defaultWorkspaceDraft()
  });
}

function cleanWorkspaceShareParamFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(WORKSPACE_SHARE_PARAM)) return;
  url.searchParams.delete(WORKSPACE_SHARE_PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function findWorkflowTrialAgent(input: { evidence: WorkflowIntakeAgentTrialEvidence; selectedAgents: MarketAgent[]; agentCatalog: MarketAgent[] }) {
  const requestedName = input.evidence.agentName?.toLowerCase().trim();
  const orderedAgents = [
    ...input.selectedAgents,
    ...input.agentCatalog.filter((agent) => !input.selectedAgents.some((selected) => selected.id === agent.id))
  ];
  if (requestedName) {
    const namedAgent = orderedAgents.find((agent) => {
      const name = agent.name.toLowerCase();
      return name === requestedName || name.includes(requestedName) || requestedName.includes(name);
    });
    if (namedAgent) return namedAgent;
  }
  return input.selectedAgents[0] ?? input.agentCatalog.find((agent) => agent.id === "market-broker") ?? input.agentCatalog[0] ?? null;
}

function compactTrialEvidenceKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildWorkflowTrialEvidenceRecord(input: { evidence: WorkflowIntakeAgentTrialEvidence; agent: MarketAgent; attachedAt?: string }): AgentTrialEvidenceRecord | null {
  const artifactUrl = normalizeBuyerFacingProofUrl(input.evidence.artifactUrl);
  if (!artifactUrl) return null;

  const skillId = (input.evidence.skillId || input.agent.a2aSkillIds[0] || input.agent.skills[0]?.id || "workflow.trial").slice(0, 120);
  const agentName = (input.evidence.agentName || input.agent.name).slice(0, 100);
  const score = Math.max(0, Math.min(100, Math.round(input.evidence.score)));
  const receiptId = `quick-intake-${compactTrialEvidenceKey(input.agent.id)}-${compactTrialEvidenceKey(skillId) || "trial"}`;

  return {
    id: `trial-proof-${receiptId}`,
    receiptId,
    agentId: input.agent.id,
    agentName,
    skillId,
    status: "accepted",
    score,
    artifactUrl,
    evidenceSource: input.evidence.evidenceSource.slice(0, 180),
    headline: "Accepted A2A trial receipt attached from workflow intake",
    summary: `${agentName} has a user-provided accepted A2A trial receipt at ${score}/100.`,
    attachedAt: input.attachedAt ?? new Date().toISOString()
  };
}

function scrollToCurrentHashTarget() {
  if (typeof window === "undefined" || typeof document === "undefined") return true;
  const rawHash = window.location.hash.replace(/^#/, "");
  if (!rawHash) return true;
  let targetId = rawHash;
  try {
    targetId = decodeURIComponent(rawHash);
  } catch {
    targetId = rawHash;
  }
  const target = document.getElementById(targetId);
  if (!target) return false;
  target.scrollIntoView({ block: "start", inline: "nearest" });
  return true;
}

function hasWorkspaceShareParam() {
  if (typeof window === "undefined") return false;
  try {
    return new URL(window.location.href).searchParams.has(WORKSPACE_SHARE_PARAM);
  } catch {
    return false;
  }
}

function workspaceShareHref(draft: WorkspaceDraft) {
  if (typeof window === "undefined") return "#";
  return buildWorkspaceShareUrl(draft, window.location.href);
}

function workspaceSharedRouteHref(path: string, draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  if (typeof window === "undefined") return "#";
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = "";
  url.hash = "";
  if (workspaceMatchesPublicSample(draft, publicSampleDraft)) return url.toString();
  return buildWorkspaceShareUrl(draft, url.toString());
}

function workspaceLaunchRoomHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/launch-room", draft, publicSampleDraft);
}

function workspaceBuyerOutcomeBriefHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-outcome-brief", draft, publicSampleDraft);
}

function workspaceBuyerEvidenceTraceHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-evidence-trace", draft, publicSampleDraft);
}

function workspaceBuyerEvidenceBoardHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-evidence-board", draft, publicSampleDraft);
}

function workspaceBuyerShareGateHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-share-gate", draft, publicSampleDraft);
}

function workspaceBuyerProofMonitorHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-proof-monitor", draft, publicSampleDraft);
}

function workspaceBuyerProofRecoveryHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-proof-recovery", draft, publicSampleDraft);
}

function workspaceProductionHardeningHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/production-hardening", draft, publicSampleDraft);
}

function publicRouteHref(path: string) {
  if (typeof window === "undefined") return "#";
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function selfAgentCardSourceUrl() {
  return `${runtimeProofSampleBaseUrl()}/.well-known/agent-card.json`;
}

function agentCardRouteHref(path: string, urls: string[]) {
  if (typeof window === "undefined") return "#";
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = "";
  for (const source of urls.map((item) => item.trim()).filter(Boolean)) {
    url.searchParams.append("url", source);
  }
  url.hash = "";
  return url.toString();
}

function agentCardDiligenceHrefFor(sourceUrl: string) {
  return agentCardRouteHref("/agent-card-diligence", [sourceUrl]);
}

function agentCardTrialPlanHrefFor(sourceUrl: string) {
  return agentCardRouteHref("/agent-card-trial-plan", [sourceUrl]);
}

function agentCardShortlistHrefFor(sourceUrl: string) {
  const base = runtimeProofSampleBaseUrl();
  return agentCardRouteHref("/agent-card-shortlist", [sourceUrl, `${base}${SAMPLE_AGENT_CARD_RELEASE_STEWARD_PATH}`, `${base}${SAMPLE_AGENT_CARD_THIN_AGENT_PATH}`]);
}

function selfAgentCardDiligenceHref() {
  return agentCardDiligenceHrefFor(selfAgentCardSourceUrl());
}

function sampleAgentCardShortlistHref() {
  return agentCardShortlistHrefFor(selfAgentCardSourceUrl());
}

function sampleAgentCardTrialPlanHref() {
  return publicRouteHref(SAMPLE_AGENT_CARD_TRIAL_PLAN_PATH);
}

function sampleAgentCardTrialVerificationHref() {
  return publicRouteHref(SAMPLE_AGENT_CARD_TRIAL_VERIFICATION_PATH);
}

function runtimeProofSampleBaseUrl() {
  if (typeof window === "undefined") return SUBMISSION_PROOF.deployedUrl;
  try {
    const url = new URL(window.location.origin);
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) return SUBMISSION_PROOF.deployedUrl;
    return url.origin;
  } catch {
    return SUBMISSION_PROOF.deployedUrl;
  }
}

function workspaceGlobalLaunchAuditHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/global-launch-audit", draft, publicSampleDraft);
}

function workspaceGlobalProofDossierHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/global-proof-dossier", draft, publicSampleDraft);
}

function workspaceGlobalPublishabilityHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/global-publishability", draft, publicSampleDraft);
}

function workspaceLaunchEvidenceHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/launch-evidence", draft, publicSampleDraft);
}

function workspaceBuyerDecisionCockpitHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspaceSharedRouteHref("/buyer-decision-cockpit", draft, publicSampleDraft);
}

function workspaceForcedRouteHref(path: string, draft: WorkspaceDraft, hash = "") {
  if (typeof window === "undefined") return "#";
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = "";
  url.searchParams.set(WORKSPACE_SHARE_PARAM, encodeWorkspaceShareParam(draft));
  url.hash = hash;
  return url.toString();
}

function workspacePublicHref(path: string, draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  if (typeof window === "undefined") return "#";
  return workspacePublicArtifactHref(path, draft, window.location.href, publicSampleDraft);
}

function workspaceBuyerProofAuditHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspacePublicHref("/buyer-proof-audit", draft, publicSampleDraft);
}

function workspaceBuyerProofRoomHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspacePublicHref("/buyer-proof-room", draft, publicSampleDraft);
}

function workspaceBuyerValueReportHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspacePublicHref("/buyer-value", draft, publicSampleDraft);
}

function workspaceBuyerDeliveryMemoHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspacePublicHref("/buyer-delivery-memo", draft, publicSampleDraft);
}

function workspaceBuyerTrustManifestHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspacePublicHref("/buyer-trust-manifest", draft, publicSampleDraft);
}

function workspaceBuyerDecisionFollowUpHref(draft: WorkspaceDraft, publicSampleDraft?: WorkspaceDraft) {
  return workspacePublicHref("/buyer-decision-follow-up", draft, publicSampleDraft);
}

function decisionReceiptChoiceFor(verdict: HomepageRouteLock["verdict"]) {
  if (verdict === "send") return "continue";
  if (verdict === "pilot-review") return "revise";
  return "stop";
}

function workspaceBuyerDecisionReceiptHref(draft: WorkspaceDraft, verdict: HomepageRouteLock["verdict"], publicSampleDraft?: WorkspaceDraft) {
  if (typeof window === "undefined") return "#";
  const url = new URL(workspacePublicHref("/buyer-decision-receipt", draft, publicSampleDraft));
  url.searchParams.set("decision", decisionReceiptChoiceFor(verdict));
  return url.toString();
}

function workspaceBuyerReviewKitHref(draft: WorkspaceDraft, verdict: HomepageRouteLock["verdict"], publicSampleDraft?: WorkspaceDraft) {
  if (typeof window === "undefined") return "#";
  const url = new URL(workspacePublicHref("/buyer-review-kit", draft, publicSampleDraft));
  url.searchParams.set("decision", decisionReceiptChoiceFor(verdict));
  return url.toString();
}

function workspaceBuyerAcceptancePathHref(draft: WorkspaceDraft, verdict: HomepageRouteLock["verdict"], publicSampleDraft?: WorkspaceDraft) {
  if (typeof window === "undefined") return "#";
  const url = new URL(workspacePublicHref("/buyer-acceptance-path", draft, publicSampleDraft));
  url.searchParams.set("decision", decisionReceiptChoiceFor(verdict));
  return url.toString();
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function saveWorkspaceDraft(draft: WorkspaceDraft) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, encodeWorkspaceDraft(draft));
    return true;
  } catch {
    return false;
  }
}

function mergeRuntimeAgentCatalog(customAgents: MarketAgent[]) {
  const baseIds = new Set(MARKET_AGENTS.map((agent) => agent.id));
  return [...MARKET_AGENTS, ...customAgents.filter((agent) => agent.id.startsWith("custom-") && !baseIds.has(agent.id)).slice(0, 3)];
}

function scoreTone(value: number) {
  if (value >= 88) return "elite";
  if (value >= 74) return "solid";
  return "quiet";
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function FirstClickIcon({ link }: { link: FirstClickProofLink }) {
  if (link.id === "judge-snapshot") return <Trophy size={18} />;
  if (link.id === "winner-packet") return <BadgeCheck size={18} />;
  if (link.id === "objection-arena") return <AlertTriangle size={18} />;
  if (link.id === "competitive-swot") return <Crosshair size={18} />;
  if (link.id === "competitive-decision-matrix") return <Gauge size={18} />;
  if (link.id === "mvp-readiness") return <ClipboardCheck size={18} />;
  if (link.id === "autonomy-snapshot") return <Workflow size={18} />;
  if (link.id === "pilot-value") return <TrendingUp size={18} />;
  if (link.id === "recording-script") return <Film size={18} />;
  return <FileText size={18} />;
}

function JudgeFirstClickStrip() {
  const primaryProofIds = new Set(["win-autopilot", "judge-snapshot", "winner-packet"]);
  const primaryLinks = FIRST_CLICK_PROOF_LINKS.filter((link) => primaryProofIds.has(link.id));
  const supportingLinks = FIRST_CLICK_PROOF_LINKS.filter((link) => !primaryProofIds.has(link.id));
  const productSteps = [
    {
      id: "choose",
      icon: <Search size={18} />,
      label: "1. Choose",
      title: "必要なAI能力を選ぶ",
      description: "Cloud Run SRE、Gemini Strategistなどを能力値とMCP成熟度で比較する。"
    },
    {
      id: "delegate",
      icon: <Workflow size={18} />,
      label: "2. Delegate",
      title: "A2Aで仕事を任せる",
      description: "選んだAIに仕事票、契約、受入条件を渡し、判断と実行ログを残す。"
    },
    {
      id: "prove",
      icon: <BadgeCheck size={18} />,
      label: "3. Prove",
      title: "公開証拠と運用を証明する",
      description: "Cloud Run、Gemini、CI、公開ストーリー証拠をready/watchで束ねる。"
    }
  ];

  return (
    <section className="first-click-strip" aria-labelledby="first-click-title">
      <div className="first-click-heading">
        <div>
          <span className="eyebrow">Product focus</span>
          <h2 id="first-click-title">
            <ShoppingCart size={20} />
            AIエージェントを選び、A2Aで任せ、公開証拠まで閉じる
          </h2>
          <p>AI能力の選定、仕事票、実行ログ、公開証拠を1つのDevOpsワークベンチでつなぎます。</p>
        </div>
        <div className="first-click-actions">
          <a href="#marketplace-workbench" className="icon-link first-click-primary">
            <ShoppingCart size={16} />
            Marketplaceへ
          </a>
          <a href="/judge-snapshot" target="_blank" rel="noreferrer" className="icon-link first-click-secondary">
            <ExternalLink size={16} />
            Reviewer snapshot
          </a>
        </div>
      </div>

      <div className="first-click-flow">
        {productSteps.map((step) => (
          <article key={step.id}>
            <div>
              {step.icon}
              <span>{step.label}</span>
            </div>
            <strong>{step.title}</strong>
            <p>{step.description}</p>
          </article>
        ))}
      </div>

      <div className="first-click-proof-row">
        <div className="first-click-scorecards" aria-label="Reviewer proof status">
          {FIRST_CLICK_SCORECARDS.map((card) => (
            <article key={card.id}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.proof}</p>
            </article>
          ))}
        </div>

        <div className="first-click-featured" aria-label="Primary reviewer proof links">
          {primaryLinks.map((link) => (
            <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className={cx("first-click-link", link.tone)}>
              <FirstClickIcon link={link} />
              <span>{link.signal}</span>
              <strong>{link.label}</strong>
              <p>{link.judgeValue}</p>
            </a>
          ))}
        </div>
      </div>

      <details className="first-click-evidence">
        <summary>
          <span>Reviewer first-click proof pages</span>
          <strong>{supportingLinks.length} supporting links</strong>
        </summary>
        <div className="first-click-links">
          {supportingLinks.map((link) => (
            <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className={cx("first-click-link", link.tone)}>
              <FirstClickIcon link={link} />
              <span>{link.signal}</span>
              <strong>{link.label}</strong>
              <p>{link.judgeValue}</p>
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}

type JudgeEvidencePanelProps = {
  recommendation: Recommendation;
  projectBrief: string;
  targetUrl?: string;
  protopediaUrl?: string;
  videoUrl?: string;
  onTargetUrlChange?: (value: string) => void;
  onProtopediaUrlChange?: (value: string) => void;
  onVideoUrlChange?: (value: string) => void;
};

type JudgeEvidencePanelComponent = ComponentType<JudgeEvidencePanelProps> | LazyExoticComponent<ComponentType<JudgeEvidencePanelProps>>;

const JUDGE_EVIDENCE_PANELS: Array<{ id: string; Component: JudgeEvidencePanelComponent }> = [
  { id: "judge-command-center", Component: JudgeCommandCenterPanel },
  { id: "demo-concierge", Component: DemoConciergePanel },
  { id: "judge-rehearsal", Component: JudgeRehearsalPanel },
  { id: "winner-packet", Component: WinnerPacketPanel },
  { id: "submission-runway", Component: SubmissionRunwayPanel },
  { id: "external-evidence", Component: ExternalEvidencePanel },
  { id: "prize-strategy", Component: PrizeStrategyPanel },
  { id: "win-gap-radar", Component: WinGapRadarPanel },
  { id: "judge-tour", Component: JudgeTourPanel },
  { id: "squad-optimizer", Component: SquadOptimizerPanel },
  { id: "moat-stress", Component: MoatStressPanel },
  { id: "competitive-battlecard", Component: CompetitiveBattlecardPanel },
  { id: "live-evidence", Component: LiveEvidencePanel },
  { id: "observability-oracle", Component: ObservabilityOraclePanel },
  { id: "release-drift", Component: ReleaseDriftPanel },
  { id: "deploy-recovery", Component: DeployRecoveryPanel },
  { id: "demo-receipt", Component: DemoReceiptPanel },
  { id: "user-pilot", Component: UserPilotPanel },
  { id: "judge-brief", Component: JudgeBriefPanel },
  { id: "acceptance-matrix", Component: AcceptanceMatrixPanel },
  { id: "autonomy-ledger", Component: AutonomyLedgerPanel },
  { id: "agent-task-board", Component: AgentTaskBoardPanel },
  { id: "security-review", Component: SecurityReviewPanel },
  { id: "impact-case", Component: ImpactCasePanel },
  { id: "pilot-economics", Component: PilotEconomicsPanel },
  { id: "market-intel", Component: MarketIntelPanel },
  { id: "mvp-audit", Component: MvpAuditPanel },
  { id: "submission-launch", Component: SubmissionLaunchPanel },
  { id: "submission-closeout", Component: SubmissionCloseoutPanel },
  { id: "win-autopilot", Component: WinAutopilotPanel },
  { id: "submission-dossier", Component: SubmissionDossierPanel },
  { id: "demo-runway", Component: DemoRunwayPanel },
  { id: "judge-proof-bundle", Component: JudgeProofBundle },
  { id: "pitch-director", Component: PitchDirector },
  { id: "judge-drill", Component: JudgeDrillPanel },
  { id: "finalist-simulator", Component: FinalistSimulator },
  { id: "submission-publisher", Component: SubmissionPublisherPanel }
];

function JudgeToolsPage({
  recommendation,
  projectBrief,
  targetUrl,
  protopediaUrl,
  videoUrl,
  onTargetUrlChange,
  onProtopediaUrlChange,
  onVideoUrlChange
}: {
  recommendation: Recommendation;
  projectBrief: string;
  targetUrl: string;
  protopediaUrl: string;
  videoUrl: string;
  onTargetUrlChange?: (value: string) => void;
  onProtopediaUrlChange?: (value: string) => void;
  onVideoUrlChange?: (value: string) => void;
}) {
  return (
    <main className="app-shell judge-tools-page">
      <section className="panel judge-tools-heading">
        <div className="panel-heading">
          <h2>
            <GitBranch size={18} />
            External reviewer proof shelf
          </h2>
          <span className="chip">brief2dev</span>
        </div>
        <p>
          買い手の主導線を邪魔しないよう、公開ロック、公開URL監視、競合比較、レビュー用証拠など{JUDGE_EVIDENCE_PANELS.length}件の審査員向けツールをこの独立ページにまとめています。
        </p>
        <a className="icon-link" href="/">
          ← 買い手向けデモに戻る
        </a>
      </section>
      <ReviewerProofRouteBoard />
      <div className="evidence-shelf-workbench-body">
        {JUDGE_EVIDENCE_PANELS.map(({ id, Component }) => (
          <Suspense key={id} fallback={<div className="deferred-panel-placeholder" aria-hidden="true" />}>
            <Component
              recommendation={recommendation}
              projectBrief={projectBrief}
              targetUrl={targetUrl}
              protopediaUrl={protopediaUrl}
              videoUrl={videoUrl}
              onTargetUrlChange={onTargetUrlChange}
              onProtopediaUrlChange={onProtopediaUrlChange}
              onVideoUrlChange={onVideoUrlChange}
            />
          </Suspense>
        ))}
      </div>
    </main>
  );
}

function ValueBlueprintPanel({ blueprint }: { blueprint: ValueBlueprint }) {
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(blueprint.exportMarkdown)}`;
  const scoreEntries = [
    ["Value clarity", blueprint.scores.valueClarity],
    ["Delivery confidence", blueprint.scores.deliveryConfidence],
    ["Operational trust", blueprint.scores.operationalTrust],
    ["Adoption readiness", blueprint.scores.adoptionReadiness]
  ] as const;

  return (
    <section id="value-blueprint" className="value-blueprint" aria-labelledby="value-blueprint-title">
      <div className="value-blueprint-hero">
        <div>
          <span className="eyebrow">Value Blueprint</span>
          <h2 id="value-blueprint-title">{blueprint.headline}</h2>
          <p>{blueprint.valuePromise}</p>
          <div className="value-actions">
            <a className="icon-link value-primary-link" href={exportHref} download="value-blueprint.md">
              <Download size={16} />
              Export plan
            </a>
            <a className="icon-link value-secondary-link" href="#marketplace-workbench">
              <ShoppingCart size={16} />
              Tune squad
            </a>
          </div>
        </div>
        <div className="value-score-card" aria-label="Value blueprint score">
          <span>Board score</span>
          <strong>{blueprint.boardScore}</strong>
          <p>{blueprint.primaryUser}</p>
        </div>
      </div>

      <div className="value-metric-row">
        {blueprint.metrics.map((metric) => (
          <article key={metric.id}>
            <span>{metric.label}</span>
            <strong>{metric.delta}</strong>
            <p>
              {metric.before} {"→"} {metric.after}
            </p>
            <small>{metric.proof}</small>
          </article>
        ))}
      </div>

      <div className="value-blueprint-grid">
        <section className="value-jobs">
          <div className="value-section-heading">
            <h3>
              <Lightbulb size={17} />
              Jobs Users Can Buy
            </h3>
            <span>{blueprint.jobs.length} accountable outcomes</span>
          </div>
          {blueprint.jobs.map((job) => (
            <article key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span>{job.agentName}</span>
              </div>
              <p>{job.currentPain}</p>
              <small>{job.userStory}</small>
              <ul>
                {job.acceptanceCriteria.slice(0, 2).map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="value-operating-plan">
          <div className="value-section-heading">
            <h3>
              <Workflow size={17} />
              Pilot Roadmap
            </h3>
            <span>{blueprint.businessCase.paybackDays} day payback target</span>
          </div>
          <ol>
            {blueprint.roadmap.map((step) => (
              <li key={step.id}>
                <span>{step.duration}</span>
                <strong>{step.phase}</strong>
                <p>{step.outcome}</p>
                <small>{step.exitGate}</small>
              </li>
            ))}
          </ol>
        </section>

        <aside className="value-proof-card">
          <div>
            <span>Proof contract</span>
            <strong>{blueprint.proofContract.owner}</strong>
            <p>{blueprint.proofContract.qualityGate}</p>
          </div>
          <div className="value-score-list">
            {scoreEntries.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <ul>
            {blueprint.proofContract.mustProve.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function SquadDecisionCard({
  title,
  candidate,
  tone,
  cta,
  disabled,
  onApply
}: {
  title: string;
  candidate: OptimizedSquadCandidate;
  tone: "current" | "recommended" | "stretch";
  cta: string;
  disabled?: boolean;
  onApply: () => void;
}) {
  return (
    <article className={cx("squad-decision-card", tone)}>
      <div className="squad-decision-card-top">
        <div>
          <span>{title}</span>
          <strong>{candidate.totalScore}</strong>
        </div>
        <small>{candidate.totalPrice} budget</small>
      </div>
      <div className="squad-decision-agents">
        {candidate.agents.map((agent) => (
          <span key={agent.id}>
            {agent.name}
            <b>{agent.price}</b>
          </span>
        ))}
      </div>
      <div className="squad-decision-metrics">
        <div>
          <span>Judge</span>
          <strong>{candidate.judgeScore}</strong>
        </div>
        <div>
          <span>Coverage</span>
          <strong>{candidate.coverageScore}%</strong>
        </div>
        <div>
          <span>Weak lane</span>
          <strong>{candidate.weakestCriterion.score}</strong>
        </div>
      </div>
      <div className="squad-decision-detail">
        <section>
          <h4>Strengths</h4>
          <ul>
            {candidate.strengths.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Tradeoffs</h4>
          <ul>
            {candidate.tradeoffs.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <button className="icon-button squad-decision-apply" type="button" onClick={onApply} disabled={disabled}>
        <ShoppingCart size={16} />
        {cta}
      </button>
    </article>
  );
}

function SquadDecisionBoard({
  optimizer,
  onApply
}: {
  optimizer: SquadOptimizerRun | null;
  onApply: (agentIds: string[]) => void;
}) {
  if (!optimizer) {
    return (
      <section id="squad-decision-board" className="squad-decision-board" aria-labelledby="squad-decision-title">
        <div className="squad-decision-heading">
          <div>
            <span className="eyebrow">Squad Decision Board</span>
            <h2 id="squad-decision-title">
              <Crosshair size={20} />
              Compare the squad before you commit
            </h2>
            <p>Preparing the squad comparison from the current brief and hired agents.</p>
          </div>
          <div className="squad-decision-verdict loading">
            <strong>...</strong>
            <small>optimizer score</small>
          </div>
        </div>
      </section>
    );
  }

  const currentIsRecommended = optimizer.current.id === optimizer.recommended.id;
  const readinessTone = optimizer.readiness === "optimized" ? "low" : optimizer.readiness === "worth-swapping" ? "medium" : "high";
  const stretchAdds = optimizer.stretch?.agents.filter((agent) => !optimizer.recommended.agentIds.includes(agent.id)).map((agent) => agent.name).join(" / ");

  return (
    <section id="squad-decision-board" className="squad-decision-board" aria-labelledby="squad-decision-title">
      <div className="squad-decision-heading">
        <div>
          <span className="eyebrow">Squad Decision Board</span>
          <h2 id="squad-decision-title">
            <Crosshair size={20} />
            Compare the squad before you commit
          </h2>
          <p>{optimizer.hardTruth}</p>
        </div>
        <div className="squad-decision-verdict">
          <span className={cx("risk-chip", readinessTone)}>{optimizer.readiness}</span>
          <strong>{optimizer.optimizerScore}</strong>
          <small>optimizer score</small>
        </div>
      </div>

      <div className="squad-decision-cards">
        <SquadDecisionCard
          title="Current squad"
          candidate={optimizer.current}
          tone="current"
          cta="Current"
          disabled
          onApply={() => onApply(optimizer.current.agentIds)}
        />
        <SquadDecisionCard
          title="Recommended"
          candidate={optimizer.recommended}
          tone="recommended"
          cta={currentIsRecommended ? "Applied" : "Apply recommended"}
          disabled={currentIsRecommended}
          onApply={() => onApply(optimizer.recommended.agentIds)}
        />
        {optimizer.stretch ? (
          <SquadDecisionCard
            title={`Stretch +${optimizer.budgetGap}`}
            candidate={optimizer.stretch}
            tone="stretch"
            cta="Apply stretch"
            onApply={() => onApply(optimizer.stretch?.agentIds ?? optimizer.recommended.agentIds)}
          />
        ) : (
          <article className="squad-decision-card stretch empty">
            <div className="squad-decision-card-top">
              <div>
                <span>Stretch</span>
                <strong>No gap</strong>
              </div>
              <small>0 gap</small>
            </div>
            <p>The current budget already covers the highest-coverage squad for this brief.</p>
          </article>
        )}
      </div>

      <div className="squad-decision-footer">
        <section>
          <h3>
            <BadgeCheck size={16} />
            Coverage gates
          </h3>
          <div className="squad-coverage-row">
            {optimizer.recommended.coverage.map((gate) => (
              <span key={gate.id} className={gate.met ? "met" : "missing"}>
                {gate.label}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h3>
            <Radar size={16} />
            Decision moves
          </h3>
          <div className="squad-swap-row">
            {optimizer.swapPlan.slice(0, 4).map((step) => (
              <article key={step.id} className={step.action}>
                <span>{step.action}</span>
                <strong>{step.label}</strong>
                <p>{step.reason}</p>
                <small>{step.scoreImpact}</small>
              </article>
            ))}
          </div>
          {stretchAdds && <p className="squad-stretch-note">Stretch adds: {stretchAdds}</p>}
        </section>
      </div>
    </section>
  );
}

function BlueprintTemplatePicker({
  activeTemplateId,
  onApply
}: {
  activeTemplateId: string;
  onApply: (template: BlueprintTemplate) => void;
}) {
  return (
    <section className="template-picker" aria-labelledby="template-picker-title">
      <div className="template-picker-heading">
        <div>
          <span className="eyebrow">Start with a real buyer scenario</span>
          <h2 id="template-picker-title">
            <Rocket size={18} />
            Pick a blueprint, then tune the AI squad
          </h2>
        </div>
        <span>{BLUEPRINT_TEMPLATES.length} launch paths</span>
      </div>
      <div className="template-grid">
        {BLUEPRINT_TEMPLATES.map((template) => (
          <button key={template.id} className={cx(activeTemplateId === template.id && "active")} onClick={() => onApply(template)}>
            <span>{template.audience}</span>
            <strong>{template.label}</strong>
            <p>{template.promise}</p>
            <small>
              {template.buyerScenario.teamSize} users / {template.buyerScenario.cyclesPerMonth} cycles/mo / {template.buyerScenario.manualHoursPerCycle}h cycle
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function WorkspaceStatusBar({
  draft,
  selectedCount,
  shareHref,
  launchRoomHref,
  evidenceBoardHref,
  proofAuditHref,
  publicReviewHref,
  importedFromShare,
  shareStatus,
  importStatus,
  importMessage,
  onCopyShareLink,
  onImportWorkspace,
  onReset
}: {
  draft: WorkspaceDraft;
  selectedCount: number;
  shareHref: string;
  launchRoomHref: string;
  evidenceBoardHref: string;
  proofAuditHref: string;
  publicReviewHref: string;
  importedFromShare: boolean;
  shareStatus: "idle" | "copied" | "failed";
  importStatus: "idle" | "imported" | "failed";
  importMessage: string;
  onCopyShareLink: () => void;
  onImportWorkspace: (file: File | null) => void;
  onReset: () => void;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const template = BLUEPRINT_TEMPLATES.find((item) => item.id === draft.activeTemplateId);
  const savedAt = new Date(draft.updatedAt);
  const savedLabel = importedFromShare
    ? "Imported shared workspace"
    : Number.isNaN(savedAt.getTime())
      ? "Saved locally"
      : `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const copyLabel = shareStatus === "copied" ? "Copied" : shareStatus === "failed" ? "Copy failed" : "Copy link";
  const importLabel = importStatus === "imported" ? "Imported" : importStatus === "failed" ? "Import failed" : "Import";
  const exportHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(draft, null, 2))}`;
  const resumePacket = buildWorkspaceResumePacket(draft, shareHref, proofAuditHref, publicReviewHref);
  const evidenceBoardStatus =
    resumePacket.proofHealth.status === "ready" && resumePacket.publicReview.status === "ready"
      ? "ready"
      : resumePacket.proofHealth.status === "blocked" || resumePacket.proofHealth.status === "missing" || resumePacket.publicReview.status === "blocked"
        ? "blocked"
        : "watch";
  const evidenceBoardHeadline =
    evidenceBoardStatus === "ready" ? "Sendable board ready" : evidenceBoardStatus === "watch" ? "Board needs review" : "Board blocks sharing";
  const evidenceBoardAction = evidenceBoardStatus === "ready" ? "Open the receipt-backed board before sending." : "Open the board to see the first buyer-facing blocker.";

  return (
    <section className="workspace-status-bar" aria-label="Saved workspace">
      <div>
        <span>{savedLabel}</span>
        <strong>{template ? template.label : "Custom workspace"}</strong>
        <p>
          {selectedCount} hired agents, {draft.buyerScenario.teamSize}-person ROI model, work order for {draft.buyerWorkOrder.targetUser || "target buyer"},{" "}
          {draft.targetUrl ? "deployment target saved" : "default deployment target"}, {draft.protopediaUrl || draft.videoUrl ? "submission URLs saved" : "submission URLs pending"}
        </p>
        {importMessage && <small className={cx("workspace-status-note", importStatus === "imported" && "is-confirmed", importStatus === "failed" && "is-risk")}>{importMessage}</small>}
      </div>
      <div className="workspace-resume-packet" aria-label="Workspace resume packet">
        <span>Resume packet</span>
        <strong>{resumePacket.headline}</strong>
        <p>{resumePacket.summary}</p>
        <div>
          {resumePacket.included.slice(0, 4).map((item) => (
            <small key={item.id} className={item.status}>
              {item.label}: {item.value}
            </small>
          ))}
        </div>
        <div className={cx("workspace-resume-proof", resumePacket.proofHealth.status)} aria-label="Resume packet live proof health">
          <span>Live proof</span>
          <strong>{resumePacket.proofHealth.headline}</strong>
          <p>{resumePacket.proofHealth.nextAction}</p>
          <a href={resumePacket.proofAuditUrl} target="_blank" rel="noreferrer">
            <Gauge size={13} />
            {resumePacket.proofHealth.nextActionLabel}
          </a>
        </div>
        <div className={cx("workspace-resume-cover", resumePacket.publicReview.status)} aria-label="Resume packet public review cover">
          <span>Public cover</span>
          <strong>{resumePacket.publicReview.headline}</strong>
          <p>{resumePacket.publicReview.summary}</p>
          <a href={resumePacket.publicReviewUrl} target="_blank" rel="noreferrer">
            <Trophy size={13} />
            {resumePacket.publicReview.actionLabel}
          </a>
        </div>
        <div className={cx("workspace-resume-board", evidenceBoardStatus)} aria-label="Buyer evidence board checkpoint">
          <span>Evidence board</span>
          <strong>{evidenceBoardHeadline}</strong>
          <p>{evidenceBoardAction}</p>
          <a href={evidenceBoardHref} target="_blank" rel="noreferrer">
            <ClipboardCheck size={13} />
            Open board
          </a>
        </div>
        <a href={resumePacket.markdownHref} download={`${resumePacket.receiptId}.md`}>
          <Download size={13} />
          Receipt {resumePacket.checksum.slice(0, 8)}
        </a>
      </div>
      <div className="workspace-status-actions">
        <button className={cx("icon-link", shareStatus === "copied" && "is-confirmed", shareStatus === "failed" && "is-risk")} onClick={onCopyShareLink} type="button">
          <BadgeCheck size={14} />
          {copyLabel}
        </button>
        <a href={shareHref} target="_blank" rel="noreferrer" className="icon-link">
          <ExternalLink size={14} />
          Share link
        </a>
        <a href={launchRoomHref} target="_blank" rel="noreferrer" className="icon-link">
          <FileText size={14} />
          Launch room
        </a>
        <a href={evidenceBoardHref} target="_blank" rel="noreferrer" className="icon-link">
          <ClipboardCheck size={14} />
          Evidence board
        </a>
        <a href={resumePacket.publicReviewUrl} target="_blank" rel="noreferrer" className="icon-link">
          <Trophy size={14} />
          Review cover
        </a>
        <a href={exportHref} download="a2a-launch-workspace.json" className="icon-link">
          <Download size={14} />
          Export
        </a>
        <button className={cx("icon-link", importStatus === "imported" && "is-confirmed", importStatus === "failed" && "is-risk")} onClick={() => importInputRef.current?.click()} type="button">
          <Upload size={14} />
          {importLabel}
        </button>
        <input
          ref={importInputRef}
          className="workspace-import-input"
          type="file"
          accept="application/json,.json"
          aria-label="Import workspace JSON"
          onChange={(event) => {
            onImportWorkspace(event.currentTarget.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />
        <button className="icon-link" onClick={onReset} type="button">
          <Activity size={14} />
          Reset
        </button>
      </div>
    </section>
  );
}

type BuyerProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

const BUYER_PILOT_PROOF_FIELDS: Array<{
  key: keyof BuyerPilotProofIntake;
  label: string;
  target: string;
  placeholder: string;
  href: string;
}> = [
  { key: "targetUrl", label: "Deployed URL", target: "Cloud Run proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.targetUrl, href: "#launch-evidence-console" },
  { key: "protopediaUrl", label: "ProtoPedia URL", target: "Public story proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl, href: "#launch-evidence-console" },
  { key: "videoUrl", label: "Walkthrough video", target: "Usage proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl, href: "#launch-evidence-console" },
  { key: "pilotEvidenceUrl", label: "Pilot receipt", target: "Measured run proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl, href: "#pilot-run-receipt" },
  { key: "workOrderEvidenceUrl", label: "Work order proof", target: "Scope proof", placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl, href: "#buyer-work-order-studio" }
];

function isPublicProofUrl(value: string) {
  return isBuyerFacingProofUrl(value);
}

function buyerProofStatusIcon(status: string) {
  if (status === "pass") return <BadgeCheck size={13} />;
  if (status === "watch") return <AlertTriangle size={13} />;
  return <Crosshair size={13} />;
}

function proofVerificationButtonLabel(status: BuyerProofVerifyStatus) {
  if (status === "checking") return "Checking links";
  if (status === "checked") return "Links checked";
  if (status === "failed") return "Check failed";
  return "Verify live links";
}

function RouteLockStatusIcon({ status }: { status: HomepageRouteLock["status"] }) {
  if (status === "ready") return <BadgeCheck size={16} />;
  if (status === "attention") return <AlertTriangle size={16} />;
  return <Crosshair size={16} />;
}

export const BUYER_PROOF_ENTRY_STEPS = [
  {
    id: "current",
    signal: "Your workspace",
    title: "Diagnose the buyer pilot you can actually send",
    detail: "Paste one workflow, value model, measured run, and proof URLs; the gate returns send/hold, proof audit, trust manifest, and launch room."
  },
  {
    id: "sample",
    signal: "Reference room",
    title: "See the evidence shape after your workflow is loaded",
    detail: "Use the reference room as calibration: deployed URL, accepted A2A receipts, measured pilot run, and publication gaps are visible together."
  },
  {
    id: "agent-trial",
    signal: "Agent trial",
    title: "Prove the agent before procurement",
    detail: "Inspect the Agent Card, shortlist alternatives, generate a supervised trial plan, and verify the returned receipt before it enters the workspace."
  }
] as const;

type BuyerProofChainStatus = HomepageRouteLock["status"];

export type BuyerProofWorkflowDecision = "pilot-ready" | "needs-proof" | "needs-scope" | "do-not-share";

export type BuyerProofWorkflowReadiness = {
  decision: BuyerProofWorkflowDecision;
  headline: string;
  nextAction: string;
};

export type BuyerProofChainGateId = "workflow-scope" | "value-case" | "measured-run" | "live-proof-audit" | "buyer-decision";

export type BuyerProofChainAction = {
  id: "primary" | "workflow-intake" | "delivery-memo" | "live-proof-audit" | "trust-manifest" | "decision-receipt" | "launch-room";
  label: string;
  href: string;
  external: boolean;
};

export type BuyerProofChainGate = {
  id: BuyerProofChainGateId;
  label: string;
  status: BuyerProofChainStatus;
  value: string;
  evidence: string;
  href: string;
};

export type BuyerProofChainSnapshot = {
  status: BuyerProofChainStatus;
  verdict: HomepageRouteLock["verdict"];
  headline: string;
  instruction: string;
  score: number;
  scoreLabel: string;
  readyCount: number;
  attentionCount: number;
  blockedCount: number;
  gateTotal: number;
  primaryAction: BuyerProofChainAction;
  actions: BuyerProofChainAction[];
  gates: BuyerProofChainGate[];
};

export type BuyerOwnedProofSlotId = "targetUrl" | "protopediaUrl" | "videoUrl" | "pilotEvidenceUrl" | "workOrderEvidenceUrl";

export type BuyerOwnedProofChecklistItem = {
  id: BuyerOwnedProofSlotId;
  label: string;
  status: BuyerProofChainStatus;
  value: string;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerOwnedProofChecklist = {
  status: BuyerProofChainStatus;
  headline: string;
  readyCount: number;
  attentionCount: number;
  blockedCount: number;
  totalCount: number;
  primaryAction: string;
  items: BuyerOwnedProofChecklistItem[];
};

export type BuyerProofPathRow = {
  id: "work-order" | "value-model" | "measured-run" | "decision-proof";
  label: string;
  status: BuyerProofChainStatus;
  title: string;
  detail: string;
  href: string;
};

export type BuyerPublicDecisionPathDecision = "send-to-buyer" | "sponsor-review" | "hold-internal";

export type BuyerPublicDecisionArtifact = {
  id: "workflow-intake" | "value-report" | "delivery-memo" | "proof-audit" | "launch-room" | "decision-receipt";
  label: string;
  status: BuyerProofChainStatus;
  value: string;
  proof: string;
  href: string;
};

export type BuyerPublicDecisionPath = {
  status: BuyerProofChainStatus;
  decision: BuyerPublicDecisionPathDecision;
  headline: string;
  buyerLine: string;
  firstAction: BuyerProofChainAction;
  artifacts: BuyerPublicDecisionArtifact[];
  guardrails: string[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerProofFocusStageId = "proof-gaps" | "first-commitment" | "buyer-room";

export type BuyerProofFocusStage = {
  id: BuyerProofFocusStageId;
  label: string;
  status: BuyerProofChainStatus;
  metric: string;
  headline: string;
  detail: string;
  action: BuyerProofChainAction;
};

export type BuyerProofFocusPlan = {
  status: BuyerProofChainStatus;
  headline: string;
  buyerPromise: string;
  primaryAction: BuyerProofChainAction;
  stages: BuyerProofFocusStage[];
  copyText: string;
  exportMarkdown: string;
  taskCsv: string;
  taskCsvHref: string;
};

export type BuyerSponsorAskSnapshot = {
  status: BuyerProofChainStatus;
  decision: BuyerValueCommitment["decision"];
  headline: string;
  askLabel: string;
  recommendedAskYen: number;
  askInstruction: string;
  decisionOwner: string;
  firstAction: BuyerProofChainAction;
  conditions: BuyerValueCommitmentCondition[];
  redLines: BuyerValueCommitmentRedLine[];
  nextProofMove: BuyerValueCommitment["nextProofMove"];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerOperatingSnapshotReadiness = "ready-to-operate" | "needs-owner-commitment" | "blocked";

export type BuyerOperatingSnapshotStep = {
  id: "day-0-work-order" | "week-1-measured-run" | "week-2-proof-review" | "day-30-decision";
  label: string;
  window: string;
  owner: string;
  status: BuyerProofChainStatus;
  objective: string;
  evidence: string;
  href: string;
};

export type BuyerOperatingSnapshotCommitment = {
  role: string;
  owner: string;
  commitment: string;
};

export type BuyerOperatingPlanSnapshot = {
  readiness: BuyerOperatingSnapshotReadiness;
  status: BuyerProofChainStatus;
  headline: string;
  hardTruth: string;
  buyer: string;
  operatingMetric: string;
  expectedMonthlyValueYen: number;
  riskAdjustedMonthlyValueYen: number;
  firstAction: BuyerProofChainAction;
  cadence: BuyerOperatingSnapshotStep[];
  commitments: BuyerOperatingSnapshotCommitment[];
  expansionCriteria: string[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerTrustSnapshotReadiness = "trust-ready" | "needs-review" | "blocked";

export type BuyerTrustSnapshotControl = {
  id: "data-boundary" | "public-proof" | "measured-run" | "sponsor-ask" | "operating-owner" | "stop-rules";
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  evidence: string;
  buyerQuestion: string;
  nextAction: string;
  href: string;
};

export type BuyerTrustSnapshot = {
  readiness: BuyerTrustSnapshotReadiness;
  status: BuyerProofChainStatus;
  trustScore: number;
  headline: string;
  hardTruth: string;
  dataBoundary: string;
  firstAction: BuyerProofChainAction;
  controls: BuyerTrustSnapshotControl[];
  questions: Array<{
    question: string;
    answer: string;
    evidence: string;
  }>;
  commitments: string[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerCommercialOfferReadiness = "offer-ready" | "needs-approval" | "blocked";

export type BuyerCommercialOfferTerm = {
  id: "scope" | "term" | "acceptance" | "renewal";
  label: string;
  value: string;
  detail: string;
  status: BuyerProofChainStatus;
  href: string;
};

export type BuyerCommercialOfferGuardrail = {
  id: "budget-cap" | "public-proof" | "trust-gate" | "operating-gate";
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  evidence: string;
  rule: string;
  href: string;
};

export type BuyerCommercialOfferSnapshot = {
  readiness: BuyerCommercialOfferReadiness;
  status: BuyerProofChainStatus;
  headline: string;
  hardTruth: string;
  buyer: string;
  recommendedTier: string;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  valueCoveragePercent: number;
  paybackDays: number;
  contractLine: string;
  firstAction: BuyerProofChainAction;
  terms: BuyerCommercialOfferTerm[];
  guardrails: BuyerCommercialOfferGuardrail[];
  buyerQuestions: Array<{
    question: string;
    answer: string;
    evidence: string;
  }>;
  copyText: string;
  exportMarkdown: string;
};

export type BuyerActivationSnapshotStep = {
  id: string;
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  action: string;
  acceptanceSignal: string;
  proofToAttach: string;
  href: string;
  editHref: string;
  isCurrent: boolean;
};

export type BuyerActivationSnapshot = {
  status: BuyerProofChainStatus;
  readiness: BuyerPilotCommand["readiness"];
  headline: string;
  hardTruth: string;
  buyer: string;
  proofClosure: string;
  currentOwner: string;
  currentArtifact: string;
  firstAction: BuyerProofChainAction;
  reviewAction: BuyerProofChainAction;
  steps: BuyerActivationSnapshotStep[];
  commitments: string[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerGlobalLaunchSnapshotDimension = {
  id: GlobalLaunchAudit["dimensions"][number]["id"];
  label: string;
  status: BuyerProofChainStatus;
  score: number;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerGlobalLaunchSnapshotProofLink = {
  id: string;
  label: string;
  value: string;
  status: BuyerProofChainStatus;
  href: string;
};

export type BuyerGlobalLaunchReleaseLiftAction = {
  id: string;
  priority: "now" | "next";
  label: string;
  status: BuyerProofChainStatus;
  scoreLift: number;
  projectedScore: number;
  proofRequired: string;
  decisionImpact: string;
  href: string;
};

export type BuyerGlobalLaunchReleaseLift = {
  targetScore: number;
  scoreGap: number;
  projectedScoreAfterFirstFix: number;
  summary: string;
  actions: BuyerGlobalLaunchReleaseLiftAction[];
};

export type BuyerGlobalLaunchSnapshot = {
  status: BuyerProofChainStatus;
  readiness: GlobalLaunchAudit["readiness"];
  score: number;
  headline: string;
  hardTruth: string;
  targetMarket: string;
  proofSummary: string;
  opsSummary: string;
  firstAction: BuyerProofChainAction;
  reviewAction: BuyerProofChainAction;
  dimensions: BuyerGlobalLaunchSnapshotDimension[];
  releaseLift: BuyerGlobalLaunchReleaseLift;
  proofLinks: BuyerGlobalLaunchSnapshotProofLink[];
  copyText: string;
  exportMarkdown: string;
};

export type HomepagePublishabilityGate = {
  id: string;
  label: string;
  status: BuyerProofChainStatus;
  score: number;
  href: string;
};

export type HomepagePublishabilityValueRouteStep = {
  id: "buyer-value" | "measured-proof" | "public-proof" | "decision-path";
  label: string;
  status: BuyerProofChainStatus;
  title: string;
  evidence: string;
  href: string;
};

export type HomepagePublishabilityReviewerCover = {
  status: BuyerProofChainStatus;
  label: string;
  headline: string;
  summary: string;
  href: string;
  external: boolean;
};

export type HomepagePublishabilityPublicClaim = {
  id: "value-claim" | "outcome-claim" | "proof-claim" | "operating-claim";
  label: string;
  status: BuyerProofChainStatus;
  claim: string;
  proof: string;
  buyerQuestion: string;
  href: string;
};

export type HomepagePublishabilitySnapshot = {
  status: BuyerProofChainStatus;
  decision: "publish-ready" | "review-first" | "do-not-publish";
  score: number;
  headline: string;
  hardTruth: string;
  proofSummary: string;
  primaryAction: BuyerProofChainAction;
  reportAction: BuyerProofChainAction;
  workflowAction: BuyerProofChainAction;
  reviewerCover: HomepagePublishabilityReviewerCover;
  readyCount: number;
  blockedCount: number;
  gateTotal: number;
  gates: HomepagePublishabilityGate[];
  valueRoute: HomepagePublishabilityValueRouteStep[];
  publicClaimLedger: HomepagePublishabilityPublicClaim[];
  releaseLift: BuyerGlobalLaunchReleaseLift;
  copyText: string;
  exportMarkdown: string;
};

export type BuyerPilotContractReadiness = "contract-ready" | "needs-owner-review" | "blocked";

export type BuyerPilotContractMilestone = {
  id: "first-commitment" | "sponsor-decision" | "operating-path" | "activation-owner" | "public-launch-proof";
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  promise: string;
  proof: string;
  href: string;
};

export type BuyerPilotContractCloseItem = {
  id: "buyer-scope" | "commercial-boundary" | "proof-acceptance" | "trust-boundary" | "renewal-decision";
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  buyerDecision: string;
  evidence: string;
  href: string;
};

export type BuyerPilotContractSendAttachment = {
  id: "pilot-contract" | "launch-room" | "proof-audit" | "commercial-boundary" | "trust-boundary";
  label: string;
  status: BuyerProofChainStatus;
  href: string;
  evidence: string;
};

export type BuyerPilotContractSendNote = {
  status: BuyerProofChainStatus;
  subject: string;
  instruction: string;
  body: string[];
  attachments: BuyerPilotContractSendAttachment[];
  copyText: string;
};

export type BuyerPilotContractSnapshot = {
  readiness: BuyerPilotContractReadiness;
  status: BuyerProofChainStatus;
  headline: string;
  hardTruth: string;
  buyer: string;
  pilotOffer: string;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  valueCoveragePercent: number;
  paybackDays: number;
  proofLine: string;
  stopRule: string;
  firstAction: BuyerProofChainAction;
  reviewAction: BuyerProofChainAction;
  milestones: BuyerPilotContractMilestone[];
  closeChecklist: BuyerPilotContractCloseItem[];
  sendNote: BuyerPilotContractSendNote;
  buyerQuestions: Array<{
    question: string;
    answer: string;
    evidence: string;
  }>;
  copyText: string;
  exportMarkdown: string;
};

export type BuyerPilotAssemblyLineStageId = "workflow" | "value" | "proof" | "contract";

export type BuyerPilotAssemblyLineStage = {
  id: BuyerPilotAssemblyLineStageId;
  label: string;
  status: BuyerProofChainStatus;
  title: string;
  detail: string;
  href: string;
};

export type BuyerPilotAssemblyLineSnapshot = {
  status: BuyerProofChainStatus;
  headline: string;
  instruction: string;
  readyCount: number;
  attentionCount: number;
  blockedCount: number;
  stageTotal: number;
  primaryAction: BuyerProofChainAction;
  stages: BuyerPilotAssemblyLineStage[];
};

export type BuyerPilotDecisionBriefQuestionId = "scope" | "price" | "expansion";

export type BuyerPilotDecisionBriefQuestion = {
  id: BuyerPilotDecisionBriefQuestionId;
  label: string;
  status: BuyerProofChainStatus;
  question: string;
  answer: string;
  evidence: string;
  href: string;
};

export type BuyerPilotDecisionBriefSnapshot = {
  status: BuyerProofChainStatus;
  headline: string;
  summary: string;
  readyCount: number;
  questionTotal: number;
  pilotOffer: string;
  proofLine: string;
  stopRule: string;
  primaryAction: BuyerProofChainAction;
  questions: BuyerPilotDecisionBriefQuestion[];
  copyText: string;
  exportMarkdown: string;
};

export type BuyerPilotMeetingAgendaItemId = "scope" | "price" | "proof-trust" | "day-30";

export type BuyerPilotMeetingAgendaItem = {
  id: BuyerPilotMeetingAgendaItemId;
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  outcome: string;
  evidence: string;
  href: string;
};

export type BuyerPilotMeetingObjection = {
  id: "why-now" | "value-risk" | "proof-access";
  question: string;
  answer: string;
  evidence: string;
};

export type BuyerPilotMeetingCalendarHold = {
  status: BuyerProofChainStatus;
  title: string;
  filename: string;
  durationMinutes: number;
  icsText: string;
  href: string;
};

export type BuyerPilotMeetingDecisionReceiptItem = {
  id: BuyerPilotMeetingAgendaItemId | "close-ask" | "follow-up" | "calendar-hold";
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  action: string;
  evidence: string;
  href: string;
};

export type BuyerPilotMeetingTaskLedger = {
  filename: string;
  taskCount: number;
  csvText: string;
  href: string;
};

export type BuyerPilotMeetingOutcomeRouteId = "approve" | "hold" | "reject";

export type BuyerPilotMeetingOutcomeRoute = {
  id: BuyerPilotMeetingOutcomeRouteId;
  label: string;
  status: BuyerProofChainStatus;
  owner: string;
  condition: string;
  record: string;
  nextAction: string;
  evidence: string;
};

export type BuyerPilotMeetingDecisionReceipt = {
  status: BuyerProofChainStatus;
  decision: "approve-pilot" | "repair-before-buyer";
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  proofChecksum: string;
  headline: string;
  summary: string;
  owner: string;
  items: BuyerPilotMeetingDecisionReceiptItem[];
  recommendedOutcome: BuyerPilotMeetingOutcomeRouteId;
  outcomeRoutes: BuyerPilotMeetingOutcomeRoute[];
  taskLedger: BuyerPilotMeetingTaskLedger;
  copyText: string;
  exportMarkdown: string;
  href: string;
};

export type BuyerPilotMeetingFollowUp = {
  status: BuyerProofChainStatus;
  subject: string;
  instruction: string;
  body: string[];
  calendar: BuyerPilotMeetingCalendarHold;
  copyText: string;
  mailtoHref: string;
};

export type BuyerPilotMeetingBriefSnapshot = {
  status: BuyerProofChainStatus;
  headline: string;
  meetingGoal: string;
  readyCount: number;
  agendaTotal: number;
  primaryAction: BuyerProofChainAction;
  closeAsk: string;
  agenda: BuyerPilotMeetingAgendaItem[];
  objections: BuyerPilotMeetingObjection[];
  followUp: BuyerPilotMeetingFollowUp;
  decisionReceipt: BuyerPilotMeetingDecisionReceipt;
  copyText: string;
  exportMarkdown: string;
};

function chainHrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function compactProofText(value: string, fallback: string, max = 150) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (!compacted) return fallback;
  if (compacted.length <= max) return compacted;
  return `${compacted.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function buyerValueChainStatus(readiness: BuyerValueScenario["readiness"]): BuyerProofChainStatus {
  if (readiness === "scales-now") return "ready";
  if (readiness === "pilot-first") return "attention";
  return "blocked";
}

function measuredRunChainStatus(readiness: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>["readiness"]): BuyerProofChainStatus {
  if (readiness === "measured") return "ready";
  if (readiness === "needs-reviewer") return "attention";
  return "blocked";
}

function workflowIntakeChainStatus(decision: BuyerProofWorkflowDecision): BuyerProofChainStatus {
  if (decision === "pilot-ready") return "ready";
  if (decision === "needs-proof") return "attention";
  return "blocked";
}

export function buildBuyerProofPathRows({
  workflowReadiness,
  buyerScenario,
  buyerWorkOrder,
  measuredRun,
  measuredRunSummary,
  lock,
  workflowIntakeHref,
  valueReportHref,
  deliveryMemoHref,
  launchRoomHref
}: {
  workflowReadiness: BuyerProofWorkflowReadiness;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  measuredRun: PilotRunReceiptInput;
  measuredRunSummary: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>;
  lock: HomepageRouteLock;
  workflowIntakeHref: string;
  valueReportHref: string;
  deliveryMemoHref: string;
  launchRoomHref: string;
}): BuyerProofPathRow[] {
  const workflowStatus = workflowIntakeChainStatus(workflowReadiness.decision);
  const valueStatus = buyerValueChainStatus(buyerScenario.readiness);
  const measuredStatus = measuredRunChainStatus(measuredRunSummary.readiness);
  const workOrderTitle = buyerWorkOrder.targetUser.trim() || workflowReadiness.headline;
  const workOrderDetail =
    buyerWorkOrder.request.trim() && buyerWorkOrder.successMetric.trim()
      ? `${compactProofText(buyerWorkOrder.request, "Workflow request missing", 112)} Success: ${compactProofText(buyerWorkOrder.successMetric, "success metric missing", 82)}`
      : workflowReadiness.nextAction;

  return [
    {
      id: "work-order",
      label: "Work order",
      status: workflowStatus,
      title: workOrderTitle || "Target buyer missing",
      detail: workOrderDetail,
      href: workflowIntakeHref
    },
    {
      id: "value-model",
      label: "Value model",
      status: valueStatus,
      title: `${yen(buyerScenario.monthlyGrossValueYen)} / mo`,
      detail: `${buyerScenario.monthlyHoursSaved}h/month modeled, ${buyerScenario.paybackDays}d payback. ${buyerScenario.hardTruth}`,
      href: valueReportHref
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: measuredStatus,
      title: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run`,
      detail: `${measuredRun.observedManualMinutes}m manual to ${measuredRun.observedAssistedMinutes}m assisted, ${measuredRunSummary.acceptanceRatePercent}% accepted, ${yen(measuredRunSummary.measuredMonthlyValueYen)} measured monthly value.`,
      href: deliveryMemoHref
    },
    {
      id: "decision-proof",
      label: "Decision proof",
      status: lock.status,
      title: lock.verdict,
      detail: lock.operatorLine,
      href: launchRoomHref
    }
  ];
}

function publicDecisionFrom(snapshot: BuyerProofChainSnapshot): BuyerPublicDecisionPathDecision {
  if (snapshot.status === "ready" && snapshot.verdict === "send") return "send-to-buyer";
  if (snapshot.status === "attention" || snapshot.verdict === "pilot-review") return "sponsor-review";
  return "hold-internal";
}

function publicDecisionHeadline(decision: BuyerPublicDecisionPathDecision, firstOpen: BuyerPublicDecisionArtifact | undefined) {
  if (decision === "send-to-buyer") return "Public buyer path is ready";
  if (decision === "sponsor-review") return `Sponsor should review ${firstOpen?.label ?? "the open proof path"} before sending`;
  return `Hold public sharing until ${firstOpen?.label ?? "the first proof gap"} is fixed`;
}

function sponsorAskStatus(commitment: BuyerValueCommitment): BuyerProofChainStatus {
  const statuses = [...commitment.conditions, ...commitment.redLines].map((item) => item.status);
  if (commitment.decision === "hold-pitch" || statuses.includes("blocked")) return "blocked";
  if (commitment.decision === "run-contained-pilot") return "attention";
  return "ready";
}

export function buildBuyerSponsorAskSnapshot({
  commitment,
  valueReportHref
}: {
  commitment: BuyerValueCommitment;
  valueReportHref: string;
}): BuyerSponsorAskSnapshot {
  const status = sponsorAskStatus(commitment);
  const firstOpen = commitment.conditions.find((condition) => condition.status === "blocked") ?? commitment.conditions.find((condition) => condition.status === "watch");
  const label =
    status === "ready"
      ? "Open value report"
      : firstOpen
        ? `${firstOpen.status === "blocked" ? "Repair" : "Review"} ${firstOpen.label}`
        : "Review sponsor ask";
  const href = status === "ready" ? valueReportHref : "#buyer-value-simulator";

  return {
    status,
    decision: commitment.decision,
    headline: commitment.headline,
    askLabel: commitment.askLabel,
    recommendedAskYen: commitment.recommendedAskYen,
    askInstruction: commitment.askInstruction,
    decisionOwner: commitment.decisionOwner,
    firstAction: {
      id: "primary",
      label,
      href,
      external: chainHrefIsExternal(href)
    },
    conditions: commitment.conditions,
    redLines: commitment.redLines,
    nextProofMove: commitment.nextProofMove,
    copyText: commitment.exportMarkdown,
    exportMarkdown: commitment.exportMarkdown
  };
}

function operatingReadinessFrom(statuses: BuyerProofChainStatus[]): BuyerOperatingSnapshotReadiness {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.every((status) => status === "ready")) return "ready-to-operate";
  return "needs-owner-commitment";
}

function operatingStatusFrom(readiness: BuyerOperatingSnapshotReadiness): BuyerProofChainStatus {
  if (readiness === "ready-to-operate") return "ready";
  if (readiness === "needs-owner-commitment") return "attention";
  return "blocked";
}

function operatingHeadlineFor(readiness: BuyerOperatingSnapshotReadiness) {
  if (readiness === "ready-to-operate") return "This pilot has a 30-day operating path";
  if (readiness === "needs-owner-commitment") return "Name the operating owners before rollout";
  return "Do not roll out until the operating blockers are fixed";
}

function buildBuyerOperatingPlanMarkdown(plan: Omit<BuyerOperatingPlanSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# 30-day buyer operating snapshot",
    "",
    `Readiness: ${plan.readiness}`,
    `Buyer: ${plan.buyer}`,
    `Operating metric: ${plan.operatingMetric}`,
    `Expected monthly value: ${yen(plan.expectedMonthlyValueYen)}`,
    `Risk-adjusted monthly value: ${yen(plan.riskAdjustedMonthlyValueYen)}`,
    `First action: ${plan.firstAction.label} (${plan.firstAction.href})`,
    "",
    plan.hardTruth,
    "",
    "## 30-day operating cadence",
    ...plan.cadence.map((step) => `- [${step.status}] ${step.window} - ${step.label} (${step.owner}): ${step.objective} Evidence: ${step.evidence}`),
    "",
    "## Owner commitments",
    ...plan.commitments.map((commitment) => `- ${commitment.role}: ${commitment.owner}. ${commitment.commitment}`),
    "",
    "## Expansion criteria",
    ...plan.expansionCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");
}

export function buildBuyerOperatingPlanSnapshot({
  workflowReadiness,
  buyerScenario,
  buyerWorkOrder,
  measuredRun,
  measuredRunSummary,
  publicDecisionPath,
  sponsorAsk,
  workflowIntakeHref,
  deliveryMemoHref,
  launchRoomHref
}: {
  workflowReadiness: BuyerProofWorkflowReadiness;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  measuredRun: PilotRunReceiptInput;
  measuredRunSummary: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>;
  publicDecisionPath: BuyerPublicDecisionPath;
  sponsorAsk: BuyerSponsorAskSnapshot;
  workflowIntakeHref: string;
  deliveryMemoHref: string;
  launchRoomHref: string;
}): BuyerOperatingPlanSnapshot {
  const buyer = buyerWorkOrder.targetUser.trim() || "Buyer sponsor";
  const metric = buyerWorkOrder.successMetric.trim() || `${buyerScenario.monthlyHoursSaved}h saved/month with ${buyerScenario.paybackDays}-day payback`;
  const workflowStatus = workflowIntakeChainStatus(workflowReadiness.decision);
  const measuredStatus = measuredRunChainStatus(measuredRunSummary.readiness);
  const cadence: BuyerOperatingSnapshotStep[] = [
    {
      id: "day-0-work-order",
      label: "Confirm the real work order",
      window: "Day 0",
      owner: buyer,
      status: workflowStatus,
      objective: compactProofText(buyerWorkOrder.request, workflowReadiness.headline, 150),
      evidence: workflowReadiness.nextAction,
      href: workflowIntakeHref
    },
    {
      id: "week-1-measured-run",
      label: "Run the first measured workflow",
      window: "Week 1",
      owner: measuredRun.reviewerName.trim() || "Pilot reviewer",
      status: measuredStatus,
      objective: `Move one run from ${measuredRun.observedManualMinutes}m manual to ${measuredRun.observedAssistedMinutes}m assisted.`,
      evidence: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run, ${measuredRunSummary.acceptanceRatePercent}% accepted.`,
      href: deliveryMemoHref
    },
    {
      id: "week-2-proof-review",
      label: "Review proof and stop lines",
      window: "Week 2",
      owner: sponsorAsk.decisionOwner,
      status: sponsorAsk.status,
      objective: sponsorAsk.askInstruction,
      evidence: `${sponsorAsk.askLabel}: ${yen(sponsorAsk.recommendedAskYen)}.`,
      href: sponsorAsk.firstAction.href
    },
    {
      id: "day-30-decision",
      label: "Decide expand, revise, or stop",
      window: "Day 30",
      owner: sponsorAsk.decisionOwner,
      status: publicDecisionPath.status,
      objective: publicDecisionPath.headline,
      evidence: publicDecisionPath.buyerLine,
      href: launchRoomHref
    }
  ];
  const readiness = operatingReadinessFrom(cadence.map((step) => step.status));
  const status = operatingStatusFrom(readiness);
  const firstOpen = cadence.find((step) => step.status === "blocked") ?? cadence.find((step) => step.status === "attention");
  const riskPenalty = readiness === "ready-to-operate" ? 0.9 : readiness === "needs-owner-commitment" ? 0.62 : 0.35;
  const openCount = cadence.filter((step) => step.status !== "ready").length;
  const partial: Omit<BuyerOperatingPlanSnapshot, "copyText" | "exportMarkdown"> = {
    readiness,
    status,
    headline: operatingHeadlineFor(readiness),
    hardTruth:
      readiness === "ready-to-operate"
        ? "The buyer can see the work order, measured run, sponsor ask, and day-30 decision path before anyone calls this production-ready."
        : `${openCount} operating item${openCount === 1 ? "" : "s"} need closure before this can become more than a promising pilot.`,
    buyer,
    operatingMetric: metric,
    expectedMonthlyValueYen: buyerScenario.monthlyGrossValueYen,
    riskAdjustedMonthlyValueYen: Math.round(buyerScenario.monthlyGrossValueYen * riskPenalty),
    firstAction: firstOpen
      ? {
          id: "primary",
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: chainHrefIsExternal(firstOpen.href)
        }
      : {
          id: "primary",
          label: "Open launch room",
          href: launchRoomHref,
          external: chainHrefIsExternal(launchRoomHref)
        },
    cadence,
    commitments: [
      {
        role: "Buyer sponsor",
        owner: sponsorAsk.decisionOwner,
        commitment: "Own the day-30 expand, revise, or stop decision against the proof gates."
      },
      {
        role: "Pilot operator",
        owner: measuredRun.reviewerName.trim() || buyer,
        commitment: "Run the measured workflow and keep the delivery memo current."
      },
      {
        role: "Proof owner",
        owner: "Cloud Run SRE",
        commitment: "Keep public proof attached before external sharing or mark the path blocked."
      }
    ],
    expansionCriteria: [
      `Risk-adjusted monthly value stays above ${yen(Math.round(buyerScenario.monthlyGrossValueYen * 0.6))}.`,
      `Measured acceptance remains at or above 70%; current run is ${measuredRunSummary.acceptanceRatePercent}%.`,
      "No blocked public decision artifact remains open before expansion."
    ]
  };
  const exportMarkdown = buildBuyerOperatingPlanMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function trustSnapshotReadinessFrom(statuses: BuyerProofChainStatus[]): BuyerTrustSnapshotReadiness {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.every((status) => status === "ready")) return "trust-ready";
  return "needs-review";
}

function trustSnapshotStatusFrom(readiness: BuyerTrustSnapshotReadiness): BuyerProofChainStatus {
  if (readiness === "trust-ready") return "ready";
  if (readiness === "needs-review") return "attention";
  return "blocked";
}

function trustSnapshotHeadlineFor(readiness: BuyerTrustSnapshotReadiness) {
  if (readiness === "trust-ready") return "Buyer trust is ready for external review";
  if (readiness === "needs-review") return "Trust needs owner review before expansion";
  return "Trust blocks external buyer rollout";
}

function trustDataBoundaryLabel(input: BuyerWorkOrderInput) {
  if (input.dataSensitivity === "public") return "Public or synthetic data only";
  if (input.dataSensitivity === "internal") return "Internal data needs reviewer confirmation";
  return "Restricted data blocked from external sharing";
}

function proofUrlStatus(url: string, baseStatus: BuyerProofChainStatus): BuyerProofChainStatus {
  if (baseStatus === "blocked") return "blocked";
  if (!isBuyerFacingProofUrl(url)) return baseStatus === "ready" ? "attention" : baseStatus;
  return baseStatus;
}

function buyerProofStatusScore(status: BuyerProofChainStatus) {
  if (status === "ready") return 100;
  if (status === "attention") return 66;
  return 18;
}

function buildBuyerTrustSnapshotMarkdown(snapshot: Omit<BuyerTrustSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer trust snapshot",
    "",
    `Readiness: ${snapshot.readiness}`,
    `Trust score: ${snapshot.trustScore}/100`,
    `Data boundary: ${snapshot.dataBoundary}`,
    `First action: ${snapshot.firstAction.label} (${snapshot.firstAction.href})`,
    "",
    snapshot.hardTruth,
    "",
    "## Trust controls",
    ...snapshot.controls.map((control) => `- [${control.status}] ${control.label} (${control.owner}): ${control.evidence} Next: ${control.nextAction}`),
    "",
    "## Buyer questions",
    ...snapshot.questions.map((question) => `- ${question.question} ${question.answer} Evidence: ${question.evidence}`),
    "",
    "## Commitments",
    ...snapshot.commitments.map((commitment) => `- ${commitment}`)
  ].join("\n");
}

export function buildBuyerTrustSnapshot({
  buyerWorkOrder,
  measuredRun,
  measuredRunSummary,
  publicDecisionPath,
  sponsorAsk,
  operatingSnapshot,
  workflowIntakeHref,
  deliveryMemoHref,
  trustManifestHref,
  launchRoomHref
}: {
  buyerWorkOrder: BuyerWorkOrderInput;
  measuredRun: PilotRunReceiptInput;
  measuredRunSummary: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>;
  publicDecisionPath: BuyerPublicDecisionPath;
  sponsorAsk: BuyerSponsorAskSnapshot;
  operatingSnapshot: BuyerOperatingPlanSnapshot;
  workflowIntakeHref: string;
  deliveryMemoHref: string;
  trustManifestHref: string;
  launchRoomHref: string;
}): BuyerTrustSnapshot {
  const dataBoundaryStatus: BuyerProofChainStatus = buyerWorkOrder.dataSensitivity === "restricted" ? "blocked" : buyerWorkOrder.dataSensitivity === "internal" ? "attention" : "ready";
  const measuredStatus = proofUrlStatus(measuredRun.evidenceUrl, measuredRunChainStatus(measuredRunSummary.readiness));
  const controls: BuyerTrustSnapshotControl[] = [
    {
      id: "data-boundary",
      label: "Data boundary",
      status: dataBoundaryStatus,
      owner: "Security reviewer",
      evidence: trustDataBoundaryLabel(buyerWorkOrder),
      buyerQuestion: "Will this require private customer data?",
      nextAction: dataBoundaryStatus === "blocked" ? "Move the first pilot to public or synthetic data." : "Keep the boundary attached to every buyer handoff.",
      href: workflowIntakeHref
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: publicDecisionPath.status,
      owner: "Cloud Run SRE",
      evidence: publicDecisionPath.headline,
      buyerQuestion: "Can an outside reviewer inspect the product?",
      nextAction: publicDecisionPath.status === "ready" ? "Keep public proof links attached." : "Close the blocked public decision artifact.",
      href: publicDecisionPath.firstAction.href
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: measuredStatus,
      owner: measuredRun.reviewerName.trim() || "Pilot reviewer",
      evidence: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run, ${measuredRunSummary.acceptanceRatePercent}% accepted, evidence URL ${isBuyerFacingProofUrl(measuredRun.evidenceUrl) ? "public" : "missing or internal"}.`,
      buyerQuestion: "What proof shows actual user value?",
      nextAction: measuredStatus === "ready" ? "Keep the receipt in the buyer packet." : "Attach a public measured-run receipt.",
      href: deliveryMemoHref
    },
    {
      id: "sponsor-ask",
      label: "Sponsor ask",
      status: sponsorAsk.status,
      owner: sponsorAsk.decisionOwner,
      evidence: `${sponsorAsk.askLabel}: ${yen(sponsorAsk.recommendedAskYen)}. ${sponsorAsk.askInstruction}`,
      buyerQuestion: "Who approves the first commitment?",
      nextAction: sponsorAsk.status === "ready" ? "Use the capped sponsor ask." : "Repair the ask conditions before requesting budget.",
      href: sponsorAsk.firstAction.href
    },
    {
      id: "operating-owner",
      label: "Operating owner",
      status: operatingSnapshot.status,
      owner: operatingSnapshot.commitments[0]?.owner ?? "Buyer sponsor",
      evidence: operatingSnapshot.headline,
      buyerQuestion: "Who operates this after the first run?",
      nextAction: operatingSnapshot.status === "ready" ? "Use the 30-day operating path." : "Close the open operating owner item.",
      href: operatingSnapshot.firstAction.href
    },
    {
      id: "stop-rules",
      label: "Stop rules",
      status: operatingSnapshot.status === "blocked" || sponsorAsk.status === "blocked" ? "blocked" : operatingSnapshot.status === "attention" || sponsorAsk.status === "attention" ? "attention" : "ready",
      owner: sponsorAsk.decisionOwner,
      evidence: operatingSnapshot.expansionCriteria[2] ?? "Expansion waits for proof and sponsor decision gates.",
      buyerQuestion: "What happens if value or safety drops?",
      nextAction: "Keep expand, revise, and stop tied to proof evidence.",
      href: launchRoomHref
    }
  ];
  const readiness = trustSnapshotReadinessFrom(controls.map((control) => control.status));
  const status = trustSnapshotStatusFrom(readiness);
  const firstOpen = controls.find((control) => control.status === "blocked") ?? controls.find((control) => control.status === "attention");
  const trustScore = Math.round(controls.reduce((sum, control) => sum + buyerProofStatusScore(control.status), 0) / Math.max(1, controls.length));
  const blockedCount = controls.filter((control) => control.status === "blocked").length;
  const partial: Omit<BuyerTrustSnapshot, "copyText" | "exportMarkdown"> = {
    readiness,
    status,
    trustScore,
    headline: trustSnapshotHeadlineFor(readiness),
    hardTruth:
      readiness === "trust-ready"
        ? "A buyer can inspect data boundary, public proof, measured value, sponsor approval, operating ownership, and stop rules from the first proof room."
        : `${blockedCount} trust blocker${blockedCount === 1 ? "" : "s"} and ${controls.filter((control) => control.status === "attention").length} review item${controls.filter((control) => control.status === "attention").length === 1 ? "" : "s"} remain before external trust review.`,
    dataBoundary: trustDataBoundaryLabel(buyerWorkOrder),
    firstAction: firstOpen
      ? {
          id: "primary",
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: chainHrefIsExternal(firstOpen.href)
        }
      : {
          id: "primary",
          label: "Open trust manifest",
          href: trustManifestHref,
          external: chainHrefIsExternal(trustManifestHref)
        },
    controls,
    questions: controls.slice(0, 4).map((control) => ({
      question: control.buyerQuestion,
      answer: control.nextAction,
      evidence: control.evidence
    })),
    commitments: [
      `${sponsorAsk.decisionOwner} owns the capped sponsor ask and day-30 decision.`,
      `${measuredRun.reviewerName.trim() || "Pilot reviewer"} owns measured-run proof before expansion.`,
      "Cloud Run SRE owns public proof freshness and trust manifest attachment."
    ]
  };
  const exportMarkdown = buildBuyerTrustSnapshotMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function commercialOfferReadinessFrom(statuses: BuyerProofChainStatus[]): BuyerCommercialOfferReadiness {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.every((status) => status === "ready")) return "offer-ready";
  return "needs-approval";
}

function commercialOfferStatusFrom(readiness: BuyerCommercialOfferReadiness): BuyerProofChainStatus {
  if (readiness === "offer-ready") return "ready";
  if (readiness === "needs-approval") return "attention";
  return "blocked";
}

function commercialOfferHeadlineFor(readiness: BuyerCommercialOfferReadiness) {
  if (readiness === "offer-ready") return "The first commercial offer is ready";
  if (readiness === "needs-approval") return "Commercial terms need owner approval before sending";
  return "Do not send pricing until the proof blockers are fixed";
}

function roundCommercialYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function commercialPaybackDays(priceYen: number, monthlyValueYen: number) {
  if (priceYen <= 0 || monthlyValueYen <= 0) return 999;
  return Math.ceil((priceYen / monthlyValueYen) * 30);
}

function compactBuyerExportHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;
  try {
    const url = new URL(href, "https://local.invalid");
    const path = `${url.pathname}${url.hash}`;
    if (url.origin === "https://local.invalid") return path;
    return `${url.origin}${path}`;
  } catch {
    return href.split("?")[0] || href;
  }
}

function compactBuyerWorkspaceExportHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;
  try {
    const url = new URL(href, "https://local.invalid");
    const search = url.searchParams.has("workspace") ? url.search : "";
    const path = `${url.pathname}${search}${url.hash}`;
    if (url.origin === "https://local.invalid") return path;
    return `${url.origin}${path}`;
  } catch {
    return href.split("?")[0] || href;
  }
}

function buildBuyerCommercialOfferMarkdown(snapshot: Omit<BuyerCommercialOfferSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer commercial offer snapshot",
    "",
    `Readiness: ${snapshot.readiness}`,
    `Buyer: ${snapshot.buyer}`,
    `Recommended tier: ${snapshot.recommendedTier}`,
    `First commitment: ${yen(snapshot.firstCommitmentYen)}`,
    `Expected monthly value: ${yen(snapshot.expectedMonthlyValueYen)}`,
    `Value coverage: ${snapshot.valueCoveragePercent}%`,
    `Payback: ${snapshot.paybackDays} days`,
    `First action: ${snapshot.firstAction.label} (${compactBuyerExportHref(snapshot.firstAction.href)})`,
    "",
    snapshot.hardTruth,
    "",
    "## Offer terms",
    ...snapshot.terms.map((term) => `- [${term.status}] ${term.label}: ${term.value}. ${term.detail}`),
    "",
    "## Commercial guardrails",
    ...snapshot.guardrails.map((guardrail) => `- [${guardrail.status}] ${guardrail.label} (${guardrail.owner}): ${guardrail.rule} Evidence: ${guardrail.evidence}`),
    "",
    "## Buyer questions",
    ...snapshot.buyerQuestions.map((question) => `- ${question.question} ${question.answer} Evidence: ${question.evidence}`)
  ].join("\n");
}

export function buildBuyerCommercialOfferSnapshot({
  buyerScenario,
  measuredRunSummary,
  publicDecisionPath,
  sponsorAsk,
  operatingSnapshot,
  trustSnapshot,
  valueReportHref,
  deliveryMemoHref,
  trustManifestHref,
  commercialOfferHref = "#commercial-offer",
  launchRoomHref
}: {
  buyerScenario: BuyerValueScenario;
  measuredRunSummary: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>;
  publicDecisionPath: BuyerPublicDecisionPath;
  sponsorAsk: BuyerSponsorAskSnapshot;
  operatingSnapshot: BuyerOperatingPlanSnapshot;
  trustSnapshot: BuyerTrustSnapshot;
  valueReportHref: string;
  deliveryMemoHref: string;
  trustManifestHref: string;
  commercialOfferHref?: string;
  launchRoomHref: string;
}): BuyerCommercialOfferSnapshot {
  const measuredValue = measuredRunSummary.measuredMonthlyValueYen;
  const expectedMonthlyValueYen = Math.max(measuredValue, operatingSnapshot.riskAdjustedMonthlyValueYen, Math.round(buyerScenario.monthlyGrossValueYen * 0.55));
  const proofStatuses = [publicDecisionPath.status, sponsorAsk.status, operatingSnapshot.status, trustSnapshot.status];
  const readiness = commercialOfferReadinessFrom(proofStatuses);
  const status = commercialOfferStatusFrom(readiness);
  const openCount = proofStatuses.filter((proofStatus) => proofStatus !== "ready").length;
  const candidateCommitment = roundCommercialYen(Math.max(measuredValue * 0.32, operatingSnapshot.riskAdjustedMonthlyValueYen * 0.28));
  const firstCommitmentYen =
    readiness === "blocked" || sponsorAsk.recommendedAskYen <= 0 ? 0 : Math.max(1000, Math.min(sponsorAsk.recommendedAskYen, candidateCommitment));
  const paybackDays = commercialPaybackDays(firstCommitmentYen, expectedMonthlyValueYen);
  const valueCoveragePercent = firstCommitmentYen > 0 ? Math.round((expectedMonthlyValueYen / firstCommitmentYen) * 100) : 0;
  const tier = readiness === "offer-ready" ? "Proof pilot" : readiness === "needs-approval" ? "Proof pilot, owner review" : "No external offer";
  const guardrails: BuyerCommercialOfferGuardrail[] = [
    {
      id: "budget-cap",
      label: "Budget cap",
      status: firstCommitmentYen > 0 && firstCommitmentYen <= sponsorAsk.recommendedAskYen ? sponsorAsk.status : "blocked",
      owner: sponsorAsk.decisionOwner,
      evidence:
        firstCommitmentYen > 0
          ? `${yen(firstCommitmentYen)} first commitment against ${yen(sponsorAsk.recommendedAskYen)} sponsor cap.`
          : "No external price can be shown while sponsor value proof is blocked.",
      rule: "The first offer must stay under the sponsor ask and expand only after measured value is accepted.",
      href: valueReportHref
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: publicDecisionPath.status,
      owner: "Cloud Run SRE",
      evidence: publicDecisionPath.headline,
      rule: "Do not send commercial terms without the public decision path attached.",
      href: publicDecisionPath.firstAction.href
    },
    {
      id: "trust-gate",
      label: "Trust gate",
      status: trustSnapshot.status,
      owner: "Security reviewer",
      evidence: `${trustSnapshot.trustScore}/100 trust score; ${trustSnapshot.dataBoundary}.`,
      rule: "Commercial expansion waits for data boundary, proof, audit trail, and stop rules to be reviewable.",
      href: trustManifestHref
    },
    {
      id: "operating-gate",
      label: "Operating gate",
      status: operatingSnapshot.status,
      owner: operatingSnapshot.commitments[0]?.owner ?? sponsorAsk.decisionOwner,
      evidence: `${operatingSnapshot.readiness}; ${yen(operatingSnapshot.riskAdjustedMonthlyValueYen)} risk-adjusted monthly value.`,
      rule: "The buyer only expands when the 30-day owner path and expansion criteria are explicit.",
      href: operatingSnapshot.firstAction.href
    }
  ];
  const firstOpen = guardrails.find((guardrail) => guardrail.status === "blocked") ?? guardrails.find((guardrail) => guardrail.status === "attention");
  const firstAction = firstOpen
    ? {
        id: "primary" as const,
        label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
        href: firstOpen.href,
        external: chainHrefIsExternal(firstOpen.href)
      }
    : {
        id: "primary" as const,
        label: "Open commercial offer",
        href: commercialOfferHref,
        external: chainHrefIsExternal(commercialOfferHref)
      };
  const terms: BuyerCommercialOfferTerm[] = [
    {
      id: "scope",
      label: "Scope",
      value: tier,
      detail: "One workflow, one sponsor, public proof packet, trust snapshot, operating path, and stop decision.",
      status,
      href: commercialOfferHref
    },
    {
      id: "term",
      label: "Term",
      value: readiness === "blocked" ? "Internal only" : "14 days",
      detail: firstCommitmentYen > 0 ? `${yen(firstCommitmentYen)} first commitment, capped by sponsor proof.` : "Hold pricing until proof and trust blockers close.",
      status,
      href: valueReportHref
    },
    {
      id: "acceptance",
      label: "Acceptance",
      value: measuredRunSummary.readiness,
      detail: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run, ${measuredRunSummary.acceptanceRatePercent}% accepted, ${yen(measuredValue)} measured monthly value.`,
      status: measuredRunChainStatus(measuredRunSummary.readiness),
      href: deliveryMemoHref
    },
    {
      id: "renewal",
      label: "Renewal",
      value: operatingSnapshot.readiness,
      detail: operatingSnapshot.expansionCriteria[0] ?? "Renew only when measured value and stop rules remain healthy.",
      status: operatingSnapshot.status,
      href: launchRoomHref
    }
  ];
  const partial: Omit<BuyerCommercialOfferSnapshot, "copyText" | "exportMarkdown"> = {
    readiness,
    status,
    headline: commercialOfferHeadlineFor(readiness),
    hardTruth:
      readiness === "offer-ready"
        ? "A buyer can see the price, scope, acceptance gate, trust controls, operating owner, and stop rule before the first commitment."
        : readiness === "needs-approval"
          ? `${openCount} commercial item${openCount === 1 ? "" : "s"} need owner review before this offer leaves the workspace.`
          : `${openCount} commercial blocker${openCount === 1 ? "" : "s"} would make the price look detached from proof.`,
    buyer: operatingSnapshot.buyer,
    recommendedTier: tier,
    firstCommitmentYen,
    expectedMonthlyValueYen,
    valueCoveragePercent,
    paybackDays,
    contractLine:
      firstCommitmentYen > 0
        ? `${tier}: ${yen(firstCommitmentYen)} for 14 days, with expansion tied to measured value and trust controls.`
        : "No external commercial offer until budget, proof, trust, and operating guardrails are repaired.",
    firstAction,
    terms,
    guardrails,
    buyerQuestions: [
      {
        question: "What are we buying first?",
        answer: terms[0]?.detail ?? "A bounded proof pilot with public evidence and a stop decision.",
        evidence: publicDecisionPath.buyerLine
      },
      {
        question: "Why is this price defensible?",
        answer:
          firstCommitmentYen > 0
            ? `${yen(firstCommitmentYen)} is covered by ${valueCoveragePercent}% of risk-adjusted or measured monthly value.`
            : "No price is shown until the value and proof gates are repaired.",
        evidence: `${yen(expectedMonthlyValueYen)} expected monthly value; sponsor cap ${yen(sponsorAsk.recommendedAskYen)}.`
      },
      {
        question: "What prevents over-expansion?",
        answer: "Expansion waits for public proof, trust controls, operating owner commitment, and day-30 renewal criteria.",
        evidence: operatingSnapshot.expansionCriteria.join(" ")
      }
    ]
  };
  const exportMarkdown = buildBuyerCommercialOfferMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function activationSnapshotStatusFrom(steps: Array<{ status: BuyerProofChainStatus }>): BuyerProofChainStatus {
  if (steps.some((step) => step.status === "blocked")) return "blocked";
  if (steps.some((step) => step.status === "attention")) return "attention";
  return "ready";
}

function activationHeadlineFor(readiness: BuyerPilotCommand["readiness"]) {
  if (readiness === "buyer-ready") return "Monday pilot handoff is ready";
  if (readiness === "needs-proof") return "Close the next proof task before handoff";
  if (readiness === "needs-work-order") return "Turn the work order into a handoff first";
  return "Make the value case credible before handoff";
}

function buildBuyerActivationMarkdown(snapshot: Omit<BuyerActivationSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer activation command",
    "",
    `Readiness: ${snapshot.readiness}`,
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Proof closure: ${snapshot.proofClosure}`,
    `Current owner: ${snapshot.currentOwner}`,
    `Current artifact: ${snapshot.currentArtifact}`,
    `First action: ${snapshot.firstAction.label} (${compactBuyerExportHref(snapshot.firstAction.href)})`,
    `Review action: ${snapshot.reviewAction.label} (${compactBuyerExportHref(snapshot.reviewAction.href)})`,
    "",
    snapshot.hardTruth,
    "",
    "## Activation steps",
    ...snapshot.steps.map(
      (step) =>
        `- [${step.status}] ${step.label} (${step.owner}): ${step.action} Acceptance: ${step.acceptanceSignal} Proof to attach: ${step.proofToAttach} Edit: ${compactBuyerExportHref(step.editHref)} Review: ${compactBuyerExportHref(step.href)}`
    ),
    "",
    "## Handoff commitments",
    ...snapshot.commitments.map((commitment) => `- ${commitment}`)
  ].join("\n");
}

export function buildBuyerActivationSnapshot({
  command,
  launchRoomHref
}: {
  command: BuyerPilotCommand;
  launchRoomHref: string;
}): BuyerActivationSnapshot {
  const fallbackStep = command.steps.find((step) => step.isCurrent) ?? command.steps[0];
  const steps: BuyerActivationSnapshotStep[] =
    command.gapQueue.length > 0
      ? command.gapQueue.map((gap) => ({
          id: gap.id,
          label: gap.label,
          status: gap.status,
          owner: gap.owner,
          action: gap.action,
          acceptanceSignal: gap.acceptanceSignal,
          proofToAttach: gap.proofToAttach,
          href: gap.href,
          editHref: gap.editHref,
          isCurrent: gap.isCurrent
        }))
      : fallbackStep
        ? [
            {
              id: `activation-${fallbackStep.id}`,
              label: fallbackStep.label,
              status: fallbackStep.status,
              owner: fallbackStep.owner,
              action: fallbackStep.summary,
              acceptanceSignal: fallbackStep.summary,
              proofToAttach: "Keep the reviewed artifact attached to the launch room.",
              href: fallbackStep.href,
              editHref: fallbackStep.editHref,
              isCurrent: true
            }
          ]
        : [];
  const status = activationSnapshotStatusFrom(steps);
  const current = steps.find((step) => step.isCurrent) ?? steps[0];
  const currentOwner = current?.owner ?? command.nextGap.owner;
  const currentArtifact = current?.label ?? command.nextGap.label;
  const firstAction =
    command.readiness === "buyer-ready"
      ? {
          id: "primary" as const,
          label: "Open launch room",
          href: launchRoomHref,
          external: chainHrefIsExternal(launchRoomHref)
        }
      : {
          id: "primary" as const,
          label: `Fix ${currentArtifact}`,
          href: current?.editHref ?? command.nextGap.editHref,
          external: chainHrefIsExternal(current?.editHref ?? command.nextGap.editHref)
        };
  const partial: Omit<BuyerActivationSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    readiness: command.readiness,
    headline: activationHeadlineFor(command.readiness),
    hardTruth:
      command.readiness === "buyer-ready"
        ? "The buyer can open one room and see the owner, artifact, acceptance signal, and proof trail needed to start the first pilot review."
        : `${currentOwner} must close ${currentArtifact} before this becomes a credible buyer handoff.`,
    buyer: command.targetBuyer,
    proofClosure: command.proofClosure,
    currentOwner,
    currentArtifact,
    firstAction,
    reviewAction: {
      id: "launch-room",
      label: "Review launch room",
      href: launchRoomHref,
      external: chainHrefIsExternal(launchRoomHref)
    },
    steps,
    commitments: [
      `${currentOwner} owns the current activation artifact before buyer handoff.`,
      `${command.proofClosure} stays visible in the launch room before anyone requests sponsor approval.`,
      "The launch room remains the source of truth for continue, revise, or stop."
    ]
  };
  const exportMarkdown = buildBuyerActivationMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function globalAuditStatusToChain(status: GlobalLaunchAuditStatus): BuyerProofChainStatus {
  if (status === "pass") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

function globalLiftActionStatus(
  action: GlobalLaunchAudit["liftPlan"]["actions"][number],
  dimensions: GlobalLaunchAudit["dimensions"],
  fallback: BuyerProofChainStatus
): BuyerProofChainStatus {
  const dimension = dimensions.find((candidate) => candidate.id === action.dimensionId);
  return dimension ? globalAuditStatusToChain(dimension.status) : fallback;
}

function globalLaunchSnapshotStatus(audit: GlobalLaunchAudit): BuyerProofChainStatus {
  if (audit.readiness === "global-ready") return "ready";
  if (audit.readiness === "not-ready" || audit.dimensions.some((dimension) => dimension.status === "block")) return "blocked";
  return "attention";
}

function buildBuyerGlobalLaunchMarkdown(snapshot: Omit<BuyerGlobalLaunchSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Global launch readiness",
    "",
    `Readiness: ${snapshot.readiness}`,
    `Status: ${snapshot.status}`,
    `Global score: ${snapshot.score}/100`,
    `Target market: ${snapshot.targetMarket}`,
    `First action: ${snapshot.firstAction.label} (${compactBuyerExportHref(snapshot.firstAction.href)})`,
    `Review action: ${snapshot.reviewAction.label} (${compactBuyerExportHref(snapshot.reviewAction.href)})`,
    "",
    snapshot.hardTruth,
    "",
    "## Global readiness dimensions",
    ...snapshot.dimensions.map((dimension) => `- [${dimension.status}] ${dimension.label} (${dimension.score}/100): ${dimension.evidence} Action: ${dimension.action}`),
    "",
    "## Release lift",
    `Target score: ${snapshot.releaseLift.targetScore}/100`,
    `Score gap: ${snapshot.releaseLift.scoreGap}`,
    `Projected after first fix: ${snapshot.releaseLift.projectedScoreAfterFirstFix}/100`,
    snapshot.releaseLift.summary,
    ...snapshot.releaseLift.actions.map(
      (action) => `- [${action.status}/${action.priority}] ${action.label}: +${action.scoreLift} to ${action.projectedScore}/100. Proof: ${action.proofRequired}`
    ),
    "",
    "## Public proof links",
    ...snapshot.proofLinks.map((link) => `- [${link.status}] ${link.label}: ${link.value ? compactBuyerExportHref(link.value) : "missing"}`),
    "",
    "## Launch proof summary",
    `- Proof: ${snapshot.proofSummary}`,
    `- Ops: ${snapshot.opsSummary}`
  ].join("\n");
}

export function buildBuyerGlobalLaunchSnapshot({
  audit,
  publicAuditHref,
  launchRoomHref
}: {
  audit: GlobalLaunchAudit;
  publicAuditHref: string;
  launchRoomHref: string;
}): BuyerGlobalLaunchSnapshot {
  const status = globalLaunchSnapshotStatus(audit);
  const firstOpen = audit.actions[0];
  const firstAction =
    status === "ready"
      ? {
          id: "primary" as const,
          label: "Open global audit",
          href: publicAuditHref,
          external: chainHrefIsExternal(publicAuditHref)
        }
      : {
          id: "primary" as const,
          label: firstOpen ? `${firstOpen.priority === "now" ? "Fix" : "Review"} ${firstOpen.label}` : "Review global launch",
          href: firstOpen?.href ?? publicAuditHref,
          external: chainHrefIsExternal(firstOpen?.href ?? publicAuditHref)
        };
  const partial: Omit<BuyerGlobalLaunchSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    readiness: audit.readiness,
    score: audit.score,
    headline: audit.headline,
    hardTruth: audit.hardTruth,
    targetMarket: audit.targetMarket,
    proofSummary: audit.proofSummary,
    opsSummary: audit.opsSummary,
    firstAction,
    reviewAction: {
      id: "launch-room",
      label: "Review launch room",
      href: launchRoomHref,
      external: chainHrefIsExternal(launchRoomHref)
    },
    dimensions: audit.dimensions.map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      status: globalAuditStatusToChain(dimension.status),
      score: dimension.score,
      evidence: dimension.evidence,
      action: dimension.action,
      href: dimension.href
    })),
    releaseLift: {
      targetScore: audit.liftPlan.targetScore,
      scoreGap: audit.liftPlan.scoreGap,
      projectedScoreAfterFirstFix: audit.liftPlan.projectedScoreAfterFirstFix,
      summary: audit.liftPlan.summary,
      actions: audit.liftPlan.actions.map((action) => ({
        id: action.id,
        priority: action.priority,
        label: action.label,
        status: globalLiftActionStatus(action, audit.dimensions, status),
        scoreLift: action.scoreLift,
        projectedScore: action.projectedScore,
        proofRequired: action.proofRequired,
        decisionImpact: action.decisionImpact,
        href: action.href
      }))
    },
    proofLinks: audit.proofLinks.map((link) => ({
      id: link.id,
      label: link.label,
      value: link.value,
      status: globalAuditStatusToChain(link.status),
      href: link.href
    }))
  };
  const exportMarkdown = buildBuyerGlobalLaunchMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function publishabilityDecisionFrom(status: BuyerProofChainStatus): HomepagePublishabilitySnapshot["decision"] {
  if (status === "ready") return "publish-ready";
  if (status === "attention") return "review-first";
  return "do-not-publish";
}

function publishabilityDimensionById(globalLaunch: BuyerGlobalLaunchSnapshot, id: BuyerGlobalLaunchSnapshotDimension["id"]) {
  return globalLaunch.dimensions.find((dimension) => dimension.id === id);
}

function buildHomepagePublishabilityValueRoute(globalLaunch: BuyerGlobalLaunchSnapshot): HomepagePublishabilityValueRouteStep[] {
  const value = publishabilityDimensionById(globalLaunch, "buyer-value");
  const measured = publishabilityDimensionById(globalLaunch, "measured-outcome");
  const publicProof = publishabilityDimensionById(globalLaunch, "live-surface") ?? publishabilityDimensionById(globalLaunch, "proof-depth");
  const decisionStatus = globalLaunch.status;
  const decisionEvidence =
    decisionStatus === "ready"
      ? `${globalLaunch.targetMarket} can inspect the launch room and decide without a private walkthrough.`
      : decisionStatus === "attention"
        ? `${globalLaunch.targetMarket} needs sponsor review before broad public traffic.`
        : `${globalLaunch.targetMarket} should not receive a public launch until the first blocker closes.`;

  return [
    {
      id: "buyer-value",
      label: "Value",
      status: value?.status ?? "blocked",
      title: value ? `${value.score}/100 ${value.label}` : "Buyer value is not proved yet",
      evidence: value?.evidence ?? "Quantify who benefits, how much time or money changes, and why the workflow matters now.",
      href: value?.href ?? "#buyer-value-simulator"
    },
    {
      id: "measured-proof",
      label: "Measured proof",
      status: measured?.status ?? "blocked",
      title: measured ? `${measured.score}/100 ${measured.label}` : "Measured proof is missing",
      evidence: measured?.evidence ?? "Attach an observed run with reviewer acceptance and a public receipt.",
      href: measured?.href ?? "#pilot-run-receipt"
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: publicProof?.status ?? globalLaunch.status,
      title: publicProof ? `${publicProof.score}/100 ${publicProof.label}` : "Public proof needs inspection",
      evidence: publicProof?.evidence ?? globalLaunch.proofSummary,
      href: publicProof?.href ?? globalLaunch.firstAction.href
    },
    {
      id: "decision-path",
      label: "Decision",
      status: decisionStatus,
      title: globalLaunch.status === "ready" ? "Buyer decision path is inspectable" : globalLaunch.firstAction.label,
      evidence: decisionEvidence,
      href: globalLaunch.reviewAction.href
    }
  ];
}

function buildHomepagePublishabilityClaimLedger(globalLaunch: BuyerGlobalLaunchSnapshot): HomepagePublishabilityPublicClaim[] {
  const value = publishabilityDimensionById(globalLaunch, "buyer-value");
  const measured = publishabilityDimensionById(globalLaunch, "measured-outcome");
  const liveSurface = publishabilityDimensionById(globalLaunch, "live-surface");
  const proofDepth = publishabilityDimensionById(globalLaunch, "proof-depth");
  const productionOps = publishabilityDimensionById(globalLaunch, "production-ops");
  const trustOffer = publishabilityDimensionById(globalLaunch, "trust-offer");
  const publicProofStatuses = [liveSurface?.status, proofDepth?.status].filter((status): status is BuyerProofChainStatus => Boolean(status));
  const operatingStatuses = [productionOps?.status, trustOffer?.status].filter((status): status is BuyerProofChainStatus => Boolean(status));
  const publicProofStatus = worstProofChainStatus(publicProofStatuses.length > 0 ? publicProofStatuses : [globalLaunch.status]);
  const operatingStatus = worstProofChainStatus(operatingStatuses.length > 0 ? operatingStatuses : [globalLaunch.status]);
  const publicProofText = compactProofText(
    [liveSurface?.evidence, proofDepth?.evidence].filter(Boolean).join(" "),
    globalLaunch.proofSummary,
    180
  );
  const operatingProofText = compactProofText(
    [productionOps?.evidence, trustOffer?.evidence].filter(Boolean).join(" "),
    globalLaunch.opsSummary,
    180
  );

  return [
    {
      id: "value-claim",
      label: "Value claim",
      status: value?.status ?? "blocked",
      claim: "Economic value is defensible.",
      proof: value?.evidence ?? "Quantify buyer, value, payback, and downside before public launch.",
      buyerQuestion: "Why spend time now?",
      href: value?.href ?? "#buyer-value-simulator"
    },
    {
      id: "outcome-claim",
      label: "Outcome claim",
      status: measured?.status ?? "blocked",
      claim: "A measured run supports the outcome.",
      proof: measured?.evidence ?? "Attach reviewer, accepted task count, and receipt URL.",
      buyerQuestion: "Can I inspect a result?",
      href: measured?.href ?? "#pilot-run-receipt"
    },
    {
      id: "proof-claim",
      label: "Proof claim",
      status: publicProofStatus,
      claim: "The public proof path is inspectable.",
      proof: publicProofText,
      buyerQuestion: "Can I verify it myself?",
      href: liveSurface?.href ?? proofDepth?.href ?? globalLaunch.firstAction.href
    },
    {
      id: "operating-claim",
      label: "Operating claim",
      status: operatingStatus,
      claim: "Operating and trust guardrails are visible.",
      proof: operatingProofText,
      buyerQuestion: "Who owns limits and stop rules?",
      href: trustOffer?.href ?? productionOps?.href ?? globalLaunch.reviewAction.href
    }
  ];
}

function buildHomepagePublishabilityReviewerCover(globalLaunch: BuyerGlobalLaunchSnapshot, publishabilityHref: string): HomepagePublishabilityReviewerCover {
  const external = chainHrefIsExternal(publishabilityHref);
  if (globalLaunch.status === "ready") {
    return {
      status: "ready",
      label: "Review cover",
      headline: "10-minute review cover is ready",
      summary: "External reviewers can inspect value, measured proof, public surface, and decision path without a private walkthrough.",
      href: publishabilityHref,
      external
    };
  }
  if (globalLaunch.status === "attention") {
    return {
      status: "attention",
      label: "Sponsor cover",
      headline: "Sponsor review cover is required",
      summary: "Clear the warning in the cover before inviting broad public traffic.",
      href: publishabilityHref,
      external
    };
  }
  return {
    status: "blocked",
    label: "No-send cover",
    headline: "Open the no-send cover before sharing",
    summary: "The cover names the first proof blocker and keeps the workflow in hold until it closes.",
    href: publishabilityHref,
    external
  };
}

function buildHomepagePublishabilityMarkdown(snapshot: Omit<HomepagePublishabilitySnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Public release verdict",
    "",
    `Decision: ${snapshot.decision}`,
    `Status: ${snapshot.status}`,
    `Score: ${snapshot.score}/100`,
    `Ready gates: ${snapshot.readyCount}/${snapshot.gateTotal}`,
    `Blocked gates: ${snapshot.blockedCount}`,
    `First action: ${snapshot.primaryAction.label} (${compactBuyerExportHref(snapshot.primaryAction.href)})`,
    `Report: ${snapshot.reportAction.href}`,
    `Workflow intake: ${snapshot.workflowAction.label} (${compactBuyerExportHref(snapshot.workflowAction.href)})`,
    `Review cover: ${snapshot.reviewerCover.label} (${compactBuyerExportHref(snapshot.reviewerCover.href)})`,
    `Reviewer protocol: ${snapshot.reviewerCover.headline}. ${snapshot.reviewerCover.summary}`,
    "",
    snapshot.hardTruth,
    "",
    "## First-screen gates",
    ...snapshot.gates.map((gate) => `- [${gate.status}] ${gate.label} (${gate.score}/100): ${compactBuyerExportHref(gate.href)}`),
    "",
    "## Buyer value route",
    ...snapshot.valueRoute.map((step) => `- [${step.status}] ${step.label}: ${step.title}. ${step.evidence} (${compactBuyerExportHref(step.href)})`),
    "",
    "## Release lift",
    `Target score: ${snapshot.releaseLift.targetScore}/100`,
    `Score gap: ${snapshot.releaseLift.scoreGap}`,
    `Projected after first fix: ${snapshot.releaseLift.projectedScoreAfterFirstFix}/100`,
    snapshot.releaseLift.summary,
    ...snapshot.releaseLift.actions.map(
      (action) => `- [${action.status}/${action.priority}] ${action.label}: +${action.scoreLift} to ${action.projectedScore}/100. ${action.decisionImpact}`
    ),
    "",
    `Proof: ${snapshot.proofSummary}`
  ].join("\n");
}

export function buildHomepagePublishabilitySnapshot({
  globalLaunch,
  publishabilityHref,
  workflowIntakeHref = "#quick-workflow-intake"
}: {
  globalLaunch: BuyerGlobalLaunchSnapshot;
  publishabilityHref: string;
  workflowIntakeHref?: string;
}): HomepagePublishabilitySnapshot {
  const primaryAction = globalLaunch.status === "ready"
    ? {
        id: "primary" as const,
        label: "Open publishability report",
        href: publishabilityHref,
        external: chainHrefIsExternal(publishabilityHref)
      }
    : globalLaunch.firstAction;
  const gates = globalLaunch.dimensions.slice(0, 4).map((dimension) => ({
    id: dimension.id,
    label: dimension.label,
    status: dimension.status,
    score: dimension.score,
    href: dimension.href
  }));
  const reviewerCover = buildHomepagePublishabilityReviewerCover(globalLaunch, publishabilityHref);
  const workflowAction: BuyerProofChainAction = {
    id: "workflow-intake",
    label: "Paste workflow",
    href: workflowIntakeHref,
    external: chainHrefIsExternal(workflowIntakeHref)
  };
  const readyCount = globalLaunch.dimensions.filter((dimension) => dimension.status === "ready").length;
  const blockedCount = globalLaunch.dimensions.filter((dimension) => dimension.status === "blocked").length;
  const partial: Omit<HomepagePublishabilitySnapshot, "copyText" | "exportMarkdown"> = {
    status: globalLaunch.status,
    decision: publishabilityDecisionFrom(globalLaunch.status),
    score: globalLaunch.score,
    headline:
      globalLaunch.status === "ready"
        ? "Global public release is ready to inspect"
        : globalLaunch.status === "attention"
          ? "Review the public release before broad traffic"
          : "Do not publish until the first proof blocker closes",
    hardTruth: globalLaunch.hardTruth,
    proofSummary: globalLaunch.proofSummary,
    primaryAction,
    reportAction: {
      id: "primary",
      label: "Open publishability report",
      href: publishabilityHref,
      external: chainHrefIsExternal(publishabilityHref)
    },
    workflowAction,
    reviewerCover,
    readyCount,
    blockedCount,
    gateTotal: globalLaunch.dimensions.length,
    gates,
    valueRoute: buildHomepagePublishabilityValueRoute(globalLaunch),
    publicClaimLedger: buildHomepagePublishabilityClaimLedger(globalLaunch),
    releaseLift: globalLaunch.releaseLift
  };
  const exportMarkdown = buildHomepagePublishabilityMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

export type HomepageProofEntryStatus = HomepageRouteLock["status"];

export type HomepageProofEntryAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageDecisionHandoffChoice = "continue" | "revise" | "stop";

export type HomepageDecisionHandoffLink = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageDecisionHandoff = {
  status: HomepageProofEntryStatus;
  recommendedDecision: HomepageDecisionHandoffChoice;
  headline: string;
  guardrail: string;
  reviewKit: HomepageDecisionHandoffLink;
  decisionReceipt: HomepageDecisionHandoffLink;
  acceptancePath: HomepageDecisionHandoffLink;
};

export type HomepageProofEntryItem = {
  id: "buyer-decision" | "value-proof" | "public-proof" | "handoff";
  label: string;
  status: HomepageProofEntryStatus;
  title: string;
  evidence: string;
  href: string;
  actionLabel: string;
};

export type HomepageProofOwnerPacket = {
  status: HomepageProofEntryStatus;
  title: string;
  owner: string;
  due: string;
  command: string;
  proofToAttach: string;
  verificationLabel: string;
  verificationHref: string;
  shareRule: string;
  acceptanceCriteria: string[];
  exportMarkdown: string;
  href: string;
};

export type HomepageProofNextMove = {
  id: HomepageProofEntryItem["id"] | "send-route";
  status: HomepageProofEntryStatus;
  label: string;
  headline: string;
  owner: string;
  command: string;
  buyerImpact: string;
  action: HomepageProofEntryAction;
  acceptanceCriteria: string[];
  impact: {
    currentScore: number;
    projectedScore: number;
    scoreDelta: number;
    currentReadyCount: number;
    projectedReadyCount: number;
    readyDelta: number;
    label: string;
  };
  ownerPacket: HomepageProofOwnerPacket;
  exportMarkdown: string;
};

export type HomepageProofEntrySnapshot = {
  status: HomepageProofEntryStatus;
  headline: string;
  summary: string;
  buyer: string;
  proofScore: number;
  readyCount: number;
  blockedCount: number;
  primaryAction: HomepageProofEntryAction;
  secondaryAction: HomepageProofEntryAction;
  items: HomepageProofEntryItem[];
  nextMove: HomepageProofNextMove;
  decisionHandoff: HomepageDecisionHandoff;
  exportMarkdown: string;
};

export type HomepageHeroProofRouteItem = {
  id: "value-proof" | "public-proof" | "handoff";
  label: string;
  status: HomepageProofEntryStatus;
  title: string;
  evidence: string;
  href: string;
};

export type HomepageHeroProofRouteSnapshot = {
  status: HomepageProofEntryStatus;
  headline: string;
  summary: string;
  buyer: string;
  scoreLine: string;
  primaryAction: HomepageProofEntryAction;
  decisionHandoff: HomepageDecisionHandoff;
  items: HomepageHeroProofRouteItem[];
  exportMarkdown: string;
};

function homepageProofEntryHeadline(status: HomepageProofEntryStatus) {
  if (status === "ready") return "Buyer proof room is ready to inspect";
  if (status === "attention") return "Buyer proof room needs sponsor review";
  return "First buyer blocker is visible before send";
}

function homepageProofEntrySummary(status: HomepageProofEntryStatus) {
  if (status === "ready") {
    return "The first screen shows who buys, what value changed, how proof opens, and where the decision is recorded.";
  }
  if (status === "attention") {
    return "The room is close enough to review, with the warning named before public traffic or buyer sharing.";
  }
  return "The room names the blocker and keeps the send path internal until value, proof, or handoff is fixed.";
}

function homepageProofEntryAction(action: { label: string; href: string; external?: boolean }): HomepageProofEntryAction {
  return {
    label: action.label,
    href: action.href,
    external: action.external ?? chainHrefIsExternal(action.href)
  };
}

function homepageDecisionLink(label: string, href: string): HomepageDecisionHandoffLink {
  return {
    label,
    href,
    external: chainHrefIsExternal(href)
  };
}

function homepageDecisionHandoffHeadline(decision: HomepageDecisionHandoffChoice) {
  if (decision === "continue") return "Continue can be recorded with proof attached";
  if (decision === "revise") return "Revise should be recorded before buyer delivery";
  return "Stop should be recorded while proof is blocked";
}

function homepageDecisionHandoffGuardrail(input: { decision: HomepageDecisionHandoffChoice; nextMove: HomepageProofNextMove; buyer: string }) {
  if (input.decision === "continue") return `Send only after ${input.buyer} can open the review kit, receipt, and acceptance path.`;
  if (input.decision === "revise") return `Keep ${input.buyer} in sponsor review until ${input.nextMove.headline.toLowerCase()}.`;
  return `Keep the buyer room internal and issue a stop receipt until ${input.nextMove.headline.toLowerCase()}.`;
}

function buildHomepageDecisionHandoff(input: {
  status: HomepageProofEntryStatus;
  buyer: string;
  routeLock: HomepageRouteLock;
  nextMove: HomepageProofNextMove;
  reviewKitHref?: string;
  decisionReceiptHref?: string;
  acceptancePathHref?: string;
}): HomepageDecisionHandoff {
  const recommendedDecision = decisionReceiptChoiceFor(input.routeLock.verdict);
  const fallbackDecisionReceiptHref =
    input.routeLock.handoffPacket.items.find((item) => item.id === "decision-receipt")?.href ?? input.routeLock.handoffPacket.primaryAction.href;
  return {
    status: input.status,
    recommendedDecision,
    headline: homepageDecisionHandoffHeadline(recommendedDecision),
    guardrail: homepageDecisionHandoffGuardrail({ decision: recommendedDecision, nextMove: input.nextMove, buyer: input.buyer }),
    reviewKit: homepageDecisionLink("Review kit", input.reviewKitHref ?? input.routeLock.handoffPacket.primaryAction.href),
    decisionReceipt: homepageDecisionLink(`Decision: ${recommendedDecision}`, input.decisionReceiptHref ?? fallbackDecisionReceiptHref),
    acceptancePath: homepageDecisionLink("Acceptance path", input.acceptancePathHref ?? input.routeLock.handoffPacket.secondaryAction.href)
  };
}

function homepageProofNextMoveOwner(id: HomepageProofNextMove["id"]) {
  if (id === "public-proof") return "Proof owner";
  if (id === "value-proof") return "Finance owner";
  if (id === "buyer-decision") return "Buyer room owner";
  if (id === "handoff") return "Pilot operator";
  return "Pilot owner";
}

function homepageProofNextMoveCriteria(id: HomepageProofNextMove["id"]) {
  if (id === "public-proof") {
    return ["Required public proof links open without private credentials.", "Live proof audit can be refreshed inside the current review window."];
  }
  if (id === "value-proof") {
    return ["Modeled value and measured run evidence use the same buyer workflow.", "A reviewer can trace the value claim to a receipt or source artifact."];
  }
  if (id === "buyer-decision") {
    return ["The launch room states the continue, revise, or stop question.", "The buyer can see value, proof, and decision receipt from one path."];
  }
  if (id === "handoff") {
    return ["Day 0 owner, Day 30 rule, and stop condition are attached.", "The handoff packet can be sent with the launch room without extra explanation."];
  }
  return ["Value proof, public proof, and handoff links open from the first screen.", "The buyer can make a continue, revise, or stop decision from the room."];
}

function homepageProofOwnerPacketDue(status: HomepageProofEntryStatus) {
  if (status === "ready") return "Before buyer review";
  if (status === "attention") return "Before sponsor review";
  return "Before external send";
}

function homepageProofOwnerPacketProof(id: HomepageProofNextMove["id"]) {
  if (id === "public-proof") return "Public product URL, ProtoPedia story, walkthrough video, live proof audit, and repair-check receipt.";
  if (id === "value-proof") return "Value model, measured run receipt, work order evidence, and reviewer note.";
  if (id === "buyer-decision") return "Launch room, review kit, decision receipt, acceptance path, and buyer question.";
  if (id === "handoff") return "Day 0 owner, Day 30 rule, follow-up ledger, stop condition, and operating owner.";
  return "Review kit, decision receipt, acceptance path, publishability report, and receipt verifier handoff.";
}

function homepageProofOwnerPacketShareRule(status: HomepageProofEntryStatus) {
  if (status === "ready") return "Send only with the review kit, decision receipt, acceptance path, and verifier links attached.";
  if (status === "attention") return "Keep in sponsor review until the owner packet is accepted or re-exported.";
  return "No buyer send until this owner packet is checked, proof is re-exported, and the receipt verifier accepts the replay.";
}

function buildHomepageProofOwnerPacket(input: {
  id: HomepageProofNextMove["id"];
  status: HomepageProofEntryStatus;
  buyer: string;
  headline: string;
  owner: string;
  command: string;
  action: HomepageProofEntryAction;
  acceptanceCriteria: string[];
  impact: HomepageProofNextMove["impact"];
}): HomepageProofOwnerPacket {
  const packet: Omit<HomepageProofOwnerPacket, "exportMarkdown" | "href"> = {
    status: input.status,
    title: `${input.owner} packet for ${input.buyer}`,
    owner: input.owner,
    due: homepageProofOwnerPacketDue(input.status),
    command: input.command,
    proofToAttach: homepageProofOwnerPacketProof(input.id),
    verificationLabel: "Open receipt verifier",
    verificationHref: "/receipt-verifier",
    shareRule: homepageProofOwnerPacketShareRule(input.status),
    acceptanceCriteria: input.acceptanceCriteria
  };
  const exportMarkdown = [
    "# Homepage proof owner packet",
    "",
    `Status: ${packet.status}`,
    `Buyer: ${input.buyer}`,
    `Owner: ${packet.owner}`,
    `Due: ${packet.due}`,
    `Action: ${input.action.label} (${compactBuyerWorkspaceExportHref(input.action.href)})`,
    `Verification: ${packet.verificationLabel} (${compactBuyerWorkspaceExportHref(packet.verificationHref)})`,
    `Estimated lift: ${input.impact.currentScore}/100 -> ${input.impact.projectedScore}/100 (${input.impact.scoreDelta >= 0 ? `+${input.impact.scoreDelta}` : input.impact.scoreDelta})`,
    "",
    input.headline,
    packet.command,
    "",
    "## Proof to attach",
    packet.proofToAttach,
    "",
    "## Share rule",
    packet.shareRule,
    "",
    "## Acceptance criteria",
    ...packet.acceptanceCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");

  return {
    ...packet,
    exportMarkdown,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function homepageProofMoveImpact(input: {
  target: HomepageProofEntryItem | undefined;
  items: HomepageProofEntryItem[];
  proofScore: number;
}): HomepageProofNextMove["impact"] {
  const currentReadyCount = input.items.filter((item) => item.status === "ready").length;
  if (!input.target) {
    return {
      currentScore: input.proofScore,
      projectedScore: input.proofScore,
      scoreDelta: 0,
      currentReadyCount,
      projectedReadyCount: currentReadyCount,
      readyDelta: 0,
      label: "No repair lift needed"
    };
  }

  const repairRoomCount = input.items.length + 2;
  const scoreDelta = Math.max(1, Math.round((100 - buyerProofStatusScore(input.target.status)) / repairRoomCount));
  const projectedScore = Math.min(100, input.proofScore + scoreDelta);
  const projectedReadyCount = Math.min(input.items.length, currentReadyCount + 1);
  return {
    currentScore: input.proofScore,
    projectedScore,
    scoreDelta: projectedScore - input.proofScore,
    currentReadyCount,
    projectedReadyCount,
    readyDelta: projectedReadyCount - currentReadyCount,
    label: `+${projectedScore - input.proofScore} proof points`
  };
}

function buildHomepageProofNextMove(input: {
  status: HomepageProofEntryStatus;
  buyer: string;
  proofScore: number;
  items: HomepageProofEntryItem[];
  primaryAction: HomepageProofEntryAction;
}): HomepageProofNextMove {
  const priority: HomepageProofEntryItem["id"][] = ["public-proof", "buyer-decision", "value-proof", "handoff"];
  const openItems = input.items.filter((item) => item.status !== "ready");
  const target = priority.map((id) => openItems.find((item) => item.id === id)).find((item): item is HomepageProofEntryItem => Boolean(item));
  const id = target?.id ?? "send-route";
  const status = target?.status ?? "ready";
  const label = target ? "Next proof move" : "Send route";
  const headline = target ? `Close ${target.label.toLowerCase()} before buyer sharing` : "Send the buyer room with proof attached";
  const owner = homepageProofNextMoveOwner(id);
  const action = target ? input.primaryAction : input.primaryAction;
  const command = target ? `${input.primaryAction.label}: ${target.title}` : `${input.primaryAction.label}: send value, proof, and handoff together.`;
  const buyerImpact = target
    ? `${input.buyer} cannot trust the room until ${target.label.toLowerCase()} is backed by evidence: ${target.evidence}`
    : `${input.buyer} can inspect value, public proof, and the handoff path without another walkthrough.`;
  const acceptanceCriteria = homepageProofNextMoveCriteria(id);
  const impact = homepageProofMoveImpact({ target, items: input.items, proofScore: input.proofScore });
  const ownerPacket = buildHomepageProofOwnerPacket({
    id,
    status,
    buyer: input.buyer,
    headline,
    owner,
    command,
    action,
    acceptanceCriteria,
    impact
  });
  const exportMarkdown = [
    "# Next proof move",
    "",
    `Status: ${status}`,
    `Target: ${label}`,
    `Buyer: ${input.buyer}`,
    `Owner: ${owner}`,
    `Action: ${action.label} (${compactBuyerWorkspaceExportHref(action.href)})`,
    `Estimated lift: ${impact.currentScore}/100 -> ${impact.projectedScore}/100 (${impact.scoreDelta >= 0 ? `+${impact.scoreDelta}` : impact.scoreDelta})`,
    `Ready rails: ${impact.currentReadyCount}/${input.items.length} -> ${impact.projectedReadyCount}/${input.items.length}`,
    "",
    headline,
    command,
    "",
    "## Buyer impact",
    buyerImpact,
    "",
    "## Acceptance criteria",
    ...acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Owner packet",
    `Due: ${ownerPacket.due}`,
    `Proof to attach: ${ownerPacket.proofToAttach}`,
    `Verification: ${ownerPacket.verificationLabel} (${compactBuyerWorkspaceExportHref(ownerPacket.verificationHref)})`,
    `Share rule: ${ownerPacket.shareRule}`
  ].join("\n");

  return {
    id,
    status,
    label,
    headline,
    owner,
    command,
    buyerImpact,
    action,
    acceptanceCriteria,
    impact,
    ownerPacket,
    exportMarkdown
  };
}

function homepageHeroRouteHeadline(status: HomepageProofEntryStatus) {
  if (status === "ready") return "First buyer route is send-ready";
  if (status === "attention") return "First buyer route needs owner review";
  return "First buyer route is held on proof";
}

function homepageHeroRouteSummary(snapshot: HomepageProofEntrySnapshot) {
  if (snapshot.status === "ready") {
    return `${snapshot.buyer} can inspect value, proof, and the handoff path from the first screen.`;
  }
  if (snapshot.status === "attention") {
    return `${snapshot.buyer} has a reviewable route, but the warning is named before external sharing.`;
  }
  return `${snapshot.buyer} should not receive the room until ${snapshot.primaryAction.label.toLowerCase()} closes.`;
}

function buildHomepageHeroProofRouteMarkdown(snapshot: Omit<HomepageHeroProofRouteSnapshot, "exportMarkdown">) {
  return [
    "# First buyer route",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Score: ${snapshot.scoreLine}`,
    `First action: ${snapshot.primaryAction.label} (${compactBuyerWorkspaceExportHref(snapshot.primaryAction.href)})`,
    `Decision handoff: ${snapshot.decisionHandoff.recommendedDecision}`,
    `Decision receipt: ${snapshot.decisionHandoff.decisionReceipt.label} (${compactBuyerWorkspaceExportHref(snapshot.decisionHandoff.decisionReceipt.href)})`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Route checks",
    ...snapshot.items.map((item) => `- [${item.status}] ${item.label}: ${item.title}. ${item.evidence} Link: ${compactBuyerWorkspaceExportHref(item.href)}`)
  ].join("\n");
}

export function buildHomepageHeroProofRouteSnapshot(snapshot: HomepageProofEntrySnapshot): HomepageHeroProofRouteSnapshot {
  const routeIds: HomepageHeroProofRouteItem["id"][] = ["value-proof", "public-proof", "handoff"];
  const items = routeIds.map((id) => {
    const item = snapshot.items.find((entry) => entry.id === id);
    return {
      id,
      label: item?.label ?? id,
      status: item?.status ?? snapshot.status,
      title: item?.title ?? "Buyer route check missing",
      evidence: item?.evidence ?? "Attach the buyer-facing evidence before sharing.",
      href: item?.href ?? snapshot.primaryAction.href
    };
  });
  const partial: Omit<HomepageHeroProofRouteSnapshot, "exportMarkdown"> = {
    status: snapshot.status,
    headline: homepageHeroRouteHeadline(snapshot.status),
    summary: homepageHeroRouteSummary(snapshot),
    buyer: snapshot.buyer,
    scoreLine: `${snapshot.proofScore}/100 proof / ${snapshot.readyCount}/${snapshot.items.length} ready`,
    primaryAction: snapshot.primaryAction,
    decisionHandoff: snapshot.decisionHandoff,
    items
  };

  return {
    ...partial,
    exportMarkdown: buildHomepageHeroProofRouteMarkdown(partial)
  };
}

function buildHomepageProofEntryMarkdown(snapshot: Omit<HomepageProofEntrySnapshot, "exportMarkdown">) {
  return [
    "# Homepage proof entry",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Proof score: ${snapshot.proofScore}/100`,
    `Ready rails: ${snapshot.readyCount}/${snapshot.items.length}`,
    `Blocked rails: ${snapshot.blockedCount}`,
    `First action: ${snapshot.primaryAction.label} (${compactBuyerWorkspaceExportHref(snapshot.primaryAction.href)})`,
    `Second action: ${snapshot.secondaryAction.label} (${compactBuyerWorkspaceExportHref(snapshot.secondaryAction.href)})`,
    `Decision handoff: ${snapshot.decisionHandoff.recommendedDecision}`,
    `Decision receipt: ${snapshot.decisionHandoff.decisionReceipt.label} (${compactBuyerWorkspaceExportHref(snapshot.decisionHandoff.decisionReceipt.href)})`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Next proof move",
    `Status: ${snapshot.nextMove.status}`,
    `Owner: ${snapshot.nextMove.owner}`,
    `Action: ${snapshot.nextMove.action.label} (${compactBuyerWorkspaceExportHref(snapshot.nextMove.action.href)})`,
    `Estimated lift: ${snapshot.nextMove.impact.currentScore}/100 -> ${snapshot.nextMove.impact.projectedScore}/100 (${snapshot.nextMove.impact.scoreDelta >= 0 ? `+${snapshot.nextMove.impact.scoreDelta}` : snapshot.nextMove.impact.scoreDelta})`,
    `Ready rails: ${snapshot.nextMove.impact.currentReadyCount}/${snapshot.items.length} -> ${snapshot.nextMove.impact.projectedReadyCount}/${snapshot.items.length}`,
    snapshot.nextMove.headline,
    snapshot.nextMove.command,
    `Buyer impact: ${snapshot.nextMove.buyerImpact}`,
    "Acceptance criteria:",
    ...snapshot.nextMove.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Decision handoff",
    snapshot.decisionHandoff.headline,
    snapshot.decisionHandoff.guardrail,
    `- ${snapshot.decisionHandoff.reviewKit.label}: ${compactBuyerWorkspaceExportHref(snapshot.decisionHandoff.reviewKit.href)}`,
    `- ${snapshot.decisionHandoff.decisionReceipt.label}: ${compactBuyerWorkspaceExportHref(snapshot.decisionHandoff.decisionReceipt.href)}`,
    `- ${snapshot.decisionHandoff.acceptancePath.label}: ${compactBuyerWorkspaceExportHref(snapshot.decisionHandoff.acceptancePath.href)}`,
    "",
    "## Proof rail",
    ...snapshot.items.map(
      (item) => `- [${item.status}] ${item.label}: ${item.title}. ${item.evidence} Action: ${item.actionLabel} (${compactBuyerWorkspaceExportHref(item.href)})`
    )
  ].join("\n");
}

export function buildHomepageProofEntrySnapshot({
  heroBrief,
  publishability,
  routeLock,
  proofRoomHref,
  reviewKitHref,
  decisionReceiptHref,
  acceptancePathHref
}: {
  heroBrief: HeroBuyerDecisionBrief;
  publishability: HomepagePublishabilitySnapshot;
  routeLock: HomepageRouteLock;
  proofRoomHref?: string;
  reviewKitHref?: string;
  decisionReceiptHref?: string;
  acceptancePathHref?: string;
}): HomepageProofEntrySnapshot {
  const valueMetric = heroBrief.metrics.find((metric) => metric.id === "value");
  const valueQuestion = heroBrief.buyerQuestions.find((question) => question.id === "value-case");
  const publicRoute = publishability.valueRoute.find((step) => step.id === "public-proof");
  const status = worstProofChainStatus([heroBrief.status, publishability.status, routeLock.status]);
  const proofScore = Math.round((heroBrief.score + publishability.score + routeLock.score) / 3);
  const items: HomepageProofEntryItem[] = [
    {
      id: "buyer-decision",
      label: "Buyer decision",
      status: heroBrief.status,
      title: `${heroBrief.decisionLabel} / ${heroBrief.score}`,
      evidence: `${heroBrief.buyer}: ${heroBrief.evidence}`,
      href: heroBrief.primaryAction.href,
      actionLabel: heroBrief.primaryAction.label
    },
    {
      id: "value-proof",
      label: "Value proof",
      status: valueQuestion?.status ?? heroBrief.status,
      title: valueMetric?.value ?? "Value proof needs review",
      evidence: valueQuestion?.evidence ?? valueMetric?.detail ?? "Quantified buyer value is required before external sharing.",
      href: valueQuestion?.href ?? heroBrief.primaryAction.href,
      actionLabel: valueQuestion?.status === "ready" ? "Review value proof" : "Fix value proof"
    },
    {
      id: "public-proof",
      label: "Public proof",
      status: publicRoute?.status ?? publishability.status,
      title: publicRoute?.title ?? publishability.proofSummary,
      evidence: publicRoute?.evidence ?? publishability.hardTruth,
      href: publicRoute?.href ?? publishability.primaryAction.href,
      actionLabel: publicRoute?.status === "ready" ? "Inspect public proof" : "Fix public proof"
    },
    {
      id: "handoff",
      label: "Handoff",
      status: routeLock.status,
      title: routeLock.handoffPacket.title,
      evidence: routeLock.handoffPacket.summary,
      href: routeLock.handoffPacket.primaryAction.href,
      actionLabel: routeLock.handoffPacket.primaryAction.label
    }
  ];
  const primaryAction = homepageProofEntryAction(
    proofRoomHref
      ? {
          label: status === "ready" ? "Open proof room" : "Open repair plan",
          href: proofRoomHref
        }
      : routeLock.primaryAction
  );
  const secondaryAction = homepageProofEntryAction(publishability.reportAction);
  const nextMove = buildHomepageProofNextMove({
    status,
    buyer: heroBrief.buyer,
    proofScore,
    items,
    primaryAction
  });
  const decisionHandoff = buildHomepageDecisionHandoff({
    status,
    buyer: heroBrief.buyer,
    routeLock,
    nextMove,
    reviewKitHref,
    decisionReceiptHref,
    acceptancePathHref
  });
  const partial: Omit<HomepageProofEntrySnapshot, "exportMarkdown"> = {
    status,
    headline: homepageProofEntryHeadline(status),
    summary: homepageProofEntrySummary(status),
    buyer: heroBrief.buyer,
    proofScore,
    readyCount: items.filter((item) => item.status === "ready").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    primaryAction,
    secondaryAction,
    items,
    nextMove,
    decisionHandoff
  };

  return {
    ...partial,
    exportMarkdown: buildHomepageProofEntryMarkdown(partial)
  };
}

export type HomepageOutcomeArtifactStatus = BuyerProofChainStatus;

export type HomepageOutcomeArtifactMetric = {
  id: string;
  label: string;
  status: HomepageOutcomeArtifactStatus;
  value: string;
  evidence: string;
};

export type HomepageOutcomeArtifactPacketItem = {
  id: "buyer-one-pager" | "value-proof" | "proof-gate" | "decision-handoff";
  label: string;
  status: HomepageOutcomeArtifactStatus;
  value: string;
  proof: string;
  href: string;
  actionLabel: string;
};

export type HomepageOutcomeArtifactPacketReceiptPayload = {
  receiptVersion: typeof HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION;
  source: "homepage-outcome-artifact";
  buyer: string;
  decision: BuyerOutcomeBrief["decision"];
  status: HomepageOutcomeArtifactStatus;
  readyCount: number;
  itemCount: number;
  items: Array<Pick<HomepageOutcomeArtifactPacketItem, "id" | "label" | "status" | "value" | "proof" | "href" | "actionLabel">>;
};

export type HomepageOutcomeArtifactPacketReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH;
  payload: HomepageOutcomeArtifactPacketReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: HomepageOutcomeArtifactReceiptVerification;
};

export type HomepageOutcomeArtifactPacket = {
  status: HomepageOutcomeArtifactStatus;
  headline: string;
  summary: string;
  readyCount: number;
  itemCount: number;
  receipt: HomepageOutcomeArtifactPacketReceipt;
  items: HomepageOutcomeArtifactPacketItem[];
};

export type HomepageOutcomeArtifactAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageOutcomeArtifactSnapshot = {
  status: HomepageOutcomeArtifactStatus;
  decision: BuyerOutcomeBrief["decision"];
  headline: string;
  buyer: string;
  valueClaim: string;
  decisionAsk: string;
  score: number;
  readyCount: number;
  blockedCount: number;
  primaryAction: HomepageOutcomeArtifactAction;
  workflowAction: HomepageOutcomeArtifactAction;
  launchRoomAction: HomepageOutcomeArtifactAction;
  metrics: HomepageOutcomeArtifactMetric[];
  packet: HomepageOutcomeArtifactPacket;
  redLines: BuyerOutcomeBrief["redLines"];
  exportMarkdown: string;
};

export type HomepageReviewerHandoffStep = {
  id: "buyer-brief" | "proof-rail" | "decision-room" | "send-rule";
  label: string;
  status: HomepageOutcomeArtifactStatus;
  owner: string;
  evidence: string;
  href: string;
  actionLabel: string;
};

export type HomepageReviewerHandoffKitSnapshot = {
  status: HomepageOutcomeArtifactStatus;
  headline: string;
  summary: string;
  buyer: string;
  decision: BuyerOutcomeBrief["decision"];
  reviewQuestion: string;
  reviewAnswer: string;
  sendRule: string;
  holdRule: string;
  readyCount: number;
  blockedCount: number;
  steps: HomepageReviewerHandoffStep[];
  primaryAction: HomepageOutcomeArtifactAction;
  proofAction: HomepageOutcomeArtifactAction;
  exportMarkdown: string;
};

function outcomeArtifactStatusFrom(status: BuyerOutcomeBrief["status"]): HomepageOutcomeArtifactStatus {
  if (status === "pass") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

function homepageOutcomeArtifactAction(action: { label: string; href: string; external?: boolean }): HomepageOutcomeArtifactAction {
  return {
    label: action.label,
    href: action.href,
    external: action.external ?? chainHrefIsExternal(action.href)
  };
}

function buildHomepageOutcomeArtifactMarkdown(snapshot: Omit<HomepageOutcomeArtifactSnapshot, "exportMarkdown">) {
  return [
    "# Buyer outcome artifact",
    "",
    `Decision: ${snapshot.decision}`,
    `Status: ${snapshot.status}`,
    `Score: ${snapshot.score}/100`,
    `Buyer: ${snapshot.buyer}`,
    `Ready metrics: ${snapshot.readyCount}/${snapshot.metrics.length}`,
    `Blocked metrics: ${snapshot.blockedCount}`,
    `First action: ${snapshot.primaryAction.label} (${compactBuyerExportHref(snapshot.primaryAction.href)})`,
    `Workflow action: ${snapshot.workflowAction.label} (${compactBuyerExportHref(snapshot.workflowAction.href)})`,
    `Launch room: ${snapshot.launchRoomAction.label} (${compactBuyerExportHref(snapshot.launchRoomAction.href)})`,
    "",
    snapshot.headline,
    snapshot.valueClaim,
    snapshot.decisionAsk,
    "",
    "## What the user gets",
    snapshot.packet.headline,
    snapshot.packet.summary,
    `Ready items: ${snapshot.packet.readyCount}/${snapshot.packet.itemCount}`,
    `Receipt: ${snapshot.packet.receipt.receiptId}`,
    `Checksum: ${snapshot.packet.receipt.checksumAlgorithm}:${snapshot.packet.receipt.checksum}`,
    `Verification: ${snapshot.packet.receipt.verification.status}`,
    `API verification: POST ${snapshot.packet.receipt.verificationApiPath}`,
    "Replay rule: Recompute fnv1a32 over the buyer packet replay payload before accepting a forwarded outcome artifact.",
    ...snapshot.packet.items.map(
      (item) => `- [${item.status}] ${item.label}: ${item.value}. ${item.proof} Action: ${item.actionLabel} (${compactBuyerExportHref(item.href)})`
    ),
    "",
    "## Buyer proof metrics",
    ...snapshot.metrics.map((metric) => `- [${metric.status}] ${metric.label}: ${metric.value}. ${metric.evidence}`),
    "",
    "## Red lines",
    ...(snapshot.redLines.length ? snapshot.redLines.map((line) => `- [${line.status}] ${line.label}: ${line.action} Owner: ${line.owner}`) : ["- None"])
  ].join("\n");
}

function metricFromArtifact(metrics: HomepageOutcomeArtifactMetric[], id: string) {
  return metrics.find((metric) => metric.id === id);
}

function buildHomepageOutcomeArtifactPacket({
  status,
  brief,
  metrics,
  publicBriefHref,
  launchRoomHref
}: {
  status: HomepageOutcomeArtifactStatus;
  brief: BuyerOutcomeBrief;
  metrics: HomepageOutcomeArtifactMetric[];
  publicBriefHref: string;
  launchRoomHref: string;
}): HomepageOutcomeArtifactPacket {
  const modeledValue = metricFromArtifact(metrics, "modeled-value");
  const liveProof = metricFromArtifact(metrics, "live-proof");
  const firstRedLine = brief.redLines[0];
  const decisionHref = status === "blocked" ? brief.nextAction.href : launchRoomHref;
  const decisionAction = status === "blocked" ? `Fix ${brief.nextAction.label}` : "Open decision room";
  const items: HomepageOutcomeArtifactPacketItem[] = [
    {
      id: "buyer-one-pager",
      label: "Buyer one-pager",
      status,
      value: brief.primaryMetric,
      proof: brief.valueNarrative,
      href: publicBriefHref,
      actionLabel: "Open brief"
    },
    {
      id: "value-proof",
      label: "Value proof",
      status: modeledValue?.status ?? status,
      value: modeledValue?.value ?? brief.primaryMetric,
      proof: modeledValue?.evidence ?? brief.valueNarrative,
      href: publicBriefHref,
      actionLabel: "Inspect value"
    },
    {
      id: "proof-gate",
      label: "Live proof gate",
      status: liveProof?.status ?? status,
      value: liveProof?.value ?? "proof not checked",
      proof: liveProof?.evidence ?? brief.hardTruth,
      href: firstRedLine?.href ?? brief.nextAction.href,
      actionLabel: status === "blocked" ? "Repair proof" : "Inspect proof"
    },
    {
      id: "decision-handoff",
      label: "Decision handoff",
      status,
      value: brief.decisionAsk,
      proof: status === "blocked" ? brief.nextAction.action : "The buyer can move from value and proof into a bounded pilot decision.",
      href: decisionHref,
      actionLabel: decisionAction
    }
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const receiptPayload: HomepageOutcomeArtifactPacketReceiptPayload = {
    receiptVersion: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERSION,
    source: "homepage-outcome-artifact",
    buyer: brief.targetBuyer,
    decision: brief.decision,
    status,
    readyCount,
    itemCount: items.length,
    items: items.map((item) => ({
      id: item.id,
      label: item.label,
      status: item.status,
      value: item.value,
      proof: item.proof,
      href: item.href,
      actionLabel: item.actionLabel
    }))
  };
  const checksum = homepageOutcomeArtifactReceiptChecksum(receiptPayload);
  const payloadJson = homepageOutcomeArtifactCanonicalJson(receiptPayload);
  const verificationRequestJson = homepageOutcomeArtifactCanonicalJson({ checksum, payload: receiptPayload });
  const verification = verifyHomepageOutcomeArtifactReceipt({ checksum, payload: receiptPayload });

  return {
    status,
    headline:
      status === "ready"
        ? "One workflow note becomes a buyer packet"
        : status === "attention"
          ? "Buyer packet needs sponsor confirmation"
          : "Buyer packet stays internal until proof closes",
    summary:
      status === "ready"
        ? "The artifact shows exactly what the user can send: one-pager, value proof, live proof, and decision ask."
        : status === "attention"
          ? "The packet is useful for review, with the remaining owner confirmation named before delivery."
        : `The packet is still useful, but ${brief.nextAction.owner} must close ${brief.nextAction.label} before external sharing.`,
    readyCount,
    itemCount: items.length,
    receipt: {
      receiptId: `homepage-outcome-${status}-${checksum}`,
      checksumAlgorithm: "fnv1a32",
      checksum,
      verificationApiPath: HOMEPAGE_OUTCOME_ARTIFACT_RECEIPT_VERIFY_PATH,
      payload: receiptPayload,
      payloadJson,
      payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
      verificationRequestJson,
      verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
      verification
    },
    items
  };
}

export function buildHomepageOutcomeArtifactSnapshot({
  brief,
  publicBriefHref,
  launchRoomHref,
  workflowIntakeHref = "#quick-workflow-intake"
}: {
  brief: BuyerOutcomeBrief;
  publicBriefHref: string;
  launchRoomHref: string;
  workflowIntakeHref?: string;
}): HomepageOutcomeArtifactSnapshot {
  const status = outcomeArtifactStatusFrom(brief.status);
  const primaryAction =
    status === "blocked"
      ? homepageOutcomeArtifactAction({ label: `Fix ${brief.nextAction.label}`, href: brief.nextAction.href })
      : homepageOutcomeArtifactAction({ label: "Open buyer brief", href: publicBriefHref });
  const metrics = brief.metrics.slice(0, 4).map((metric) => ({
    id: metric.id,
    label: metric.label,
    status: outcomeArtifactStatusFrom(metric.status),
    value: metric.value,
    evidence: metric.evidence
  }));
  const packet = buildHomepageOutcomeArtifactPacket({
    status,
    brief,
    metrics,
    publicBriefHref,
    launchRoomHref
  });
  const partial: Omit<HomepageOutcomeArtifactSnapshot, "exportMarkdown"> = {
    status,
    decision: brief.decision,
    headline: brief.headline,
    buyer: brief.targetBuyer,
    valueClaim: brief.valueNarrative,
    decisionAsk: brief.decisionAsk,
    score: brief.briefScore,
    readyCount: metrics.filter((metric) => metric.status === "ready").length,
    blockedCount: metrics.filter((metric) => metric.status === "blocked").length,
    primaryAction,
    workflowAction: homepageOutcomeArtifactAction({ label: "Paste workflow", href: workflowIntakeHref }),
    launchRoomAction: homepageOutcomeArtifactAction({ label: "Open launch room", href: launchRoomHref }),
    metrics,
    packet,
    redLines: brief.redLines.slice(0, 3)
  };

  return {
    ...partial,
    exportMarkdown: buildHomepageOutcomeArtifactMarkdown(partial)
  };
}

function reviewerHandoffHeadline(status: HomepageOutcomeArtifactStatus) {
  if (status === "ready") return "Reviewer can decide from one kit";
  if (status === "attention") return "Reviewer kit needs owner confirmation";
  return "Reviewer kit names the no-send reason";
}

function reviewerHandoffSummary(status: HomepageOutcomeArtifactStatus) {
  if (status === "ready") {
    return "The buyer brief, proof rail, launch room, and send rule are packaged into one review path.";
  }
  if (status === "attention") {
    return "The kit keeps the review path visible while marking the owner confirmation still required.";
  }
  return "The kit keeps external sharing blocked and points the reviewer to the first proof owner.";
}

function buildReviewerHandoffMarkdown(snapshot: Omit<HomepageReviewerHandoffKitSnapshot, "exportMarkdown">) {
  return [
    "# Reviewer handoff kit",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Decision: ${snapshot.decision}`,
    `Ready steps: ${snapshot.readyCount}/${snapshot.steps.length}`,
    `Blocked steps: ${snapshot.blockedCount}`,
    `Primary action: ${snapshot.primaryAction.label} (${compactBuyerExportHref(snapshot.primaryAction.href)})`,
    `Proof action: ${snapshot.proofAction.label} (${compactBuyerExportHref(snapshot.proofAction.href)})`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Reviewer question",
    snapshot.reviewQuestion,
    snapshot.reviewAnswer,
    "",
    "## Send rule",
    snapshot.sendRule,
    "",
    "## Hold rule",
    snapshot.holdRule,
    "",
    "## Review path",
    ...snapshot.steps.map(
      (step) => `- [${step.status}] ${step.label} - ${step.owner}: ${step.evidence} Action: ${step.actionLabel} (${compactBuyerExportHref(step.href)})`
    )
  ].join("\n");
}

export function buildHomepageReviewerHandoffKitSnapshot({
  artifact,
  proofEntry,
  reviewKitHref
}: {
  artifact: HomepageOutcomeArtifactSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  reviewKitHref: string;
}): HomepageReviewerHandoffKitSnapshot {
  const status = worstProofChainStatus([artifact.status, proofEntry.status]);
  const proofAction = homepageOutcomeArtifactAction({
    label: proofEntry.nextMove.action.label,
    href: proofEntry.nextMove.action.href,
    external: proofEntry.nextMove.action.external
  });
  const primaryAction =
    status === "ready"
      ? homepageOutcomeArtifactAction({ label: "Open review kit", href: reviewKitHref })
      : proofAction;
  const sendRule =
    status === "ready"
      ? "Send only with the buyer brief, launch room, proof rail, and decision receipt attached."
      : `Do not send until ${proofEntry.nextMove.headline.toLowerCase()}.`;
  const holdRule = artifact.redLines[0]
    ? `${artifact.redLines[0].owner}: ${artifact.redLines[0].action}`
    : "Hold if any public proof link requires private access or the launch room cannot be opened.";
  const steps: HomepageReviewerHandoffStep[] = [
    {
      id: "buyer-brief",
      label: "Buyer brief",
      status: artifact.status,
      owner: "Sponsor",
      evidence: `${artifact.score}/100 brief score. ${artifact.valueClaim}`,
      href: artifact.primaryAction.href,
      actionLabel: artifact.primaryAction.label
    },
    {
      id: "proof-rail",
      label: "Proof rail",
      status: proofEntry.status,
      owner: proofEntry.nextMove.owner,
      evidence: `${proofEntry.readyCount}/${proofEntry.items.length} rails ready. ${proofEntry.nextMove.headline}`,
      href: proofEntry.nextMove.action.href,
      actionLabel: proofEntry.nextMove.action.label
    },
    {
      id: "decision-room",
      label: "Decision room",
      status: status === "ready" ? "ready" : proofEntry.status,
      owner: "Pilot owner",
      evidence: artifact.decisionAsk,
      href: artifact.launchRoomAction.href,
      actionLabel: artifact.launchRoomAction.label
    },
    {
      id: "send-rule",
      label: status === "ready" ? "Send rule" : "No-send rule",
      status,
      owner: proofEntry.nextMove.owner,
      evidence: sendRule,
      href: proofEntry.nextMove.action.href,
      actionLabel: proofEntry.nextMove.action.label
    }
  ];
  const partial: Omit<HomepageReviewerHandoffKitSnapshot, "exportMarkdown"> = {
    status,
    headline: reviewerHandoffHeadline(status),
    summary: reviewerHandoffSummary(status),
    buyer: artifact.buyer,
    decision: artifact.decision,
    reviewQuestion:
      status === "ready" ? "Can the buyer approve the first pilot from this room?" : "What must close before this buyer can review the room?",
    reviewAnswer: status === "ready" ? artifact.decisionAsk : proofEntry.nextMove.buyerImpact,
    sendRule,
    holdRule,
    readyCount: steps.filter((step) => step.status === "ready").length,
    blockedCount: steps.filter((step) => step.status === "blocked").length,
    steps,
    primaryAction,
    proofAction
  };

  return {
    ...partial,
    exportMarkdown: buildReviewerHandoffMarkdown(partial)
  };
}

function pilotContractReadinessFrom(statuses: BuyerProofChainStatus[]): BuyerPilotContractReadiness {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "needs-owner-review";
  return "contract-ready";
}

function pilotContractHeadlineFor(readiness: BuyerPilotContractReadiness) {
  if (readiness === "contract-ready") return "The first buyer pilot has a sendable contract";
  if (readiness === "needs-owner-review") return "Review the pilot contract before sending";
  return "Do not send the pilot contract yet";
}

function buildBuyerPilotContractMarkdown(snapshot: Omit<BuyerPilotContractSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer pilot contract",
    "",
    `Readiness: ${snapshot.readiness}`,
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Pilot offer: ${snapshot.pilotOffer}`,
    `First commitment: ${yen(snapshot.firstCommitmentYen)}`,
    `Expected monthly value: ${yen(snapshot.expectedMonthlyValueYen)}`,
    `Value coverage: ${snapshot.valueCoveragePercent}%`,
    `Payback: ${snapshot.paybackDays} days`,
    `First action: ${snapshot.firstAction.label} (${compactBuyerExportHref(snapshot.firstAction.href)})`,
    `Review action: ${snapshot.reviewAction.label} (${compactBuyerExportHref(snapshot.reviewAction.href)})`,
    "",
    snapshot.hardTruth,
    "",
    "## Buyer send note",
    `Subject: ${snapshot.sendNote.subject}`,
    `Instruction: ${snapshot.sendNote.instruction}`,
    ...snapshot.sendNote.body.map((line) => `- ${line}`),
    "",
    "## Send attachments",
    ...snapshot.sendNote.attachments.map(
      (attachment) => `- [${attachment.status}] ${attachment.label}: ${compactBuyerExportHref(attachment.href)} Evidence: ${attachment.evidence}`
    ),
    "",
    "## Contract milestones",
    ...snapshot.milestones.map(
      (milestone) =>
        `- [${milestone.status}] ${milestone.label} (${milestone.owner}): ${milestone.promise} Proof: ${milestone.proof} Link: ${compactBuyerExportHref(milestone.href)}`
    ),
    "",
    "## Buyer close checklist",
    ...snapshot.closeChecklist.map(
      (item) =>
        `- [${item.status}] ${item.label} (${item.owner}): Decision: ${item.buyerDecision} Evidence: ${item.evidence} Link: ${compactBuyerExportHref(item.href)}`
    ),
    "",
    "## Buyer questions",
    ...snapshot.buyerQuestions.map((question) => `- ${question.question} ${question.answer} Evidence: ${question.evidence}`),
    "",
    "## Stop rule",
    `- ${snapshot.stopRule}`,
    "",
    "## Proof line",
    `- ${snapshot.proofLine}`
  ].join("\n");
}

export function buildBuyerPilotContractSnapshot({
  publicDecisionPath,
  sponsorAsk,
  operatingSnapshot,
  trustSnapshot,
  commercialOffer,
  activationSnapshot,
  globalLaunchSnapshot,
  launchRoomHref,
  commercialOfferHref = "#commercial-offer"
}: {
  publicDecisionPath: BuyerPublicDecisionPath;
  sponsorAsk: BuyerSponsorAskSnapshot;
  operatingSnapshot: BuyerOperatingPlanSnapshot;
  trustSnapshot: BuyerTrustSnapshot;
  commercialOffer: BuyerCommercialOfferSnapshot;
  activationSnapshot: BuyerActivationSnapshot;
  globalLaunchSnapshot: BuyerGlobalLaunchSnapshot;
  launchRoomHref: string;
  commercialOfferHref?: string;
}): BuyerPilotContractSnapshot {
  const milestones: BuyerPilotContractMilestone[] = [
    {
      id: "first-commitment",
      label: "First commitment",
      status: commercialOffer.status,
      owner: sponsorAsk.decisionOwner,
      promise: commercialOffer.contractLine,
      proof:
        commercialOffer.firstCommitmentYen > 0
          ? `${yen(commercialOffer.firstCommitmentYen)} against ${yen(commercialOffer.expectedMonthlyValueYen)} expected monthly value.`
          : "No external commitment is shown while commercial proof is blocked.",
      href: commercialOffer.firstAction.href
    },
    {
      id: "sponsor-decision",
      label: "Sponsor decision",
      status: sponsorAsk.status,
      owner: sponsorAsk.decisionOwner,
      promise: sponsorAsk.askInstruction,
      proof: sponsorAsk.nextProofMove.proof,
      href: sponsorAsk.firstAction.href
    },
    {
      id: "operating-path",
      label: "30-day operating path",
      status: operatingSnapshot.status,
      owner: operatingSnapshot.commitments[0]?.owner ?? sponsorAsk.decisionOwner,
      promise: operatingSnapshot.operatingMetric,
      proof: `${yen(operatingSnapshot.riskAdjustedMonthlyValueYen)} risk-adjusted monthly value; ${operatingSnapshot.readiness}.`,
      href: operatingSnapshot.firstAction.href
    },
    {
      id: "activation-owner",
      label: "Activation owner",
      status: activationSnapshot.status,
      owner: activationSnapshot.currentOwner,
      promise: activationSnapshot.currentArtifact,
      proof: activationSnapshot.proofClosure,
      href: activationSnapshot.firstAction.href
    },
    {
      id: "public-launch-proof",
      label: "Public launch proof",
      status: globalLaunchSnapshot.status,
      owner: "Product owner",
      promise: globalLaunchSnapshot.headline,
      proof: `${globalLaunchSnapshot.proofSummary}; ${globalLaunchSnapshot.opsSummary}.`,
      href: globalLaunchSnapshot.firstAction.href
    }
  ];
  const status = worstProofChainStatus([
    publicDecisionPath.status,
    trustSnapshot.status,
    ...milestones.map((milestone) => milestone.status)
  ]);
  const readiness = pilotContractReadinessFrom([status]);
  const firstOpen = milestones.find((milestone) => milestone.status === "blocked") ?? milestones.find((milestone) => milestone.status === "attention");
  const stopRule =
    operatingSnapshot.expansionCriteria.find((criterion) => /blocked|acceptance|stop|remain|above/i.test(criterion)) ??
    "Expand only when measured value, trust controls, public proof, and owner commitments remain healthy.";
  const proofLine = `${publicDecisionPath.buyerLine}. ${globalLaunchSnapshot.proofSummary}. Trust score ${trustSnapshot.trustScore}/100.`;
  const artifactById = new Map(publicDecisionPath.artifacts.map((artifact) => [artifact.id, artifact]));
  const workflowArtifact = artifactById.get("workflow-intake");
  const proofAuditArtifact = artifactById.get("proof-audit");
  const closeChecklist: BuyerPilotContractCloseItem[] = [
    {
      id: "buyer-scope",
      label: "Buyer problem and scope",
      status: workflowArtifact?.status ?? publicDecisionPath.status,
      owner: commercialOffer.buyer,
      buyerDecision: `Approve one workflow: ${workflowArtifact?.value ?? publicDecisionPath.buyerLine}`,
      evidence: workflowArtifact?.proof ?? publicDecisionPath.buyerLine,
      href: workflowArtifact?.href ?? "#marketplace-workbench"
    },
    {
      id: "commercial-boundary",
      label: "Commercial boundary",
      status: commercialOffer.status,
      owner: sponsorAsk.decisionOwner,
      buyerDecision:
        commercialOffer.firstCommitmentYen > 0
          ? `Approve ${yen(commercialOffer.firstCommitmentYen)} first commitment; expansion waits for measured proof.`
          : "Hold price until value, proof, trust, and operating blockers close.",
      evidence: `${yen(commercialOffer.expectedMonthlyValueYen)} expected monthly value; ${commercialOffer.valueCoveragePercent}% cover; ${commercialOffer.paybackDays}d payback.`,
      href: commercialOffer.firstAction.href
    },
    {
      id: "proof-acceptance",
      label: "Proof acceptance",
      status: worstProofChainStatus([publicDecisionPath.status, globalLaunchSnapshot.status]),
      owner: "Product owner",
      buyerDecision: "Accept only when the proof audit, launch room, and public URLs are open.",
      evidence: `${proofAuditArtifact?.value ?? globalLaunchSnapshot.proofSummary}; ${globalLaunchSnapshot.opsSummary}.`,
      href: proofAuditArtifact?.href ?? globalLaunchSnapshot.firstAction.href
    },
    {
      id: "trust-boundary",
      label: "Trust boundary",
      status: trustSnapshot.status,
      owner: "Trust reviewer",
      buyerDecision: trustSnapshot.dataBoundary,
      evidence: `Trust score ${trustSnapshot.trustScore}/100. ${trustSnapshot.hardTruth}`,
      href: trustSnapshot.firstAction.href
    },
    {
      id: "renewal-decision",
      label: "Day-30 renewal decision",
      status: worstProofChainStatus([operatingSnapshot.status, activationSnapshot.status]),
      owner: operatingSnapshot.commitments[0]?.owner ?? activationSnapshot.currentOwner,
      buyerDecision: stopRule,
      evidence: `${operatingSnapshot.operatingMetric}; ${activationSnapshot.proofClosure}.`,
      href: operatingSnapshot.firstAction.href
    }
  ];
  const commercialBoundary = closeChecklist.find((item) => item.id === "commercial-boundary") ?? closeChecklist[1];
  const proofAcceptance = closeChecklist.find((item) => item.id === "proof-acceptance") ?? closeChecklist[2];
  const trustBoundary = closeChecklist.find((item) => item.id === "trust-boundary") ?? closeChecklist[3];
  const openCloseItem = closeChecklist.find((item) => item.status === "blocked") ?? closeChecklist.find((item) => item.status === "attention");
  const sendAttachments: BuyerPilotContractSendAttachment[] = [
    {
      id: "pilot-contract",
      label: "Pilot contract",
      status,
      href: commercialOfferHref,
      evidence: commercialOffer.contractLine
    },
    {
      id: "launch-room",
      label: "Launch room",
      status: worstProofChainStatus([operatingSnapshot.status, activationSnapshot.status, globalLaunchSnapshot.status]),
      href: launchRoomHref,
      evidence: `${operatingSnapshot.operatingMetric}; ${activationSnapshot.proofClosure}.`
    },
    {
      id: "proof-audit",
      label: "Proof audit",
      status: proofAcceptance.status,
      href: proofAcceptance.href,
      evidence: proofAcceptance.evidence
    },
    {
      id: "commercial-boundary",
      label: "Commercial boundary",
      status: commercialOffer.status,
      href: commercialOffer.firstAction.href,
      evidence: commercialBoundary.buyerDecision
    },
    {
      id: "trust-boundary",
      label: "Trust boundary",
      status: trustSnapshot.status,
      href: trustSnapshot.firstAction.href,
      evidence: trustBoundary.buyerDecision
    }
  ];
  const sendStatus = worstProofChainStatus([status, ...sendAttachments.map((attachment) => attachment.status)]);
  const clearCloseItems = closeChecklist.filter((item) => item.status === "ready").length;
  const sendSubject =
    sendStatus === "ready"
      ? `Pilot contract ready: ${commercialOffer.buyer}`
      : sendStatus === "attention"
        ? `Review needed: ${commercialOffer.buyer} pilot contract`
        : `Draft only: ${commercialOffer.buyer} pilot contract`;
  const sendInstruction =
    sendStatus === "ready"
      ? "Send with the launch room, proof audit, commercial boundary, and trust boundary attached."
      : sendStatus === "attention"
        ? `Send only for owner review; do not ask the buyer to approve until ${openCloseItem?.label ?? "the open checklist item"} clears.`
        : `Do not send to the buyer; use this note internally to close ${openCloseItem?.label ?? "the blocked checklist item"}.`;
  const sendBody = [
    `We are preparing a first AI agent pilot for ${commercialOffer.buyer}.`,
    commercialOffer.firstCommitmentYen > 0
      ? `The proposed first commitment is ${yen(commercialOffer.firstCommitmentYen)} for ${commercialOffer.recommendedTier}, covered by ${commercialOffer.valueCoveragePercent}% of expected monthly value.`
      : "No buyer price is being requested until value, proof, trust, and operating blockers close.",
    `Close state: ${clearCloseItems}/${closeChecklist.length} buyer decisions ready. ${proofLine}`,
    `Stop rule: ${stopRule}`,
    sendStatus === "ready"
      ? "Please review the attached contract, launch room, proof audit, commercial boundary, and trust boundary."
      : `Current blocker: ${openCloseItem?.buyerDecision ?? "Owner review is still required before buyer approval."}`
  ];
  const sendNote: BuyerPilotContractSendNote = {
    status: sendStatus,
    subject: sendSubject,
    instruction: sendInstruction,
    body: sendBody,
    attachments: sendAttachments,
    copyText: [
      `Subject: ${sendSubject}`,
      "",
      ...sendBody,
      "",
      "Attachments:",
      ...sendAttachments.map((attachment) => `- [${attachment.status}] ${attachment.label}: ${compactBuyerExportHref(attachment.href)} - ${attachment.evidence}`)
    ].join("\n")
  };
  const partial: Omit<BuyerPilotContractSnapshot, "copyText" | "exportMarkdown"> = {
    readiness,
    status,
    headline: pilotContractHeadlineFor(readiness),
    hardTruth:
      readiness === "contract-ready"
        ? "A buyer can see the price, promised workflow, proof trail, owner, operating path, and stop rule before approving the first pilot."
        : firstOpen
          ? `${firstOpen.owner} must close ${firstOpen.label} before this reads like a real buyer contract.`
          : "The contract needs owner review before external sharing.",
    buyer: commercialOffer.buyer,
    pilotOffer: commercialOffer.recommendedTier,
    firstCommitmentYen: commercialOffer.firstCommitmentYen,
    expectedMonthlyValueYen: commercialOffer.expectedMonthlyValueYen,
    valueCoveragePercent: commercialOffer.valueCoveragePercent,
    paybackDays: commercialOffer.paybackDays,
    proofLine,
    stopRule,
    firstAction: firstOpen
      ? {
          id: "primary",
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: chainHrefIsExternal(firstOpen.href)
        }
      : {
          id: "primary",
          label: "Open pilot contract",
          href: commercialOfferHref,
          external: chainHrefIsExternal(commercialOfferHref)
        },
    reviewAction: {
      id: "launch-room",
      label: "Review launch room",
      href: launchRoomHref,
      external: chainHrefIsExternal(launchRoomHref)
    },
    milestones,
    closeChecklist,
    sendNote,
    buyerQuestions: [
      {
        question: "What do we buy first?",
        answer: commercialOffer.contractLine,
        evidence: publicDecisionPath.buyerLine
      },
      {
        question: "Why is the ask defensible?",
        answer:
          commercialOffer.firstCommitmentYen > 0
            ? `${yen(commercialOffer.firstCommitmentYen)} is covered by ${commercialOffer.valueCoveragePercent}% of expected monthly value.`
            : "No ask is shown until the value and proof blockers close.",
        evidence: `${yen(commercialOffer.expectedMonthlyValueYen)} expected monthly value; ${commercialOffer.paybackDays}-day payback.`
      },
      {
        question: "What prevents over-expansion?",
        answer: stopRule,
        evidence: `${operatingSnapshot.readiness}; ${trustSnapshot.dataBoundary}.`
      }
    ]
  };
  const exportMarkdown = buildBuyerPilotContractMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function artifactStage(
  artifact: BuyerPublicDecisionArtifact | undefined,
  fallback: Omit<BuyerPilotAssemblyLineStage, "status"> & { status?: BuyerProofChainStatus }
): BuyerPilotAssemblyLineStage {
  return {
    id: fallback.id,
    label: fallback.label,
    status: artifact?.status ?? fallback.status ?? "blocked",
    title: compactProofText(artifact?.value ?? fallback.title, fallback.title, 86),
    detail: compactProofText(artifact?.proof ?? fallback.detail, fallback.detail, 160),
    href: artifact?.href ?? fallback.href
  };
}

export function buildBuyerPilotAssemblyLineSnapshot({
  proofChain,
  publicDecisionPath,
  pilotContract,
  globalLaunchSnapshot
}: {
  proofChain: Pick<BuyerProofChainSnapshot, "gates" | "primaryAction">;
  publicDecisionPath: Pick<BuyerPublicDecisionPath, "artifacts">;
  pilotContract: Pick<BuyerPilotContractSnapshot, "status" | "headline" | "sendNote" | "stopRule" | "firstAction">;
  globalLaunchSnapshot: Pick<BuyerGlobalLaunchSnapshot, "status" | "headline" | "proofSummary" | "firstAction">;
}): BuyerPilotAssemblyLineSnapshot {
  const artifactById = new Map(publicDecisionPath.artifacts.map((artifact) => [artifact.id, artifact]));
  const gateById = new Map(proofChain.gates.map((gate) => [gate.id, gate]));
  const proofArtifact = artifactById.get("proof-audit");
  const proofStatus = worstProofChainStatus([proofArtifact?.status ?? "blocked", globalLaunchSnapshot.status]);
  const stages: BuyerPilotAssemblyLineStage[] = [
    artifactStage(artifactById.get("workflow-intake"), {
      id: "workflow",
      label: "Workflow",
      status: gateById.get("workflow-scope")?.status,
      title: gateById.get("workflow-scope")?.value ?? "Workflow scope missing",
      detail: gateById.get("workflow-scope")?.evidence ?? "Name the buyer, painful job, baseline, and success metric.",
      href: gateById.get("workflow-scope")?.href ?? "#marketplace-workbench"
    }),
    artifactStage(artifactById.get("value-report"), {
      id: "value",
      label: "Value",
      status: gateById.get("value-case")?.status,
      title: gateById.get("value-case")?.value ?? "Value case missing",
      detail: gateById.get("value-case")?.evidence ?? "Model the expected monthly value and payback.",
      href: gateById.get("value-case")?.href ?? "#buyer-value-simulator"
    }),
    {
      id: "proof",
      label: "Proof",
      status: proofStatus,
      title: compactProofText(proofArtifact?.value ?? globalLaunchSnapshot.headline, globalLaunchSnapshot.headline, 86),
      detail: compactProofText(`${proofArtifact?.proof ?? "Run the public proof audit."} ${globalLaunchSnapshot.proofSummary}`, globalLaunchSnapshot.proofSummary, 170),
      href: proofArtifact?.href ?? globalLaunchSnapshot.firstAction.href
    },
    {
      id: "contract",
      label: "Contract",
      status: pilotContract.status,
      title: pilotContract.headline,
      detail: compactProofText(`${pilotContract.sendNote.subject}. Stop rule: ${pilotContract.stopRule}`, pilotContract.sendNote.instruction, 170),
      href: pilotContract.firstAction.href
    }
  ];
  const status = worstProofChainStatus(stages.map((stage) => stage.status));
  const firstOpen = stages.find((stage) => stage.status === "blocked") ?? stages.find((stage) => stage.status === "attention");
  const readyCount = stages.filter((stage) => stage.status === "ready").length;
  const attentionCount = stages.filter((stage) => stage.status === "attention").length;
  const blockedCount = stages.filter((stage) => stage.status === "blocked").length;
  const primaryAction = firstOpen
    ? {
        id: "primary" as const,
        label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
        href: firstOpen.href,
        external: chainHrefIsExternal(firstOpen.href)
      }
    : pilotContract.firstAction;

  return {
    status,
    headline: firstOpen ? `${firstOpen.label} is the next assembly step` : "Pilot contract is assembled for buyer review",
    instruction: firstOpen
      ? firstOpen.detail
      : "Workflow, value, public proof, and contract terms are all visible before the buyer is asked to approve the pilot.",
    readyCount,
    attentionCount,
    blockedCount,
    stageTotal: stages.length,
    primaryAction,
    stages
  };
}

function fallbackBuyerQuestion(
  questions: BuyerPilotContractSnapshot["buyerQuestions"],
  index: number,
  fallback: BuyerPilotContractSnapshot["buyerQuestions"][number]
) {
  return questions[index] ?? fallback;
}

function contractCloseStatus(
  itemById: Map<BuyerPilotContractCloseItem["id"], BuyerPilotContractCloseItem>,
  ids: BuyerPilotContractCloseItem["id"][]
) {
  return worstProofChainStatus(ids.map((id) => itemById.get(id)?.status ?? "blocked"));
}

export function buildBuyerPilotDecisionBriefMarkdown(snapshot: Omit<BuyerPilotDecisionBriefSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer pilot decision brief",
    "",
    `Status: ${snapshot.status}`,
    `Headline: ${snapshot.headline}`,
    `Pilot offer: ${snapshot.pilotOffer}`,
    `Proof line: ${snapshot.proofLine}`,
    `Stop rule: ${snapshot.stopRule}`,
    `Ready answers: ${snapshot.readyCount}/${snapshot.questionTotal}`,
    "",
    snapshot.summary,
    "",
    "## Buyer questions",
    ...snapshot.questions.map((question) => [`- [${question.status}] ${question.question}`, `  Answer: ${question.answer}`, `  Evidence: ${question.evidence}`].join("\n"))
  ].join("\n").trim();
}

export function buildBuyerPilotDecisionBriefSnapshot({
  pilotContract
}: {
  pilotContract: Pick<
    BuyerPilotContractSnapshot,
    "status" | "headline" | "hardTruth" | "buyerQuestions" | "closeChecklist" | "pilotOffer" | "proofLine" | "stopRule" | "firstAction"
  >;
}): BuyerPilotDecisionBriefSnapshot {
  const closeItemById = new Map(pilotContract.closeChecklist.map((item) => [item.id, item]));
  const scopeQuestion = fallbackBuyerQuestion(pilotContract.buyerQuestions, 0, {
    question: "What do we buy first?",
    answer: pilotContract.headline,
    evidence: pilotContract.hardTruth
  });
  const priceQuestion = fallbackBuyerQuestion(pilotContract.buyerQuestions, 1, {
    question: "Why is the ask defensible?",
    answer: pilotContract.pilotOffer,
    evidence: pilotContract.proofLine
  });
  const expansionQuestion = fallbackBuyerQuestion(pilotContract.buyerQuestions, 2, {
    question: "What prevents over-expansion?",
    answer: pilotContract.stopRule,
    evidence: pilotContract.proofLine
  });
  const questions: BuyerPilotDecisionBriefQuestion[] = [
    {
      id: "scope",
      label: "Scope",
      status: contractCloseStatus(closeItemById, ["buyer-scope"]),
      question: scopeQuestion.question,
      answer: scopeQuestion.answer,
      evidence: scopeQuestion.evidence,
      href: closeItemById.get("buyer-scope")?.href ?? pilotContract.firstAction.href
    },
    {
      id: "price",
      label: "Price",
      status: contractCloseStatus(closeItemById, ["commercial-boundary", "proof-acceptance"]),
      question: priceQuestion.question,
      answer: priceQuestion.answer,
      evidence: priceQuestion.evidence,
      href: closeItemById.get("commercial-boundary")?.href ?? closeItemById.get("proof-acceptance")?.href ?? pilotContract.firstAction.href
    },
    {
      id: "expansion",
      label: "Expansion",
      status: contractCloseStatus(closeItemById, ["trust-boundary", "renewal-decision"]),
      question: expansionQuestion.question,
      answer: expansionQuestion.answer,
      evidence: expansionQuestion.evidence,
      href: closeItemById.get("trust-boundary")?.href ?? closeItemById.get("renewal-decision")?.href ?? pilotContract.firstAction.href
    }
  ];
  const status = worstProofChainStatus([pilotContract.status, ...questions.map((question) => question.status)]);
  const firstOpen = questions.find((question) => question.status === "blocked") ?? questions.find((question) => question.status === "attention");
  const readyCount = questions.filter((question) => question.status === "ready").length;
  const partial: Omit<BuyerPilotDecisionBriefSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    headline: firstOpen ? `${firstOpen.label} answer is not ready` : "Buyer answers are ready for procurement review",
    summary: firstOpen
      ? `${firstOpen.question} ${compactProofText(firstOpen.evidence, firstOpen.answer, 180)}`
      : "The buyer can see the first scope, why the price is defensible, and which stop rule prevents uncontrolled expansion.",
    readyCount,
    questionTotal: questions.length,
    pilotOffer: pilotContract.pilotOffer,
    proofLine: pilotContract.proofLine,
    stopRule: pilotContract.stopRule,
    primaryAction: firstOpen
      ? {
          id: "primary",
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label} answer`,
          href: firstOpen.href,
          external: chainHrefIsExternal(firstOpen.href)
        }
      : pilotContract.firstAction,
    questions
  };
  const exportMarkdown = buildBuyerPilotDecisionBriefMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

export function buildBuyerPilotMeetingBriefMarkdown(snapshot: Omit<BuyerPilotMeetingBriefSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer pilot meeting brief",
    "",
    `Status: ${snapshot.status}`,
    `Headline: ${snapshot.headline}`,
    `Meeting goal: ${snapshot.meetingGoal}`,
    `Close ask: ${snapshot.closeAsk}`,
    `Ready agenda items: ${snapshot.readyCount}/${snapshot.agendaTotal}`,
    `First action: ${snapshot.primaryAction.label} (${compactBuyerExportHref(snapshot.primaryAction.href)})`,
    "",
    "## Agenda",
    ...snapshot.agenda.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.outcome} Evidence: ${item.evidence}`),
    "",
    "## Objection answers",
    ...snapshot.objections.map((objection) => `- ${objection.question} ${objection.answer} Evidence: ${objection.evidence}`),
    "",
    "## Follow-up",
    `Subject: ${snapshot.followUp.subject}`,
    snapshot.followUp.instruction,
    ...snapshot.followUp.body.map((line) => `- ${line}`),
    "",
    "## Calendar hold",
    `Title: ${snapshot.followUp.calendar.title}`,
    `Duration: ${snapshot.followUp.calendar.durationMinutes} minutes`,
    `File: ${snapshot.followUp.calendar.filename}`,
    "",
    "## Decision receipt",
    `Receipt: ${snapshot.decisionReceipt.receiptId}`,
    `Checksum: ${snapshot.decisionReceipt.checksumAlgorithm}:${snapshot.decisionReceipt.proofChecksum}`,
    `Decision: ${snapshot.decisionReceipt.decision}`,
    `Owner: ${snapshot.decisionReceipt.owner}`,
    snapshot.decisionReceipt.summary,
    ...snapshot.decisionReceipt.items.map((item) => `- [${item.status}] ${item.label} (${item.owner}): ${item.action} Evidence: ${item.evidence}`),
    `Task ledger: ${snapshot.decisionReceipt.taskLedger.filename}`
  ].join("\n").trim();
}

function buildBuyerPilotMeetingDecisionReceiptMarkdown(receipt: Omit<BuyerPilotMeetingDecisionReceipt, "copyText" | "exportMarkdown" | "href">) {
  return [
    "# Buyer pilot meeting decision receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.proofChecksum}`,
    `Decision: ${receipt.decision}`,
    `Status: ${receipt.status}`,
    `Owner: ${receipt.owner}`,
    `Headline: ${receipt.headline}`,
    receipt.summary,
    "",
    "## Receipt items",
    ...receipt.items.map((item) => [`- [${item.status}] ${item.label}`, `  Owner: ${item.owner}`, `  Action: ${item.action}`, `  Evidence: ${item.evidence}`, `  Link: ${compactBuyerExportHref(item.href)}`].join("\n")),
    "",
    "## Outcome routing",
    `Recommended: ${receipt.recommendedOutcome}`,
    ...receipt.outcomeRoutes.map((route) => [`- [${route.status}] ${route.label}`, `  Owner: ${route.owner}`, `  Condition: ${route.condition}`, `  Record: ${route.record}`, `  Next action: ${route.nextAction}`, `  Evidence: ${route.evidence}`].join("\n")),
    "",
    "## Task ledger",
    `File: ${receipt.taskLedger.filename}`,
    `Tasks: ${receipt.taskLedger.taskCount}`,
    ...receipt.items.map((item) => `- ${item.owner}: ${item.action}`),
    "",
    "## Replay rule",
    "- Match the receipt id and checksum before forwarding.",
    "- Stop if any ready item regresses before the buyer decision is recorded."
  ].join("\n").trim();
}

function escapeCsvCell(value: string | number) {
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildBuyerPilotMeetingTaskLedger({
  receiptId,
  decision,
  items
}: {
  receiptId: string;
  decision: BuyerPilotMeetingDecisionReceipt["decision"];
  items: BuyerPilotMeetingDecisionReceiptItem[];
}): BuyerPilotMeetingTaskLedger {
  const rows = [
    ["receiptId", "decision", "taskId", "status", "owner", "title", "action", "evidence", "sourceHref"],
    ...items.map((item) => [receiptId, decision, item.id, item.status, item.owner, item.label, item.action, item.evidence, compactBuyerExportHref(item.href)])
  ];
  const csvText = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const filename = decision === "approve-pilot" ? "buyer-pilot-approval-tasks.csv" : "buyer-pilot-repair-tasks.csv";

  return {
    filename,
    taskCount: items.length,
    csvText,
    href: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}

function buildBuyerPilotMeetingOutcomeRoutes({
  status,
  buyer,
  owner,
  pilotOffer,
  closeAsk,
  meetingGoal,
  followUp,
  firstOpen
}: {
  status: BuyerProofChainStatus;
  buyer: string;
  owner: string;
  pilotOffer: string;
  closeAsk: string;
  meetingGoal: string;
  followUp: BuyerPilotMeetingFollowUp;
  firstOpen: BuyerPilotMeetingAgendaItem | undefined;
}): {
  recommendedOutcome: BuyerPilotMeetingOutcomeRouteId;
  outcomeRoutes: BuyerPilotMeetingOutcomeRoute[];
} {
  if (status === "ready") {
    return {
      recommendedOutcome: "approve" as const,
      outcomeRoutes: [
        {
          id: "approve",
          label: "Approve pilot",
          status: "ready" as const,
          owner: buyer,
          condition: "All meeting agenda items are ready.",
          record: `Approve ${pilotOffer}.`,
          nextAction: "Send the follow-up, attach the contract, and start the task ledger.",
          evidence: closeAsk
        },
        {
          id: "hold",
          label: "Hold for reviewer",
          status: "attention" as const,
          owner: buyer,
          condition: "The buyer needs one more internal reviewer but no blocker is known.",
          record: "Hold the pilot decision with a review deadline.",
          nextAction: `Use ${followUp.calendar.filename} and the task ledger to assign the final reviewer.`,
          evidence: followUp.subject
        },
        {
          id: "reject",
          label: "Reject current scope",
          status: "attention" as const,
          owner: buyer,
          condition: "The buyer rejects the current scope, value, or trust boundary.",
          record: "Reject this pilot shape and keep the receipt as the learning record.",
          nextAction: "Revise the buyer workflow before reopening the ask.",
          evidence: meetingGoal
        }
      ]
    };
  }

  return {
    recommendedOutcome: "hold" as const,
    outcomeRoutes: [
      {
        id: "approve",
        label: "Approve pilot",
        status: "blocked" as const,
        owner: buyer,
        condition: `${firstOpen?.label ?? "An agenda item"} is not ready.`,
        record: "Do not record external approval from this receipt.",
        nextAction: `Repair ${firstOpen?.label ?? "the open agenda item"} first.`,
        evidence: firstOpen?.evidence ?? closeAsk
      },
      {
        id: "hold",
        label: "Hold internal",
        status: "ready" as const,
        owner,
        condition: "External buyer sharing must wait for the open repair.",
        record: "Hold the buyer decision internally.",
        nextAction: firstOpen ? `${firstOpen.owner}: ${firstOpen.outcome}` : "Close the open agenda item.",
        evidence: closeAsk
      },
      {
        id: "reject",
        label: "Reject current package",
        status: "attention" as const,
        owner,
        condition: "The open blocker invalidates the current buyer package.",
        record: "Reject this package and rebuild before another buyer call.",
        nextAction: "Create a new receipt after the repair is accepted.",
        evidence: meetingGoal
      }
    ]
  };
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function formatUtcCalendarDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function buildNextBuyerHoldRange(reference = new Date()) {
  const start = new Date(reference.getTime());
  start.setUTCDate(start.getUTCDate() + 2);
  start.setUTCHours(1, 0, 0, 0);

  const day = start.getUTCDay();
  if (day === 6) start.setUTCDate(start.getUTCDate() + 2);
  if (day === 0) start.setUTCDate(start.getUTCDate() + 1);

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return { start, end };
}

function calendarUidSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function buildBuyerPilotMeetingCalendarHold({
  status,
  pilotOffer,
  instruction,
  body,
  firstOpen
}: {
  status: BuyerProofChainStatus;
  pilotOffer: string;
  instruction: string;
  body: string[];
  firstOpen: BuyerPilotMeetingAgendaItem | undefined;
}): BuyerPilotMeetingCalendarHold {
  const title = status === "ready" ? `Buyer pilot approval call: ${pilotOffer}` : `Internal buyer-call repair: ${firstOpen?.label ?? "open agenda item"}`;
  const filename = status === "ready" ? "buyer-pilot-approval-call.ics" : "internal-buyer-call-repair.ics";
  const durationMinutes = 30;
  const { start, end } = buildNextBuyerHoldRange();
  const stamp = formatUtcCalendarDate(new Date());
  const description = [instruction, "", ...body].join("\n");
  const uid = `buyer-pilot-${status}-${calendarUidSlug(title) || "hold"}@a2a-agent-marketplace`;
  const icsText = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A2A Agent Marketplace//Buyer Pilot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatUtcCalendarDate(start)}`,
    `DTEND:${formatUtcCalendarDate(end)}`,
    `SUMMARY:${escapeCalendarText(title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return {
    status,
    title,
    filename,
    durationMinutes,
    icsText,
    href: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsText)}`
  };
}

function buildBuyerPilotMeetingFollowUp({
  status,
  pilotOffer,
  closeAsk,
  meetingGoal,
  agenda,
  objections,
  firstOpen
}: {
  status: BuyerProofChainStatus;
  pilotOffer: string;
  closeAsk: string;
  meetingGoal: string;
  agenda: BuyerPilotMeetingAgendaItem[];
  objections: BuyerPilotMeetingObjection[];
  firstOpen: BuyerPilotMeetingAgendaItem | undefined;
}): BuyerPilotMeetingFollowUp {
  const subject = status === "ready" ? `Buyer pilot next step: ${pilotOffer}` : `Internal repair before buyer call: ${firstOpen?.label ?? "open agenda item"}`;
  const instruction =
    status === "ready"
      ? "Send after the buyer call with the pilot contract, proof room, and meeting brief attached."
      : `Do not send externally. Use this to close ${firstOpen?.label ?? "the open agenda item"} first.`;
  const body = [
    meetingGoal,
    `Close ask: ${closeAsk}`,
    `Agenda outcomes: ${agenda.map((item) => `${item.label} - ${item.outcome}`).join(" | ")}`,
    `Buyer objections: ${objections.map((objection) => `${objection.question} ${objection.answer}`).join(" | ")}`
  ];
  const calendar = buildBuyerPilotMeetingCalendarHold({ status, pilotOffer, instruction, body, firstOpen });
  const copyText = [`Subject: ${subject}`, "", instruction, "", ...body].join("\n");
  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent([instruction, "", ...body].join("\n"))}`;

  return {
    status,
    subject,
    instruction,
    body,
    calendar,
    copyText,
    mailtoHref
  };
}

function buildBuyerPilotMeetingDecisionReceipt({
  status,
  buyer,
  pilotOffer,
  closeAsk,
  meetingGoal,
  agenda,
  followUp,
  firstOpen
}: {
  status: BuyerProofChainStatus;
  buyer: string;
  pilotOffer: string;
  closeAsk: string;
  meetingGoal: string;
  agenda: BuyerPilotMeetingAgendaItem[];
  followUp: BuyerPilotMeetingFollowUp;
  firstOpen: BuyerPilotMeetingAgendaItem | undefined;
}): BuyerPilotMeetingDecisionReceipt {
  const decision = status === "ready" ? "approve-pilot" : "repair-before-buyer";
  const owner = status === "ready" ? buyer : firstOpen?.owner ?? "Internal owner";
  const headline = status === "ready" ? `Record buyer approval for ${pilotOffer}` : `Record repair before buyer sharing: ${firstOpen?.label ?? "open agenda item"}`;
  const summary =
    status === "ready"
      ? `${buyer} can approve, hold, or reject the pilot from the attached agenda, follow-up, and calendar hold.`
      : `${owner} must close the open meeting item before this receipt can be forwarded externally.`;
  const receiptItems: BuyerPilotMeetingDecisionReceiptItem[] = [
    {
      id: "close-ask",
      label: "Close ask",
      status,
      owner,
      action: status === "ready" ? "Record the buyer approve, hold, or reject decision against this ask." : "Do not record external approval until the first open agenda item is repaired.",
      evidence: closeAsk,
      href: firstOpen?.href ?? agenda[0]?.href ?? "#buyer-proof-command"
    },
    ...agenda.map((item): BuyerPilotMeetingDecisionReceiptItem => ({
      id: item.id,
      label: item.label,
      status: item.status,
      owner: item.owner,
      action: item.status === "ready" ? `Confirm ${item.label.toLowerCase()} in the meeting outcome.` : `Repair ${item.label.toLowerCase()} before buyer sharing.`,
      evidence: item.evidence,
      href: item.href
    })),
    {
      id: "follow-up",
      label: "Follow-up email",
      status: followUp.status,
      owner: "Seller operator",
      action: followUp.instruction,
      evidence: followUp.subject,
      href: followUp.mailtoHref
    },
    {
      id: "calendar-hold",
      label: "Calendar hold",
      status: followUp.calendar.status,
      owner: "Seller operator",
      action: `Hold ${followUp.calendar.durationMinutes} minutes for the next buyer decision step.`,
      evidence: followUp.calendar.filename,
      href: followUp.calendar.href
    }
  ];
  const receiptCore = {
    decision,
    status,
    buyer,
    pilotOffer,
    closeAsk,
    meetingGoal,
    items: receiptItems.map(({ id, label, status: itemStatus, owner, action, evidence }) => ({ id, label, status: itemStatus, owner, action, evidence }))
  };
  const proofChecksum = stableReceiptHash(JSON.stringify(receiptCore));
  const receiptId = `buyer-pilot-meeting-${decision}-${proofChecksum}`;
  const taskLedger = buildBuyerPilotMeetingTaskLedger({ receiptId, decision, items: receiptItems });
  const outcomeRouting = buildBuyerPilotMeetingOutcomeRoutes({
    status,
    buyer,
    owner,
    pilotOffer,
    closeAsk,
    meetingGoal,
    followUp,
    firstOpen
  });
  const partial: Omit<BuyerPilotMeetingDecisionReceipt, "copyText" | "exportMarkdown" | "href"> = {
    status,
    decision,
    receiptId,
    checksumAlgorithm: "fnv1a32",
    proofChecksum,
    headline,
    summary,
    owner,
    items: receiptItems,
    recommendedOutcome: outcomeRouting.recommendedOutcome,
    outcomeRoutes: outcomeRouting.outcomeRoutes,
    taskLedger
  };
  const exportMarkdown = buildBuyerPilotMeetingDecisionReceiptMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

export function buildBuyerPilotMeetingBriefSnapshot({
  decisionBrief,
  pilotContract,
  operatingSnapshot,
  trustSnapshot,
  publicDecisionPath
}: {
  decisionBrief: Pick<BuyerPilotDecisionBriefSnapshot, "status" | "questions" | "primaryAction">;
  pilotContract: Pick<BuyerPilotContractSnapshot, "status" | "buyer" | "pilotOffer" | "proofLine" | "stopRule" | "firstAction" | "closeChecklist">;
  operatingSnapshot: Pick<BuyerOperatingPlanSnapshot, "status" | "headline" | "firstAction" | "commitments" | "expansionCriteria" | "riskAdjustedMonthlyValueYen">;
  trustSnapshot: Pick<BuyerTrustSnapshot, "status" | "headline" | "firstAction" | "dataBoundary" | "trustScore">;
  publicDecisionPath: Pick<BuyerPublicDecisionPath, "status" | "headline" | "buyerLine" | "firstAction">;
}): BuyerPilotMeetingBriefSnapshot {
  const questionById = new Map(decisionBrief.questions.map((question) => [question.id, question]));
  const closeItemById = new Map(pilotContract.closeChecklist.map((item) => [item.id, item]));
  const scopeQuestion = questionById.get("scope");
  const priceQuestion = questionById.get("price");
  const expansionQuestion = questionById.get("expansion");
  const proofTrustStatus = worstProofChainStatus([trustSnapshot.status, publicDecisionPath.status, expansionQuestion?.status ?? "blocked"]);
  const agenda: BuyerPilotMeetingAgendaItem[] = [
    {
      id: "scope",
      label: "Confirm pilot scope",
      status: scopeQuestion?.status ?? "blocked",
      owner: closeItemById.get("buyer-scope")?.owner ?? pilotContract.buyer,
      outcome: scopeQuestion?.answer ?? "Confirm the first buyer workflow before discussing price.",
      evidence: scopeQuestion?.evidence ?? publicDecisionPath.buyerLine,
      href: scopeQuestion?.href ?? closeItemById.get("buyer-scope")?.href ?? decisionBrief.primaryAction.href
    },
    {
      id: "price",
      label: "Approve first commitment",
      status: priceQuestion?.status ?? "blocked",
      owner: closeItemById.get("commercial-boundary")?.owner ?? "Buyer sponsor",
      outcome: priceQuestion?.answer ?? pilotContract.pilotOffer,
      evidence: priceQuestion?.evidence ?? pilotContract.proofLine,
      href: priceQuestion?.href ?? closeItemById.get("commercial-boundary")?.href ?? pilotContract.firstAction.href
    },
    {
      id: "proof-trust",
      label: "Inspect proof and trust",
      status: proofTrustStatus,
      owner: closeItemById.get("trust-boundary")?.owner ?? "Trust reviewer",
      outcome: `${trustSnapshot.headline}. ${publicDecisionPath.headline}`,
      evidence: `${trustSnapshot.trustScore}/100 trust score; ${trustSnapshot.dataBoundary}. ${pilotContract.proofLine}`,
      href: proofTrustStatus === "ready" ? publicDecisionPath.firstAction.href : trustSnapshot.firstAction.href
    },
    {
      id: "day-30",
      label: "Agree day-30 decision",
      status: operatingSnapshot.status,
      owner: operatingSnapshot.commitments[0]?.owner ?? closeItemById.get("renewal-decision")?.owner ?? "Buyer sponsor",
      outcome: operatingSnapshot.headline,
      evidence: operatingSnapshot.expansionCriteria[0] ?? `Risk-adjusted value: ${yen(operatingSnapshot.riskAdjustedMonthlyValueYen)}.`,
      href: operatingSnapshot.firstAction.href
    }
  ];
  const status = worstProofChainStatus([decisionBrief.status, pilotContract.status, ...agenda.map((item) => item.status)]);
  const firstOpen = agenda.find((item) => item.status === "blocked") ?? agenda.find((item) => item.status === "attention");
  const readyCount = agenda.filter((item) => item.status === "ready").length;
  const closeAsk =
    status === "ready"
      ? `Approve ${pilotContract.pilotOffer} with the stop rule: ${pilotContract.stopRule}`
      : `Keep this internal until ${firstOpen?.label ?? "the open buyer meeting item"} is ready.`;
  const meetingGoal = firstOpen
    ? `${firstOpen.owner} owns the next repair: ${compactProofText(firstOpen.evidence, firstOpen.outcome, 180)}`
    : "Run one buyer call that confirms scope, price, proof access, trust boundary, and the day-30 continue/revise/stop decision.";
  const objections: BuyerPilotMeetingObjection[] = [
    {
      id: "why-now",
      question: "Why should we act now?",
      answer: status === "ready" ? "The scope, price, proof, trust boundary, and operating owner are all inspectable before approval." : "Do not ask for approval until the open agenda item is repaired.",
      evidence: publicDecisionPath.buyerLine
    },
    {
      id: "value-risk",
      question: "What happens if value drops?",
      answer: pilotContract.stopRule,
      evidence: operatingSnapshot.expansionCriteria[0] ?? `Risk-adjusted value: ${yen(operatingSnapshot.riskAdjustedMonthlyValueYen)}.`
    },
    {
      id: "proof-access",
      question: "Can our reviewer inspect the proof?",
      answer: publicDecisionPath.status === "ready" ? "Yes. Keep the proof room, audit, and contract attached to the meeting follow-up." : "Not yet. The proof path remains blocked until the public artifact is fixed.",
      evidence: `${publicDecisionPath.headline}. ${trustSnapshot.dataBoundary}.`
    }
  ];
  const followUp = buildBuyerPilotMeetingFollowUp({
    status,
    pilotOffer: pilotContract.pilotOffer,
    closeAsk,
    meetingGoal,
    agenda,
    objections,
    firstOpen
  });
  const decisionReceipt = buildBuyerPilotMeetingDecisionReceipt({
    status,
    buyer: pilotContract.buyer,
    pilotOffer: pilotContract.pilotOffer,
    closeAsk,
    meetingGoal,
    agenda,
    followUp,
    firstOpen
  });
  const partial: Omit<BuyerPilotMeetingBriefSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    headline: firstOpen ? `${firstOpen.label} must be fixed before the buyer call` : "Buyer pilot meeting is ready to run",
    meetingGoal,
    readyCount,
    agendaTotal: agenda.length,
    primaryAction: firstOpen
      ? {
          id: "primary",
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: chainHrefIsExternal(firstOpen.href)
        }
      : pilotContract.firstAction,
    closeAsk,
    agenda,
    objections,
    followUp,
    decisionReceipt
  };
  const exportMarkdown = buildBuyerPilotMeetingBriefMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function BuyerPilotAssemblyLinePanel({ snapshot }: { snapshot: BuyerPilotAssemblyLineSnapshot }) {
  return (
    <section className={cx("buyer-pilot-assembly", `is-${snapshot.status}`)} aria-label="Buyer pilot assembly line">
      <div className="buyer-pilot-assembly-head">
        <span>Pilot assembly line</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.instruction}</p>
        <div>
          <a className="buyer-pilot-assembly-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            <RouteLockStatusIcon status={snapshot.status} />
            {snapshot.primaryAction.label}
          </a>
          <small>
            {snapshot.readyCount}/{snapshot.stageTotal} ready, {snapshot.attentionCount} review, {snapshot.blockedCount} blocked
          </small>
        </div>
      </div>
      <div className="buyer-pilot-assembly-stages">
        {snapshot.stages.map((stage) => (
          <a key={stage.id} className={stage.status} href={stage.href} {...routeActionAttrs({ label: stage.label, href: stage.href, external: chainHrefIsExternal(stage.href) })}>
            <span>
              <RouteLockStatusIcon status={stage.status} />
              {stage.label}
            </span>
            <strong>{stage.title}</strong>
            <p>{stage.detail}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function BuyerPilotDecisionBriefPanel({ snapshot, onCopyText }: { snapshot: BuyerPilotDecisionBriefSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied answers" : copyStatus === "failed" ? "Copy failed" : "Copy answers";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyDecisionBrief = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-pilot-decision-brief", `is-${snapshot.status}`)} aria-label="Buyer decision brief">
      <div className="buyer-pilot-decision-head">
        <span>Buyer decision brief</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
        <div className="buyer-pilot-decision-actions" aria-label="Buyer decision brief actions">
          <a className="buyer-pilot-decision-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            <Search size={14} />
            {snapshot.primaryAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyDecisionBrief}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-decision-brief.md">
            <Download size={14} />
            Export brief
          </a>
        </div>
      </div>
      <aside className="buyer-pilot-decision-proof" aria-label="Buyer decision proof summary">
        <span>{snapshot.readyCount}/{snapshot.questionTotal} answers ready</span>
        <strong>{snapshot.pilotOffer}</strong>
        <p>{snapshot.proofLine}</p>
        <small>{snapshot.stopRule}</small>
      </aside>
      <div className="buyer-pilot-decision-questions" aria-label="Buyer questions with evidence">
        {snapshot.questions.map((question) => (
          <a key={question.id} className={question.status} href={question.href} {...routeActionAttrs({ label: question.label, href: question.href, external: chainHrefIsExternal(question.href) })}>
            <span>
              <RouteLockStatusIcon status={question.status} />
              {question.label}
            </span>
            <strong>{question.question}</strong>
            <p>{question.answer}</p>
            <small>{question.evidence}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function BuyerPilotMeetingBriefPanel({ snapshot, onCopyText }: { snapshot: BuyerPilotMeetingBriefSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [followUpCopyStatus, setFollowUpCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [receiptCopyStatus, setReceiptCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied meeting" : copyStatus === "failed" ? "Copy failed" : "Copy meeting";
  const followUpCopyLabel = followUpCopyStatus === "copied" ? "Copied follow-up" : followUpCopyStatus === "failed" ? "Copy failed" : "Copy follow-up";
  const receiptCopyLabel = receiptCopyStatus === "copied" ? "Copied receipt" : receiptCopyStatus === "failed" ? "Copy failed" : "Copy receipt";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (followUpCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setFollowUpCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [followUpCopyStatus]);

  useEffect(() => {
    if (receiptCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setReceiptCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [receiptCopyStatus]);

  const copyMeetingBrief = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  const copyMeetingFollowUp = async () => {
    const copied = await onCopyText(snapshot.followUp.copyText);
    setFollowUpCopyStatus(copied ? "copied" : "failed");
  };

  const copyMeetingDecisionReceipt = async () => {
    const copied = await onCopyText(snapshot.decisionReceipt.copyText);
    setReceiptCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-pilot-meeting-brief", `is-${snapshot.status}`)} aria-label="Buyer pilot meeting brief">
      <div className="buyer-pilot-meeting-head">
        <span>Buyer meeting brief</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.meetingGoal}</p>
        <div className="buyer-pilot-meeting-actions" aria-label="Buyer meeting brief actions">
          <a className="buyer-pilot-meeting-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            <Play size={14} />
            {snapshot.primaryAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyMeetingBrief}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-pilot-meeting-brief.md">
            <Download size={14} />
            Export meeting
          </a>
        </div>
      </div>
      <aside className="buyer-pilot-meeting-close" aria-label="Buyer meeting close ask">
        <span>{snapshot.readyCount}/{snapshot.agendaTotal} agenda items ready</span>
        <strong>{snapshot.closeAsk}</strong>
      </aside>
      <div className="buyer-pilot-meeting-agenda" aria-label="Buyer meeting agenda">
        {snapshot.agenda.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: chainHrefIsExternal(item.href) })}>
            <span>
              <RouteLockStatusIcon status={item.status} />
              {item.label}
            </span>
            <strong>{item.outcome}</strong>
            <p>{item.evidence}</p>
            <small>{item.owner}</small>
          </a>
        ))}
      </div>
      <div className="buyer-pilot-meeting-objections" aria-label="Buyer objection answers">
        {snapshot.objections.map((objection) => (
          <article key={objection.id}>
            <span>{objection.question}</span>
            <strong>{objection.answer}</strong>
            <p>{objection.evidence}</p>
          </article>
        ))}
      </div>
      <div className={cx("buyer-pilot-meeting-followup", snapshot.followUp.status)} aria-label="Buyer meeting follow-up draft">
        <div>
          <span>Follow-up draft</span>
          <strong>{snapshot.followUp.subject}</strong>
          <p>{snapshot.followUp.instruction}</p>
          <div className="buyer-pilot-meeting-followup-actions" aria-label="Buyer meeting follow-up actions">
            <button className={cx("icon-link", followUpCopyStatus === "copied" && "is-confirmed", followUpCopyStatus === "failed" && "is-risk")} type="button" onClick={copyMeetingFollowUp}>
              <ClipboardCheck size={14} />
              {followUpCopyLabel}
            </button>
            <a className="icon-link" href={snapshot.followUp.mailtoHref}>
              <Mail size={14} />
              Open email
            </a>
            <a className="icon-link" href={snapshot.followUp.calendar.href} download={snapshot.followUp.calendar.filename}>
              <Download size={14} />
              Download hold
            </a>
          </div>
        </div>
        <div className="buyer-pilot-meeting-followup-body">
          {snapshot.followUp.body.slice(0, 4).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <div className={cx("buyer-pilot-meeting-receipt", snapshot.decisionReceipt.status)} aria-label="Buyer pilot meeting decision receipt">
        <div className="buyer-pilot-meeting-receipt-main">
          <span>Decision receipt</span>
          <strong>{snapshot.decisionReceipt.headline}</strong>
          <p>{snapshot.decisionReceipt.summary}</p>
          <small>
            Receipt {snapshot.decisionReceipt.receiptId}, checksum {snapshot.decisionReceipt.checksumAlgorithm}:{snapshot.decisionReceipt.proofChecksum}
          </small>
        </div>
        <div className="buyer-pilot-meeting-receipt-items" aria-label="Decision receipt items">
          {snapshot.decisionReceipt.items.slice(0, 4).map((item) => (
            <article key={item.id} className={item.status}>
              <span>
                <RouteLockStatusIcon status={item.status} />
                {item.label}
              </span>
              <strong>{item.owner}</strong>
              <p>{item.action}</p>
            </article>
          ))}
        </div>
        <div className="buyer-pilot-meeting-outcomes" aria-label="Buyer meeting outcome routing">
          {snapshot.decisionReceipt.outcomeRoutes.map((route) => (
            <article key={route.id} className={cx(route.status, route.id === snapshot.decisionReceipt.recommendedOutcome && "recommended")}>
              <span>
                <RouteLockStatusIcon status={route.status} />
                {route.label}
              </span>
              <strong>{route.record}</strong>
              <p>{route.nextAction}</p>
            </article>
          ))}
        </div>
        <div className="buyer-pilot-meeting-receipt-actions" aria-label="Decision receipt actions">
          <button className={cx("icon-link", receiptCopyStatus === "copied" && "is-confirmed", receiptCopyStatus === "failed" && "is-risk")} type="button" onClick={copyMeetingDecisionReceipt}>
            <ClipboardCheck size={14} />
            {receiptCopyLabel}
          </button>
          <a className="icon-link" href={snapshot.decisionReceipt.href} download="buyer-pilot-meeting-receipt.md">
            <Download size={14} />
            Export receipt
          </a>
          <a className="icon-link" href={snapshot.decisionReceipt.taskLedger.href} download={snapshot.decisionReceipt.taskLedger.filename}>
            <Download size={14} />
            Export tasks
          </a>
        </div>
      </div>
    </section>
  );
}

export function buildBuyerPublicDecisionPathMarkdown(path: Omit<BuyerPublicDecisionPath, "copyText" | "exportMarkdown">) {
  const artifacts = path.artifacts
    .map((artifact) =>
      [
        `- ${artifact.label}: ${artifact.status} | ${artifact.value} | ${artifact.href}`,
        `  Proof: ${compactProofText(artifact.proof, "No proof attached.", 220)}`
      ].join("\n")
    )
    .join("\n");
  const guardrails = path.guardrails.map((guardrail) => `- ${guardrail}`).join("\n");

  return [
    "# Public buyer decision path",
    "",
    `Decision: ${path.decision}`,
    `Status: ${path.status}`,
    `Headline: ${path.headline}`,
    `Buyer line: ${path.buyerLine}`,
    `First action: ${path.firstAction.label} (${path.firstAction.href})`,
    "",
    "## Artifacts",
    artifacts,
    "",
    "## Guardrails",
    guardrails
  ].join("\n").trim();
}

export function buildBuyerPublicDecisionPath({
  snapshot,
  proofPath
}: {
  snapshot: BuyerProofChainSnapshot;
  proofPath: BuyerProofPathRow[];
}): BuyerPublicDecisionPath {
  const gateById = new Map(snapshot.gates.map((gate) => [gate.id, gate]));
  const rowById = new Map(proofPath.map((row) => [row.id, row]));
  const actionById = new Map(snapshot.actions.map((action) => [action.id, action]));
  const workflow = rowById.get("work-order");
  const value = rowById.get("value-model");
  const measured = rowById.get("measured-run");
  const decisionRow = rowById.get("decision-proof");
  const decision = publicDecisionFrom(snapshot);
  const artifacts: BuyerPublicDecisionArtifact[] = [
    {
      id: "workflow-intake",
      label: "Workflow intake",
      status: gateById.get("workflow-scope")?.status ?? workflow?.status ?? "blocked",
      value: workflow?.title ?? gateById.get("workflow-scope")?.value ?? "scope missing",
      proof: workflow?.detail ?? gateById.get("workflow-scope")?.evidence ?? "Complete the buyer workflow before sharing.",
      href: workflow?.href ?? actionById.get("workflow-intake")?.href ?? "#marketplace-workbench"
    },
    {
      id: "value-report",
      label: "Value report",
      status: gateById.get("value-case")?.status ?? value?.status ?? "blocked",
      value: value?.title ?? gateById.get("value-case")?.value ?? "value missing",
      proof: value?.detail ?? gateById.get("value-case")?.evidence ?? "Build the buyer value case.",
      href: value?.href ?? "#buyer-value-simulator"
    },
    {
      id: "delivery-memo",
      label: "Delivery memo",
      status: gateById.get("measured-run")?.status ?? measured?.status ?? "blocked",
      value: measured?.title ?? gateById.get("measured-run")?.value ?? "run missing",
      proof: measured?.detail ?? gateById.get("measured-run")?.evidence ?? "Attach measured pilot proof.",
      href: measured?.href ?? actionById.get("delivery-memo")?.href ?? "#buyer-pilot-measured-run"
    },
    {
      id: "proof-audit",
      label: "Proof audit",
      status: gateById.get("live-proof-audit")?.status ?? "blocked",
      value: gateById.get("live-proof-audit")?.value ?? "not checked",
      proof: gateById.get("live-proof-audit")?.evidence ?? "Run live proof verification before sending.",
      href: actionById.get("live-proof-audit")?.href ?? gateById.get("live-proof-audit")?.href ?? "#launch-evidence-console"
    },
    {
      id: "launch-room",
      label: "Launch room",
      status: gateById.get("buyer-decision")?.status ?? decisionRow?.status ?? snapshot.status,
      value: decisionRow?.title ?? gateById.get("buyer-decision")?.value ?? snapshot.verdict,
      proof: decisionRow?.detail ?? gateById.get("buyer-decision")?.evidence ?? snapshot.instruction,
      href: decisionRow?.href ?? actionById.get("launch-room")?.href ?? snapshot.primaryAction.href
    },
    {
      id: "decision-receipt",
      label: "Decision receipt",
      status: gateById.get("buyer-decision")?.status ?? decisionRow?.status ?? snapshot.status,
      value: decision,
      proof: "Records the continue, revise, or stop decision with a checksum-verifiable payload.",
      href: actionById.get("decision-receipt")?.href ?? decisionRow?.href ?? snapshot.primaryAction.href
    }
  ];
  const firstOpen = artifacts.find((artifact) => artifact.status === "blocked") ?? artifacts.find((artifact) => artifact.status === "attention");
  const buyerLine = [workflow?.title, value?.title, measured?.title, decisionRow?.title].filter(Boolean).join(" -> ");
  const guardrails = [
    "Do not send externally while any public decision artifact is blocked.",
    "Do not cite measured value until the measured run artifact is ready or under explicit sponsor review.",
    "Keep the proof audit, trust manifest, launch room, and decision receipt attached to every external handoff."
  ];

  const publicPath: Omit<BuyerPublicDecisionPath, "copyText" | "exportMarkdown"> = {
    status: snapshot.status,
    decision,
    headline: publicDecisionHeadline(decision, firstOpen),
    buyerLine: buyerLine || snapshot.instruction,
    firstAction: firstOpen
      ? {
          id: "primary",
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: chainHrefIsExternal(firstOpen.href)
        }
      : snapshot.primaryAction,
    artifacts,
    guardrails
  };
  const exportMarkdown = buildBuyerPublicDecisionPathMarkdown(publicPath);

  return {
    ...publicPath,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function focusPlanHeadline(status: BuyerProofChainStatus, firstOpen: BuyerProofFocusStage | undefined) {
  if (status === "ready") return "Buyer pilot path is ready to run";
  if (firstOpen?.status === "blocked") return `Work ${firstOpen.label.toLowerCase()} before buyer sharing`;
  if (firstOpen) return `Review ${firstOpen.label.toLowerCase()} before sending`;
  return "Review the buyer pilot path before sending";
}

function buildBuyerProofFocusPlanMarkdown(plan: Omit<BuyerProofFocusPlan, "copyText" | "exportMarkdown" | "taskCsv" | "taskCsvHref">) {
  const stages = plan.stages
    .map(
      (stage) =>
        `### ${stage.label}\nStatus: ${stage.status}\nMetric: ${stage.metric}\nAction: [${stage.action.label}](${compactBuyerExportHref(stage.action.href)})\nEvidence: ${stage.detail}`
    )
    .join("\n\n");

  return `# Buyer proof focus plan\n\nStatus: ${plan.status}\nHeadline: ${plan.headline}\nBuyer promise: ${plan.buyerPromise}\nPrimary action: [${plan.primaryAction.label}](${compactBuyerExportHref(plan.primaryAction.href)})\n\n## Focus stages\n${stages}\n\n## Rule\n- Do not share the buyer room until every blocked stage is resolved.`.trim();
}

function buildBuyerProofFocusTaskCsv(stages: BuyerProofFocusStage[]) {
  const rows = [
    ["stageId", "label", "status", "metric", "headline", "action", "evidence", "sourceHref"],
    ...stages.map((stage) => [
      stage.id,
      stage.label,
      stage.status,
      stage.metric,
      stage.headline,
      stage.action.label,
      stage.detail,
      compactBuyerExportHref(stage.action.href)
    ])
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function buildBuyerProofFocusPlan({
  proofChecklist,
  publicDecisionPath,
  sponsorAsk
}: {
  proofChecklist: BuyerOwnedProofChecklist;
  publicDecisionPath: BuyerPublicDecisionPath;
  sponsorAsk: BuyerSponsorAskSnapshot;
}): BuyerProofFocusPlan {
  const firstProofGap = proofChecklist.items.find((item) => item.status === "blocked") ?? proofChecklist.items.find((item) => item.status === "attention");
  const proofActionHref = firstProofGap?.href ?? publicDecisionPath.artifacts.find((artifact) => artifact.id === "proof-audit")?.href ?? publicDecisionPath.firstAction.href;
  const proofActionLabel = firstProofGap ? `${firstProofGap.status === "blocked" ? "Fix" : "Review"} ${firstProofGap.label}` : "Open proof audit";
  const stages: BuyerProofFocusStage[] = [
    {
      id: "proof-gaps",
      label: "Proof gaps",
      status: proofChecklist.status,
      metric: `${proofChecklist.readyCount}/${proofChecklist.totalCount} verified`,
      headline: proofChecklist.headline,
      detail: proofChecklist.primaryAction,
      action: {
        id: "live-proof-audit",
        label: proofActionLabel,
        href: proofActionHref,
        external: chainHrefIsExternal(proofActionHref)
      }
    },
    {
      id: "first-commitment",
      label: "First commitment",
      status: sponsorAsk.status,
      metric: sponsorAsk.recommendedAskYen > 0 ? yen(sponsorAsk.recommendedAskYen) : sponsorAsk.decision,
      headline: sponsorAsk.headline,
      detail: sponsorAsk.askInstruction,
      action: sponsorAsk.firstAction
    },
    {
      id: "buyer-room",
      label: "Buyer room",
      status: publicDecisionPath.status,
      metric: publicDecisionPath.decision,
      headline: publicDecisionPath.headline,
      detail: publicDecisionPath.buyerLine,
      action: publicDecisionPath.firstAction
    }
  ];
  const status = worstProofChainStatus(stages.map((stage) => stage.status));
  const firstOpen = stages.find((stage) => stage.status === "blocked") ?? stages.find((stage) => stage.status === "attention");
  const partial: Omit<BuyerProofFocusPlan, "copyText" | "exportMarkdown" | "taskCsv" | "taskCsvHref"> = {
    status,
    headline: focusPlanHeadline(status, firstOpen),
    buyerPromise: publicDecisionPath.buyerLine,
    primaryAction: firstOpen?.action ?? publicDecisionPath.firstAction,
    stages
  };
  const exportMarkdown = buildBuyerProofFocusPlanMarkdown(partial);
  const taskCsv = buildBuyerProofFocusTaskCsv(stages);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown,
    taskCsv,
    taskCsvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(taskCsv)}`
  };
}

function buildBuyerProofWorkflowReadiness({
  workOrder,
  buyerScenario,
  pilotRun
}: {
  workOrder: BuyerWorkOrderInput;
  buyerScenario: BuyerValueScenarioInput;
  pilotRun: PilotRunReceiptInput;
}): BuyerProofWorkflowReadiness {
  const request = workOrder.request.trim();
  const targetUser = workOrder.targetUser.trim();
  const successMetric = workOrder.successMetric.trim();
  const baseline = workOrder.currentBaseline.trim();
  const minutesSaved = Math.max(0, pilotRun.observedManualMinutes - pilotRun.observedAssistedMinutes);
  const acceptanceRate = pilotRun.acceptedTasks / Math.max(1, pilotRun.totalTasks);
  const monthlyManualHours = buyerScenario.cyclesPerMonth * buyerScenario.manualHoursPerCycle * (buyerScenario.adoptionRatePercent / 100);
  const hasScope = Boolean(targetUser && request.length >= 60 && successMetric.length >= 24 && baseline.length >= 24);
  const hasUsefulValue = monthlyManualHours >= 20 && buyerScenario.teamSize >= 3;
  const hasMeasuredRun = minutesSaved >= 30 && acceptanceRate >= 0.6;
  const hasPublicProof = isBuyerFacingProofUrl(workOrder.evidenceUrl || pilotRun.evidenceUrl);

  if (workOrder.dataSensitivity === "restricted") {
    return {
      decision: "do-not-share",
      headline: "Restricted workflow is not buyer-shareable",
      nextAction: "Redact restricted inputs or keep this packet internal."
    };
  }

  if (!hasScope || !hasUsefulValue || !hasMeasuredRun) {
    return {
      decision: "needs-scope",
      headline: "Tighten the workflow before assigning agents",
      nextAction: "Name the buyer, bounded job, success metric, baseline, and measured replay."
    };
  }

  if (workOrder.dataSensitivity === "internal" || !hasPublicProof) {
    return {
      decision: "needs-proof",
      headline: "Workflow is useful, proof needs closure",
      nextAction: "Attach public-safe evidence before external sharing."
    };
  }

  return {
    decision: "pilot-ready",
    headline: "Workflow is concrete enough for sponsor review",
    nextAction: "Apply the brief and open the launch room for a continue, revise, or stop decision."
  };
}

function worstProofChainStatus(statuses: BuyerProofChainStatus[]): BuyerProofChainStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function isStarterProofUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.pathname.startsWith("/sample/") || host === "sample.example" || host.endsWith(".sample.example");
  } catch {
    return /\/sample\//i.test(value);
  }
}

function buyerProofSlotValue(workspace: WorkspaceDraft, id: BuyerOwnedProofSlotId) {
  if (id === "pilotEvidenceUrl") return workspace.pilotRun.evidenceUrl;
  if (id === "workOrderEvidenceUrl") return workspace.buyerWorkOrder.evidenceUrl;
  return workspace[id];
}

function sameBuyerProofSlotValue(left: string, right: string) {
  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function isReferenceStarterProofSlot(id: BuyerOwnedProofSlotId) {
  return id === "targetUrl" || id === "pilotEvidenceUrl" || id === "workOrderEvidenceUrl";
}

function proofChecklistValue(status: BuyerProofChainStatus, fallback: string) {
  if (status === "ready") return "Verified";
  if (status === "attention") return "Needs review";
  return fallback;
}

export function buildBuyerOwnedProofChecklist({
  workspace,
  referenceWorkspace,
  proofVerification,
  workflowIntakeHref,
  currentAuditHref
}: {
  workspace: WorkspaceDraft;
  referenceWorkspace?: WorkspaceDraft;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  workflowIntakeHref: string;
  currentAuditHref: string;
}): BuyerOwnedProofChecklist {
  const slots: Array<{ id: BuyerOwnedProofSlotId; label: string }> = [
    { id: "targetUrl", label: "Live product" },
    { id: "protopediaUrl", label: "ProtoPedia story" },
    { id: "videoUrl", label: "Walkthrough video" },
    { id: "pilotEvidenceUrl", label: "Pilot receipt" },
    { id: "workOrderEvidenceUrl", label: "Work order proof" }
  ];
  const resultById = new Map(proofVerification?.results.map((result) => [result.id, result]) ?? []);
  const items = slots.map((slot): BuyerOwnedProofChecklistItem => {
    const value = buyerProofSlotValue(workspace, slot.id);
    const referenceValue = referenceWorkspace ? buyerProofSlotValue(referenceWorkspace, slot.id) : "";
    const isReferenceValue = isReferenceStarterProofSlot(slot.id) && sameBuyerProofSlotValue(value, referenceValue);
    const liveResult = resultById.get(slot.id);
    if (!value.trim()) {
      return {
        ...slot,
        status: "blocked",
        value: "Missing",
        evidence: `${slot.label} has not been attached yet.`,
        action: `Paste a buyer-owned ${slot.label.toLowerCase()} URL.`,
        href: workflowIntakeHref
      };
    }
    if (isReferenceValue || isStarterProofUrl(value)) {
      return {
        ...slot,
        status: "blocked",
        value: "Reference URL",
        evidence: `${slot.label} still points at a reference artifact.`,
        action: "Replace it with proof from the buyer workflow.",
        href: workflowIntakeHref
      };
    }
    if (!isBuyerFacingProofUrl(value)) {
      return {
        ...slot,
        status: "blocked",
        value: "Not public",
        evidence: `${slot.label} is not a public HTTPS URL.`,
        action: "Use an HTTPS URL an external reviewer can open.",
        href: workflowIntakeHref
      };
    }
    if (!liveResult) {
      return {
        ...slot,
        status: "attention",
        value: "Attached",
        evidence: `${slot.label} is public-shaped but has not been checked live in this workspace.`,
        action: "Run live proof verification.",
        href: currentAuditHref
      };
    }
    const status: BuyerProofChainStatus = liveResult.status === "pass" ? "ready" : liveResult.status === "watch" ? "attention" : "blocked";
    return {
      ...slot,
      status,
      value: proofChecklistValue(status, "Blocked"),
      evidence: liveResult.evidence,
      action: liveResult.action,
      href: status === "ready" ? currentAuditHref : workflowIntakeHref
    };
  });
  const status = worstProofChainStatus(items.map((item) => item.status));
  const firstOpen = items.find((item) => item.status !== "ready");
  const readyCount = items.filter((item) => item.status === "ready").length;
  const attentionCount = items.filter((item) => item.status === "attention").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const headline =
    status === "ready"
      ? "Buyer-owned proof is verified"
      : blockedCount > 0
        ? "Close buyer-owned proof gaps before sharing"
        : "Run live verification on buyer-owned proof";
  return {
    status,
    headline,
    readyCount,
    attentionCount,
    blockedCount,
    totalCount: items.length,
    primaryAction: firstOpen ? `${firstOpen.label}: ${firstOpen.action}` : "Keep the proof audit fresh while sharing.",
    items
  };
}

function proofChainHeadline(status: BuyerProofChainStatus, verdict: HomepageRouteLock["verdict"], firstBlocked: BuyerProofChainGate | undefined, firstAttention: BuyerProofChainGate | undefined) {
  if (status === "ready" && verdict === "send") return "This proof chain is ready to share with a buyer";
  if (firstBlocked) return `Hold sharing until ${firstBlocked.label.toLowerCase()} is repaired`;
  if (firstAttention) return `Sponsor review should clear ${firstAttention.label.toLowerCase()} before sending`;
  return "Review the buyer proof chain before sending";
}

function proofChainInstruction(status: BuyerProofChainStatus, firstBlocked: BuyerProofChainGate | undefined, firstAttention: BuyerProofChainGate | undefined, lock: HomepageRouteLock) {
  if (status === "ready") return "Workflow scope, value, measured run, live proof, and buyer decision are aligned in the current workspace.";
  if (firstBlocked) return `${firstBlocked.label}: ${firstBlocked.evidence}`;
  if (firstAttention) return `${firstAttention.label}: ${firstAttention.evidence}`;
  return lock.instruction;
}

export function buildBuyerProofChainSnapshot({
  lock,
  workflowReadiness,
  buyerScenario,
  measuredRunSummary,
  workflowIntakeHref,
  valueReportHref,
  deliveryMemoHref,
  currentAuditHref,
  trustManifestHref,
  decisionReceiptHref,
  launchRoomHref
}: {
  lock: HomepageRouteLock;
  workflowReadiness: BuyerProofWorkflowReadiness;
  buyerScenario: BuyerValueScenario;
  measuredRunSummary: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>;
  workflowIntakeHref: string;
  valueReportHref: string;
  deliveryMemoHref: string;
  currentAuditHref: string;
  trustManifestHref: string;
  decisionReceiptHref: string;
  launchRoomHref: string;
}): BuyerProofChainSnapshot {
  const liveProofCheck = lock.checks.find((check) => check.id === "live-proof");
  const workflowStatus = workflowIntakeChainStatus(workflowReadiness.decision);
  const valueStatus = buyerValueChainStatus(buyerScenario.readiness);
  const measuredStatus = measuredRunChainStatus(measuredRunSummary.readiness);
  const gates: BuyerProofChainGate[] = [
    {
      id: "workflow-scope",
      label: "Workflow scope",
      status: workflowStatus,
      value: workflowReadiness.decision,
      evidence: `${workflowReadiness.headline}. ${workflowReadiness.nextAction}`,
      href: workflowIntakeHref
    },
    {
      id: "value-case",
      label: "Value case",
      status: valueStatus,
      value: `${yen(buyerScenario.monthlyGrossValueYen)} / mo`,
      evidence: `${buyerScenario.readiness}, ${buyerScenario.paybackDays}d payback. ${buyerScenario.hardTruth}`,
      href: valueReportHref
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: measuredStatus,
      value: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run`,
      evidence: `${measuredRunSummary.headline}. ${measuredRunSummary.acceptanceRatePercent}% accepted, ${yen(measuredRunSummary.measuredMonthlyValueYen)} measured monthly value.`,
      href: deliveryMemoHref
    },
    {
      id: "live-proof-audit",
      label: "Live proof audit",
      status: liveProofCheck?.status ?? "blocked",
      value: liveProofCheck?.value ?? "not checked",
      evidence: liveProofCheck ? `${liveProofCheck.evidence} Open the audit to see the repair queue.` : "Live proof reachability has not been checked yet.",
      href: currentAuditHref
    },
    {
      id: "buyer-decision",
      label: "Buyer decision",
      status: lock.status,
      value: lock.verdict,
      evidence: lock.operatorLine,
      href: decisionReceiptHref
    }
  ];
  const status = worstProofChainStatus(gates.map((gate) => gate.status));
  const firstBlocked = gates.find((gate) => gate.status === "blocked");
  const firstAttention = gates.find((gate) => gate.status === "attention");
  const action = (input: Omit<BuyerProofChainAction, "external">): BuyerProofChainAction => ({
    ...input,
    external: chainHrefIsExternal(input.href)
  });
  const primaryGate = firstBlocked ?? firstAttention;
  const primaryAction = primaryGate
    ? action({
        id: "primary",
        label: `${primaryGate.status === "blocked" ? "Fix" : "Review"} ${primaryGate.label}`,
        href: primaryGate.href
      })
    : action({
        id: "primary",
        label: lock.primaryAction.label,
        href: lock.primaryAction.href
      });

  return {
    status,
    verdict: lock.verdict,
    headline: proofChainHeadline(status, lock.verdict, firstBlocked, firstAttention),
    instruction: proofChainInstruction(status, firstBlocked, firstAttention, lock),
    score: lock.score,
    scoreLabel: lock.scoreLabel,
    readyCount: gates.filter((gate) => gate.status === "ready").length,
    attentionCount: gates.filter((gate) => gate.status === "attention").length,
    blockedCount: gates.filter((gate) => gate.status === "blocked").length,
    gateTotal: gates.length,
    primaryAction,
    actions: [
      action({ id: "workflow-intake", label: "Workflow intake", href: workflowIntakeHref }),
      action({ id: "delivery-memo", label: "Delivery memo", href: deliveryMemoHref }),
      action({ id: "live-proof-audit", label: "Proof audit", href: currentAuditHref }),
      action({ id: "trust-manifest", label: "Trust manifest", href: trustManifestHref }),
      action({ id: "decision-receipt", label: "Decision receipt", href: decisionReceiptHref }),
      action({ id: "launch-room", label: "Launch room", href: launchRoomHref })
    ],
    gates
  };
}

function BuyerProofChainSnapshotPanel({ snapshot }: { snapshot: BuyerProofChainSnapshot }) {
  return (
    <section className={cx("buyer-proof-chain", `is-${snapshot.status}`)} aria-label="Current buyer proof chain">
      <div className="buyer-proof-chain-main">
        <span>Current proof chain</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.instruction}</p>
        <div className="buyer-proof-chain-actions" aria-label="Current proof chain actions">
          <a className="buyer-proof-chain-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {snapshot.primaryAction.label}
          </a>
          {snapshot.actions.map((action) => (
            <a key={action.id} href={action.href} {...routeActionAttrs(action)}>
              {action.id === "workflow-intake" ? (
                <Workflow size={14} />
              ) : action.id === "delivery-memo" ? (
                <FileText size={14} />
              ) : action.id === "live-proof-audit" ? (
                <Gauge size={14} />
              ) : action.id === "trust-manifest" ? (
                <ShieldCheck size={14} />
              ) : action.id === "decision-receipt" ? (
                <Scale size={14} />
              ) : (
                <Rocket size={14} />
              )}
              {action.label}
            </a>
          ))}
        </div>
      </div>
      <div className="buyer-proof-chain-score" aria-label="Buyer proof chain score">
        <span>{snapshot.scoreLabel}</span>
        <strong>{snapshot.score}</strong>
        <small>
          {snapshot.readyCount}/{snapshot.gateTotal} gates ready
        </small>
      </div>
      <div className="buyer-proof-chain-gates" aria-label="Buyer proof chain gates">
        {snapshot.gates.map((gate) => (
          <a key={gate.id} href={gate.href} className={gate.status} {...routeActionAttrs({ label: gate.label, href: gate.href, external: chainHrefIsExternal(gate.href) })}>
            <span>
              <RouteLockStatusIcon status={gate.status} />
              {gate.label}
            </span>
            <strong>{gate.value}</strong>
            <small>{gate.evidence}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

function BuyerPublicDecisionPathPanel({ path, onCopyText }: { path: BuyerPublicDecisionPath; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied path" : copyStatus === "failed" ? "Copy failed" : "Copy path";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(path.exportMarkdown)}`;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyPublicDecisionPath = async () => {
    const copied = await onCopyText(path.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-public-decision-path", `is-${path.status}`)} aria-label="Public buyer decision path">
      <div className="buyer-public-decision-main">
        <span>Public decision path</span>
        <strong>{path.headline}</strong>
        <p>{path.buyerLine}</p>
        <a className="buyer-public-decision-primary" href={path.firstAction.href} {...routeActionAttrs(path.firstAction)}>
          {path.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
          {path.firstAction.label}
        </a>
        <div className="buyer-public-decision-actions" aria-label="Public decision packet actions">
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyPublicDecisionPath}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-public-decision-path.md">
            <Download size={14} />
            Export path
          </a>
        </div>
      </div>
      <div className="buyer-public-decision-state" aria-label="Public decision state">
        <span>{path.decision}</span>
        <strong>{path.artifacts.filter((artifact) => artifact.status === "ready").length}/{path.artifacts.length}</strong>
        <small>artifacts ready</small>
      </div>
      <div className="buyer-public-decision-artifacts" aria-label="Public decision artifacts">
        {path.artifacts.map((artifact) => (
          <a key={artifact.id} className={artifact.status} href={artifact.href} {...routeActionAttrs({ label: artifact.label, href: artifact.href, external: chainHrefIsExternal(artifact.href) })}>
            <span>
              <RouteLockStatusIcon status={artifact.status} />
              {artifact.label}
            </span>
            <strong>{artifact.value}</strong>
            <small>{artifact.proof}</small>
          </a>
        ))}
      </div>
      <ul className="buyer-public-decision-guardrails" aria-label="Public decision guardrails">
        {path.guardrails.map((guardrail) => (
          <li key={guardrail}>{guardrail}</li>
        ))}
      </ul>
    </section>
  );
}

function BuyerSponsorAskSnapshotPanel({ ask, onCopyText }: { ask: BuyerSponsorAskSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied ask" : copyStatus === "failed" ? "Copy failed" : "Copy ask";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(ask.exportMarkdown)}`;
  const blockedRedLines = ask.redLines.filter((redLine) => redLine.status === "blocked").length;
  const watchRedLines = ask.redLines.filter((redLine) => redLine.status === "watch").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copySponsorAsk = async () => {
    const copied = await onCopyText(ask.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-sponsor-ask", `is-${ask.status}`)} aria-label="Buyer sponsor ask">
      <div className="buyer-sponsor-ask-main">
        <span>Sponsor ask</span>
        <strong>{ask.headline}</strong>
        <p>{ask.askInstruction}</p>
        <div className="buyer-sponsor-ask-actions" aria-label="Sponsor ask actions">
          <a className="buyer-sponsor-ask-primary" href={ask.firstAction.href} {...routeActionAttrs(ask.firstAction)}>
            {ask.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {ask.firstAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copySponsorAsk}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-sponsor-ask.md">
            <Download size={14} />
            Export ask
          </a>
        </div>
      </div>
      <aside className="buyer-sponsor-ask-stamp" aria-label="Sponsor ask amount">
        <span>{ask.askLabel}</span>
        <strong>{yen(ask.recommendedAskYen)}</strong>
        <small>{ask.decision} / {ask.decisionOwner}</small>
      </aside>
      <div className="buyer-sponsor-ask-conditions" aria-label="Sponsor ask conditions">
        {ask.conditions.slice(0, 5).map((condition) => (
          <article key={condition.id} className={condition.status}>
            <span>{condition.status}</span>
            <strong>{condition.label}</strong>
            <small>{condition.value}</small>
          </article>
        ))}
      </div>
      <div className="buyer-sponsor-ask-redlines" aria-label="Sponsor ask red lines">
        <div>
          <span>Stop lines</span>
          <strong>{blockedRedLines} blocked / {watchRedLines} watch</strong>
        </div>
        <p>{ask.redLines[0]?.trigger ?? "Keep the pilot inside the agreed proof boundary before expansion."}</p>
        <small>
          {ask.nextProofMove.owner}: {ask.nextProofMove.action}
        </small>
      </div>
    </section>
  );
}

function BuyerOperatingPlanSnapshotPanel({ plan, onCopyText }: { plan: BuyerOperatingPlanSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied plan" : copyStatus === "failed" ? "Copy failed" : "Copy plan";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(plan.exportMarkdown)}`;
  const openSteps = plan.cadence.filter((step) => step.status !== "ready").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyOperatingPlan = async () => {
    const copied = await onCopyText(plan.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-operating-snapshot", `is-${plan.status}`)} aria-label="30-day buyer operating snapshot">
      <div className="buyer-operating-snapshot-main">
        <span>30-day operating path</span>
        <strong>{plan.headline}</strong>
        <p>{plan.hardTruth}</p>
        <div className="buyer-operating-snapshot-actions" aria-label="Operating snapshot actions">
          <a className="buyer-operating-snapshot-primary" href={plan.firstAction.href} {...routeActionAttrs(plan.firstAction)}>
            {plan.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {plan.firstAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyOperatingPlan}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-operating-snapshot.md">
            <Download size={14} />
            Export plan
          </a>
        </div>
      </div>
      <aside className="buyer-operating-snapshot-value" aria-label="Risk-adjusted operating value">
        <span>Risk-adjusted value</span>
        <strong>{yen(plan.riskAdjustedMonthlyValueYen)}</strong>
        <small>{openSteps} open / {plan.readiness}</small>
      </aside>
      <div className="buyer-operating-snapshot-cadence" aria-label="30-day operating cadence">
        {plan.cadence.map((step) => (
          <a key={step.id} className={step.status} href={step.href} {...routeActionAttrs({ label: step.label, href: step.href, external: chainHrefIsExternal(step.href) })}>
            <span>
              <RouteLockStatusIcon status={step.status} />
              {step.window}
            </span>
            <strong>{step.label}</strong>
            <small>{step.owner}</small>
          </a>
        ))}
      </div>
      <div className="buyer-operating-snapshot-commitments" aria-label="Operating owner commitments">
        {plan.commitments.map((commitment) => (
          <article key={commitment.role}>
            <span>{commitment.role}</span>
            <strong>{commitment.owner}</strong>
            <small>{commitment.commitment}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuyerTrustSnapshotPanel({ snapshot, onCopyText }: { snapshot: BuyerTrustSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied trust" : copyStatus === "failed" ? "Copy failed" : "Copy trust";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;
  const clearControls = snapshot.controls.filter((control) => control.status === "ready").length;
  const blockedControls = snapshot.controls.filter((control) => control.status === "blocked").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyTrustSnapshot = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-trust-snapshot", `is-${snapshot.status}`)} aria-label="Buyer trust snapshot">
      <div className="buyer-trust-snapshot-main">
        <span>Buyer trust snapshot</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.hardTruth}</p>
        <div className="buyer-trust-snapshot-actions" aria-label="Buyer trust snapshot actions">
          <a className="buyer-trust-snapshot-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyTrustSnapshot}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-trust-snapshot.md">
            <Download size={14} />
            Export trust
          </a>
        </div>
      </div>
      <aside className="buyer-trust-snapshot-score" aria-label="Buyer trust score">
        <span>Trust score</span>
        <strong>{snapshot.trustScore}</strong>
        <small>{snapshot.readiness}</small>
      </aside>
      <div className="buyer-trust-snapshot-controls" aria-label="Buyer trust controls">
        {snapshot.controls.map((control) => (
          <a key={control.id} className={control.status} href={control.href} {...routeActionAttrs({ label: control.label, href: control.href, external: chainHrefIsExternal(control.href) })}>
            <span>
              <RouteLockStatusIcon status={control.status} />
              {control.label}
            </span>
            <strong>{control.owner}</strong>
            <small>{control.evidence}</small>
          </a>
        ))}
      </div>
      <div className="buyer-trust-snapshot-questions" aria-label="Buyer trust questions">
        <div>
          <span>Buyer questions</span>
          <strong>{clearControls}/{snapshot.controls.length} clear, {blockedControls} blocked</strong>
          <small>{snapshot.dataBoundary}</small>
        </div>
        {snapshot.questions.slice(0, 3).map((question) => (
          <article key={question.question}>
            <strong>{question.question}</strong>
            <p>{question.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuyerCommercialOfferSnapshotPanel({ offer, onCopyText }: { offer: BuyerCommercialOfferSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied offer" : copyStatus === "failed" ? "Copy failed" : "Copy offer";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(offer.exportMarkdown)}`;
  const clearGuardrails = offer.guardrails.filter((guardrail) => guardrail.status === "ready").length;
  const blockedGuardrails = offer.guardrails.filter((guardrail) => guardrail.status === "blocked").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyCommercialOffer = async () => {
    const copied = await onCopyText(offer.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-commercial-offer", `is-${offer.status}`)} aria-label="Buyer commercial offer snapshot">
      <div className="buyer-commercial-offer-main">
        <span>Commercial offer</span>
        <strong>{offer.headline}</strong>
        <p>{offer.hardTruth}</p>
        <div className="buyer-commercial-offer-actions" aria-label="Commercial offer actions">
          <a className="buyer-commercial-offer-primary" href={offer.firstAction.href} {...routeActionAttrs(offer.firstAction)}>
            {offer.status === "ready" ? <ShoppingCart size={14} /> : <Crosshair size={14} />}
            {offer.firstAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyCommercialOffer}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-commercial-offer.md">
            <Download size={14} />
            Export offer
          </a>
        </div>
      </div>
      <aside className="buyer-commercial-offer-price" aria-label="Commercial offer first commitment">
        <span>{offer.recommendedTier}</span>
        <strong>{offer.firstCommitmentYen > 0 ? yen(offer.firstCommitmentYen) : "Hold"}</strong>
        <small>{offer.valueCoveragePercent}% value cover / {offer.paybackDays}d payback</small>
      </aside>
      <div className="buyer-commercial-offer-terms" aria-label="Commercial offer terms">
        {offer.terms.map((term) => (
          <a key={term.id} className={term.status} href={term.href} {...routeActionAttrs({ label: term.label, href: term.href, external: chainHrefIsExternal(term.href) })}>
            <span>
              <RouteLockStatusIcon status={term.status} />
              {term.label}
            </span>
            <strong>{term.value}</strong>
            <small>{term.detail}</small>
          </a>
        ))}
      </div>
      <div className="buyer-commercial-offer-guardrails" aria-label="Commercial offer guardrails">
        <div>
          <span>Guardrails</span>
          <strong>{clearGuardrails}/{offer.guardrails.length} clear, {blockedGuardrails} blocked</strong>
          <small>{offer.contractLine}</small>
        </div>
        {offer.guardrails.map((guardrail) => (
          <a key={guardrail.id} className={guardrail.status} href={guardrail.href} {...routeActionAttrs({ label: guardrail.label, href: guardrail.href, external: chainHrefIsExternal(guardrail.href) })}>
            <span>
              <RouteLockStatusIcon status={guardrail.status} />
              {guardrail.label}
            </span>
            <strong>{guardrail.owner}</strong>
            <small>{guardrail.evidence}</small>
          </a>
        ))}
      </div>
      <div className="buyer-commercial-offer-questions" aria-label="Commercial offer buyer questions">
        {offer.buyerQuestions.map((question) => (
          <article key={question.question}>
            <strong>{question.question}</strong>
            <p>{question.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuyerActivationSnapshotPanel({ snapshot, onCopyText }: { snapshot: BuyerActivationSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied command" : copyStatus === "failed" ? "Copy failed" : "Copy command";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;
  const openSteps = snapshot.steps.filter((step) => step.status !== "ready").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyActivationSnapshot = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-activation-snapshot", `is-${snapshot.status}`)} aria-label="Buyer activation command">
      <div className="buyer-activation-snapshot-main">
        <span>Activation command</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.hardTruth}</p>
        <div className="buyer-activation-snapshot-actions" aria-label="Buyer activation command actions">
          <a className="buyer-activation-snapshot-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {snapshot.status === "ready" ? <Rocket size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <a className="icon-link" href={snapshot.reviewAction.href} {...routeActionAttrs(snapshot.reviewAction)}>
            <ExternalLink size={14} />
            {snapshot.reviewAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyActivationSnapshot}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-activation-command.md">
            <Download size={14} />
            Export command
          </a>
        </div>
      </div>
      <aside className="buyer-activation-snapshot-owner" aria-label="Current activation owner">
        <span>{snapshot.readiness}</span>
        <strong>{snapshot.currentOwner}</strong>
        <small>{snapshot.proofClosure} / {openSteps} open</small>
      </aside>
      <div className="buyer-activation-snapshot-steps" aria-label="Activation steps">
        {snapshot.steps.slice(0, 3).map((step) => (
          <a key={step.id} className={cx(step.status, step.isCurrent && "current")} href={step.editHref} {...routeActionAttrs({ label: step.label, href: step.editHref, external: chainHrefIsExternal(step.editHref) })}>
            <span>
              <RouteLockStatusIcon status={step.status} />
              {step.label}
            </span>
            <strong>{step.owner}</strong>
            <small>{step.acceptanceSignal}</small>
          </a>
        ))}
      </div>
      <div className="buyer-activation-snapshot-commitments" aria-label="Activation commitments">
        <div>
          <span>Current artifact</span>
          <strong>{snapshot.currentArtifact}</strong>
          <small>{snapshot.steps[0]?.proofToAttach ?? "Keep the next proof artifact attached."}</small>
        </div>
        {snapshot.commitments.map((commitment) => (
          <article key={commitment}>
            <strong>{commitment}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuyerPilotContractSnapshotPanel({ snapshot, onCopyText }: { snapshot: BuyerPilotContractSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied contract" : copyStatus === "failed" ? "Copy failed" : "Copy contract";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;
  const clearMilestones = snapshot.milestones.filter((milestone) => milestone.status === "ready").length;
  const clearCloseItems = snapshot.closeChecklist.filter((item) => item.status === "ready").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyPilotContract = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-pilot-contract", `is-${snapshot.status}`)} aria-label="Buyer pilot contract">
      <div className="buyer-pilot-contract-main">
        <span>Pilot contract</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.hardTruth}</p>
        <div className="buyer-pilot-contract-actions" aria-label="Pilot contract actions">
          <a className="buyer-pilot-contract-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {snapshot.status === "ready" ? <Scale size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <a className="icon-link" href={snapshot.reviewAction.href} {...routeActionAttrs(snapshot.reviewAction)}>
            <ExternalLink size={14} />
            {snapshot.reviewAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyPilotContract}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-pilot-contract.md">
            <Download size={14} />
            Export contract
          </a>
        </div>
      </div>
      <aside className="buyer-pilot-contract-price" aria-label="Pilot contract value">
        <span>{snapshot.pilotOffer}</span>
        <strong>{snapshot.firstCommitmentYen > 0 ? yen(snapshot.firstCommitmentYen) : "Hold"}</strong>
        <small>{snapshot.firstCommitmentYen > 0 ? `${snapshot.valueCoveragePercent}% value cover / ${snapshot.paybackDays}d payback` : "Repair proof and guardrails before pricing"}</small>
      </aside>
      <div className={cx("buyer-pilot-contract-send", snapshot.sendNote.status)} aria-label="Buyer send note">
        <div className="buyer-pilot-contract-send-note">
          <span>Buyer send note</span>
          <strong>{snapshot.sendNote.subject}</strong>
          <p>{snapshot.sendNote.instruction}</p>
          <small>{snapshot.sendNote.body[0]}</small>
        </div>
        <div className="buyer-pilot-contract-send-body" aria-label="Suggested buyer note">
          {snapshot.sendNote.body.slice(1, 4).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="buyer-pilot-contract-attachments" aria-label="Send attachments">
          {snapshot.sendNote.attachments.map((attachment) => (
            <a
              key={attachment.id}
              className={attachment.status}
              href={attachment.href}
              {...routeActionAttrs({ label: attachment.label, href: attachment.href, external: chainHrefIsExternal(attachment.href) })}
            >
              <span>
                <RouteLockStatusIcon status={attachment.status} />
                {attachment.label}
              </span>
              <strong>{compactBuyerExportHref(attachment.href)}</strong>
              <small>{attachment.evidence}</small>
            </a>
          ))}
        </div>
      </div>
      <div className="buyer-pilot-contract-milestones" aria-label="Pilot contract milestones">
        {snapshot.milestones.map((milestone) => (
          <a key={milestone.id} className={milestone.status} href={milestone.href} {...routeActionAttrs({ label: milestone.label, href: milestone.href, external: chainHrefIsExternal(milestone.href) })}>
            <span>
              <RouteLockStatusIcon status={milestone.status} />
              {milestone.label}
            </span>
            <strong>{milestone.owner}</strong>
            <small>{milestone.proof}</small>
          </a>
        ))}
      </div>
      <div className="buyer-pilot-contract-close" aria-label="Buyer close checklist">
        <div className="buyer-pilot-contract-close-head">
          <span>Buyer close checklist</span>
          <strong>{clearCloseItems}/{snapshot.closeChecklist.length} decisions ready</strong>
          <small>Scope, price, proof, trust, and renewal terms are explicit before this leaves the room.</small>
        </div>
        {snapshot.closeChecklist.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: chainHrefIsExternal(item.href) })}>
            <span>
              <RouteLockStatusIcon status={item.status} />
              {item.label}
            </span>
            <strong>{item.buyerDecision}</strong>
            <small>{item.evidence}</small>
          </a>
        ))}
      </div>
      <div className="buyer-pilot-contract-terms" aria-label="Pilot contract terms">
        <div>
          <span>Contract proof</span>
          <strong>{clearMilestones}/{snapshot.milestones.length} milestones clear</strong>
          <small>{snapshot.proofLine}</small>
        </div>
        <article>
          <span>Stop rule</span>
          <strong>{snapshot.stopRule}</strong>
        </article>
        {snapshot.buyerQuestions.slice(0, 2).map((question) => (
          <article key={question.question}>
            <span>{question.question}</span>
            <strong>{question.answer}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function BuyerGlobalLaunchSnapshotPanel({ snapshot, onCopyText }: { snapshot: BuyerGlobalLaunchSnapshot; onCopyText: (text: string) => Promise<boolean> }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied launch" : copyStatus === "failed" ? "Copy failed" : "Copy launch";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;
  const readyDimensions = snapshot.dimensions.filter((dimension) => dimension.status === "ready").length;
  const blockedProofLinks = snapshot.proofLinks.filter((link) => link.status === "blocked").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyGlobalLaunchSnapshot = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-global-launch-snapshot", `is-${snapshot.status}`)} aria-label="Global launch readiness">
      <div className="buyer-global-launch-snapshot-main">
        <span>Global readiness</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.hardTruth}</p>
        <div className="buyer-global-launch-snapshot-actions" aria-label="Global launch readiness actions">
          <a className="buyer-global-launch-snapshot-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {snapshot.status === "ready" ? <Trophy size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <a className="icon-link" href={snapshot.reviewAction.href} {...routeActionAttrs(snapshot.reviewAction)}>
            <ExternalLink size={14} />
            {snapshot.reviewAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyGlobalLaunchSnapshot}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-global-launch-readiness.md">
            <Download size={14} />
            Export launch
          </a>
        </div>
      </div>
      <aside className="buyer-global-launch-snapshot-score" aria-label="Global launch score">
        <span>{snapshot.readiness}</span>
        <strong>{snapshot.score}</strong>
        <small>{snapshot.proofSummary}</small>
      </aside>
      <div className="buyer-global-launch-snapshot-dimensions" aria-label="Global launch dimensions">
        {snapshot.dimensions.map((dimension) => (
          <a key={dimension.id} className={dimension.status} href={dimension.href} {...routeActionAttrs({ label: dimension.label, href: dimension.href, external: chainHrefIsExternal(dimension.href) })}>
            <span>
              <RouteLockStatusIcon status={dimension.status} />
              {dimension.label}
            </span>
            <strong>{dimension.score}/100</strong>
            <small>{dimension.evidence}</small>
          </a>
        ))}
      </div>
      <div className="buyer-global-launch-snapshot-proof" aria-label="Public proof links">
        <div>
          <span>Public proof</span>
          <strong>{readyDimensions}/{snapshot.dimensions.length} dimensions ready, {blockedProofLinks} proof links blocked</strong>
          <small>{snapshot.opsSummary}</small>
        </div>
        {snapshot.proofLinks.map((link) => (
          <a key={link.id} className={link.status} href={link.href} {...routeActionAttrs({ label: link.label, href: link.href, external: chainHrefIsExternal(link.href) })}>
            <span>
              <RouteLockStatusIcon status={link.status} />
              {link.label}
            </span>
            <strong>{link.value ? "Attached" : "Missing"}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}

function BuyerProofClaimTraceStrip({ evidenceTrace, evidenceTraceHref }: { evidenceTrace: BuyerEvidenceTrace; evidenceTraceHref: string }) {
  const passingClaims = evidenceTrace.claims.filter((claim) => claim.status === "pass").length;
  const passingTrail = evidenceTrace.approvalTrail.items.filter((item) => item.status === "pass").length;
  const repairTarget = evidenceTrace.blockers[0]
    ? {
        label: evidenceTrace.blockers[0].label,
        status: evidenceTrace.blockers[0].status,
        action: evidenceTrace.blockers[0].action,
        href: evidenceTrace.blockers[0].href
      }
    : {
        label: evidenceTrace.primaryClaim.label,
        status: evidenceTrace.primaryClaim.status,
        action: evidenceTrace.primaryClaim.nextAction,
        href: evidenceTrace.primaryClaim.artifact.href
      };

  return (
    <section className={cx("buyer-proof-claim-trace-strip", evidenceTrace.readiness)} aria-label="Buyer claim trace brief">
      <div className="buyer-proof-claim-trace-main">
        <span>Claim trace</span>
        <strong>{evidenceTrace.headline}</strong>
        <p>{evidenceTrace.hardTruth}</p>
        <div className="buyer-proof-claim-trace-actions" aria-label="Claim trace actions">
          <a href={evidenceTraceHref} {...routeActionAttrs({ label: "Public trace", href: evidenceTraceHref, external: chainHrefIsExternal(evidenceTraceHref) })}>
            <FileText size={13} />
            Public trace
          </a>
          <a className={repairTarget.status} href={repairTarget.href} {...routeActionAttrs({ label: repairTarget.label, href: repairTarget.href, external: chainHrefIsExternal(repairTarget.href) })}>
            {repairTarget.status === "pass" ? <ExternalLink size={13} /> : <Crosshair size={13} />}
            {repairTarget.status === "pass" ? "Open proof" : "Repair blocker"}
          </a>
        </div>
      </div>
      <div className="buyer-proof-claim-trace-score" aria-label="Claim trace score">
        <span>{evidenceTrace.readiness}</span>
        <strong>{evidenceTrace.score}</strong>
        <small>
          {passingClaims}/{evidenceTrace.claims.length} claims linked
        </small>
      </div>
      <div className="buyer-proof-claim-trace-metrics" aria-label="Claim trace coverage">
        <article>
          <span>Audit checks</span>
          <strong>
            {evidenceTrace.auditSummary.passCount}/{evidenceTrace.auditSummary.totalCount}
          </strong>
          <small>{evidenceTrace.auditSummary.readiness}</small>
        </article>
        <article className={evidenceTrace.approvalTrail.readiness}>
          <span>Approval trail</span>
          <strong>
            {passingTrail}/{evidenceTrace.approvalTrail.items.length}
          </strong>
          <small>{evidenceTrace.approvalTrail.receiptDigest ?? "receipt pending"}</small>
        </article>
        <article className={repairTarget.status}>
          <span>Next trace repair</span>
          <strong>{repairTarget.label}</strong>
          <small>{repairTarget.action}</small>
        </article>
      </div>
      <div className="buyer-proof-claim-trace-claims" aria-label="Buyer claim trace claims">
        {evidenceTrace.claims.map((claim) => {
          const repairCheck = claim.auditChecks.find((check) => check.status !== "pass");
          const href = claim.status === "pass" ? claim.artifact.href : repairCheck?.href ?? claim.artifact.href;
          const external = chainHrefIsExternal(href);
          return (
            <a key={claim.id} className={claim.status} href={href} {...routeActionAttrs({ label: claim.label, href, external })}>
              <span>{claim.status}</span>
              <strong>{claim.label}</strong>
              <small>{claim.auditChecks.filter((check) => check.status === "pass").length}/{claim.auditChecks.length} checks</small>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function BuyerProofCommandSurface({
  transformation,
  lock,
  sampleBriefHref,
  sampleDeliveryMemoHref,
  sampleAuditHref,
  sampleDecisionHref,
  currentAuditHref,
  productionHardeningHref,
  valueReportHref,
  deliveryMemoHref,
  trustManifestHref,
  decisionFollowUpHref,
  decisionReceiptHref,
  workflowIntakeHref,
  agentCardDiligenceHref,
  agentCardShortlistHref,
  agentCardTrialPlanHref,
  agentCardTrialVerificationHref,
  launchRoomHref,
  evidenceTrace,
  evidenceTraceHref,
  buyerPilotCommand,
  globalLaunchSnapshot,
  buyerScenario,
  buyerScenarioInput,
  buyerWorkOrder,
  workspace,
  proofSampleWorkspace,
  selectedAgents,
  agentTrialEvidence,
  measuredRun,
  measuredRunSummary,
  proofVerification,
  proofVerifyStatus,
  proofVerifyError,
  onBuyerScenarioChange,
  onBuyerWorkOrderChange,
  onMeasuredRunChange,
  onLoadSample,
  proofIntake,
  onProofIntakeChange,
  onApplyProofReplacement,
  onVerifyProofLinks,
  onAttachTrialEvidence,
  onCopyText
}: {
  transformation: ProofTransformation;
  lock: HomepageRouteLock;
  sampleBriefHref: string;
  sampleDeliveryMemoHref: string;
  sampleAuditHref: string;
  sampleDecisionHref: string;
  currentAuditHref: string;
  productionHardeningHref: string;
  valueReportHref: string;
  deliveryMemoHref: string;
  trustManifestHref: string;
  decisionFollowUpHref: string;
  decisionReceiptHref: string;
  workflowIntakeHref: string;
  agentCardDiligenceHref: string;
  agentCardShortlistHref: string;
  agentCardTrialPlanHref: string;
  agentCardTrialVerificationHref: string;
  launchRoomHref: string;
  evidenceTrace: BuyerEvidenceTrace;
  evidenceTraceHref: string;
  buyerPilotCommand: BuyerPilotCommand;
  globalLaunchSnapshot: BuyerGlobalLaunchSnapshot;
  buyerScenario: BuyerValueScenario;
  buyerScenarioInput: BuyerValueScenarioInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  workspace: WorkspaceDraft;
  proofSampleWorkspace: WorkspaceDraft;
  selectedAgents: MarketAgent[];
  agentTrialEvidence: AgentTrialEvidenceRecord[];
  measuredRun: PilotRunReceiptInput;
  measuredRunSummary: ReturnType<typeof buildBuyerPilotMeasuredRunSummary>;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  proofVerifyStatus: BuyerProofVerifyStatus;
  proofVerifyError: string;
  onBuyerScenarioChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  onBuyerWorkOrderChange: (patch: Partial<BuyerWorkOrderInput>) => void;
  onMeasuredRunChange: (patch: Partial<PilotRunReceiptInput>) => void;
  onLoadSample: () => void;
  proofIntake: BuyerPilotProofIntake;
  onProofIntakeChange: (patch: Partial<BuyerPilotProofIntake>) => void;
  onApplyProofReplacement: (patch: Partial<Record<BuyerProofRepairProofKey, string>>) => void | Promise<void>;
  onVerifyProofLinks: () => void;
  onAttachTrialEvidence: (record: AgentTrialEvidenceRecord) => void;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const openSteps = transformation.runway.filter((step) => step.status !== "pass").length;
  const currentDiagnosis = transformation.current;
  const workflowReadiness = buildBuyerProofWorkflowReadiness({ workOrder: buyerWorkOrder, buyerScenario: buyerScenarioInput, pilotRun: measuredRun });
  const proofChain = buildBuyerProofChainSnapshot({
    lock,
    workflowReadiness,
    buyerScenario,
    measuredRunSummary,
    workflowIntakeHref,
    valueReportHref,
    deliveryMemoHref,
    currentAuditHref,
    trustManifestHref,
    decisionReceiptHref,
    launchRoomHref
  });
  const buyerOwnedProofChecklist = buildBuyerOwnedProofChecklist({
    workspace,
    referenceWorkspace: proofSampleWorkspace,
    proofVerification,
    workflowIntakeHref,
    currentAuditHref
  });
  const proofFieldByKey = new Map(BUYER_PILOT_PROOF_FIELDS.map((field) => [field.key, field]));
  const proofVerificationLabel = proofVerificationButtonLabel(proofVerifyStatus);
  const proofVerificationStatusLine = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} live links verified`
    : proofVerifyStatus === "failed"
      ? proofVerifyError || "Proof verification failed."
      : "Live verification has not run for these URLs.";
  const proofClosureMetric = /^\d+\/\d+$/.test(transformation.before.proofClosure) ? `${transformation.before.proofClosure} links` : transformation.before.proofClosure;
  const metrics = [
    {
      label: "Current gate",
      value: currentDiagnosis.openCount === 0 ? "Ready" : `${currentDiagnosis.openCount} open`,
      detail: currentDiagnosis.primaryAction
    },
    { label: "Buyer value", value: transformation.before.monthlyValue, detail: "current model" },
    { label: "Measured run", value: transformation.before.measuredOutcome, detail: "current receipt" },
    { label: "Public proof", value: proofClosureMetric, detail: `${openSteps} buyer proof step${openSteps === 1 ? "" : "s"} open` }
  ];
  const proofPath = buildBuyerProofPathRows({
    workflowReadiness,
    buyerScenario,
    buyerWorkOrder,
    measuredRun,
    measuredRunSummary,
    lock,
    workflowIntakeHref,
    valueReportHref,
    deliveryMemoHref,
    launchRoomHref
  });
  const publicDecisionPath = buildBuyerPublicDecisionPath({
    snapshot: proofChain,
    proofPath
  });
  const valueSensitivity = buildBuyerValueSensitivity(buyerScenario);
  const sponsorAsk = buildBuyerSponsorAskSnapshot({
    commitment: buildBuyerValueCommitment({ scenario: buyerScenario, sensitivity: valueSensitivity }),
    valueReportHref
  });
  const focusPlan = buildBuyerProofFocusPlan({
    proofChecklist: buyerOwnedProofChecklist,
    publicDecisionPath,
    sponsorAsk
  });
  const operatingSnapshot = buildBuyerOperatingPlanSnapshot({
    workflowReadiness,
    buyerScenario,
    buyerWorkOrder,
    measuredRun,
    measuredRunSummary,
    publicDecisionPath,
    sponsorAsk,
    workflowIntakeHref,
    deliveryMemoHref,
    launchRoomHref
  });
  const trustSnapshot = buildBuyerTrustSnapshot({
    buyerWorkOrder,
    measuredRun,
    measuredRunSummary,
    publicDecisionPath,
    sponsorAsk,
    operatingSnapshot,
    workflowIntakeHref,
    deliveryMemoHref,
    trustManifestHref,
    launchRoomHref
  });
  const commercialOffer = buildBuyerCommercialOfferSnapshot({
    buyerScenario,
    measuredRunSummary,
    publicDecisionPath,
    sponsorAsk,
    operatingSnapshot,
    trustSnapshot,
    valueReportHref,
    deliveryMemoHref,
    trustManifestHref,
    launchRoomHref
  });
  const activationSnapshot = buildBuyerActivationSnapshot({
    command: buyerPilotCommand,
    launchRoomHref
  });
  const pilotContract = buildBuyerPilotContractSnapshot({
    publicDecisionPath,
    sponsorAsk,
    operatingSnapshot,
    trustSnapshot,
    commercialOffer,
    activationSnapshot,
    globalLaunchSnapshot,
    launchRoomHref
  });
  const pilotAssemblyLine = buildBuyerPilotAssemblyLineSnapshot({
    proofChain,
    publicDecisionPath,
    pilotContract,
    globalLaunchSnapshot
  });
  const pilotDecisionBrief = buildBuyerPilotDecisionBriefSnapshot({
    pilotContract
  });
  const pilotMeetingBrief = buildBuyerPilotMeetingBriefSnapshot({
    decisionBrief: pilotDecisionBrief,
    pilotContract,
    operatingSnapshot,
    trustSnapshot,
    publicDecisionPath
  });
  const entryStepById = Object.fromEntries(BUYER_PROOF_ENTRY_STEPS.map((step) => [step.id, step]));

  return (
    <section id="buyer-proof-command" className="buyer-proof-command" aria-labelledby="buyer-proof-command-title">
      <div className="buyer-proof-command-main">
        <span className="eyebrow">Buyer proof command</span>
        <h2 id="buyer-proof-command-title">
          <ClipboardCheck size={21} />
          Open the proof room a buyer can judge
        </h2>
        <p>Start with your workflow, turn the claim into buyer-readable evidence, then use the reference room only to calibrate missing proof.</p>
        <div className="buyer-proof-command-actions" aria-label="Buyer proof actions">
          <a href={workflowIntakeHref}>
            <Workflow size={15} />
            Start workflow intake
          </a>
          <a href={sampleDeliveryMemoHref} target="_blank" rel="noreferrer">
            <FileText size={15} />
            Reference memo
          </a>
          <button type="button" onClick={onLoadSample}>
            <BadgeCheck size={15} />
            Load reference room
          </button>
        </div>
      </div>

      <div className="buyer-proof-command-score" aria-label="Current buyer proof score">
        <span>{currentDiagnosis.status}</span>
        <strong>{currentDiagnosis.score}</strong>
        <small>{lock.scoreLabel}: {lock.score}</small>
      </div>

      <div className="buyer-proof-command-metrics" aria-label="Current proof metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>

      <BuyerProofClaimTraceStrip evidenceTrace={evidenceTrace} evidenceTraceHref={evidenceTraceHref} />

      <Suspense fallback={null}>
        <BuyerLaunchReadinessLane evidenceTrace={evidenceTrace} evidenceTraceHref={evidenceTraceHref} onCopyText={onCopyText} />
      </Suspense>

      <Suspense fallback={null}>
        <BuyerProofAnswerDeck evidenceTrace={evidenceTrace} evidenceTraceHref={evidenceTraceHref} onCopyText={onCopyText} />
      </Suspense>

      <Suspense fallback={null}>
        <BuyerRoleDecisionPackets evidenceTrace={evidenceTrace} evidenceTraceHref={evidenceTraceHref} onCopyText={onCopyText} />
      </Suspense>

      <Suspense fallback={null}>
        <BuyerObjectionRehearsal evidenceTrace={evidenceTrace} evidenceTraceHref={evidenceTraceHref} onCopyText={onCopyText} />
      </Suspense>

      <Suspense
        fallback={
          <section className="buyer-demo-residue-audit is-attention" aria-busy="true" aria-label="Reference residue audit">
            <div className="buyer-demo-residue-main">
              <span>Reference residue audit</span>
              <strong>Checking for reference residue</strong>
              <p>Scanning public proof URLs, reference artifacts, buyer-run receipts, live verification, and launch-room proof.</p>
            </div>
          </section>
        }
      >
        <BuyerDemoResidueAuditPanel
          workspace={workspace}
          workflowIntakeHref={workflowIntakeHref}
          currentAuditHref={currentAuditHref}
          deliveryMemoHref={deliveryMemoHref}
          trustManifestHref={trustManifestHref}
          launchRoomHref={launchRoomHref}
          onCopyText={onCopyText}
        />
      </Suspense>

      <Suspense
        fallback={
          <section className={cx("buyer-proof-focus-plan", focusPlan.status)} aria-busy="true" aria-label="Buyer proof focus plan">
            <div className="buyer-proof-focus-main">
              <span>Focused pilot path</span>
              <strong>{focusPlan.headline}</strong>
              <p>{focusPlan.buyerPromise}</p>
            </div>
          </section>
        }
      >
        <BuyerProofFocusPlanPanel plan={focusPlan} onCopyText={onCopyText} />
      </Suspense>

      <section className={cx("buyer-owned-proof-checklist", buyerOwnedProofChecklist.status)} aria-label="Buyer-owned proof checklist">
        <div className="buyer-owned-proof-checklist-head">
          <div>
            <span>Buyer-owned proof</span>
            <strong>{buyerOwnedProofChecklist.headline}</strong>
            <p>{buyerOwnedProofChecklist.primaryAction}</p>
          </div>
          <div className="buyer-owned-proof-checklist-actions">
            <small>
              {buyerOwnedProofChecklist.readyCount}/{buyerOwnedProofChecklist.totalCount} verified
            </small>
            <button className={cx("icon-link", proofVerifyStatus === "checked" && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")} type="button" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
              <Gauge size={14} />
              {proofVerificationLabel}
            </button>
            <em className={cx(Boolean(proofVerification) && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")}>{proofVerificationStatusLine}</em>
          </div>
        </div>
        <Suspense fallback={null}>
          <BuyerProofSendabilityContractStrip
            checklist={buyerOwnedProofChecklist}
            readyActionHref={launchRoomHref}
            liveVerifiedCount={proofVerification?.verifiedCount}
            liveTotalCount={proofVerification?.totalCount}
          />
        </Suspense>
        <div className="buyer-owned-proof-grid">
          {buyerOwnedProofChecklist.items.map((item) => {
            const field = proofFieldByKey.get(item.id);
            return (
              <article key={item.id} className={item.status}>
                <label>
                  <span>
                    <RouteLockStatusIcon status={item.status} />
                    {item.label}
                  </span>
                  <input
                    type="url"
                    value={proofIntake[item.id]}
                    placeholder={field?.placeholder ?? PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl}
                    aria-label={`${item.label} URL`}
                    onChange={(event) => onProofIntakeChange({ [item.id]: event.target.value } as Partial<BuyerPilotProofIntake>)}
                  />
                </label>
                <strong>{item.value}</strong>
                <p>{item.action}</p>
                <a href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: chainHrefIsExternal(item.href) })}>
                  Open detail
                  <ExternalLink size={13} />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <Suspense
        fallback={
          <section className="buyer-proof-replacement-packet is-attention" aria-busy="true" aria-label="Buyer proof repair queue">
            <div className="buyer-proof-replacement-main">
              <span>Proof repair queue</span>
              <strong>Preparing proof repairs</strong>
              <p>Loading the current product URL, work-order proof, measured receipt, A2A trial evidence, walkthrough, and submission story checks.</p>
            </div>
          </section>
        }
      >
        <BuyerProofRepairQueuePanel
          workspace={workspace}
          proofSampleWorkspace={proofSampleWorkspace}
          proofVerifyStatus={proofVerifyStatus}
          onBuyerScenarioChange={onBuyerScenarioChange}
          onBuyerWorkOrderChange={onBuyerWorkOrderChange}
          onMeasuredRunChange={onMeasuredRunChange}
          onProofIntakeChange={onProofIntakeChange}
          onApplyProofReplacement={onApplyProofReplacement}
          onAttachTrialEvidence={onAttachTrialEvidence}
        />
      </Suspense>

      <Suspense
        fallback={
          <section className="buyer-proof-replacement-packet is-attention" aria-busy="true" aria-label="Buyer proof replacement packet">
            <div className="buyer-proof-replacement-main">
              <span>Replacement packet</span>
              <strong>Preparing proof replacement packet</strong>
              <p>Compiling proof rows, owner actions, buyer review message, and exportable replacement ledger.</p>
            </div>
          </section>
        }
      >
        <BuyerProofReplacementPacketPanel
          workspace={workspace}
          referenceWorkspace={proofSampleWorkspace}
          proofVerification={proofVerification}
          workflowIntakeHref={workflowIntakeHref}
          currentAuditHref={currentAuditHref}
          launchRoomHref={launchRoomHref}
          proofVerifyStatus={proofVerifyStatus}
          proofVerifyError={proofVerifyError}
          onVerifyProofLinks={onVerifyProofLinks}
          onCopyText={onCopyText}
        />
      </Suspense>

      <Suspense
        fallback={
          <section className="buyer-a2a-trial-intake is-loading" aria-busy="true" aria-label="Accepted A2A trial receipt">
            <div className="buyer-a2a-trial-head">
              <div>
                <span>A2A trial receipt</span>
                <strong>Preparing trial receipt intake</strong>
                <p>Loading the buyer-safe A2A receipt form.</p>
              </div>
            </div>
          </section>
        }
      >
        <BuyerA2ATrialReceiptPanel
          selectedAgents={selectedAgents}
          evidenceRecords={agentTrialEvidence}
          trialPlanHref={agentCardTrialPlanHref}
          diligenceHref={agentCardDiligenceHref}
          onAttachEvidence={onAttachTrialEvidence}
        />
      </Suspense>

      <div className={cx("buyer-proof-current-queue", currentDiagnosis.status)} aria-label="Current workspace repair queue">
        <div>
          <span>Current repair queue</span>
          <strong>{currentDiagnosis.headline}</strong>
          <p>{currentDiagnosis.primaryAction}</p>
        </div>
        <ol>
          {currentDiagnosis.items.slice(0, 4).map((item) => (
            <li key={item.id} className={item.status}>
              <span>{item.label}</span>
              <strong>{item.action}</strong>
              <small>{item.owner}: {item.proof}</small>
            </li>
          ))}
        </ol>
      </div>

      <Suspense
        fallback={
          <section className="buyer-decision-agenda is-attention" aria-busy="true" aria-label="Buyer decision agenda">
            <div className="buyer-decision-agenda-main">
              <span>Buyer decision agenda</span>
              <strong>Preparing buyer decision brief</strong>
              <p>Loading the current decision request, commercial boundary, proof, trust, and stop rule.</p>
            </div>
          </section>
        }
      >
        <BuyerDecisionAgendaPanel
          proofChain={proofChain}
          publicDecisionPath={publicDecisionPath}
          pilotContract={pilotContract}
          trustSnapshot={trustSnapshot}
          commercialOffer={commercialOffer}
          onCopyText={onCopyText}
        />
      </Suspense>

      <Suspense
        fallback={
          <section className="buyer-decision-follow-up is-attention" aria-busy="true" aria-label="Buyer decision follow-up ledger">
            <div className="buyer-decision-follow-up-main">
              <span>Decision follow-up ledger</span>
              <strong>Preparing meeting follow-up</strong>
              <p>Loading owner tasks, due windows, close conditions, and exportable follow-up ledger.</p>
            </div>
          </section>
        }
      >
        <BuyerDecisionFollowUpPanel
          proofChain={proofChain}
          publicDecisionPath={publicDecisionPath}
          pilotContract={pilotContract}
          trustSnapshot={trustSnapshot}
          commercialOffer={commercialOffer}
          publicLedgerHref={decisionFollowUpHref}
          onCopyText={onCopyText}
        />
      </Suspense>

      <Suspense
        fallback={
          <section className="buyer-pilot-send-note-card is-attention" aria-busy="true" aria-label="Buyer send brief">
            <div className="buyer-pilot-send-note-main">
              <span>Buyer send brief</span>
              <strong>Preparing the buyer-ready send note</strong>
              <p>Loading the subject, send rule, proof attachments, and open blockers from the current pilot contract.</p>
            </div>
          </section>
        }
      >
        <BuyerPilotSendNotePanel snapshot={pilotContract} onCopyText={onCopyText} />
      </Suspense>

      <Suspense
        fallback={
          <section className="production-hardening is-attention" aria-busy="true" aria-label="Production hardening gate">
            <div className="production-hardening-main">
              <span>Production hardening gate</span>
              <strong>Checking external launch proof</strong>
              <p>Scanning public URLs, reference artifacts, live verification, measured evidence, and submission proof.</p>
            </div>
          </section>
        }
      >
        <ProductionHardeningPanel
          workspace={workspace}
          workflowIntakeHref={workflowIntakeHref}
          currentAuditHref={currentAuditHref}
          deliveryMemoHref={deliveryMemoHref}
          trustManifestHref={trustManifestHref}
          launchRoomHref={launchRoomHref}
          publicGateHref={productionHardeningHref}
          onCopyText={onCopyText}
        />
      </Suspense>

      <details className={cx("buyer-proof-dossier", pilotContract.status)}>
        <summary>
          <div>
            <span>Evidence dossier</span>
            <strong>Contracts, launch operations, and buyer handoff exports</strong>
            <p>{pilotContract.hardTruth}</p>
          </div>
          <small>{pilotAssemblyLine.readyCount}/{pilotAssemblyLine.stageTotal} stages ready</small>
        </summary>
        <div className="buyer-proof-dossier-body">
          <BuyerPilotAssemblyLinePanel snapshot={pilotAssemblyLine} />
          <BuyerPilotDecisionBriefPanel snapshot={pilotDecisionBrief} onCopyText={onCopyText} />
          <BuyerPilotMeetingBriefPanel snapshot={pilotMeetingBrief} onCopyText={onCopyText} />
          <BuyerPilotContractSnapshotPanel snapshot={pilotContract} onCopyText={onCopyText} />
          <Suspense
            fallback={
              <section className="buyer-publication-window is-attention" aria-busy="true" aria-label="Buyer publication window">
                <div className="buyer-publication-window-main">
                  <span>Publication window</span>
                  <strong>Loading proof publication clock</strong>
                  <p>Preparing proof expiry, manifest regeneration, and buyer review checkpoints.</p>
                </div>
              </section>
            }
          >
            <BuyerPublicationWindowPanel
              proofVerification={proofVerification}
              proofChain={proofChain}
              publicDecisionPath={publicDecisionPath}
              trustSnapshot={trustSnapshot}
              currentAuditHref={currentAuditHref}
              trustManifestHref={trustManifestHref}
              launchRoomHref={launchRoomHref}
              onCopyText={onCopyText}
            />
          </Suspense>
          <BuyerPublicDecisionPathPanel path={publicDecisionPath} onCopyText={onCopyText} />
          <BuyerSponsorAskSnapshotPanel ask={sponsorAsk} onCopyText={onCopyText} />
          <BuyerOperatingPlanSnapshotPanel plan={operatingSnapshot} onCopyText={onCopyText} />
          <BuyerTrustSnapshotPanel snapshot={trustSnapshot} onCopyText={onCopyText} />
          <BuyerCommercialOfferSnapshotPanel offer={commercialOffer} onCopyText={onCopyText} />
          <BuyerActivationSnapshotPanel snapshot={activationSnapshot} onCopyText={onCopyText} />
          <BuyerGlobalLaunchSnapshotPanel snapshot={globalLaunchSnapshot} onCopyText={onCopyText} />

          <BuyerProofChainSnapshotPanel snapshot={proofChain} />

          <Suspense
            fallback={
              <section className="buyer-proof-value-tuner is-loading" aria-busy="true" aria-label="Buyer value tuner">
                <div className="buyer-proof-value-tuner-head">
                  <div>
                    <span>Buyer value tuner</span>
                    <strong>Preparing value and price guardrails</strong>
                    <p>Loading the current pilot price, payback, stop rule, and value controls.</p>
                  </div>
                </div>
              </section>
            }
          >
            <BuyerValueTunerStrip
              buyerScenario={buyerScenario}
              buyerScenarioInput={buyerScenarioInput}
              commercialOffer={commercialOffer}
              measuredRun={measuredRun}
              measuredRunSummary={measuredRunSummary}
              valueReportHref={valueReportHref}
              deliveryMemoHref={deliveryMemoHref}
              launchRoomHref={launchRoomHref}
              onBuyerScenarioChange={onBuyerScenarioChange}
              onMeasuredRunChange={onMeasuredRunChange}
            />
          </Suspense>

          <div className="buyer-proof-command-runway" aria-label="Buyer proof first-run path">
            <article className="current">
              <span>{entryStepById.current.signal}</span>
              <strong>{entryStepById.current.title}</strong>
              <p>{entryStepById.current.detail}</p>
              <div>
                <a href={deliveryMemoHref} target="_blank" rel="noreferrer" className="primary">
                  <FileText size={15} />
                  Delivery memo
                </a>
                <a href={workflowIntakeHref}>
                  <Workflow size={15} />
                  Workflow intake
                </a>
                <a href={currentAuditHref} target="_blank" rel="noreferrer">
                  <Gauge size={15} />
                  Proof audit
                </a>
                <a href={trustManifestHref} target="_blank" rel="noreferrer">
                  <ShieldCheck size={15} />
                  Trust manifest
                </a>
                <a href={launchRoomHref} target="_blank" rel="noreferrer">
                  <Rocket size={15} />
                  Launch room
                </a>
              </div>
            </article>
            <article className="sample">
              <span>{entryStepById.sample.signal}</span>
              <strong>{entryStepById.sample.title}</strong>
              <p>{entryStepById.sample.detail}</p>
              <div>
                <a href={sampleDeliveryMemoHref} target="_blank" rel="noreferrer" className="primary">
                  <FileText size={15} />
                  Reference memo
                </a>
                <a href={sampleAuditHref} target="_blank" rel="noreferrer">
                  <Gauge size={15} />
                  Live audit
                </a>
                <button type="button" onClick={onLoadSample}>
                  <BadgeCheck size={15} />
                  Load reference
                </button>
                <a href={sampleDecisionHref} target="_blank" rel="noreferrer">
                  <Scale size={15} />
                  Decision proof
                </a>
                <a href={sampleBriefHref} target="_blank" rel="noreferrer">
                  <FileText size={15} />
                  Buyer brief
                </a>
              </div>
            </article>
            <article className="agent-trial">
              <span>{entryStepById["agent-trial"].signal}</span>
              <strong>{entryStepById["agent-trial"].title}</strong>
              <p>{entryStepById["agent-trial"].detail}</p>
              <div>
                <a href={agentCardDiligenceHref} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  Agent Card audit
                </a>
                <a href={agentCardShortlistHref} target="_blank" rel="noreferrer">
                  <Scale size={15} />
                  Shortlist
                </a>
                <a href={agentCardTrialPlanHref} target="_blank" rel="noreferrer">
                  <Play size={15} />
                  Trial plan
                </a>
                <a href={agentCardTrialVerificationHref} target="_blank" rel="noreferrer">
                  <ShieldCheck size={15} />
                  Verify receipt
                </a>
              </div>
            </article>
          </div>

          <div className="buyer-proof-command-path" aria-label="Buyer proof path">
            {proofPath.map((item) => (
              <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ label: item.label, href: item.href, external: chainHrefIsExternal(item.href) })}>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </a>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}

function routeActionAttrs(action: HomepageRouteLock["primaryAction"]) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function HomepageRouteLockStrip({ lock }: { lock: HomepageRouteLock }) {
  return (
    <section className={cx("homepage-route-lock", `is-${lock.status}`)} aria-labelledby="homepage-route-lock-title">
      <div className="homepage-route-main">
        <span className="eyebrow">First action route lock</span>
        <h2 id="homepage-route-lock-title">
          <RouteLockStatusIcon status={lock.status} />
          {lock.headline}
        </h2>
        <p>{lock.instruction}</p>
        <strong>{lock.operatorLine}</strong>
      </div>
      <div className="homepage-route-score" aria-label="Buyer route score">
        <span>{lock.scoreLabel}</span>
        <strong>{lock.score}</strong>
      </div>
      <div className="homepage-route-actions">
        <a className="homepage-route-primary" href={lock.primaryAction.href} {...routeActionAttrs(lock.primaryAction)}>
          {lock.verdict === "send" ? <ExternalLink size={15} /> : <Crosshair size={15} />}
          {lock.primaryAction.label}
        </a>
        <a className="icon-link" href={lock.secondaryAction.href} {...routeActionAttrs(lock.secondaryAction)}>
          <FileText size={14} />
          {lock.secondaryAction.label}
        </a>
      </div>
      <div className="homepage-route-steps" aria-label="Buyer route map">
        {lock.routeSteps.map((step, index) => (
          <a key={step.id} href={step.href} className={cx(step.status, step.isCurrent && "current")} {...routeActionAttrs(step)}>
            <span>
              <b>{index + 1}</b>
              <RouteLockStatusIcon status={step.status} />
              {step.label}
            </span>
            <strong>{step.value}</strong>
            <small>{step.evidence}</small>
          </a>
        ))}
      </div>
      <div className="homepage-route-checks" aria-label="Route lock checks">
        {lock.checks.map((check) => (
          <a key={check.id} href={check.href} className={check.status}>
            <span>
              <RouteLockStatusIcon status={check.status} />
              {check.label}
            </span>
            <strong>{check.value}</strong>
            <small>{check.evidence}</small>
          </a>
        ))}
      </div>
      <div className="homepage-route-handoff" aria-label="Buyer handoff packet">
        <div className="homepage-route-handoff-head">
          <span>Buyer handoff packet</span>
          <strong>{lock.handoffPacket.title}</strong>
          <p>{lock.handoffPacket.summary}</p>
          <div className="homepage-route-handoff-actions">
            <a className="homepage-route-handoff-action" href={lock.handoffPacket.primaryAction.href} {...routeActionAttrs(lock.handoffPacket.primaryAction)}>
              <ClipboardCheck size={14} />
              {lock.handoffPacket.primaryAction.label}
            </a>
            <a className="homepage-route-handoff-action is-secondary" href={lock.handoffPacket.secondaryAction.href} {...routeActionAttrs(lock.handoffPacket.secondaryAction)}>
              <BadgeCheck size={14} />
              {lock.handoffPacket.secondaryAction.label}
            </a>
          </div>
        </div>
        <div className="homepage-route-handoff-items">
          {lock.handoffPacket.items.map((item) => (
            <a key={item.id} href={item.href} className={item.status} {...routeActionAttrs(item)}>
              <span>
                <RouteLockStatusIcon status={item.status} />
                {item.label}
              </span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuyerPilotCommandCenter({
  command,
  launchRoom,
  launchRoomHref,
  decisionReceiptHref,
  reviewKitHref,
  acceptancePathHref,
  evidenceTraceHref,
  buyerShareGateHref,
  buyerProofMonitorHref,
  buyerProofRecoveryHref,
  buyerScenario,
  buyerScenarioInput,
  proofIntake,
  proofRepairDraft,
  measuredRun,
  copyStatus,
  proofVerifyStatus,
  proofVerifyError,
  onBuyerScenarioChange,
  onProofIntakeChange,
  onProofRepairDraftChange,
  onApplyProofRepairDraft,
  onMeasuredRunChange,
  proofVerification,
  onVerifyProofLinks,
  onCopyLaunchRoomLink,
  onCopyText
}: {
  command: BuyerPilotCommand;
  launchRoom: LaunchRoom;
  launchRoomHref: string;
  decisionReceiptHref: string;
  reviewKitHref: string;
  acceptancePathHref: string;
  evidenceTraceHref: string;
  buyerShareGateHref: string;
  buyerProofMonitorHref: string;
  buyerProofRecoveryHref: string;
  buyerScenario: BuyerValueScenario;
  buyerScenarioInput: BuyerValueScenarioInput;
  proofIntake: BuyerPilotProofIntake;
  proofRepairDraft: Partial<BuyerPilotProofIntake>;
  measuredRun: PilotRunReceiptInput;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  copyStatus: "idle" | "copied" | "failed";
  proofVerifyStatus: BuyerProofVerifyStatus;
  proofVerifyError: string;
  onBuyerScenarioChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  onProofIntakeChange: (patch: Partial<BuyerPilotProofIntake>) => void;
  onProofRepairDraftChange: (key: keyof BuyerPilotProofIntake, value: string) => void;
  onApplyProofRepairDraft: (key: keyof BuyerPilotProofIntake) => void | Promise<void>;
  onMeasuredRunChange: (patch: Partial<PilotRunReceiptInput>) => void;
  onVerifyProofLinks: () => void;
  onCopyLaunchRoomLink: () => void;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const liveProofVerification = proofVerification;
  const [sharePacketCopyStatus, setSharePacketCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy launch room";
  const sharePacketCopyLabel =
    sharePacketCopyStatus === "copied" ? "Copied packet" : sharePacketCopyStatus === "failed" ? "Copy failed" : "Copy send packet";
  const showValueFix = command.readiness === "needs-value";
  const proofFields = BUYER_PILOT_PROOF_FIELDS;
  const sealedProofCount = proofFields.filter((field) => isPublicProofUrl(proofIntake[field.key])).length;
  const proofLinks = proofFields.map((field) => ({
    id: field.key,
    label: field.label,
    value: proofIntake[field.key],
    href: field.href
  }));
  const measuredRunSummary = useMemo(() => buildBuyerPilotMeasuredRunSummary(measuredRun, buyerScenario), [buyerScenario, measuredRun]);
  const runCalibration = useMemo(() => buildBuyerPilotRunCalibration(measuredRun, buyerScenario), [buyerScenario, measuredRun]);
  const measurementPlan = useMemo(() => buildBuyerPilotMeasurementPlan({ calibration: runCalibration, buyerScenario, pilotRun: measuredRun }), [buyerScenario, measuredRun, runCalibration]);
  const measurementPlanHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(measurementPlan.exportMarkdown)}`;
  const proofMonitor = useMemo(
    () => buildBuyerProofMonitor({ proofLinks, verification: liveProofVerification }),
    [liveProofVerification, proofIntake.pilotEvidenceUrl, proofIntake.protopediaUrl, proofIntake.targetUrl, proofIntake.videoUrl, proofIntake.workOrderEvidenceUrl]
  );
  const proofMonitorExportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(proofMonitor.exportMarkdown)}`;
  const proofRecovery = useMemo(
    () => buildBuyerProofRecoveryPlan({ proofLinks, monitor: proofMonitor, verification: liveProofVerification }),
    [liveProofVerification, proofMonitor]
  );
  const proofRecoveryExportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(proofRecovery.exportMarkdown)}`;
  const shareGate = useMemo(
    () =>
      buildBuyerShareGate({
        command,
        proofLinks,
        measuredRun: measuredRunSummary,
        runCalibration,
        proofVerification: liveProofVerification ?? undefined
      }),
    [command, liveProofVerification, measuredRunSummary, proofIntake.pilotEvidenceUrl, proofIntake.protopediaUrl, proofIntake.targetUrl, proofIntake.videoUrl, proofIntake.workOrderEvidenceUrl, runCalibration]
  );
  const shareGatePrimaryExternal = /^https?:\/\//i.test(shareGate.primaryActionHref);
  const shareGatePacketHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(shareGate.exportMarkdown)}`;
  const liveProofById = new Map(liveProofVerification?.results.map((result) => [result.id, result]));
  const shareGateProofRepairItem = shareGate.repairPlan.items.find((item) => item.id === "public-proof");
  const openShareGateProofResult =
    liveProofVerification?.results.find((result) => result.status === "block") ?? liveProofVerification?.results.find((result) => result.status === "watch");
  const shareGateProofRepairField =
    (openShareGateProofResult ? proofFields.find((field) => field.key === openShareGateProofResult.id) : undefined) ??
    proofFields.find((field) => !isPublicProofUrl(proofIntake[field.key]));
  const shareGateProofRepairValue = shareGateProofRepairField ? (proofRepairDraft[shareGateProofRepairField.key] ?? proofIntake[shareGateProofRepairField.key] ?? "") : "";
  const shareGateProofRepairCanApply = Boolean(
    shareGateProofRepairItem &&
      shareGateProofRepairField &&
      shareGateProofRepairValue.trim() &&
      shareGateProofRepairValue !== proofIntake[shareGateProofRepairField.key] &&
      proofVerifyStatus !== "checking"
  );
  const proofVerificationLabel = proofVerificationButtonLabel(proofVerifyStatus);
  const measuredNumberFields = [
    { key: "observedManualMinutes", label: "Manual", suffix: "min", min: 1, max: 7200, value: measuredRun.observedManualMinutes },
    { key: "observedAssistedMinutes", label: "Assisted", suffix: "min", min: 1, max: 7200, value: measuredRun.observedAssistedMinutes },
    { key: "acceptedTasks", label: "Accepted", suffix: "tasks", min: 0, max: measuredRun.totalTasks, value: measuredRun.acceptedTasks },
    { key: "totalTasks", label: "Total", suffix: "tasks", min: 1, max: 20, value: measuredRun.totalTasks },
    { key: "participants", label: "People", suffix: "", min: 1, max: 200, value: measuredRun.participants }
  ] as const;
  const valueLevers = [
    { key: "adoptionRatePercent", label: "Adoption", suffix: "%", min: 5, max: 100, step: 5, value: buyerScenarioInput.adoptionRatePercent },
    { key: "cyclesPerMonth", label: "Cycles/mo", suffix: "", min: 1, max: 40, step: 1, value: buyerScenarioInput.cyclesPerMonth },
    { key: "manualHoursPerCycle", label: "Manual h/cycle", suffix: "h", min: 1, max: 120, step: 1, value: buyerScenarioInput.manualHoursPerCycle }
  ] as const;

  useEffect(() => {
    if (sharePacketCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setSharePacketCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [sharePacketCopyStatus]);

  async function copySharePacket() {
    const copied = await onCopyText(shareGate.sendPacket.copyText);
    setSharePacketCopyStatus(copied ? "copied" : "failed");
  }

  async function applyShareGateProofRepair() {
    if (!shareGateProofRepairField) return;
    await onApplyProofRepairDraft(shareGateProofRepairField.key);
  }

  return (
    <section className={cx("buyer-pilot-command", `is-${command.readiness}`)} aria-labelledby="buyer-pilot-command-title">
      <div className="buyer-pilot-command-main">
        <div>
          <span className="eyebrow">Buyer pilot command</span>
          <h2 id="buyer-pilot-command-title">{command.headline}</h2>
          <p>
            {command.targetBuyer} can inspect the value case, work order, proof packet, sponsor decision, and pilot receipt from one launch room.
          </p>
        </div>
        <div className="buyer-pilot-actions" aria-label="Launch room actions">
          <a className="buyer-pilot-primary" href={launchRoomHref} target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            Open launch room
          </a>
          <a className="icon-link" href={decisionReceiptHref} target="_blank" rel="noreferrer">
            <Scale size={14} />
            Record decision
          </a>
          <a className="icon-link" href={reviewKitHref} target="_blank" rel="noreferrer">
            <ClipboardCheck size={14} />
            Review kit
          </a>
          <a className="icon-link" href={acceptancePathHref} target="_blank" rel="noreferrer">
            <BadgeCheck size={14} />
            Acceptance path
          </a>
          <a className="icon-link" href={command.nextGap.editHref}>
            <Crosshair size={14} />
            Fix next gap
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} onClick={onCopyLaunchRoomLink} type="button">
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={evidenceTraceHref} target="_blank" rel="noreferrer">
            <FileText size={14} />
            Open claim trace
          </a>
        </div>
      </div>
      <div className="buyer-pilot-command-score" aria-label="Launch readiness score">
        <span>{command.readiness}</span>
        <strong>{command.launchScore}</strong>
        <small>{command.proofClosure}</small>
      </div>
      <div className="buyer-pilot-metrics" aria-label="Buyer pilot metrics">
        <article>
          <span>Buyer</span>
          <strong>{command.targetBuyer}</strong>
        </article>
        <article>
          <span>Value</span>
          <strong>{command.primaryMetric}</strong>
        </article>
        <article>
          <span>Current lane</span>
          <strong>{command.pathLabel}</strong>
        </article>
      </div>
      <div className="buyer-pilot-next">
        <span>Next gap</span>
        <strong>{command.nextGap.label}</strong>
        <p>
          {command.nextGap.owner}: {command.nextGap.action}
        </p>
      </div>
      <Suspense
        fallback={
          <section className="buyer-launch-handoff is-loading" aria-busy="true" aria-label="Buyer handoff composer">
            <div className="buyer-launch-handoff-head">
              <div>
                <span>Buyer handoff composer</span>
                <strong>Preparing buyer handoff</strong>
                <p>Loading the current launch-room send packet.</p>
              </div>
            </div>
          </section>
        }
      >
        <BuyerLaunchHandoffComposer launchRoom={launchRoom} onCopyText={onCopyText} />
      </Suspense>
      <Suspense
        fallback={
          <section id="buyer-evidence-trace" className="buyer-evidence-trace is-loading" aria-busy="true" aria-label="Buyer evidence trace">
            <div className="buyer-evidence-trace-head">
              <div>
                <span>Claim trace matrix</span>
                <strong>Preparing claim trace</strong>
                <p>Loading the buyer proof matrix.</p>
              </div>
            </div>
          </section>
        }
      >
        <BuyerEvidenceTracePanel launchRoom={launchRoom} shareGate={shareGate} evidenceTraceHref={evidenceTraceHref} />
      </Suspense>
      <section className="buyer-pilot-gap-queue" aria-label="Proof repair queue">
        <div className="buyer-pilot-gap-head">
          <div>
            <span>Proof repair queue</span>
            <strong>{command.gapQueue.length === 1 && command.gapQueue[0]?.status === "ready" ? "Ready for sponsor review" : `${command.gapQueue.length} tasks to buyer-ready`}</strong>
          </div>
          <a href={command.nextGap.editHref}>
            <Crosshair size={13} />
            Fix current
          </a>
        </div>
        <ol>
          {command.gapQueue.map((gap) => (
            <li key={gap.id} className={cx(gap.status, gap.isCurrent && "current")}>
              <div>
                <span>{gap.status}</span>
                <strong>{gap.label}</strong>
                <small>{gap.owner}</small>
              </div>
              <p>{gap.acceptanceSignal}</p>
              <div className="buyer-pilot-gap-actions">
                <a href={gap.editHref}>
                  <Crosshair size={13} />
                  Fix
                </a>
                <a href={gap.href} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} />
                  Review
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section id="buyer-proof-intake" className="buyer-pilot-proof-intake" aria-label="Buyer proof intake">
        <div className="buyer-pilot-proof-head">
          <div>
            <span>Buyer proof intake</span>
            <strong>
              {liveProofVerification ? `${liveProofVerification.verifiedCount}/${liveProofVerification.totalCount} live links verified` : `${sealedProofCount}/${proofFields.length} evidence links sealed`}
            </strong>
          </div>
          <p>Paste the public proof once; the launch room, proof packet, trust center, and pilot receipt update from this workspace.</p>
          <div className="buyer-pilot-proof-actions">
            <button className={cx("icon-link", proofVerifyStatus === "checked" && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")} type="button" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
              <Gauge size={14} />
              {proofVerificationLabel}
            </button>
            {liveProofVerification ? (
              <small>
                {liveProofVerification.score}/100 reachability checked {new Date(liveProofVerification.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </small>
            ) : proofVerifyStatus === "failed" ? (
              <small className="is-risk">{proofVerifyError || "Proof verification failed."}</small>
            ) : null}
          </div>
        </div>
        <div className="buyer-pilot-proof-fields">
          {proofFields.map((field) => {
            const value = proofIntake[field.key];
            const ready = isPublicProofUrl(value);
            const live = liveProofById.get(field.key);
            return (
              <label key={field.key} className={cx(ready ? "sealed" : "missing", live && `live-${live.status}`)}>
                <span>{field.label}</span>
                <small>{live ? `${live.status}${live.httpStatus ? ` ${live.httpStatus}` : ""}` : ready ? "sealed" : field.target}</small>
                <input
                  name={field.key}
                  type="url"
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(event) => onProofIntakeChange({ [field.key]: event.target.value } as Partial<BuyerPilotProofIntake>)}
                />
              </label>
            );
          })}
        </div>
        {(liveProofVerification || proofVerifyError) && (
          <section className={cx("buyer-pilot-live-proof", proofVerifyStatus)} aria-label="Buyer proof live verification">
            <div className="buyer-pilot-live-head">
              <div>
                <span>Live proof check</span>
                <strong>{liveProofVerification ? `${liveProofVerification.score}/100 public reachability` : "Proof verification failed"}</strong>
                <p>{liveProofVerification ? "Buyer Share Gate now uses this live reachability check before clearing external sharing." : proofVerifyError}</p>
              </div>
              {liveProofVerification && (
                <div>
                  <span>Verified</span>
                  <strong>
                    {liveProofVerification.verifiedCount}/{liveProofVerification.totalCount}
                  </strong>
                </div>
              )}
            </div>
            {liveProofVerification && (
              <div className="buyer-pilot-live-results">
                {liveProofVerification.results.map((result) => (
                  <article key={result.id} className={result.status}>
                    <div>
                      <span>
                        {buyerProofStatusIcon(result.status)}
                        {result.status}
                      </span>
                      <b>{result.httpStatus ?? "URL"}</b>
                    </div>
                    <strong>{result.label}</strong>
                    <p>{result.evidence}</p>
                    <small>{result.action}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        <Suspense
          fallback={
            <section className={cx("buyer-proof-monitor", proofMonitor.readiness)} aria-busy="true" aria-label="Buyer proof freshness monitor">
              <div className="buyer-proof-monitor-head">
                <div>
                  <span>Proof monitor</span>
                  <strong>{proofMonitor.headline}</strong>
                  <p>{proofMonitor.hardTruth}</p>
                </div>
                <div className="buyer-proof-monitor-score">
                  <span>{proofMonitor.readiness}</span>
                  <strong>{proofMonitor.score}</strong>
                  <small>{proofMonitor.stopExternalSharing ? "Stop external sharing" : "External sharing can stay open"}</small>
                </div>
              </div>
            </section>
          }
        >
          <BuyerProofMonitorPanel monitor={proofMonitor} monitorHref={buyerProofMonitorHref} monitorExportHref={proofMonitorExportHref} />
        </Suspense>
        <Suspense
          fallback={
            <section className={cx("buyer-proof-recovery", proofRecovery.severity)} aria-busy="true" aria-label="Buyer proof recovery desk">
              <div className="buyer-proof-recovery-head">
                <div>
                  <span>Recovery desk</span>
                  <strong>{proofRecovery.headline}</strong>
                  <p>{proofRecovery.decision}</p>
                </div>
                <div className="buyer-proof-recovery-state">
                  <span>{proofRecovery.shareInstruction}</span>
                  <strong>{proofRecovery.openTaskCount}</strong>
                  <small>
                    {proofRecovery.blockedTaskCount} block / {proofRecovery.watchTaskCount} watch
                  </small>
                </div>
              </div>
            </section>
          }
        >
          <BuyerProofRecoveryPanel plan={proofRecovery} recoveryHref={buyerProofRecoveryHref} recoveryExportHref={proofRecoveryExportHref} onCopyText={onCopyText} />
        </Suspense>
      </section>
      <section id="buyer-pilot-measured-run" className={cx("buyer-pilot-measured-run", measuredRunSummary.readiness)} aria-label="Measured pilot run">
        <div className="buyer-pilot-measured-head">
          <div>
            <span>Measured pilot run</span>
            <strong>{measuredRunSummary.headline}</strong>
            <p>
              {measuredRunSummary.actualMinutesSavedPerRun}m saved/run, {measuredRunSummary.acceptanceRatePercent}% accepted, {measuredRunSummary.measuredMonthlyHoursSaved}h/month measured.
            </p>
          </div>
          <div className="buyer-pilot-measured-value">
            <span>Measured value</span>
            <strong>{yen(measuredRunSummary.measuredMonthlyValueYen)}</strong>
            <small>{measuredRunSummary.readiness}</small>
          </div>
        </div>
        <div className="buyer-pilot-measured-fields">
          {measuredNumberFields.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <input
                name={field.key}
                type="number"
                min={field.min}
                max={field.max}
                value={field.value}
                onChange={(event) => onMeasuredRunChange({ [field.key]: Number(event.target.value) } as Partial<PilotRunReceiptInput>)}
              />
              <small>{field.suffix}</small>
            </label>
          ))}
          <label className="buyer-pilot-reviewer-field">
            <span>Reviewer</span>
            <input
              name="reviewerName"
              type="text"
              value={measuredRun.reviewerName}
              placeholder="Buyer sponsor"
              onChange={(event) => onMeasuredRunChange({ reviewerName: event.target.value })}
            />
          </label>
        </div>
      </section>
      <section className={cx("buyer-run-calibration", runCalibration.readiness)} aria-label="Buyer-ready run target">
        <div className="buyer-run-calibration-head">
          <div>
            <span>Buyer-ready run target</span>
            <strong>{runCalibration.headline}</strong>
            <p>
              Receipt readiness needs {runCalibration.minimumAcceptedSavingsMinutes}m saved/run, which is 70% of the {runCalibration.plannedMinutesSavedPerRun}m planned workflow saving.
            </p>
          </div>
          <div className="buyer-run-calibration-gap">
            <span>{runCalibration.savingsGapMinutes > 0 ? "Gap" : "Target"}</span>
            <strong>{runCalibration.savingsGapMinutes > 0 ? `${runCalibration.savingsGapMinutes}m` : "met"}</strong>
            <small>
              {runCalibration.actualMinutesSavedPerRun}m observed / {runCalibration.acceptanceRatePercent}% accepted
            </small>
          </div>
        </div>
        <div className="buyer-run-calibration-checks">
          {runCalibration.checks.map((check) => (
            <article key={check.id} className={check.status}>
              <div>
                <span>{check.status}</span>
                <strong>{check.label}</strong>
              </div>
              <p>
                {check.value} / {check.target}
              </p>
              <small>{check.action}</small>
            </article>
          ))}
        </div>
      </section>
      <section className={cx("buyer-measurement-plan", measurementPlan.status)} aria-label="Buyer-ready measurement plan">
        <div className="buyer-measurement-plan-head">
          <div>
            <span>Measured run plan</span>
            <strong>{measurementPlan.headline}</strong>
            <p>
              {measurementPlan.runName}: prove {measurementPlan.targetAcceptedTasks}/{measuredRun.totalTasks} accepted tasks, {measurementPlan.targetParticipants}+ participants, and assisted time at or below {measurementPlan.targetAssistedMinutesMax}m.
            </p>
          </div>
          <a className="icon-link" href={measurementPlanHref} download="buyer-ready-measurement-plan.md">
            <Download size={14} />
            Download plan
          </a>
        </div>
        <div className="buyer-measurement-targets">
          {measurementPlan.targets.map((target) => (
            <article key={target.id} className={target.status}>
              <div>
                <span>{target.status}</span>
                <strong>{target.label}</strong>
              </div>
              <p>
                {target.current} / {target.target}
              </p>
              <small>{target.action}</small>
            </article>
          ))}
        </div>
        <ol className="buyer-measurement-script">
          {measurementPlan.runScript.slice(0, 3).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>
      <section id="buyer-share-gate" className={cx("buyer-share-gate", shareGate.readiness)} aria-label="Buyer share gate">
        <div className="buyer-share-gate-head">
          <div>
            <span>Buyer share gate</span>
            <strong>{shareGate.headline}</strong>
            <p>{shareGate.decision}</p>
          </div>
          <div className="buyer-share-gate-score" aria-label="Buyer share score">
            <span>Share score</span>
            <strong>{shareGate.score}</strong>
            <small>
              {shareGate.blockerCount} blocker{shareGate.blockerCount === 1 ? "" : "s"} / {shareGate.watchCount} warning{shareGate.watchCount === 1 ? "" : "s"}
            </small>
          </div>
          <div className="buyer-share-gate-actions" aria-label="Buyer share packet actions">
            <a className="buyer-share-gate-primary" href={shareGate.primaryActionHref} target={shareGatePrimaryExternal ? "_blank" : undefined} rel={shareGatePrimaryExternal ? "noreferrer" : undefined}>
              {shareGate.readiness === "send-ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
              {shareGate.primaryActionLabel}
            </a>
            <button
              className={cx("icon-link", sharePacketCopyStatus === "copied" && "is-confirmed", sharePacketCopyStatus === "failed" && "is-risk")}
              type="button"
              onClick={copySharePacket}
            >
              <ClipboardCheck size={14} />
              {sharePacketCopyLabel}
            </button>
            <a className="icon-link" href={buyerShareGateHref} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              Public gate
            </a>
            <a className="icon-link" href={decisionReceiptHref} target="_blank" rel="noreferrer">
              <Scale size={14} />
              Decision receipt
            </a>
            <a className="icon-link" href={reviewKitHref} target="_blank" rel="noreferrer">
              <ClipboardCheck size={14} />
              Review kit
            </a>
            <a className="icon-link" href={acceptancePathHref} target="_blank" rel="noreferrer">
              <BadgeCheck size={14} />
              Acceptance path
            </a>
            <a className="icon-link" href={shareGatePacketHref} download="buyer-share-gate-send-packet.md">
              <Download size={14} />
              Export packet
            </a>
          </div>
        </div>
        <div className="buyer-share-gate-checks">
          {shareGate.checks.map((check) => {
            const checkExternal = /^https?:\/\//i.test(check.href);
            return (
              <article key={check.id} className={check.status}>
                <div>
                  <span>{check.status}</span>
                  <strong>{check.label}</strong>
                </div>
                <p>{check.evidence}</p>
                <small>{check.action}</small>
                <a href={check.href} target={checkExternal ? "_blank" : undefined} rel={checkExternal ? "noreferrer" : undefined}>
                  {check.status === "pass" ? <ExternalLink size={13} /> : <Crosshair size={13} />}
                  {check.status === "pass" ? "Open" : "Fix"}
                </a>
              </article>
            );
          })}
        </div>
        <div className={cx("buyer-share-repair-plan", shareGate.repairPlan.status)} aria-label="Buyer send repair plan">
          <div className="buyer-share-repair-head">
            <div>
              <span>Buyer send repair plan</span>
              <strong>{shareGate.repairPlan.headline}</strong>
              <p>{shareGate.repairPlan.summary}</p>
            </div>
            <a className="icon-link" href={shareGate.repairPlan.exportHref} download="buyer-send-repair-plan.md">
              <Download size={14} />
              Export repair plan
            </a>
          </div>
          <ol className="buyer-share-repair-items">
            {shareGate.repairPlan.items.length > 0 ? (
              shareGate.repairPlan.items.map((item) => {
                const repairExternal = /^https?:\/\//i.test(item.href);
                return (
                  <li key={item.id} className={item.status}>
                    <div>
                      <span>
                        {item.sequence}. {item.owner}
                      </span>
                      <strong>
                        {item.status} / {item.label}
                      </strong>
                    </div>
                    <p>{item.action}</p>
                    <small>{item.evidence}</small>
                    <em>{item.unlock}</em>
                    <a href={item.href} target={repairExternal ? "_blank" : undefined} rel={repairExternal ? "noreferrer" : undefined}>
                      {item.status === "pass" ? <ExternalLink size={13} /> : <Crosshair size={13} />}
                      Open repair target
                    </a>
                  </li>
                );
              })
            ) : (
              <li className="pass">
                <div>
                  <span>Ready</span>
                  <strong>No open repair work</strong>
                </div>
                <p>All share-gate checks are pass.</p>
                <small>Keep this repair plan and the decision receipt with the buyer packet.</small>
                <em>External reviewers can replay the send decision from the exported receipt.</em>
              </li>
            )}
          </ol>
          {shareGateProofRepairItem && shareGateProofRepairField && (
            <label className="buyer-share-proof-repair">
              <span>Proof replacement</span>
              <strong>{shareGateProofRepairField.label}</strong>
              <input
                value={shareGateProofRepairValue}
                onChange={(event) => onProofRepairDraftChange(shareGateProofRepairField.key, event.target.value)}
                placeholder={shareGateProofRepairField.placeholder}
                aria-label={`Replacement URL for ${shareGateProofRepairField.label}`}
              />
              <button type="button" onClick={applyShareGateProofRepair} disabled={!shareGateProofRepairCanApply}>
                {proofVerifyStatus === "checking" ? "Checking" : "Save & recheck"}
              </button>
            </label>
          )}
        </div>
        <div className={cx("buyer-share-send-packet", shareGate.sendPacket.mode)} aria-label="Buyer send packet preview">
          <div>
            <span>{shareGate.sendPacket.mode}</span>
            <strong>{shareGate.sendPacket.subject}</strong>
            <p>{shareGate.sendPacket.messageLines[shareGate.sendPacket.messageLines.length - 1]}</p>
          </div>
          <div className="buyer-share-send-criteria">
            {shareGate.sendPacket.acceptanceCriteria.map((criterion) => (
              <article key={criterion.id} className={criterion.status}>
                <span>{criterion.status}</span>
                <strong>{criterion.label}</strong>
              </article>
            ))}
          </div>
          <ul>
            {shareGate.sendPacket.stopRules.slice(0, 2).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>
      {showValueFix && (
        <div className="buyer-pilot-fix-panel" aria-label="Inline buyer value fix">
          <div>
            <span>Value levers</span>
            <strong>Change the assumptions that make this worth buying</strong>
            <p>
              Current claim: {yen(buyerScenario.monthlyGrossValueYen)} / month, {buyerScenario.paybackDays} day payback, {buyerScenario.confidenceScore}/100 confidence.
            </p>
          </div>
          <div className="buyer-pilot-levers">
            {valueLevers.map((lever) => (
              <label key={lever.key}>
                <span>{lever.label}</span>
                <input
                  type="number"
                  min={lever.min}
                  max={lever.max}
                  step={lever.step}
                  value={lever.value}
                  onChange={(event) => onBuyerScenarioChange({ [lever.key]: Number(event.target.value) } as Partial<BuyerValueScenarioInput>)}
                />
                <small>{lever.suffix}</small>
              </label>
            ))}
          </div>
          <a href="#buyer-value-simulator">
            Full ROI model
            <ExternalLink size={13} />
          </a>
        </div>
      )}
      <details className="buyer-pilot-details">
        <summary>
          <span>Artifact readiness</span>
          <strong>{command.proofClosure}</strong>
          <small>Current gap: {command.nextGap.label}</small>
        </summary>
        <ol className="buyer-pilot-rail" aria-label="Buyer pilot artifact path">
          {command.steps.map((step) => (
            <li key={step.id} className={cx(step.status, step.isCurrent && "current")}>
              <span>{step.status}</span>
              <a href={step.href} target="_blank" rel="noreferrer">
                {step.label}
              </a>
              <small>{step.owner}</small>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function CapabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="capability-bar">
      <div className="capability-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter" data-tone={scoreTone(value)}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export type AgentBuyerProofSignalStatus = "ready" | "watch" | "selected" | "available";

export type AgentBuyerProofSignal = {
  status: AgentBuyerProofSignalStatus;
  label: string;
  value: string;
  detail: string;
  href: string;
  actionLabel: string;
};

export type BuyerSquadHandoffStatus = "proof-ready" | "trial-needed" | "scope-needed";

export type BuyerSquadHandoffRow = {
  id: string;
  agentName: string;
  role: string;
  buyerTask: string;
  acceptance: string;
  evidence: string;
  status: BuyerSquadHandoffStatus;
  href: string;
  actionLabel: string;
};

export type BuyerSquadHandoffReadinessStatus = "ready" | "needs-trials" | "needs-scope" | "empty";

export type BuyerSquadHandoffReadiness = {
  status: BuyerSquadHandoffReadinessStatus;
  label: string;
  headline: string;
  detail: string;
  proofReadyCount: number;
  totalCount: number;
  primaryAction: {
    label: string;
    href: string;
  };
};

export type BuyerSquadReviewAgendaStatus = "ready" | "needs-action" | "blocked";

export type BuyerSquadReviewAgendaItem = {
  id: string;
  label: string;
  duration: string;
  owner: string;
  proof: string;
  decision: string;
  status: BuyerSquadReviewAgendaStatus;
};

export type BuyerSquadTrialRepairStatus = "scope-needed" | "proof-needed";

export type BuyerSquadTrialRepairRow = {
  id: string;
  agentName: string;
  status: BuyerSquadTrialRepairStatus;
  requiredArtifact: string;
  acceptanceGate: string;
  responseMustInclude: string;
  href: string;
  actionLabel: string;
};

export type BuyerSquadAcceptanceGateStatus = "pass" | "missing" | "blocked";

export type BuyerSquadAcceptanceMatrixStatus = "accepted" | "needs-proof" | "blocked";

export type BuyerSquadAcceptanceGate = {
  id: string;
  label: string;
  status: BuyerSquadAcceptanceGateStatus;
  evidence: string;
};

export type BuyerSquadAcceptanceMatrixRow = {
  id: string;
  agentName: string;
  status: BuyerSquadAcceptanceMatrixStatus;
  verdict: string;
  requiredEvidence: string;
  rejectIf: string;
  nextAction: string;
  href: string;
  actionLabel: string;
  gates: BuyerSquadAcceptanceGate[];
};

export type BuyerSquadReviewDecisionStatus = "continue" | "revise" | "stop";

export type BuyerSquadReviewDecision = {
  status: BuyerSquadReviewDecisionStatus;
  label: string;
  headline: string;
  detail: string;
  evidence: string;
  owner: string;
  nextAction: string;
  actionLabel: string;
  href: string;
  acceptedCount: number;
  totalCount: number;
};

export type BuyerSquadReviewReplayStepStatus = "ready" | "watch" | "blocked";

export type BuyerSquadReviewReplayStep = {
  id: string;
  label: string;
  status: BuyerSquadReviewReplayStepStatus;
  proof: string;
  action: string;
};

export type BuyerSquadOperatingContractStatus = "ready" | "watch" | "blocked";

export type BuyerSquadOperatingContractTerm = {
  id: string;
  label: string;
  status: BuyerSquadOperatingContractStatus;
  owner: string;
  condition: string;
  proof: string;
  stopRule: string;
};

export type BuyerSquadOperatingContract = {
  status: BuyerSquadOperatingContractStatus;
  label: string;
  headline: string;
  summary: string;
  nextAction: string;
  terms: BuyerSquadOperatingContractTerm[];
};

export type BuyerSquadMeasurementPlanStatus = "ready" | "watch" | "blocked";

export type BuyerSquadMeasurementStep = {
  id: string;
  label: string;
  status: BuyerSquadMeasurementPlanStatus;
  owner: string;
  measure: string;
  evidence: string;
  exitGate: string;
};

export type BuyerSquadMeasurementPlan = {
  status: BuyerSquadMeasurementPlanStatus;
  label: string;
  headline: string;
  metric: string;
  nextAction: string;
  steps: BuyerSquadMeasurementStep[];
};

export type BuyerSquadValueClaimStatus = "ready" | "watch" | "blocked";

export type BuyerSquadValueClaim = {
  id: string;
  label: string;
  status: BuyerSquadValueClaimStatus;
  claim: string;
  evidence: string;
  releaseRule: string;
};

export type BuyerSquadValueClaimLedger = {
  status: BuyerSquadValueClaimStatus;
  label: string;
  headline: string;
  nextAction: string;
  claims: BuyerSquadValueClaim[];
};

export type BuyerSquadClaimProofQueueStatus = "ready" | "watch" | "blocked";

export type BuyerSquadClaimProofQueueItem = {
  id: string;
  sourceClaimId: string;
  label: string;
  status: BuyerSquadClaimProofQueueStatus;
  owner: string;
  requiredArtifact: string;
  acceptanceGate: string;
  nextAction: string;
};

export type BuyerSquadClaimProofQueue = {
  status: BuyerSquadClaimProofQueueStatus;
  label: string;
  headline: string;
  items: BuyerSquadClaimProofQueueItem[];
};

function topAgentSkill(agent: MarketAgent) {
  return agent.skills.reduce((best, skill) => (skill.score > best.score ? skill : best), agent.skills[0]);
}

function topBuyerCapability(agent: MarketAgent) {
  return TOP_CAPABILITIES.reduce((best, key) => (agent.capabilities[key] > agent.capabilities[best] ? key : best), TOP_CAPABILITIES[0]);
}

function trimSentence(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function stableReceiptHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const SQUAD_STAGE_ROLES: Record<MarketAgent["stage"], string> = {
  plan: "Scope owner",
  build: "Build owner",
  deploy: "Release owner",
  operate: "Run owner",
  govern: "Risk owner"
};

const BUYER_SQUAD_REVIEW_RECEIPT_CHECKSUM_FIELDS = [
  "decision",
  "buyerWorkflow",
  "acceptedAgents",
  "openGaps",
  "evidence",
  "nextAction"
] as const;

export function buildAgentBuyerProofSignal({
  agent,
  selected,
  evidenceRecords,
  trialPlanHref,
  diligenceHref
}: {
  agent: MarketAgent;
  selected: boolean;
  evidenceRecords: AgentTrialEvidenceRecord[];
  trialPlanHref: string;
  diligenceHref: string;
}): AgentBuyerProofSignal {
  const agentEvidence = evidenceRecords.filter((record) => record.agentId === agent.id).sort((left, right) => right.attachedAt.localeCompare(left.attachedAt));
  const accepted = agentEvidence.find((record) => record.status === "accepted");
  if (accepted) {
    return {
      status: "ready",
      label: "A2A trial accepted",
      value: `${accepted.score}/100`,
      detail: `${accepted.skillId}: ${accepted.headline || accepted.evidenceSource}`,
      href: accepted.artifactUrl || diligenceHref,
      actionLabel: accepted.artifactUrl ? "Open proof" : "Review proof"
    };
  }

  const latest = agentEvidence[0];
  if (latest) {
    const value = latest.status === "needs-evidence" ? "Needs artifact" : "Trial failed";
    return {
      status: "watch",
      label: "Trial response needs proof",
      value,
      detail: `${latest.skillId}: attach a buyer-safe artifact before sharing this agent.`,
      href: trialPlanHref,
      actionLabel: "Open trial plan"
    };
  }

  const skill = topAgentSkill(agent);
  if (selected) {
    return {
      status: "selected",
      label: "Selected for pilot",
      value: "Trial needed",
      detail: `Run ${skill.label} against one buyer work order before sharing this squad.`,
      href: trialPlanHref,
      actionLabel: "Plan trial"
    };
  }

  const capability = topBuyerCapability(agent);
  return {
    status: "available",
    label: "Buyer-fit trial",
    value: CAPABILITY_LABELS[capability],
    detail: `${skill.label} is ${skill.score}/100. Prove it with one bounded buyer workflow before hiring.`,
    href: trialPlanHref,
    actionLabel: "Plan trial"
  };
}

export function buildBuyerSquadHandoffRows({
  recommendation,
  buyerWorkOrder,
  evidenceRecords,
  trialPlanHref,
  workflowIntakeHref
}: {
  recommendation: Recommendation;
  buyerWorkOrder: BuyerWorkOrderInput;
  evidenceRecords: AgentTrialEvidenceRecord[];
  trialPlanHref: string;
  workflowIntakeHref: string;
}): BuyerSquadHandoffRow[] {
  const hasWorkOrder = Boolean(buyerWorkOrder.request.trim() && buyerWorkOrder.targetUser.trim() && buyerWorkOrder.successMetric.trim());
  const targetUser = buyerWorkOrder.targetUser.trim() || "Target buyer";
  const request = trimSentence(buyerWorkOrder.request || "Complete the buyer work order.", 96);
  const successMetric = trimSentence(buyerWorkOrder.successMetric || "the buyer success metric", 96);

  return recommendation.selected.map((agent) => {
    const skill = topAgentSkill(agent);
    const agentEvidence = evidenceRecords.filter((record) => record.agentId === agent.id).sort((left, right) => right.attachedAt.localeCompare(left.attachedAt));
    const accepted = agentEvidence.find((record) => record.status === "accepted");
    const latest = agentEvidence[0];

    if (!hasWorkOrder) {
      return {
        id: agent.id,
        agentName: agent.name,
        role: SQUAD_STAGE_ROLES[agent.stage],
        buyerTask: `${targetUser}: ${skill.label}`,
        acceptance: "Complete buyer workflow, target user, and success metric before assigning this agent.",
        evidence: "Work order scope is incomplete.",
        status: "scope-needed",
        href: workflowIntakeHref,
        actionLabel: "Finish scope"
      };
    }

    if (accepted) {
      return {
        id: agent.id,
        agentName: agent.name,
        role: SQUAD_STAGE_ROLES[agent.stage],
        buyerTask: `${targetUser}: ${skill.label}`,
        acceptance: `Scope: ${request} Gate: ${successMetric}`,
        evidence: `${accepted.score}/100 accepted A2A proof for ${accepted.skillId}`,
        status: "proof-ready",
        href: accepted.artifactUrl || trialPlanHref,
        actionLabel: accepted.artifactUrl ? "Open proof" : "Review proof"
      };
    }

    return {
      id: agent.id,
      agentName: agent.name,
      role: SQUAD_STAGE_ROLES[agent.stage],
      buyerTask: `${targetUser}: ${skill.label}`,
      acceptance: `Scope: ${request} Gate: ${successMetric}`,
      evidence: latest ? `${latest.status} trial response at ${latest.score}/100 needs buyer-safe evidence.` : "No accepted A2A trial is attached yet.",
      status: "trial-needed",
      href: trialPlanHref,
      actionLabel: "Plan trial"
    };
  });
}

export function buildBuyerSquadHandoffReadiness(rows: BuyerSquadHandoffRow[]): BuyerSquadHandoffReadiness {
  const proofReadyCount = rows.filter((row) => row.status === "proof-ready").length;
  const firstScopeGap = rows.find((row) => row.status === "scope-needed");
  const firstTrialGap = rows.find((row) => row.status === "trial-needed");

  if (rows.length === 0) {
    return {
      status: "empty",
      label: "No squad",
      headline: "Choose agents before buyer review",
      detail: "A buyer-ready handoff needs at least one selected agent, a bounded workflow, and a proof path.",
      proofReadyCount: 0,
      totalCount: 0,
      primaryAction: { label: "Choose agents", href: "#marketplace-workbench" }
    };
  }

  if (firstScopeGap) {
    return {
      status: "needs-scope",
      label: "Scope incomplete",
      headline: `${rows.length} agents need a buyer work order before assignment`,
      detail: `${firstScopeGap.agentName} cannot be evaluated until the target user, workflow, and success metric are complete.`,
      proofReadyCount,
      totalCount: rows.length,
      primaryAction: { label: firstScopeGap.actionLabel, href: firstScopeGap.href }
    };
  }

  if (firstTrialGap) {
    const missingCount = rows.length - proofReadyCount;
    return {
      status: "needs-trials",
      label: "Trial proof missing",
      headline: `${proofReadyCount}/${rows.length} agents are proof-ready`,
      detail: `${firstTrialGap.agentName} is the next agent to prove against the buyer work order.`,
      proofReadyCount,
      totalCount: rows.length,
      primaryAction: { label: `${firstTrialGap.actionLabel}: ${missingCount} remaining`, href: firstTrialGap.href }
    };
  }

  return {
    status: "ready",
    label: "Ready for buyer review",
    headline: `${rows.length}/${rows.length} agents have accepted A2A proof`,
    detail: "Every selected agent has a buyer task, acceptance gate, and accepted A2A trial proof.",
    proofReadyCount,
    totalCount: rows.length,
    primaryAction: { label: "Open proof", href: rows[0].href }
  };
}

export function buildBuyerSquadReviewAgenda({
  readiness,
  rows,
  buyerWorkOrder
}: {
  readiness: BuyerSquadHandoffReadiness;
  rows: BuyerSquadHandoffRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
}): BuyerSquadReviewAgendaItem[] {
  const hasWorkOrder = Boolean(buyerWorkOrder.request.trim() && buyerWorkOrder.targetUser.trim() && buyerWorkOrder.successMetric.trim());
  const targetUser = buyerWorkOrder.targetUser.trim() || "Target buyer";
  const proofRows = rows.filter((row) => row.status === "proof-ready");
  const trialGaps = rows.filter((row) => row.status === "trial-needed");
  const missingNames = trialGaps.map((row) => row.agentName).slice(0, 3).join(", ");
  const scopeStatus: BuyerSquadReviewAgendaStatus = hasWorkOrder ? "ready" : "blocked";
  const proofStatus: BuyerSquadReviewAgendaStatus = rows.length === 0 || !hasWorkOrder ? "blocked" : proofRows.length === rows.length ? "ready" : "needs-action";
  const trialStatus: BuyerSquadReviewAgendaStatus = rows.length === 0 || !hasWorkOrder ? "blocked" : trialGaps.length ? "needs-action" : "ready";
  const reviewStatus: BuyerSquadReviewAgendaStatus = readiness.status === "ready" ? "ready" : readiness.status === "needs-trials" ? "needs-action" : "blocked";

  return [
    {
      id: "scope",
      label: "Confirm buyer workflow",
      duration: "4 min",
      owner: targetUser,
      proof: hasWorkOrder ? trimSentence(buyerWorkOrder.request, 118) : "Target user, workflow, and success metric are not complete.",
      decision: hasWorkOrder ? "Keep this scope for agent review" : "Finish workflow intake",
      status: scopeStatus
    },
    {
      id: "accepted-proof",
      label: "Review accepted trials",
      duration: "6 min",
      owner: "A2A proof owner",
      proof: `${proofRows.length}/${rows.length} selected agents have accepted trial proof.`,
      decision: proofRows.length ? "Open accepted artifacts first" : rows.length ? "Run the first buyer-safe trial" : "Choose agents",
      status: proofStatus
    },
    {
      id: "trial-gaps",
      label: "Assign trial gaps",
      duration: "5 min",
      owner: trialGaps[0]?.agentName || "Squad owner",
      proof: trialGaps.length ? `Missing accepted proof: ${missingNames}${trialGaps.length > 3 ? "..." : ""}` : "No trial gaps remain.",
      decision: trialGaps.length ? `Plan ${trialGaps.length} remaining trial${trialGaps.length === 1 ? "" : "s"}` : "Keep evidence attached",
      status: trialStatus
    },
    {
      id: "buyer-call",
      label: "Make buyer review call",
      duration: "5 min",
      owner: "Sponsor reviewer",
      proof: readiness.headline,
      decision: readiness.status === "ready" ? "Approve buyer review" : readiness.primaryAction.label,
      status: reviewStatus
    }
  ];
}

export function buildBuyerSquadTrialRepairRows({
  rows,
  buyerWorkOrder
}: {
  rows: BuyerSquadHandoffRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
}): BuyerSquadTrialRepairRow[] {
  const targetUser = buyerWorkOrder.targetUser.trim() || "target buyer";
  const successMetric = buyerWorkOrder.successMetric.trim() || "buyer success metric";

  return rows
    .filter((row) => row.status !== "proof-ready")
    .map((row) => {
      if (row.status === "scope-needed") {
        return {
          id: row.id,
          agentName: row.agentName,
          status: "scope-needed",
          requiredArtifact: "Completed buyer work order",
          acceptanceGate: "Target user, workflow request, and success metric are present.",
          responseMustInclude: "Workflow scope, target user, success metric, and evidence URL when available.",
          href: row.href,
          actionLabel: row.actionLabel
        };
      }

      const needsArtifact = row.evidence.toLowerCase().includes("needs-evidence");
      const failedTrial = row.evidence.toLowerCase().includes("failed");
      const requiredArtifact = needsArtifact
        ? "Public HTTPS artifact for the existing trial response"
        : failedTrial
          ? "Fresh A2A trial response with corrected receipt details"
          : `Buyer-safe A2A trial artifact for ${targetUser}`;
      const responseMustInclude = needsArtifact
        ? "artifactUrl, verifierUrl, evidenceSource, acceptance evidence, and reviewer role tied to the original receipt."
        : "receiptId, skillId, artifactUrl, verifierUrl, evidenceSource, acceptance evidence, and reviewer role.";

      return {
        id: row.id,
        agentName: row.agentName,
        status: "proof-needed",
        requiredArtifact,
        acceptanceGate: `Show this agent can satisfy: ${successMetric}`,
        responseMustInclude,
        href: row.href,
        actionLabel: row.actionLabel
      };
    });
}

export function buildBuyerSquadTrialRepairPacket({
  repairRows,
  buyerWorkOrder
}: {
  repairRows: BuyerSquadTrialRepairRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
}) {
  const targetUser = buyerWorkOrder.targetUser.trim() || "Target buyer";
  const request = buyerWorkOrder.request.trim() || "Buyer workflow not set";
  const successMetric = buyerWorkOrder.successMetric.trim() || "Success metric not set";
  const repairLines = repairRows.length
    ? repairRows.flatMap((row) => [
        `- Agent: ${row.agentName}`,
        `  Required artifact: ${row.requiredArtifact}`,
        `  Acceptance gate: ${row.acceptanceGate}`,
        `  Response must include: ${row.responseMustInclude}`,
        `  Review link: ${row.href}`
      ])
    : ["- No trial repair is needed."];

  return [
    "# Buyer squad trial repair packet",
    "",
    "Buyer workflow",
    `Target user: ${targetUser}`,
    `Request: ${request}`,
    `Success metric: ${successMetric}`,
    "",
    "Repair requests",
    ...repairLines,
    "",
    "Response JSON shape",
    "```json",
    JSON.stringify(
      {
        receiptId: "trial-receipt-id",
        skillId: "agent-skill-id",
        status: "completed",
        artifactUrl: "<public HTTPS A2A trial receipt artifact URL reviewers can open>",
        verifierUrl: "<public verifier URL or /receipt-verifier>",
        openedBy: "<buyer reviewer role>",
        evidenceSource: "accepted A2A receipt, public logs, or signed trial artifact",
        acceptance: ["evidence item matching the buyer success metric"]
      },
      null,
      2
    ),
    "```",
    "",
    "Stop rules",
    "- Stop if credentials are required.",
    "- Stop if a private URL or private network target is requested.",
    "- Stop if the task would mutate production state."
  ].join("\n");
}

export function buildBuyerSquadAcceptanceMatrix({
  rows,
  buyerWorkOrder
}: {
  rows: BuyerSquadHandoffRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
}): BuyerSquadAcceptanceMatrixRow[] {
  const hasWorkOrder = Boolean(buyerWorkOrder.request.trim() && buyerWorkOrder.targetUser.trim() && buyerWorkOrder.successMetric.trim());
  const successMetric = buyerWorkOrder.successMetric.trim() || "Success metric not set";

  return rows.map((row) => {
    const hasAcceptedTrial = row.status === "proof-ready";
    const hasPublicArtifact = hasAcceptedTrial && row.actionLabel === "Open proof" && row.href.startsWith("https://");
    const scopeGate: BuyerSquadAcceptanceGate = {
      id: "scope",
      label: "Buyer scope",
      status: hasWorkOrder ? "pass" : "blocked",
      evidence: hasWorkOrder ? row.acceptance : "Target user, workflow request, and success metric are required."
    };
    const trialGate: BuyerSquadAcceptanceGate = {
      id: "trial",
      label: "Accepted A2A trial",
      status: hasAcceptedTrial ? "pass" : row.status === "scope-needed" ? "blocked" : "missing",
      evidence: hasAcceptedTrial ? row.evidence : "No accepted A2A trial is attached to this agent."
    };
    const artifactGate: BuyerSquadAcceptanceGate = {
      id: "artifact",
      label: "Public artifact",
      status: hasPublicArtifact ? "pass" : row.status === "scope-needed" ? "blocked" : "missing",
      evidence: hasPublicArtifact ? row.href : "Attach a public HTTPS artifact before buyer review."
    };
    const gates = [scopeGate, trialGate, artifactGate];

    if (!hasWorkOrder || row.status === "scope-needed") {
      return {
        id: row.id,
        agentName: row.agentName,
        status: "blocked",
        verdict: "Scope required",
        requiredEvidence: "Complete the buyer workflow, target user, and success metric before judging this agent.",
        rejectIf: "The response does not name the buyer workflow and success metric.",
        nextAction: "Finish buyer workflow scope.",
        href: row.href,
        actionLabel: row.actionLabel,
        gates
      };
    }

    if (!hasAcceptedTrial) {
      return {
        id: row.id,
        agentName: row.agentName,
        status: "needs-proof",
        verdict: "Trial proof required",
        requiredEvidence: `Accepted A2A trial evidence tied to: ${successMetric}`,
        rejectIf: "The artifact only describes capability and does not include an accepted trial receipt.",
        nextAction: "Run or repair the buyer-safe A2A trial.",
        href: row.href,
        actionLabel: row.actionLabel,
        gates
      };
    }

    if (!hasPublicArtifact) {
      return {
        id: row.id,
        agentName: row.agentName,
        status: "needs-proof",
        verdict: "Artifact required",
        requiredEvidence: "Public HTTPS artifact linked to the accepted A2A trial receipt.",
        rejectIf: "The proof is only internal, private, or missing a stable HTTPS artifact URL.",
        nextAction: "Attach a public-safe artifact URL.",
        href: row.href,
        actionLabel: row.actionLabel,
        gates
      };
    }

    return {
      id: row.id,
      agentName: row.agentName,
      status: "accepted",
      verdict: "Accept for buyer review",
      requiredEvidence: row.evidence,
      rejectIf: "The public artifact no longer resolves or no longer matches the buyer success metric.",
      nextAction: "Open proof with the buyer.",
      href: row.href,
      actionLabel: row.actionLabel,
      gates
    };
  });
}

export function buildBuyerSquadReviewDecision({
  readiness,
  acceptanceMatrix
}: {
  readiness: BuyerSquadHandoffReadiness;
  acceptanceMatrix: BuyerSquadAcceptanceMatrixRow[];
}): BuyerSquadReviewDecision {
  const acceptedCount = acceptanceMatrix.filter((item) => item.status === "accepted").length;
  const totalCount = acceptanceMatrix.length;
  const firstBlocked = acceptanceMatrix.find((item) => item.status === "blocked");
  const firstProofGap = acceptanceMatrix.find((item) => item.status === "needs-proof");

  if (totalCount === 0) {
    return {
      status: "stop",
      label: "Stop review",
      headline: "Choose agents before buyer review",
      detail: "A review decision needs at least one selected agent with a buyer task and proof path.",
      evidence: readiness.detail,
      owner: "Squad owner",
      nextAction: "Choose the first agent for the buyer workflow.",
      actionLabel: readiness.primaryAction.label,
      href: readiness.primaryAction.href,
      acceptedCount,
      totalCount
    };
  }

  if (firstBlocked) {
    return {
      status: "stop",
      label: "Stop external share",
      headline: "Scope is not ready for buyer review",
      detail: `${firstBlocked.agentName}: ${firstBlocked.requiredEvidence}`,
      evidence: firstBlocked.rejectIf,
      owner: firstBlocked.agentName,
      nextAction: firstBlocked.nextAction,
      actionLabel: firstBlocked.actionLabel,
      href: firstBlocked.href,
      acceptedCount,
      totalCount
    };
  }

  if (firstProofGap) {
    return {
      status: "revise",
      label: "Revise before buyer",
      headline: `${acceptedCount}/${totalCount} agents accepted for buyer review`,
      detail: `${firstProofGap.agentName}: ${firstProofGap.requiredEvidence}`,
      evidence: firstProofGap.rejectIf,
      owner: firstProofGap.agentName,
      nextAction: firstProofGap.nextAction,
      actionLabel: firstProofGap.actionLabel,
      href: firstProofGap.href,
      acceptedCount,
      totalCount
    };
  }

  return {
    status: "continue",
    label: "Continue to buyer",
    headline: `${acceptedCount}/${totalCount} agents accepted for buyer review`,
    detail: "Every selected agent has buyer scope, accepted A2A trial proof, and a public artifact.",
    evidence: acceptanceMatrix.map((item) => `${item.agentName}: ${item.requiredEvidence}`).join(" | "),
    owner: "Sponsor reviewer",
    nextAction: "Open the proof artifacts and record the sponsor decision.",
    actionLabel: "Open proof",
    href: acceptanceMatrix[0]?.href ?? readiness.primaryAction.href,
    acceptedCount,
    totalCount
  };
}

export function buildBuyerSquadReviewDecisionReceiptPayload({
  decision,
  acceptanceMatrix,
  buyerWorkOrder
}: {
  decision: BuyerSquadReviewDecision;
  acceptanceMatrix: BuyerSquadAcceptanceMatrixRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
}) {
  const targetUser = buyerWorkOrder.targetUser.trim() || "Target buyer";
  const request = buyerWorkOrder.request.trim() || "Buyer workflow not set";
  const successMetric = buyerWorkOrder.successMetric.trim() || "Success metric not set";
  const acceptedAgents = acceptanceMatrix.filter((item) => item.status === "accepted");
  const openGaps = acceptanceMatrix.filter((item) => item.status !== "accepted");
  const receiptCore = {
    checksumFields: [...BUYER_SQUAD_REVIEW_RECEIPT_CHECKSUM_FIELDS],
    decision: decision.status,
    label: decision.label,
    headline: decision.headline,
    owner: decision.owner,
    targetUser,
    request,
    successMetric,
    acceptedCount: decision.acceptedCount,
    totalCount: decision.totalCount,
    acceptedAgents: acceptedAgents.map((item) => ({
      agentName: item.agentName,
      requiredEvidence: item.requiredEvidence,
      proofUrl: item.href
    })),
    openGaps: openGaps.map((item) => ({
      agentName: item.agentName,
      status: item.status,
      verdict: item.verdict,
      requiredEvidence: item.requiredEvidence,
      rejectIf: item.rejectIf,
      nextAction: item.nextAction
    })),
    evidence: decision.evidence,
    nextAction: decision.nextAction
  };
  const proofChecksum = stableReceiptHash(JSON.stringify(receiptCore));

  return {
    receiptId: `buyer-squad-review-${decision.status}-${proofChecksum}`,
    checksumAlgorithm: "fnv1a32",
    proofChecksum,
    ...receiptCore
  };
}

export function buildBuyerSquadReviewReplaySteps({
  decision,
  receiptPayload
}: {
  decision: BuyerSquadReviewDecision;
  receiptPayload: ReturnType<typeof buildBuyerSquadReviewDecisionReceiptPayload>;
}): BuyerSquadReviewReplayStep[] {
  const openGapCount = receiptPayload.openGaps.length;
  const firstGap = receiptPayload.openGaps[0];
  const gapStatus: BuyerSquadReviewReplayStepStatus = openGapCount === 0 ? "ready" : decision.status === "stop" ? "blocked" : "watch";
  const outcomeStatus: BuyerSquadReviewReplayStepStatus = decision.status === "continue" ? "ready" : decision.status === "revise" ? "watch" : "blocked";

  return [
    {
      id: "receipt-identity",
      label: "Match receipt identity",
      status: "ready",
      proof: `${receiptPayload.receiptId}, ${receiptPayload.checksumAlgorithm}:${receiptPayload.proofChecksum}`,
      action: "Compare the receipt header with the JSON payload before forwarding."
    },
    {
      id: "checksum-replay",
      label: "Replay checksum",
      status: "ready",
      proof: `Checksum covers ${receiptPayload.checksumFields.join(", ")}.`,
      action: "Recompute the checksum over the receipt payload fields."
    },
    {
      id: "gap-closure",
      label: "Check open gaps",
      status: gapStatus,
      proof: openGapCount ? `${openGapCount} open proof gap${openGapCount === 1 ? " remains" : "s remain"}.` : "No open proof gaps remain.",
      action: firstGap ? `${firstGap.agentName}: ${firstGap.nextAction}` : "Keep accepted proof attached."
    },
    {
      id: "review-record",
      label: "Record review outcome",
      status: outcomeStatus,
      proof: `Decision ${receiptPayload.decision}; owner ${receiptPayload.owner}.`,
      action:
        decision.status === "continue"
          ? "Record the sponsor continue decision before pilot start."
          : decision.status === "revise"
            ? "Record the revise decision and attach open gap owners."
            : "Record the stop decision before external sharing."
    }
  ];
}

export function buildBuyerSquadOperatingContract({
  decision,
  receiptPayload
}: {
  decision: BuyerSquadReviewDecision;
  receiptPayload: ReturnType<typeof buildBuyerSquadReviewDecisionReceiptPayload>;
}): BuyerSquadOperatingContract {
  const openGapCount = receiptPayload.openGaps.length;
  const firstGap = receiptPayload.openGaps[0];
  const scopeReady =
    receiptPayload.targetUser !== "Target buyer" && receiptPayload.request !== "Buyer workflow not set" && receiptPayload.successMetric !== "Success metric not set";
  const gapStatus: BuyerSquadOperatingContractStatus = openGapCount === 0 ? "ready" : decision.status === "stop" ? "blocked" : "watch";
  const decisionStatus: BuyerSquadOperatingContractStatus = decision.status === "continue" ? "ready" : decision.status === "revise" ? "watch" : "blocked";
  const openGapLabel = `${openGapCount} open proof gap${openGapCount === 1 ? "" : "s"}`;
  const label = decision.status === "continue" ? "Pilot contract ready" : decision.status === "revise" ? "Repair before pilot" : "Do not share";
  const headline =
    decision.status === "continue"
      ? `${receiptPayload.acceptedCount}/${receiptPayload.totalCount} agents cleared for ${receiptPayload.targetUser}`
      : decision.status === "revise"
        ? `${openGapLabel} before ${receiptPayload.targetUser} can run the squad`
        : `Stop buyer sharing until ${receiptPayload.owner} clears the blocker`;
  const summary =
    decision.status === "continue"
      ? `Run ${receiptPayload.request} only against ${receiptPayload.successMetric}.`
      : decision.status === "revise"
        ? `Hold buyer execution until the open proof gaps are repaired and this receipt is replayed.`
        : `Do not start or externally share this squad from the current receipt.`;

  return {
    status: decision.status === "continue" ? "ready" : decision.status === "revise" ? "watch" : "blocked",
    label,
    headline,
    summary,
    nextAction: firstGap ? firstGap.nextAction : decision.nextAction,
    terms: [
      {
        id: "scope-lock",
        label: "Scope lock",
        status: scopeReady ? "ready" : "blocked",
        owner: receiptPayload.targetUser,
        condition: `Run only: ${receiptPayload.request}`,
        proof: `Success metric: ${receiptPayload.successMetric}`,
        stopRule: "Stop if the pilot task changes without a new review receipt."
      },
      {
        id: "proof-floor",
        label: "Proof floor",
        status: gapStatus,
        owner: firstGap?.agentName || "A2A proof owner",
        condition: `${receiptPayload.acceptedCount}/${receiptPayload.totalCount} agents must have accepted A2A trial proof and a public artifact.`,
        proof: firstGap ? firstGap.requiredEvidence : "All selected agents are accepted for buyer review.",
        stopRule: firstGap ? firstGap.rejectIf : "Stop if any proof URL no longer resolves or no longer matches the buyer success metric."
      },
      {
        id: "decision-record",
        label: "Decision record",
        status: decisionStatus,
        owner: receiptPayload.owner,
        condition: `Record ${receiptPayload.receiptId} before external sharing.`,
        proof: `${receiptPayload.checksumAlgorithm}:${receiptPayload.proofChecksum}`,
        stopRule: "Stop if the forwarded receipt checksum differs from the recorded payload."
      },
      {
        id: decision.status === "continue" ? "pilot-start" : decision.status === "revise" ? "pilot-hold" : "pilot-stop",
        label: decision.status === "continue" ? "Pilot start" : decision.status === "revise" ? "Pilot hold" : "Pilot stop",
        status: decisionStatus,
        owner: decision.status === "continue" ? "Sponsor reviewer" : receiptPayload.owner,
        condition:
          decision.status === "continue"
            ? "Start only after the sponsor records the continue decision."
            : decision.status === "revise"
              ? "Hold execution until every open proof gap has an accepted artifact."
              : "Do not start the buyer pilot from this squad state.",
        proof: decision.nextAction,
        stopRule: firstGap ? `Stop while ${firstGap.agentName} remains unaccepted.` : "Stop when any acceptance gate becomes missing or blocked."
      }
    ]
  };
}

function buildBuyerSquadOperatingContractLines(contract: BuyerSquadOperatingContract) {
  return [
    "Pilot operating contract",
    `Contract: ${contract.label} (${contract.status})`,
    `Headline: ${contract.headline}`,
    `Summary: ${contract.summary}`,
    `Next action: ${contract.nextAction}`,
    ...contract.terms.flatMap((term) => [
      `- ${term.label} (${term.status})`,
      `  Owner: ${term.owner}`,
      `  Condition: ${term.condition}`,
      `  Proof: ${term.proof}`,
      `  Stop rule: ${term.stopRule}`
    ])
  ];
}

export function buildBuyerSquadMeasurementPlan({
  decision,
  receiptPayload,
  buyerWorkOrder
}: {
  decision: BuyerSquadReviewDecision;
  receiptPayload: ReturnType<typeof buildBuyerSquadReviewDecisionReceiptPayload>;
  buyerWorkOrder: BuyerWorkOrderInput;
}): BuyerSquadMeasurementPlan {
  const baselineText = buyerWorkOrder.currentBaseline.trim();
  const baseline = baselineText || "Capture the current manual baseline before the pilot starts.";
  const evidenceUrl = buyerWorkOrder.evidenceUrl.trim();
  const openGapCount = receiptPayload.openGaps.length;
  const firstGap = receiptPayload.openGaps[0];
  const runStatus: BuyerSquadMeasurementPlanStatus = decision.status === "continue" ? "ready" : decision.status === "revise" ? "watch" : "blocked";
  const baselineStatus: BuyerSquadMeasurementPlanStatus = receiptPayload.request === "Buyer workflow not set" ? "blocked" : baselineText && evidenceUrl ? "ready" : "watch";
  const proofStatus: BuyerSquadMeasurementPlanStatus = openGapCount === 0 ? "ready" : decision.status === "stop" ? "blocked" : "watch";
  const label = decision.status === "continue" ? "Measurement ready" : decision.status === "revise" ? "Measurement waiting on proof" : "Measurement blocked";
  const headline =
    decision.status === "continue"
      ? `Measure ${receiptPayload.successMetric} during the first buyer pilot.`
      : decision.status === "revise"
        ? `Repair ${openGapCount} proof gap${openGapCount === 1 ? "" : "s"} before measuring buyer value.`
        : "Do not measure value from an unapproved buyer run.";

  return {
    status: runStatus,
    label,
    headline,
    metric: receiptPayload.successMetric,
    nextAction: firstGap ? firstGap.nextAction : "Run the measured pilot and attach the outcome receipt.",
    steps: [
      {
        id: "baseline-snapshot",
        label: "Baseline snapshot",
        status: baselineStatus,
        owner: receiptPayload.targetUser,
        measure: baseline,
        evidence: evidenceUrl || "Attach the current workflow evidence URL before the measured run.",
        exitGate: "Baseline must name the manual path, owner, and expected time or quality burden."
      },
      {
        id: "assisted-run",
        label: "Assisted run",
        status: proofStatus,
        owner: firstGap?.agentName || "A2A proof owner",
        measure: `Run the squad against: ${receiptPayload.request}`,
        evidence: firstGap ? firstGap.requiredEvidence : `${receiptPayload.acceptedCount}/${receiptPayload.totalCount} accepted agents can run the buyer workflow.`,
        exitGate: firstGap ? firstGap.nextAction : "Every selected agent keeps accepted A2A proof attached during the run."
      },
      {
        id: "outcome-check",
        label: "Outcome check",
        status: runStatus,
        owner: "Sponsor reviewer",
        measure: `Judge whether the run satisfies: ${receiptPayload.successMetric}`,
        evidence: `${receiptPayload.receiptId} with ${receiptPayload.checksumAlgorithm}:${receiptPayload.proofChecksum}`,
        exitGate:
          decision.status === "continue"
            ? "Sponsor records continue only if the measured result meets the success metric."
            : "Do not claim measured value until the sponsor can replay the receipt."
      },
      {
        id: "rollout-decision",
        label: "Rollout decision",
        status: runStatus,
        owner: receiptPayload.owner,
        measure: decision.status === "continue" ? "Decide expand, hold, or stop from the measured receipt." : "Hold rollout until the proof repair is accepted.",
        evidence: decision.evidence,
        exitGate: "Expansion requires a public artifact, accepted receipt, and buyer owner signoff."
      }
    ]
  };
}

function buildBuyerSquadMeasurementPlanLines(plan: BuyerSquadMeasurementPlan) {
  return [
    "Pilot measurement plan",
    `Plan: ${plan.label} (${plan.status})`,
    `Metric: ${plan.metric}`,
    `Headline: ${plan.headline}`,
    `Next action: ${plan.nextAction}`,
    ...plan.steps.flatMap((step) => [
      `- ${step.label} (${step.status})`,
      `  Owner: ${step.owner}`,
      `  Measure: ${step.measure}`,
      `  Evidence: ${step.evidence}`,
      `  Exit gate: ${step.exitGate}`
    ])
  ];
}

export function buildBuyerSquadValueClaimLedger({
  decision,
  receiptPayload,
  measurementPlan
}: {
  decision: BuyerSquadReviewDecision;
  receiptPayload: ReturnType<typeof buildBuyerSquadReviewDecisionReceiptPayload>;
  measurementPlan: BuyerSquadMeasurementPlan;
}): BuyerSquadValueClaimLedger {
  const openGapCount = receiptPayload.openGaps.length;
  const status: BuyerSquadValueClaimStatus = decision.status === "continue" && measurementPlan.steps.every((step) => step.status === "ready") ? "ready" : decision.status === "stop" ? "blocked" : "watch";
  const firstGap = receiptPayload.openGaps[0];
  const stepById = new Map(measurementPlan.steps.map((step) => [step.id, step]));
  const baseline = stepById.get("baseline-snapshot");
  const assistedRun = stepById.get("assisted-run");
  const outcome = stepById.get("outcome-check");
  const rollout = stepById.get("rollout-decision");
  const proofStatus: BuyerSquadValueClaimStatus = openGapCount === 0 && decision.status === "continue" ? "ready" : decision.status === "stop" ? "blocked" : "watch";
  const outcomeStatus: BuyerSquadValueClaimStatus = status === "ready" ? "ready" : decision.status === "stop" ? "blocked" : "watch";
  const headline =
    status === "ready"
      ? `Value claims for ${receiptPayload.targetUser} can be shared with the measured receipt.`
      : status === "blocked"
        ? "Do not publish buyer value claims from this squad state."
        : `Hold value claims until ${openGapCount} proof gap${openGapCount === 1 ? "" : "s"} and the measured outcome are closed.`;

  return {
    status,
    label: status === "ready" ? "Claims publishable" : status === "blocked" ? "Claims blocked" : "Claims need proof",
    headline,
    nextAction: firstGap ? firstGap.nextAction : measurementPlan.nextAction,
    claims: [
      {
        id: "scope-claim",
        label: "Workflow claim",
        status: baseline?.status === "ready" ? "ready" : baseline?.status === "blocked" ? "blocked" : "watch",
        claim: `${receiptPayload.targetUser} has a bounded workflow and success metric.`,
        evidence: baseline?.evidence || "No baseline evidence is attached.",
        releaseRule: baseline?.status === "ready" ? "Can share the scoped workflow, not the outcome claim yet." : baseline?.exitGate || "Attach baseline evidence first."
      },
      {
        id: "proof-claim",
        label: "Execution claim",
        status: proofStatus,
        claim: `${receiptPayload.acceptedCount}/${receiptPayload.totalCount} selected agents have accepted A2A proof for the buyer workflow.`,
        evidence: assistedRun?.evidence || "No assisted-run evidence is attached.",
        releaseRule: firstGap ? firstGap.nextAction : assistedRun?.exitGate || "Keep accepted A2A proof attached."
      },
      {
        id: "outcome-claim",
        label: "Outcome claim",
        status: outcomeStatus,
        claim: `The squad can claim: ${receiptPayload.successMetric}`,
        evidence: outcome?.evidence || "No outcome receipt is attached.",
        releaseRule: outcome?.exitGate || "Attach the measured outcome receipt before publishing value."
      },
      {
        id: "rollout-claim",
        label: "Rollout claim",
        status: outcomeStatus,
        claim: decision.status === "continue" ? "The buyer can decide expand, hold, or stop from the measured receipt." : "Rollout remains held until proof repair and outcome replay are complete.",
        evidence: rollout?.evidence || decision.evidence,
        releaseRule: rollout?.exitGate || "Expansion requires buyer owner signoff."
      }
    ]
  };
}

function buildBuyerSquadValueClaimLedgerLines(ledger: BuyerSquadValueClaimLedger) {
  return [
    "Buyer value claim ledger",
    `Ledger: ${ledger.label} (${ledger.status})`,
    `Headline: ${ledger.headline}`,
    `Next action: ${ledger.nextAction}`,
    ...ledger.claims.flatMap((claim) => [
      `- ${claim.label} (${claim.status})`,
      `  Claim: ${claim.claim}`,
      `  Evidence: ${claim.evidence}`,
      `  Release rule: ${claim.releaseRule}`
    ])
  ];
}

export function buildBuyerSquadClaimProofQueue({
  ledger,
  measurementPlan,
  receiptPayload
}: {
  ledger: BuyerSquadValueClaimLedger;
  measurementPlan: BuyerSquadMeasurementPlan;
  receiptPayload: ReturnType<typeof buildBuyerSquadReviewDecisionReceiptPayload>;
}): BuyerSquadClaimProofQueue {
  const stepById = new Map(measurementPlan.steps.map((step) => [step.id, step]));
  const firstGap = receiptPayload.openGaps[0];
  const owners = {
    "scope-claim": stepById.get("baseline-snapshot")?.owner || receiptPayload.targetUser,
    "proof-claim": firstGap?.agentName || stepById.get("assisted-run")?.owner || "A2A proof owner",
    "outcome-claim": stepById.get("outcome-check")?.owner || "Sponsor reviewer",
    "rollout-claim": stepById.get("rollout-decision")?.owner || receiptPayload.owner
  } as const;
  const artifactByClaim = {
    "scope-claim": "Baseline evidence URL with current manual path, owner, and burden.",
    "proof-claim": firstGap ? `Accepted A2A trial artifact for ${firstGap.agentName}.` : "Accepted A2A trial artifacts for every selected agent.",
    "outcome-claim": "Measured pilot outcome receipt tied to the buyer success metric.",
    "rollout-claim": "Sponsor rollout decision with buyer owner signoff."
  } as const;
  const acceptanceByClaim = {
    "scope-claim": "Baseline resolves publicly and names what changed from the current workflow.",
    "proof-claim": "Every selected agent has an accepted receipt and public artifact.",
    "outcome-claim": `Measured result can be replayed against: ${receiptPayload.successMetric}`,
    "rollout-claim": "Expand, hold, or stop decision cites the accepted receipt and public artifact."
  } as const;
  const items = ledger.claims
    .filter((claim) => claim.status !== "ready")
    .map((claim) => ({
      id: `proof-${claim.id}`,
      sourceClaimId: claim.id,
      label: claim.label,
      status: claim.status,
      owner: owners[claim.id as keyof typeof owners],
      requiredArtifact: artifactByClaim[claim.id as keyof typeof artifactByClaim],
      acceptanceGate: acceptanceByClaim[claim.id as keyof typeof acceptanceByClaim],
      nextAction: claim.releaseRule
    }));
  const status: BuyerSquadClaimProofQueueStatus = items.length === 0 ? "ready" : ledger.status === "blocked" ? "blocked" : "watch";

  return {
    status,
    label: status === "ready" ? "Claim proof complete" : status === "blocked" ? "Claim proof blocked" : "Claim proof queue",
    headline: items.length
      ? `${items.length} value claim${items.length === 1 ? "" : "s"} need evidence before public sharing.`
      : "All value claims have enough evidence for public sharing.",
    items
  };
}

function buildBuyerSquadClaimProofQueueLines(queue: BuyerSquadClaimProofQueue) {
  const itemLines = queue.items.length
    ? queue.items.flatMap((item) => [
        `- ${item.label} (${item.status})`,
        `  Owner: ${item.owner}`,
        `  Required artifact: ${item.requiredArtifact}`,
        `  Acceptance gate: ${item.acceptanceGate}`,
        `  Next action: ${item.nextAction}`
      ])
    : ["- No value claim proof repair is needed."];

  return ["Value claim proof queue", `Queue: ${queue.label} (${queue.status})`, `Headline: ${queue.headline}`, ...itemLines];
}

export function buildBuyerSquadClaimProofPacket({
  queue,
  receiptPayload
}: {
  queue: BuyerSquadClaimProofQueue;
  receiptPayload: ReturnType<typeof buildBuyerSquadReviewDecisionReceiptPayload>;
}) {
  const requestLines = queue.items.length
    ? queue.items.flatMap((item) => [
        `- Claim: ${item.label}`,
        `  Status: ${item.status}`,
        `  Owner: ${item.owner}`,
        `  Required artifact: ${item.requiredArtifact}`,
        `  Acceptance gate: ${item.acceptanceGate}`,
        `  Next action: ${item.nextAction}`
      ])
    : ["- No value claim proof repair is needed."];

  return [
    "# Value claim proof packet",
    "",
    "Receipt",
    `Receipt: ${receiptPayload.receiptId}`,
    `Checksum: ${receiptPayload.checksumAlgorithm}:${receiptPayload.proofChecksum}`,
    `Queue: ${queue.label} (${queue.status})`,
    "",
    "Buyer workflow",
    `Target user: ${receiptPayload.targetUser}`,
    `Request: ${receiptPayload.request}`,
    `Success metric: ${receiptPayload.successMetric}`,
    "",
    "Proof requests",
    ...requestLines,
    "",
    "Response JSON shape",
    "```json",
    JSON.stringify(
      {
        receiptId: receiptPayload.receiptId,
        claimId: "outcome-claim",
        artifactUrl: "<public HTTPS measured outcome artifact URL reviewers can open>",
        verifierUrl: "<public verifier URL or /receipt-verifier>",
        openedBy: "<buyer reviewer role>",
        evidenceSource: "measured run receipt, accepted A2A artifact, or sponsor decision record",
        acceptance: ["evidence item matching the buyer success metric"]
      },
      null,
      2
    ),
    "```",
    "",
    "Stop rules",
    "- Do not publish value claims until the queue item is ready.",
    "- Stop if the proof artifact requires private credentials.",
    "- Stop if the receipt checksum differs from the recorded payload."
  ].join("\n");
}

export function buildBuyerSquadReviewDecisionReceipt({
  decision,
  acceptanceMatrix,
  buyerWorkOrder
}: {
  decision: BuyerSquadReviewDecision;
  acceptanceMatrix: BuyerSquadAcceptanceMatrixRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
}) {
  const payload = buildBuyerSquadReviewDecisionReceiptPayload({ decision, acceptanceMatrix, buyerWorkOrder });
  const replaySteps = buildBuyerSquadReviewReplaySteps({ decision, receiptPayload: payload });
  const operatingContract = buildBuyerSquadOperatingContract({ decision, receiptPayload: payload });
  const measurementPlan = buildBuyerSquadMeasurementPlan({ decision, receiptPayload: payload, buyerWorkOrder });
  const valueClaimLedger = buildBuyerSquadValueClaimLedger({ decision, receiptPayload: payload, measurementPlan });
  const claimProofQueue = buildBuyerSquadClaimProofQueue({ ledger: valueClaimLedger, measurementPlan, receiptPayload: payload });
  const acceptedLines = payload.acceptedAgents.length
    ? payload.acceptedAgents.map((item) => `- ${item.agentName}: ${item.requiredEvidence}`)
    : ["- No agents are accepted for buyer review yet."];
  const gapLines = payload.openGaps.length
    ? payload.openGaps.flatMap((item) => [
        `- ${item.agentName}: ${item.verdict}`,
        `  Missing evidence: ${item.requiredEvidence}`,
        `  Reject if: ${item.rejectIf}`,
        `  Next action: ${item.nextAction}`
      ])
    : ["- No open proof gaps remain."];

  return [
    "# Buyer squad review decision receipt",
    "",
    "Decision",
    `Receipt: ${payload.receiptId}`,
    `Checksum: ${payload.checksumAlgorithm}:${payload.proofChecksum}`,
    `Status: ${payload.decision}`,
    `Label: ${payload.label}`,
    `Headline: ${payload.headline}`,
    `Owner: ${payload.owner}`,
    `Next action: ${payload.nextAction}`,
    "",
    "Buyer workflow",
    `Target user: ${payload.targetUser}`,
    `Request: ${payload.request}`,
    `Success metric: ${payload.successMetric}`,
    "",
    "Accepted proof",
    ...acceptedLines,
    "",
    "Open gaps",
    ...gapLines,
    "",
    "Checksum coverage",
    ...payload.checksumFields.map((field) => `- ${field}`),
    "",
    "Replay checklist",
    ...replaySteps.flatMap((step) => [
      `- ${step.label} (${step.status})`,
      `  Proof: ${step.proof}`,
      `  Action: ${step.action}`
    ]),
    "",
    ...buildBuyerSquadOperatingContractLines(operatingContract),
    "",
    ...buildBuyerSquadMeasurementPlanLines(measurementPlan),
    "",
    ...buildBuyerSquadValueClaimLedgerLines(valueClaimLedger),
    "",
    ...buildBuyerSquadClaimProofQueueLines(claimProofQueue),
    "",
    "Receipt JSON shape",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
    "",
    "Record rules",
    "- Record this receipt before external buyer sharing.",
    "- Revise or stop when any acceptance gate is missing or blocked.",
    "- Continue only when every selected agent has a public artifact tied to accepted A2A proof.",
    "- Recompute the checksum over the receipt payload before accepting a forwarded receipt."
  ].join("\n");
}

export function buildBuyerSquadHandoffMemo({
  readiness,
  rows,
  buyerWorkOrder,
  agenda,
  repairRows,
  acceptanceMatrix,
  reviewDecision
}: {
  readiness: BuyerSquadHandoffReadiness;
  rows: BuyerSquadHandoffRow[];
  buyerWorkOrder: BuyerWorkOrderInput;
  agenda?: BuyerSquadReviewAgendaItem[];
  repairRows?: BuyerSquadTrialRepairRow[];
  acceptanceMatrix?: BuyerSquadAcceptanceMatrixRow[];
  reviewDecision?: BuyerSquadReviewDecision;
}) {
  const targetUser = buyerWorkOrder.targetUser.trim() || "Target buyer";
  const request = buyerWorkOrder.request.trim() || "Buyer workflow not set";
  const successMetric = buyerWorkOrder.successMetric.trim() || "Success metric not set";
  const baseline = buyerWorkOrder.currentBaseline.trim();
  const reviewAgenda = agenda ?? buildBuyerSquadReviewAgenda({ readiness, rows, buyerWorkOrder });
  const repairs = repairRows ?? buildBuyerSquadTrialRepairRows({ rows, buyerWorkOrder });
  const matrix = acceptanceMatrix ?? buildBuyerSquadAcceptanceMatrix({ rows, buyerWorkOrder });
  const decision = reviewDecision ?? buildBuyerSquadReviewDecision({ readiness, acceptanceMatrix: matrix });
  const decisionPayload = buildBuyerSquadReviewDecisionReceiptPayload({ decision, acceptanceMatrix: matrix, buyerWorkOrder });
  const operatingContract = buildBuyerSquadOperatingContract({ decision, receiptPayload: decisionPayload });
  const measurementPlan = buildBuyerSquadMeasurementPlan({ decision, receiptPayload: decisionPayload, buyerWorkOrder });
  const valueClaimLedger = buildBuyerSquadValueClaimLedger({ decision, receiptPayload: decisionPayload, measurementPlan });
  const claimProofQueue = buildBuyerSquadClaimProofQueue({ ledger: valueClaimLedger, measurementPlan, receiptPayload: decisionPayload });
  const agendaLines = reviewAgenda.flatMap((item) => [
    `- ${item.label} (${item.duration}, ${item.status})`,
    `  Owner: ${item.owner}`,
    `  Proof: ${item.proof}`,
    `  Decision: ${item.decision}`
  ]);
  const matrixLines = matrix.length
    ? matrix.flatMap((item) => [
        `- ${item.agentName}: ${item.verdict}`,
        `  Required evidence: ${item.requiredEvidence}`,
        `  Reject if: ${item.rejectIf}`,
        `  Next action: ${item.nextAction}`,
        `  Gates: ${item.gates.map((gate) => `${gate.label}=${gate.status}`).join(", ")}`
      ])
    : ["- No selected agents yet."];
  const repairLines = repairs.length
    ? repairs.flatMap((item) => [
        `- ${item.agentName}: ${item.requiredArtifact}`,
        `  Gate: ${item.acceptanceGate}`,
        `  Response must include: ${item.responseMustInclude}`,
        `  Action: ${item.actionLabel} (${item.href})`
      ])
    : ["- No trial repair is needed."];
  const agentLines = rows.length
    ? rows.flatMap((row) => [
        `- ${row.agentName} (${row.role})`,
        `  Buyer task: ${row.buyerTask}`,
        `  Acceptance: ${row.acceptance}`,
        `  Evidence: ${row.evidence}`,
        `  Action: ${row.actionLabel} (${row.href})`
      ])
    : ["- No selected agents yet."];

  return [
    "# Buyer squad handoff",
    "",
    `Readiness: ${readiness.label}`,
    `Decision: ${readiness.headline}`,
    `Proof-ready agents: ${readiness.proofReadyCount}/${readiness.totalCount}`,
    `Next action: ${readiness.primaryAction.label}`,
    "",
    "Buyer workflow",
    `Target user: ${targetUser}`,
    `Request: ${request}`,
    `Success metric: ${successMetric}`,
    ...(baseline ? [`Current baseline: ${baseline}`] : []),
    "",
    "Review agenda",
    ...agendaLines,
    "",
    "Review decision",
    `Decision: ${decision.label}`,
    `Headline: ${decision.headline}`,
    `Owner: ${decision.owner}`,
    `Evidence: ${decision.evidence}`,
    `Next action: ${decision.nextAction}`,
    "",
    ...buildBuyerSquadOperatingContractLines(operatingContract),
    "",
    ...buildBuyerSquadMeasurementPlanLines(measurementPlan),
    "",
    ...buildBuyerSquadValueClaimLedgerLines(valueClaimLedger),
    "",
    ...buildBuyerSquadClaimProofQueueLines(claimProofQueue),
    "",
    "Acceptance matrix",
    ...matrixLines,
    "",
    "Trial repair queue",
    ...repairLines,
    "",
    "Agent assignments",
    ...agentLines
  ].join("\n");
}

function AgentCard({
  agent,
  selected,
  buyerProofSignal,
  onToggle
}: {
  agent: MarketAgent;
  selected: boolean;
  buyerProofSignal: AgentBuyerProofSignal;
  onToggle: (id: string) => void;
}) {
  const totalSkill = Math.round(agent.skills.reduce((sum, skill) => sum + skill.score, 0) / agent.skills.length);
  const mcpMaturity = Math.round(agent.mcp.reduce((sum, item) => sum + item.maturity, 0) / agent.mcp.length);
  const opensNewTab = !buyerProofSignal.href.startsWith("#");

  return (
    <article className={cx("agent-card", selected && "is-selected")} style={{ "--agent": agent.color, "--agent-accent": agent.accent } as React.CSSProperties}>
      <div className="agent-card-top">
        <div className="agent-avatar" aria-hidden="true">
          <Bot size={22} />
        </div>
        <div>
          <span className="agent-handle">{agent.handle}</span>
          <h3>{agent.name}</h3>
        </div>
        <span className={cx("rarity", agent.rarity)}>{agent.rarity}</span>
      </div>
      <p className="agent-headline">{agent.headline}</p>
      <div className="agent-metrics">
        <span>
          <Gauge size={16} />
          Skill {totalSkill}
        </span>
        <span>
          <Network size={16} />
          MCP {mcpMaturity}
        </span>
        <span>
          <Coins size={16} />
          {agent.price}
        </span>
      </div>
      <div className="capability-stack">
        {TOP_CAPABILITIES.map((key) => (
          <CapabilityBar key={key} label={CAPABILITY_LABELS[key]} value={agent.capabilities[key]} />
        ))}
      </div>
      <div className="skill-row">
        {agent.skills.slice(0, 3).map((skill) => (
          <span key={skill.id}>{skill.label}</span>
        ))}
      </div>
      <div className={cx("agent-buyer-proof", buyerProofSignal.status)} aria-label={`${agent.name} buyer trial evidence`}>
        <div>
          <span>{buyerProofSignal.label}</span>
          <strong>{buyerProofSignal.value}</strong>
        </div>
        <p>{buyerProofSignal.detail}</p>
        <a href={buyerProofSignal.href} target={opensNewTab ? "_blank" : undefined} rel={opensNewTab ? "noreferrer" : undefined}>
          {buyerProofSignal.actionLabel}
          <ExternalLink size={13} />
        </a>
      </div>
      <button className={cx("hire-button", selected && "hired")} onClick={() => onToggle(agent.id)} title={selected ? "編成から外す" : "市場から雇う"}>
        {selected ? <CheckCircle2 size={18} /> : <ShoppingCart size={18} />}
        {selected ? "Hired" : "Hire"}
      </button>
    </article>
  );
}

function JudgeCommandCenterPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [center, setCenter] = useState<JudgeCommandCenter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildCommandCenter() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCenter((await response.json()) as JudgeCommandCenter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-command">
      <div className="command-heading">
        <div>
          <span className="eyebrow">Reviewer command center</span>
          <h2>
            <Trophy size={20} />
            First 90 seconds
          </h2>
        </div>
        <button className="icon-button" onClick={buildCommandCenter} disabled={loading} title="外部レビュー担当者の初回導線を構築">
          <Play size={17} />
          {loading ? "Building" : "Build command center"}
        </button>
      </div>

      {error && <p className="error-text">Reviewer command request failed: {error}</p>}

      {center ? (
        <div className="command-body">
          <div className="command-summary">
            <div>
              <span className={cx("risk-chip", center.readiness === "pitch-ready" ? "low" : center.readiness === "external-gaps" ? "medium" : "high")}>
                {center.readiness}
              </span>
              <h3>{center.headline}</h3>
              <p>{center.hardTruth}</p>
              <strong>{center.openingMove}</strong>
            </div>
            <div className="command-score">
              <strong>{center.commandScore}</strong>
              <span>command score</span>
            </div>
          </div>

          <div className="command-metrics">
            {center.metrics.map((metric) => (
              <article key={metric.id} className={metric.status}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.evidence}</p>
              </article>
            ))}
          </div>

          <div className="command-buttons">
            {center.proofButtons.map((button) => (
              <a key={button.id} href={`#${button.id}`} className={button.status} title={`${button.reason} API: ${button.endpoint}`}>
                <span>{button.status}</span>
                <strong>{button.buttonLabel}</strong>
                <p>{button.label} / {button.score}</p>
                <small>{button.reason}</small>
              </a>
            ))}
          </div>

          <div className="command-grid">
            <section>
              <h3>
                <Film size={15} />
                90-second timeline
              </h3>
              <div className="command-timeline">
                {center.timeline.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.timeRange}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.screen}: {step.click}</p>
                    <small>{step.say}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Blockers
              </h3>
              <div className="command-blockers">
                {center.blockers.length > 0 ? (
                  center.blockers.map((blocker) => (
                    <article key={blocker.id} className={blocker.priority}>
                      <div>
                        <strong>{blocker.owner}</strong>
                        <span>{blocker.priority}</span>
                      </div>
                      <p>{blocker.action}</p>
                      <small>{blocker.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No blockers</strong>
                    <p>この順番で録画と提出確認へ進めます。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <FileText size={15} />
                Reviewer script
              </h3>
              <ol className="command-script">
                {center.judgeScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <pre>{JSON.stringify(center.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="command-empty">
          <Trophy size={28} />
          <strong>Build command centerで、最初に押す証拠、90秒導線、残ブロッカーを1画面にまとめます。</strong>
          <p>機能一覧を説明するのではなく、外部レビュー担当者が最初に見る順番を固定します。</p>
        </div>
      )}
    </section>
  );
}

function DemoConciergePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [concierge, setConcierge] = useState<DemoConcierge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildConcierge() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setConcierge((await response.json()) as DemoConcierge);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-concierge">
      <div className="concierge-heading">
        <div>
          <span className="eyebrow">Reviewer concierge</span>
          <h2>
            <Radar size={20} />
            First click, no wandering
          </h2>
        </div>
        <button className="icon-button" onClick={buildConcierge} disabled={loading} title="最初の1クリック導線を生成">
          <Play size={17} />
          {loading ? "Guiding" : "Build concierge"}
        </button>
      </div>

      {error && <p className="error-text">Reviewer concierge request failed: {error}</p>}

      {concierge ? (
        <div className="concierge-body">
          <div className="concierge-summary">
            <div>
              <span className={cx("risk-chip", concierge.readiness === "guided" ? "low" : concierge.readiness === "external-watch" ? "medium" : "high")}>
                {concierge.readiness}
              </span>
              <h3>{concierge.headline}</h3>
              <p>{concierge.hardTruth}</p>
              <strong>{concierge.singleNextClick}</strong>
            </div>
            <div className="concierge-score">
              <strong>{concierge.conciergeScore}</strong>
              <span>concierge score</span>
            </div>
          </div>

          <div className="concierge-route-lock">
            <section>
              <div>
                <span className={cx("risk-chip", concierge.routeLock.readiness === "locked" ? "low" : concierge.routeLock.readiness === "locked-external-watch" ? "medium" : "high")}>
                  {concierge.routeLock.readiness}
                </span>
                <strong>{concierge.routeLock.lockScore}</strong>
              </div>
              <h3>Reviewer Route Lock</h3>
              <p>{concierge.routeLock.oneBreathScript}</p>
              <small>
                {concierge.routeLock.routeStepScore} route steps / {concierge.routeLock.proofLinkScore} proof links
              </small>
            </section>
            <div>
              {concierge.routeLock.lockedSteps.map((step) => (
                <article key={step.id} className={step.status}>
                  <span>{step.timeRange}</span>
                  <strong>{step.screen}</strong>
                  <p>{step.click}</p>
                  <small>{step.judgeSignal}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="concierge-focus-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    concierge.focusLock.readiness === "focus-locked"
                      ? "low"
                      : concierge.focusLock.readiness === "focus-external-watch"
                        ? "medium"
                        : "high"
                  )}
                >
                  {concierge.focusLock.readiness}
                </span>
                <strong>{concierge.focusLock.focusScore}</strong>
              </div>
              <h3>First-Run Focus Lock</h3>
              <p>{concierge.focusLock.operatorScript}</p>
              <small>
                first: {concierge.focusLock.firstScreen} / {concierge.focusLock.visibleCount} visible /{" "}
                {concierge.focusLock.deferredCount} deferred
              </small>
            </section>
            <div>
              {concierge.focusLock.rules.map((rule) => (
                <article key={rule.id} className={rule.status}>
                  <span>{rule.action}</span>
                  <strong>{rule.target}</strong>
                  <p>{rule.timeRange}</p>
                  <small>{rule.instruction}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="concierge-lanes">
            {concierge.lanes.map((lane) => (
              <article key={lane.id}>
                <div>
                  <span>{lane.persona}</span>
                  <strong>+{lane.scoreLift}</strong>
                </div>
                <h3>{lane.entryQuestion}</h3>
                <p>{lane.valueMoment}</p>
                <b>{lane.firstClick}</b>
                <ol>
                  {lane.steps.map((step) => (
                    <li key={step.id} className={step.status}>
                      <strong>{step.timeRange}</strong>
                      <span>{step.screen}</span>
                      <small>{step.successSignal}</small>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <div className="concierge-grid">
            <section>
              <h3>
                <BadgeCheck size={15} />
                Success criteria
              </h3>
              {concierge.successCriteria.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.status}</span>
                  </div>
                  <p>{item.proof}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Lightbulb size={15} />
                Friction cuts
              </h3>
              {concierge.frictionCuts.map((item) => (
                <article key={item.id}>
                  <strong>{item.after}</strong>
                  <p>{item.before}</p>
                  <small>{item.proof}</small>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(concierge.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="concierge-empty">
          <Radar size={28} />
          <strong>Build conciergeで、外部レビュー担当者・買い手・提出者の最初の1クリック、話す台詞、証拠URLを固定します。</strong>
          <p>機能一覧を見せる前に、誰が来ても迷わない入口を作ります。</p>
        </div>
      )}
    </section>
  );
}

function JudgeRehearsalPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [rehearsal, setRehearsal] = useState<JudgeRehearsalRoom | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRehearsal() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-rehearsal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRehearsal((await response.json()) as JudgeRehearsalRoom);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-rehearsal">
      <div className="rehearsal-heading">
        <div>
          <span className="eyebrow">Judge rehearsal</span>
          <h2>
            <Play size={20} />
            90-second run room
          </h2>
        </div>
        <button className="icon-button" onClick={buildRehearsal} disabled={loading} title="90秒の審査員向けリハーサルを生成">
          <Trophy size={17} />
          {loading ? "Rehearsing" : "Build rehearsal"}
        </button>
      </div>

      <div className="rehearsal-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Judge rehearsal request failed: {error}</p>}

      {rehearsal ? (
        <div className="rehearsal-body">
          <div className="rehearsal-summary">
            <div>
              <span className={cx("risk-chip", rehearsal.readiness === "rehearsal-ready" ? "low" : rehearsal.readiness === "external-gap-rehearsal" ? "medium" : "high")}>
                {rehearsal.readiness}
              </span>
              <h3>{rehearsal.headline}</h3>
              <p>{rehearsal.hardTruth}</p>
              <strong>Next run: {rehearsal.nextRun}</strong>
            </div>
            <div className="rehearsal-score">
              <strong>{rehearsal.rehearsalScore}</strong>
              <span>rehearsal score</span>
            </div>
          </div>

          <div className="rehearsal-defense-lock">
            <div className="defense-lock-copy">
              <span
                className={cx(
                  "risk-chip",
                  rehearsal.defenseLock.readiness === "defense-ready" ? "low" : rehearsal.defenseLock.readiness === "external-gap-defense" ? "medium" : "high"
                )}
              >
                {rehearsal.defenseLock.readiness}
              </span>
              <h3>
                <ShieldCheck size={16} />
                Final Pitch Defense Lock
              </h3>
              <p>{rehearsal.defenseLock.headline}</p>
              <strong>{rehearsal.defenseLock.hardQuestion}</strong>
              <small>{rehearsal.defenseLock.closingMove}</small>
            </div>
            <div className="defense-lock-score">
              <strong>{rehearsal.defenseLock.defenseScore}</strong>
              <span>defense score</span>
            </div>
            <div className="defense-lock-checks">
              {rehearsal.defenseLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.proof}</p>
                  <small>{check.acceptance}</small>
                  <a href={check.proofUrl} target="_blank" rel="noreferrer">
                    Proof <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
            <div className="defense-answer-path">
              {rehearsal.defenseLock.answerPath.slice(0, 4).map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </div>

          <div className="rehearsal-defense-lock rehearsal-recording-lock">
            <div className="defense-lock-copy">
              <span
                className={cx(
                  "risk-chip",
                  rehearsal.recordingLock.readiness === "recording-ready"
                    ? "low"
                    : rehearsal.recordingLock.readiness === "recording-external-watch"
                      ? "medium"
                      : "high"
                )}
              >
                {rehearsal.recordingLock.readiness}
              </span>
              <h3>
                <Film size={16} />
                Judge Recording Lock
              </h3>
              <p>{rehearsal.recordingLock.headline}</p>
              <strong>{rehearsal.recordingLock.operatorLine}</strong>
              <small>
                {rehearsal.recordingLock.targetDurationSeconds}s / {rehearsal.recordingLock.publishTarget}
              </small>
            </div>
            <div className="defense-lock-score">
              <strong>{rehearsal.recordingLock.recordingScore}</strong>
              <span>recording score</span>
              <small>
                ready {rehearsal.recordingLock.readyCount} / watch {rehearsal.recordingLock.watchCount} / blocked {rehearsal.recordingLock.blockedCount}
              </small>
            </div>
            <div className="defense-lock-checks">
              {rehearsal.recordingLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                  <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
            <div className="defense-answer-path">
              {rehearsal.recordingLock.shotOrder.slice(0, 5).map((shot) => (
                <p key={shot}>{shot}</p>
              ))}
            </div>
          </div>

          <div className="rehearsal-segments">
            {rehearsal.segments.map((segment) => (
              <article key={segment.id} className={segment.status}>
                <div>
                  <strong>{segment.timeRange}</strong>
                  <span>{segment.status}</span>
                </div>
                <h3>{segment.screen}</h3>
                <b>{segment.open}</b>
                <p>{segment.say}</p>
                <small>{segment.successSignal}</small>
                <a href={segment.proofUrl} target="_blank" rel="noreferrer">
                  Proof <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="rehearsal-grid">
            <section>
              <h3>
                <Crosshair size={15} />
                Question deck
              </h3>
              {rehearsal.questionDeck.map((question) => (
                <article key={question.id} className={question.status}>
                  <strong>{question.question}</strong>
                  <p>{question.answer}</p>
                  <a href={question.proofUrl} target="_blank" rel="noreferrer">
                    Open proof <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Gauge size={15} />
                Scorecard
              </h3>
              {rehearsal.scorecard.map((criterion) => (
                <article key={criterion.id} className={criterion.status}>
                  <div>
                    <strong>{criterion.label}</strong>
                    <span>
                      {criterion.currentScore}/{criterion.targetScore}
                    </span>
                  </div>
                  <p>{criterion.rehearse}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Film size={15} />
                Capture checklist
              </h3>
              {rehearsal.captureChecklist.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <strong>{item.timeRange}</strong>
                    <span>{item.screen}</span>
                  </div>
                  <p>{item.narration}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(rehearsal.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="rehearsal-empty">
          <Play size={28} />
          <strong>Build rehearsalで、最初の90秒に開く画面、話す台詞、想定質問、録画チェックを1つにまとめます。</strong>
          <p>審査員に機能一覧を浴びせず、価値、差別化、実用性、提出状態の順に見せます。</p>
        </div>
      )}
    </section>
  );
}

function WinnerPacketPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [packet, setPacket] = useState<WinnerProofPacket | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState<string>(SUBMISSION_PROOF.deployedUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildPacket() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/winner-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl,
          targetUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPacket((await response.json()) as WinnerProofPacket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="winner-packet">
      <div className="winner-heading">
        <div>
          <span className="eyebrow">Winner proof packet</span>
          <h2>
            <Trophy size={20} />
            Five criteria, one proof path
          </h2>
        </div>
        <button className="icon-button" onClick={buildPacket} disabled={loading} title="審査5項目の勝ち証拠を束ねる">
          <BadgeCheck size={17} />
          {loading ? "Packing" : "Build packet"}
        </button>
      </div>

      <div className="winner-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
        <label>
          <span>Target Cloud Run URL</span>
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder={SUBMISSION_PROOF.deployedUrl} />
        </label>
      </div>

      {error && <p className="error-text">Winner packet request failed: {error}</p>}

      {packet ? (
        <div className="winner-body">
          <div className="winner-summary">
            <div>
              <span className={cx("risk-chip", packet.readiness === "winner-packet-ready" ? "low" : packet.readiness === "external-gap-packet" ? "medium" : "high")}>
                {packet.readiness}
              </span>
              <h3>{packet.headline}</h3>
              <p>{packet.hardTruth}</p>
              <strong>Next: {packet.nextAction}</strong>
            </div>
            <div className="winner-score">
              <strong>{packet.packetScore}</strong>
              <span>packet score</span>
            </div>
          </div>

          <div className={cx("winner-release-lock", packet.releaseLock.status)}>
            <div>
              <span>Release lock</span>
              <strong>{packet.releaseLock.readiness}</strong>
              <small>{packet.releaseLock.targetBaseUrl || "not checked"}</small>
            </div>
            <div>
              <strong>{packet.releaseLock.score}</strong>
              <span>{packet.releaseLock.verdict}</span>
            </div>
            <p>{packet.releaseLock.nextAction}</p>
            <small>
              missing skills {packet.releaseLock.missingSkills.length} / missing signals {packet.releaseLock.missingAgentCardSignals.join(", ") || "none"}
            </small>
          </div>

          <div className="winner-criteria">
            {packet.criteria.map((criterion) => (
              <article key={criterion.id} className={criterion.status}>
                <div>
                  <span>{criterion.status}</span>
                  <strong>
                    {criterion.score}/{criterion.target}
                  </strong>
                </div>
                <h3>{criterion.label}</h3>
                <p>{criterion.judgeLine}</p>
                <b>{criterion.show}</b>
                <small>{criterion.recordingCue}</small>
                <a href={criterion.proofUrl} target="_blank" rel="noreferrer">
                  Open proof <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="winner-grid">
            <section>
              <h3>
                <Crosshair size={15} />
                Objection answers
              </h3>
              {packet.judgeQuestions.map((question) => (
                <article key={question.id} className={question.status}>
                  <strong>{question.question}</strong>
                  <p>{question.answer}</p>
                  <a href={question.proofUrl} target="_blank" rel="noreferrer">
                    Proof <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording order
              </h3>
              {packet.recordingOrder.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <strong>{item.timeRange}</strong>
                    <span>{item.status}</span>
                  </div>
                  <p>{item.screen}</p>
                  <a href={item.proofUrl} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Submission copy
              </h3>
              <article>
                <strong>{packet.submissionCopy.oneLine}</strong>
                <p>{packet.submissionCopy.winnerThesis}</p>
                <small>Missing: {packet.submissionCopy.missingExternal.join(", ") || "none"}</small>
              </article>
              <pre>{JSON.stringify(packet.submissionCopy.proofOrder, null, 2)}</pre>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(packet.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="winner-empty">
          <Trophy size={28} />
          <strong>Build packetで、審査5項目ごとの主張、証拠URL、反論回答、録画cueを1つにまとめます。</strong>
          <p>競合/SWOT、初回UX、実用価値、実装証拠をバラバラに見せず、勝ち筋として提出に貼れる形へ圧縮します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionRunwayPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [runway, setRunway] = useState<FinalSubmissionRunway | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRunway() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submission-runway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          skipReleaseDrift: true,
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRunway((await response.json()) as FinalSubmissionRunway);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-runway">
      <div className="runway-heading">
        <div>
          <span className="eyebrow">Final submission runway</span>
          <h2>
            <Rocket size={20} />
            Deadline workback to 2026/7/10
          </h2>
        </div>
        <button className="icon-button" onClick={buildRunway} disabled={loading} title="提出締切から逆算して残作業を束ねる">
          <ClipboardCheck size={17} />
          {loading ? "Planning" : "Build runway"}
        </button>
      </div>

      <div className="runway-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Submission runway request failed: {error}</p>}

      {runway ? (
        <div className="runway-body">
          <div className="runway-summary">
            <div>
              <span className={cx("risk-chip", runway.readiness === "on-track" ? "low" : runway.readiness === "deadline-risk" ? "medium" : "high")}>
                {runway.readiness}
              </span>
              <h3>{runway.headline}</h3>
              <p>{runway.hardTruth}</p>
              <strong>
                Next: {runway.nextAction.label} by {runway.nextAction.dueDate}
              </strong>
            </div>
            <div className="runway-score">
              <strong>{runway.runwayScore}</strong>
              <span>{runway.daysRemaining} days left</span>
            </div>
          </div>

          <div className="runway-tracks">
            {runway.tracks.map((track) => (
              <section key={track.id} className={track.status}>
                <div>
                  <span>{track.status}</span>
                  <strong>{track.score}</strong>
                </div>
                <h3>{track.label}</h3>
                <p>{track.summary}</p>
                {track.milestones.map((milestone) => (
                  <article key={milestone.id} className={milestone.status}>
                    <div>
                      <strong>{milestone.label}</strong>
                      <span>{milestone.dueDate}</span>
                    </div>
                    <p>{milestone.action}</p>
                    <small>{milestone.acceptance}</small>
                    <a href={milestone.proofUrl} target="_blank" rel="noreferrer">
                      Proof <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </section>
            ))}
          </div>

          <div className="runway-grid">
            <section>
              <h3>
                <CheckCircle2 size={15} />
                Daily plan
              </h3>
              {runway.dailyPlan.map((item) => (
                <article key={item}>
                  <p>{item}</p>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <BadgeCheck size={15} />
                Evidence locks
              </h3>
              {runway.evidenceLocks.map((lock) => (
                <article key={lock.id} className={lock.status}>
                  <div>
                    <strong>{lock.label}</strong>
                    <span>{lock.status}</span>
                  </div>
                  <p>{lock.proof}</p>
                  <a href={lock.url} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(runway.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="runway-empty">
          <Rocket size={28} />
          <strong>Build runwayで、7/10 23:59 JSTから逆算した提出作業、証拠URL、検収条件を1つにまとめます。</strong>
          <p>Winner Packetの勝ち証拠を、動画、ProtoPedia、構成図、最終提出フォームへ落とし込みます。</p>
        </div>
      )}
    </section>
  );
}

function ExternalEvidencePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [evidence, setEvidence] = useState<ExternalEvidenceRun | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verifyExternalEvidence() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/external-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEvidence((await response.json()) as ExternalEvidenceRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="live-evidence external-evidence">
      <div className="evidence-heading">
        <div>
          <span className="eyebrow">External submission evidence</span>
          <h2>
            <ExternalLink size={20} />
            Final URL verifier
          </h2>
        </div>
        <button className="icon-button" onClick={verifyExternalEvidence} disabled={loading} title="最終提出URLの公開到達性を検証">
          <Activity size={17} />
          {loading ? "Verifying" : "Verify external evidence"}
        </button>
      </div>

      <div className="runway-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">External evidence request failed: {error}</p>}

      {evidence ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <div>
              <span className={cx("risk-chip", evidence.readiness === "external-ready" ? "low" : evidence.readiness === "needs-external-urls" ? "medium" : "high")}>
                {evidence.readiness}
              </span>
              <h3>{evidence.summary}</h3>
              <p>{evidence.hardTruth}</p>
              <small>{new Date(evidence.generatedAt).toLocaleString()}</small>
            </div>
            <div className="evidence-score">
              <strong>{evidence.evidenceScore}</strong>
              <span>external proof</span>
            </div>
          </div>

          <div className="evidence-probes">
            {evidence.probes.map((probe) => (
              <article key={probe.id} className={probe.status}>
                <div>
                  <strong>{probe.label}</strong>
                  <span>{probe.status}</span>
                </div>
                <p>{probe.evidence}</p>
                <small>{probe.latencyMs ? `${probe.latencyMs}ms` : "not probed"} / score {probe.score}</small>
                {probe.url ? (
                  <a href={probe.url} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                ) : (
                  <small>URL pending</small>
                )}
              </article>
            ))}
          </div>

          <div className="evidence-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="evidence-actions">
                {evidence.nextActions.length > 0 ? (
                  evidence.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.label}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>All final URLs are externally reachable</strong>
                    <p>公開GitHub、Cloud Run、ProtoPedia、動画URLを提出フォームへ貼れる状態です。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Runbook
              </h3>
              <pre>{evidence.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(evidence.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="evidence-empty">
          <ExternalLink size={28} />
          <strong>Verify external evidenceで、公開GitHub、Cloud Run、ProtoPedia作品URL、動画URLをライブ検証します。</strong>
          <p>提出直前に「審査員が開けるURLか」を再実行できる証拠として残します。</p>
        </div>
      )}
    </section>
  );
}

function PrizeStrategyPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [board, setBoard] = useState<PrizeStrategyBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildPrizeStrategy() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/prize-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBoard((await response.json()) as PrizeStrategyBoard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="prize-strategy" className="prize-strategy">
      <div className="prize-heading">
        <div>
          <span className="eyebrow">Prize strategy board</span>
          <h2>
            <Crosshair size={20} />
            Win the scorecard
          </h2>
        </div>
        <button className="icon-button" onClick={buildPrizeStrategy} disabled={loading} title="審査5項目の優勝作戦を生成">
          <Trophy size={17} />
          {loading ? "Scoring" : "Build prize strategy"}
        </button>
      </div>

      {error && <p className="error-text">Prize strategy request failed: {error}</p>}

      {board ? (
        <div className="prize-body">
          <div className="prize-summary">
            <div>
              <span className={cx("risk-chip", board.readiness === "winner-ready" ? "low" : board.readiness === "finalist-track" ? "medium" : "high")}>
                {board.readiness}
              </span>
              <h3>{board.headline}</h3>
              <p>{board.hardTruth}</p>
              <strong>{board.winHypothesis}</strong>
            </div>
            <div className="prize-score">
              <strong>{board.prizeScore}</strong>
              <span>prize score</span>
            </div>
          </div>

          <div className="prize-criteria">
            {board.criteria.map((criterion) => (
              <article key={criterion.id} className={criterion.status}>
                <div>
                  <span>{criterion.label}</span>
                  <strong>{criterion.currentScore}</strong>
                </div>
                <p>target {criterion.targetScore} / delta {criterion.delta}</p>
                <small>{criterion.decisiveProof}</small>
                <b>{criterion.demoMove}</b>
              </article>
            ))}
          </div>

          {board.usabilityLock ? (
            <div className="prize-usability-lock">
              <section>
                <div>
                  <span
                    className={cx(
                      "risk-chip",
                      board.usabilityLock.readiness === "usability-locked"
                        ? "low"
                        : board.usabilityLock.readiness === "usability-external-watch"
                          ? "medium"
                          : "high"
                    )}
                  >
                    {board.usabilityLock.readiness}
                  </span>
                  <strong>{board.usabilityLock.internalScore}</strong>
                </div>
                <h3>Prize Usability Lock</h3>
                <p>{board.usabilityLock.operatorLine}</p>
                <small>
                  sealed {board.usabilityLock.sealedCount} / watch {board.usabilityLock.watchCount} / missing {board.usabilityLock.missingCount} /
                  lock {board.usabilityLock.lockScore}
                </small>
              </section>
              <div>
                {board.usabilityLock.checks.map((check) => (
                  <article key={check.id} className={check.status}>
                    <div>
                      <strong>{check.label}</strong>
                      <span>{check.status}</span>
                    </div>
                    <p>{check.proof}</p>
                    <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                      Evidence <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {board.criteriaLock ? (
            <div className="prize-criteria-lock">
              <section>
                <div>
                  <span
                    className={cx(
                      "risk-chip",
                      board.criteriaLock.readiness === "criteria-locked"
                        ? "low"
                        : board.criteriaLock.readiness === "criteria-external-watch"
                          ? "medium"
                          : "high"
                    )}
                  >
                    {board.criteriaLock.readiness}
                  </span>
                  <strong>{board.criteriaLock.internalScore}</strong>
                </div>
                <h3>Prize Criteria Lock</h3>
                <p>{board.criteriaLock.operatorLine}</p>
                <small>
                  sealed {board.criteriaLock.sealedCount} / watch {board.criteriaLock.watchCount} / missing {board.criteriaLock.missingCount} /
                  lock {board.criteriaLock.lockScore}
                </small>
              </section>
              <div>
                {board.criteriaLock.checks.map((check) => (
                  <article key={check.id} className={check.status}>
                    <div>
                      <strong>{check.label}</strong>
                      <span>{check.status}</span>
                    </div>
                    <p>{check.proof}</p>
                    <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                      Evidence <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="prize-grid">
            <section>
              <h3>
                <BadgeCheck size={15} />
                Proof moves
              </h3>
              <div className="prize-moves">
                {board.proofMoves.map((move) => (
                  <a key={move.id} href={move.endpoint} target="_blank" rel="noreferrer">
                    <span>{move.screen}</span>
                    <strong>{move.label}</strong>
                    <p>{move.proof}</p>
                    <small>{move.score}</small>
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Final pitch order
              </h3>
              <div className="prize-pitch">
                {board.pitchOrder.map((step) => (
                  <article key={step.id}>
                    <div>
                      <strong>{step.timeRange}</strong>
                      <span>{step.proofMoveId}</span>
                    </div>
                    <p>{step.screen}</p>
                    <small>{step.say}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Risks to close
              </h3>
              <div className="prize-risks">
                {board.risks.length > 0 ? (
                  board.risks.slice(0, 6).map((risk) => (
                    <article key={risk.id} className={risk.priority}>
                      <div>
                        <strong>{risk.owner}</strong>
                        <span>{risk.priority}</span>
                      </div>
                      <p>{risk.risk}</p>
                      <small>{risk.action}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No prize risks</strong>
                    <p>{board.judgeClose}</p>
                  </article>
                )}
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(board.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="prize-empty">
          <Crosshair size={28} />
          <strong>Build prize strategyで、審査5項目の目標点、現在証拠、最終ピッチ順、残リスクを優勝作戦にします。</strong>
          <p>MVPが足りるかではなく、どの証拠で採点を取りに行くかを固定します。</p>
        </div>
      )}
    </section>
  );
}

function WinGapRadarPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [radar, setRadar] = useState<WinGapRadar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRadar() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/win-gap-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          skipReleaseDrift: true
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRadar((await response.json()) as WinGapRadar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="win-gap-radar" className="win-gap-radar">
      <div className="gap-heading">
        <div>
          <span className="eyebrow">Win gap radar</span>
          <h2>
            <Radar size={20} />
            MVP gaps into feature bets
          </h2>
        </div>
        <button className="icon-button" onClick={buildRadar} disabled={loading} title="競合/SWOTから勝つためのMVPギャップを生成">
          <Crosshair size={17} />
          {loading ? "Mapping" : "Build gap radar"}
        </button>
      </div>

      {error && <p className="error-text">Win gap radar request failed: {error}</p>}

      {radar ? (
        <div className="gap-body">
          <div className="gap-summary">
            <div>
              <span className={cx("risk-chip", radar.readiness === "winner-track" ? "low" : radar.readiness === "mvp-gap-watch" ? "medium" : "high")}>
                {radar.readiness}
              </span>
              <h3>{radar.headline}</h3>
              <p>{radar.hardTruth}</p>
              <strong>{radar.mvpDecision}</strong>
            </div>
            <div className="gap-score">
              <strong>{radar.radarScore}</strong>
              <span>gap score</span>
            </div>
          </div>

          <div className="gap-freeze-lock">
            <div className="gap-freeze-copy">
              <span
                className={cx(
                  "risk-chip",
                  radar.featureFreezeLock.readiness === "feature-freeze-ready"
                    ? "low"
                    : radar.featureFreezeLock.readiness === "feature-freeze-external-watch"
                      ? "medium"
                      : "high"
                )}
              >
                {radar.featureFreezeLock.readiness}
              </span>
              <h3>
                <ClipboardCheck size={16} />
                Feature Freeze Lock
              </h3>
              <p>{radar.featureFreezeLock.headline}</p>
              <strong>{radar.featureFreezeLock.operatorLine}</strong>
            </div>
            <div className="gap-freeze-score">
              <strong>{radar.featureFreezeLock.freezeScore}</strong>
              <span>freeze score</span>
              <small>
                ship {radar.featureFreezeLock.shipNowCount} / record {radar.featureFreezeLock.recordCount} / external {radar.featureFreezeLock.externalCount} / cut {radar.featureFreezeLock.cutCount}
              </small>
            </div>
            <div className="gap-freeze-checks">
              {radar.featureFreezeLock.checks.slice(0, 6).map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.decision}</span>
                  </div>
                  <p>{check.action}</p>
                  <small>{check.acceptance}</small>
                  <a href={check.proofUrl} target="_blank" rel="noreferrer">
                    Proof <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
            <ol className="gap-freeze-order">
              {radar.featureFreezeLock.freezeOrder.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="gap-lanes">
            {radar.lanes.map((lane) => (
              <article key={lane.id} className={lane.status}>
                <div>
                  <span>{lane.priority}</span>
                  <strong>{lane.score}</strong>
                </div>
                <h3>{lane.label}</h3>
                <p>{lane.competitorPressure}</p>
                <small>{lane.swotSignal.quadrant}: {lane.swotSignal.title}</small>
                <b>{lane.featureHypothesis}</b>
                <em>{lane.nextAction}</em>
                <a href={lane.proofUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="gap-grid">
            <section>
              <h3>
                <Lightbulb size={15} />
                Feature bets
              </h3>
              <div className="gap-bets">
                {radar.featureBets.map((bet) => (
                  <article key={bet.id} className={bet.status}>
                    <div>
                      <strong>{bet.label}</strong>
                      <span>{bet.priority}</span>
                    </div>
                    <p>{bet.why}</p>
                    <small>{bet.build}</small>
                    <b>{bet.acceptance}</b>
                    <a href={bet.proofUrl} target="_blank" rel="noreferrer">
                      Proof <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Cut list
              </h3>
              <div className="gap-cuts">
                {radar.cutList.map((item) => (
                  <article key={item.id}>
                    <strong>{item.label}</strong>
                    <p>{item.reason}</p>
                  </article>
                ))}
              </div>
              <h3>
                <ClipboardCheck size={15} />
                External gaps
              </h3>
              <div className="gap-external">
                {radar.externalGaps.length > 0 ? (
                  radar.externalGaps.map((gap) => (
                    <article key={gap.id}>
                      <strong>{gap.label}</strong>
                      <p>{gap.action}</p>
                      <small>{gap.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="banked">
                    <strong>No external gaps</strong>
                    <p>提出URLはすべて揃っています。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Proof script
              </h3>
              <ol className="gap-script">
                {radar.proofScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(radar.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="gap-empty">
          <Radar size={28} />
          <strong>Build gap radarで、競合分析、SWOT、MVP監査、最終候補判定を、次に閉じる機能仮説とcut listに変換します。</strong>
          <p>「機能が足りるか」を感覚で判断せず、勝つために閉じるギャップだけを優先します。</p>
        </div>
      )}
    </section>
  );
}

function ScoreBlock({ label, before, after }: { label: string; before: number; after: number }) {
  const diff = after - before;
  return (
    <div className="score-block">
      <div className="score-row">
        <span>{label}</span>
        <strong>{after}</strong>
      </div>
      <div className="score-track">
        <span className="before" style={{ width: `${before}%` }} />
        <span className="after" style={{ width: `${after}%` }} />
      </div>
      <small>+{diff}</small>
    </div>
  );
}

function A2APanel({ recommendation }: { recommendation: Recommendation }) {
  return (
    <section className="panel a2a-panel">
      <div className="panel-heading">
        <h2>
          <Network size={18} />
          A2A Delegation
        </h2>
        <span className="chip">JSON-RPC ready</span>
      </div>
      <ol className="timeline">
        {recommendation.a2aTimeline.map((item, index) => (
          <li key={`${item.actor}-${item.verb}-${index}`} className={item.status}>
            <span>{item.verb}</span>
            <strong>{item.actor}</strong>
            <p>{item.payload}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SquadPanel({
  recommendation,
  buyerWorkOrder,
  agentTrialEvidence,
  trialPlanHref,
  workflowIntakeHref,
  onCopyText
}: {
  recommendation: Recommendation;
  buyerWorkOrder: BuyerWorkOrderInput;
  agentTrialEvidence: AgentTrialEvidenceRecord[];
  trialPlanHref: string;
  workflowIntakeHref: string;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [memoCopyStatus, setMemoCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [repairPacketCopyStatus, setRepairPacketCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [decisionReceiptCopyStatus, setDecisionReceiptCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [claimProofPacketCopyStatus, setClaimProofPacketCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const handoffRows = buildBuyerSquadHandoffRows({
    recommendation,
    buyerWorkOrder,
    evidenceRecords: agentTrialEvidence,
    trialPlanHref,
    workflowIntakeHref
  });
  const handoffReadiness = buildBuyerSquadHandoffReadiness(handoffRows);
  const handoffAgenda = buildBuyerSquadReviewAgenda({
    readiness: handoffReadiness,
    rows: handoffRows,
    buyerWorkOrder
  });
  const trialRepairRows = buildBuyerSquadTrialRepairRows({
    rows: handoffRows,
    buyerWorkOrder
  });
  const acceptanceMatrix = buildBuyerSquadAcceptanceMatrix({
    rows: handoffRows,
    buyerWorkOrder
  });
  const reviewDecision = buildBuyerSquadReviewDecision({
    readiness: handoffReadiness,
    acceptanceMatrix
  });
  const trialRepairPacket = buildBuyerSquadTrialRepairPacket({
    repairRows: trialRepairRows,
    buyerWorkOrder
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
  const decisionReplaySteps = buildBuyerSquadReviewReplaySteps({
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
  const handoffMemo = buildBuyerSquadHandoffMemo({
    readiness: handoffReadiness,
    rows: handoffRows,
    buyerWorkOrder,
    agenda: handoffAgenda,
    repairRows: trialRepairRows,
    acceptanceMatrix,
    reviewDecision
  });
  const handoffMemoHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(handoffMemo)}`;
  const trialRepairPacketHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(trialRepairPacket)}`;
  const decisionReceiptHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(decisionReceipt)}`;
  const claimProofPacketHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(claimProofPacket)}`;
  const handoffActionIsExternal = !handoffReadiness.primaryAction.href.startsWith("#");
  const memoCopyLabel = memoCopyStatus === "copied" ? "Copied" : memoCopyStatus === "failed" ? "Copy failed" : "Copy memo";
  const repairPacketCopyLabel = repairPacketCopyStatus === "copied" ? "Copied packet" : repairPacketCopyStatus === "failed" ? "Copy failed" : "Copy packet";
  const decisionReceiptCopyLabel =
    decisionReceiptCopyStatus === "copied" ? "Copied receipt" : decisionReceiptCopyStatus === "failed" ? "Copy failed" : "Copy receipt";
  const claimProofPacketCopyLabel =
    claimProofPacketCopyStatus === "copied" ? "Copied packet" : claimProofPacketCopyStatus === "failed" ? "Copy failed" : "Copy packet";
  const openAgendaCount = handoffAgenda.filter((item) => item.status !== "ready").length;
  const acceptedMatrixCount = acceptanceMatrix.filter((item) => item.status === "accepted").length;

  useEffect(() => {
    if (memoCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setMemoCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [memoCopyStatus]);

  useEffect(() => {
    if (repairPacketCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setRepairPacketCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [repairPacketCopyStatus]);

  useEffect(() => {
    if (decisionReceiptCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setDecisionReceiptCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [decisionReceiptCopyStatus]);

  useEffect(() => {
    if (claimProofPacketCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setClaimProofPacketCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [claimProofPacketCopyStatus]);

  async function copyHandoffMemo() {
    const copied = await onCopyText(handoffMemo);
    setMemoCopyStatus(copied ? "copied" : "failed");
  }

  async function copyTrialRepairPacket() {
    const copied = await onCopyText(trialRepairPacket);
    setRepairPacketCopyStatus(copied ? "copied" : "failed");
  }

  async function copyDecisionReceipt() {
    const copied = await onCopyText(decisionReceipt);
    setDecisionReceiptCopyStatus(copied ? "copied" : "failed");
  }

  async function copyClaimProofPacket() {
    const copied = await onCopyText(claimProofPacket);
    setClaimProofPacketCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <TrendingUp size={18} />
          Project Upgrade
        </h2>
        <span className="chip">Budget {recommendation.budgetUsed} / 140</span>
      </div>
      <div className="score-total">
        <span>総合改善</span>
        <strong>{recommendation.before.total} → {recommendation.after.total}</strong>
      </div>
      <ScoreBlock label="企画" before={recommendation.before.planning} after={recommendation.after.planning} />
      <ScoreBlock label="実装配送" before={recommendation.before.delivery} after={recommendation.after.delivery} />
      <ScoreBlock label="運用信頼性" before={recommendation.before.reliability} after={recommendation.after.reliability} />
      <ScoreBlock label="ユーザビリティ" before={recommendation.before.usability} after={recommendation.after.usability} />
      <ScoreBlock label="統制/A2A" before={recommendation.before.governance} after={recommendation.after.governance} />
      <div className="squad-list">
        {recommendation.selected.map((agent) => (
          <div key={agent.id} className="squad-item">
            <span style={{ background: agent.color }} />
            <div>
              <strong>{agent.name}</strong>
              <small>{agent.outcome}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="buyer-squad-handoff" aria-label="Buyer squad handoff">
        <div className="buyer-squad-handoff-head">
          <span>Buyer handoff</span>
          <strong>{handoffRows.filter((row) => row.status === "proof-ready").length}/{handoffRows.length} proof-ready</strong>
        </div>
        <div className={cx("buyer-squad-verdict", handoffReadiness.status)}>
          <div>
            <span>{handoffReadiness.label}</span>
            <strong>{handoffReadiness.headline}</strong>
          </div>
          <p>{handoffReadiness.detail}</p>
          <a href={handoffReadiness.primaryAction.href} target={handoffActionIsExternal ? "_blank" : undefined} rel={handoffActionIsExternal ? "noreferrer" : undefined}>
            {handoffReadiness.primaryAction.label}
            <ExternalLink size={12} />
          </a>
          <div className="buyer-squad-memo-actions" aria-label="Buyer handoff memo actions">
            <button className={cx("icon-link", memoCopyStatus === "copied" && "is-confirmed", memoCopyStatus === "failed" && "is-risk")} onClick={copyHandoffMemo} type="button">
              <ClipboardCheck size={12} />
              {memoCopyLabel}
            </button>
            <a className="icon-link" href={handoffMemoHref} download="buyer-squad-handoff.md">
              <Download size={12} />
              Export memo
            </a>
          </div>
        </div>
        <details className="quick-workflow-detail-disclosure">
          <summary>
            <strong>審査・運用契約・測定計画の詳細</strong>
            <small>レビュー判定、受け入れ台帳、証跡キュー、アジェンダ、受け入れマトリクス、割当行を表示</small>
          </summary>
          <div>
        <div className={cx("buyer-squad-review-decision", reviewDecision.status)} aria-label="Buyer squad review decision">
          <div>
            <span>{reviewDecision.label}</span>
            <strong>{reviewDecision.headline}</strong>
          </div>
          <p>{reviewDecision.detail}</p>
          <small>
            {reviewDecision.owner}: {reviewDecision.nextAction}
          </small>
          <small className="buyer-squad-review-receipt-id">
            Receipt {decisionReceiptPayload.receiptId}, checksum {decisionReceiptPayload.checksumAlgorithm}:{decisionReceiptPayload.proofChecksum}
          </small>
          <div className="buyer-squad-review-checksum-fields" aria-label="Decision receipt checksum coverage">
            {decisionReceiptPayload.checksumFields.map((field) => (
              <span key={field}>{field}</span>
            ))}
          </div>
          <div className="buyer-squad-review-replay" aria-label="Decision receipt replay checklist">
            <span>Replay checklist</span>
            {decisionReplaySteps.map((step) => (
              <article key={step.id} className={step.status}>
                <div>
                  <strong>{step.label}</strong>
                  <b>{step.status}</b>
                </div>
                <p>{step.proof}</p>
                <small>{step.action}</small>
              </article>
            ))}
          </div>
          <a href={reviewDecision.href} target={reviewDecision.href.startsWith("#") ? undefined : "_blank"} rel={reviewDecision.href.startsWith("#") ? undefined : "noreferrer"}>
            {reviewDecision.actionLabel}
            <ExternalLink size={12} />
          </a>
          <div className="buyer-squad-review-decision-actions" aria-label="Buyer squad decision receipt actions">
            <button
              className={cx("icon-link", decisionReceiptCopyStatus === "copied" && "is-confirmed", decisionReceiptCopyStatus === "failed" && "is-risk")}
              type="button"
              onClick={copyDecisionReceipt}
            >
              <ClipboardCheck size={12} />
              {decisionReceiptCopyLabel}
            </button>
            <a className="icon-link" href={decisionReceiptHref} download="buyer-squad-review-decision.md">
              <Download size={12} />
              Export receipt
            </a>
          </div>
        </div>
        <div className={cx("buyer-squad-operating-contract", operatingContract.status)} aria-label="Buyer squad pilot operating contract">
          <div className="buyer-squad-operating-contract-head">
            <div>
              <span>Pilot operating contract</span>
              <strong>{operatingContract.label}</strong>
            </div>
            <b>{operatingContract.status}</b>
          </div>
          <p>{operatingContract.headline}</p>
          <small>{operatingContract.summary}</small>
          <em>{operatingContract.nextAction}</em>
          <div className="buyer-squad-operating-terms">
            {operatingContract.terms.map((term) => (
              <article key={term.id} className={term.status}>
                <div>
                  <span>{term.label}</span>
                  <b>{term.status}</b>
                </div>
                <p>{term.condition}</p>
                <small>
                  {term.owner}: {term.proof}
                </small>
                <em>{term.stopRule}</em>
              </article>
            ))}
          </div>
        </div>
        <div className={cx("buyer-squad-measurement-plan", measurementPlan.status)} aria-label="Buyer squad pilot measurement plan">
          <div className="buyer-squad-measurement-head">
            <div>
              <span>Pilot measurement plan</span>
              <strong>{measurementPlan.label}</strong>
            </div>
            <b>{measurementPlan.status}</b>
          </div>
          <p>{measurementPlan.headline}</p>
          <small>{measurementPlan.metric}</small>
          <em>{measurementPlan.nextAction}</em>
          <div className="buyer-squad-measurement-steps">
            {measurementPlan.steps.map((step) => (
              <article key={step.id} className={step.status}>
                <div>
                  <span>{step.label}</span>
                  <b>{step.status}</b>
                </div>
                <p>{step.measure}</p>
                <small>
                  {step.owner}: {step.evidence}
                </small>
                <em>{step.exitGate}</em>
              </article>
            ))}
          </div>
        </div>
        <div className={cx("buyer-squad-value-claims", valueClaimLedger.status)} aria-label="Buyer squad value claim ledger">
          <div className="buyer-squad-value-claims-head">
            <div>
              <span>Buyer value claim ledger</span>
              <strong>{valueClaimLedger.label}</strong>
            </div>
            <b>{valueClaimLedger.status}</b>
          </div>
          <p>{valueClaimLedger.headline}</p>
          <em>{valueClaimLedger.nextAction}</em>
          <div className="buyer-squad-value-claim-list">
            {valueClaimLedger.claims.map((claim) => (
              <article key={claim.id} className={claim.status}>
                <div>
                  <span>{claim.label}</span>
                  <b>{claim.status}</b>
                </div>
                <p>{claim.claim}</p>
                <small>{claim.evidence}</small>
                <em>{claim.releaseRule}</em>
              </article>
            ))}
          </div>
        </div>
        <div className={cx("buyer-squad-claim-proof-queue", claimProofQueue.status)} aria-label="Buyer squad value claim proof queue">
          <div className="buyer-squad-claim-proof-head">
            <div>
              <span>Value claim proof queue</span>
              <strong>{claimProofQueue.label}</strong>
            </div>
            <b>{claimProofQueue.status}</b>
          </div>
          <p>{claimProofQueue.headline}</p>
          <div className="buyer-squad-claim-proof-actions" aria-label="Value claim proof packet actions">
            <button
              className={cx("icon-link", claimProofPacketCopyStatus === "copied" && "is-confirmed", claimProofPacketCopyStatus === "failed" && "is-risk")}
              type="button"
              onClick={copyClaimProofPacket}
            >
              <ClipboardCheck size={12} />
              {claimProofPacketCopyLabel}
            </button>
            <a className="icon-link" href={claimProofPacketHref} download="buyer-value-claim-proof.md">
              <Download size={12} />
              Export packet
            </a>
          </div>
          <div className="buyer-squad-claim-proof-list">
            {claimProofQueue.items.length ? (
              claimProofQueue.items.map((item) => (
                <article key={item.id} className={item.status}>
                  <div>
                    <span>{item.label}</span>
                    <b>{item.status}</b>
                  </div>
                  <p>{item.requiredArtifact}</p>
                  <small>
                    {item.owner}: {item.acceptanceGate}
                  </small>
                  <em>{item.nextAction}</em>
                </article>
              ))
            ) : (
              <article className="ready">
                <div>
                  <span>Proof queue</span>
                  <b>ready</b>
                </div>
                <p>No value claim proof repair is needed.</p>
                <small>All selected claims can stay attached to the buyer handoff.</small>
              </article>
            )}
          </div>
        </div>
        <div className="buyer-squad-review-agenda" aria-label="Buyer handoff review agenda">
          <div className="buyer-squad-review-agenda-head">
            <span>Review agenda</span>
            <strong>{openAgendaCount ? `${openAgendaCount}/${handoffAgenda.length} open` : "Ready"}</strong>
          </div>
          {handoffAgenda.map((item) => (
            <article key={item.id} className={item.status}>
              <div>
                <span>{item.duration}</span>
                <strong>{item.label}</strong>
              </div>
              <p>{item.proof}</p>
              <small>
                {item.owner}: {item.decision}
              </small>
            </article>
          ))}
        </div>
        <div className="buyer-squad-acceptance-matrix" aria-label="Buyer squad acceptance matrix">
          <div className="buyer-squad-acceptance-matrix-head">
            <span>Acceptance matrix</span>
            <strong>{acceptedMatrixCount}/{acceptanceMatrix.length} accepted</strong>
          </div>
          {acceptanceMatrix.map((item) => (
            <article key={item.id} className={item.status}>
              <div>
                <span>{item.verdict}</span>
                <strong>{item.agentName}</strong>
              </div>
              <p>{item.requiredEvidence}</p>
              <div className="buyer-squad-acceptance-gates">
                {item.gates.map((gate) => (
                  <span key={gate.id} className={gate.status}>
                    {gate.label}: {gate.status}
                  </span>
                ))}
              </div>
              <small>Reject if: {item.rejectIf}</small>
              <a href={item.href} target={item.href.startsWith("#") ? undefined : "_blank"} rel={item.href.startsWith("#") ? undefined : "noreferrer"}>
                {item.actionLabel}
                <ExternalLink size={12} />
              </a>
            </article>
          ))}
        </div>
        {trialRepairRows.length > 0 && (
          <div className="buyer-squad-trial-repair" aria-label="Buyer handoff trial repair queue">
            <div className="buyer-squad-trial-repair-head">
              <div>
                <span>Trial repair queue</span>
                <strong>{trialRepairRows.length} open</strong>
              </div>
              <div className="buyer-squad-trial-repair-actions" aria-label="Trial repair packet actions">
                <button className={cx("icon-link", repairPacketCopyStatus === "copied" && "is-confirmed", repairPacketCopyStatus === "failed" && "is-risk")} type="button" onClick={copyTrialRepairPacket}>
                  <ClipboardCheck size={12} />
                  {repairPacketCopyLabel}
                </button>
                <a className="icon-link" href={trialRepairPacketHref} download="buyer-squad-trial-repair.md">
                  <Download size={12} />
                  Export packet
                </a>
              </div>
            </div>
            {trialRepairRows.map((item) => (
              <article key={item.id} className={item.status}>
                <div>
                  <span>{item.status === "scope-needed" ? "Scope" : "Proof"}</span>
                  <strong>{item.agentName}</strong>
                </div>
                <p>{item.requiredArtifact}</p>
                <small>{item.acceptanceGate}</small>
                <b>{item.responseMustInclude}</b>
                <a href={item.href} target={item.href.startsWith("#") ? undefined : "_blank"} rel={item.href.startsWith("#") ? undefined : "noreferrer"}>
                  {item.actionLabel}
                  <ExternalLink size={12} />
                </a>
              </article>
            ))}
          </div>
        )}
        {handoffRows.map((row) => (
          <article key={row.id} className={row.status}>
            <div>
              <span>{row.role}</span>
              <strong>{row.agentName}</strong>
            </div>
            <p>{row.buyerTask}</p>
            <small>{row.acceptance}</small>
            <a href={row.href} target={row.href.startsWith("#") ? undefined : "_blank"} rel={row.href.startsWith("#") ? undefined : "noreferrer"}>
              {row.actionLabel}
              <ExternalLink size={12} />
            </a>
            <b>{row.evidence}</b>
          </article>
        ))}
          </div>
        </details>
      </div>
    </section>
  );
}

function GeminiPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [analysis, setAnalysis] = useState<GeminiRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runGemini() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as GeminiRecommendation;
      setAnalysis(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel gemini-panel">
      <div className="panel-heading">
        <h2>
          <Sparkles size={18} />
          Gemini 3.5 Flash
        </h2>
        <button className="icon-button" onClick={runGemini} disabled={loading} title="Gemini分析を実行">
          <Play size={17} />
          {loading ? "Running" : "Analyze"}
        </button>
      </div>
      {error && <p className="error-text">Gemini API request failed: {error}</p>}
      {analysis ? (
        <div className="analysis">
          <span className="chip">{analysis.source} / {analysis.model}</span>
          <strong>{analysis.executiveSummary}</strong>
          <p>{analysis.winningAngle}</p>
          <div className="analysis-grid">
            <div>
              <h3>Risks</h3>
              <ul>
                {analysis.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Next</h3>
              <ul>
                {analysis.nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
          <pre>{analysis.pitchScript}</pre>
        </div>
      ) : (
        <div className="empty-analysis">
          <BadgeCheck size={28} />
          <strong>{recommendation.headline}</strong>
          <p>市場で選んだ編成をGeminiに渡すと、勝ち筋、残リスク、ピッチが更新されます。</p>
        </div>
      )}
    </section>
  );
}

function AgentCardJson() {
  const [card, setCard] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/.well-known/agent-card.json")
      .then((response) => response.json())
      .then((payload: Record<string, unknown>) => setCard(payload))
      .catch(() => setCard(null));
  }, []);

  return (
    <section className="panel agent-card-json">
      <div className="panel-heading">
        <h2>
          <ExternalLink size={18} />
          Agent Card
        </h2>
        <a href="/.well-known/agent-card.json" target="_blank" rel="noreferrer" className="icon-link">
          <Download size={16} />
          JSON
        </a>
      </div>
      <pre>{card ? JSON.stringify(card, null, 2) : "Loading agent card..."}</pre>
    </section>
  );
}

function StrategyMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="strategy-meter">
      <div className="strategy-meter-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter" data-tone={scoreTone(value)}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function JudgeTourPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [tour, setTour] = useState<JudgeTour | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildTour() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setTour((await response.json()) as JudgeTour);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="judge-tour" className="judge-tour">
      <div className="tour-heading">
        <div>
          <span className="eyebrow">Judge tour</span>
          <h2>
            <Play size={20} />
            90-second walkthrough
          </h2>
        </div>
        <button className="icon-button" onClick={buildTour} disabled={loading} title="審査員向け90秒導線を生成">
          <Trophy size={17} />
          {loading ? "Sequencing" : "Build judge tour"}
        </button>
      </div>

      <div className="tour-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Judge tour request failed: {error}</p>}

      {tour ? (
        <div className="tour-body">
          <div className="tour-summary">
            <div>
              <span className={cx("risk-chip", tour.readiness === "walkthrough-ready" ? "low" : tour.readiness === "external-url-gaps" ? "medium" : "high")}>
                {tour.readiness}
              </span>
              <h3>{tour.headline}</h3>
              <p>{tour.openingScript}</p>
              <strong>{tour.hardTruth}</strong>
            </div>
            <div className="tour-score">
              <strong>{tour.tourScore}</strong>
              <span>{tour.totalSeconds}s tour</span>
            </div>
          </div>

          <div className="tour-claims">
            {tour.claims.map((claim) => (
              <article key={claim.id} className={scoreTone(claim.score)}>
                <span>{claim.label}</span>
                <strong>{claim.score}</strong>
                <p>{claim.claim}</p>
                <small>{claim.evidence}</small>
              </article>
            ))}
          </div>

          <div className="tour-steps">
            {tour.steps.map((step) => (
              <article key={step.id} className={step.status}>
                <div>
                  <span>{step.timeRange}</span>
                  <strong>{step.screen}</strong>
                  <b>{step.status}</b>
                </div>
                <p>{step.narratorLine}</p>
                <small>{step.action}</small>
                <a href={step.endpoint} target="_blank" rel="noreferrer">
                  Endpoint <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="tour-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Judge objections
              </h3>
              <div className="tour-objections">
                {tour.objections.map((objection) => (
                  <article key={objection.id}>
                    <strong>{objection.question}</strong>
                    <p>{objection.response}</p>
                    <small>{objection.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Blockers and links
              </h3>
              <div className="tour-blockers">
                {tour.blockers.length > 0 ? (
                  tour.blockers.map((blocker) => (
                    <article key={blocker.id} className={blocker.severity}>
                      <div>
                        <strong>{blocker.label}</strong>
                        <span>{blocker.severity}</span>
                      </div>
                      <p>{blocker.action}</p>
                      <small>{blocker.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No blockers</strong>
                    <p>外部URL、品質、運用のブロッカーはありません。</p>
                  </article>
                )}
              </div>
              <div className="tour-links">
                {tour.links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(tour.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="tour-empty">
          <Play size={28} />
          <strong>Build judge tourで、審査員が開く順番、話す台詞、反論、証拠リンク、残ブロッカーを90秒導線に束ねます。</strong>
          <p>Judge Brief、Market Intel、Impact Case、Security Review、Judge Proof、Submission Launch Gateを一つの審査ルートとして確認します。</p>
        </div>
      )}
    </section>
  );
}

function UserPilotPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [pilot, setPilot] = useState<UserPilotLab | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPilot() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user-pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPilot((await response.json()) as UserPilotLab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="user-pilot">
      <div className="pilot-heading">
        <div>
          <span className="eyebrow">User pilot lab</span>
          <h2>
            <Crosshair size={20} />
            First-run usability pilot
          </h2>
        </div>
        <button className="icon-button" onClick={runPilot} disabled={loading} title="対象ユーザーの初回利用導線を検証">
          <Radar size={17} />
          {loading ? "Piloting" : "Run user pilot"}
        </button>
      </div>

      {error && <p className="error-text">User pilot request failed: {error}</p>}

      {pilot ? (
        <div className="pilot-body">
          <div className="pilot-summary">
            <div>
              <span className={cx("risk-chip", pilot.readiness === "pilot-ready" ? "low" : pilot.readiness === "needs-guidance" ? "medium" : "high")}>
                {pilot.readiness}
              </span>
              <h3>{pilot.headline}</h3>
              <p>{pilot.hardTruth}</p>
              <strong>{pilot.timeToValueSeconds}s max time-to-value / +{pilot.usabilityLift} usability lift to chase</strong>
            </div>
            <div className="pilot-score">
              <strong>{pilot.pilotScore}</strong>
              <span>pilot score</span>
            </div>
          </div>

          {pilot.guideRails.length > 0 && (
            <div className="pilot-guide-rails">
              {pilot.guideRails.map((rail) => (
                <article key={rail.id}>
                  <div>
                    <strong>{rail.label}</strong>
                    <span>-{rail.reducesSeconds}s</span>
                  </div>
                  <p>{rail.screen}</p>
                  <small>{rail.evidence}</small>
                </article>
              ))}
            </div>
          )}

          <div className="pilot-paths">
            {pilot.paths.map((path) => (
              <article key={path.id}>
                <div>
                  <span>{path.timeToValueSeconds}s</span>
                  <strong>{path.persona}</strong>
                </div>
                <h3>{path.goal}</h3>
                <p>{path.successMetric}</p>
                <small>{path.proof}</small>
                <ol>
                  {path.tasks.map((task) => (
                    <li key={task.id} className={task.status}>
                      <b>{task.screen}</b>
                      <span>{task.action}</span>
                      <small>{task.successSignal}</small>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <div className="pilot-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Frictions
              </h3>
              <div className="pilot-frictions">
                {pilot.frictions.length > 0 ? (
                  pilot.frictions.map((friction) => (
                    <article key={friction.id} className={friction.severity}>
                      <div>
                        <strong>{friction.label}</strong>
                        <span>{friction.severity}</span>
                      </div>
                      <p>{friction.evidence}</p>
                      <small>{friction.owner}: {friction.fix}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>No first-run friction</strong>
                    <p>3つの対象ユーザー導線に、重大な摩擦はありません。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Play size={15} />
                Next clicks
              </h3>
              <div className="pilot-clicks">
                {pilot.nextClicks.map((click) => (
                  <article key={click.id}>
                    <div>
                      <strong>{click.button}</strong>
                      <span>{click.screen}</span>
                    </div>
                    <p>{click.reason}</p>
                    <small>{click.expectedEvidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Validation
              </h3>
              <div className="pilot-checks">
                {pilot.validationChecklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                  </article>
                ))}
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(pilot.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="pilot-empty">
          <Crosshair size={28} />
          <strong>Run user pilotで、開発リード、Platform/SRE、提出者が最初の3分で価値へ到達できるかを検証します。</strong>
          <p>ユーザビリティの弱点を、対象ユーザー別のクリック順、摩擦、成功条件、次アクションに変換します。</p>
        </div>
      )}
    </section>
  );
}

function OptimizerCandidateCard({
  title,
  candidate
}: {
  title: string;
  candidate: OptimizedSquadCandidate;
}) {
  return (
    <article className="optimizer-candidate">
      <div className="optimizer-candidate-top">
        <span>{title}</span>
        <strong>{candidate.totalScore}</strong>
      </div>
      <h3>{candidate.agents.map((agent) => agent.name).join(" / ")}</h3>
      <div className="optimizer-candidate-meta">
        <span>
          <Coins size={14} />
          {candidate.totalPrice}
        </span>
        <span>
          <Gauge size={14} />
          Judge {candidate.judgeScore}
        </span>
        <span>
          <BadgeCheck size={14} />
          Coverage {candidate.coverageScore}
        </span>
      </div>
      <div className="optimizer-coverage">
        {candidate.coverage.map((gate) => (
          <span key={gate.id} className={gate.met ? "met" : "missing"}>
            {gate.label}
          </span>
        ))}
      </div>
      <p>{candidate.weakestCriterion.label}: {candidate.weakestCriterion.nextAction}</p>
    </article>
  );
}

function SquadOptimizerPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [optimizer, setOptimizer] = useState<SquadOptimizerRun | null>(null);
  const [budget, setBudget] = useState(140);
  const [maxSquadSize, setMaxSquadSize] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function optimizeSquad() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/squad-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          budget,
          maxSquadSize
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setOptimizer((await response.json()) as SquadOptimizerRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="squad-optimizer">
      <div className="optimizer-heading">
        <div>
          <span className="eyebrow">Squad optimizer</span>
          <h2>
            <ShoppingCart size={20} />
            Budget-aware winning squad
          </h2>
        </div>
        <button className="icon-button" onClick={optimizeSquad} disabled={loading} title="予算内の最適編成を探索">
          <Workflow size={17} />
          {loading ? "Optimizing" : "Optimize squad"}
        </button>
      </div>

      <div className="optimizer-inputs">
        <label>
          <span>Budget</span>
          <input
            type="number"
            min={60}
            max={300}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Max squad size</span>
          <input
            type="number"
            min={1}
            max={6}
            value={maxSquadSize}
            onChange={(event) => setMaxSquadSize(Number(event.target.value))}
          />
        </label>
      </div>

      {error && <p className="error-text">Squad optimizer request failed: {error}</p>}

      {optimizer ? (
        <div className="optimizer-body">
          <div className="optimizer-summary">
            <div>
              <span className={cx("risk-chip", optimizer.readiness === "optimized" ? "low" : optimizer.readiness === "needs-more-budget" ? "medium" : "high")}>
                {optimizer.readiness}
              </span>
              <h3>{optimizer.headline}</h3>
              <p>{optimizer.hardTruth}</p>
              <strong>{optimizer.recommended.totalPrice} used / {optimizer.recommended.remainingBudget} remaining / rank {optimizer.recommended.rank}</strong>
            </div>
            <div className="optimizer-score">
              <strong>{optimizer.optimizerScore}</strong>
              <span>optimizer score</span>
            </div>
          </div>

          <div className="optimizer-candidates">
            <OptimizerCandidateCard title="Current" candidate={optimizer.current} />
            <OptimizerCandidateCard title="Recommended" candidate={optimizer.recommended} />
            {optimizer.stretch && <OptimizerCandidateCard title={`Stretch +${optimizer.budgetGap}`} candidate={optimizer.stretch} />}
          </div>

          <div className="optimizer-deltas">
            <article>
              <span>Total</span>
              <strong>{optimizer.delta.totalScore >= 0 ? `+${optimizer.delta.totalScore}` : optimizer.delta.totalScore}</strong>
            </article>
            <article>
              <span>Judge</span>
              <strong>{optimizer.delta.judgeScore >= 0 ? `+${optimizer.delta.judgeScore}` : optimizer.delta.judgeScore}</strong>
            </article>
            <article>
              <span>Coverage</span>
              <strong>{optimizer.delta.coverageScore >= 0 ? `+${optimizer.delta.coverageScore}` : optimizer.delta.coverageScore}</strong>
            </article>
            <article>
              <span>Usability</span>
              <strong>{optimizer.delta.usability >= 0 ? `+${optimizer.delta.usability}` : optimizer.delta.usability}</strong>
            </article>
            <article>
              <span>Budget used</span>
              <strong>{optimizer.delta.budgetUsed >= 0 ? `+${optimizer.delta.budgetUsed}` : optimizer.delta.budgetUsed}</strong>
            </article>
          </div>

          <div className="optimizer-grid">
            <section>
              <h3>
                <Workflow size={15} />
                Swap plan
              </h3>
              <div className="optimizer-steps">
                {optimizer.swapPlan.map((step) => (
                  <article key={step.id} className={step.action}>
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.action}</span>
                    </div>
                    <p>{step.reason}</p>
                    <small>{step.scoreImpact}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                Alternatives
              </h3>
              <div className="optimizer-alternatives">
                {optimizer.alternatives.map((candidate) => (
                  <article key={candidate.id}>
                    <div>
                      <strong>{candidate.agents.map((agent) => agent.name).join(" / ")}</strong>
                      <span>{candidate.totalScore}</span>
                    </div>
                    <p>{candidate.totalPrice} budget / coverage {candidate.coverageScore} / judge {candidate.judgeScore}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(optimizer.a2aPayload, null, 2)}</pre>
            </section>
          </div>

          <div className="optimizer-rules">
            {optimizer.decisionRules.map((rule) => (
              <article key={rule.id}>
                <span>{rule.weight}%</span>
                <strong>{rule.label}</strong>
                <p>{rule.evidence}</p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="optimizer-empty">
          <ShoppingCart size={28} />
          <strong>Optimize squadで、予算内の最適編成、交換計画、追加予算ギャップを生成します。</strong>
          <p>単体の次候補ではなく、審査5項目と必須技術を同時に満たす組み合わせを探索します。</p>
        </div>
      )}
    </section>
  );
}

function LiveEvidencePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [evidence, setEvidence] = useState<LiveEvidenceRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function monitorEvidence() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/live-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          budget: 140,
          maxSquadSize: 4
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEvidence((await response.json()) as LiveEvidenceRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="live-evidence">
      <div className="evidence-heading">
        <div>
          <span className="eyebrow">Live evidence monitor</span>
          <h2>
            <Radar size={20} />
            Public proof probes
          </h2>
        </div>
        <button className="icon-button" onClick={monitorEvidence} disabled={loading} title="公開環境の証拠をライブ検証">
          <Activity size={17} />
          {loading ? "Probing" : "Monitor evidence"}
        </button>
      </div>

      {error && <p className="error-text">Live evidence request failed: {error}</p>}

      {evidence ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <div>
              <span className={cx("risk-chip", evidence.readiness === "live-ready" ? "low" : evidence.readiness === "watch" ? "medium" : "high")}>
                {evidence.readiness}
              </span>
              <h3>{evidence.summary}</h3>
              <p>{evidence.hardTruth}</p>
              <small>{new Date(evidence.generatedAt).toLocaleString()}</small>
            </div>
            <div className="evidence-score">
              <strong>{evidence.evidenceScore}</strong>
              <span>live proof</span>
            </div>
          </div>

          <div className="evidence-probes">
            {evidence.probes.map((probe) => (
              <article key={probe.id} className={probe.status}>
                <div>
                  <strong>{probe.label}</strong>
                  <span>{probe.status}</span>
                </div>
                <p>{probe.evidence}</p>
                <small>{probe.latencyMs ? `${probe.latencyMs}ms` : "live"} / score {probe.score}</small>
                <a href={probe.url} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="evidence-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="evidence-actions">
                {evidence.nextActions.length > 0 ? (
                  evidence.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.label}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>All public probes passed</strong>
                    <p>審査員に見せる公開証拠はライブで確認済みです。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Runbook
              </h3>
              <pre>{evidence.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(evidence.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="evidence-empty">
          <Radar size={28} />
          <strong>Monitor evidenceで、Cloud Run、Agent Card、A2A、Squad Optimizer、CIを公開環境からライブ検証します。</strong>
          <p>「提出URLが動く」という主張を、審査員の前で再実行できる証拠に変えます。</p>
        </div>
      )}
    </section>
  );
}

function ObservabilityOraclePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [oracle, setOracle] = useState<ObservabilityOracle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runOracle() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/observability-oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          budget: 140,
          maxSquadSize: 4
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setOracle((await response.json()) as ObservabilityOracle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  const decisionClass = (status: string) => (status === "clear" ? "clear" : status === "blocked" ? "now" : "next");

  return (
    <section className="live-evidence observability-oracle">
      <div className="evidence-heading">
        <div>
          <span className="eyebrow">Observability Oracle</span>
          <h2>
            <Activity size={20} />
            Operations-to-buyer proof loop
          </h2>
        </div>
        <button className="icon-button" onClick={runOracle} disabled={loading} title="運用観測から買い手価値と次のAI雇用を生成">
          <Radar size={17} />
          {loading ? "Reading" : "Run oracle"}
        </button>
      </div>

      {error && <p className="error-text">Observability oracle request failed: {error}</p>}

      {oracle ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <div>
              <span className={cx("risk-chip", oracle.readiness === "operator-ready" ? "low" : oracle.readiness === "watch" ? "medium" : "high")}>
                {oracle.readiness}
              </span>
              <h3>{oracle.headline}</h3>
              <p>{oracle.hardTruth}</p>
            </div>
            <div className="evidence-score">
              <strong>{oracle.oracleScore}</strong>
              <span>oracle score</span>
            </div>
          </div>

          <div className="evidence-probes oracle-receipts">
            {oracle.receipts.map((receipt) => (
              <article key={receipt.id} className={receipt.status}>
                <div>
                  <strong>{receipt.label}</strong>
                  <span>{receipt.status}</span>
                </div>
                <p>{receipt.judgeLine}</p>
                <small>{receipt.metric}</small>
                <b>{receipt.evidence}</b>
              </article>
            ))}
          </div>

          <div className="evidence-grid oracle-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Decisions
              </h3>
              <div className="evidence-actions">
                {oracle.decisions.map((decision) => (
                  <article key={decision.id} className={decisionClass(decision.status)}>
                    <div>
                      <strong>{decision.decision}</strong>
                      <span>{decision.status}</span>
                    </div>
                    <p>{decision.evidence}</p>
                    <small>{decision.actor} / confidence {decision.confidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Observe-decide-rebuy loop
              </h3>
              <div className="evidence-actions">
                {oracle.loop.map((step) => (
                  <article key={step.id} className={decisionClass(step.status)}>
                    <div>
                      <strong>{step.phase}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.action}</p>
                    <small>{step.owner} / {step.output}</small>
                    <a href={step.proofUrl} target="_blank" rel="noreferrer">
                      Proof <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Runbook + A2A
              </h3>
              <pre>{oracle.runbook.join("\n")}</pre>
              <pre>{JSON.stringify(oracle.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="evidence-empty">
          <Activity size={28} />
          <strong>Run oracleで、Live Evidence、Ops Drill、Pilot Economicsをつなぎ、運用判断を買い手価値の証拠に変換します。</strong>
          <p>DevOpsの「まわす」を、公開継続/復旧判断、ROI、次のAI雇用までつながる審査用receiptにします。</p>
        </div>
      )}
    </section>
  );
}

function ReleaseDriftPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [drift, setDrift] = useState<ReleaseDriftGuard | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>(SUBMISSION_PROOF.deployedUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkDrift() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/release-drift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          targetUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDrift((await response.json()) as ReleaseDriftGuard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="release-drift" className="live-evidence release-drift">
      <div className="evidence-heading">
        <div>
          <span className="eyebrow">Release drift guard</span>
          <h2>
            <Rocket size={20} />
            Public revision check
          </h2>
        </div>
        <button className="icon-button" onClick={checkDrift} disabled={loading} title="公開Cloud Runのrevision driftを検査">
          <Activity size={17} />
          {loading ? "Checking" : "Check release drift"}
        </button>
      </div>

      <div className="drift-target-row">
        <label htmlFor="release-target-url">Target Cloud Run URL</label>
        <input id="release-target-url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} />
      </div>

      {error && <p className="error-text">Release drift request failed: {error}</p>}

      {drift ? (
        <div className="evidence-body">
          <div className="evidence-summary">
            <div>
              <span className={cx("risk-chip", drift.verdict === "release-current" ? "low" : drift.verdict === "deploy-drift" ? "medium" : "high")}>
                {drift.verdict}
              </span>
              <h3>{drift.summary}</h3>
              <p>{drift.hardTruth}</p>
              <small>
                {drift.targetBaseUrl} / {new Date(drift.generatedAt).toLocaleString()}
              </small>
            </div>
            <div className="evidence-score">
              <strong>{drift.driftScore}</strong>
              <span>release score</span>
            </div>
          </div>

          <div className="drift-targets">
            <article>
              <span>expected skills</span>
              <strong>{drift.expectedSkillCount}</strong>
              <p>current local Agent Card surface</p>
            </article>
            <article>
              <span>observed skills</span>
              <strong>{drift.observedSkillCount}</strong>
              <p>target Cloud Run Agent Card surface</p>
            </article>
            <article className={drift.missingSkills.length > 0 ? "watch" : "passed"}>
              <span>missing required skills</span>
              <strong>{drift.missingSkills.length}</strong>
              <p>{drift.missingSkills.length > 0 ? drift.missingSkills.join(", ") : "none"}</p>
            </article>
          </div>

          <div className="evidence-probes">
            {drift.probes.map((probe) => (
              <article key={probe.id} className={probe.status}>
                <div>
                  <strong>{probe.label}</strong>
                  <span>{probe.status}</span>
                </div>
                <p>{probe.evidence}</p>
                <small>{probe.latencyMs ? `${probe.latencyMs}ms` : "live"} / score {probe.score}</small>
                <a href={probe.url} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="evidence-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="evidence-actions">
                {drift.nextActions.length > 0 ? (
                  drift.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.id}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.owner} / {action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>Release is current</strong>
                    <p>公開Cloud Runは最新skill surfaceを返しています。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Redeploy runbook
              </h3>
              <pre>{drift.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(drift.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="evidence-empty">
          <Rocket size={28} />
          <strong>Check release driftで、公開Cloud Runが最新Agent Card、Acceptance Matrix、A2A artifactを出しているか確認します。</strong>
          <p>CIが緑でも、提出URLが古いrevisionなら審査員には未実装に見えます。</p>
        </div>
      )}
    </section>
  );
}

function DeployRecoveryPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [plan, setPlan] = useState<DeployRecoveryPlan | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>(SUBMISSION_PROOF.deployedUrl);
  const [lastDeployError, setLastDeployError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildRecoveryPlan() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/deploy-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          targetUrl,
          lastDeployError
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPlan((await response.json()) as DeployRecoveryPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="deploy-recovery" className="deploy-recovery">
      <div className="recovery-heading">
        <div>
          <span className="eyebrow">Deploy recovery</span>
          <h2>
            <Terminal size={20} />
            Cloud Run recovery plan
          </h2>
        </div>
        <button className="icon-button" onClick={buildRecoveryPlan} disabled={loading} title="Cloud Run再デプロイ復旧計画を作成">
          <Rocket size={17} />
          {loading ? "Planning" : "Plan deploy recovery"}
        </button>
      </div>

      <div className="recovery-inputs">
        <label>
          Target Cloud Run URL
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} />
        </label>
        <label>
          Last deploy error
          <textarea
            value={lastDeployError}
            onChange={(event) => setLastDeployError(event.target.value)}
            placeholder="Paste gcloud auth / Cloud Build error output when available"
          />
        </label>
      </div>

      {error && <p className="error-text">Deploy recovery request failed: {error}</p>}

      {plan ? (
        <div className="recovery-body">
          <div className="recovery-summary">
            <div>
              <span className={cx("risk-chip", plan.readiness === "recovered" ? "low" : plan.readiness === "blocked" ? "high" : "medium")}>
                {plan.readiness}
              </span>
              <h3>{plan.headline}</h3>
              <p>{plan.hardTruth}</p>
              <strong>{plan.primaryAction}</strong>
            </div>
            <div className="recovery-score">
              <strong>{plan.recoveryScore}</strong>
              <span>recovery score</span>
            </div>
          </div>

          <div className="recovery-checks">
            {plan.checks.map((check) => (
              <article key={check.id} className={check.status}>
                <span>{check.status}</span>
                <strong>{check.label}</strong>
                <p>{check.evidence}</p>
              </article>
            ))}
          </div>

          <div className="recovery-grid">
            <section>
              <h3>
                <Terminal size={15} />
                Commands
              </h3>
              <div className="recovery-commands">
                {plan.commands.map((command) => (
                  <article key={command.id} className={command.blocking ? "blocked" : command.copyGroup}>
                    <div>
                      <strong>{command.label}</strong>
                      <span>{command.copyGroup}</span>
                    </div>
                    <pre>{command.command}</pre>
                    <p>{command.why}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Recovery steps
              </h3>
              <div className="recovery-steps">
                {plan.steps.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.window}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.owner}: {step.action}</p>
                    <small>{step.verify}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Blockers
              </h3>
              <div className="recovery-blockers">
                {plan.blockers.length > 0 ? (
                  plan.blockers.map((blocker) => (
                    <article key={blocker.id} className={blocker.priority}>
                      <div>
                        <strong>{blocker.owner}</strong>
                        <span>{blocker.priority}</span>
                      </div>
                      <p>{blocker.action}</p>
                      <small>{blocker.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="ready">
                    <strong>No deploy blockers</strong>
                    <p>公開URLは最新です。Judge Command Centerへ戻って録画前確認に進めます。</p>
                  </article>
                )}
              </div>
              <ol className="recovery-script">
                {plan.judgeScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <pre>{JSON.stringify(plan.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="recovery-empty">
          <Terminal size={28} />
          <strong>Plan deploy recoveryで、公開Cloud Run driftを再デプロイ手順へ変換します。</strong>
          <p>gcloud認証エラーを貼ると、コード問題ではなく手動認証が必要な状態として判定します。</p>
        </div>
      )}
    </section>
  );
}

function MoatStressPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [moat, setMoat] = useState<MoatStressTest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function stressMoat() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/moat-stress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMoat((await response.json()) as MoatStressTest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="moat-stress">
      <div className="moat-heading">
        <div>
          <span className="eyebrow">Competitive moat</span>
          <h2>
            <Crosshair size={20} />
            Moat Stress Test
          </h2>
        </div>
        <button className="icon-button" onClick={stressMoat} disabled={loading} title="競合反論をストレステスト">
          <ShieldCheck size={17} />
          {loading ? "Testing" : "Stress-test moat"}
        </button>
      </div>

      {error && <p className="error-text">Moat stress request failed: {error}</p>}

      {moat ? (
        <div className="moat-body">
          <div className="moat-summary">
            <div>
              <span className={cx("risk-chip", moat.verdict === "defensible" ? "low" : moat.verdict === "needs-proof" ? "medium" : "high")}>
                {moat.verdict}
              </span>
              <h3>{moat.headline}</h3>
              <p>{moat.hardTruth}</p>
              <small>{new Date(moat.generatedAt).toLocaleString()}</small>
            </div>
            <div className="moat-score">
              <strong>{moat.stressScore}</strong>
              <span>moat score</span>
            </div>
          </div>

          <div className="moat-scenarios">
            {moat.scenarios.map((scenario) => (
              <article key={scenario.id} className={scenario.verdict}>
                <div>
                  <span>{scenario.threatLevel}</span>
                  <strong>{scenario.score}</strong>
                </div>
                <h3>{scenario.competitor}</h3>
                <b>{scenario.objection}</b>
                <p>{scenario.pressure}</p>
                <strong>{scenario.answer}</strong>
                <small>{scenario.proofToShow}</small>
                <em>{scenario.residualRisk}</em>
                <div className="moat-links">
                  {scenario.evidenceLinks.map((link) => (
                    <a key={`${scenario.id}-${link.label}`} href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="moat-grid">
            <section>
              <h3>
                <Film size={15} />
                Recording order
              </h3>
              <ol className="moat-order">
                {moat.recordingOrder.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Actions
              </h3>
              <div className="moat-actions">
                {moat.actions.map((action) => (
                  <article key={action.id} className={action.priority}>
                    <div>
                      <strong>{action.owner}</strong>
                      <span>{action.priority}</span>
                    </div>
                    <p>{action.action}</p>
                    <small>{action.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(moat.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="moat-empty">
          <Crosshair size={28} />
          <strong>Stress-test moatで、ADK/LangGraph/CrewAI/Dify/AgentOpsからの反論に証拠付きで答えます。</strong>
          <p>競合を否定せず、どの証拠をどの順番で見せるかまで審査導線に変換します。</p>
        </div>
      )}
    </section>
  );
}

function CompetitiveBattlecardPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [battlecard, setBattlecard] = useState<CompetitiveBattlecard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildBattlecard() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/competitive-battlecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBattlecard((await response.json()) as CompetitiveBattlecard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="competitive-battlecard" className="battlecard-panel">
      <div className="battle-heading">
        <div>
          <span className="eyebrow">Competitive battlecard</span>
          <h2>
            <Network size={20} />
            Judge-ready competitor answers
          </h2>
        </div>
        <div className="battle-heading-actions">
          <a href="/competitive-swot" target="_blank" rel="noreferrer" className="icon-link">
            <ExternalLink size={14} />
            SWOT Page
          </a>
          <button className="icon-button" onClick={buildBattlecard} disabled={loading} title="競合別の審査回答カードを生成">
            <ClipboardCheck size={17} />
            {loading ? "Building" : "Build battlecard"}
          </button>
        </div>
      </div>

      {error && <p className="error-text">Competitive battlecard request failed: {error}</p>}

      {battlecard ? (
        <div className="battle-body">
          <div className="battle-summary">
            <div>
              <span className={cx("risk-chip", battlecard.readiness === "judge-ready" ? "low" : battlecard.readiness === "needs-proof" ? "medium" : "high")}>
                {battlecard.readiness}
              </span>
              <h3>{battlecard.headline}</h3>
              <p>{battlecard.hardTruth}</p>
              <small>{battlecard.thesis}</small>
            </div>
            <div className="battle-score">
              <strong>{battlecard.battleScore}</strong>
              <span>battle score</span>
            </div>
          </div>

          <div className="battle-replay">
            <section>
              <div>
                <span className={cx("risk-chip", battlecard.objectionReplay.readiness === "replay-ready" ? "low" : battlecard.objectionReplay.readiness === "replay-watch" ? "medium" : "high")}>
                  {battlecard.objectionReplay.readiness}
                </span>
                <strong>{battlecard.objectionReplay.replayScore}</strong>
              </div>
              <h3>Objection Replay</h3>
              <p>{battlecard.objectionReplay.openingObjection}</p>
              <b>{battlecard.objectionReplay.lockedAnswer}</b>
              <small>
                {battlecard.objectionReplay.sourceCount} sources / {battlecard.objectionReplay.swotSignalCount} SWOT signals
              </small>
            </section>
            <div>
              {battlecard.objectionReplay.steps.map((step) => (
                <article key={step.id} className={step.status}>
                  <span>{step.timeRange}</span>
                  <strong>{step.screen}</strong>
                  <p>{step.say}</p>
                  <small>{step.judgeSignal}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="battle-proof-lock">
            <div className="battle-proof-summary">
              <div>
                <span className={cx("risk-chip", battlecard.proofLock.readiness === "proof-locked" ? "low" : battlecard.proofLock.readiness === "proof-watch" ? "medium" : "high")}>
                  {battlecard.proofLock.readiness}
                </span>
                <h3>Competitive Proof Lock</h3>
                <p>{battlecard.proofLock.judgeLine}</p>
                <small>
                  {battlecard.proofLock.coverage.competitorCount} competitors / {battlecard.proofLock.coverage.sourceUrlCount} sources /{" "}
                  {battlecard.proofLock.coverage.swotLinkCount} SWOT links / {battlecard.proofLock.coverage.liveSourceReadiness}
                </small>
              </div>
              <div className="battle-proof-score">
                <strong>{battlecard.proofLock.proofScore}</strong>
                <span>proof score</span>
              </div>
            </div>
            <div className="battle-proof-checks">
              {battlecard.proofLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.proof}</p>
                  <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="battle-duel">
            <section>
              <div>
                <span className={cx("risk-chip", battlecard.criteriaDuel.readiness === "duel-locked" ? "low" : battlecard.criteriaDuel.readiness === "duel-watch" ? "medium" : "high")}>
                  {battlecard.criteriaDuel.readiness}
                </span>
                <strong>{battlecard.criteriaDuel.duelScore}</strong>
              </div>
              <h3>Criteria Duel</h3>
              <p>{battlecard.criteriaDuel.judgeLine}</p>
            </section>
            <div>
              {battlecard.criteriaDuel.rows.map((row) => (
                <article key={row.id} className={row.status}>
                  <div>
                    <span>{row.status}</span>
                    <strong>{row.score}</strong>
                  </div>
                  <h3>{row.label}</h3>
                  <small>{row.targetCompetitor}</small>
                  <p>{row.competitorAdvantage}</p>
                  <b>{row.ourCounter}</b>
                  <em>
                    {row.sourceCount} sources / {row.swotSignal.quadrant}: {row.swotSignal.title}
                  </em>
                </article>
              ))}
            </div>
          </div>

          <div className="battle-cards">
            {battlecard.cards.map((card) => (
              <article key={card.id} className={card.status}>
                <div>
                  <span>{card.threatLevel}</span>
                  <strong>{card.score}</strong>
                </div>
                <h3>{card.competitor}</h3>
                <small>{card.category}</small>
                <b>{card.judgeQuestion}</b>
                <p>{card.whereTheyWin}</p>
                <strong>{card.shortAnswer}</strong>
                <em>{card.whereWeWin}</em>
                <small>{card.proofRoute}</small>
                <div className="battle-sources">
                  {card.sourceUrls.map((source) => (
                    <a key={`${card.id}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">
                      {source.label}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
                <div className="battle-swot-chips">
                  {card.swotLinks.map((link) => (
                    <span key={`${card.id}-${link.quadrant}-${link.title}`} className={link.signal}>
                      {link.quadrant}: {link.title}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="battle-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Top risks
              </h3>
              <div className="battle-risks">
                {battlecard.topRisks.map((risk) => (
                  <article key={risk.id} className={risk.severity}>
                    <div>
                      <strong>{risk.id}</strong>
                      <span>{risk.severity}</span>
                    </div>
                    <p>{risk.risk}</p>
                    <small>{risk.response}</small>
                    <b>{risk.proof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                SWOT receipts
              </h3>
              <div className="battle-receipts">
                {battlecard.swotReceipts.map((receipt) => (
                  <article key={`${receipt.quadrant}-${receipt.title}`} className={receipt.signal}>
                    <span>{receipt.quadrant}</span>
                    <strong>{receipt.title}</strong>
                    <p>{receipt.detail}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Objection receipts
              </h3>
              <div className="battle-objections">
                {battlecard.objectionReceipts.slice(0, 4).map((receipt) => (
                  <article key={receipt.id} className={receipt.status}>
                    <div>
                      <strong>{receipt.competitor}</strong>
                      <span>{receipt.status}</span>
                    </div>
                    <p>{receipt.objection}</p>
                    <small>
                      {receipt.swotSignal.quadrant}: {receipt.swotSignal.title}
                    </small>
                    <b>{receipt.mvpUpgrade}</b>
                    <em>{receipt.protopediaLine}</em>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Reviewer script
              </h3>
              <ol className="battle-script">
                {battlecard.judgeScript.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(battlecard.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="battle-empty">
          <Network size={28} />
          <strong>Build battlecardで、競合別の質問、短い回答、SWOT根拠、公式ソース、録画で見せる証拠を1枚に束ねます。</strong>
          <p>Moat Stressの反論を、審査員がそのまま質問しても返せるbattlecardに圧縮します。</p>
        </div>
      )}
    </section>
  );
}

function DemoReceiptPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [receipt, setReceipt] = useState<JudgeDemoReceipt | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sealReceipt() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setReceipt((await response.json()) as JudgeDemoReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-receipt">
      <div className="receipt-heading">
        <div>
          <span className="eyebrow">Reviewer proof receipt</span>
          <h2>
            <BadgeCheck size={20} />
            Seal external proof
          </h2>
        </div>
        <button className="icon-button" onClick={sealReceipt} disabled={loading} title="外部レビュー用receiptを発行">
          <ClipboardCheck size={17} />
          {loading ? "Sealing" : "Seal receipt"}
        </button>
      </div>

      <div className="receipt-inputs">
        <label>
          <span>ProtoPedia URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Proof receipt request failed: {error}</p>}

      {receipt ? (
        <div className="receipt-body">
          <div className="receipt-summary">
            <div>
              <span className={cx("risk-chip", receipt.verdict === "sealed" ? "low" : receipt.verdict === "needs-external-submit" ? "medium" : "high")}>
                {receipt.verdict}
              </span>
              <h3>{receipt.headline}</h3>
              <p>{receipt.hardTruth}</p>
              <small>{new Date(receipt.generatedAt).toLocaleString()}</small>
            </div>
            <div className="receipt-score">
              <strong>{receipt.receiptScore}</strong>
              <span>receipt score</span>
            </div>
          </div>

          <div className="receipt-stamps">
            {receipt.stamps.map((stamp) => (
              <article key={stamp.id} className={stamp.status}>
                <div>
                  <strong>{stamp.label}</strong>
                  <span>{stamp.status}</span>
                </div>
                <b>{stamp.score}</b>
                <p>{stamp.proof}</p>
                <a href={stamp.url} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="receipt-route-lock">
            <div className="route-summary">
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    receipt.routeLock.readiness === "route-sealed" ? "low" : receipt.routeLock.readiness === "route-external-watch" ? "medium" : "high"
                  )}
                >
                  {receipt.routeLock.readiness}
                </span>
                <h3>Reviewer Route Lock</h3>
                <p>{receipt.routeLock.judgeLine}</p>
                <small>
                  sealed {receipt.routeLock.sealedCount} / watch {receipt.routeLock.watchCount} / missing {receipt.routeLock.missingCount} / internal{" "}
                  {receipt.routeLock.internalScore}
                </small>
              </div>
              <div className="route-score">
                <strong>{receipt.routeLock.routeScore}</strong>
                <span>route score</span>
              </div>
            </div>
            <div className="route-checks">
              {receipt.routeLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.proof}</p>
                  <a href={check.url} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="receipt-integrity-lock">
            <div className="integrity-summary">
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    receipt.integrityLock.readiness === "integrity-sealed"
                      ? "low"
                      : receipt.integrityLock.readiness === "integrity-external-watch"
                        ? "medium"
                        : "high"
                  )}
                >
                  {receipt.integrityLock.readiness}
                </span>
                <h3>Receipt Integrity Lock</h3>
                <p>{receipt.integrityLock.judgeLine}</p>
                <small>
                  sealed {receipt.integrityLock.sealedCount} / watch {receipt.integrityLock.watchCount} / missing {receipt.integrityLock.missingCount} /
                  digest {receipt.integrityLock.digestPreview}
                </small>
              </div>
              <div className="integrity-score">
                <strong>{receipt.integrityLock.integrityScore}</strong>
                <span>integrity score</span>
              </div>
            </div>
            <div className="integrity-checks">
              {receipt.integrityLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.proof}</p>
                  <small>{check.digestField}</small>
                  <a href={check.url} target="_blank" rel="noreferrer">
                    Replay <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="receipt-grid">
            <section>
              <h3>
                <Film size={15} />
                Recording order
              </h3>
              <ol className="receipt-order">
                {receipt.recordingOrder.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="receipt-actions">
                {receipt.actions.length > 0 ? (
                  receipt.actions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.priority}</strong>
                        <span>{action.id}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>Receipt sealed</strong>
                    <p>提出動画の検収票としてdigestを控えられます。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                Digest
              </h3>
              <div className="receipt-digest">
                <span>{receipt.digest.algorithm}</span>
                <strong>{receipt.digest.digest}</strong>
                <p>{receipt.digest.verification}</p>
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(receipt.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="receipt-empty">
          <BadgeCheck size={28} />
          <strong>Seal receiptで、審査導線、競合反論、編成判断、公開証拠、外部URL状態をsha256 digest付きで固定します。</strong>
          <p>動画URLとProtoPedia URLが未入力ならwatchとして残し、提出完了扱いにしません。</p>
        </div>
      )}
    </section>
  );
}

function JudgeBriefPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [brief, setBrief] = useState<JudgeBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildBrief() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBrief((await response.json()) as JudgeBrief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-brief">
      <div className="brief-heading">
        <div>
          <span className="eyebrow">Judge brief</span>
          <h2>
            <FileText size={20} />
            One-page judge briefing
          </h2>
        </div>
        <button className="icon-button" onClick={buildBrief} disabled={loading} title="審査員向けブリーフを生成">
          <BadgeCheck size={17} />
          {loading ? "Briefing" : "Build judge brief"}
        </button>
      </div>

      {error && <p className="error-text">Judge brief request failed: {error}</p>}

      {brief ? (
        <div className="brief-body">
          <div className="brief-summary">
            <div>
              <span className={cx("risk-chip", brief.readiness === "demo-ready" ? "low" : brief.readiness === "external-gaps" ? "medium" : "high")}>
                {brief.readiness === "demo-ready" ? "proof-ready" : brief.readiness}
              </span>
              <h3>{brief.title}</h3>
              <p>{brief.openingClaim}</p>
              <strong>{brief.oneLineVerdict}</strong>
              <small>{brief.hardTruth}</small>
            </div>
            <div className="brief-score">
              <strong>{brief.briefScore}</strong>
              <span>brief score</span>
            </div>
          </div>

          <div className="brief-metrics">
            {brief.keyMetrics.map((metric) => (
              <article key={metric.id} className={metric.tone}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="brief-grid">
            <section>
              <h3>
                <ShieldCheck size={15} />
                Proof ladder
              </h3>
              <div className="brief-proof">
                {brief.proofLadder.map((proof) => (
                  <article key={proof.id} className={proof.tone}>
                    <div>
                      <strong>{proof.label}</strong>
                      <span>{proof.tone}</span>
                    </div>
                    <p>{proof.proof}</p>
                    <a href={proof.url} target="_blank" rel="noreferrer">
                      Evidence <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                30-second route
              </h3>
              <ol className="brief-route">
                {brief.demoRoute.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h3>
                <AlertTriangle size={15} />
                Risks
              </h3>
              <div className="brief-risks">
                {brief.riskRegister.map((risk) => (
                  <article key={risk.id} className={risk.tone}>
                    <div>
                      <strong>{risk.label}</strong>
                      <span>{risk.tone}</span>
                    </div>
                    <p>{risk.action}</p>
                    <small>{risk.owner}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                Judge answers
              </h3>
              <div className="brief-answers">
                {brief.judgeAnswers.map((answer) => (
                  <article key={answer.id}>
                    <strong>{answer.label}</strong>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
              <h3>
                <ExternalLink size={15} />
                Links
              </h3>
              <div className="brief-links">
                {brief.links.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(brief.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="brief-empty">
          <FileText size={28} />
          <strong>Build judge briefで、競合差別化、MVP監査、証拠、30秒導線、残リスクを1枚に束ねます。</strong>
          <p>審査員が最初に読むビューとして、機能の多さを短い判断材料に圧縮します。</p>
        </div>
      )}
    </section>
  );
}

function AcceptanceMatrixPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [matrix, setMatrix] = useState<JudgeAcceptanceMatrix | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildMatrix() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/acceptance-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMatrix((await response.json()) as JudgeAcceptanceMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="acceptance-matrix" className="acceptance-matrix">
      <div className="acceptance-heading">
        <div>
          <span className="eyebrow">Judge acceptance matrix</span>
          <h2>
            <BadgeCheck size={20} />
            MVP acceptance table
          </h2>
        </div>
        <button className="icon-button" onClick={buildMatrix} disabled={loading} title="審査受入表を生成">
          <ClipboardCheck size={17} />
          {loading ? "Checking" : "Build acceptance matrix"}
        </button>
      </div>

      <div className="acceptance-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Acceptance matrix request failed: {error}</p>}

      {matrix ? (
        <div className="acceptance-body">
          <div className="acceptance-summary">
            <div>
              <span className={cx("risk-chip", matrix.verdict === "ready-to-submit" ? "low" : matrix.verdict === "accepted-with-external-gaps" ? "medium" : "high")}>
                {matrix.verdict}
              </span>
              <h3>{matrix.headline}</h3>
              <p>{matrix.hardTruth}</p>
              <small>{new Date(matrix.generatedAt).toLocaleString()}</small>
            </div>
            <div className="acceptance-score">
              <strong>{matrix.acceptanceScore}</strong>
              <span>acceptance score</span>
            </div>
          </div>

          <div className="acceptance-proof">
            {matrix.decisiveProof.map((proof) => (
              <article key={proof.id}>
                <span>{proof.label}</span>
                <strong>{proof.value}</strong>
                <p>{proof.proof}</p>
              </article>
            ))}
          </div>

          <div className="acceptance-rows">
            {matrix.rows.map((row) => (
              <article key={row.id} className={row.status}>
                <div>
                  <span>{row.area}</span>
                  <strong>{row.label}</strong>
                  <b>{row.score}</b>
                </div>
                <p>{row.requirement}</p>
                <small>{row.evidence}</small>
                <a href={row.proofUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="acceptance-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="acceptance-actions">
                {matrix.nextActions.length > 0 ? (
                  matrix.nextActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.id}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.owner} / {action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>All rows accepted</strong>
                    <p>提出前の受入表としてそのまま見せられます。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                Digest
              </h3>
              <div className="acceptance-digest">
                <span>{matrix.digest.algorithm}</span>
                <strong>{matrix.digest.digest}</strong>
                <p>{matrix.digest.verification}</p>
              </div>
              <h3>
                <Terminal size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(matrix.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="acceptance-empty">
          <BadgeCheck size={28} />
          <strong>Build acceptance matrixで、必須技術、審査5項目、公開証拠、提出物をaccepted/watch/blockedの受入表にします。</strong>
          <p>機能一覧ではなく、審査員が検収できる合否表としてMVP状態を説明します。</p>
        </div>
      )}
    </section>
  );
}

function AutonomyLedgerPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [ledger, setLedger] = useState<AutonomyLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildLedger() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/autonomy-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLedger((await response.json()) as AutonomyLedger);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="autonomy-ledger">
      <div className="ledger-heading">
        <div>
          <span className="eyebrow">Agent centrality</span>
          <h2>
            <Network size={20} />
            Autonomy Ledger
          </h2>
        </div>
        <button className="icon-button" onClick={buildLedger} disabled={loading} title="自律性台帳を生成">
          <GitBranch size={17} />
          {loading ? "Building" : "Build autonomy ledger"}
        </button>
      </div>

      {error && <p className="error-text">Autonomy ledger request failed: {error}</p>}

      {ledger ? (
        <div className="ledger-body">
          <div className="ledger-summary">
            <div>
              <span className={cx("risk-chip", ledger.verdict === "agent-led" ? "low" : ledger.verdict === "agent-led-with-external-gaps" ? "medium" : "high")}>
                {ledger.verdict}
              </span>
              <h3>{ledger.autonomyClaim}</h3>
              <p>{ledger.summary}</p>
            </div>
            <div className="ledger-score">
              <strong>{ledger.ledgerScore}</strong>
              <span>ledger score</span>
            </div>
          </div>

          <div className="ledger-metrics">
            {ledger.metrics.map((metric) => (
              <article key={metric.id} className={metric.status}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>

          <div className="ledger-chain">
            {ledger.chain.map((event) => (
              <article key={event.id} className={event.status}>
                <div>
                  <span>{event.phase}</span>
                  <strong>{event.actor}</strong>
                </div>
                <p>{event.decision}</p>
                <small>{event.action}</small>
                <b>{event.verifier}</b>
                <a href={event.endpoint} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="ledger-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Handoffs
              </h3>
              <div className="ledger-handoffs">
                {ledger.handoffs.map((handoff) => (
                  <article key={handoff.id} className={handoff.status}>
                    <div>
                      <strong>{handoff.agentName}</strong>
                      <span>{handoff.status}</span>
                    </div>
                    <p>{handoff.scope}</p>
                    <small>{handoff.acceptance}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                Judge challenges
              </h3>
              <div className="ledger-challenges">
                {ledger.challengeAnswers.map((challenge) => (
                  <article key={challenge.id}>
                    <strong>{challenge.challenge}</strong>
                    <p>{challenge.answer}</p>
                    <small>{challenge.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Receipt
              </h3>
              <pre>{JSON.stringify({ ...ledger.receipt, a2aPayload: ledger.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="ledger-empty">
          <Network size={28} />
          <strong>Build autonomy ledgerで、AIの判断、契約、A2A委任、検証、運用、提出を1本の台帳にします。</strong>
          <p>審査基準の「AIエージェントが価値の中心」を、主張ではなく検収可能なログとして見せます。</p>
        </div>
      )}
    </section>
  );
}

function AgentTaskBoardPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [board, setBoard] = useState<AgentTaskBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildTaskBoard() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/task-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setBoard((await response.json()) as AgentTaskBoard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="task-board">
      <div className="task-heading">
        <div>
          <span className="eyebrow">A2A delegation</span>
          <h2>
            <Workflow size={20} />
            Agent Task Board
          </h2>
        </div>
        <button className="icon-button" onClick={buildTaskBoard} disabled={loading} title="A2A仕事票を生成">
          <ClipboardCheck size={17} />
          {loading ? "Building" : "Build task board"}
        </button>
      </div>

      {error && <p className="error-text">Task board request failed: {error}</p>}

      {board ? (
        <div className="task-body">
          <div className="task-summary">
            <div>
              <span className={cx("risk-chip", board.readiness === "delegation-ready" ? "low" : board.readiness === "watch-verification" ? "medium" : "high")}>
                {board.readiness}
              </span>
              <h3>{board.headline}</h3>
              <p>{board.hardTruth}</p>
            </div>
            <div className="task-score">
              <strong>{board.taskScore}</strong>
              <span>task score</span>
            </div>
          </div>

          <div className="task-orders">
            {board.workOrders.map((order) => (
              <article key={order.id} className={order.status}>
                <div className="task-order-top">
                  <span>{order.phase}</span>
                  <strong>{order.agentName}</strong>
                  <b>{order.status}</b>
                </div>
                <p>{order.objective}</p>
                <div className="task-acceptance">
                  {order.acceptance.slice(0, 3).map((item) => (
                    <small key={item}>{item}</small>
                  ))}
                </div>
                <div className="task-proof-row">
                  <code>{order.verifier}</code>
                  <a href={order.proofUrl} target="_blank" rel="noreferrer">
                    Proof <ExternalLink size={13} />
                  </a>
                </div>
                <em>{order.nextAction}</em>
              </article>
            ))}
          </div>

          <div className="task-grid">
            <section>
              <h3>
                <GitBranch size={15} />
                Execution order
              </h3>
              <ol className="task-list">
                {board.executionOrder.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <BadgeCheck size={15} />
                Verification queue
              </h3>
              <div className="task-verifications">
                {board.verifications.map((verification) => (
                  <article key={verification.id} className={verification.status}>
                    <div>
                      <strong>{verification.label}</strong>
                      <span>{verification.status}</span>
                    </div>
                    <code>{verification.command}</code>
                    <small>{verification.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                A2A receipt
              </h3>
              <pre>{JSON.stringify({ receipt: board.receipt, a2aPayload: board.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="task-empty">
          <Workflow size={28} />
          <strong>Build task boardで、選んだAIへ渡す仕事票、受入条件、証拠URLをA2A形式に束ねます。</strong>
          <p>AIエージェント中心性を、分析結果ではなく委任と検収の実行面として見せます。</p>
        </div>
      )}
    </section>
  );
}

function SecurityReviewPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [review, setReview] = useState<SecurityReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSecurityReview() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/security-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setReview((await response.json()) as SecurityReview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="security-review">
      <div className="security-heading">
        <div>
          <span className="eyebrow">Trust boundary</span>
          <h2>
            <ShieldCheck size={20} />
            Security Sentinel Review
          </h2>
        </div>
        <button className="icon-button" onClick={runSecurityReview} disabled={loading} title="公開デモの安全境界を監査">
          <ShieldCheck size={17} />
          {loading ? "Reviewing" : "Run security review"}
        </button>
      </div>

      {error && <p className="error-text">Security review request failed: {error}</p>}

      {review ? (
        <div className="security-body">
          <div className="security-summary">
            <div>
              <span className={cx("risk-chip", review.posture === "guarded" ? "low" : review.posture === "watch" ? "medium" : "high")}>
                {review.posture}
              </span>
              <h3>{review.verdict}</h3>
              <p>{review.hardTruth}</p>
            </div>
            <div className="security-score">
              <strong>{review.securityScore}</strong>
              <span>security score</span>
            </div>
          </div>

          <div className="security-controls">
            {review.controls.map((control) => (
              <article key={control.id} className={control.status}>
                <div>
                  <strong>{control.label}</strong>
                  <span>{control.status}</span>
                </div>
                <p>{control.evidence}</p>
                <small>{control.action}</small>
              </article>
            ))}
          </div>

          <div className="security-grid">
            <section>
              <h3>
                <Network size={15} />
                Trust boundaries
              </h3>
              <div className="security-boundaries">
                {review.boundaries.map((boundary) => (
                  <article key={boundary.id}>
                    <span>
                      {boundary.from}
                      {" -> "}
                      {boundary.to}
                    </span>
                    <strong>{boundary.guardrail}</strong>
                    <p>{boundary.risk}</p>
                    <small>{boundary.evidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Threats
              </h3>
              <div className="security-threats">
                {review.threats.map((threat) => (
                  <article key={threat.id} className={threat.severity}>
                    <div>
                      <strong>{threat.threat}</strong>
                      <span>{threat.severity}</span>
                    </div>
                    <p>{threat.mitigation}</p>
                    <small>{threat.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Judge answers
              </h3>
              <div className="security-answers">
                {review.judgeAnswers.map((answer) => (
                  <article key={answer.id}>
                    <strong>{answer.question}</strong>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
              {review.nextSecurityHire && (
                <div className="security-next">
                  <span>Next security hire</span>
                  <strong>{review.nextSecurityHire.name}</strong>
                  <p>{review.nextSecurityHire.reason}</p>
                </div>
              )}
              <pre>{JSON.stringify({ runbook: review.runbookCommands, a2aPayload: review.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="security-empty">
          <ShieldCheck size={28} />
          <strong>Run security reviewで、Secret、IP allowlist、入力制限、A2A信頼境界、CIを審査用の証拠にします。</strong>
          <p>公開デモの安全性を、口頭ではなくSecurity Sentinelの監査ログとして見せます。</p>
        </div>
      )}
    </section>
  );
}

function ImpactCasePanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [impact, setImpact] = useState<ImpactCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runImpactCase() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/impact-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setImpact((await response.json()) as ImpactCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="impact-case">
      <div className="impact-heading">
        <div>
          <span className="eyebrow">Practical value</span>
          <h2>
            <TrendingUp size={20} />
            Impact Case
          </h2>
        </div>
        <button className="icon-button" onClick={runImpactCase} disabled={loading} title="実用性と体験価値を定量化">
          <Activity size={17} />
          {loading ? "Quantifying" : "Run impact case"}
        </button>
      </div>

      {error && <p className="error-text">Impact case request failed: {error}</p>}

      {impact ? (
        <div className="impact-body">
          <div className="impact-summary">
            <div>
              <span className={cx("risk-chip", impact.posture === "pilot-ready" ? "low" : impact.posture === "needs-pilot-proof" ? "medium" : "high")}>
                {impact.posture}
              </span>
              <h3>{impact.verdict}</h3>
              <p>{impact.hardTruth}</p>
            </div>
            <div className="impact-score">
              <strong>{impact.impactScore}</strong>
              <span>impact score</span>
            </div>
          </div>

          <div className="impact-metrics">
            {impact.metrics.map((metric) => (
              <article key={metric.id} className={metric.direction}>
                <div>
                  <strong>{metric.label}</strong>
                  <span>{metric.delta > 0 ? "+" : ""}{metric.delta}</span>
                </div>
                <p>{metric.before} {"->"} {metric.after} {metric.unit}</p>
                <small>{metric.evidence}</small>
              </article>
            ))}
          </div>

          <div className="impact-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Users and KPIs
              </h3>
              <div className="impact-personas">
                {impact.personas.map((persona) => (
                  <article key={persona.id}>
                    <div>
                      <strong>{persona.persona}</strong>
                      <span>{persona.kpi}</span>
                    </div>
                    <p>{persona.pain}</p>
                    <small>{persona.workflowWin}</small>
                    <b>{persona.proof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Before / After workflow
              </h3>
              <div className="impact-workflow">
                {impact.workflow.map((step) => (
                  <article key={step.id}>
                    <span>{step.phase}</span>
                    <strong>{step.owner}</strong>
                    <p>{step.before}</p>
                    <small>{step.after}</small>
                    <b>{step.evidence}</b>
                  </article>
                ))}
              </div>
              <h3>
                <Rocket size={15} />
                Adoption plan
              </h3>
              <div className="impact-adoption">
                {impact.adoptionPlan.map((step) => (
                  <article key={step.id}>
                    <strong>{step.horizon}</strong>
                    <p>{step.action}</p>
                    <small>{step.acceptance}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Risks and judge answers
              </h3>
              <div className="impact-risks">
                {impact.risks.map((risk) => (
                  <article key={risk.id} className={risk.severity}>
                    <div>
                      <strong>{risk.label}</strong>
                      <span>{risk.severity}</span>
                    </div>
                    <p>{risk.mitigation}</p>
                  </article>
                ))}
              </div>
              <div className="impact-answers">
                {impact.judgeAnswers.map((answer) => (
                  <article key={answer.id}>
                    <strong>{answer.question}</strong>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
              {impact.nextImpactHire && (
                <div className="impact-next">
                  <span>Next impact hire</span>
                  <strong>{impact.nextImpactHire.name}</strong>
                  <p>{impact.nextImpactHire.reason}</p>
                </div>
              )}
              <pre>{JSON.stringify(impact.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="impact-empty">
          <TrendingUp size={28} />
          <strong>Run impact caseで、対象ユーザー、時間短縮、提出信頼度、運用リスク、導入計画を定量化します。</strong>
          <p>「面白い」から「現場で何がどれだけ良くなるか」へ、審査員の実用性質問に答える証拠へ変換します。</p>
        </div>
      )}
    </section>
  );
}

function PilotEconomicsPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [economics, setEconomics] = useState<PilotEconomics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPilotEconomics() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/pilot-economics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEconomics((await response.json()) as PilotEconomics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="pilot-economics" className="pilot-economics">
      <div className="economics-heading">
        <div>
          <span className="eyebrow">Buyer proof</span>
          <h2>
            <Coins size={20} />
            Pilot Economics
          </h2>
        </div>
        <button className="icon-button" onClick={runPilotEconomics} disabled={loading} title="導入費用と回収仮説を検証">
          <Activity size={17} />
          {loading ? "Calculating" : "Build pilot economics"}
        </button>
      </div>

      {error && <p className="error-text">Pilot economics request failed: {error}</p>}

      {economics ? (
        <div className="economics-body">
          <div className="economics-summary">
            <div>
              <span
                className={cx(
                  "risk-chip",
                  economics.posture === "investment-ready" ? "low" : economics.posture === "needs-pilot-proof" ? "medium" : "high"
                )}
              >
                {economics.posture}
              </span>
              <h3>{economics.verdict}</h3>
              <p>{economics.hardTruth}</p>
            </div>
            <div className="economics-score">
              <strong>{economics.economicsScore}</strong>
              <span>economics score</span>
            </div>
          </div>

          <div className="economics-evidence-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    economics.evidenceLock.readiness === "buyer-ready"
                      ? "low"
                      : economics.evidenceLock.readiness === "blocked"
                        ? "high"
                        : "medium"
                  )}
                >
                  {economics.evidenceLock.readiness}
                </span>
                <strong>{economics.evidenceLock.lockScore}</strong>
              </div>
              <h3>Pilot Evidence Lock</h3>
              <p>{economics.evidenceLock.valueClaim}</p>
              <small>{economics.evidenceLock.targetBuyer}</small>
            </section>
            <div>
              {economics.evidenceLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                  <b>{check.evidenceRoute}</b>
                </article>
              ))}
            </div>
          </div>

          <div className="economics-unit">
            <article>
              <span>Monthly value</span>
              <strong>{yen(economics.unitEconomics.monthlyValueYen)}</strong>
              <p>{economics.unitEconomics.savedHoursPerCycle}h saved per cycle at {yen(economics.unitEconomics.assumedHourlyCostYen)} / h</p>
            </article>
            <article>
              <span>Pilot cost</span>
              <strong>{yen(economics.unitEconomics.pilotCostYen)}</strong>
              <p>Contract Desk scope, selected AI budget, and acceptance overhead.</p>
            </article>
            <article>
              <span>Payback</span>
              <strong>{economics.unitEconomics.paybackDays} days</strong>
              <p>Conservative pilot model; not a guaranteed financial forecast.</p>
            </article>
            <article>
              <span>Confidence</span>
              <strong>{economics.unitEconomics.confidenceScore}</strong>
              <p>Impact, User Pilot, Contract, Ops, Security, and judge criteria.</p>
            </article>
          </div>

          <div className="economics-metrics">
            {economics.metrics.map((metric) => (
              <article key={metric.id} className={metric.status}>
                <span>{metric.status}</span>
                <strong>{metric.label}</strong>
                <p>
                  {metric.unit === "yen" ? yen(metric.value) : metric.value} {metric.unit !== "yen" ? metric.unit : ""}
                </p>
                <small>{metric.evidence}</small>
              </article>
            ))}
          </div>

          <div className="economics-grid">
            <section>
              <h3>
                <Coins size={15} />
                Pricing lanes
              </h3>
              <div className="economics-pricing">
                {economics.pricingLanes.map((lane) => (
                  <article key={lane.id} className={lane.status}>
                    <div>
                      <strong>{lane.label}</strong>
                      <span>{yen(lane.priceYen)}</span>
                    </div>
                    <p>{lane.targetBuyer}</p>
                    <small>{lane.acceptance}</small>
                    <b>{lane.includes.join(" / ")}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Rocket size={15} />
                Pilot plan
              </h3>
              <div className="economics-plan">
                {economics.pilotPlan.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.horizon}</strong>
                      <span>{step.status}</span>
                    </div>
                    <p>{step.action}</p>
                    <small>{step.successMetric}</small>
                    <b>{step.proof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Buyer objections
              </h3>
              <div className="economics-objections">
                {economics.buyerObjections.map((objection) => (
                  <article key={objection.id} className={objection.status}>
                    <div>
                      <strong>{objection.objection}</strong>
                      <span>{objection.status}</span>
                    </div>
                    <p>{objection.answer}</p>
                    <small>{objection.evidence}</small>
                  </article>
                ))}
              </div>
              <div className="economics-actions">
                {economics.nextActions.map((action) => (
                  <article key={action.id} className={action.priority}>
                    <span>{action.priority}</span>
                    <strong>{action.owner}</strong>
                    <p>{action.action}</p>
                    <small>{action.proof}</small>
                  </article>
                ))}
              </div>
              <pre>{JSON.stringify(economics.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="economics-empty">
          <Coins size={28} />
          <strong>Build pilot economicsで、導入費用、回収日数、価格レーン、買い手の反論を投資判断の証拠にします。</strong>
          <p>Impact CaseのKPIを、審査員が「これなら試す理由がある」と判断できるpilot investment caseへ変換します。</p>
        </div>
      )}
    </section>
  );
}

function MarketIntelPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [intel, setIntel] = useState<MarketIntelReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runMarketIntel() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/market-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setIntel((await response.json()) as MarketIntelReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="market-intel">
      <div className="intel-heading">
        <div>
          <span className="eyebrow">Market intel</span>
          <h2>
            <Radar size={20} />
            Source-backed competitive moat
          </h2>
        </div>
        <button className="icon-button" onClick={runMarketIntel} disabled={loading} title="公式ソース付き競合分析を生成">
          <Crosshair size={17} />
          {loading ? "Reading" : "Run market intel"}
        </button>
      </div>

      {error && <p className="error-text">Market intel request failed: {error}</p>}

      {intel ? (
        <div className="intel-body">
          <div className="intel-summary">
            <div>
              <span className={cx("risk-chip", intel.status === "lead" ? "low" : intel.status === "parity" ? "medium" : "high")}>
                {intel.status}
              </span>
              <h3>{intel.headline}</h3>
              <p>{intel.thesis}</p>
              <small>
                reviewed {intel.sourceFreshness.reviewedAt} / {intel.sourceFreshness.freshCount} fresh sources /{" "}
                {intel.sourceFreshness.competitorCoveragePercent}% competitor coverage
              </small>
            </div>
            <div className="intel-score">
              <strong>{intel.marketScore}</strong>
              <span>market score</span>
            </div>
          </div>

          <div className="intel-source-lock">
            <div>
              <span
                className={cx(
                  "risk-chip",
                  intel.sourceProofLock.readiness === "source-lock-live"
                    ? "low"
                    : intel.sourceProofLock.readiness === "source-lock-blocked"
                      ? "high"
                      : "medium"
                )}
              >
                {intel.sourceProofLock.readiness}
              </span>
              <h3>
                <ShieldCheck size={16} />
                Source Freshness Lock
              </h3>
              <p>{intel.sourceProofLock.headline}</p>
              <small>{intel.sourceProofLock.hardTruth}</small>
            </div>
            <div className="intel-source-lock-score">
              <strong>{intel.sourceProofLock.score}</strong>
              <span>source lock</span>
              <small>
                {intel.sourceProofLock.passedCount} passed / {intel.sourceProofLock.failedCount} failed /{" "}
                {intel.sourceProofLock.uncheckedCount} unchecked
              </small>
            </div>
            <div className="intel-source-lock-probes">
              {intel.sourceProofLock.probes.slice(0, 6).map((probe) => (
                <article key={probe.id} className={probe.status}>
                  <div>
                    <strong>{probe.label}</strong>
                    <span>{probe.status}</span>
                  </div>
                  <p>{probe.evidence}</p>
                  <small>
                    {probe.statusCode ? `HTTP ${probe.statusCode}` : "no status"} /{" "}
                    {probe.latencyMs ? `${probe.latencyMs}ms` : "not timed"}
                  </small>
                </article>
              ))}
            </div>
          </div>

          <div className="intel-source-strip">
            {intel.sourceChecklist.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                {source.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>

          <div className="intel-grid">
            <section>
              <h3>
                <Crosshair size={15} />
                Competitor cuts
              </h3>
              <div className="intel-comparisons">
                {intel.comparisons.map((comparison) => (
                  <article key={comparison.id} className={comparison.threatLevel}>
                    <div>
                      <strong>{comparison.competitor}</strong>
                      <span>{comparison.threatLevel}</span>
                    </div>
                    <p>{comparison.theyWinAt}</p>
                    <small>{comparison.exposedGap}</small>
                    <em>{comparison.ourCounter}</em>
                    <b>{comparison.demoProof}</b>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Trophy size={15} />
                Judge answers
              </h3>
              <div className="intel-answers">
                {intel.judgeAnswers.map((answer) => (
                  <article key={answer.criterionId}>
                    <div>
                      <strong>{answer.label}</strong>
                      <span>{answer.score}</span>
                    </div>
                    <p>{answer.answer}</p>
                    <small>{answer.evidence}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Lightbulb size={15} />
                Moves
              </h3>
              <div className="intel-moves">
                {intel.moves.map((move) => (
                  <article key={move.id} className={move.priority}>
                    <div>
                      <strong>{move.owner}</strong>
                      <span>{move.priority}</span>
                    </div>
                    <p>{move.action}</p>
                    <small>{move.proof}</small>
                  </article>
                ))}
              </div>
              <h3>
                <FileText size={15} />
                Source ledger
              </h3>
              <div className="intel-ledger">
                {intel.sourceLedger.map((source) => (
                  <article key={source.id} className={source.freshness}>
                    <div>
                      <strong>{source.label}</strong>
                      <span>{source.freshness}</span>
                    </div>
                    <p>{source.currentSignal}</p>
                    <small>{source.judgeUse}</small>
                    <em>{source.competitorIds.length > 0 ? source.competitorIds.join(" / ") : "runtime context"}</em>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      Source <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(intel.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="intel-empty">
          <Radar size={28} />
          <strong>Run market intelで、公式ソース付き競合比較、差別化仮説、審査回答を生成します。</strong>
          <p>ADKやLangGraphと正面衝突せず、AI能力を調達する体験として勝つ理由を1画面にします。</p>
        </div>
      )}
    </section>
  );
}

function MvpAuditPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [audit, setAudit] = useState<MvpAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAudit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mvp-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setAudit((await response.json()) as MvpAuditReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mvp-audit">
      <div className="mvp-heading">
        <div>
          <span className="eyebrow">MVP audit</span>
          <h2>
            <Gauge size={20} />
            Hard-gate readiness check
          </h2>
        </div>
        <button className="icon-button" onClick={runAudit} disabled={loading} title="MVP監査を実行">
          <BadgeCheck size={17} />
          {loading ? "Auditing" : "Run MVP audit"}
        </button>
      </div>

      {error && <p className="error-text">MVP audit request failed: {error}</p>}

      {audit ? (
        <div className="mvp-body">
          <div className="mvp-summary">
            <div>
              <span className={cx("risk-chip", audit.band === "submission-ready" ? "low" : audit.band === "mvp-with-external-gaps" ? "medium" : "high")}>
                {audit.band}
              </span>
              <h3>{audit.verdict}</h3>
              <p>{audit.hardTruth}</p>
            </div>
            <div className="mvp-score">
              <strong>{audit.mvpScore}</strong>
              <span>MVP score</span>
            </div>
          </div>

          <div className="mvp-gates">
            {audit.gates.map((gate) => (
              <article key={gate.id} className={gate.status}>
                <div>
                  <strong>{gate.label}</strong>
                  <span>{gate.status}</span>
                </div>
                <p>{gate.evidence}</p>
                <small>{gate.nextAction}</small>
                {gate.url && (
                  <a href={gate.url} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="mvp-grid">
            <section>
              <h3>
                <Trophy size={15} />
                Judge lanes
              </h3>
              <div className="mvp-lanes">
                {audit.judgeLanes.map((lane) => (
                  <article key={lane.id} className={lane.status}>
                    <div>
                      <strong>{lane.label}</strong>
                      <span>{lane.score}</span>
                    </div>
                    <p>{lane.evidence}</p>
                    <small>{lane.nextAction}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                Blockers
              </h3>
              <div className="mvp-actions">
                {audit.blockers.length > 0 ? (
                  audit.blockers.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.label}</strong>
                        <span>{action.priority}</span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.owner} / {action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="later">
                    <div>
                      <strong>No blockers</strong>
                      <span>clear</span>
                    </div>
                    <p>ハードゲート上の未達はありません。</p>
                  </article>
                )}
              </div>
              <h3>
                <ExternalLink size={15} />
                Proof URLs
              </h3>
              <div className="mvp-links">
                {audit.proofUrls.map((url) => (
                  <a key={url.id} href={url.url} target="_blank" rel="noreferrer">
                    {url.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(audit.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="mvp-empty">
          <Gauge size={28} />
          <strong>Run MVP auditで、必須技術、審査5項目、DevOps証拠、提出3点をハードゲート判定します。</strong>
          <p>未発行のProtoPedia作品URLと動画URLは、合格扱いにせずwatchとして残します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionLaunchPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [gate, setGate] = useState<SubmissionLaunchGate | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runLaunchGate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submission-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setGate((await response.json()) as SubmissionLaunchGate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-launch">
      <div className="launch-heading">
        <div>
          <span className="eyebrow">Final launch gate</span>
          <h2>
            <ClipboardCheck size={20} />
            Submission Launch Gate
          </h2>
        </div>
        <button className="icon-button" onClick={runLaunchGate} disabled={loading} title="提出直前ゲートを検証">
          <BadgeCheck size={17} />
          {loading ? "Checking" : "Check launch gate"}
        </button>
      </div>

      <div className="launch-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Submission launch request failed: {error}</p>}

      {gate ? (
        <div className="launch-body">
          <div className="launch-summary">
            <div>
              <span className={cx("risk-chip", gate.readiness === "submit-ready" ? "low" : gate.readiness === "needs-external-urls" ? "medium" : "high")}>
                {gate.readiness}
              </span>
              <h3>{gate.verdict}</h3>
              <p>{gate.hardTruth}</p>
            </div>
            <div className="launch-score">
              <strong>{gate.launchScore}</strong>
              <span>launch score</span>
            </div>
          </div>

          <div className="launch-url-grid">
            {gate.urlStatuses.map((item) => (
              <article key={item.id} className={item.status}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.status}</span>
                </div>
                <p>{item.proof}</p>
                <small>{item.action}</small>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={13} />
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="launch-final-lock">
            <section>
              <span
                className={cx(
                  "risk-chip",
                  gate.finalSubmitLock.readiness === "findy-form-sealed"
                    ? "low"
                    : gate.finalSubmitLock.readiness === "external-url-watch"
                      ? "medium"
                      : "high"
                )}
              >
                {gate.finalSubmitLock.readiness}
              </span>
              <h3>
                <Rocket size={16} />
                Final Submit Lock
              </h3>
              <p>{gate.finalSubmitLock.operatorLine}</p>
              <small>deadline: {gate.finalSubmitLock.deadline}</small>
            </section>
            <div className="launch-final-score">
              <strong>{gate.finalSubmitLock.lockScore}</strong>
              <span>submit lock</span>
              <small>
                {gate.finalSubmitLock.readyCount} ready / {gate.finalSubmitLock.missingCount} missing / {gate.finalSubmitLock.invalidCount} invalid
              </small>
            </div>
            <div className="launch-final-checks">
              {gate.finalSubmitLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.target}</p>
                  <small>{check.value || check.proof}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="launch-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Final checklist
              </h3>
              <div className="launch-checklist">
                {gate.checklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <FileText size={15} />
                ProtoPedia compliance
              </h3>
              <div className="launch-compliance">
                {gate.protopediaCompliance.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                    <small>
                      {item.source}: {item.action}
                    </small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Copy actions
              </h3>
              <div className="launch-actions">
                {gate.copyActions.map((action) => (
                  <article key={action.id} className={action.status}>
                    <strong>{action.label}</strong>
                    <p>{action.target}</p>
                    <small>{action.value || "needs external URL"}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Submit packet
              </h3>
              <pre>{JSON.stringify({ submitPacket: gate.submitPacket, a2aPayload: gate.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="launch-empty">
          <ClipboardCheck size={28} />
          <strong>Check launch gateで、ProtoPedia作品URLと動画URLが揃った瞬間に提出可能かを判定します。</strong>
          <p>未入力や形式不正は提出完了扱いにせず、GitHub、Cloud Run、タグ、本文、CI、証拠receiptと一緒に最終確認します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionCloseoutPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [workbench, setWorkbench] = useState<SubmissionCloseoutWorkbench | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildCloseout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/submission-closeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setWorkbench((await response.json()) as SubmissionCloseoutWorkbench);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-closeout">
      <div className="closeout-heading">
        <div>
          <span className="eyebrow">Submission closeout</span>
          <h2>
            <Rocket size={20} />
            Final external workbench
          </h2>
        </div>
        <button className="icon-button" onClick={buildCloseout} disabled={loading} title="外部提出作業を順番付きで閉じる">
          <BadgeCheck size={17} />
          {loading ? "Closing" : "Build closeout"}
        </button>
      </div>

      <div className="closeout-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
      </div>

      {error && <p className="error-text">Submission closeout request failed: {error}</p>}

      {workbench ? (
        <div className="closeout-body">
          <div className="closeout-summary">
            <div>
              <span className={cx("risk-chip", workbench.readiness === "ready-to-submit" ? "low" : workbench.readiness === "needs-closeout" ? "medium" : "high")}>
                {workbench.readiness}
              </span>
              <h3>{workbench.headline}</h3>
              <p>{workbench.hardTruth}</p>
              <strong>
                Next: {workbench.nextAction.label} / {workbench.nextAction.status}
              </strong>
            </div>
            <div className="closeout-score">
              <strong>{workbench.closeoutScore}</strong>
              <span>closeout score</span>
            </div>
          </div>

          <Suspense fallback={<div className="deferred-panel-placeholder" aria-label="Loading final submission handoff" />}>
            <SubmissionCloseoutFinalHandoffPanel handoff={workbench.finalSubmitHandoff} />
          </Suspense>

          <div className="closeout-dry-run-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    workbench.dryRunLock.readiness === "submit-dry-run-sealed"
                      ? "low"
                      : workbench.dryRunLock.readiness === "submit-dry-run-ready"
                        ? "medium"
                        : "high"
                  )}
                >
                  {workbench.dryRunLock.readiness}
                </span>
                <strong>{workbench.dryRunLock.lockScore}</strong>
              </div>
              <h3>Submission Dry Run Lock</h3>
              <p>{workbench.dryRunLock.operatorLine}</p>
              <small>
                ready {workbench.dryRunLock.readyCount} / watch {workbench.dryRunLock.watchCount} / blocked {workbench.dryRunLock.blockedCount}
              </small>
            </section>
            <div>
              {workbench.dryRunLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                  <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="closeout-asset-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    workbench.assetLock.readiness === "assets-publish-ready"
                      ? "low"
                      : workbench.assetLock.readiness === "assets-external-watch"
                        ? "medium"
                        : "high"
                  )}
                >
                  {workbench.assetLock.readiness}
                </span>
                <strong>{workbench.assetLock.lockScore}</strong>
              </div>
              <h3>Submission Asset Lock</h3>
              <p>{workbench.assetLock.operatorLine}</p>
              <small>
                ready {workbench.assetLock.readyCount} / watch {workbench.assetLock.watchCount} / blocked {workbench.assetLock.blockedCount}
              </small>
            </section>
            <div>
              {workbench.assetLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                  <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="closeout-quality-lock">
            <section>
              <div>
                <span className={cx("risk-chip", workbench.protopediaQualityLock.readiness === "submit-page-ready" ? "low" : workbench.protopediaQualityLock.readiness === "copy-locked" ? "medium" : "high")}>
                  {workbench.protopediaQualityLock.readiness}
                </span>
                <strong>{workbench.protopediaQualityLock.qualityScore}</strong>
              </div>
              <h3>ProtoPedia Quality Lock</h3>
              <p>{workbench.protopediaQualityLock.headline}</p>
              <small>Required tag: {workbench.protopediaQualityLock.requiredTag}</small>
            </section>
            <div>
              {workbench.protopediaQualityLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="closeout-quality-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    workbench.protopediaPolicyLock.readiness === "publication-ready"
                      ? "low"
                      : workbench.protopediaPolicyLock.readiness === "prototype-copy-locked"
                        ? "medium"
                        : "high"
                  )}
                >
                  {workbench.protopediaPolicyLock.readiness}
                </span>
                <strong>{workbench.protopediaPolicyLock.policyScore}</strong>
              </div>
              <h3>ProtoPedia Policy Lock</h3>
              <p>{workbench.protopediaPolicyLock.headline}</p>
              <small>{workbench.protopediaPolicyLock.operatorLine}</small>
            </section>
            <div>
              {workbench.protopediaPolicyLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="closeout-video-lock">
            <section>
              <div>
                <span className={cx("risk-chip", workbench.videoProofLock.readiness === "video-url-ready" ? "low" : workbench.videoProofLock.readiness === "blocked-video-url" ? "high" : "medium")}>
                  {workbench.videoProofLock.readiness}
                </span>
                <strong>{workbench.videoProofLock.lockScore}</strong>
              </div>
              <h3>Video Proof Lock</h3>
              <p>{workbench.videoProofLock.voiceoverHook}</p>
              <small>
                {workbench.videoProofLock.targetDurationSeconds}s / {workbench.videoProofLock.openingFrame} {"->"} {workbench.videoProofLock.finalFrame}
              </small>
              <b>{workbench.videoProofLock.publishTarget}</b>
            </section>
            <div>
              {workbench.videoProofLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                  <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="closeout-work">
            {workbench.workItems.map((item) => (
              <article key={item.id} className={item.status}>
                <div>
                  <span>{item.priority}</span>
                  <strong>{item.label}</strong>
                  <b>{item.status}</b>
                </div>
                <p>{item.action}</p>
                <small>{item.proof}</small>
                <a href={item.endpoint} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="closeout-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Copy tray
              </h3>
              <div className="closeout-copy">
                {workbench.copyFields.slice(0, 5).map((field) => (
                  <article key={field.id} className={field.status}>
                    <div>
                      <strong>{field.label}</strong>
                      <span>{field.target}</span>
                    </div>
                    <pre>{field.value}</pre>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Video run
              </h3>
              <div className="closeout-video">
                {workbench.videoSteps.map((step) => (
                  <article key={step.id} className={step.status}>
                    <div>
                      <strong>{step.timeRange}</strong>
                      <span>{step.screen}</span>
                    </div>
                    <p>{step.narration}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Submit packet
              </h3>
              <pre>{JSON.stringify({ submitPacket: workbench.submitPacket, a2aPayload: workbench.a2aPayload }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="closeout-empty">
          <Rocket size={28} />
          <strong>Build closeoutで、ProtoPedia貼付、構成図、30秒動画、外部URL、最終提出フォームを順番付きの作業台にします。</strong>
          <p>URL未入力なら今やる作業として残し、URL形式が不正なら提出完了扱いにしません。</p>
        </div>
      )}
    </section>
  );
}

function WinAutopilotPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [run, setRun] = useState<WinningAutopilotRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAutopilot() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/win-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRun((await response.json()) as WinningAutopilotRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="win-autopilot" className="win-autopilot">
      <div className="autopilot-heading">
        <div>
          <span className="eyebrow">Win autopilot</span>
          <h2>
            <Rocket size={20} />
            One-click winning run
          </h2>
        </div>
        <button className="icon-button" onClick={runAutopilot} disabled={loading} title="優勝判定を一括実行">
          <Play size={17} />
          {loading ? "Running" : "Run win autopilot"}
        </button>
      </div>

      {error && <p className="error-text">Win autopilot request failed: {error}</p>}

      {run ? (
        <div className="autopilot-body">
          <div className="autopilot-summary">
            <div>
              <span className={cx("risk-chip", run.readiness === "finalist-ready" ? "low" : run.readiness === "external-gaps" ? "medium" : "high")}>
                {run.readiness}
              </span>
              <h3>{run.headline}</h3>
              <p>{run.summary}</p>
            </div>
            <div className="autopilot-score">
              <strong>{run.winScore}</strong>
              <span>win score</span>
            </div>
          </div>

          <div className="autopilot-lanes">
            {run.lanes.map((lane) => (
              <article key={lane.id} className={lane.status}>
                <div>
                  <strong>{lane.label}</strong>
                  <span>{lane.score}</span>
                </div>
                <p>{lane.proof}</p>
                <small>{lane.action}</small>
                <a href={lane.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="autopilot-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="autopilot-actions">
                {run.nextActions.map((action) => (
                  <article key={action.id} className={action.priority}>
                    <div>
                      <strong>{action.label}</strong>
                      <span>{action.priority}</span>
                    </div>
                    <p>{action.command}</p>
                    <small>{action.owner} / {action.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Autonomy trace
              </h3>
              <ol className="autopilot-trace">
                {run.autonomyTrace.map((trace) => (
                  <li key={trace.phase}>
                    <span>{trace.phase}</span>
                    <strong>{trace.actor}</strong>
                    <p>{trace.decision}</p>
                    <small>{trace.proof}</small>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Evidence deck
              </h3>
              <div className="autopilot-links">
                {run.evidenceDeck.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.proof}>
                    {item.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
              <h3>
                <Terminal size={15} />
                Judge narrative
              </h3>
              <pre>{run.judgeNarrative}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="autopilot-empty">
          <Rocket size={28} />
          <strong>Run win autopilotで、競合/SWOT、証拠、最終候補判定、提出、運用を一括判定します。</strong>
          <p>審査員が見るべき順番と、提出前に残る外部作業を1回で出します。</p>
        </div>
      )}
    </section>
  );
}

function SubmissionDossierPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [dossier, setDossier] = useState<SubmissionDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buildDossier() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDossier((await response.json()) as SubmissionDossier);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="submission-dossier">
      <div className="dossier-heading">
        <div>
          <span className="eyebrow">Submission dossier</span>
          <h2>
            <FileText size={20} />
            Final paste-and-record packet
          </h2>
        </div>
        <button className="icon-button" onClick={buildDossier} disabled={loading} title="提出ドシエを生成">
          <ClipboardCheck size={17} />
          {loading ? "Packaging" : "Run submission dossier"}
        </button>
      </div>

      {error && <p className="error-text">Submission dossier request failed: {error}</p>}

      {dossier ? (
        <div className="dossier-body">
          <div className="dossier-summary">
            <div>
              <span className={cx("risk-chip", dossier.readiness === "ready-to-submit" ? "low" : "medium")}>{dossier.readiness}</span>
              <h3>{dossier.title}</h3>
              <p>{dossier.executiveMemo}</p>
            </div>
            <div className="dossier-score">
              <strong>{dossier.dossierScore}</strong>
              <span>dossier score</span>
            </div>
          </div>

          <div className="dossier-quality-lock">
            <section>
              <div>
                <span className={cx("risk-chip", dossier.handoffPacket.qualityLock.readiness === "submit-page-ready" ? "low" : dossier.handoffPacket.qualityLock.readiness === "copy-locked" ? "medium" : "high")}>
                  {dossier.handoffPacket.qualityLock.readiness}
                </span>
                <strong>{dossier.handoffPacket.qualityLock.qualityScore}</strong>
              </div>
              <h3>ProtoPedia Quality Lock</h3>
              <p>{dossier.handoffPacket.qualityLock.headline}</p>
              <small>{dossier.handoffPacket.qualityLock.pasteOrder.join(" -> ")}</small>
            </section>
            <div>
              {dossier.handoffPacket.qualityLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="dossier-handoff">
            <section>
              <h3>
                <ExternalLink size={15} />
                Submit fields
              </h3>
              <div>
                {dossier.handoffPacket.submitFields.map((field) => (
                  <article key={field.id} className={field.status}>
                    <strong>{field.label}</strong>
                    <span>{field.status}</span>
                    <p>{field.target}</p>
                    <small>{field.value || field.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Video chapters
              </h3>
              <div>
                {dossier.handoffPacket.videoChapters.slice(0, 5).map((chapter) => (
                  <article key={chapter.id} className={chapter.status}>
                    <strong>{chapter.timeRange}</strong>
                    <span>{chapter.screen}</span>
                    <p>{chapter.narration}</p>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Workflow size={15} />
                Architecture pack
              </h3>
              <div>
                <article className={dossier.handoffPacket.architecturePack.readiness === "submission-ready" ? "ready" : "watch"}>
                  <strong>{dossier.handoffPacket.architecturePack.architectureScore} architecture score</strong>
                  <span>{dossier.handoffPacket.architecturePack.readiness}</span>
                  <p>{dossier.handoffPacket.architecturePack.headline}</p>
                  <small>{dossier.handoffPacket.architecturePack.diagramUrl}</small>
                </article>
                {dossier.handoffPacket.architecturePack.requirements.slice(0, 3).map((requirement) => (
                  <article key={requirement.id} className={requirement.status}>
                    <strong>{requirement.label}</strong>
                    <span>{requirement.status}</span>
                    <p>{requirement.evidence}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {dossier.handoffPacket.competitiveReceipts.length > 0 && (
            <div className="dossier-competitive">
              <h3>
                <Crosshair size={15} />
                Competitive objection receipts
              </h3>
              <div>
                {dossier.handoffPacket.competitiveReceipts.map((receipt) => (
                  <article key={receipt.id} className={receipt.status}>
                    <div>
                      <strong>{receipt.competitor}</strong>
                      <span>{receipt.status}</span>
                    </div>
                    <p>{receipt.objection}</p>
                    <small>{receipt.protopediaLine}</small>
                    <b>{receipt.proofRoute}</b>
                  </article>
                ))}
              </div>
            </div>
          )}

          {dossier.handoffPacket.buyerValueReceipts.length > 0 && (
            <div className="dossier-buyer-value">
              <h3>
                <Coins size={15} />
                Buyer value receipts
              </h3>
              <div>
                {dossier.handoffPacket.buyerValueReceipts.map((receipt) => (
                  <article key={receipt.id} className={receipt.status}>
                    <div>
                      <strong>{receipt.label}</strong>
                      <span>{receipt.status}</span>
                    </div>
                    <p>{receipt.claim}</p>
                    <small>{receipt.metric}</small>
                    <b>{receipt.proof}</b>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="dossier-copy">
            {dossier.copyBlocks.map((block) => (
              <article key={block.id} className={block.status}>
                <div>
                  <strong>{block.label}</strong>
                  <span>{block.target}</span>
                </div>
                <pre>{block.value}</pre>
              </article>
            ))}
          </div>

          <div className="dossier-grid">
            <section>
              <h3>
                <ExternalLink size={15} />
                Submission links
              </h3>
              <div className="dossier-links">
                {dossier.links.map((link) => (
                  <article key={link.id} className={link.status}>
                    <div>
                      <strong>{link.label}</strong>
                      <span>{link.status}</span>
                    </div>
                    <p>{link.proof}</p>
                    {link.url && (
                      <a href={link.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording plan
              </h3>
              <ol className="dossier-recording">
                {dossier.recordingPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h3>
                <ClipboardCheck size={15} />
                Final checks
              </h3>
              <div className="dossier-checks">
                {dossier.finalChecks.map((check) => (
                  <article key={check.id} className={check.status}>
                    <div>
                      <strong>{check.label}</strong>
                      <span>{check.status}</span>
                    </div>
                    <p>{check.action}</p>
                    <small>{check.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Markdown dossier
              </h3>
              <pre>{dossier.markdown}</pre>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(dossier.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="dossier-empty">
          <FileText size={28} />
          <strong>Run submission dossierで、ProtoPedia本文、競合反論、買い手価値、動画録画順、提出リンク、最終チェックを1つに束ねます。</strong>
          <p>外部提出URLが未発行でも、貼る本文と録る順番を固定できます。</p>
        </div>
      )}
    </section>
  );
}

function DemoRunwayPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [runway, setRunway] = useState<DemoRunway | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runDemo() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRunway((await response.json()) as DemoRunway);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="demo-runway">
      <div className="demo-heading">
        <div>
          <span className="eyebrow">Reviewer proof route</span>
          <h2>
            <Workflow size={20} />
            30-second proof route
          </h2>
        </div>
        <button className="icon-button" onClick={runDemo} disabled={loading} title="30秒レビュー導線を生成">
          <Play size={17} />
          {loading ? "Routing" : "Build proof route"}
        </button>
      </div>

      {error && <p className="error-text">Proof route request failed: {error}</p>}

      {runway ? (
        <div className="demo-body">
          <div className="demo-summary">
            <div>
              <span className={cx("risk-chip", runway.readiness === "recording-ready" ? "low" : "medium")}>{runway.readiness}</span>
              <h3>{runway.headline}</h3>
              <p>{runway.summary}</p>
            </div>
            <div className="demo-score">
              <strong>{runway.demoScore}</strong>
              <span>{runway.totalSeconds}s route</span>
            </div>
          </div>

          <div className="demo-steps">
            {runway.steps.map((step) => (
              <article key={step.id} className={step.status}>
                <div>
                  <span>{step.timeRange}</span>
                  <strong>{step.screen}</strong>
                </div>
                <p>{step.action}</p>
                <small>{step.narration}</small>
                <a href={step.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          {runway.competitiveProofReel.length > 0 && (
            <div className="demo-competitive">
              <h3>
                <Crosshair size={15} />
                Competitive proof reel
              </h3>
              <div>
                {runway.competitiveProofReel.map((receipt) => (
                  <article key={receipt.id} className={receipt.status}>
                    <div>
                      <strong>{receipt.competitor}</strong>
                      <span>{receipt.status}</span>
                    </div>
                    <p>{receipt.objection}</p>
                    <small>{receipt.swotSignal}</small>
                    <b>{receipt.proofRoute}</b>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="demo-grid">
            <section>
              <h3>
                <ExternalLink size={15} />
                Proof links
              </h3>
              <div className="demo-links">
                {runway.proofLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" title={link.proof}>
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording cues
              </h3>
              <ol className="demo-cues">
                {runway.recordingCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <AlertTriangle size={15} />
                External risks
              </h3>
              <div className="demo-risks">
                {runway.risks.length > 0 ? (
                  runway.risks.map((risk) => (
                    <article key={risk.id} className={risk.severity}>
                      <div>
                        <strong>{risk.label}</strong>
                        <span>{risk.severity}</span>
                      </div>
                      <p>{risk.mitigation}</p>
                    </article>
                  ))
                ) : (
                  <article className="ready">
                    <div>
                      <strong>Ready to record</strong>
                      <span>ready</span>
                    </div>
                    <p>外部URLの残リスクはありません。</p>
                  </article>
                )}
              </div>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(runway.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="demo-empty">
          <Workflow size={28} />
          <strong>外部レビュー担当者が30秒で見る順番、証拠リンク、録画キューを生成します。</strong>
          <p>ばらばらの証拠を、提出動画と初見レビューの一本道にします。</p>
        </div>
      )}
    </section>
  );
}

function JudgeProofBundle({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [proof, setProof] = useState<JudgeProof | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runProof() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setProof((await response.json()) as JudgeProof);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="proof-bundle">
      <div className="proof-heading">
        <div>
          <span className="eyebrow">Judge proof</span>
          <h2>
            <Trophy size={20} />
            One-click evidence bundle
          </h2>
        </div>
        <button className="icon-button" onClick={runProof} disabled={loading} title="審査証拠を生成">
          <Activity size={17} />
          {loading ? "Running" : "Run judge proof"}
        </button>
      </div>

      {error && <p className="error-text">Judge proof request failed: {error}</p>}

      {proof ? (
        <div className="proof-body">
          <div className="proof-summary">
            <div>
              <span className="event-pill">
                <Sparkles size={15} />
                {proof.gemini.source} / {proof.gemini.model}
              </span>
              <h3>{proof.summary}</h3>
              <p>{proof.gemini.executiveSummary}</p>
            </div>
            <div className="proof-score">
              <strong>{proof.overallScore}</strong>
              <span>overall proof</span>
            </div>
          </div>

          <div className="proof-gemini-lock">
            <div className="proof-gemini-copy">
              <span
                className={cx(
                  "risk-chip",
                  proof.geminiProofLock.readiness === "gemini-live" ? "low" : proof.geminiProofLock.readiness === "fallback-visible" ? "medium" : "high"
                )}
              >
                {proof.geminiProofLock.readiness}
              </span>
              <h3>
                <Sparkles size={16} />
                Gemini Proof Lock
              </h3>
              <p>{proof.geminiProofLock.headline}</p>
              <strong>{proof.geminiProofLock.judgeAnswer}</strong>
              <small>
                {proof.geminiProofLock.source} / {proof.geminiProofLock.model}
              </small>
            </div>
            <div className="proof-gemini-score">
              <strong>{proof.geminiProofLock.score}</strong>
              <span>gemini proof</span>
            </div>
            <div className="proof-gemini-checks">
              {proof.geminiProofLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.evidence}</p>
                  <small>{check.acceptance}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="proof-gemini-lock proof-usability-lock">
            <div className="proof-gemini-copy">
              <span
                className={cx(
                  "risk-chip",
                  proof.usabilityProofLock.readiness === "usability-locked"
                    ? "low"
                    : proof.usabilityProofLock.readiness === "usability-budget-watch"
                      ? "medium"
                      : "high"
                )}
              >
                {proof.usabilityProofLock.readiness}
              </span>
              <h3>
                <Gauge size={16} />
                Usability Proof Lock
              </h3>
              <p>{proof.usabilityProofLock.headline}</p>
              <strong>{proof.usabilityProofLock.judgeAnswer}</strong>
              <small>
                first click: {proof.usabilityProofLock.firstClick}
                {proof.usabilityProofLock.nextUxAgent ? ` / next UX: ${proof.usabilityProofLock.nextUxAgent}` : ""}
              </small>
            </div>
            <div className="proof-gemini-score">
              <strong>{proof.usabilityProofLock.score}</strong>
              <span>ux proof</span>
              <small>+{proof.usabilityProofLock.budgetGap} gap</small>
            </div>
            <div className="proof-gemini-checks">
              {proof.usabilityProofLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.evidence}</p>
                  <small>{check.acceptance}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="proof-score-grid">
            <StrategyMeter label="AI" value={proof.scores.ai} />
            <StrategyMeter label="Cloud Run" value={proof.scores.cloudRun} />
            <StrategyMeter label="A2A" value={proof.scores.a2a} />
            <StrategyMeter label="Strategy" value={proof.scores.strategy} />
            <StrategyMeter label="Usability" value={proof.scores.usability} />
            <StrategyMeter label="DevOps" value={proof.scores.devops} />
            <StrategyMeter label="CI" value={proof.scores.ci} />
            <StrategyMeter label="Submission" value={proof.scores.submission} />
          </div>

          <div className="proof-grid">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Evidence
              </h3>
              <div className="proof-items">
                {proof.proofItems.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.evidence}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Live Links
              </h3>
              <div className="proof-links">
                <a href="/mvp-readiness" target="_blank" rel="noreferrer">MVP Readiness</a>
                <a href="/autonomy-snapshot" target="_blank" rel="noreferrer">Autonomy Snapshot</a>
                <a href="/judge-snapshot" target="_blank" rel="noreferrer">Judge Snapshot</a>
                <a href="/competitive-swot" target="_blank" rel="noreferrer">Competitive SWOT</a>
                <a href="/submission-assets" target="_blank" rel="noreferrer">Submission Assets</a>
                <a href="/recording-script" target="_blank" rel="noreferrer">Recording Script</a>
                <a href="/pilot-value" target="_blank" rel="noreferrer">Pilot Value</a>
                <a href={proof.links.app} target="_blank" rel="noreferrer">Cloud Run</a>
                <a href={proof.links.github} target="_blank" rel="noreferrer">GitHub</a>
                <a href={proof.links.ci} target="_blank" rel="noreferrer">GitHub Actions</a>
                <a href={proof.links.agentCard} target="_blank" rel="noreferrer">Agent Card</a>
                <a href={proof.links.architecture} target="_blank" rel="noreferrer">Architecture</a>
                <a href={proof.links.story} target="_blank" rel="noreferrer">Story Markdown</a>
              </div>
              <div className="proof-snapshot">
                <div>
                  <span>Weakest</span>
                  <strong>{proof.mission.weakestCriterion}</strong>
                </div>
                <div>
                  <span>Ops</span>
                  <strong>{proof.opsDrill.severity}</strong>
                </div>
                <div>
                  <span>CI</span>
                  <strong>{proof.ci.conclusion}</strong>
                </div>
                <div>
                  <span>Next</span>
                  <strong>{proof.strategy.nextBestAgent ?? proof.opsDrill.nextOpsAgent ?? "none"}</strong>
                </div>
              </div>
              <div className="proof-receipt">
                <span>{proof.receipt.algorithm}</span>
                <strong>{proof.receipt.digest}</strong>
                <p>{proof.receipt.verification}</p>
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Proof Runbook
              </h3>
              <pre>{proof.runbook.slice(0, 8).join("\n")}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="proof-empty">
          <Trophy size={28} />
          <strong>Run judge proofで、Gemini・Cloud Run・A2A・競合/SWOT・UX導線・Mission・Ops・提出URLを一括検証します。</strong>
          <p>Win Autopilotの次に開く証拠束として、作品の価値と実装証拠を1つにまとめます。</p>
        </div>
      )}
    </section>
  );
}

function PitchDirector({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [pitch, setPitch] = useState<PitchRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runPitch() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPitch((await response.json()) as PitchRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pitch-director">
      <div className="pitch-heading">
        <div>
          <span className="eyebrow">Pitch director</span>
          <h2>
            <Film size={20} />
            30-second submission reel
          </h2>
        </div>
        <button className="icon-button" onClick={runPitch} disabled={loading} title="30秒ピッチ構成を生成">
          <Play size={17} />
          {loading ? "Building" : "Build pitch"}
        </button>
      </div>

      {error && <p className="error-text">Pitch request failed: {error}</p>}

      {pitch ? (
        <div className="pitch-body">
          <div className="pitch-summary">
            <div>
              <span className="event-pill">
                <Film size={15} />
                {pitch.totalSeconds}s / {pitch.scenes.length} scenes
              </span>
              <h3>{pitch.heroLine}</h3>
              <p>{pitch.thesis}</p>
            </div>
            <div className="pitch-score">
              <strong>{pitch.readinessScore}</strong>
              <span>recording ready</span>
            </div>
          </div>

          <div className="pitch-scene-rail">
            {pitch.scenes.map((scene) => (
              <article key={scene.id}>
                <div>
                  <span>{scene.timeRange}</span>
                  <strong>{scene.title}</strong>
                </div>
                <p>{scene.screen}</p>
                <small>{scene.caption}</small>
                <em>{scene.voiceover}</em>
                <a href={scene.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="pitch-grid">
            <section>
              <h3>
                <Terminal size={15} />
                Voiceover
              </h3>
              <pre>{pitch.voiceoverScript}</pre>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Recording checklist
              </h3>
              <div className="pitch-checklist">
                {pitch.recordingChecklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.proof}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <FileText size={15} />
                Lower thirds
              </h3>
              <div className="pitch-lower-thirds">
                {pitch.lowerThirds.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
              <div className="pitch-warnings">
                {pitch.submissionWarnings.map((item) => (
                  <div key={item.id}>
                    <strong>{item.label}</strong>
                    <p>{item.proof}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="pitch-empty">
          <Film size={28} />
          <strong>Build pitchで、審査員に見せる30秒の録画順、字幕、証拠リンクを生成します。</strong>
          <p>ProtoPedia動画URLが未確定でも、今すぐ録画できる提出リールに変換します。</p>
        </div>
      )}
    </section>
  );
}

function JudgeDrillPanel({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [drill, setDrill] = useState<JudgeDrill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runDrill() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/judge-drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id)
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDrill((await response.json()) as JudgeDrill);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="judge-drill">
      <div className="judge-heading">
        <div>
          <span className="eyebrow">Judge drill</span>
          <h2>
            <Crosshair size={20} />
            Skeptical Q&A board
          </h2>
        </div>
        <button className="icon-button" onClick={runDrill} disabled={loading} title="審査員想定問答を生成">
          <Activity size={17} />
          {loading ? "Drilling" : "Run judge drill"}
        </button>
      </div>

      {error && <p className="error-text">Judge drill request failed: {error}</p>}

      {drill ? (
        <div className="judge-body">
          <div className="judge-summary">
            <div>
              <span className="event-pill">
                <AlertTriangle size={15} />
                hardest question
              </span>
              <h3>{drill.hardestQuestion}</h3>
              <p>{drill.openingRebuttal}</p>
            </div>
            <div className="judge-score">
              <strong>{drill.readinessScore}</strong>
              <span>rebuttal ready</span>
            </div>
          </div>

          <div className="judge-cross-exam">
            <section>
              <h3>
                <ShieldCheck size={15} />
                Cross-exam deck
              </h3>
              <div>
                {drill.crossExamDeck.map((card) => (
                  <article key={card.id} className={card.risk}>
                    <div>
                      <strong>{card.competitor}</strong>
                      <span>{card.risk}</span>
                    </div>
                    <h4>{card.triggerQuestion}</h4>
                    <p>{card.answerPattern}</p>
                    <small>{card.fallbackLine}</small>
                    <span>+{card.scoreLift} scoring lever</span>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Gauge size={15} />
                60s answer path
              </h3>
              <ol>
                {drill.timeboxedAnswer.map((step) => (
                  <li key={step.timeRange}>
                    <strong>{step.timeRange}</strong>
                    <span>{step.move}</span>
                    <small>{step.proof}</small>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="judge-objections">
            {drill.objections.map((objection) => (
              <article key={objection.id} className={objection.risk}>
                <div>
                  <span>{objection.risk}</span>
                  <strong>{objection.criterion}</strong>
                </div>
                <h3>{objection.question}</h3>
                <p>{objection.answer}</p>
                <small>{objection.evidence}</small>
                <a href={objection.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="judge-grid">
            <section>
              <h3>
                <Terminal size={15} />
                Cross-exam runbook
              </h3>
              <ol>
                {drill.crossExamRunbook.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Evidence links
              </h3>
              <div className="judge-links">
                {drill.evidenceLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" title={link.proof}>
                    {link.label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Lightbulb size={15} />
                Closing line
              </h3>
              <p>{drill.closingLine}</p>
            </section>
          </div>
        </div>
      ) : (
        <div className="judge-empty">
          <Crosshair size={28} />
          <strong>Run judge drillで、審査員の厳しい質問に対する回答と証拠リンクを生成します。</strong>
          <p>5つの審査基準ごとに、聞かれそうな疑問を先に潰します。</p>
        </div>
      )}
    </section>
  );
}

function FinalistSimulator({
  recommendation,
  projectBrief
}: {
  recommendation: Recommendation;
  projectBrief: string;
}) {
  const [simulation, setSimulation] = useState<FinalistSimulation | null>(null);
  const [protopediaUrl, setProtopediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState<string>(SUBMISSION_PROOF.deployedUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSimulation() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/finalist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds: recommendation.selected.map((agent) => agent.id),
          protopediaUrl,
          videoUrl,
          targetUrl
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSimulation((await response.json()) as FinalistSimulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="finalist-simulator">
      <div className="finalist-heading">
        <div>
          <span className="eyebrow">Finalist simulator</span>
          <h2>
            <Trophy size={20} />
            Judge panel verdict
          </h2>
        </div>
        <button className="icon-button" onClick={runSimulation} disabled={loading} title="最終候補判定を実行">
          <Activity size={17} />
          {loading ? "Simulating" : "Simulate finalist"}
        </button>
      </div>

      <div className="launch-inputs">
        <label>
          <span>ProtoPedia work URL</span>
          <input value={protopediaUrl} onChange={(event) => setProtopediaUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl} />
        </label>
        <label>
          <span>Video URL</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl} />
        </label>
        <label>
          <span>Target Cloud Run URL</span>
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder={SUBMISSION_PROOF.deployedUrl} />
        </label>
      </div>

      {error && <p className="error-text">Finalist simulation failed: {error}</p>}

      {simulation ? (
        <div className="finalist-body">
          <div className="finalist-summary">
            <div>
              <span className={cx("risk-chip", simulation.finalistBand === "finalist-ready" ? "low" : simulation.finalistBand === "borderline" ? "medium" : "high")}>
                {simulation.finalistBand}
              </span>
              <h3>{simulation.advanceDecision}</h3>
              <p>{simulation.winningMove}</p>
              <small>{simulation.judgeConsensus}</small>
            </div>
            <div className="finalist-score">
              <strong>{simulation.finalistScore}</strong>
              <span>finalist score</span>
            </div>
          </div>

          {simulation.releaseDrift && (
            <div className={cx("finalist-release-card", simulation.releaseDrift.verdict)}>
              <div>
                <span>Public release</span>
                <strong>{simulation.releaseDrift.verdict}</strong>
                <small>{simulation.releaseDrift.targetBaseUrl}</small>
              </div>
              <div>
                <strong>{simulation.releaseDrift.driftScore}</strong>
                <span>drift score</span>
              </div>
              <p>{simulation.releaseDrift.nextAction}</p>
              <small>
                missing skills {simulation.releaseDrift.missingSkills.length} / missing signals {simulation.releaseDrift.missingAgentCardSignals.join(", ") || "none"}
              </small>
            </div>
          )}

          <div className="finalist-panels">
            {simulation.panels.map((panel) => (
              <article key={panel.id} className={panel.verdict}>
                <div>
                  <span>{panel.verdict}</span>
                  <strong>{panel.score}</strong>
                </div>
                <h3>{panel.judgeRole}</h3>
                <small>{panel.criterion}</small>
                <p>{panel.decisiveProof}</p>
                <em>{panel.concern}</em>
                <a href={panel.evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>

          <div className="finalist-internal-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    simulation.internalLock.readiness === "internal-finalist-ready"
                      ? "low"
                      : simulation.internalLock.readiness === "internal-finalist-external-watch"
                        ? "medium"
                        : "high"
                  )}
                >
                  {simulation.internalLock.readiness}
                </span>
                <strong>{simulation.internalLock.internalScore}</strong>
              </div>
              <h3>Finalist Internal Lock</h3>
              <p>{simulation.internalLock.operatorLine}</p>
              <small>
                sealed {simulation.internalLock.sealedCount} / watch {simulation.internalLock.watchCount} / blocked {simulation.internalLock.blockedCount} /
                lock {simulation.internalLock.lockScore}
              </small>
            </section>
            <div>
              {simulation.internalLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.proof}</p>
                  <a href={check.evidenceUrl} target="_blank" rel="noreferrer">
                    Evidence <ExternalLink size={13} />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="finalist-grid">
            <section>
              <h3>
                <AlertTriangle size={15} />
                Remaining gaps
              </h3>
              <div className="finalist-gaps">
                {simulation.gaps.length > 0 ? (
                  simulation.gaps.map((gap) => (
                    <article key={gap.id} className={gap.severity}>
                      <div>
                        <strong>{gap.label}</strong>
                        <span>{gap.severity}</span>
                      </div>
                      <p>{gap.action}</p>
                      <small>{gap.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <div>
                      <strong>No remaining gaps</strong>
                      <span>clear</span>
                    </div>
                    <p>提出URL、動画、証拠リンクが揃っています。</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Top concern
              </h3>
              <p>{simulation.topConcern}</p>
              <h3>
                <Terminal size={15} />
                Runbook
              </h3>
              <pre>{simulation.runbook.join("\n")}</pre>
            </section>
            <section>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(simulation.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="finalist-empty">
          <Trophy size={28} />
          <strong>Simulate finalistで、審査員5役の最終候補判定、落選理由、残ギャップ、次の一手を生成します。</strong>
          <p>機能が揃ったかではなく、審査で残れるかを判定します。</p>
        </div>
      )}
    </section>
  );
}

export default function AppHome({ view = "buyer" }: { view?: "buyer" | "judge-tools" } = {}) {
  const [initialWorkspaceLoad] = useState<InitialWorkspaceLoad>(() => loadWorkspaceDraft());
  const initialWorkspace = initialWorkspaceLoad.draft;
  const [importedFromShare] = useState(() => hasWorkspaceShareParam());
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [launchRoomCopyStatus, setLaunchRoomCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [workspaceImportStatus, setWorkspaceImportStatus] = useState<"idle" | "imported" | "failed">("idle");
  const [workspaceImportMessage, setWorkspaceImportMessage] = useState("");
  const workspaceSource = initialWorkspaceLoad.source;
  const [activeTemplateId, setActiveTemplateId] = useState(initialWorkspace.activeTemplateId);
  const [projectBrief, setProjectBrief] = useState(initialWorkspace.projectBrief);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialWorkspace.selectedAgentIds);
  const [customAgents, setCustomAgents] = useState<MarketAgent[]>(initialWorkspace.customAgents);
  const [agentTrialEvidence, setAgentTrialEvidence] = useState<AgentTrialEvidenceRecord[]>(initialWorkspace.agentTrialEvidence);
  const [buyerScenarioInput, setBuyerScenarioInput] = useState<BuyerValueScenarioInput>(initialWorkspace.buyerScenario);
  const [pilotRunInput, setPilotRunInput] = useState<PilotRunReceiptInput>(initialWorkspace.pilotRun);
  const [buyerWorkOrderInput, setBuyerWorkOrderInput] = useState<BuyerWorkOrderInput>(initialWorkspace.buyerWorkOrder);
  const [targetUrl, setTargetUrl] = useState(initialWorkspace.targetUrl);
  const [protopediaUrl, setProtopediaUrl] = useState(initialWorkspace.protopediaUrl);
  const [videoUrl, setVideoUrl] = useState(initialWorkspace.videoUrl);
  const [proofVerification, setProofVerification] = useState<BuyerShareGateProofVerificationSummary | null>(initialWorkspace.proofVerification);
  const [proofRepairDraft, setProofRepairDraft] = useState<Partial<BuyerPilotProofIntake>>({});
  const [proofVerifyStatus, setProofVerifyStatus] = useState<BuyerProofVerifyStatus>(initialWorkspace.proofVerification ? "checked" : "idle");
  const [proofVerifyError, setProofVerifyError] = useState("");
  const [heroDiligenceOpen, setHeroDiligenceOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [squadOptimizer, setSquadOptimizer] = useState<SquadOptimizerRun | null>(null);
  const [workspaceToolsOpen, setWorkspaceToolsOpen] = useState(false);
  const [proofDetailOpen, setProofDetailOpen] = useState(false);

  useEffect(() => {
    const revealForHash = () => {
      const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!hash || document.getElementById(hash)) return;
      setWorkspaceToolsOpen(true);
      setProofDetailOpen(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      });
    };
    revealForHash();
    window.addEventListener("hashchange", revealForHash);
    return () => window.removeEventListener("hashchange", revealForHash);
  }, []);

  const agentCatalog = useMemo(() => mergeRuntimeAgentCatalog(customAgents), [customAgents]);
  const recommendation = useMemo(() => recommendSquad(projectBrief, selectedIds, 140, agentCatalog), [agentCatalog, projectBrief, selectedIds]);
  const strategy = useMemo(() => buildWinningStrategy(recommendation), [recommendation]);
  const valueBlueprint = useMemo(() => buildValueBlueprint(recommendation, projectBrief), [recommendation, projectBrief]);
  const buyerScenario = useMemo(() => buildBuyerValueScenario(recommendation, buyerScenarioInput), [buyerScenarioInput, recommendation]);
  const heroValueSensitivity = useMemo(() => buildBuyerValueSensitivity(buyerScenario), [buyerScenario]);
  const squadDecisionBudget = Math.max(140, recommendation.budgetUsed);
  const proofIntake = useMemo<BuyerPilotProofIntake>(
    () => ({
      targetUrl,
      protopediaUrl,
      videoUrl,
      pilotEvidenceUrl: pilotRunInput.evidenceUrl,
      workOrderEvidenceUrl: buyerWorkOrderInput.evidenceUrl
    }),
    [buyerWorkOrderInput.evidenceUrl, pilotRunInput.evidenceUrl, protopediaUrl, targetUrl, videoUrl]
  );
  const workflowIntakeProofLinks = useMemo<WorkflowIntakeProofSlot[]>(
    () =>
      BUYER_PILOT_PROOF_FIELDS.map((field) => ({
        id: field.key,
        label: field.label,
        value: proofIntake[field.key],
        href: field.href
      })),
    [proofIntake.pilotEvidenceUrl, proofIntake.protopediaUrl, proofIntake.targetUrl, proofIntake.videoUrl, proofIntake.workOrderEvidenceUrl]
  );
  const proofVerificationKey = useMemo(() => JSON.stringify(BUYER_PILOT_PROOF_FIELDS.map((field) => [field.key, proofIntake[field.key]])), [proofIntake]);
  const workspaceDraft = useMemo(
    () =>
      buildWorkspaceDraft({
        activeTemplateId,
        projectBrief,
        selectedAgentIds: selectedIds,
        customAgents,
        agentTrialEvidence,
        buyerScenario: buyerScenarioInput,
        pilotRun: pilotRunInput,
        buyerWorkOrder: buyerWorkOrderInput,
        targetUrl,
        protopediaUrl,
        videoUrl,
        proofVerification
      }),
    [activeTemplateId, agentTrialEvidence, buyerScenarioInput, buyerWorkOrderInput, customAgents, pilotRunInput, projectBrief, proofVerification, protopediaUrl, selectedIds, targetUrl, videoUrl]
  );
  const proofSampleDraft = useMemo(() => buildProofBackedSampleWorkspaceDraft(undefined, runtimeProofSampleBaseUrl()), []);
  const shareHref = useMemo(() => workspaceShareHref(workspaceDraft), [workspaceDraft]);
  const launchRoomHref = useMemo(() => workspaceLaunchRoomHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerOutcomeBriefHref = useMemo(() => workspaceBuyerOutcomeBriefHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerEvidenceTraceHref = useMemo(() => workspaceBuyerEvidenceTraceHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerEvidenceBoardHref = useMemo(() => workspaceBuyerEvidenceBoardHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerShareGateHref = useMemo(() => workspaceBuyerShareGateHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerProofMonitorHref = useMemo(() => workspaceBuyerProofMonitorHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerProofRecoveryHref = useMemo(() => workspaceBuyerProofRecoveryHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const productionHardeningHref = useMemo(() => workspaceProductionHardeningHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerProofAuditHref = useMemo(() => workspaceBuyerProofAuditHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerProofRoomHref = useMemo(() => workspaceBuyerProofRoomHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerValueReportHref = useMemo(() => workspaceBuyerValueReportHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerDeliveryMemoHref = useMemo(() => workspaceBuyerDeliveryMemoHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerTrustManifestHref = useMemo(() => workspaceBuyerTrustManifestHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerDecisionFollowUpHref = useMemo(() => workspaceBuyerDecisionFollowUpHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerEvidenceBoardHrefs = useMemo(
    () => ({
      workflowIntake: "#quick-workflow-intake",
      valueReport: buyerValueReportHref,
      measuredRun: buyerDeliveryMemoHref,
      proofAudit: buyerProofAuditHref,
      trustManifest: buyerTrustManifestHref,
      launchRoom: launchRoomHref,
      publicPage: buyerEvidenceBoardHref
    }),
    [buyerDeliveryMemoHref, buyerEvidenceBoardHref, buyerProofAuditHref, buyerTrustManifestHref, buyerValueReportHref, launchRoomHref]
  );
  const sampleBuyerOutcomeBriefHref = useMemo(() => publicRouteHref(SAMPLE_BUYER_BRIEF_PATH), []);
  const sampleBuyerDeliveryMemoHref = useMemo(() => publicRouteHref("/buyer-delivery-memo"), []);
  const sampleBuyerProofAuditHref = useMemo(() => publicRouteHref(SAMPLE_BUYER_PROOF_AUDIT_PATH), []);
  const sampleProcurementDecisionHref = useMemo(() => publicRouteHref(SAMPLE_PROCUREMENT_DECISION_PATH), []);
  const defaultAgentCardAuditUrl = useMemo(() => selfAgentCardSourceUrl(), []);
  const agentCardDiligenceHref = useMemo(() => selfAgentCardDiligenceHref(), []);
  const agentCardShortlistHref = useMemo(() => sampleAgentCardShortlistHref(), []);
  const agentCardTrialPlanHref = useMemo(() => sampleAgentCardTrialPlanHref(), []);
  const agentCardTrialVerificationHref = useMemo(() => sampleAgentCardTrialVerificationHref(), []);
  const globalAuditHref = useMemo(() => workspaceGlobalLaunchAuditHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const globalProofDossierHref = useMemo(() => workspaceGlobalProofDossierHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const globalPublishabilityHref = useMemo(() => workspaceGlobalPublishabilityHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const launchEvidenceHref = useMemo(() => workspaceLaunchEvidenceHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerDecisionCockpitHref = useMemo(() => workspaceBuyerDecisionCockpitHref(workspaceDraft, proofSampleDraft), [proofSampleDraft, workspaceDraft]);
  const buyerEvidenceResponseWorkspaceDraft = importedFromShare || workspaceSource === "shared" ? initialWorkspace : workspaceDraft;
  const buyerEvidenceResponseRouteHrefs = useMemo(() => {
    if (!importedFromShare && workspaceSource !== "shared") return null;
    return {
      launchEvidenceHref: workspaceForcedRouteHref("/launch-evidence", buyerEvidenceResponseWorkspaceDraft),
      launchRoomHref: workspaceForcedRouteHref("/launch-room", buyerEvidenceResponseWorkspaceDraft),
      buyerEvidenceBoardHref: workspaceForcedRouteHref("/buyer-evidence-board", buyerEvidenceResponseWorkspaceDraft),
      buyerProofRoomHref: workspaceForcedRouteHref("/buyer-proof-room", buyerEvidenceResponseWorkspaceDraft),
      buyerDecisionCockpitHref: workspaceForcedRouteHref("/buyer-decision-cockpit", buyerEvidenceResponseWorkspaceDraft)
    };
  }, [buyerEvidenceResponseWorkspaceDraft, importedFromShare, workspaceSource]);
  const homepageBuyerDecisionCockpit = useMemo(
    () =>
      buildHomepageBuyerDecisionCockpitFromWorkspace({
        workspace: workspaceDraft,
        hrefs: {
          launchEvidenceHref,
          launchRoomHref,
          buyerEvidenceBoardHref,
          buyerProofRoomHref
        }
      }),
    [buyerEvidenceBoardHref, buyerProofRoomHref, launchEvidenceHref, launchRoomHref, workspaceDraft]
  );
  const homepageBuyerEvidenceResponseCockpit = useMemo(
    () =>
      buyerEvidenceResponseRouteHrefs
        ? buildHomepageBuyerDecisionCockpitFromWorkspace({
            workspace: buyerEvidenceResponseWorkspaceDraft,
            hrefs: {
              launchEvidenceHref: buyerEvidenceResponseRouteHrefs.launchEvidenceHref,
              launchRoomHref: buyerEvidenceResponseRouteHrefs.launchRoomHref,
              buyerEvidenceBoardHref: buyerEvidenceResponseRouteHrefs.buyerEvidenceBoardHref,
              buyerProofRoomHref: buyerEvidenceResponseRouteHrefs.buyerProofRoomHref
            }
          })
        : homepageBuyerDecisionCockpit,
    [buyerEvidenceResponseRouteHrefs, buyerEvidenceResponseWorkspaceDraft, homepageBuyerDecisionCockpit]
  );
  const homepageBuyerEvidenceResponseTarget = useMemo<QuickBuyerEvidenceResponseImportTarget>(() => {
    const [checksumAlgorithm = "fnv1a32", ...checksumParts] = homepageBuyerEvidenceResponseCockpit.payload.sourceChecksum.split(":");
    const checksum = checksumParts.join(":") || homepageBuyerEvidenceResponseCockpit.payload.sourceChecksum;
    return {
      buyer: homepageBuyerEvidenceResponseCockpit.payload.buyer,
      conversionReceipt: {
        receiptId: homepageBuyerEvidenceResponseCockpit.payload.sourceReceiptId,
        checksumAlgorithm,
        checksum
      },
      evidencePack: {
        sharePayloadJson: homepageBuyerEvidenceResponseCockpit.payloadJson,
        shareHref: buyerEvidenceResponseRouteHrefs?.buyerDecisionCockpitHref ?? buyerDecisionCockpitHref,
        verifierHref: homepageBuyerEvidenceResponseCockpit.payload.verifierHref
      }
    };
  }, [buyerDecisionCockpitHref, buyerEvidenceResponseRouteHrefs, homepageBuyerEvidenceResponseCockpit]);
  const launchRoom = useMemo(
    () =>
      buildLaunchRoom({
        workspace: workspaceDraft,
        baseUrl: typeof window === "undefined" ? "" : window.location.origin,
        appUrl: shareHref
    }),
    [shareHref, workspaceDraft]
  );
  const buyerDecisionReceiptHref = useMemo(
    () => workspaceBuyerDecisionReceiptHref(workspaceDraft, launchRoom.buyerDecision.verdict, proofSampleDraft),
    [launchRoom.buyerDecision.verdict, proofSampleDraft, workspaceDraft]
  );
  const buyerReviewKitHref = useMemo(
    () => workspaceBuyerReviewKitHref(workspaceDraft, launchRoom.buyerDecision.verdict, proofSampleDraft),
    [launchRoom.buyerDecision.verdict, proofSampleDraft, workspaceDraft]
  );
  const buyerAcceptancePathHref = useMemo(
    () => workspaceBuyerAcceptancePathHref(workspaceDraft, launchRoom.buyerDecision.verdict, proofSampleDraft),
    [launchRoom.buyerDecision.verdict, proofSampleDraft, workspaceDraft]
  );
  const globalLaunchAudit = useMemo(
    () =>
      buildGlobalLaunchAudit({
        projectBrief,
        recommendation,
        valueBlueprint,
        buyerScenario,
        pilotRun: pilotRunInput,
        buyerWorkOrder: buyerWorkOrderInput,
        workspace: workspaceDraft,
        launchRoom
      }),
    [buyerScenario, buyerWorkOrderInput, launchRoom, pilotRunInput, projectBrief, recommendation, valueBlueprint, workspaceDraft]
  );
  const buyerGlobalLaunchSnapshot = useMemo(
    () =>
      buildBuyerGlobalLaunchSnapshot({
        audit: globalLaunchAudit,
        publicAuditHref: globalAuditHref,
        launchRoomHref
      }),
    [globalAuditHref, globalLaunchAudit, launchRoomHref]
  );
  const homepagePublishabilitySnapshot = useMemo(
    () =>
      buildHomepagePublishabilitySnapshot({
        globalLaunch: buyerGlobalLaunchSnapshot,
        publishabilityHref: globalPublishabilityHref
      }),
    [buyerGlobalLaunchSnapshot, globalPublishabilityHref]
  );
  const proofTransformation = useMemo(
    () =>
      buildProofTransformation({
        current: workspaceDraft,
        sample: proofSampleDraft,
        baseUrl: typeof window === "undefined" ? "" : window.location.origin,
        appUrl: shareHref
      }),
    [proofSampleDraft, shareHref, workspaceDraft]
  );
  const homeMeasuredRunSummary = useMemo(() => buildBuyerPilotMeasuredRunSummary(pilotRunInput, buyerScenario), [buyerScenario, pilotRunInput]);
  const buyerPilotCommand = useMemo(() => buildBuyerPilotCommand(launchRoom), [launchRoom]);
  const homeRunCalibration = useMemo(() => buildBuyerPilotRunCalibration(pilotRunInput, buyerScenario), [buyerScenario, pilotRunInput]);
  const homepageShareGate = useMemo(
    () =>
      buildBuyerShareGate({
        command: buyerPilotCommand,
        proofLinks: workflowIntakeProofLinks,
        measuredRun: homeMeasuredRunSummary,
        runCalibration: homeRunCalibration,
        proofVerification: proofVerification ?? undefined
      }),
    [buyerPilotCommand, homeMeasuredRunSummary, homeRunCalibration, proofVerification, workflowIntakeProofLinks]
  );
  const homepageEvidenceTrace = useMemo(
    () => buildBuyerEvidenceTrace({ room: launchRoom, shareGate: homepageShareGate }),
    [homepageShareGate, launchRoom]
  );
  const heroBuyerDecisionBrief = useMemo(
    () =>
      buildHeroBuyerDecisionBrief({
        command: buyerPilotCommand,
        transformation: proofTransformation,
        buyerScenario,
        measuredRunSummary: homeMeasuredRunSummary,
        launchRoomHref,
        proofAuditHref: buyerProofAuditHref,
        decisionReceiptHref: buyerDecisionReceiptHref
      }),
    [buyerDecisionReceiptHref, buyerPilotCommand, buyerProofAuditHref, buyerScenario, homeMeasuredRunSummary, launchRoomHref, proofTransformation]
  );
  const homepageRouteLock = useMemo(
    () =>
      buildHomepageRouteLock({
        room: launchRoom,
        command: buyerPilotCommand,
        launchRoomHref,
        proofAuditHref: buyerProofAuditHref,
        trustManifestHref: buyerTrustManifestHref,
        decisionReceiptHref: buyerDecisionReceiptHref,
        decisionFollowUpHref: buyerDecisionFollowUpHref,
        reviewKitHref: buyerReviewKitHref,
        acceptancePathHref: buyerAcceptancePathHref
      }),
    [
      buyerAcceptancePathHref,
      buyerDecisionFollowUpHref,
      buyerDecisionReceiptHref,
      buyerPilotCommand,
      buyerProofAuditHref,
      buyerReviewKitHref,
      buyerTrustManifestHref,
      launchRoom,
      launchRoomHref
    ]
  );
  const homepageProofEntry = useMemo(
    () =>
      buildHomepageProofEntrySnapshot({
        heroBrief: heroBuyerDecisionBrief,
        publishability: homepagePublishabilitySnapshot,
        routeLock: homepageRouteLock,
        proofRoomHref: buyerProofRoomHref,
        reviewKitHref: buyerReviewKitHref,
        decisionReceiptHref: buyerDecisionReceiptHref,
        acceptancePathHref: buyerAcceptancePathHref
      }),
    [buyerAcceptancePathHref, buyerDecisionReceiptHref, buyerProofRoomHref, buyerReviewKitHref, heroBuyerDecisionBrief, homepagePublishabilitySnapshot, homepageRouteLock]
  );
  const homepageHeroProofRoute = useMemo(() => buildHomepageHeroProofRouteSnapshot(homepageProofEntry), [homepageProofEntry]);
  const buyerOutcomeBrief = useMemo(
    () =>
      buildBuyerOutcomeBrief({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workspace: workspaceDraft,
        pilotRun: pilotRunInput,
        launchRoom
      }),
    [buyerScenario, launchRoom, pilotRunInput, recommendation, valueBlueprint, workspaceDraft]
  );
  const homepageValueLens = useMemo(
    () =>
      buildHomepageValueLensSnapshot({
        buyer: valueBlueprint.primaryUser,
        scenario: buyerScenario,
        measuredRun: homeMeasuredRunSummary,
        valueReportHref: buyerValueReportHref,
        workflowIntakeHref: "#quick-workflow-intake"
      }),
    [buyerScenario, buyerValueReportHref, homeMeasuredRunSummary, valueBlueprint.primaryUser]
  );
  const homepageOutcomeArtifact = useMemo(
    () =>
      buildHomepageOutcomeArtifactSnapshot({
        brief: buyerOutcomeBrief,
        publicBriefHref: buyerOutcomeBriefHref,
        launchRoomHref
      }),
    [buyerOutcomeBrief, buyerOutcomeBriefHref, launchRoomHref]
  );
  const homepageReviewerHandoffKit = useMemo(
    () =>
      buildHomepageReviewerHandoffKitSnapshot({
        artifact: homepageOutcomeArtifact,
        proofEntry: homepageProofEntry,
        reviewKitHref: buyerReviewKitHref
      }),
    [buyerReviewKitHref, homepageOutcomeArtifact, homepageProofEntry]
  );
  const firstOutputModeLabel = homepageShareGate.sendPacket.mode === "send" ? "send-ready" : homepageShareGate.sendPacket.mode === "review" ? "review first" : "repair first";
  const firstOutputProofLine = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} live links verified`
    : `${homepageProofEntry.readyCount}/${homepageProofEntry.items.length} artifacts ready`;
  const firstOutputBlockerLine = `${homepageShareGate.blockerCount} blockers / ${homepageShareGate.watchCount} watch`;
  const firstOutputBoardLine = `${homepageRouteLock.score}/100 route lock`;
  const heroMobileBuyerDecisionQuestion = heroBuyerDecisionBrief.buyerQuestions.find((question) => question.id === "next-decision");
  const proofWorkbenchVerifyLabel =
    proofVerifyStatus === "checking" ? "Checking live proof" : proofVerification ? "Recheck live proof" : proofVerifyStatus === "failed" ? "Retry live proof" : "Verify live proof";
  const proofWorkbenchVerifyLine = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} links verified live`
    : proofVerifyStatus === "checking"
      ? "Checking public URLs now"
      : "Cloud Run, story, video, pilot, and work-order links";
  const proofWorkbenchShareLine =
    homepageShareGate.sendPacket.mode === "send"
      ? "Buyer packet can leave now"
      : homepageShareGate.sendPacket.mode === "review"
        ? `${homepageShareGate.watchCount} warning before buyer send`
        : `${homepageShareGate.blockerCount} blocker${homepageShareGate.blockerCount === 1 ? "" : "s"} before buyer send`;
  const proofWorkbenchShareActionExternal = /^https?:\/\//i.test(homepageShareGate.primaryActionHref);
  const rankedIds = useMemo(() => new Map(recommendation.ranked.map((fit, index) => [fit.agent.id, index])), [recommendation]);

  useEffect(() => {
    cleanWorkspaceShareParamFromUrl();
  }, []);

  useEffect(() => {
    let retryHandle: number | undefined;
    let attempts = 0;

    const scrollWithRetry = () => {
      window.clearTimeout(retryHandle);
      if (scrollToCurrentHashTarget()) return;
      if (attempts >= 24) return;
      attempts += 1;
      retryHandle = window.setTimeout(scrollWithRetry, 125);
    };

    scrollWithRetry();
    window.addEventListener("hashchange", scrollWithRetry);

    return () => {
      window.clearTimeout(retryHandle);
      window.removeEventListener("hashchange", scrollWithRetry);
    };
  }, []);

  useEffect(() => {
    if (shareStatus === "idle") return;
    const timeout = window.setTimeout(() => setShareStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [shareStatus]);

  useEffect(() => {
    if (launchRoomCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setLaunchRoomCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [launchRoomCopyStatus]);

  useEffect(() => {
    if (workspaceImportStatus === "idle") return;
    const timeout = window.setTimeout(() => {
      setWorkspaceImportStatus("idle");
      setWorkspaceImportMessage("");
    }, 3600);
    return () => window.clearTimeout(timeout);
  }, [workspaceImportStatus]);

  useEffect(() => {
    if (proofVerification) {
      setProofVerifyStatus("checked");
      setProofVerifyError("");
      return;
    }
    setProofVerifyStatus((current) => (current === "failed" ? "failed" : "idle"));
  }, [proofVerification, proofVerificationKey]);

  useEffect(() => {
    saveWorkspaceDraft(workspaceDraft);
  }, [workspaceDraft]);

  useEffect(() => {
    let active = true;
    setSquadOptimizer(null);
    import("./squadOptimizer").then(({ buildSquadOptimizer }) => {
      if (!active) return;
      setSquadOptimizer(
        buildSquadOptimizer({
          projectBrief,
          selectedAgentIds: selectedIds,
          agentCatalog,
          budget: squadDecisionBudget,
          maxSquadSize: 4
        })
      );
    });

    return () => {
      active = false;
    };
  }, [agentCatalog, projectBrief, selectedIds, squadDecisionBudget]);

  const filteredAgents = agentCatalog.filter((agent) => {
    const matchesStage = stageFilter === "all" || agent.stage === stageFilter;
    const haystack = [agent.name, agent.handle, agent.headline, agent.synergyTags.join(" "), agent.skills.map((skill) => skill.label).join(" ")].join(" ").toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    return matchesStage && matchesQuery;
  }).sort((a, b) => (rankedIds.get(a.id) ?? 99) - (rankedIds.get(b.id) ?? 99));

  function toggleAgent(id: string) {
    setActiveTemplateId("custom");
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyWorkspaceDraftState(draft: WorkspaceDraft) {
    setActiveTemplateId(draft.activeTemplateId);
    setProjectBrief(draft.projectBrief);
    setSelectedIds(draft.selectedAgentIds);
    setCustomAgents(draft.customAgents);
    setAgentTrialEvidence(draft.agentTrialEvidence);
    setBuyerScenarioInput(draft.buyerScenario);
    setPilotRunInput(draft.pilotRun);
    setBuyerWorkOrderInput(draft.buyerWorkOrder);
    setTargetUrl(draft.targetUrl);
    setProtopediaUrl(draft.protopediaUrl);
    setVideoUrl(draft.videoUrl);
    setProofVerification(draft.proofVerification);
    setProofRepairDraft({});
    setProofVerifyStatus(draft.proofVerification ? "checked" : "idle");
    setProofVerifyError("");
    setStageFilter("all");
    setQuery("");
  }

  function applyBlueprintTemplate(template: BlueprintTemplate) {
    applyWorkspaceDraftState(workspaceDraftFromTemplate(template));
  }

  function updateProjectBrief(value: string) {
    setActiveTemplateId("custom");
    setProjectBrief(value);
  }

  function applySquad(agentIds: string[]) {
    setActiveTemplateId("custom");
    setSelectedIds(agentIds);
    setStageFilter("all");
    setQuery("");
  }

  function updateBuyerScenario(patch: Partial<BuyerValueScenarioInput>) {
    setActiveTemplateId("custom");
    setBuyerScenarioInput((current) => normalizeBuyerValueScenarioInput({ ...current, ...patch }));
  }

  function updatePilotRun(patch: Partial<PilotRunReceiptInput>) {
    setActiveTemplateId("custom");
    setPilotRunInput((current) => normalizePilotRunReceiptInput({ ...current, ...patch }));
  }

  function updateBuyerWorkOrder(patch: Partial<BuyerWorkOrderInput>) {
    setActiveTemplateId("custom");
    setBuyerWorkOrderInput((current) => normalizeBuyerWorkOrderInput({ ...current, ...patch }, current));
  }

  function applyProofIntakePatch(patch: Partial<BuyerPilotProofIntake>) {
    if (patch.targetUrl !== undefined) setTargetUrl(patch.targetUrl);
    if (patch.protopediaUrl !== undefined) setProtopediaUrl(patch.protopediaUrl);
    if (patch.videoUrl !== undefined) setVideoUrl(patch.videoUrl);
    if (patch.pilotEvidenceUrl !== undefined) updatePilotRun({ evidenceUrl: patch.pilotEvidenceUrl });
    if (patch.workOrderEvidenceUrl !== undefined) updateBuyerWorkOrder({ evidenceUrl: patch.workOrderEvidenceUrl });
  }

  function updateProofIntake(patch: Partial<BuyerPilotProofIntake>) {
    setActiveTemplateId("custom");
    setProofVerification(null);
    setProofRepairDraft({});
    setProofVerifyStatus("idle");
    setProofVerifyError("");
    applyProofIntakePatch(patch);
  }

  function updateProofRepairDraft(key: keyof BuyerPilotProofIntake, value: string) {
    setProofRepairDraft((current) => ({ ...current, [key]: value }));
  }

  async function applyProofRepairDraft(key: keyof BuyerPilotProofIntake) {
    const value = proofRepairDraft[key] ?? proofIntake[key];
    const patch = { [key]: value } as Partial<BuyerPilotProofIntake>;
    const nextProofIntake = { ...proofIntake, ...patch };
    setActiveTemplateId("custom");
    applyProofIntakePatch(patch);
    setProofRepairDraft((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    await verifyBuyerProofLinksWithIntake(nextProofIntake);
  }

  async function applyProofReplacementAndVerify(patch: Partial<Record<BuyerProofRepairProofKey, string>>) {
    const nextProofIntake = { ...proofIntake, ...patch };
    updateProofIntake(patch);
    await verifyBuyerProofLinksWithIntake(nextProofIntake);
  }

  function updateMeasuredRunIntake(patch: Partial<PilotRunReceiptInput>) {
    setActiveTemplateId("custom");
    updatePilotRun(patch);
  }

  function applyWorkflowIntakeDraft(draft: WorkflowIntakeDraft) {
    const nextWorkOrder = normalizeBuyerWorkOrderInput(
      {
        ...buyerWorkOrderInput,
        ...draft.workOrder,
        ...(draft.proofLinks.workOrderEvidenceUrl ? { evidenceUrl: draft.proofLinks.workOrderEvidenceUrl } : {})
      },
      buyerWorkOrderInput
    );
    const nextBuyerScenario = normalizeBuyerValueScenarioInput({ ...buyerScenarioInput, ...draft.buyerScenario }, buyerScenarioInput);
    const nextPilotRun = normalizePilotRunReceiptInput(
      {
        ...pilotRunInput,
        ...draft.pilotRun,
        ...(draft.proofLinks.pilotEvidenceUrl ? { evidenceUrl: draft.proofLinks.pilotEvidenceUrl } : {})
      },
      pilotRunInput
    );
    const trialAgent = draft.agentTrialEvidence ? findWorkflowTrialAgent({ evidence: draft.agentTrialEvidence, selectedAgents: recommendation.selected, agentCatalog }) : null;
    const trialEvidenceRecord = draft.agentTrialEvidence && trialAgent ? buildWorkflowTrialEvidenceRecord({ evidence: draft.agentTrialEvidence, agent: trialAgent }) : null;
    const nextProofIntake = mergeWorkflowProofIntake(
      {
        ...proofIntake,
        pilotEvidenceUrl: nextPilotRun.evidenceUrl,
        workOrderEvidenceUrl: nextWorkOrder.evidenceUrl
      },
      draft.proofLinks
    );
    const attachedProofCount = BUYER_PILOT_PROOF_FIELDS.filter((field) => nextProofIntake[field.key].trim()).length;
    setActiveTemplateId("custom");
    setBuyerWorkOrderInput(nextWorkOrder);
    setBuyerScenarioInput(nextBuyerScenario);
    setPilotRunInput(nextPilotRun);
    if (draft.proofLinks.targetUrl) setTargetUrl(draft.proofLinks.targetUrl);
    if (draft.proofLinks.protopediaUrl) setProtopediaUrl(draft.proofLinks.protopediaUrl);
    if (draft.proofLinks.videoUrl) setVideoUrl(draft.proofLinks.videoUrl);
    if (trialEvidenceRecord) {
      setSelectedIds((current) => (current.includes(trialEvidenceRecord.agentId) ? current : [...current, trialEvidenceRecord.agentId].slice(0, 8)));
      setAgentTrialEvidence((current) => [trialEvidenceRecord, ...current.filter((item) => item.id !== trialEvidenceRecord.id)].slice(0, 6));
    }
    setProjectBrief(buildWorkflowIntakeBrief({ workOrder: nextWorkOrder, buyerScenario: nextBuyerScenario, pilotRun: nextPilotRun }));
    setProofVerification(null);
    setProofVerifyStatus("idle");
    setProofVerifyError("");
    setWorkspaceImportStatus("imported");
    setWorkspaceImportMessage(
      `Applied ${draft.detectedSignals.length} workflow signals to the buyer pilot workspace.${trialEvidenceRecord ? " Accepted A2A trial proof was attached." : ""}${
        attachedProofCount > 0 ? ` Live proof verification started for ${attachedProofCount}/5 proof links.` : " No public proof links were attached yet."
      }`
    );
    if (attachedProofCount > 0) {
      void verifyBuyerProofLinksWithIntake(nextProofIntake);
    }
  }

  function importCustomAgent(agent: MarketAgent) {
    setActiveTemplateId("custom");
    setCustomAgents((current) => [agent, ...current.filter((item) => item.id !== agent.id)].slice(0, 3));
    setSelectedIds((current) => [...current.filter((id) => id !== agent.id), agent.id].slice(0, 8));
    setStageFilter("all");
    setQuery("");
  }

  function removeCustomAgent(id: string) {
    setCustomAgents((current) => current.filter((agent) => agent.id !== id));
    setSelectedIds((current) => current.filter((agentId) => agentId !== id));
    setAgentTrialEvidence((current) => current.filter((record) => record.agentId !== id));
  }

  function attachAgentTrialEvidence(record: AgentTrialEvidenceRecord) {
    setActiveTemplateId("custom");
    setAgentTrialEvidence((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, 6));
  }

  async function copyShareLink() {
    const copied = await copyTextToClipboard(shareHref);
    setShareStatus(copied ? "copied" : "failed");
  }

  async function copyLaunchRoomLink() {
    const copied = await copyTextToClipboard(launchRoomHref);
    setLaunchRoomCopyStatus(copied ? "copied" : "failed");
  }

  function applyProofVerification(result: BuyerShareGateProofVerificationSummary) {
    setProofVerification(result);
    setProofVerifyStatus("checked");
    setProofVerifyError("");
  }

  async function verifyBuyerProofLinksWithIntake(nextProofIntake: BuyerPilotProofIntake) {
    setProofVerifyStatus("checking");
    setProofVerifyError("");
    try {
      const response = await fetch("/api/proof-links/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          links: BUYER_PILOT_PROOF_FIELDS.map((field) => ({
            id: field.key,
            label: field.label,
            value: nextProofIntake[field.key]
          }))
        })
      });
      if (!response.ok) throw new Error(`Proof verification failed with HTTP ${response.status}.`);
      const result = (await response.json()) as BuyerShareGateProofVerificationSummary;
      applyProofVerification(result);
    } catch (error) {
      setProofVerification(null);
      setProofVerifyStatus("failed");
      setProofVerifyError(error instanceof Error ? error.message : "Proof verification failed.");
    }
  }

  async function verifyBuyerProofLinks() {
    await verifyBuyerProofLinksWithIntake(proofIntake);
  }

  async function importWorkspaceFile(file: File | null) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setWorkspaceImportStatus("failed");
      setWorkspaceImportMessage("Workspace file is too large to import.");
      return;
    }

    try {
      const result = parseWorkspaceImport(await file.text());
      if (result.status === "rejected") {
        setWorkspaceImportStatus("failed");
        setWorkspaceImportMessage(result.reason);
        return;
      }

      applyWorkspaceDraftState(result.draft);
      setWorkspaceImportStatus("imported");
      setWorkspaceImportMessage(`Imported ${result.draft.selectedAgentIds.length} agents and ${result.draft.buyerScenario.teamSize}-person ROI model.`);
    } catch {
      setWorkspaceImportStatus("failed");
      setWorkspaceImportMessage("Workspace file could not be read.");
    }
  }

  function resetWorkspace() {
    applyWorkspaceDraftState(defaultWorkspaceDraft());
    setWorkspaceImportStatus("idle");
    setWorkspaceImportMessage("");
  }

  function loadProofBackedSampleWorkspace() {
    applyWorkspaceDraftState(proofSampleDraft);
    setWorkspaceImportStatus("imported");
    setWorkspaceImportMessage("Loaded reference room: deployed URL, measured receipt, work order proof, accepted A2A trials, and buyer-owned proof gaps.");
  }

  if (view === "judge-tools") {
    return (
      <JudgeToolsPage
        recommendation={recommendation}
        projectBrief={projectBrief}
        targetUrl={targetUrl}
        protopediaUrl={protopediaUrl}
        videoUrl={videoUrl}
        onTargetUrlChange={(value) => updateProofIntake({ targetUrl: value })}
        onProtopediaUrlChange={(value) => updateProofIntake({ protopediaUrl: value })}
        onVideoUrlChange={(value) => updateProofIntake({ videoUrl: value })}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="market-sky">
        <div className="market-identity">
          <span className="event-pill">
            <Cloud size={16} />
            Verifiable buyer approval loop
          </span>
          <h1>Prove agent value before launch</h1>
          <p>Paste one workflow. Get a buyer room, proof blockers, terms, and receipts reviewers can verify.</p>
          <div className="market-hero-actions" aria-label="Primary pilot room actions">
            <a className="market-hero-primary" href="#quick-workflow-intake">
              <Crosshair size={15} />
              Build approval loop
            </a>
            <a className="market-hero-secondary" href="/receipt-verifier">
              <ClipboardCheck size={15} />
              Verify receipts
            </a>
            <a className="market-hero-tertiary" href={buyerProofRoomHref} target="_blank" rel="noreferrer">
              <Gauge size={15} />
              Open proof room
            </a>
          </div>
          <nav className="market-hero-first-output-rail" aria-label="First usable buyer outputs">
            <div className="market-hero-first-output-copy">
              <span>First usable output</span>
              <strong>{firstOutputBlockerLine} before buyer send</strong>
            </div>
            <MarketHeroUnlockBrief
              shareGate={homepageShareGate}
              measuredMonthlyValueYen={homeMeasuredRunSummary.measuredMonthlyValueYen}
              proofReadyCount={homepageProofEntry.readyCount}
              proofItemCount={homepageProofEntry.items.length}
              receiptAlgorithm={homepageOutcomeArtifact.packet.receipt.checksumAlgorithm}
              receiptChecksum={homepageOutcomeArtifact.packet.receipt.checksum}
            />
            <div className={`market-hero-buyer-decision-snapshot is-${heroBuyerDecisionBrief.status}`} aria-label="Buyer decision brief">
              <div>
                <span>Buyer decision brief</span>
                <strong>{heroBuyerDecisionBrief.headline}</strong>
                <small>{heroMobileBuyerDecisionQuestion?.answer ?? heroBuyerDecisionBrief.evidence}</small>
              </div>
              <em aria-label="Recommended buyer decision">{heroBuyerDecisionBrief.decisionLabel}</em>
              <div className="market-hero-buyer-decision-next">
                <span>Next ask</span>
                <strong>{heroBuyerDecisionBrief.primaryAction.label}</strong>
              </div>
            </div>
            <a href="#buyer-board-memo">
              <ClipboardCheck size={14} />
              <span>Board memo</span>
              <strong>Buyer decision memo</strong>
              <small>{yen(homeMeasuredRunSummary.measuredMonthlyValueYen)} measured value, {homepageProofEntry.readyCount}/{homepageProofEntry.items.length} proof items, receipt replay attached.</small>
              <em className={`market-hero-first-output-status is-${homepageShareGate.sendPacket.mode}`}>{firstOutputModeLabel}</em>
            </a>
            <a href={launchEvidenceHref}>
              <ExternalLink size={14} />
              <span>Launch evidence</span>
              <strong>Public proof report</strong>
              <small>{homepageProofEntry.proofScore}/100 proof score with launch report, packet receipt, and buyer proof trail.</small>
              <em className={`market-hero-first-output-meter is-${homepageProofEntry.status}`}>{firstOutputProofLine}</em>
            </a>
            <a href={buyerEvidenceBoardHref}>
              <ShieldCheck size={14} />
              <span>Evidence board</span>
              <strong>Scope, value, trust</strong>
              <small>{homepageRouteLock.operatorLine}</small>
              <em className={`market-hero-first-output-status is-${homepageRouteLock.status}`}>{firstOutputBoardLine}</em>
            </a>
          </nav>
          <div className="hero-workflow-intake-mobile-mount">
            <Suspense
              fallback={
                <section className="hero-workflow-intake-console is-loading" aria-busy="true" aria-label="Live workflow intake console">
                  <div className="hero-workflow-intake-head">
                    <div>
                      <span>Live workflow intake</span>
                      <strong>Preparing workflow analysis</strong>
                      <p>Reading workflow starters, source facts, readiness checks, and workspace apply path.</p>
                    </div>
                  </div>
                </section>
              }
            >
              <HeroWorkflowIntakeConsolePanel
                onApplyDraft={applyWorkflowIntakeDraft}
                buyerDecisionCockpitHref={buyerDecisionCockpitHref}
                launchEvidenceHref={launchEvidenceHref}
                buyerEvidenceBoardHref={buyerEvidenceBoardHref}
              />
            </Suspense>
          </div>
          <details className="hero-secondary-diligence" open={heroDiligenceOpen} onToggle={(event) => setHeroDiligenceOpen(event.currentTarget.open)}>
            <summary>
              <span>Buyer diligence lane</span>
              <strong>Review agent, replay, and external room</strong>
              <small>Open after the core proof repair path is underway.</small>
              <em>{heroDiligenceOpen ? "Hide tools" : "3 tools"}</em>
            </summary>
            {heroDiligenceOpen ? (
              <div className="hero-secondary-diligence-body">
                <Suspense
                  fallback={
                    <section className="hero-agent-card-audit is-loading" aria-busy="true" aria-label="Agent Card audit launcher">
                      <div className="hero-agent-card-audit-head">
                        <div>
                          <span>Agent Card audit</span>
                          <strong>Preparing buyer diligence launcher</strong>
                          <p>Loading Agent Card diligence, trial plan, and shortlist actions.</p>
                        </div>
                      </div>
                    </section>
                  }
                >
                  <HeroAgentCardAuditLauncher defaultUrl={defaultAgentCardAuditUrl} />
                </Suspense>
                <Suspense
                  fallback={
                    <section className={`hero-outcome-replay-strip is-${heroBuyerDecisionBrief.status} is-loading`} aria-busy="true" aria-label="First-screen buyer outcome replay">
                      <div className="hero-outcome-replay-strip-head">
                        <div>
                          <span>Buyer outcome replay</span>
                          <strong>Preparing replay receipt</strong>
                          <p>Loading buyer replay and receipt verification.</p>
                        </div>
                      </div>
                    </section>
                  }
                >
                  <HeroOutcomeReplayStrip brief={heroBuyerDecisionBrief} sensitivity={heroValueSensitivity} onCopyText={copyTextToClipboard} />
                </Suspense>
                <Suspense
                  fallback={
                    <section className={`homepage-external-review-dock is-${homepageReviewerHandoffKit.status}`} aria-busy="true" aria-label="External reviewer decision dock">
                      <div className="homepage-external-review-dock-main">
                        <span>External review room</span>
                        <strong>Preparing external reviewer decision path</strong>
                        <p>Loading the review kit, packet verifier, decision receipt, and acceptance path.</p>
                      </div>
                    </section>
                  }
                >
                  <HomepageExternalReviewerDockPanel artifact={homepageOutcomeArtifact} proofEntry={homepageProofEntry} reviewerKit={homepageReviewerHandoffKit} />
                </Suspense>
              </div>
            ) : null}
          </details>
        </div>
        <Suspense
          fallback={
            <section className="hero-workflow-intake-console is-loading" aria-busy="true" aria-label="Live workflow intake console">
              <div className="hero-workflow-intake-head">
                <div>
                  <span>Live workflow intake</span>
                  <strong>Preparing workflow analysis</strong>
                  <p>Reading workflow starters, source facts, readiness checks, and workspace apply path.</p>
                </div>
              </div>
            </section>
          }
        >
          <HeroWorkflowIntakeConsolePanel
            onApplyDraft={applyWorkflowIntakeDraft}
            buyerDecisionCockpitHref={buyerDecisionCockpitHref}
            launchEvidenceHref={launchEvidenceHref}
            buyerEvidenceBoardHref={buyerEvidenceBoardHref}
          />
        </Suspense>
      </section>

      <Suspense
        fallback={
          <section id="buyer-board-memo" className="homepage-buyer-board-memo is-attention" aria-busy="true" aria-label="Buyer board memo">
            <div className="homepage-buyer-board-memo-main">
              <div className="homepage-buyer-board-memo-copy">
                <span>Buyer board memo</span>
                <h2>Preparing buyer decision memo</h2>
                <p>Loading value, proof, packet, and receipt signals for the first buyer board readout.</p>
              </div>
            </div>
          </section>
        }
      >
        <HomepageBuyerBoardMemoPanel
          valueLens={homepageValueLens}
          proofEntry={homepageProofEntry}
          outcomeArtifact={homepageOutcomeArtifact}
          reviewerHandoffKit={homepageReviewerHandoffKit}
          onCopyText={copyTextToClipboard}
        />
      </Suspense>

      <section className="homepage-proof-command-stack" aria-label="Buyer proof command stack">
        <div className="homepage-proof-command-stack-head">
          <span>Proof workbench</span>
          <strong>Close the blockers that decide if this can be shared</strong>
          <p>The hero names the first usable output. This workbench verifies the public proof links, repairs blocked evidence, and exports buyer terms.</p>
        </div>
        <div className="homepage-proof-command-rail" aria-label="Proof workbench next actions">
          <button type="button" className={`homepage-proof-command-action is-${proofVerifyStatus}`} onClick={verifyBuyerProofLinks} disabled={proofVerifyStatus === "checking"}>
            <Activity size={15} />
            <span>Live proof</span>
            <strong>{proofWorkbenchVerifyLabel}</strong>
            <small>{proofWorkbenchVerifyLine}</small>
          </button>
          <a
            className={`homepage-proof-command-action is-${homepageShareGate.sendPacket.mode}`}
            href={homepageShareGate.primaryActionHref}
            target={proofWorkbenchShareActionExternal ? "_blank" : undefined}
            rel={proofWorkbenchShareActionExternal ? "noreferrer" : undefined}
          >
            <Crosshair size={15} />
            <span>Buyer send</span>
            <strong>{homepageShareGate.primaryActionLabel}</strong>
            <small>{proofWorkbenchShareLine}</small>
          </a>
          <a className={`homepage-proof-command-action is-${homepageRouteLock.status}`} href={buyerDecisionCockpitHref}>
            <ClipboardCheck size={15} />
            <span>Decision cockpit</span>
            <strong>Open buyer call</strong>
            <small>{homepageRouteLock.score}/100 route lock with response receipt</small>
          </a>
        </div>
        <div className="homepage-proof-command-stack-grid">
          <Suspense
            fallback={
              <div className="market-hero-output-strip is-loading" aria-busy="true" aria-label="Buyer-visible proof summary">
                <div className="market-hero-output-strip-head">
                  <div>
                    <span>Buyer-visible proof</span>
                    <em>Preparing live proof check and repair rows.</em>
                  </div>
                </div>
              </div>
            }
          >
            <MarketHeroProofSummary
              proofVerification={proofVerification}
              proofVerifyStatus={proofVerifyStatus}
              proofVerifyError={proofVerifyError}
              proofFields={BUYER_PILOT_PROOF_FIELDS}
              proofIntake={proofIntake}
              proofRepairDraft={proofRepairDraft}
              proofEntry={{
                status: homepageProofEntry.status,
                proofScore: homepageProofEntry.proofScore,
                readyCount: homepageProofEntry.readyCount,
                itemCount: homepageProofEntry.items.length,
                headline: homepageProofEntry.headline
              }}
              packet={{
                status: homepageOutcomeArtifact.packet.status,
                readyCount: homepageOutcomeArtifact.packet.readyCount,
                itemCount: homepageOutcomeArtifact.packet.itemCount,
                checksumAlgorithm: homepageOutcomeArtifact.packet.receipt.checksumAlgorithm,
                checksum: homepageOutcomeArtifact.packet.receipt.checksum
              }}
              route={{
                status: homepageRouteLock.status,
                score: homepageRouteLock.score,
                headline: homepageRouteLock.headline,
                operatorLine: homepageRouteLock.operatorLine,
                primaryAction: homepageRouteLock.primaryAction
              }}
              publicDecisionRoute={{
                status: homepageRouteLock.status,
                launchEvidenceHref,
                buyerEvidencePackHref: buyerDecisionCockpitHref,
                buyerEvidenceBoardHref
              }}
              shareGate={{
                readiness: homepageShareGate.readiness,
                mode: homepageShareGate.sendPacket.mode,
                score: homepageShareGate.score,
                decision: homepageShareGate.decision,
                blockerCount: homepageShareGate.blockerCount,
                watchCount: homepageShareGate.watchCount,
                primaryActionLabel: homepageShareGate.primaryActionLabel,
                primaryActionHref: homepageShareGate.primaryActionHref,
                primaryActionExternal: /^https?:\/\//i.test(homepageShareGate.primaryActionHref),
                checks: homepageShareGate.checks.map((check) => ({
                  id: check.id,
                  label: check.label,
                  status: check.status,
                  score: check.score,
                  evidence: check.evidence,
                  action: check.action,
                  href: check.href,
                  external: /^https?:\/\//i.test(check.href)
                })),
                repairPlan: {
                  status: homepageShareGate.repairPlan.status,
                  headline: homepageShareGate.repairPlan.headline,
                  summary: homepageShareGate.repairPlan.summary,
                  exportHref: homepageShareGate.repairPlan.exportHref,
                  items: homepageShareGate.repairPlan.items.map((item) => ({
                    id: item.id,
                    sequence: item.sequence,
                    label: item.label,
                    status: item.status,
                    owner: item.owner,
                    action: item.action,
                    evidence: item.evidence,
                    href: item.href,
                    unlock: item.unlock,
                    external: /^https?:\/\//i.test(item.href)
                  }))
                }
              }}
              onVerifyProofLinks={verifyBuyerProofLinks}
              onProofRepairDraftChange={(key, value) => updateProofRepairDraft(key as keyof BuyerPilotProofIntake, value)}
              onApplyProofRepairDraft={(key) => applyProofRepairDraft(key as keyof BuyerPilotProofIntake)}
            />
          </Suspense>
          <Suspense
            fallback={
              <section className="market-hero-acceptance-contract is-loading" aria-busy="true" aria-label="Buyer pilot acceptance contract">
                <div className="market-hero-acceptance-main">
                  <span>Acceptance contract</span>
                  <strong>Preparing buyer acceptance gates</strong>
                  <p>Loading scope, value, measured run, proof, data boundary, and commercial cap.</p>
                </div>
              </section>
            }
          >
            <MarketHeroAcceptanceContract
              workOrder={buyerWorkOrderInput}
              buyerScenario={buyerScenario}
              pilotRun={pilotRunInput}
              proofLinks={workflowIntakeProofLinks}
              proofVerification={proofVerification}
              workflowIntakeHref="#quick-workflow-intake"
              valueReportHref={buyerValueReportHref}
              measuredRunHref="#pilot-run-receipt"
              proofRoomHref={buyerProofRoomHref}
              launchRoomHref={launchRoomHref}
              proofFields={BUYER_PILOT_PROOF_FIELDS}
              proofIntake={proofIntake}
              proofRepairDraft={proofRepairDraft}
              proofVerifyStatus={proofVerifyStatus}
              onProofRepairDraftChange={(key, value) => updateProofRepairDraft(key as keyof BuyerPilotProofIntake, value)}
              onApplyProofRepairDraft={(key) => applyProofRepairDraft(key as keyof BuyerPilotProofIntake)}
              onVerifyProofLinks={verifyBuyerProofLinks}
              onCopyText={copyTextToClipboard}
            />
          </Suspense>
        </div>
      </section>

      <div className="workspace-tools-divider">
        <button
          type="button"
          className={`workspace-tools-toggle proof-detail-toggle is-${proofDetailOpen ? "open" : "closed"}`}
          aria-expanded={proofDetailOpen}
          onClick={() => setProofDetailOpen((value) => !value)}
        >
          <span>Proof detail</span>
          <strong>証明スコア・パケット検証・価値モデルの詳細ビュー</strong>
          <small>Proof transformation、value lens、reviewer kit、proof command surface などの詳細パネルを{proofDetailOpen ? "表示しています。" : "必要なときだけ開けます。"}</small>
          <em>{proofDetailOpen ? "閉じる" : "詳細を開く"}</em>
        </button>
      </div>
      {proofDetailOpen ? (
        <>
      <Suspense
        fallback={
          <aside className="proof-transformation-hero is-loading" aria-busy="true" aria-label="Proof transformation preview">
            <div className="proof-transform-head">
              <span>Proof transformation</span>
              <strong>Preparing proof diagnosis</strong>
              <p>Loading the current repair queue, proof score, and buyer-ready target state.</p>
            </div>
          </aside>
        }
      >
          <ProofTransformationHero
            transformation={proofTransformation}
            sampleBriefHref={sampleBuyerOutcomeBriefHref}
            workflowHref="#quick-workflow-intake"
            currentAuditHref={buyerProofAuditHref}
            onLoadSample={loadProofBackedSampleWorkspace}
          />
      </Suspense>

      <Suspense
        fallback={
          <section className="homepage-reference-bridge is-loading" aria-busy="true" aria-label="Reference mode bridge">
            <div className="homepage-reference-bridge-main">
              <span>Reference mode</span>
              <strong>Preparing buyer room unlock path</strong>
              <p>Loading the workflow, proof, and send-brief steps that turn the reference room into a buyer-owned room.</p>
            </div>
          </section>
        }
      >
        <HomepageReferenceModeBridge
          workspaceSource={workspaceSource}
          transformation={proofTransformation}
          workflowHref="#quick-workflow-intake"
          proofAuditHref={buyerProofAuditHref}
          sendBriefHref="#buyer-pilot-send-note"
          onLoadSample={loadProofBackedSampleWorkspace}
        />
      </Suspense>

      <section className="homepage-proof-workbench" aria-label="Buyer proof workbench">
        <Suspense
          fallback={
            <section className={`homepage-outcome-spine is-${homepageProofEntry.status}`} aria-busy="true" aria-label="First buyer decision route">
              <div className="homepage-outcome-spine-main">
                <span>Workflow-to-decision route</span>
                <strong>Preparing first buyer decision route</strong>
                <p>{homepageProofEntry.buyer} route is loading value, proof, packet, and reviewer decision checks.</p>
              </div>
            </section>
          }
        >
          <HomepageOutcomeSpinePanel
            valueLens={homepageValueLens}
            proofEntry={homepageProofEntry}
            outcomeArtifact={homepageOutcomeArtifact}
            publishability={homepagePublishabilitySnapshot}
            reviewerHandoffKit={homepageReviewerHandoffKit}
            launchIntegrity={{
              workspace: workspaceDraft,
              auditHref: buyerProofAuditHref,
              memoHref: buyerDeliveryMemoHref,
              manifestHref: buyerTrustManifestHref,
              roomHref: launchRoomHref,
              gateHref: productionHardeningHref,
              r: {
                f: BUYER_PILOT_PROOF_FIELDS,
                i: proofIntake,
                d: proofRepairDraft,
                s: proofVerifyStatus,
                od: updateProofRepairDraft as (key: string, value: string) => void,
                oa: applyProofRepairDraft as (key: string) => void | Promise<void>,
                ov: verifyBuyerProofLinks
              }
            }}
            onCopyText={copyTextToClipboard}
          />
        </Suspense>
        <Suspense
          fallback={
            <section className={`homepage-first-run-value-proof is-${homepageProofEntry.status}`} aria-busy="true" aria-label="First-run buyer value command">
              <div className="homepage-first-run-value-proof-main">
                <span>Buyer value command</span>
                <strong>Preparing buyer value command</strong>
                <p>{homepageProofEntry.buyer} command is loading value, proof, packet, and reviewer handoff checks.</p>
              </div>
            </section>
          }
        >
          <HomepageFirstRunValueProofCommandPanel
            valueLens={homepageValueLens}
            proofEntry={homepageProofEntry}
            outcomeArtifact={homepageOutcomeArtifact}
            reviewerHandoffKit={homepageReviewerHandoffKit}
            workspace={workspaceDraft}
            proofSampleWorkspace={proofSampleDraft}
            proofLinks={workflowIntakeProofLinks}
            proofVerification={proofVerification}
            proofVerifyStatus={proofVerifyStatus}
            proofVerifyError={proofVerifyError}
            onVerifyProofLinks={verifyBuyerProofLinks}
            onProofLinkChange={(id, value) => updateProofIntake({ [id]: value } as Partial<BuyerPilotProofIntake>)}
            onCopyText={copyTextToClipboard}
          />
        </Suspense>
        <Suspense
          fallback={
            <section className={`homepage-value-lens is-${homepageValueLens.status}`} aria-busy="true" aria-label="Homepage value lens">
              <div className="homepage-value-lens-main">
                <span>Value lens</span>
                <strong>Preparing value lens</strong>
              </div>
            </section>
          }
        >
          <HomepageValueLensPanel snapshot={homepageValueLens} onAssumptionChange={updateBuyerScenario} />
        </Suspense>
        <Suspense
          fallback={
            <section className={`homepage-hero-packet-verifier is-${homepageOutcomeArtifact.packet.status}`} aria-busy="true" aria-label="Live buyer packet verifier">
              <div className="homepage-hero-packet-verifier-main">
                <span>Live packet verifier</span>
                <strong>Preparing packet verification</strong>
                <p>
                  {homepageOutcomeArtifact.buyer} packet: {homepageOutcomeArtifact.packet.readyCount}/{homepageOutcomeArtifact.packet.itemCount} artifacts ready.
                </p>
              </div>
            </section>
          }
        >
          <HomepageHeroPacketVerifierPanel artifact={homepageOutcomeArtifact} proofEntry={homepageProofEntry} />
        </Suspense>
        <div className={cx("workspace-source-cue", `is-${workspaceSource}`)} aria-label="Workspace source">
          <span>{workspaceSource === "sample" ? "Reference room" : workspaceSource}</span>
        </div>
        <Suspense
          fallback={
            <section className={`homepage-hero-proof-route is-${homepageHeroProofRoute.status}`} aria-busy="true" aria-label="First buyer route">
              <div className="homepage-hero-proof-route-main">
                <span>Buyer approval loop</span>
                <strong>{homepageHeroProofRoute.headline}</strong>
                <p>{homepageHeroProofRoute.summary}</p>
              </div>
            </section>
          }
        >
          <HomepageHeroProofRoutePanel snapshot={homepageHeroProofRoute} />
        </Suspense>
        <HeroBuyerDecisionBriefPanel brief={heroBuyerDecisionBrief} onCopyText={copyTextToClipboard} />
        <Suspense
          fallback={
            <section className="hero-publishability-verdict is-attention" aria-busy="true" aria-label="Public release verdict">
              <div className="hero-publishability-main">
                <span>Public release verdict</span>
                <strong>Preparing public claim ledger</strong>
                <p>Checking buyer value, measured proof, public evidence, and operating guardrails.</p>
              </div>
            </section>
          }
        >
          <HeroPublishabilityVerdict snapshot={homepagePublishabilitySnapshot} reviewKitHref={buyerReviewKitHref} />
        </Suspense>
      </section>

      <Suspense
        fallback={
          <section id="homepage-proof-entry" className={`homepage-proof-entry is-${homepageProofEntry.status}`} aria-busy="true" aria-label="Homepage proof entry">
            <div className="homepage-proof-entry-main">
              <span>Proof-first entry</span>
              <strong>{homepageProofEntry.headline}</strong>
              <p>{homepageProofEntry.summary}</p>
            </div>
          </section>
        }
      >
        <HomepageProofEntryRailPanel snapshot={homepageProofEntry} />
      </Suspense>
        </>
      ) : null}

      <Suspense
        fallback={
          <section className="buyer-evidence-board is-loading" aria-busy="true" aria-label="Buyer evidence board">
            <div className="buyer-evidence-board-main">
              <span>Buyer evidence board</span>
              <strong>Preparing buyer evidence decision</strong>
              <p>Checking scope, value, measured run, live proof, agent trust, and decision route.</p>
            </div>
          </section>
        }
      >
        <BuyerEvidenceBoardPanel
          projectBrief={projectBrief}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          buyerWorkOrder={buyerWorkOrderInput}
          agentTrialEvidence={agentTrialEvidence}
          command={buyerPilotCommand}
          proofVerification={proofVerification}
          issuedAt={workspaceDraft.updatedAt}
          hrefs={buyerEvidenceBoardHrefs}
          onCopyText={copyTextToClipboard}
        />
      </Suspense>

      <Suspense
        fallback={
          <section id="quick-workflow-intake" className="quick-workflow-intake is-topline" aria-busy="true" aria-label="Quick workflow intake">
            <div className="quick-workflow-intake-main">
              <span>Start with your workflow</span>
              <strong>Preparing workflow intake</strong>
              <p>Loading the buyer workflow parser and room preview.</p>
            </div>
          </section>
        }
      >
        <QuickWorkflowIntakePanel
          currentOpenCount={proofTransformation.current.openCount}
          currentPrimaryAction={proofTransformation.current.primaryAction}
          launchRoomHref={launchRoomHref}
          reviewKitHref={buyerReviewKitHref}
          acceptancePathHref={buyerAcceptancePathHref}
          decisionReceiptHref={buyerDecisionReceiptHref}
          trustManifestHref={buyerTrustManifestHref}
          deliveryMemoHref={buyerDeliveryMemoHref}
          buyerEvidenceResponseTarget={homepageBuyerEvidenceResponseTarget}
          onApplyDraft={applyWorkflowIntakeDraft}
          onCopyText={copyTextToClipboard}
          variant="topline"
        />
      </Suspense>

      <Suspense
        fallback={
          <section className={`homepage-outcome-artifact is-${homepageOutcomeArtifact.status}`} aria-busy="true" aria-label="Buyer-facing artifact">
            <div className="homepage-outcome-artifact-main">
              <span>Buyer-facing artifact</span>
              <h2>Preparing buyer packet</h2>
              <p>{homepageOutcomeArtifact.valueClaim}</p>
            </div>
          </section>
        }
      >
        <HomepageOutcomeArtifactPanel snapshot={homepageOutcomeArtifact} onCopyText={copyTextToClipboard} />
      </Suspense>
      {proofDetailOpen ? (
        <>
      <Suspense
        fallback={
          <section className={`homepage-reviewer-kit is-${homepageReviewerHandoffKit.status}`} aria-busy="true" aria-label="Reviewer handoff kit">
            <div className="homepage-reviewer-kit-main">
              <span>Reviewer handoff kit</span>
              <h2>{homepageReviewerHandoffKit.headline}</h2>
              <p>{homepageReviewerHandoffKit.summary}</p>
            </div>
          </section>
        }
      >
        <HomepageReviewerHandoffKitPanel snapshot={homepageReviewerHandoffKit} onCopyText={copyTextToClipboard} />
      </Suspense>

      <BuyerProofCommandSurface
        transformation={proofTransformation}
        lock={homepageRouteLock}
        sampleBriefHref={sampleBuyerOutcomeBriefHref}
        sampleDeliveryMemoHref={sampleBuyerDeliveryMemoHref}
        sampleAuditHref={sampleBuyerProofAuditHref}
        sampleDecisionHref={sampleProcurementDecisionHref}
        currentAuditHref={buyerProofAuditHref}
        productionHardeningHref={productionHardeningHref}
        deliveryMemoHref={buyerDeliveryMemoHref}
        trustManifestHref={buyerTrustManifestHref}
        decisionFollowUpHref={buyerDecisionFollowUpHref}
        decisionReceiptHref={buyerDecisionReceiptHref}
        workflowIntakeHref="#quick-workflow-intake"
        agentCardDiligenceHref={agentCardDiligenceHref}
        agentCardShortlistHref={agentCardShortlistHref}
        agentCardTrialPlanHref={agentCardTrialPlanHref}
        agentCardTrialVerificationHref={agentCardTrialVerificationHref}
        launchRoomHref={launchRoomHref}
        evidenceTrace={homepageEvidenceTrace}
        evidenceTraceHref={buyerEvidenceTraceHref}
        buyerPilotCommand={buyerPilotCommand}
        globalLaunchSnapshot={buyerGlobalLaunchSnapshot}
        buyerScenario={buyerScenario}
        buyerScenarioInput={buyerScenarioInput}
        buyerWorkOrder={buyerWorkOrderInput}
        workspace={workspaceDraft}
        proofSampleWorkspace={proofSampleDraft}
        selectedAgents={recommendation.selected}
        agentTrialEvidence={agentTrialEvidence}
        measuredRun={pilotRunInput}
        measuredRunSummary={homeMeasuredRunSummary}
        proofVerification={proofVerification}
        proofVerifyStatus={proofVerifyStatus}
        proofVerifyError={proofVerifyError}
        valueReportHref={buyerValueReportHref}
        onBuyerScenarioChange={updateBuyerScenario}
        onBuyerWorkOrderChange={updateBuyerWorkOrder}
        onMeasuredRunChange={updateMeasuredRunIntake}
        onLoadSample={loadProofBackedSampleWorkspace}
        proofIntake={proofIntake}
        onProofIntakeChange={updateProofIntake}
        onApplyProofReplacement={applyProofReplacementAndVerify}
        onVerifyProofLinks={verifyBuyerProofLinks}
        onAttachTrialEvidence={attachAgentTrialEvidence}
        onCopyText={copyTextToClipboard}
      />

      <HomepageRouteLockStrip lock={homepageRouteLock} />
        </>
      ) : null}

      <div className="workspace-tools-divider">
        <button
          type="button"
          className={`workspace-tools-toggle is-${workspaceToolsOpen ? "open" : "closed"}`}
          aria-expanded={workspaceToolsOpen}
          onClick={() => setWorkspaceToolsOpen((value) => !value)}
        >
          <span>Full workspace</span>
          <strong>採用判断・パイロット・スポンサー連携の詳細ツール</strong>
          <small>Buyer journey、調達デシジョン、契約、価値シミュレーターなどの詳細パネルを{workspaceToolsOpen ? "表示しています。" : "必要なときだけ開けます。"}</small>
          <em>{workspaceToolsOpen ? "閉じる" : "ツールを開く"}</em>
        </button>
      </div>
      {workspaceToolsOpen ? (
        <>
      <DeferredSuspensePanel label="Buyer journey navigator" minHeight={420}>
        <BuyerJourneyNavigator
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          buyerWorkOrder={buyerWorkOrderInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>

      <DeferredSuspensePanel label="Procurement decision desk" minHeight={520}>
        <BuyerProcurementDecisionDesk
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          buyerScenarioInput={buyerScenarioInput}
          buyerWorkOrder={buyerWorkOrderInput}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
          onBuyerScenarioChange={updateBuyerScenario}
          onBuyerWorkOrderChange={updateBuyerWorkOrder}
          onPilotRunChange={updatePilotRun}
        />
      </DeferredSuspensePanel>

      <DeferredSuspensePanel label="Buyer outcome brief" minHeight={540}>
        <BuyerOutcomeBriefPanel
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          workspace={workspaceDraft}
          pilotRun={pilotRunInput}
          launchRoom={launchRoom}
          publicBriefHref={buyerOutcomeBriefHref}
          onCopyText={copyTextToClipboard}
        />
      </DeferredSuspensePanel>

      <BuyerPilotCommandCenter
        command={buyerPilotCommand}
        launchRoom={launchRoom}
        launchRoomHref={launchRoomHref}
        decisionReceiptHref={buyerDecisionReceiptHref}
        reviewKitHref={buyerReviewKitHref}
        acceptancePathHref={buyerAcceptancePathHref}
        evidenceTraceHref={buyerEvidenceTraceHref}
        buyerShareGateHref={buyerShareGateHref}
        buyerProofMonitorHref={buyerProofMonitorHref}
        buyerProofRecoveryHref={buyerProofRecoveryHref}
        buyerScenario={buyerScenario}
        buyerScenarioInput={buyerScenarioInput}
        proofIntake={proofIntake}
        proofRepairDraft={proofRepairDraft}
        measuredRun={pilotRunInput}
        proofVerification={proofVerification}
        copyStatus={launchRoomCopyStatus}
        proofVerifyStatus={proofVerifyStatus}
        proofVerifyError={proofVerifyError}
        onBuyerScenarioChange={updateBuyerScenario}
        onProofIntakeChange={updateProofIntake}
        onProofRepairDraftChange={updateProofRepairDraft}
        onApplyProofRepairDraft={applyProofRepairDraft}
        onMeasuredRunChange={updateMeasuredRunIntake}
        onVerifyProofLinks={verifyBuyerProofLinks}
        onCopyLaunchRoomLink={copyLaunchRoomLink}
        onCopyText={copyTextToClipboard}
      />

      <DeferredSuspensePanel label="Launch evidence console" minHeight={520}>
        <LaunchEvidenceConsole
          recommendation={recommendation}
          projectBrief={projectBrief}
          proofFields={BUYER_PILOT_PROOF_FIELDS}
          proofIntake={proofIntake}
          proofVerification={proofVerification}
          proofVerifyStatus={proofVerifyStatus}
          proofVerifyError={proofVerifyError}
          agentTrialEvidence={agentTrialEvidence}
          onProofIntakeChange={updateProofIntake}
          onVerifyProofLinks={verifyBuyerProofLinks}
          publicReportHref={launchEvidenceHref}
        />
      </DeferredSuspensePanel>

      <DeferredSuspensePanel label="Global launch audit" minHeight={560}>
        <GlobalLaunchAuditPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          buyerWorkOrder={buyerWorkOrderInput}
          workspace={workspaceDraft}
          launchRoom={launchRoom}
          publicAuditHref={globalAuditHref}
          publicDossierHref={globalProofDossierHref}
          publicPublishabilityHref={globalPublishabilityHref}
          onCopyText={copyTextToClipboard}
          onProofVerification={applyProofVerification}
        />
      </DeferredSuspensePanel>

      <DeferredSuspensePanel label="Outcome snapshot panel" minHeight={360}>
        <OutcomeSnapshotPanel
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          workspace={workspaceDraft}
          pilotRun={pilotRunInput}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Buyer work order studio" minHeight={520}>
        <BuyerWorkOrderStudioPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          workOrder={buyerWorkOrderInput}
          onChange={updateBuyerWorkOrder}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <BlueprintTemplatePicker activeTemplateId={activeTemplateId} onApply={applyBlueprintTemplate} />
      <WorkspaceStatusBar
        draft={workspaceDraft}
        selectedCount={recommendation.selected.length}
        shareHref={shareHref}
        launchRoomHref={launchRoomHref}
        evidenceBoardHref={buyerEvidenceBoardHref}
        proofAuditHref={buyerProofAuditHref}
        publicReviewHref={globalPublishabilityHref}
        importedFromShare={importedFromShare}
        shareStatus={shareStatus}
        importStatus={workspaceImportStatus}
        importMessage={workspaceImportMessage}
        onCopyShareLink={copyShareLink}
        onImportWorkspace={importWorkspaceFile}
        onReset={resetWorkspace}
      />
      <DeferredSuspensePanel label="Sponsor handoff panel" minHeight={420}>
        <SponsorHandoffPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          buyerWorkOrder={buyerWorkOrderInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
          shareHref={shareHref}
          onCopyText={copyTextToClipboard}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Sponsor review room panel" minHeight={520}>
        <SponsorReviewRoomPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Buyer proof packet panel" minHeight={520}>
        <BuyerProofPacketPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Launch command queue panel" minHeight={460}>
        <LaunchCommandQueuePanel buyerScenario={buyerScenario} squadOptimizer={squadOptimizer} workspace={workspaceDraft} onCopyText={copyTextToClipboard} />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Pilot proposal panel" minHeight={520}>
        <PilotProposalPanel projectBrief={projectBrief} recommendation={recommendation} valueBlueprint={valueBlueprint} buyerScenario={buyerScenario} workspace={workspaceDraft} customAgents={customAgents} />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Buyer diligence panel" minHeight={520}>
        <BuyerDiligencePanel projectBrief={projectBrief} recommendation={recommendation} valueBlueprint={valueBlueprint} buyerScenario={buyerScenario} workspace={workspaceDraft} customAgents={customAgents} />
      </DeferredSuspensePanel>
      <ValueBlueprintPanel blueprint={valueBlueprint} />
      <DeferredSuspensePanel label="Pilot workflow panel" minHeight={520}>
        <PilotWorkflowPanel projectBrief={projectBrief} recommendation={recommendation} valueBlueprint={valueBlueprint} buyerScenario={buyerScenario} workspace={workspaceDraft} customAgents={customAgents} />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Pilot run receipt panel" minHeight={520}>
        <PilotRunReceiptPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
          onChange={updatePilotRun}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Buyer decision matrix panel" minHeight={520}>
        <BuyerDecisionMatrixPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Pilot agreement panel" minHeight={520}>
        <PilotAgreementPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Pilot evidence ledger panel" minHeight={520}>
        <PilotEvidenceLedgerPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Adoption operating plan panel" minHeight={520}>
        <AdoptionOperatingPlanPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          buyerWorkOrder={buyerWorkOrderInput}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Buyer trust center panel" minHeight={520}>
        <BuyerTrustCenterPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          buyerWorkOrder={buyerWorkOrderInput}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Commercial offer panel" minHeight={520}>
        <CommercialOfferPanel
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          buyerScenario={buyerScenario}
          buyerWorkOrder={buyerWorkOrderInput}
          pilotRun={pilotRunInput}
          workspace={workspaceDraft}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Buyer value simulator" minHeight={720}>
        <BuyerValueSimulatorPanel
          scenario={buyerScenario}
          onChange={updateBuyerScenario}
          projectBrief={projectBrief}
          recommendation={recommendation}
          valueBlueprint={valueBlueprint}
          workspace={workspaceDraft}
          pilotRun={pilotRunInput}
          customAgents={customAgents}
        />
      </DeferredSuspensePanel>
      <SquadDecisionBoard optimizer={squadOptimizer} onApply={applySquad} />
        </>
      ) : null}

      <section id="marketplace-workbench" className="workbench">
        <Suspense
          fallback={
            <section className="workflow-intake workflow-intake-placeholder" aria-busy="true" aria-label="Workflow intake">
              <div className="workflow-intake-head">
                <div>
                  <span className="eyebrow">Workflow intake</span>
                  <h2>
                    <Workflow size={19} />
                    Loading buyer intake
                  </h2>
                </div>
              </div>
            </section>
          }
        >
          <BuyerWorkflowIntakePanelLazy
            projectBrief={projectBrief}
            workOrder={buyerWorkOrderInput}
            buyerScenario={buyerScenario}
            buyerScenarioInput={buyerScenarioInput}
            pilotRun={pilotRunInput}
            proofLinks={workflowIntakeProofLinks}
            proofVerification={proofVerification}
            proofVerifyStatus={proofVerifyStatus}
            proofVerifyError={proofVerifyError}
            launchRoomHref={launchRoomHref}
            buyerProofAuditHref={buyerProofAuditHref}
            buyerDeliveryMemoHref={buyerDeliveryMemoHref}
            buyerTrustManifestHref={buyerTrustManifestHref}
            buyerDecisionReceiptHref={buyerDecisionReceiptHref}
            onApplyBrief={updateProjectBrief}
            onProofLinkChange={(id, value) => updateProofIntake({ [id]: value } as Partial<BuyerPilotProofIntake>)}
            onVerifyProofLinks={verifyBuyerProofLinks}
            onCopyText={copyTextToClipboard}
            onWorkOrderChange={updateBuyerWorkOrder}
            onBuyerScenarioChange={updateBuyerScenario}
            onPilotRunChange={updatePilotRun}
          />
        </Suspense>
        <aside className="panel brief-panel">
          <div className="panel-heading">
            <h2>
              <GitBranch size={18} />
              Project Brief
            </h2>
            <span className="chip">brief2dev</span>
          </div>
          <textarea value={projectBrief} onChange={(event) => updateProjectBrief(event.target.value)} aria-label="Project brief" />
          <div className="matched-terms">
            {recommendation.profile.matchedTerms.map((term) => (
              <span key={term}>{term}</span>
            ))}
          </div>
          <div className="filter-block">
            <label htmlFor="agent-search">
              <Search size={16} />
              Search
            </label>
            <input id="agent-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="A2A / Cloud Run / UX" />
          </div>
          <div className="stage-tabs" role="tablist" aria-label="Agent stage filter">
            {Object.entries(STAGE_LABELS).map(([id, label]) => (
              <button key={id} className={stageFilter === id ? "active" : ""} onClick={() => setStageFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="requirement-stack">
            <div>
              <Cloud size={18} />
              <span>Cloud Run ready</span>
            </div>
            <div>
              <Sparkles size={18} />
              <span>Gemini 3.5 Flash</span>
            </div>
            <div>
              <Network size={18} />
              <span>A2A Agent Card</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>No-key fallback</span>
            </div>
          </div>
        </aside>

        <section className="market-panel">
          <div className="market-toolbar">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h2>Evaluate agent capability</h2>
            </div>
            <div className="toolbar-badges">
              <span>Remaining {recommendation.remainingBudget}</span>
              <span>Selected {recommendation.selected.length}</span>
            </div>
          </div>
          <div className="agent-grid">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedIds.includes(agent.id)}
                buyerProofSignal={buildAgentBuyerProofSignal({
                  agent,
                  selected: selectedIds.includes(agent.id),
                  evidenceRecords: agentTrialEvidence,
                  trialPlanHref: agentCardTrialPlanHref,
                  diligenceHref: agentCardDiligenceHref
                })}
                onToggle={toggleAgent}
              />
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <DeferredSuspensePanel label="Agent Card intake panel" minHeight={260}>
            <AgentCardIntakePanel
              customAgents={customAgents}
              onImport={importCustomAgent}
              onRemove={removeCustomAgent}
              onCopyText={copyTextToClipboard}
              onAttachTrialEvidence={attachAgentTrialEvidence}
              attachedEvidenceIds={agentTrialEvidence.map((record) => record.id)}
              workspace={workspaceDraft}
            />
          </DeferredSuspensePanel>
          <SquadPanel
            recommendation={recommendation}
            buyerWorkOrder={buyerWorkOrderInput}
            agentTrialEvidence={agentTrialEvidence}
            trialPlanHref={agentCardTrialPlanHref}
            workflowIntakeHref="#quick-workflow-intake"
            onCopyText={copyTextToClipboard}
          />
          <A2APanel recommendation={recommendation} />
        </aside>
      </section>

      {workspaceToolsOpen ? (
        <>
      <DeferredSuspensePanel label="Contract desk" minHeight={420}>
        <ContractDesk recommendation={recommendation} projectBrief={projectBrief} />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Strategy war room" minHeight={520}>
        <StrategyWarRoom strategy={strategy} onHire={toggleAgent} />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Mission control" minHeight={420}>
        <MissionControl recommendation={recommendation} projectBrief={projectBrief} />
      </DeferredSuspensePanel>
      <DeferredSuspensePanel label="Ops drill panel" minHeight={420}>
        <OpsDrillPanel recommendation={recommendation} projectBrief={projectBrief} />
      </DeferredSuspensePanel>
        </>
      ) : null}

      <section className="lower-grid">
        <GeminiPanel recommendation={recommendation} projectBrief={projectBrief} />
        <section className="panel mcp-panel">
          <div className="panel-heading">
            <h2>
              <Network size={18} />
              MCP Matrix
            </h2>
            <span className="chip">{recommendation.mcpMatrix.length} servers</span>
          </div>
          <div className="mcp-table">
            {recommendation.mcpMatrix.map((row) => (
              <div key={`${row.agent}-${row.mcp}`}>
                <strong>{row.mcp}</strong>
                <span>{row.agent}</span>
                <div className="meter" data-tone={scoreTone(row.maturity)}>
                  <span style={{ width: `${row.maturity}%` }} />
                </div>
                <small>{row.tools.join(" / ")}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel plan-panel">
          <div className="panel-heading">
            <h2>
              <CheckCircle2 size={18} />
              DevOps Loop
            </h2>
            <span className="chip">Cloud Run</span>
          </div>
          <ol>
            {recommendation.devopsPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <AgentCardJson />
      </section>

      <JudgeFirstClickStrip />
      <section className="panel judge-tools-link-panel">
        <div className="panel-heading">
          <h2>
            <GitBranch size={18} />
            External reviewer proof shelf
          </h2>
          <span className="chip">brief2dev</span>
        </div>
        <p>
          公開ロック、公開URL監視、競合比較、レビュー用証拠など{JUDGE_EVIDENCE_PANELS.length}件の審査員向けツールを、買い手向けデモとは別ページにまとめました。
        </p>
        <a className="icon-link" href="/judge-tools">
          審査員向けツールを開く →
        </a>
      </section>
    </main>
  );
}
