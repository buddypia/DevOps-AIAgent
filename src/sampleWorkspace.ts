import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import {
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
} from "./sampleProofPaths.js";
import { SUBMISSION_PROOF, validProtoPediaUrl, validVideoUrl } from "./submission.js";
import type { MarketAgent } from "./types.js";
import { buildWorkspaceDraft, type WorkspaceDraft } from "./workspaceDraft.js";

export {
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
} from "./sampleProofPaths.js";

export const SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID = "custom-buyer-proof-operator";
const SAMPLE_AGENT_IDS = ["market-broker", "cloud-run-sre", "security-sentinel", "test-forge", SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID];

const sampleBrief = [
  "Global AI agent product for platform teams.",
  "Needs Cloud Run deployment, Agent Card discovery, A2A delegation, health checks, rollback rules, and a clear buyer-ready operating plan.",
  "This sample workspace shows the difference between a generic prototype and buyer proof: public deployment, accepted A2A trial receipts, measured pilot minutes, work-order proof, and explicit publication gaps until the public story and walkthrough video are published."
].join("\n");

const sampleBuyerScenario = {
  teamSize: 8,
  hourlyCostYen: 12000,
  cyclesPerMonth: 5,
  manualHoursPerCycle: 28,
  adoptionRatePercent: 75,
  incidentRiskYenPerMonth: 240000
};

const samplePilotRun = {
  observedManualMinutes: 1680,
  observedAssistedMinutes: 420,
  participants: 4,
  acceptedTasks: 3,
  totalTasks: 3,
  reviewerName: "Platform sponsor",
  notes: "Sample measured run: one release-readiness review was replayed manually and with the AI squad, then accepted by the platform sponsor."
};

const sampleBuyerWorkOrder = {
  request: "Turn one Cloud Run release-readiness review into a buyer proof packet with owners, A2A receipt, launch evidence, and a continue/revise/stop decision.",
  targetUser: "Platform / DevOps Lead",
  successMetric: "Approve the bounded pilot only when measured time saved, live proof links, and operating gates are visible from one public room.",
  currentBaseline: "Release proof is collected manually from scattered notes, CI links, Cloud Run checks, and reviewer comments.",
  dataSensitivity: "public" as const
};

const sampleBuyerProofOperatorAgent: MarketAgent = {
  id: SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID,
  name: "Buyer Proof Operator",
  handle: "契約証跡オペレーター",
  stage: "operate",
  rarity: "legendary",
  price: 42,
  headline: "Cloud Run evidence, buyer proof, and pilot contract handoff are sealed before sending",
  outcome: "Keeps the sample launch room, proof links, stop rule, and buyer contract aligned for external review",
  color: "#275b52",
  accent: "#c6f1dc",
  capabilities: {
    autonomy: 88,
    planning: 90,
    code: 78,
    testing: 92,
    cloudRun: 94,
    security: 90,
    observability: 96,
    ux: 88,
    mcp: 88,
    a2a: 92
  },
  skills: [
    {
      id: "buyer-proof-orchestration",
      label: "Buyer proof orchestration",
      proof: "Aligns story, walkthrough, measured receipt, work order, and accepted A2A trials.",
      score: 94
    },
    {
      id: "launch-readiness",
      label: "Launch readiness",
      proof: "Checks Cloud Run, tests, security boundary, observability, and rollback before global traffic.",
      score: 93
    },
    {
      id: "sendable-contract",
      label: "Sendable contract",
      proof: "Turns proof, price, milestones, acceptance rule, and stop rule into a buyer-inspectable handoff.",
      score: 91
    }
  ],
  mcp: [
    {
      name: "buyer-proof-room",
      tools: ["verify_links", "seal_contract", "export_handoff"],
      maturity: 90
    }
  ],
  a2aSkillIds: ["buyer.proof.seal", "contract.handoff", "global.launch.audit"],
  synergyTags: ["buyer-proof", "cloud-run", "trust", "contract", "a2a", "operate"]
};

function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function sampleTrialEvidence(baseUrl: string, updatedAt: string): AgentTrialEvidenceRecord[] {
  const agentCardUrl = `${baseUrl}/.well-known/agent-card.json`;
  return [
    {
      id: "sample-trial-cloud-run-sre",
      receiptId: "sample-cloud-run-release-proof",
      agentId: "cloud-run-sre",
      agentName: "Cloud Run SRE",
      skillId: "cloud-run.release-proof",
      status: "accepted",
      score: 94,
      artifactUrl: agentCardUrl,
      evidenceSource: "Sample public Agent Card and release-readiness route",
      headline: "Cloud Run launch proof accepted",
      summary: "Cloud Run SRE verifies health, rollout, rollback, and public Agent Card availability for the sample launch.",
      attachedAt: updatedAt
    },
    {
      id: "sample-trial-security-sentinel",
      receiptId: "sample-security-boundary-proof",
      agentId: "security-sentinel",
      agentName: "Security Sentinel",
      skillId: "security.boundary-review",
      status: "accepted",
      score: 91,
      artifactUrl: agentCardUrl,
      evidenceSource: "Sample public Agent Card and security boundary route",
      headline: "Security boundary proof accepted",
      summary: "Security Sentinel verifies public inputs, secret boundaries, and external-safe proof artifacts for the sample launch.",
      attachedAt: updatedAt
    }
  ];
}

