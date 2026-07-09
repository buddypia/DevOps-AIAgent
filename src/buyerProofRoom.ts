import type { BuyerPilotContract } from "./buyerPilotContract.js";
import type { BuyerProofVerifierReport } from "./buyerProofVerifier.js";
import type {
  BuyerTrustManifest,
  BuyerTrustManifestArtifact,
  BuyerTrustManifestArtifactId,
  BuyerTrustManifestReceipt,
  BuyerTrustManifestStatus
} from "./buyerTrustManifest.js";
export { BUYER_PROOF_ROOM_PATH } from "./buyerProofRoomPath.js";
export const BUYER_PROOF_ROOM_MANIFEST_AT_PARAM = "roomGeneratedAt";

export type BuyerProofRoomReadiness = "ready-to-send" | "needs-review" | "blocked";

export type BuyerProofRoomDecision = {
  id: "trust" | "approval" | "first-action" | "verification";
  label: string;
  status: BuyerTrustManifestStatus;
  answer: string;
  evidence: string;
  href: string;
};

export type BuyerProofRoomAction = {
  id: "first-action" | "verify-proof" | "open-contract" | "receipt-desk";
  label: string;
  href: string;
  status: BuyerTrustManifestStatus;
  detail: string;
};

export type BuyerProofRoomReviewerBrief = {
  id: "economic-buyer" | "security-reviewer" | "launch-operator";
  label: string;
  status: BuyerTrustManifestStatus;
  question: string;
  answer: string;
  evidence: string;
  handoff: string;
  stopRule: string;
  href: string;
};

export type BuyerProofRoomDecisionHandoffChoice = "continue" | "revise" | "stop";

export type BuyerProofRoomDecisionHandoffStep = {
  id: "review-kit" | "decision-receipt" | "acceptance-path";
  label: string;
  status: BuyerTrustManifestStatus;
  href: string;
  evidence: string;
  action: string;
};

export type BuyerProofRoomDecisionHandoff = {
  status: BuyerProofRoomReadiness;
  recommendedDecision: BuyerProofRoomDecisionHandoffChoice;
  headline: string;
  summary: string;
  stopRule: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  steps: BuyerProofRoomDecisionHandoffStep[];
};

export type BuyerProofRoomMetric = {
  label: string;
  value: string;
  status: BuyerTrustManifestStatus;
};

export type BuyerProofRoomRepairStep = {
  id: string;
  label: string;
  status: BuyerTrustManifestStatus;
  priority: "now" | "next" | "verify";
  owner: string;
  href: string;
  evidence: string;
  action: string;
  doneSignal: string;
  source: "publication-gate" | "proof-verifier" | "contract";
};

export type BuyerProofRoomRepairPlan = {
  status: BuyerProofRoomReadiness;
  headline: string;
  summary: string;
  firstAction: string;
  firstActionHref: string;
  blockedCount: number;
  watchCount: number;
  stepCount: number;
  steps: BuyerProofRoomRepairStep[];
};

export type BuyerProofRoomOwnerPacketItem = {
  id: string;
  status: BuyerTrustManifestStatus;
  priority: BuyerProofRoomRepairStep["priority"];
  owner: string;
  command: string;
  proofToAttach: string;
  doneSignal: string;
  href: string;
  source: BuyerProofRoomRepairStep["source"];
};

export type BuyerProofRoomOwnerPacket = {
  status: BuyerProofRoomReadiness;
  headline: string;
  currentOwner: string;
  currentCommand: string;
  sendRule: string;
  escalationRule: string;
  blockedCount: number;
  watchCount: number;
  itemCount: number;
  additionalItemCount: number;
  items: BuyerProofRoomOwnerPacketItem[];
  copyText: string;
  href: string;
};

export type BuyerProofRoomLinks = {
  roomUrl: string;
  jsonUrl: string;
  markdownUrl: string;
  trustManifestUrl: string;
  trustManifestJsonUrl: string;
  proofVerifierUrl: string;
  proofVerifierApiUrl: string;
  pilotContractUrl: string;
  receiptVerifierUrl: string;
  decisionReceiptUrl: string;
  reviewKitUrl: string;
  acceptancePathUrl: string;
  appUrl: string;
  heroImageUrl?: string;
};

export type BuyerProofRoom = {
  id: string;
  generatedAt: string;
  subject: string;
  readiness: BuyerProofRoomReadiness;
  headline: string;
  summary: string;
  decision: string;
  metrics: BuyerProofRoomMetric[];
  reviewerDecisions: BuyerProofRoomDecision[];
  reviewerBriefs: BuyerProofRoomReviewerBrief[];
  decisionHandoff: BuyerProofRoomDecisionHandoff;
  ownerPacket: BuyerProofRoomOwnerPacket;
  actions: BuyerProofRoomAction[];
  repairPlan: BuyerProofRoomRepairPlan;
  evidenceLanes: BuyerTrustManifestArtifact[];
  receipts: BuyerTrustManifestReceipt[];
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
  verificationRequestJson: string;
  exportMarkdown: string;
};

const PRIORITY_ARTIFACT_IDS: BuyerTrustManifestArtifactId[] = [
  "value-report",
  "proof-packet",
  "buyer-pilot-contract",
  "trust-center",
  "commercial-offer",
  "live-proof-audit"
];

function escapeHtml(value: unknown) {
  return String(value ?? "")
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

function statusFromRoom(readiness: BuyerProofRoomReadiness): BuyerTrustManifestStatus {
  if (readiness === "ready-to-send") return "pass";
  if (readiness === "needs-review") return "watch";
  return "block";
}

function tone(status: BuyerTrustManifestStatus | BuyerProofRoomReadiness) {
  if (status === "pass" || status === "ready-to-send") return "good";
  if (status === "block" || status === "blocked") return "bad";
  return "watch";
}

function readinessFrom(input: {
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
}): BuyerProofRoomReadiness {
  if (input.manifest.publicationGate.decision === "hold" || input.proofVerifier.status === "blocked" || input.pilotContract.readiness === "blocked") {
    return "blocked";
  }
  if (input.manifest.publicationGate.decision === "publish" && input.proofVerifier.status === "verified" && input.pilotContract.readiness === "contract-ready") {
    return "ready-to-send";
  }
  return "needs-review";
}

function headlineFor(readiness: BuyerProofRoomReadiness) {
  if (readiness === "ready-to-send") return "The buyer proof room can be sent";
  if (readiness === "needs-review") return "The buyer proof room needs final review";
  return "This buyer proof room is not ready to send";
}

function summaryFor(readiness: BuyerProofRoomReadiness) {
  if (readiness === "ready-to-send") return "Inspect value, contract, trust, receipts, and verifier results from one public URL.";
  if (readiness === "needs-review") return "The proof is authentic, but at least one buyer-facing condition still needs review.";
  return "A blocked proof, contract, or publication gate keeps this room internal.";
}

function decisionFor(input: {
  readiness: BuyerProofRoomReadiness;
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
}) {
  if (input.readiness === "ready-to-send") return input.pilotContract.approvalMemo.sendLine;
  if (input.readiness === "needs-review") return input.manifest.publicationGate.firstAction;
  return input.proofVerifier.nextActions[0] ?? input.manifest.publicationGate.firstAction;
}

function metricStatus(value: string): BuyerTrustManifestStatus {
  if (["publish", "verified", "contract-ready", "external-ready", "ready-to-send"].includes(value)) return "pass";
  if (["hold", "blocked"].includes(value)) return "block";
  return "watch";
}

function buildMetrics(input: {
  readiness: BuyerProofRoomReadiness;
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
}): BuyerProofRoomMetric[] {
  const passingReceipts = input.manifest.receipts.filter((receipt) => receipt.status === "pass").length;
  return [
    { label: "Room", value: input.readiness, status: statusFromRoom(input.readiness) },
    { label: "Manifest", value: `${input.manifest.score}/100`, status: metricStatus(input.manifest.readiness) },
    { label: "Verifier", value: `${input.proofVerifier.score}/100`, status: metricStatus(input.proofVerifier.status) },
    { label: "Contract", value: `${input.pilotContract.contractScore}/100`, status: metricStatus(input.pilotContract.readiness) },
    { label: "Receipts", value: `${passingReceipts}/${input.manifest.receipts.length}`, status: passingReceipts === input.manifest.receipts.length ? "pass" : "watch" }
  ];
}

function buildReviewerDecisions(input: {
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
}): BuyerProofRoomDecision[] {
  const upstreamReceiptCheck = input.proofVerifier.checks.find((check) => check.id === "upstream-receipts");
  return [
    {
      id: "trust",
      label: "Can the buyer trust it?",
      status: metricStatus(input.proofVerifier.status),
      answer: input.proofVerifier.operatorLine,
      evidence: upstreamReceiptCheck?.evidence ?? `Verifier status is ${input.proofVerifier.status}.`,
      href: input.links.proofVerifierUrl
    },
    {
      id: "approval",
      label: "What is being approved?",
      status: metricStatus(input.pilotContract.readiness),
      answer: input.pilotContract.approvalMemo.sendLine,
      evidence: input.pilotContract.hardTruth,
      href: input.links.pilotContractUrl
    },
    {
      id: "first-action",
      label: "What must happen next?",
      status: input.manifest.publicationGate.decision === "hold" ? "block" : input.manifest.publicationGate.decision === "repair" ? "watch" : "pass",
      answer: input.manifest.publicationGate.firstAction,
      evidence: `${input.manifest.publicationGate.blockedCount} block and ${input.manifest.publicationGate.watchCount} watch checks.`,
      href: input.manifest.publicationGate.firstActionHref
    },
    {
      id: "verification",
      label: "What can be verified?",
      status: "pass",
      answer: `${input.manifest.receipts.length} receipts and ${input.manifest.artifacts.length} artifacts are indexed by digest ${input.manifest.verification.digest}.`,
      evidence: input.manifest.verification.instruction,
      href: input.links.trustManifestUrl
    }
  ];
}

function buildActions(input: {
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
}): BuyerProofRoomAction[] {
  return [
    {
      id: "first-action",
      label: "Open first action",
      href: input.manifest.publicationGate.firstActionHref,
      status: input.manifest.publicationGate.decision === "hold" ? "block" : input.manifest.publicationGate.decision === "repair" ? "watch" : "pass",
      detail: input.manifest.publicationGate.firstAction
    },
    {
      id: "verify-proof",
      label: "Verify proof",
      href: input.links.proofVerifierUrl,
      status: metricStatus(input.proofVerifier.status),
      detail: input.proofVerifier.headline
    },
    {
      id: "open-contract",
      label: "Open contract",
      href: input.links.pilotContractUrl,
      status: metricStatus(input.pilotContract.readiness),
      detail: input.pilotContract.approvalMemo.headline
    },
    {
      id: "receipt-desk",
      label: "Receipt desk",
      href: input.links.receiptVerifierUrl,
      status: "pass",
      detail: "Replay exported receipt payloads before forwarding the room."
    }
  ];
}

function repairPriorityFor(status: BuyerTrustManifestStatus, index: number): BuyerProofRoomRepairStep["priority"] {
  if (status === "block" && index === 0) return "now";
  if (status !== "pass") return "next";
  return "verify";
}

function repairPlanStatusFor(steps: BuyerProofRoomRepairStep[], readiness: BuyerProofRoomReadiness): BuyerProofRoomReadiness {
  if (readiness === "ready-to-send" && steps.length === 0) return "ready-to-send";
  if (steps.some((step) => step.status === "block")) return "blocked";
  return "needs-review";
}

function repairHeadlineFor(status: BuyerProofRoomReadiness) {
  if (status === "ready-to-send") return "No repair plan needed";
  if (status === "needs-review") return "Close review items before sending";
  return "Repair blockers before external sharing";
}

function buildRepairPlan(input: {
  readiness: BuyerProofRoomReadiness;
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
}): BuyerProofRoomRepairPlan {
  const gateSteps: BuyerProofRoomRepairStep[] = input.manifest.publicationGate.checks
    .filter((check) => check.status !== "pass")
    .map((check, index) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      priority: repairPriorityFor(check.status, index),
      owner: check.owner,
      href: check.href,
      evidence: check.evidence,
      action: check.action,
      doneSignal: `${check.label} returns pass in the regenerated buyer trust manifest.`,
      source: "publication-gate" as const
    }));
  const existingIds = new Set(gateSteps.map((step) => step.id));
  const verifierSteps: BuyerProofRoomRepairStep[] = input.proofVerifier.checks
    .filter((check) => check.status !== "pass" && !existingIds.has(check.id) && (check.id !== "publication-gate" || gateSteps.length === 0))
    .map((check, index) => ({
      id: `verifier-${check.id}`,
      label: check.label,
      status: check.status,
      priority: repairPriorityFor(check.status, gateSteps.length + index),
      owner: "Launch operator",
      href: check.id === "publication-gate" ? input.manifest.publicationGate.firstActionHref : input.links.proofVerifierUrl,
      evidence: check.evidence,
      action: check.action,
      doneSignal: `${check.label} returns pass in the proof verifier report.`,
      source: "proof-verifier" as const
    }));
  const contractStatus = metricStatus(input.pilotContract.readiness);
  const contractStep =
    contractStatus === "pass" || existingIds.has("buyer-pilot-contract")
      ? []
      : [
          {
            id: "contract-owner-review",
            label: "Pilot contract owner review",
            status: contractStatus,
            priority: repairPriorityFor(contractStatus, gateSteps.length + verifierSteps.length),
            owner: input.pilotContract.approvalMemo.signer,
            href: input.links.pilotContractUrl,
            evidence: input.pilotContract.hardTruth,
            action: input.pilotContract.approvalMemo.sendLine,
            doneSignal: "Contract readiness becomes contract-ready and the receipt checksum is regenerated.",
            source: "contract" as const
          }
        ];
  const steps = [...gateSteps, ...verifierSteps, ...contractStep];
  const status = repairPlanStatusFor(steps, input.readiness);
  const firstStep = steps.find((step) => step.status === "block") ?? steps.find((step) => step.status === "watch") ?? steps[0];
  const blockedCount = steps.filter((step) => step.status === "block").length;
  const watchCount = steps.filter((step) => step.status === "watch").length;

  return {
    status,
    headline: repairHeadlineFor(status),
    summary:
      steps.length === 0
        ? "Every publication check currently passes. Keep the manifest digest attached when sharing."
        : `${blockedCount} blocker${blockedCount === 1 ? "" : "s"} and ${watchCount} review item${watchCount === 1 ? "" : "s"} must close before the room leaves the workspace.`,
    firstAction: firstStep?.action ?? "Run live verification and keep the manifest digest attached.",
    firstActionHref: firstStep?.href ?? input.links.proofVerifierUrl,
    blockedCount,
    watchCount,
    stepCount: steps.length,
    steps
  };
}