export type SampleWorkspaceSubmissionProof = {
  protopediaUrl?: string;
  videoUrl?: string;
};

function sampleProofVerification(checkedAt: string, submissionProof: Required<SampleWorkspaceSubmissionProof>): BuyerShareGateProofVerificationSummary {
  const results: BuyerShareGateProofVerificationSummary["results"] = [
    {
      id: "targetUrl",
      label: "Deployed URL",
      status: "pass",
      httpStatus: 200,
      evidence: "Sample Cloud Run URL is attached as the live product surface.",
      action: "Replace this with your own deployed Cloud Run URL before external sharing."
    },
    {
      id: "pilotEvidenceUrl",
      label: "Pilot receipt",
      status: "pass",
      httpStatus: 200,
      evidence: "Sample pilot receipt URL is attached for measured-run inspection.",
      action: "Replace this with the first real buyer pilot receipt."
    },
    {
      id: "workOrderEvidenceUrl",
      label: "Work order proof",
      status: "pass",
      httpStatus: 200,
      evidence: "Sample work order proof URL is attached for scope inspection.",
      action: "Replace this with the buyer-approved work order."
    },
    submissionProof.protopediaUrl
      ? {
          id: "protopediaUrl",
          label: "ProtoPedia URL",
          status: "pass",
          httpStatus: 200,
          evidence: "Published public story URL is attached for external review.",
          action: "Keep the published public story page reachable."
        }
      : {
          id: "protopediaUrl",
          label: "ProtoPedia URL",
          status: "block",
          httpStatus: 0,
          evidence: "Published public story URL is not configured yet.",
          action: "Publish the public story page and attach its https://protopedia.net URL."
        },
    submissionProof.videoUrl
      ? {
          id: "videoUrl",
          label: "Walkthrough video",
          status: "pass",
          httpStatus: 200,
          evidence: "Public walkthrough video URL is attached for first-review inspection.",
          action: "Keep the public walkthrough video reachable."
        }
      : {
          id: "videoUrl",
          label: "Walkthrough video",
          status: "block",
          httpStatus: 0,
          evidence: "Public walkthrough video URL is not configured yet.",
          action: "Publish an unlisted or public YouTube/Vimeo walkthrough and attach its URL."
        }
  ];
  const verifiedCount = results.filter((result) => result.status === "pass").length;
  const scoreByStatus = { pass: 100, watch: 66, block: 22 };

  return {
    checkedAt,
    verifiedCount,
    totalCount: results.length,
    score: Math.round(results.reduce((sum, result) => sum + scoreByStatus[result.status], 0) / Math.max(1, results.length)),
    results
  };
}

export function buildProofBackedSampleWorkspaceDraft(
  updatedAt = new Date().toISOString(),
  baseUrl: string = SUBMISSION_PROOF.deployedUrl,
  submissionProof: SampleWorkspaceSubmissionProof = SUBMISSION_PROOF
): WorkspaceDraft {
  const cleanBase = cleanBaseUrl(baseUrl);
  const pilotReceiptUrl = `${cleanBase}${SAMPLE_PILOT_RECEIPT_PATH}`;
  const workOrderEvidenceUrl = `${cleanBase}${SAMPLE_WORK_ORDER_PATH}`;
  const protopediaStoryUrl = validProtoPediaUrl(submissionProof.protopediaUrl) ? submissionProof.protopediaUrl?.trim() || "" : "";
  const walkthroughVideoUrl = validVideoUrl(submissionProof.videoUrl) ? submissionProof.videoUrl?.trim() || "" : "";
  const proofVerification = sampleProofVerification(updatedAt, { protopediaUrl: protopediaStoryUrl, videoUrl: walkthroughVideoUrl });

  return buildWorkspaceDraft({
    activeTemplateId: "platform-launch",
    projectBrief: sampleBrief,
    selectedAgentIds: SAMPLE_AGENT_IDS,
    customAgents: [sampleBuyerProofOperatorAgent],
    agentTrialEvidence: sampleTrialEvidence(cleanBase, updatedAt),
    buyerScenario: sampleBuyerScenario,
    pilotRun: {
      ...samplePilotRun,
      evidenceUrl: pilotReceiptUrl
    },
    buyerWorkOrder: {
      ...sampleBuyerWorkOrder,
      evidenceUrl: workOrderEvidenceUrl
    },
    targetUrl: cleanBase,
    protopediaUrl: protopediaStoryUrl,
    videoUrl: walkthroughVideoUrl,
    proofVerification,
    updatedAt
  });
}