function buildReviewerBriefs(input: {
  readiness: BuyerProofRoomReadiness;
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
  repairPlan: BuyerProofRoomRepairPlan;
}): BuyerProofRoomReviewerBrief[] {
  const upstreamReceiptCheck = input.proofVerifier.checks.find((check) => check.id === "upstream-receipts");
  const repairStopRule =
    input.repairPlan.status === "ready-to-send"
      ? "Share only with the current manifest JSON and Markdown links attached."
      : "Keep this proof room internal until every repair step is closed.";

  return [
    {
      id: "economic-buyer",
      label: "Economic buyer brief",
      status: metricStatus(input.pilotContract.readiness),
      question: "Can I approve a contained pilot?",
      answer: input.pilotContract.approvalMemo.sendLine,
      evidence: `${input.pilotContract.hardTruth} Value coverage is ${input.pilotContract.valueCoveragePercent}% with ${input.pilotContract.paybackDays} day payback.`,
      handoff:
        input.readiness === "ready-to-send"
          ? `Approve or reject the pilot from ${input.links.pilotContractUrl}.`
          : `Review the contract redlines and first repair action before approving ${input.pilotContract.pilotOffer}.`,
      stopRule: input.pilotContract.readiness === "contract-ready" ? repairStopRule : "Do not ask for buyer approval until the contract receipt returns contract-ready.",
      href: input.links.pilotContractUrl
    },
    {
      id: "security-reviewer",
      label: "Security reviewer brief",
      status: metricStatus(input.proofVerifier.status),
      question: "Can I trust the public proof chain?",
      answer: input.proofVerifier.operatorLine,
      evidence: `${upstreamReceiptCheck?.evidence ?? input.manifest.verification.instruction} Manifest digest ${input.manifest.verification.digest}.`,
      handoff: `Replay the verifier report at ${input.links.proofVerifierUrl} before relying on the room.`,
      stopRule: input.proofVerifier.status === "verified" ? repairStopRule : "Do not forward the room until the proof verifier returns verified.",
      href: input.links.proofVerifierUrl
    },
    {
      id: "launch-operator",
      label: "Launch operator brief",
      status: statusFromRoom(input.repairPlan.status),
      question: "What happens before this leaves the workspace?",
      answer: input.repairPlan.firstAction,
      evidence: input.repairPlan.summary,
      handoff: `Start at ${input.repairPlan.firstActionHref} and regenerate the room after the action is complete.`,
      stopRule: repairStopRule,
      href: input.repairPlan.firstActionHref
    }
  ];
}

function recommendedDecisionFor(readiness: BuyerProofRoomReadiness): BuyerProofRoomDecisionHandoffChoice {
  if (readiness === "ready-to-send") return "continue";
  if (readiness === "needs-review") return "revise";
  return "stop";
}

function hrefWithQueryParam(href: string, key: string, value: string) {
  try {
    const url = new URL(href);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    const [beforeHash, hash = ""] = href.split("#");
    const separator = beforeHash.includes("?") ? "&" : "?";
    const fragment = hash ? `#${hash}` : "";
    return `${beforeHash}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}${fragment}`;
  }
}

function decisionHandoffHeadline(readiness: BuyerProofRoomReadiness) {
  if (readiness === "ready-to-send") return "Decision handoff can move to buyer approval";
  if (readiness === "needs-review") return "Decision handoff should request revision";
  return "Decision handoff must stop external send";
}

function buildDecisionHandoff(input: {
  readiness: BuyerProofRoomReadiness;
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
  repairPlan: BuyerProofRoomRepairPlan;
}): BuyerProofRoomDecisionHandoff {
  const recommendedDecision = recommendedDecisionFor(input.readiness);
  const reviewKitHref = hrefWithQueryParam(input.links.reviewKitUrl, "decision", recommendedDecision);
  const decisionReceiptHref = hrefWithQueryParam(input.links.decisionReceiptUrl, "decision", recommendedDecision);
  const acceptancePathHref = hrefWithQueryParam(input.links.acceptancePathUrl, "decision", recommendedDecision);
  const decisionStatus = statusFromRoom(input.readiness);
  const stopRule =
    input.readiness === "ready-to-send"
      ? "Issue a continue receipt only after replaying the proof verifier in the review kit."
      : input.readiness === "needs-review"
        ? "Issue a revise receipt until the review kit has no watch items."
        : "Issue a stop receipt and keep the room internal until blockers are repaired.";

  return {
    status: input.readiness,
    recommendedDecision,
    headline: decisionHandoffHeadline(input.readiness),
    summary:
      input.readiness === "ready-to-send"
        ? `${input.manifest.subject} can enter external review with a decision receipt and acceptance path attached.`
        : `${input.manifest.subject} should not rely on this proof room without a recorded ${recommendedDecision} decision.`,
    stopRule,
    primaryActionLabel: "Open review kit",
    primaryActionHref: reviewKitHref,
    steps: [
      {
        id: "review-kit",
        label: "Open review kit",
        status: decisionStatus,
        href: reviewKitHref,
        evidence: `${input.proofVerifier.status} verifier status and ${input.manifest.publicationGate.decision} publication gate decision.`,
        action: "Inspect manifest, proof verifier, decision receipt, and follow-up readiness from one reviewer workflow."
      },
      {
        id: "decision-receipt",
        label: "Issue decision receipt",
        status: decisionStatus,
        href: decisionReceiptHref,
        evidence: `${recommendedDecision} is the recommended decision for ${input.readiness}.`,
        action: "Record continue, revise, or stop with checksum-backed payload verification."
      },
      {
        id: "acceptance-path",
        label: "Open acceptance path",
        status: decisionStatus,
        href: acceptancePathHref,
        evidence: `${input.pilotContract.approvalMemo.signer} owns contract readiness and ${input.repairPlan.stepCount} repair step(s) are visible.`,
        action: "Convert the reviewed proof into owner commitments, commercial approval, and follow-up."
      }
    ]
  };
}

function ownerPacketProofToAttach(step: BuyerProofRoomRepairStep) {
  if (step.source === "publication-gate") return `Regenerated publication gate row for ${step.label}. ${step.evidence}`;
  if (step.source === "proof-verifier") return `Proof verifier rerun showing ${step.label} as pass. ${step.evidence}`;
  return `Regenerated contract receipt showing ${step.label} as pass. ${step.evidence}`;
}

function ownerPacketHeadline(status: BuyerProofRoomReadiness) {
  if (status === "ready-to-send") return "Owner packet is ready for buyer send";
  if (status === "needs-review") return "Owner packet needs reviewer confirmation";
  return "Owner packet blocks buyer send";
}

function buildOwnerPacketMarkdown(packet: Omit<BuyerProofRoomOwnerPacket, "copyText" | "href">) {
  return [
    "# Buyer proof room owner packet",
    "",
    `Status: ${packet.status}`,
    `Current owner: ${packet.currentOwner}`,
    `Current command: ${packet.currentCommand}`,
    `Blocked items: ${packet.blockedCount}`,
    `Review items: ${packet.watchCount}`,
    "",
    packet.headline,
    `Send rule: ${packet.sendRule}`,
    `Escalation rule: ${packet.escalationRule}`,
    "",
    "## Owner checklist",
    ...packet.items.map(
      (item) =>
        `- [${item.status}/${item.priority}] ${item.owner}: ${item.command} Proof to attach: ${item.proofToAttach} Done signal: ${item.doneSignal} Link: ${item.href}`
    ),
    ...(packet.additionalItemCount > 0 ? [`- ${packet.additionalItemCount} additional repair item${packet.additionalItemCount === 1 ? "" : "s"} remain in the full repair plan.`] : [])
  ].join("\n");
}

function ownerPacketStepRank(step: BuyerProofRoomRepairStep) {
  const statusRank = step.status === "block" ? 0 : step.status === "watch" ? 1 : 2;
  const priorityRank = step.priority === "now" ? 0 : step.priority === "next" ? 1 : 2;
  return priorityRank * 10 + statusRank;
}

function buildOwnerPacket(input: {
  subject: string;
  repairPlan: BuyerProofRoomRepairPlan;
  decisionHandoff: BuyerProofRoomDecisionHandoff;
  links: BuyerProofRoomLinks;
}): BuyerProofRoomOwnerPacket {
  const actionableSteps = input.repairPlan.steps.filter((step) => step.status !== "pass");
  const sourceSteps =
    actionableSteps.length > 0
      ? [...actionableSteps].sort((left, right) => ownerPacketStepRank(left) - ownerPacketStepRank(right))
      : [
          {
            id: "verify-room-before-send",
            label: "Verify room before send",
            status: "pass" as const,
            priority: "verify" as const,
            owner: "Pilot owner",
            href: input.links.proofVerifierUrl,
            evidence: "The proof room is ready, but the verifier should be replayed before forwarding.",
            action: "Replay the verifier and attach the current manifest digest before sending.",
            doneSignal: "Verifier returns verified and the digest matches the room.",
            source: "proof-verifier" as const
          }
        ];
  const packetSteps = sourceSteps.slice(0, 6);
  const items = packetSteps.map((step) => ({
    id: step.id,
    status: step.status,
    priority: step.priority,
    owner: step.owner,
    command: step.action,
    proofToAttach: ownerPacketProofToAttach(step),
    doneSignal: step.doneSignal,
    href: step.href,
    source: step.source
  }));
  const firstItem = items[0];
  const blockedCount = items.filter((item) => item.status === "block").length;
  const watchCount = items.filter((item) => item.status === "watch").length;
  const sendRule =
    input.repairPlan.status === "ready-to-send"
      ? "Send only with the current manifest digest, proof verifier result, contract receipt, and decision receipt attached."
      : `Do not send to ${input.subject} until ${blockedCount} blocker${blockedCount === 1 ? "" : "s"} and ${watchCount} review item${watchCount === 1 ? "" : "s"} close.`;
  const escalationRule =
    input.repairPlan.status === "ready-to-send"
      ? "If verifier replay fails, switch the decision receipt to revise and reopen the owner packet."
      : `${firstItem.owner} owns the next action. If it cannot close, record a ${input.decisionHandoff.recommendedDecision} decision receipt and keep the room internal.`;
  const partial: Omit<BuyerProofRoomOwnerPacket, "copyText" | "href"> = {
    status: input.repairPlan.status,
    headline: ownerPacketHeadline(input.repairPlan.status),
    currentOwner: firstItem.owner,
    currentCommand: firstItem.command,
    sendRule,
    escalationRule,
    blockedCount,
    watchCount,
    itemCount: sourceSteps.length,
    additionalItemCount: Math.max(0, sourceSteps.length - items.length),
    items
  };
  const copyText = buildOwnerPacketMarkdown(partial);
  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildEvidenceLanes(manifest: BuyerTrustManifest) {
  const byId = new Map(manifest.artifacts.map((artifact) => [artifact.id, artifact]));
  return PRIORITY_ARTIFACT_IDS.map((id) => byId.get(id)).filter((artifact): artifact is BuyerTrustManifestArtifact => Boolean(artifact));
}

function buildMarkdown(room: Omit<BuyerProofRoom, "exportMarkdown">) {
  return [
    `# ${room.headline}`,
    "",
    "Buyer Proof Room",
    "",
    `Readiness: ${room.readiness}`,
    `Subject: ${room.subject}`,
    `Generated: ${room.generatedAt}`,
    `Manifest digest: ${room.manifest.verification.digest}`,
    `Verifier status: ${room.proofVerifier.status}`,
    `Contract readiness: ${room.pilotContract.readiness}`,
    "",
    room.summary,
    room.decision,
    "",
    "## Reviewer decisions",
    ...room.reviewerDecisions.map((decision) => `- [${decision.status}] ${decision.label}: ${decision.answer} Evidence: ${decision.evidence} Link: ${decision.href}`),
    "",
    "## Reviewer briefing pack",
    ...room.reviewerBriefs.map(
      (brief) =>
        `### ${brief.label}\nStatus: ${brief.status}\nQuestion: ${brief.question}\nAnswer: ${brief.answer}\nEvidence: ${brief.evidence}\nHandoff: ${brief.handoff}\nStop rule: ${brief.stopRule}\nLink: ${brief.href}`
    ),
    "",
    "## Decision handoff",
    `Status: ${room.decisionHandoff.status}`,
    `Recommended decision: ${room.decisionHandoff.recommendedDecision}`,
    room.decisionHandoff.headline,
    room.decisionHandoff.summary,
    `Stop rule: ${room.decisionHandoff.stopRule}`,
    ...room.decisionHandoff.steps.map((step) => `- [${step.status}] ${step.label}: ${step.action} Evidence: ${step.evidence} Link: ${step.href}`),
    "",
    "## Owner packet",
    `Status: ${room.ownerPacket.status}`,
    `Current owner: ${room.ownerPacket.currentOwner}`,
    `Current command: ${room.ownerPacket.currentCommand}`,
    `Send rule: ${room.ownerPacket.sendRule}`,
    `Escalation rule: ${room.ownerPacket.escalationRule}`,
    ...room.ownerPacket.items.map(
      (item) =>
        `- [${item.status}/${item.priority}] ${item.owner}: ${item.command} Proof to attach: ${item.proofToAttach} Done signal: ${item.doneSignal} Link: ${item.href}`
    ),
    "",
    "## Actions",
    ...room.actions.map((action) => `- [${action.status}] ${action.label}: ${action.href} Detail: ${action.detail}`),
    "",
    "## Repair plan",
    `Status: ${room.repairPlan.status}`,
    `First action: ${room.repairPlan.firstAction}`,
    `First action link: ${room.repairPlan.firstActionHref}`,
    ...room.repairPlan.steps.map(
      (step) =>
        `- [${step.status}/${step.priority}] ${step.label}: ${step.action} Owner: ${step.owner}. Evidence: ${step.evidence}. Done signal: ${step.doneSignal}. Link: ${step.href}`
    ),
    "",
    "## Evidence lanes",
    ...room.evidenceLanes.map((artifact) => `- [${artifact.status}] ${artifact.label}: ${artifact.href} Evidence: ${artifact.evidence}`),
    "",
    "## Receipts",
    ...room.receipts.map((receipt) => `- [${receipt.status}] ${receipt.id}: ${receipt.algorithm} ${receipt.digest}. ${receipt.verifier}`),
    "",
    "## Links",
    `- Proof room JSON: ${room.links.jsonUrl}`,
    `- Trust manifest: ${room.links.trustManifestUrl}`,
    `- Proof verifier: ${room.links.proofVerifierUrl}`,
    `- Pilot contract: ${room.links.pilotContractUrl}`,
    `- Receipt desk: ${room.links.receiptVerifierUrl}`
  ].join("\n");
}

export function buildBuyerProofRoom(input: {
  manifest: BuyerTrustManifest;
  proofVerifier: BuyerProofVerifierReport;
  pilotContract: BuyerPilotContract;
  links: BuyerProofRoomLinks;
}): BuyerProofRoom {
  const readiness = readinessFrom(input);
  const verificationRequestJson = JSON.stringify({ manifest: input.manifest }, null, 2);
  const repairPlan = buildRepairPlan({ readiness, manifest: input.manifest, proofVerifier: input.proofVerifier, pilotContract: input.pilotContract, links: input.links });
  const reviewerBriefs = buildReviewerBriefs({ ...input, readiness, repairPlan });
  const decisionHandoff = buildDecisionHandoff({ ...input, readiness, repairPlan });
  const ownerPacket = buildOwnerPacket({ subject: input.manifest.subject, repairPlan, decisionHandoff, links: input.links });
  const partial = {
    id: `buyer-proof-room-${readiness}-${input.manifest.verification.digest.slice(0, 8)}`,
    generatedAt: input.manifest.generatedAt,
    subject: input.manifest.subject,
    readiness,
    headline: headlineFor(readiness),
    summary: summaryFor(readiness),
    decision: decisionFor({ readiness, manifest: input.manifest, proofVerifier: input.proofVerifier, pilotContract: input.pilotContract }),
    metrics: buildMetrics({ readiness, manifest: input.manifest, proofVerifier: input.proofVerifier, pilotContract: input.pilotContract }),
    reviewerDecisions: buildReviewerDecisions(input),
    reviewerBriefs,
    decisionHandoff,
    ownerPacket,
    actions: buildActions(input),
    repairPlan,
    evidenceLanes: buildEvidenceLanes(input.manifest),
    receipts: input.manifest.receipts,
    manifest: input.manifest,
    proofVerifier: input.proofVerifier,
    pilotContract: input.pilotContract,
    links: input.links,
    verificationRequestJson
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

export function renderBuyerProofRoomHtml(room: BuyerProofRoom) {
  const snapshotTrustManifestUrl = hrefWithQueryParam(room.links.trustManifestUrl, BUYER_PROOF_ROOM_MANIFEST_AT_PARAM, room.manifest.generatedAt);
  const snapshotTrustManifestJsonUrl = hrefWithQueryParam(room.links.trustManifestJsonUrl, BUYER_PROOF_ROOM_MANIFEST_AT_PARAM, room.manifest.generatedAt);
  const snapshotProofVerifierUrl = hrefWithQueryParam(room.links.proofVerifierUrl, BUYER_PROOF_ROOM_MANIFEST_AT_PARAM, room.manifest.generatedAt);
  const hrefForDecision = (decision: BuyerProofRoomDecision) => {
    if (decision.id === "trust") return snapshotProofVerifierUrl;
    if (decision.id === "verification") return snapshotTrustManifestUrl;
    return decision.href;
  };
  const hrefForBrief = (brief: BuyerProofRoomReviewerBrief) => (brief.id === "security-reviewer" ? snapshotProofVerifierUrl : brief.href);
  const hrefForAction = (action: BuyerProofRoomAction) => (action.id === "verify-proof" ? snapshotProofVerifierUrl : action.href);
  const nav = [
    `<a href="${escapeHtml(snapshotTrustManifestUrl)}">Trust manifest</a>`,
    `<a href="${escapeHtml(snapshotProofVerifierUrl)}">Proof verifier</a>`,
    `<a href="${escapeHtml(room.links.pilotContractUrl)}">Pilot contract</a>`,
    `<a href="${escapeHtml(room.links.receiptVerifierUrl)}">Receipt desk</a>`,
    `<a href="${escapeHtml(room.decisionHandoff.primaryActionHref)}">Review kit</a>`,
    `<a href="${escapeHtml(room.decisionHandoff.steps.find((step) => step.id === "decision-receipt")?.href ?? room.links.decisionReceiptUrl)}">Decision receipt</a>`,
    `<a href="${escapeHtml(room.links.appUrl)}">Workbench</a>`
  ].join("");
  const metrics = room.metrics
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const decisions = room.reviewerDecisions
    .map(
      (decision) => `
        <article class="decision ${tone(decision.status)}">
          <div><strong>${escapeHtml(decision.label)}</strong><span>${escapeHtml(decision.status)}</span></div>
          <p>${escapeHtml(decision.answer)}</p>
          <small>${escapeHtml(decision.evidence)}</small>
          <a href="${escapeHtml(hrefForDecision(decision))}">Open evidence</a>
        </article>`
    )
    .join("");
  const reviewerBriefs = room.reviewerBriefs
    .map(
      (brief) => `
        <article class="brief ${tone(brief.status)}">
          <div><strong>${escapeHtml(brief.label)}</strong><span>${escapeHtml(brief.status)}</span></div>
          <p><b>${escapeHtml(brief.question)}</b> ${escapeHtml(brief.answer)}</p>
          <small>${escapeHtml(brief.evidence)}</small>
          <small><b>Handoff:</b> ${escapeHtml(brief.handoff)}</small>
          <small><b>Stop rule:</b> ${escapeHtml(brief.stopRule)}</small>
          <a href="${escapeHtml(hrefForBrief(brief))}">Open reviewer evidence</a>
        </article>`
    )
    .join("");
  const decisionHandoffSteps = room.decisionHandoff.steps
    .map(
      (step) => `
        <article class="handoff-step ${tone(step.status)}">
          <div><strong>${escapeHtml(step.label)}</strong><span>${escapeHtml(step.status)}</span></div>
          <p>${escapeHtml(step.action)}</p>
          <small>${escapeHtml(step.evidence)}</small>
          <a href="${escapeHtml(step.href)}">Open handoff step</a>
        </article>`
    )
    .join("");
  const ownerPacketItems = room.ownerPacket.items
    .map(
      (item) => `
        <article class="owner-item ${tone(item.status)}">
          <div><strong>${escapeHtml(item.owner)}</strong><span>${escapeHtml(item.priority)}</span></div>
          <p>${escapeHtml(item.command)}</p>
          <small><b>Proof to attach:</b> ${escapeHtml(item.proofToAttach)}</small>
          <small><b>Done signal:</b> ${escapeHtml(item.doneSignal)}</small>
          <a href="${escapeHtml(item.href)}">Open owner action</a>
        </article>`
    )
    .join("");
  const actions = room.actions
    .map(
      (action) => `
        <a class="action ${tone(action.status)}" href="${escapeHtml(hrefForAction(action))}">
          <strong>${escapeHtml(action.label)}</strong>
          <span>${escapeHtml(action.detail)}</span>
        </a>`
    )
    .join("");
  const visibleRepairSteps = room.repairPlan.steps.slice(0, 6);
  const hiddenRepairStepCount = Math.max(0, room.repairPlan.steps.length - visibleRepairSteps.length);
  const repairSteps =
    visibleRepairSteps.length === 0
      ? `<article class="repair-step good"><strong>Verification only</strong><p>${escapeHtml(room.repairPlan.summary)}</p><small>${escapeHtml(room.repairPlan.firstAction)}</small></article>`
      : visibleRepairSteps
          .map(
            (step) => `
        <article class="repair-step ${tone(step.status)}">
          <div><strong>${escapeHtml(step.label)}</strong><span>${escapeHtml(step.priority)}</span></div>
          <p>${escapeHtml(step.action)}</p>
          <small>${escapeHtml(step.evidence)}</small>
          <small><b>Done signal:</b> ${escapeHtml(step.doneSignal)}</small>
          <a href="${escapeHtml(step.href)}">Open repair target</a>
        </article>`
          )
          .join("") +
        (hiddenRepairStepCount > 0
          ? `<article class="repair-more watch"><strong>Additional repair items</strong><p>${escapeHtml(`${hiddenRepairStepCount} more repair item${hiddenRepairStepCount === 1 ? "" : "s"} are included in JSON and Markdown exports.`)}</p><a href="${escapeHtml(room.links.jsonUrl)}">Open full JSON</a></article>`
          : "");
  const lanes = room.evidenceLanes
    .map(
      (artifact) => `
        <article class="lane ${tone(artifact.status)}">
          <div><strong><a href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a></strong><span>${escapeHtml(artifact.status)}</span></div>
          <p>${escapeHtml(artifact.evidence)}</p>
          <small>${escapeHtml(artifact.owner)} / ${escapeHtml(artifact.verifier)}</small>
        </article>`
    )
    .join("");
  const receipts = room.receipts
    .map(
      (receipt) => `
        <article class="receipt ${tone(receipt.status)}">
          <div><strong>${escapeHtml(receipt.id)}</strong><span>${escapeHtml(receipt.status)}</span></div>
          <code>${escapeHtml(receipt.digest)}</code>
          <small>${escapeHtml(receipt.verifier)}</small>
        </article>`
    )
    .join("");
  const heroImage = room.links.heroImageUrl
    ? `<img src="${escapeHtml(room.links.heroImageUrl)}" alt="A2A Agent Marketplace proof room visual" />`
    : "";
  const verifyConfigJson = escapeScriptJson(
    JSON.stringify({
      manifestUrl: snapshotTrustManifestJsonUrl,
      apiUrl: room.links.proofVerifierApiUrl,
      expectedDigest: room.manifest.verification.digest
    })
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(room.headline)}</title>
    <meta name="description" content="${escapeHtml(room.summary)}" />
    ${room.links.heroImageUrl ? `<link rel="preload" as="image" href="${escapeHtml(room.links.heroImageUrl)}" />` : ""}
    <style>
      :root { color-scheme: light dark; --ink: #13231f; --muted: #52625e; --paper: #f1f5f2; --panel: #fffdf7; --line: #c9d6d0; --accent: #0f766e; --blue: #2457a6; --good: #e9f7ef; --watch: #fff6d8; --bad: #fff1f2; --shadow: rgba(19, 35, 31, .08); }
      @media (prefers-color-scheme: dark) { :root { --ink: #ecf4ef; --muted: #a9bbb4; --paper: #101815; --panel: #17231f; --line: #31413b; --accent: #62d3c5; --blue: #8db7ff; --good: #173326; --watch: #332b17; --bad: #351d24; --shadow: rgba(0, 0, 0, .26); } }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { padding: 26px 0 14px; }
      .topbar { min-height: 58px; display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--line); }
      .brand { font-weight: 950; letter-spacing: 0; }
      nav { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; overflow-x: auto; scrollbar-width: thin; }
      nav a, .button, .decision a { min-height: 36px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; color: var(--ink); background: var(--panel); font-size: .86rem; font-weight: 850; text-decoration: none; white-space: nowrap; }
      .button.primary { color: #fffdf7; border-color: var(--ink); background: var(--ink); }
      button.button { font: inherit; cursor: pointer; }
      button.button:disabled { cursor: default; opacity: .72; }
      .hero { display: grid; grid-template-columns: minmax(0, .95fr) minmax(290px, .58fr); gap: 18px; align-items: stretch; padding: 24px 0 16px; }
      .hero-copy, .hero-media, .panel, .decision, .brief, .handoff-step, .lane, .receipt, .metric, .verify-panel, .repair-plan { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 14px 34px var(--shadow); }
      .hero-copy { display: grid; align-content: center; gap: 12px; padding: clamp(20px, 4vw, 38px); }
      .eyebrow, .metric span, .decision span, .lane span, .receipt span { color: var(--accent); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 780px; margin: 0; font-size: clamp(2.25rem, 5.2vw, 4.9rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 10px; font-size: clamp(1.35rem, 2.4vw, 2rem); line-height: 1.08; letter-spacing: 0; }
      p, small, li { color: var(--muted); }
      .hero-copy p { max-width: 58ch; margin: 0; font-size: 1.02rem; }
      .hero-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .hero-media { min-width: 0; display: grid; gap: 10px; padding: 10px; }
      .hero-media img { width: 100%; min-height: 250px; max-height: 390px; object-fit: cover; border-radius: 6px; border: 1px solid var(--line); }
      .digest-card { display: grid; gap: 6px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: color-mix(in srgb, var(--paper) 54%, var(--panel)); }
      .digest-card code { display: block; color: var(--ink); overflow-wrap: anywhere; font: 750 .86rem/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      main { display: grid; gap: 12px; padding-bottom: 32px; }
      .metrics { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
      .metric { min-width: 0; padding: 13px; }
      .metric strong { display: block; margin-top: 5px; font-size: 1.2rem; line-height: 1.1; overflow-wrap: anywhere; }
      .panel, .verify-panel, .repair-plan { min-width: 0; padding: 16px; }
      .decision-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .brief-grid, .handoff-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .decision, .brief, .handoff-step, .owner-item, .lane, .receipt { min-width: 0; display: grid; gap: 8px; padding: 14px; }
      .decision div, .brief div, .handoff-step div, .owner-item div, .lane div, .receipt div { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .decision p, .decision small, .brief p, .brief small, .handoff-step p, .handoff-step small, .owner-item p, .owner-item small, .lane p, .lane small, .receipt small { margin: 0; overflow-wrap: anywhere; }
      .brief a, .handoff-step a { color: var(--ink); font-weight: 850; }
      .handoff-summary { display: grid; gap: 8px; margin-bottom: 10px; }
      .handoff-summary p { margin: 0; max-width: 74ch; }
      .handoff-summary strong { width: fit-content; border: 1px solid var(--line); border-radius: 999px; padding: 5px 8px; color: var(--ink); background: color-mix(in srgb, var(--paper) 54%, var(--panel)); font-size: .82rem; line-height: 1.1; }
      .owner-packet { display: grid; gap: 12px; border: 1px solid var(--line); border-radius: 8px; padding: 16px; background: var(--panel); box-shadow: 0 14px 34px var(--shadow); }
      .owner-head { display: grid; grid-template-columns: minmax(0, .66fr) minmax(240px, .34fr); gap: 12px; align-items: start; }
      .owner-head p { margin: 0; max-width: 72ch; }
      .owner-command { display: grid; gap: 5px; border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: color-mix(in srgb, var(--paper) 54%, var(--panel)); }
      .owner-command span { color: var(--accent); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .owner-command strong { overflow-wrap: anywhere; }
      .owner-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .owner-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .owner-item a { color: var(--ink); font-weight: 850; }
      .action-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .action { min-width: 0; display: grid; gap: 5px; border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: var(--panel); text-decoration: none; }
      .action span { color: var(--muted); font-size: .86rem; overflow-wrap: anywhere; }
      .repair-plan { display: grid; gap: 12px; }
      .repair-head { display: grid; grid-template-columns: minmax(0, .72fr) minmax(220px, .28fr); gap: 10px; align-items: start; }
      .repair-head p { margin: 0; max-width: 64ch; }
      .repair-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .repair-meta span { display: grid; gap: 3px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: color-mix(in srgb, var(--paper) 54%, var(--panel)); color: var(--muted); font-size: .8rem; }
      .repair-meta b { color: var(--ink); font-size: 1.05rem; line-height: 1; }
      .repair-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .repair-step, .repair-more { min-width: 0; display: grid; gap: 8px; border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
      .repair-step div { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .repair-step p, .repair-step small, .repair-more p { margin: 0; overflow-wrap: anywhere; }
      .repair-step a, .repair-more a { color: var(--ink); font-weight: 850; }
      .lane-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .receipt-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .receipt code { display: block; padding: 9px; border-radius: 8px; color: #fffdf7; background: #13231f; overflow-wrap: anywhere; font: 750 .82rem/1.42 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .verify-panel { display: grid; grid-template-columns: minmax(0, .65fr) minmax(260px, .35fr); gap: 12px; align-items: start; }
      .verify-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .verify-status { min-height: 24px; color: var(--muted); font-weight: 850; overflow-wrap: anywhere; }
      .good { border-color: color-mix(in srgb, var(--accent) 36%, var(--line)); background: var(--good); }
      .watch { border-color: #d8bd63; background: var(--watch); }
      .bad { border-color: #e0a4ad; background: var(--bad); }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .84rem; }
      @media (max-width: 940px) { .hero, .verify-panel, .owner-head, .repair-head, .metrics, .decision-grid, .brief-grid, .handoff-grid, .owner-grid, .action-grid, .repair-grid, .lane-grid, .receipt-grid { grid-template-columns: 1fr; } .topbar { align-items: flex-start; flex-direction: column; padding: 10px 0; } nav { width: 100%; } .hero-media img { min-height: 190px; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero-copy, .panel, .verify-panel, .owner-packet, .repair-plan { padding: 13px; } .hero-actions .button, .verify-actions .button, .owner-actions .button { width: 100%; } .decision div, .brief div, .handoff-step div, .owner-item div, .lane div, .receipt div, .repair-step div { flex-direction: column; } .repair-meta { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div class="topbar">
        <a class="brand" href="${escapeHtml(room.links.roomUrl)}">Buyer Proof Room</a>
        <nav aria-label="Proof room navigation">${nav}</nav>
      </div>
      <section class="hero" aria-label="Buyer proof room summary">
        <div class="hero-copy">
          <span class="eyebrow">Buyer Proof Room</span>
          <h1>${escapeHtml(room.headline)}</h1>
          <p>${escapeHtml(room.summary)}</p>
          <div class="hero-actions">
            <a class="button primary" href="${escapeHtml(room.actions[0]?.href ?? room.links.proofVerifierUrl)}">${escapeHtml(room.actions[0]?.label ?? "Open first action")}</a>
            <a class="button" href="${escapeHtml(snapshotProofVerifierUrl)}">Verify proof</a>
          </div>
        </div>
        <aside class="hero-media" aria-label="Proof room visual and digest">
          ${heroImage}
          <div class="digest-card">
            <span class="eyebrow">Manifest digest</span>
            <code>${escapeHtml(room.manifest.verification.digest)}</code>
            <small>${escapeHtml(room.decision)}</small>
          </div>
        </aside>
      </section>
    </header>
    <main>
      <section class="metrics" aria-label="Proof room metrics">${metrics}</section>
      <section class="panel" aria-label="Reviewer decisions">
        <h2>Buyer questions answered</h2>
        <div class="decision-grid">${decisions}</div>
      </section>
      <section class="panel" aria-label="Reviewer briefing pack">
        <h2>Reviewer briefing pack</h2>
        <div class="brief-grid">${reviewerBriefs}</div>
      </section>
      <section class="panel" aria-label="Decision handoff">
        <h2>Decision handoff</h2>
        <div class="handoff-summary">
          <strong>${escapeHtml(`Recommended: ${room.decisionHandoff.recommendedDecision}`)}</strong>
          <p>${escapeHtml(room.decisionHandoff.headline)}. ${escapeHtml(room.decisionHandoff.summary)}</p>
          <p>${escapeHtml(room.decisionHandoff.stopRule)}</p>
        </div>
        <div class="handoff-grid">${decisionHandoffSteps}</div>
      </section>
      <section class="owner-packet ${tone(room.ownerPacket.status)}" aria-label="Owner repair packet">
        <div class="owner-head">
          <div>
            <h2>Owner packet</h2>
            <p>${escapeHtml(room.ownerPacket.headline)}. ${escapeHtml(room.ownerPacket.sendRule)}</p>
            <p>${escapeHtml(room.ownerPacket.escalationRule)}</p>
            ${
              room.ownerPacket.additionalItemCount > 0
                ? `<p>${escapeHtml(`${room.ownerPacket.additionalItemCount} additional repair item${room.ownerPacket.additionalItemCount === 1 ? "" : "s"} remain in the full repair plan below.`)}</p>`
                : ""
            }
          </div>
          <div class="owner-command">
            <span>Current owner</span>
            <strong>${escapeHtml(room.ownerPacket.currentOwner)}</strong>
            <small>${escapeHtml(room.ownerPacket.currentCommand)}</small>
            <div class="owner-actions">
              <a class="button primary" href="${escapeHtml(room.ownerPacket.items[0]?.href ?? room.links.proofVerifierUrl)}">Open owner action</a>
              <a class="button" href="${escapeHtml(room.ownerPacket.href)}" download="buyer-proof-room-owner-packet.md">Download owner packet</a>
            </div>
          </div>
        </div>
        <div class="owner-grid">${ownerPacketItems}</div>
      </section>
      <section class="panel" aria-label="Proof room actions">
        <h2>Proof actions</h2>
        <div class="action-grid">${actions}</div>
      </section>
      <section class="repair-plan ${tone(room.repairPlan.status)}" aria-label="Repair plan">
        <div class="repair-head">
          <div>
            <h2>Repair plan</h2>
            <p>${escapeHtml(room.repairPlan.headline)}. ${escapeHtml(room.repairPlan.summary)}</p>
          </div>
          <div class="repair-meta" aria-label="Repair plan counters">
            <span><b>${escapeHtml(room.repairPlan.stepCount)}</b> steps</span>
            <span><b>${escapeHtml(room.repairPlan.blockedCount)}</b> blockers</span>
            <span><b>${escapeHtml(room.repairPlan.watchCount)}</b> reviews</span>
          </div>
        </div>
        <div class="repair-grid">${repairSteps}</div>
      </section>
      <section class="panel" aria-label="Evidence lanes">
        <h2>Evidence lanes</h2>
        <div class="lane-grid">${lanes}</div>
      </section>
      <section class="verify-panel" aria-label="Self verification">
        <div>
          <h2>Verify this room</h2>
          <p>The button loads the current manifest JSON, sends it to the public proof verifier API, and reports the current digest result.</p>
          <small class="verify-status" data-room-verification-status>Ready to verify manifest ${escapeHtml(room.manifest.verification.digest)}.</small>
        </div>
        <div class="verify-actions">
          <button class="button primary" type="button" data-verify-room data-api-url="${escapeHtml(room.links.proofVerifierApiUrl)}">Verify room</button>
          <a class="button" href="${escapeHtml(snapshotTrustManifestJsonUrl)}">Manifest JSON</a>
          <a class="button" href="${escapeHtml(room.links.jsonUrl)}">JSON room</a>
          <a class="button" href="${escapeHtml(room.links.markdownUrl)}">Markdown</a>
        </div>
      </section>
      <section class="panel" aria-label="Receipts">
        <h2>Receipts</h2>
        <div class="receipt-grid">${receipts}</div>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace from public buyer proof artifacts.</footer>
    <script type="application/json" id="buyer-proof-room-verification-config">${verifyConfigJson}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-verify-room]");
        const status = document.querySelector("[data-room-verification-status]");
        const configNode = document.getElementById("buyer-proof-room-verification-config");
        if (!button || !status || !configNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Checking room";
          status.textContent = "Loading current manifest JSON...";
          try {
            const config = JSON.parse(configNode.textContent || "{}");
            const manifestUrl = typeof config.manifestUrl === "string" ? config.manifestUrl : "/api/buyer-trust-manifest";
            const apiUrl = button.getAttribute("data-api-url") || (typeof config.apiUrl === "string" ? config.apiUrl : "/api/buyer-proof-verifier");
            const manifestResponse = await fetch(manifestUrl, { headers: { Accept: "application/json" } });
            if (!manifestResponse.ok) throw new Error("Manifest JSON could not be loaded.");
            const manifest = await manifestResponse.json();
            status.textContent = "Checking proof room manifest...";
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ manifest })
            });
            const result = await response.json();
            if (!response.ok || !result || !result.report) throw new Error(result && result.error ? result.error : "verification failed");
            button.disabled = false;
            button.textContent = "Verify room";
            status.textContent = "Verified " + result.report.actualDigest + " with status " + result.report.status + ".";
          } catch (error) {
            button.disabled = false;
            button.textContent = "Verify room";
            status.textContent = error instanceof Error ? error.message : "Proof room verification failed.";
          }
        });
      })();
    </script>
  </body>
</html>`;
}
