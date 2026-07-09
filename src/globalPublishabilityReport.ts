import type { GlobalLaunchAudit, GlobalLaunchAuditDimension } from "./globalLaunchAudit.js";
import type { GlobalProofDossier, GlobalProofDossierClaim, GlobalProofDossierLinkCheck, GlobalProofDossierStatus } from "./globalProofDossier.js";
import { GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH, buildGlobalPublishabilityReceipt, type GlobalPublishabilityReceipt } from "./globalPublishabilityReceipt.js";
import { GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH } from "./globalPublishabilityReviewResponseReceipt.js";

export const GLOBAL_PUBLISHABILITY_SKILL_ID = "global.publishability";
export const GLOBAL_PUBLISHABILITY_REPAIR_CHECK_PATH = "/api/global-publishability/repair-check";

export type GlobalPublishabilityDecision = "publish" | "sponsor-review" | "do-not-publish";
export type GlobalPublishabilityStatus = GlobalProofDossierStatus;
export type GlobalPublishabilityGateId = "value-story" | "live-reachability" | "proof-substance" | "ops-trust" | "buyer-decision-path";
export type GlobalPublishabilityValueRouteStepId = "buyer-value" | "measured-proof" | "public-proof" | "buyer-decision";
export type GlobalPublishabilityReviewerDecisionId = "approve-bounded-pilot" | "sponsor-review" | "hold-public-launch";

export type GlobalPublishabilityGate = {
  id: GlobalPublishabilityGateId;
  label: string;
  status: GlobalPublishabilityStatus;
  score: number;
  owner: string;
  reviewerQuestion: string;
  requiredProof: string;
  evidence: string;
  action: string;
  href: string;
};

export type GlobalPublishabilityRepair = {
  id: string;
  priority: "now" | "next";
  owner: string;
  label: string;
  action: string;
  href: string;
};

export type GlobalPublishabilityLink = {
  id: string;
  label: string;
  href: string;
};

export type GlobalPublishabilityValueRouteStep = {
  id: GlobalPublishabilityValueRouteStepId;
  label: string;
  status: GlobalPublishabilityStatus;
  score: number;
  owner: string;
  title: string;
  evidence: string;
  action: string;
  href: string;
};

export type GlobalPublishabilityReviewerProofCheck = {
  id: GlobalPublishabilityValueRouteStepId;
  label: string;
  question: string;
  status: GlobalPublishabilityStatus;
  evidence: string;
  action: string;
  href: string;
};

export type GlobalPublishabilityReviewerDecisionOption = {
  id: GlobalPublishabilityReviewerDecisionId;
  label: string;
  condition: string;
  action: string;
  href: string;
};

export type GlobalPublishabilityReviewerBrief = {
  title: string;
  timebox: string;
  sponsorQuestion: string;
  recommendedDecision: GlobalPublishabilityReviewerDecisionId;
  stopRule: string;
  proofChecks: GlobalPublishabilityReviewerProofCheck[];
  decisionOptions: GlobalPublishabilityReviewerDecisionOption[];
};

export type GlobalPublishabilityHandoffMemo = {
  audience: "buyer-sponsor" | "internal-sponsor" | "launch-owner";
  subject: string;
  statusLine: string;
  requestedDecision: string;
  bodyLines: string[];
  proofLinks: GlobalPublishabilityLink[];
  noSendWarning?: string;
  copyText: string;
};

export type GlobalPublishabilityLaunchPacketItem = {
  id: string;
  status: GlobalPublishabilityStatus;
  priority: "now" | "next" | "verify";
  owner: string;
  label: string;
  command: string;
  proofToAttach: string;
  doneSignal: string;
  href: string;
};

export type GlobalPublishabilityLaunchPacket = {
  status: GlobalPublishabilityStatus;
  headline: string;
  currentOwner: string;
  currentCommand: string;
  publishRule: string;
  escalationRule: string;
  blockedCount: number;
  watchCount: number;
  itemCount: number;
  additionalItemCount: number;
  items: GlobalPublishabilityLaunchPacketItem[];
  copyText: string;
  href: string;
};

export type GlobalPublishabilityRepairTicket = {
  id: string;
  sourceItemId: string;
  status: GlobalPublishabilityStatus;
  priority: GlobalPublishabilityLaunchPacketItem["priority"];
  owner: string;
  title: string;
  command: string;
  proofToAttach: string;
  acceptanceCriteria: string[];
  recheck: {
    label: string;
    href: string;
    expectedSignal: string;
  };
  receiptGuard: string;
  copyText: string;
  href: string;
};

export type GlobalPublishabilityRepairRunbookMode = "send-ready" | "sponsor-review" | "repair-required";
export type GlobalPublishabilityRepairProofRequirementKind = "product-url" | "story-url" | "video-url" | "receipt-url" | "review-url" | "ops-url" | "launch-url";

export type GlobalPublishabilityRepairProofRequirement = {
  id: string;
  label: string;
  kind: GlobalPublishabilityRepairProofRequirementKind;
  required: boolean;
  placeholder: string;
  description: string;
};

export type GlobalPublishabilityRepairRunbookStep = {
  id: string;
  ticketId: string;
  sequence: number;
  status: GlobalPublishabilityStatus;
  priority: GlobalPublishabilityLaunchPacketItem["priority"];
  owner: string;
  title: string;
  command: string;
  inputLabel: string;
  inputHref: string;
  proofSlot: string;
  proofRequirements: GlobalPublishabilityRepairProofRequirement[];
  acceptanceSignal: string;
  recheckHref: string;
  recheckSignal: string;
  receiptGuard: string;
  shareGate: string;
};

export type GlobalPublishabilityRepairRunbook = {
  mode: GlobalPublishabilityRepairRunbookMode;
  status: GlobalPublishabilityStatus;
  headline: string;
  summary: string;
  externalShareLocked: boolean;
  currentOwner: string;
  currentCommand: string;
  verificationCommand: string;
  shareRule: string;
  stepCount: number;
  nowCount: number;
  nextCount: number;
  verifyCount: number;
  steps: GlobalPublishabilityRepairRunbookStep[];
  copyText: string;
  href: string;
  csvText: string;
  csvHref: string;
};

export type GlobalPublishabilityReportLinks = {
  appUrl?: string;
  launchRoomUrl?: string;
  globalAuditUrl?: string;
  proofDossierUrl?: string;
  launchEvidenceUrl?: string;
  buyerOutcomeUrl?: string;
  buyerShareGateUrl?: string;
  buyerReviewKitUrl?: string;
  acceptancePathUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
};

export type GlobalPublishabilityReport = {
  id: string;
  generatedAt: string;
  decision: GlobalPublishabilityDecision;
  status: GlobalPublishabilityStatus;
  publishabilityScore: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  publicPitch: string;
  decisionAsk: string;
  verifiedSummary: string;
  valueRoute: GlobalPublishabilityValueRouteStep[];
  reviewerBrief: GlobalPublishabilityReviewerBrief;
  handoffMemo: GlobalPublishabilityHandoffMemo;
  launchPacket: GlobalPublishabilityLaunchPacket;
  repairTickets: GlobalPublishabilityRepairTicket[];
  repairRunbook: GlobalPublishabilityRepairRunbook;
  receipt: GlobalPublishabilityReceipt;
  gates: GlobalPublishabilityGate[];
  repairLedger: GlobalPublishabilityRepair[];
  proofLinks: GlobalProofDossierLinkCheck[];
  launchLinks: GlobalPublishabilityLink[];
  primaryAction: {
    label: string;
    href: string;
  };
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function round(value: number) {
  return Math.round(clamp(value));
}

function statusScore(status: GlobalPublishabilityStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 18;
}

function mergeStatus(...statuses: GlobalPublishabilityStatus[]): GlobalPublishabilityStatus {
  if (statuses.includes("block")) return "block";
  if (statuses.includes("watch")) return "watch";
  return "pass";
}

function claimById(dossier: GlobalProofDossier, id: GlobalProofDossierClaim["id"]) {
  return dossier.claims.find((claim) => claim.id === id);
}

function dimensionById(audit: GlobalLaunchAudit, id: GlobalLaunchAuditDimension["id"]) {
  return audit.dimensions.find((dimension) => dimension.id === id);
}

function fallbackClaim(id: GlobalProofDossierClaim["id"], label: string): GlobalProofDossierClaim {
  return {
    id,
    label,
    status: "block",
    score: 0,
    claim: `${label} is missing from the proof dossier.`,
    evidence: "Regenerate the global proof dossier before publishing.",
    buyerQuestion: "Can a public reviewer inspect this proof without a private walkthrough?",
    decisionRule: "Do not publish until this proof is present.",
    sourceHref: "#global-proof-dossier"
  };
}

function gateStatusFromDossier(dossier: GlobalProofDossier): GlobalPublishabilityStatus {
  if (dossier.decision === "share-with-buyer") return "pass";
  if (dossier.decision === "sponsor-review") return "watch";
  return "block";
}

function buildGates(input: { audit: GlobalLaunchAudit; dossier: GlobalProofDossier; links?: GlobalPublishabilityReportLinks }): GlobalPublishabilityGate[] {
  const buyerValue = claimById(input.dossier, "buyer-value") ?? fallbackClaim("buyer-value", "Buyer value clarity");
  const measuredOutcome = claimById(input.dossier, "measured-outcome") ?? fallbackClaim("measured-outcome", "Measured buyer outcome");
  const publicReachability = claimById(input.dossier, "public-reachability") ?? fallbackClaim("public-reachability", "Public reachability");
  const proofDepth = claimById(input.dossier, "proof-depth") ?? fallbackClaim("proof-depth", "Proof depth");
  const productionOps = claimById(input.dossier, "production-ops") ?? fallbackClaim("production-ops", "Production operations");
  const trustOffer = claimById(input.dossier, "trust-offer") ?? fallbackClaim("trust-offer", "Trust and offer packaging");
  const liveSurface = dimensionById(input.audit, "live-surface");

  return [
    {
      id: "value-story",
      label: "Value is clear on first read",
      status: mergeStatus(buyerValue.status, measuredOutcome.status),
      score: round(average([buyerValue.score, measuredOutcome.score])),
      owner: "Product owner",
      reviewerQuestion: "Can a stranger understand who this helps, how much it helps, and why now?",
      requiredProof: "Modeled value, measured run, named reviewer, and downside-aware buyer story.",
      evidence: `${buyerValue.claim} ${measuredOutcome.claim}`,
      action: buyerValue.status !== "pass" ? buyerValue.decisionRule : measuredOutcome.status !== "pass" ? measuredOutcome.decisionRule : "Keep the value story tied to the measured receipt.",
      href: input.links?.buyerOutcomeUrl ?? buyerValue.sourceHref
    },
    {
      id: "live-reachability",
      label: "Public proof opens globally",
      status: mergeStatus(publicReachability.status, liveSurface?.status === "block" ? "block" : liveSurface?.status === "watch" ? "watch" : "pass"),
      score: round(average([publicReachability.score, liveSurface?.score ?? 0])),
      owner: "Launch owner",
      reviewerQuestion: "Can a reviewer in another company open every critical proof link now?",
      requiredProof: "HTTPS product URL, story URL, walkthrough, pilot receipt, and work-order proof.",
      evidence: `${publicReachability.evidence} ${liveSurface?.evidence ?? ""}`.trim(),
      action: publicReachability.status !== "pass" ? publicReachability.decisionRule : "Keep live proof checks attached to the public launch room.",
      href: input.links?.launchEvidenceUrl ?? publicReachability.sourceHref
    },
    {
      id: "proof-substance",
      label: "Proof shows real work, not a brochure",
      status: mergeStatus(proofDepth.status, measuredOutcome.status),
      score: round(average([proofDepth.score, measuredOutcome.score])),
      owner: "Proof owner",
      reviewerQuestion: "Does the evidence prove an accepted workflow, not just a polished screen?",
      requiredProof: "Accepted A2A trial proof, measured outcome, public artifact trail, and receipt replay.",
      evidence: `${proofDepth.claim} ${measuredOutcome.evidence}`,
      action: proofDepth.status !== "pass" ? proofDepth.decisionRule : measuredOutcome.status !== "pass" ? measuredOutcome.decisionRule : "Keep receipts and public artifacts in the same proof packet.",
      href: input.links?.proofDossierUrl ?? proofDepth.sourceHref
    },
    {
      id: "ops-trust",
      label: "Operations and trust survive review",
      status: mergeStatus(productionOps.status, trustOffer.status),
      score: round(average([productionOps.score, trustOffer.score])),
      owner: "DevOps owner",
      reviewerQuestion: "Would an SRE, security reviewer, and procurement owner know the operating boundary?",
      requiredProof: "Deploy/test/security/observability ownership, data boundary, stop rule, and commercial cap.",
      evidence: `${productionOps.claim} ${trustOffer.claim}`,
      action: productionOps.status !== "pass" ? productionOps.decisionRule : trustOffer.status !== "pass" ? trustOffer.decisionRule : "Keep operations and trust artifacts linked from the buyer room.",
      href: input.links?.globalAuditUrl ?? productionOps.sourceHref
    },
    {
      id: "buyer-decision-path",
      label: "The next buyer decision is explicit",
      status: gateStatusFromDossier(input.dossier),
      score: input.dossier.dossierScore,
      owner: "Sponsor owner",
      reviewerQuestion: "Can the buyer decide publish, sponsor-review, or hold without another meeting?",
      requiredProof: "One decision ask, red lines, owner repair ledger, and acceptance path.",
      evidence: `${input.dossier.decisionAsk} ${input.dossier.verifiedSummary}`,
      action:
        input.dossier.decision === "share-with-buyer"
          ? "Send the launch room and keep the acceptance path attached."
          : input.dossier.decision === "sponsor-review"
            ? "Close sponsor review red lines before buyer delivery."
            : "Hold public launch until the first proof blocker is fixed.",
      href: input.links?.acceptancePathUrl ?? input.links?.proofDossierUrl ?? "#global-proof-dossier"
    }
  ];
}

function decisionFor(input: { dossier: GlobalProofDossier; gates: GlobalPublishabilityGate[]; score: number }): GlobalPublishabilityDecision {
  const blocked = input.gates.filter((gate) => gate.status === "block").length;
  const warnings = input.gates.filter((gate) => gate.status === "watch").length;
  if (blocked > 0 || input.dossier.decision === "hold-public-launch") return "do-not-publish";
  if (input.score >= 86 && warnings <= 1 && input.dossier.decision === "share-with-buyer") return "publish";
  return "sponsor-review";
}

function headlineFor(decision: GlobalPublishabilityDecision) {
  if (decision === "publish") return "This site is ready for a global public reviewer";
  if (decision === "sponsor-review") return "This site is close, but needs sponsor review before global launch";
  return "Do not present this site as globally publishable yet";
}

function hardTruthFor(decision: GlobalPublishabilityDecision, repairs: GlobalPublishabilityRepair[]) {
  if (decision === "publish") {
    return "A public visitor can open the product, understand the buyer value, inspect the proof, and see the next decision without a private explanation.";
  }
  const first = repairs[0];
  if (decision === "sponsor-review") return first ? `${first.label} needs owner confirmation before this becomes globally publishable.` : "The proof chain is close, but still needs an owner review before public traffic.";
  return first ? `${first.label} blocks global publishability: ${first.action}` : "A required public proof gate is not strong enough for global release.";
}

function decisionAskFor(decision: GlobalPublishabilityDecision, repairs: GlobalPublishabilityRepair[]) {
  if (decision === "publish") return "Publish the launch room and ask the buyer sponsor to approve a bounded pilot.";
  if (decision === "sponsor-review") return `Run sponsor review and close ${repairs[0]?.label ?? "the first warning"} before broad public traffic.`;
  return `Keep the site internal until ${repairs[0]?.label ?? "the first public proof blocker"} is repaired and rechecked.`;
}

const gatePriority: Record<GlobalPublishabilityGateId, number> = {
  "live-reachability": 0,
  "proof-substance": 1,
  "value-story": 2,
  "ops-trust": 3,
  "buyer-decision-path": 4
};

function buildRepairLedger(gates: GlobalPublishabilityGate[]): GlobalPublishabilityRepair[] {
  return gates
    .filter((gate) => gate.status !== "pass")
    .sort((left, right) => statusScore(left.status) - statusScore(right.status) || gatePriority[left.id] - gatePriority[right.id] || left.score - right.score)
    .slice(0, 6)
    .map((gate) => ({
      id: `repair-${gate.id}`,
      priority: gate.status === "block" ? "now" : "next",
      owner: gate.owner,
      label: gate.label,
      action: gate.action,
      href: gate.href
    }));
}

function buildValueRoute(gates: GlobalPublishabilityGate[]): GlobalPublishabilityValueRouteStep[] {
  return [
    { id: "buyer-value", label: "Buyer value", gateId: "value-story" },
    { id: "measured-proof", label: "Measured proof", gateId: "proof-substance" },
    { id: "public-proof", label: "Public proof", gateId: "live-reachability" },
    { id: "buyer-decision", label: "Buyer decision", gateId: "buyer-decision-path" }
  ].map((step) => {
    const gate = gates.find((candidate) => candidate.id === step.gateId)!;
    return {
      id: step.id as GlobalPublishabilityValueRouteStepId,
      label: step.label,
      status: gate.status,
      score: gate.score,
      owner: gate.owner,
      title: gate.label,
      evidence: gate.evidence,
      action: gate.action,
      href: gate.href
    };
  });
}

const reviewerProofQuestions: Record<GlobalPublishabilityValueRouteStepId, string> = {
  "buyer-value": "Can you explain the target buyer, monthly value, and downside case without a private walkthrough?",
  "measured-proof": "Can you open a receipt that shows accepted work, baseline, measured outcome, and reviewer context?",
  "public-proof": "Can every critical product, story, demo, and receipt URL open for an external reviewer right now?",
  "buyer-decision": "Can the sponsor choose publish, sponsor review, or hold from this room without another meeting?"
};

function reviewerDecisionFor(decision: GlobalPublishabilityDecision): GlobalPublishabilityReviewerDecisionId {
  if (decision === "publish") return "approve-bounded-pilot";
  if (decision === "sponsor-review") return "sponsor-review";
  return "hold-public-launch";
}

function reviewerBriefTitleFor(decision: GlobalPublishabilityDecision) {
  if (decision === "publish") return "Approve a bounded pilot from public proof";
  if (decision === "sponsor-review") return "Run sponsor review before public traffic";
  return "Hold external sharing until the proof route opens";
}

function sponsorQuestionFor(decision: GlobalPublishabilityDecision, targetBuyer: string) {
  if (decision === "publish") return `Can ${targetBuyer} approve a bounded pilot using only this launch room and its attached proof?`;
  if (decision === "sponsor-review") return `Which sponsor owner must clear the warning before ${targetBuyer} sees broad public traffic?`;
  return `What proof must be repaired before ${targetBuyer} is asked to review this launch publicly?`;
}

function stopRuleFor(repairs: GlobalPublishabilityRepair[]) {
  const blocker = repairs.find((repair) => repair.priority === "now") ?? repairs[0];
  if (blocker) return `Stop the external review until ${blocker.label} is repaired: ${blocker.action}`;
  return "Stop the send if any linked proof asks for login, contradicts the measured receipt, or loses its public URL.";
}

function buildReviewerDecisionOptions(input: {
  decision: GlobalPublishabilityDecision;
  repairs: GlobalPublishabilityRepair[];
  links?: GlobalPublishabilityReportLinks;
}): GlobalPublishabilityReviewerDecisionOption[] {
  const firstRepair = input.repairs[0];
  return [
    {
      id: "approve-bounded-pilot",
      label: "Approve bounded pilot",
      condition: "Use only when every value-route step passes and critical proof links open publicly.",
      action: "Open the launch room and ask the buyer sponsor for a bounded pilot approval.",
      href: input.links?.launchRoomUrl ?? input.links?.appUrl ?? "#"
    },
    {
      id: "sponsor-review",
      label: "Send to sponsor review",
      condition: "Use when the proof chain is mostly present but an owner must confirm a warning or red line.",
      action: firstRepair ? `Assign ${firstRepair.owner} to close ${firstRepair.label}.` : "Open the review kit and confirm the sponsor note.",
      href: firstRepair?.href ?? input.links?.buyerReviewKitUrl ?? input.links?.proofDossierUrl ?? "#"
    },
    {
      id: "hold-public-launch",
      label: "Hold public launch",
      condition: "Use when any public proof, value claim, operation boundary, or buyer decision step is blocked.",
      action: firstRepair ? `Repair ${firstRepair.label} before external sharing.` : "Keep the launch internal until the public proof route is rechecked.",
      href: firstRepair?.href ?? input.links?.launchEvidenceUrl ?? "#"
    }
  ];
}

function buildReviewerBrief(input: {
  decision: GlobalPublishabilityDecision;
  targetBuyer: string;
  valueRoute: GlobalPublishabilityValueRouteStep[];
  repairs: GlobalPublishabilityRepair[];
  links?: GlobalPublishabilityReportLinks;
}): GlobalPublishabilityReviewerBrief {
  return {
    title: reviewerBriefTitleFor(input.decision),
    timebox: input.decision === "publish" ? "10-minute buyer review" : "10-minute blocker triage",
    sponsorQuestion: sponsorQuestionFor(input.decision, input.targetBuyer),
    recommendedDecision: reviewerDecisionFor(input.decision),
    stopRule: stopRuleFor(input.repairs),
    proofChecks: input.valueRoute.map((step) => ({
      id: step.id,
      label: step.label,
      question: reviewerProofQuestions[step.id],
      status: step.status,
      evidence: step.evidence,
      action: step.action,
      href: step.href
    })),
    decisionOptions: buildReviewerDecisionOptions({ decision: input.decision, repairs: input.repairs, links: input.links })
  };
}

function buildLaunchLinks(links: GlobalPublishabilityReportLinks = {}): GlobalPublishabilityLink[] {
  return [
    links.launchRoomUrl ? { id: "launch-room", label: "Launch room", href: links.launchRoomUrl } : null,
    links.proofDossierUrl ? { id: "proof-dossier", label: "Proof dossier", href: links.proofDossierUrl } : null,
    links.globalAuditUrl ? { id: "global-audit", label: "Global audit", href: links.globalAuditUrl } : null,
    links.launchEvidenceUrl ? { id: "launch-evidence", label: "Live evidence", href: links.launchEvidenceUrl } : null,
    links.buyerReviewKitUrl ? { id: "review-kit", label: "Review kit", href: links.buyerReviewKitUrl } : null,
    links.acceptancePathUrl ? { id: "acceptance-path", label: "Acceptance path", href: links.acceptancePathUrl } : null
  ].filter((link): link is GlobalPublishabilityLink => Boolean(link));
}

function uniqueMemoLinks(links: GlobalPublishabilityLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.label}\n${link.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildHandoffMemo(input: {
  decision: GlobalPublishabilityDecision;
  targetBuyer: string;
  score: number;
  verifiedSummary: string;
  reviewerBrief: GlobalPublishabilityReviewerBrief;
  repairs: GlobalPublishabilityRepair[];
  launchLinks: GlobalPublishabilityLink[];
  primaryAction: { label: string; href: string };
}): GlobalPublishabilityHandoffMemo {
  const firstRepair = input.repairs[0];
  const proofLinks = uniqueMemoLinks([
    { id: "primary-action", label: input.primaryAction.label, href: input.primaryAction.href },
    ...(firstRepair ? [{ id: "first-repair", label: `Repair ${firstRepair.label}`, href: firstRepair.href }] : []),
    ...input.launchLinks
  ]).slice(0, 6);
  const proofLine = proofLinks.length ? `Open these links first: ${proofLinks.map((link) => link.label).join(", ")}.` : `Open the primary action: ${input.primaryAction.label}.`;

  if (input.decision === "publish") {
    const bodyLines = [
      `Please review the launch room for ${input.targetBuyer} and decide whether to approve a bounded pilot.`,
      `The publishability score is ${input.score}/100. ${input.verifiedSummary}`,
      `Use the review protocol: ${input.reviewerBrief.sponsorQuestion}`,
      `Stop rule: ${input.reviewerBrief.stopRule}`,
      proofLine
    ];
    return {
      audience: "buyer-sponsor",
      subject: `Pilot approval request: ${input.targetBuyer}`,
      statusLine: "Ready to send externally with the public proof room attached.",
      requestedDecision: "Approve the bounded pilot from the launch room, or return one named red line.",
      bodyLines,
      proofLinks,
      copyText: buildHandoffCopyText({
        subject: `Pilot approval request: ${input.targetBuyer}`,
        requestedDecision: "Approve the bounded pilot from the launch room, or return one named red line.",
        bodyLines,
        proofLinks
      })
    };
  }

  if (input.decision === "sponsor-review") {
    const bodyLines = [
      `Please run sponsor review before broad public traffic reaches ${input.targetBuyer}.`,
      `The publishability score is ${input.score}/100. ${input.verifiedSummary}`,
      firstRepair ? `First owner decision: ${firstRepair.owner} must close ${firstRepair.label} - ${firstRepair.action}` : "Confirm the remaining warning before buyer delivery.",
      `Stop rule: ${input.reviewerBrief.stopRule}`,
      proofLine
    ];
    return {
      audience: "internal-sponsor",
      subject: `Sponsor review required: ${firstRepair?.label ?? input.targetBuyer}`,
      statusLine: "Internal review required before this becomes a public buyer handoff.",
      requestedDecision: firstRepair ? `Confirm or repair ${firstRepair.label} before external sharing.` : "Confirm the sponsor review note before external sharing.",
      bodyLines,
      proofLinks,
      copyText: buildHandoffCopyText({
        subject: `Sponsor review required: ${firstRepair?.label ?? input.targetBuyer}`,
        requestedDecision: firstRepair ? `Confirm or repair ${firstRepair.label} before external sharing.` : "Confirm the sponsor review note before external sharing.",
        bodyLines,
        proofLinks
      })
    };
  }

  const bodyLines = [
    `Do not ask an external buyer to review this launch yet.`,
    `The publishability score is ${input.score}/100. ${input.verifiedSummary}`,
    firstRepair ? `First blocker: ${firstRepair.label} - ${firstRepair.action}` : "A required public proof gate is still blocked.",
    `Stop rule: ${input.reviewerBrief.stopRule}`,
    proofLine
  ];
  return {
    audience: "launch-owner",
    subject: `Do not send: ${firstRepair?.label ?? "public proof blocker"}`,
    statusLine: "Internal repair only; external buyer sharing is locked.",
    requestedDecision: firstRepair ? `Repair ${firstRepair.label} and rerun the publishability report.` : "Repair the first public proof blocker and rerun the publishability report.",
    bodyLines,
    proofLinks,
    noSendWarning: "Do not send this memo to a buyer as an approval request; use it to drive the internal repair.",
    copyText: buildHandoffCopyText({
      subject: `Do not send: ${firstRepair?.label ?? "public proof blocker"}`,
      requestedDecision: firstRepair ? `Repair ${firstRepair.label} and rerun the publishability report.` : "Repair the first public proof blocker and rerun the publishability report.",
      bodyLines,
      proofLinks,
      warning: "Do not send this memo to a buyer as an approval request; use it to drive the internal repair."
    })
  };
}

function buildHandoffCopyText(input: { subject: string; requestedDecision: string; bodyLines: string[]; proofLinks: GlobalPublishabilityLink[]; warning?: string }) {
  return [
    `Subject: ${input.subject}`,
    "",
    `Requested decision: ${input.requestedDecision}`,
    ...(input.warning ? ["", input.warning] : []),
    "",
    ...input.bodyLines,
    "",
    "Links:",
    ...(input.proofLinks.length ? input.proofLinks.map((link) => `- ${link.label}: ${link.href}`) : ["- No public links attached."])
  ].join("\n");
}

function launchPacketHeadlineFor(decision: GlobalPublishabilityDecision) {
  if (decision === "publish") return "Launch packet is ready for public send";
  if (decision === "sponsor-review") return "Launch packet needs sponsor review before send";
  return "Launch packet is locked until public proof is repaired";
}

function buildLaunchPacketMarkdown(packet: Omit<GlobalPublishabilityLaunchPacket, "copyText" | "href">) {
  return [
    "# Global publishability launch packet",
    "",
    `Status: ${packet.status}`,
    `Headline: ${packet.headline}`,
    `Current owner: ${packet.currentOwner}`,
    `Current command: ${packet.currentCommand}`,
    `Publish rule: ${packet.publishRule}`,
    `Escalation rule: ${packet.escalationRule}`,
    `Open blockers: ${packet.blockedCount}`,
    `Review items: ${packet.watchCount}`,
    "",
    "## Launch items",
    ...packet.items.flatMap((item) => [
      `- [${item.priority}/${item.status}] ${item.owner}: ${item.label}`,
      `  - Command: ${item.command}`,
      `  - Proof to attach: ${item.proofToAttach}`,
      `  - Done signal: ${item.doneSignal}`,
      `  - Link: ${item.href}`
    ]),
    ...(packet.additionalItemCount ? ["", `${packet.additionalItemCount} additional launch item(s) omitted from this compact packet.`] : [])
  ].join("\n");
}

function buildLaunchPacket(input: {
  decision: GlobalPublishabilityDecision;
  targetBuyer: string;
  gates: GlobalPublishabilityGate[];
  primaryAction: { label: string; href: string };
  links?: GlobalPublishabilityReportLinks;
}): GlobalPublishabilityLaunchPacket {
  const blockedCount = input.gates.filter((gate) => gate.status === "block").length;
  const watchCount = input.gates.filter((gate) => gate.status === "watch").length;
  const openGateItems = input.gates
    .filter((gate) => gate.status !== "pass")
    .sort((left, right) => statusScore(left.status) - statusScore(right.status) || gatePriority[left.id] - gatePriority[right.id] || left.score - right.score)
    .map<GlobalPublishabilityLaunchPacketItem>((gate) => ({
      id: `launch-${gate.id}`,
      status: gate.status,
      priority: gate.status === "block" ? "now" : "next",
      owner: gate.owner,
      label: gate.label,
      command: gate.action,
      proofToAttach: `${gate.requiredProof} Evidence: ${gate.evidence}`,
      doneSignal: `${gate.label} returns pass in the regenerated publishability report.`,
      href: gate.href
    }));
  const allItems =
    openGateItems.length > 0
      ? openGateItems
      : [
          {
            id: "verify-public-route-before-publish",
            status: "pass",
            priority: "verify",
            owner: "Launch owner",
            label: "Verify public route before publish",
            command: "Replay the publishability receipt and attach the current launch room, proof dossier, and acceptance path before sending.",
            proofToAttach: "Current publishability receipt, launch room URL, proof dossier, and acceptance path.",
            doneSignal: "Receipt verifies and every value-route step still returns pass.",
            href: input.links?.launchRoomUrl ?? input.links?.proofDossierUrl ?? input.primaryAction.href
          } satisfies GlobalPublishabilityLaunchPacketItem
        ];
  const items = allItems.slice(0, 6);
  const current = items[0];
  const publishRule =
    input.decision === "publish"
      ? `Publish to ${input.targetBuyer} only with the receipt, launch room, proof dossier, and acceptance path attached.`
      : `Do not publish for ${input.targetBuyer} until ${blockedCount} blocker(s) and ${watchCount} review item(s) close.`;
  const escalationRule =
    input.decision === "publish"
      ? "If receipt replay fails or any launch link stops opening, hold the send and rerun the publishability report."
      : `${current.owner} owns the next public-readiness fix. If it cannot close, keep decision ${input.decision} and rerun after repair.`;
  const packet: Omit<GlobalPublishabilityLaunchPacket, "copyText" | "href"> = {
    status: statusFor(input.decision),
    headline: launchPacketHeadlineFor(input.decision),
    currentOwner: current.owner,
    currentCommand: current.command,
    publishRule,
    escalationRule,
    blockedCount,
    watchCount,
    itemCount: allItems.length,
    additionalItemCount: Math.max(0, allItems.length - items.length),
    items
  };
  const copyText = buildLaunchPacketMarkdown(packet);

  return {
    ...packet,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildRepairTicketMarkdown(ticket: Omit<GlobalPublishabilityRepairTicket, "copyText" | "href">) {
  return [
    "# Global publishability repair ticket",
    "",
    `Ticket: ${ticket.id}`,
    `Priority: ${ticket.priority}`,
    `Status: ${ticket.status}`,
    `Owner: ${ticket.owner}`,
    `Title: ${ticket.title}`,
    "",
    "## Command",
    ticket.command,
    "",
    "## Proof to attach",
    ticket.proofToAttach,
    "",
    "## Acceptance criteria",
    ...ticket.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    "",
    "## Recheck",
    `Open: ${ticket.recheck.label}`,
    `URL: ${ticket.recheck.href}`,
    `Expected signal: ${ticket.recheck.expectedSignal}`,
    "",
    "## Receipt guard",
    ticket.receiptGuard
  ].join("\n");
}

function buildRepairTickets(input: {
  decision: GlobalPublishabilityDecision;
  targetBuyer: string;
  launchPacket: GlobalPublishabilityLaunchPacket;
  links?: GlobalPublishabilityReportLinks;
}): GlobalPublishabilityRepairTicket[] {
  const recheckHref = input.links?.jsonUrl ?? input.links?.markdownUrl ?? input.links?.launchRoomUrl ?? input.launchPacket.items[0]?.href ?? "#";
  return input.launchPacket.items.map((item, index) => {
    const ticket: Omit<GlobalPublishabilityRepairTicket, "copyText" | "href"> = {
      id: `repair-ticket-${String(index + 1).padStart(2, "0")}-${item.id.replace(/^launch-/, "")}`,
      sourceItemId: item.id,
      status: item.status,
      priority: item.priority,
      owner: item.owner,
      title: item.label,
      command: item.command,
      proofToAttach: item.proofToAttach,
      acceptanceCriteria: [
        item.doneSignal,
        "A reviewer can open the attached proof without private context or a separate walkthrough.",
        "The regenerated global publishability report shows this ticket's source item as pass."
      ],
      recheck: {
        label: "Rerun global publishability report",
        href: recheckHref,
        expectedSignal: item.status === "pass" ? "Receipt verifies and every value-route step still returns pass." : item.doneSignal
      },
      receiptGuard:
        input.decision === "publish"
          ? `Before sending to ${input.targetBuyer}, replay the publishability receipt and keep this ticket attached to the launch packet.`
          : "Do not close this ticket until the regenerated publishability receipt verifies and the blocker no longer appears in the launch packet."
    };
    const copyText = buildRepairTicketMarkdown(ticket);

    return {
      ...ticket,
      copyText,
      href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
    };
  });
}

function runbookModeFor(decision: GlobalPublishabilityDecision): GlobalPublishabilityRepairRunbookMode {
  if (decision === "publish") return "send-ready";
  if (decision === "sponsor-review") return "sponsor-review";
  return "repair-required";
}

function proofSlotFor(sourceItemId: string) {
  if (sourceItemId.includes("value-story")) return "Buyer value proof, measured run receipt, and target-user story.";
  if (sourceItemId.includes("live-reachability")) return "HTTPS product URL, ProtoPedia/story URL, walkthrough URL, and public receipt URLs.";
  if (sourceItemId.includes("proof-substance")) return "Buyer proof room, accepted A2A receipt, and evidence dossier links.";
  if (sourceItemId.includes("ops-trust")) return "Cloud Run operations proof, trust manifest, and incident/rollback evidence.";
  if (sourceItemId.includes("buyer-decision-path")) return "Buyer review kit, acceptance path, commercial boundary, and decision receipt.";
  if (sourceItemId.includes("verify-public-route")) return "Current receipt verify JSON, launch room, proof dossier, and acceptance path.";
  return "Public proof attachment that closes this publishability gate.";
}

const GLOBAL_PROOF_PLACEHOLDERS = {
  productUrl: "<public Cloud Run product URL reviewers can open>",
  protopediaUrl: "<published ProtoPedia work URL>",
  videoUrl: "<public or unlisted walkthrough video URL>",
  pilotReceiptUrl: "<public measured pilot receipt URL>",
  workOrderProofUrl: "<public buyer-approved work-order proof URL>",
  buyerProofRoomUrl: "<public buyer proof room URL>",
  proofDossierUrl: "<public global proof dossier URL>",
  trustManifestUrl: "<public trust manifest URL>",
  launchRoomUrl: "<public launch room URL>",
  buyerReviewKitUrl: "<public buyer review kit URL>",
  acceptancePathUrl: "<public buyer acceptance path URL>",
  publicProofUrl: "<public proof artifact URL reviewers can open>"
} as const;

function proofRequirement(
  id: string,
  label: string,
  kind: GlobalPublishabilityRepairProofRequirementKind,
  placeholder: string,
  description: string,
  required = true
): GlobalPublishabilityRepairProofRequirement {
  return { id, label, kind, required, placeholder, description };
}

function proofRequirementsFor(sourceItemId: string): GlobalPublishabilityRepairProofRequirement[] {
  if (sourceItemId.includes("live-reachability")) {
    return [
      proofRequirement("targetUrl", "Live product", "product-url", GLOBAL_PROOF_PLACEHOLDERS.productUrl, "Externally reachable product URL, not localhost or a sample domain."),
      proofRequirement("protopediaUrl", "ProtoPedia story", "story-url", GLOBAL_PROOF_PLACEHOLDERS.protopediaUrl, "Published ProtoPedia work page with the hackathon story."),
      proofRequirement("videoUrl", "Walkthrough video", "video-url", GLOBAL_PROOF_PLACEHOLDERS.videoUrl, "Public or unlisted walkthrough that shows the buyer workflow end to end.")
    ];
  }
  if (sourceItemId.includes("value-story")) {
    return [
      proofRequirement("pilotEvidenceUrl", "Measured receipt", "receipt-url", GLOBAL_PROOF_PLACEHOLDERS.pilotReceiptUrl, "Buyer-observed pilot receipt with accepted tasks and measured time saved."),
      proofRequirement("workOrderEvidenceUrl", "Work-order proof", "receipt-url", GLOBAL_PROOF_PLACEHOLDERS.workOrderProofUrl, "Buyer-approved work order that names target user, workflow, and success metric.")
    ];
  }
  if (sourceItemId.includes("proof-substance")) {
    return [
      proofRequirement("buyerProofRoomUrl", "Buyer proof room", "review-url", GLOBAL_PROOF_PLACEHOLDERS.buyerProofRoomUrl, "Public proof room a buyer can inspect without a private walkthrough."),
      proofRequirement("proofDossierUrl", "Proof dossier", "receipt-url", GLOBAL_PROOF_PLACEHOLDERS.proofDossierUrl, "Evidence dossier linking claims, proof links, and receipt replay.")
    ];
  }
  if (sourceItemId.includes("ops-trust")) {
    return [
      proofRequirement("trustManifestUrl", "Trust manifest", "ops-url", GLOBAL_PROOF_PLACEHOLDERS.trustManifestUrl, "Public trust manifest with receipt replay and operating boundaries."),
      proofRequirement("launchRoomUrl", "Launch room", "launch-url", GLOBAL_PROOF_PLACEHOLDERS.launchRoomUrl, "Launch room that exposes current proof, owner, and stop rules.")
    ];
  }
  if (sourceItemId.includes("buyer-decision-path")) {
    return [
      proofRequirement("buyerReviewKitUrl", "Buyer review kit", "review-url", GLOBAL_PROOF_PLACEHOLDERS.buyerReviewKitUrl, "Review kit where the buyer can inspect proof and record a decision."),
      proofRequirement("acceptancePathUrl", "Acceptance path", "review-url", GLOBAL_PROOF_PLACEHOLDERS.acceptancePathUrl, "Acceptance path that records continue, revise, or stop with receipt evidence.")
    ];
  }
  if (sourceItemId.includes("verify-public-route")) {
    return [
      proofRequirement("launchRoomUrl", "Launch room", "launch-url", GLOBAL_PROOF_PLACEHOLDERS.launchRoomUrl, "Current public launch room opened from a clean browser."),
      proofRequirement("proofDossierUrl", "Proof dossier", "receipt-url", GLOBAL_PROOF_PLACEHOLDERS.proofDossierUrl, "Current proof dossier with receipt replay attached."),
      proofRequirement("acceptancePathUrl", "Acceptance path", "review-url", GLOBAL_PROOF_PLACEHOLDERS.acceptancePathUrl, "Current buyer acceptance path attached to the send packet.")
    ];
  }
  return [proofRequirement("publicProofUrl", "Public proof URL", "receipt-url", GLOBAL_PROOF_PLACEHOLDERS.publicProofUrl, "Public artifact that closes this publishability gate.")];
}

function inputLabelFor(ticket: GlobalPublishabilityRepairTicket) {
  if (ticket.priority === "verify") return "Open final verification";
  if (ticket.status === "block") return "Open first repair surface";
  return "Open sponsor review surface";
}

function shareGateForTicket(ticket: GlobalPublishabilityRepairTicket, decision: GlobalPublishabilityDecision) {
  if (decision === "publish") return "External send can proceed only after this verification step replays the receipt.";
  if (ticket.status === "block") return "No external send: close this blocker, regenerate the report, then replay the receipt.";
  return "Internal sponsor review only: close or explicitly accept this watch item before buyer sharing.";
}

function buildRepairRunbookStep(ticket: GlobalPublishabilityRepairTicket, index: number, decision: GlobalPublishabilityDecision): GlobalPublishabilityRepairRunbookStep {
  return {
    id: `runbook-step-${String(index + 1).padStart(2, "0")}-${ticket.sourceItemId.replace(/^launch-/, "")}`,
    ticketId: ticket.id,
    sequence: index + 1,
    status: ticket.status,
    priority: ticket.priority,
    owner: ticket.owner,
    title: ticket.title,
    command: ticket.command,
    inputLabel: inputLabelFor(ticket),
    inputHref: ticket.recheck.href,
    proofSlot: proofSlotFor(ticket.sourceItemId),
    proofRequirements: proofRequirementsFor(ticket.sourceItemId),
    acceptanceSignal: ticket.acceptanceCriteria[0] ?? ticket.recheck.expectedSignal,
    recheckHref: ticket.recheck.href,
    recheckSignal: ticket.recheck.expectedSignal,
    receiptGuard: ticket.receiptGuard,
    shareGate: shareGateForTicket(ticket, decision)
  };
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildRepairRunbookCsv(steps: GlobalPublishabilityRepairRunbookStep[]) {
  const rows = [
    [
      "sequence",
      "ticketId",
      "priority",
      "status",
      "owner",
      "title",
      "inputHref",
      "proofSlot",
      "proofRequirements",
      "acceptanceSignal",
      "recheckSignal",
      "shareGate"
    ],
    ...steps.map((step) => [
      step.sequence,
      step.ticketId,
      step.priority,
      step.status,
      step.owner,
      step.title,
      step.inputHref,
      step.proofSlot,
      step.proofRequirements.map((requirement) => `${requirement.label} (${requirement.id})`).join("; "),
      step.acceptanceSignal,
      step.recheckSignal,
      step.shareGate
    ])
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function buildRepairRunbookMarkdown(runbook: Omit<GlobalPublishabilityRepairRunbook, "copyText" | "href" | "csvText" | "csvHref">) {
  return [
    "# Owner repair runbook",
    "",
    `Mode: ${runbook.mode}`,
    `Status: ${runbook.status}`,
    `External share locked: ${runbook.externalShareLocked}`,
    `Current owner: ${runbook.currentOwner}`,
    `Current command: ${runbook.currentCommand}`,
    `Share rule: ${runbook.shareRule}`,
    `Verification command: ${runbook.verificationCommand}`,
    "",
    runbook.headline,
    runbook.summary,
    "",
    "## Steps",
    ...runbook.steps.flatMap((step) => [
      "",
      `### ${step.sequence}. ${step.title}`,
      `Ticket: ${step.ticketId}`,
      `Priority: ${step.priority}`,
      `Status: ${step.status}`,
      `Owner: ${step.owner}`,
      `Input: ${step.inputLabel} (${step.inputHref})`,
      `Command: ${step.command}`,
      `Proof slot: ${step.proofSlot}`,
      "Proof requirements:",
      ...step.proofRequirements.map((requirement) => `- ${requirement.required ? "required" : "optional"} ${requirement.label}: ${requirement.description}`),
      `Acceptance signal: ${step.acceptanceSignal}`,
      `Recheck: ${step.recheckSignal} (${step.recheckHref})`,
      `Share gate: ${step.shareGate}`,
      `Receipt guard: ${step.receiptGuard}`
    ])
  ].join("\n");
}

function buildRepairRunbook(input: {
  decision: GlobalPublishabilityDecision;
  targetBuyer: string;
  launchPacket: GlobalPublishabilityLaunchPacket;
  repairTickets: GlobalPublishabilityRepairTicket[];
}): GlobalPublishabilityRepairRunbook {
  const mode = runbookModeFor(input.decision);
  const steps = input.repairTickets.map((ticket, index) => buildRepairRunbookStep(ticket, index, input.decision));
  const firstStep = steps[0];
  const externalShareLocked = input.decision !== "publish";
  const shareRule =
    input.decision === "publish"
      ? `Send to ${input.targetBuyer} only with the current receipt, launch room, proof dossier, and acceptance path attached.`
      : input.decision === "sponsor-review"
        ? `Keep ${input.targetBuyer} sharing internal until sponsor review accepts the watch item and the receipt replays.`
        : `Do not send to ${input.targetBuyer}; close the first blocker, regenerate the report, and replay the receipt.`;
  const verificationCommand = `POST the exported Verify JSON to ${GLOBAL_PUBLISHABILITY_RECEIPT_VERIFY_PATH}; accept the runbook only when the checksum verifies and the regenerated launch packet no longer contains the closed blocker.`;
  const base: Omit<GlobalPublishabilityRepairRunbook, "copyText" | "href" | "csvText" | "csvHref"> = {
    mode,
    status: input.launchPacket.status,
    headline:
      mode === "send-ready"
        ? "Run final proof replay before public send"
        : mode === "sponsor-review"
          ? "Run sponsor-owned repair before buyer sharing"
          : "Run owner repairs before this leaves the workspace",
    summary:
      mode === "send-ready"
        ? "The public route is ready, but the operator still has one replay step that binds the current receipt to the launch room and acceptance path."
        : `${steps.length} owner step${steps.length === 1 ? "" : "s"} must close before this report can become an external buyer handoff.`,
    externalShareLocked,
    currentOwner: firstStep?.owner ?? input.launchPacket.currentOwner,
    currentCommand: firstStep?.command ?? input.launchPacket.currentCommand,
    verificationCommand,
    shareRule,
    stepCount: steps.length,
    nowCount: steps.filter((step) => step.priority === "now").length,
    nextCount: steps.filter((step) => step.priority === "next").length,
    verifyCount: steps.filter((step) => step.priority === "verify").length,
    steps
  };
  const copyText = buildRepairRunbookMarkdown(base);
  const csvText = buildRepairRunbookCsv(steps);

  return {
    ...base,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`,
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}

function primaryActionFor(input: { decision: GlobalPublishabilityDecision; repairs: GlobalPublishabilityRepair[]; links?: GlobalPublishabilityReportLinks }) {
  if (input.decision === "publish") {
    return {
      label: "Open launch room",
      href: input.links?.launchRoomUrl ?? input.links?.appUrl ?? "#"
    };
  }
  const firstRepair = input.repairs[0];
  if (input.decision === "sponsor-review") {
    return {
      label: firstRepair ? `Review ${firstRepair.label}` : "Open proof dossier",
      href: firstRepair?.href ?? input.links?.proofDossierUrl ?? "#"
    };
  }
  return {
    label: firstRepair ? `Fix ${firstRepair.label}` : "Fix public proof",
    href: firstRepair?.href ?? input.links?.launchEvidenceUrl ?? "#"
  };
}

function statusFor(decision: GlobalPublishabilityDecision): GlobalPublishabilityStatus {
  if (decision === "publish") return "pass";
  if (decision === "sponsor-review") return "watch";
  return "block";
}

function buildMarkdown(report: Omit<GlobalPublishabilityReport, "exportMarkdown">) {
  return [
    `# ${report.headline}`,
    "",
    "Global Publishability Report",
    "",
    `Decision: ${report.decision}`,
    `Publishability score: ${report.publishabilityScore}/100`,
    `Target buyer: ${report.targetBuyer}`,
    `Decision ask: ${report.decisionAsk}`,
    "",
    report.hardTruth,
    "",
    "## Public pitch",
    report.publicPitch,
    "",
    "## Publishability receipt",
    `Receipt: ${report.receipt.receiptId}`,
    `Checksum: ${report.receipt.checksumAlgorithm}:${report.receipt.checksum}`,
    `Verification: ${report.receipt.verification.status}`,
    `API verification: POST ${report.receipt.verificationApiPath}`,
    "",
    "## Handoff memo",
    `Audience: ${report.handoffMemo.audience}`,
    `Subject: ${report.handoffMemo.subject}`,
    `Status: ${report.handoffMemo.statusLine}`,
    `Requested decision: ${report.handoffMemo.requestedDecision}`,
    ...(report.handoffMemo.noSendWarning ? [`Warning: ${report.handoffMemo.noSendWarning}`] : []),
    "",
    ...report.handoffMemo.bodyLines.map((line) => `- ${line}`),
    "",
    "### Handoff links",
    ...report.handoffMemo.proofLinks.map((link) => `- ${link.label}: ${link.href}`),
    "",
    "## Launch packet",
    `Status: ${report.launchPacket.status}`,
    `Current owner: ${report.launchPacket.currentOwner}`,
    `Current command: ${report.launchPacket.currentCommand}`,
    `Publish rule: ${report.launchPacket.publishRule}`,
    `Escalation rule: ${report.launchPacket.escalationRule}`,
    "",
    ...report.launchPacket.items.flatMap((item) => [
      `- [${item.priority}/${item.status}] ${item.owner}: ${item.label}`,
      `  - Command: ${item.command}`,
      `  - Proof to attach: ${item.proofToAttach}`,
      `  - Done signal: ${item.doneSignal}`,
      `  - Link: ${item.href}`
    ]),
    ...(report.launchPacket.additionalItemCount ? ["", `${report.launchPacket.additionalItemCount} additional launch item(s) omitted from this compact packet.`] : []),
    "",
    "## Repair tickets",
    ...report.repairTickets.flatMap((ticket) => [
      `- [${ticket.priority}/${ticket.status}] ${ticket.owner}: ${ticket.title}`,
      `  - Command: ${ticket.command}`,
      `  - Proof to attach: ${ticket.proofToAttach}`,
      `  - Recheck: ${ticket.recheck.label} (${ticket.recheck.href})`,
      `  - Expected signal: ${ticket.recheck.expectedSignal}`,
      `  - Receipt guard: ${ticket.receiptGuard}`
    ]),
    "",
    "## Owner repair runbook",
    `Mode: ${report.repairRunbook.mode}`,
    `External share locked: ${report.repairRunbook.externalShareLocked}`,
    `Current owner: ${report.repairRunbook.currentOwner}`,
    `Current command: ${report.repairRunbook.currentCommand}`,
    `Share rule: ${report.repairRunbook.shareRule}`,
    `Verification command: ${report.repairRunbook.verificationCommand}`,
    "",
    ...report.repairRunbook.steps.flatMap((step) => [
	      `- [${step.priority}/${step.status}] ${step.sequence}. ${step.owner}: ${step.title}`,
	      `  - Input: ${step.inputLabel} (${step.inputHref})`,
	      `  - Proof slot: ${step.proofSlot}`,
	      `  - Proof requirements: ${step.proofRequirements.map((requirement) => `${requirement.label} (${requirement.id})`).join("; ")}`,
	      `  - Acceptance signal: ${step.acceptanceSignal}`,
      `  - Recheck: ${step.recheckSignal}`,
      `  - Share gate: ${step.shareGate}`
    ]),
    "",
    "## Reviewer decision brief",
    `Recommended decision: ${report.reviewerBrief.recommendedDecision}`,
    `Timebox: ${report.reviewerBrief.timebox}`,
    `Sponsor question: ${report.reviewerBrief.sponsorQuestion}`,
    `Stop rule: ${report.reviewerBrief.stopRule}`,
    "",
    "### Reviewer proof checks",
    ...report.reviewerBrief.proofChecks.flatMap((check) => [
      `- [${check.status}] ${check.label}: ${check.question}`,
      `  - Evidence: ${check.evidence}`,
      `  - Action: ${check.action}`,
      `  - Link: ${check.href}`
    ]),
    "",
    "### Decision options",
    ...report.reviewerBrief.decisionOptions.map((option) => `- ${option.label}: ${option.condition} Action: ${option.action} (${option.href})`),
    "",
    "## Buyer value route",
    ...report.valueRoute.flatMap((step) => [
      `- [${step.status}] ${step.label}: ${step.title} (${step.score}/100)`,
      `  - Owner: ${step.owner}`,
      `  - Evidence: ${step.evidence}`,
      `  - Action: ${step.action}`,
      `  - Link: ${step.href}`
    ]),
    "",
    "## Publishability gates",
    ...report.gates.flatMap((gate) => [
      `- [${gate.status}] ${gate.label} (${gate.score}/100)`,
      `  - Reviewer question: ${gate.reviewerQuestion}`,
      `  - Required proof: ${gate.requiredProof}`,
      `  - Evidence: ${gate.evidence}`,
      `  - Action: ${gate.action}`,
      `  - Link: ${gate.href}`
    ]),
    "",
    "## Repair ledger",
    ...(report.repairLedger.length
      ? report.repairLedger.map((repair) => `- [${repair.priority}] ${repair.owner}: ${repair.action} (${repair.href})`)
      : ["- None"]),
    "",
    "## Proof links",
    ...report.proofLinks.map((link) => `- [${link.status}] ${link.label}: ${link.url || "missing"} - ${link.evidence}`),
    "",
    "## Launch links",
    ...report.launchLinks.map((link) => `- ${link.label}: ${link.href}`)
  ].join("\n");
}

export function buildGlobalPublishabilityReport(input: {
  audit: GlobalLaunchAudit;
  dossier: GlobalProofDossier;
  generatedAt?: string;
  links?: GlobalPublishabilityReportLinks;
}): GlobalPublishabilityReport {
  const gates = buildGates(input);
  const gateScore = round(average(gates.map((gate) => gate.score)));
  const score = round(
    average([
      gateScore,
      input.audit.score,
      input.dossier.dossierScore,
      input.dossier.proofLinks.length ? average(input.dossier.proofLinks.map((link) => statusScore(link.status))) : 0
    ]) * (gates.some((gate) => gate.status === "block") ? 0.92 : 1)
  );
  const decision = decisionFor({ dossier: input.dossier, gates, score });
  const valueRoute = buildValueRoute(gates);
  const repairLedger = buildRepairLedger(gates);
  const reviewerBrief = buildReviewerBrief({ decision, targetBuyer: input.audit.targetMarket, valueRoute, repairs: repairLedger, links: input.links });
  const launchLinks = buildLaunchLinks(input.links);
  const primaryAction = primaryActionFor({ decision, repairs: repairLedger, links: input.links });
  const launchPacket = buildLaunchPacket({ decision, targetBuyer: input.audit.targetMarket, gates, primaryAction, links: input.links });
  const repairTickets = buildRepairTickets({ decision, targetBuyer: input.audit.targetMarket, launchPacket, links: input.links });
  const repairRunbook = buildRepairRunbook({ decision, targetBuyer: input.audit.targetMarket, launchPacket, repairTickets });
  const verifiedSummary = `${input.dossier.verifiedSummary} ${gates.filter((gate) => gate.status === "pass").length}/${gates.length} publishability gates pass.`;
  const handoffMemo = buildHandoffMemo({
    decision,
    targetBuyer: input.audit.targetMarket,
    score,
    verifiedSummary,
    reviewerBrief,
    repairs: repairLedger,
    launchLinks,
    primaryAction
  });
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const partial: Omit<GlobalPublishabilityReport, "exportMarkdown" | "receipt"> = {
    id: `global-publishability-${decision}-${score}`,
    generatedAt,
    decision,
    status: statusFor(decision),
    publishabilityScore: score,
    headline: headlineFor(decision),
    hardTruth: hardTruthFor(decision, repairLedger),
    targetBuyer: input.audit.targetMarket,
    publicPitch: `${input.audit.launchNarrative} ${input.dossier.decisionAsk}`,
    decisionAsk: decisionAskFor(decision, repairLedger),
    verifiedSummary,
    valueRoute,
    reviewerBrief,
    handoffMemo,
    launchPacket,
    repairTickets,
    repairRunbook,
    gates,
    repairLedger,
    proofLinks: input.dossier.proofLinks,
    launchLinks,
    primaryAction
  };
  const receipt = buildGlobalPublishabilityReceipt(partial);
  const reportWithoutMarkdown: Omit<GlobalPublishabilityReport, "exportMarkdown"> = {
    ...partial,
    receipt
  };

  return {
    ...reportWithoutMarkdown,
    exportMarkdown: buildMarkdown(reportWithoutMarkdown)
  };
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
  return value.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function tone(status: string) {
  if (["publish", "pass"].includes(status)) return "good";
  if (["do-not-publish", "block"].includes(status)) return "bad";
  return "watch";
}

function linkedHref(href: string, appUrl?: string) {
  if (!href.startsWith("#")) return href;
  return appUrl ? `${appUrl.replace(/#.*$/, "")}${href}` : href;
}

export function renderGlobalPublishabilityReportHtml(report: GlobalPublishabilityReport, links: GlobalPublishabilityReportLinks = {}) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.proofDossierUrl ? `<a href="${escapeHtml(links.proofDossierUrl)}">Proof dossier</a>` : "",
    links.globalAuditUrl ? `<a href="${escapeHtml(links.globalAuditUrl)}">Audit</a>` : "",
    links.launchEvidenceUrl ? `<a href="${escapeHtml(links.launchEvidenceUrl)}">Live evidence</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const gates = report.gates
    .map(
      (gate) => `
        <article class="gate ${tone(gate.status)}">
          <div><span>${escapeHtml(gate.status)}</span><b>${escapeHtml(gate.score)}</b></div>
          <strong>${escapeHtml(gate.label)}</strong>
          <p>${escapeHtml(gate.reviewerQuestion)}</p>
          <small>${escapeHtml(gate.evidence)}</small>
          <a href="${escapeHtml(linkedHref(gate.href, links.appUrl))}">${gate.status === "pass" ? "Inspect" : "Repair"}</a>
        </article>`
    )
    .join("");
  const valueRoute = report.valueRoute
    .map(
      (step, index) => `
        <article class="value-step ${tone(step.status)}">
          <span>Step ${escapeHtml(String(index + 1).padStart(2, "0"))} / ${escapeHtml(step.label)}</span>
          <strong>${escapeHtml(step.title)}</strong>
          <p>${escapeHtml(step.evidence)}</p>
          <small>${escapeHtml(step.action)}</small>
          <a href="${escapeHtml(linkedHref(step.href, links.appUrl))}">${step.status === "pass" ? "Inspect proof" : "Repair step"}</a>
        </article>`
    )
    .join("");
  const reviewerProofChecks = report.reviewerBrief.proofChecks
    .map(
      (check) => `
        <article class="review-check ${tone(check.status)}">
          <span>${escapeHtml(check.status)} / ${escapeHtml(check.label)}</span>
          <strong>${escapeHtml(check.question)}</strong>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.action)}</small>
          <a href="${escapeHtml(linkedHref(check.href, links.appUrl))}">${check.status === "pass" ? "Inspect proof" : "Repair proof"}</a>
        </article>`
    )
    .join("");
  const decisionOptions = report.reviewerBrief.decisionOptions
    .map((option) => {
      const recommended = option.id === report.reviewerBrief.recommendedDecision;
      return `
        <article class="decision-option ${recommended ? tone(report.status) : ""}">
          <span>${recommended ? "Recommended" : "Option"}</span>
          <strong>${escapeHtml(option.label)}</strong>
          <p>${escapeHtml(option.condition)}</p>
          <small>${escapeHtml(option.action)}</small>
          <a href="${escapeHtml(linkedHref(option.href, links.appUrl))}">Open</a>
        </article>`;
    })
    .join("");
  const reviewResponseDecisionOptions = report.reviewerBrief.decisionOptions
    .map(
      (option) =>
        `<option value="${escapeHtml(option.id)}"${option.id === report.reviewerBrief.recommendedDecision ? " selected" : ""}>${escapeHtml(option.label)}</option>`
    )
    .join("");
  const reviewResponseProofInputs = report.reviewerBrief.proofChecks
    .map(
      (check) => `
        <label class="review-response-proof ${tone(check.status)}">
          <input type="checkbox" data-review-proof-id="${escapeHtml(check.id)}"${check.status === "pass" ? " checked" : ""} />
          <span>${escapeHtml(check.label)}</span>
          <small>${escapeHtml(check.question)}</small>
        </label>`
    )
    .join("");
  const handoffMemoLines = report.handoffMemo.bodyLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const handoffMemoLinks = report.handoffMemo.proofLinks.map((link) => `<a href="${escapeHtml(linkedHref(link.href, links.appUrl))}">${escapeHtml(link.label)}</a>`).join("");
  const launchPacketItems = report.launchPacket.items
    .map(
      (item) => `
        <article class="launch-packet-item ${tone(item.status)}">
          <span>${escapeHtml(item.priority)}</span>
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <p>${escapeHtml(item.command)}</p>
            <small>Proof to attach: ${escapeHtml(item.proofToAttach)}</small>
            <small>Done signal: ${escapeHtml(item.doneSignal)}</small>
          </div>
          <a href="${escapeHtml(linkedHref(item.href, links.appUrl))}">Open</a>
        </article>`
    )
    .join("");
  const repairTickets = report.repairTickets
    .map(
      (ticket) => `
        <article class="repair-ticket ${tone(ticket.status)}">
          <div class="repair-ticket-head">
            <span>${escapeHtml(`${ticket.priority} / ${ticket.status}`)}</span>
            <strong>${escapeHtml(ticket.title)}</strong>
            <p>${escapeHtml(ticket.command)}</p>
          </div>
          <div class="repair-ticket-proof">
            <span>Evidence contract</span>
            <small>Owner: ${escapeHtml(ticket.owner)}</small>
            <small>Proof to attach: ${escapeHtml(ticket.proofToAttach)}</small>
            <small>Receipt guard: ${escapeHtml(ticket.receiptGuard)}</small>
          </div>
          <ol>
            ${ticket.acceptanceCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("")}
          </ol>
          <div class="repair-ticket-actions">
            <a href="${escapeHtml(linkedHref(ticket.recheck.href, links.appUrl))}">${escapeHtml(ticket.recheck.label)}</a>
            <a href="${escapeHtml(ticket.href)}" download="${escapeHtml(`${ticket.id}.md`)}">Download ticket</a>
          </div>
        </article>`
    )
    .join("");
  const repairRunbookSteps = report.repairRunbook.steps
    .map(
      (step) => `
        <li class="${tone(step.status)}">
          <span>${escapeHtml(String(step.sequence).padStart(2, "0"))}</span>
          <div>
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.command)}</p>
            <small>${escapeHtml(`Proof slot: ${step.proofSlot}`)}</small>
            <small>${escapeHtml(`Acceptance: ${step.acceptanceSignal}`)}</small>
          </div>
          <aside>
            <b>${escapeHtml(`${step.priority} / ${step.status}`)}</b>
            <small>${escapeHtml(step.owner)}</small>
            <small>${escapeHtml(step.shareGate)}</small>
            <a href="${escapeHtml(linkedHref(step.inputHref, links.appUrl))}">${escapeHtml(step.inputLabel)}</a>
          </aside>
        </li>`
    )
    .join("");
  const repairRunbookOptions = report.repairRunbook.steps
    .map((step) => `<option value="${escapeHtml(step.id)}">${escapeHtml(`${step.sequence}. ${step.title}`)}</option>`)
    .join("");
  const repairRunbookRequirementJson = JSON.stringify(
    report.repairRunbook.steps.map((step) => ({
      id: step.id,
      title: step.title,
      proofRequirements: step.proofRequirements
    }))
  );
  const initialRepairCheckInputs = (report.repairRunbook.steps[0]?.proofRequirements ?? [])
    .map(
      (requirement) => `
              <label data-proof-requirement="${escapeHtml(requirement.id)}">
                <span>${escapeHtml(requirement.label)}</span>
                <input data-proof-id="${escapeHtml(requirement.id)}" data-proof-label="${escapeHtml(requirement.label)}" type="url" placeholder="${escapeHtml(requirement.placeholder)}" />
                <small>${escapeHtml(requirement.description)}</small>
              </label>`
    )
    .join("");
  const launchPacketAdditional = report.launchPacket.additionalItemCount
    ? `<p>${escapeHtml(`${report.launchPacket.additionalItemCount} additional launch item(s) omitted from this compact packet.`)}</p>`
    : "";
  const receiptLinks = [
    `<a href="${escapeHtml(report.receipt.href)}" download="global-publishability-receipt.md">Receipt</a>`,
    `<a href="${escapeHtml(report.receipt.payloadHref)}" download="global-publishability-payload.json">Payload</a>`,
    `<a href="${escapeHtml(report.receipt.verificationRequestHref)}" download="global-publishability-verification-request.json">Verify JSON</a>`
  ].join("");
  const repairs = report.repairLedger.length
    ? report.repairLedger
        .map(
          (repair) => `
            <li class="${escapeHtml(repair.priority)}">
              <span>${escapeHtml(repair.priority)}</span>
              <div>
                <strong>${escapeHtml(repair.label)}</strong>
                <p>${escapeHtml(repair.action)}</p>
                <small>${escapeHtml(repair.owner)}</small>
              </div>
              <a href="${escapeHtml(linkedHref(repair.href, links.appUrl))}">Open</a>
            </li>`
        )
        .join("")
    : `<li class="next"><span>pass</span><div><strong>No repair actions</strong><p>The public proof chain has no blocked publishability gate.</p><small>${escapeHtml(report.targetBuyer)}</small></div><a href="${escapeHtml(links.launchRoomUrl ?? "#")}">Open</a></li>`;
  const proofLinks = report.proofLinks
    .map((link) =>
      link.url
        ? `<a class="${tone(link.status)}" href="${escapeHtml(link.url)}"><span>${escapeHtml(link.status)}</span>${escapeHtml(link.label)}</a>`
        : `<span class="proof-missing ${tone(link.status)}"><span>${escapeHtml(link.status)}</span>${escapeHtml(link.label)}</span>`
    )
    .join("");
  const launchLinks = report.launchLinks.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(report.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #17201f; --muted: #53645f; --paper: #f5f7f1; --panel: #fffdf7; --line: #c8d7d0; --teal: #0f766e; --blue: #2457a6; --rose: #b1344f; --amber: #9a6a12; --green-bg: #edf9f3; --blue-bg: #f0f6ff; --rose-bg: #fff1f2; --amber-bg: #fff8df; --shadow: 0 18px 46px rgba(23, 32, 31, .09); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 22px; align-items: end; padding: 42px 0 18px; }
      .eyebrow, .stamp span, .metric span, .receipt-strip span, .handoff-memo span, .launch-packet span, .launch-packet-item span, .launch-command span, .repair-runbook span, .review-response-workbench span, .review-response-proof span, .gate span, .value-step span, .review-summary span, .review-check span, .decision-option span, .stop-rule span, .repair span, .proof-strip span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 950px; margin: 8px 0 10px; font-size: clamp(2.1rem, 5vw, 4.7rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 8px; }
      p, small { margin: 0; color: var(--muted); }
      nav, .proof-strip div:last-child, .launch-links, .memo-links, .receipt-links, .review-response-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      nav { margin-top: 20px; }
      nav a, .gate a, .value-step a, .review-check a, .decision-option a, .launch-packet-item a, .repair-runbook a, .repair a, .proof-strip a, .proof-missing, .launch-links a, .memo-links a, .receipt-links a, .review-response-actions a, .receipt-actions button, .primary { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); color: inherit; font: inherit; font-weight: 900; text-decoration: none; }
      .receipt-actions button { cursor: pointer; }
      .receipt-actions button:disabled { cursor: default; opacity: .76; }
      .stamp { min-height: 230px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid #17201f; border-radius: 8px; color: #fffdf7; background: #17201f; box-shadow: var(--shadow); text-align: center; }
      .stamp span, .stamp small { color: rgba(255, 253, 247, .76); }
      .stamp strong { font-size: 4.8rem; line-height: .88; }
      .stamp small { max-width: 250px; font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .gates, .value-route, .review-brief, .review-checks, .decision-options, .review-copy, .review-response-workbench, .review-response-form, .review-response-proof-grid, .handoff-memo, .launch-packet, .launch-packet-grid, .receipt-strip, .repair-tickets, .repair-ticket-grid, .repair-runbook, .repair-runbook-stats, .repair-runbook-steps { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .receipt-strip { grid-template-columns: minmax(180px, .4fr) minmax(0, .7fr) minmax(260px, .55fr); align-items: center; border: 1px solid var(--line); border-radius: 8px; background: var(--blue-bg); padding: 12px 14px; }
      .receipt-strip strong, .receipt-strip code { overflow-wrap: anywhere; }
      .receipt-strip code { display: block; margin-top: 4px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .82rem; }
      .receipt-actions { display: grid; gap: 8px; }
      .receipt-status { color: var(--muted); font-size: .82rem; font-weight: 850; overflow-wrap: anywhere; }
      .receipt-status.good { color: var(--teal); }
      .receipt-status.bad { color: var(--rose); }
      .handoff-memo { grid-template-columns: minmax(240px, .42fr) minmax(0, 1fr) minmax(240px, .44fr); align-items: stretch; border: 1px solid var(--line); border-left: 6px solid var(--blue); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); padding: 14px; }
      .handoff-memo.good { border-left-color: var(--teal); background: var(--green-bg); }
      .handoff-memo.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .handoff-memo.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .launch-packet { grid-template-columns: minmax(240px, .42fr) minmax(0, 1fr) minmax(250px, .46fr); align-items: stretch; border: 1px solid var(--line); border-left: 6px solid var(--blue); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); padding: 14px; }
      .launch-packet.good { border-left-color: var(--teal); background: var(--green-bg); }
      .launch-packet.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .launch-packet.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .launch-packet-head strong, .launch-command strong { display: block; margin-top: 6px; font-size: 1.18rem; line-height: 1.18; overflow-wrap: anywhere; }
      .launch-packet p, .launch-packet small, .launch-packet-item strong, .launch-packet-item p, .launch-packet-item small { overflow-wrap: anywhere; }
      .launch-command { display: grid; gap: 8px; align-content: start; }
      .launch-packet-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
      .launch-packet-item { display: grid; grid-template-columns: 62px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; background: #fffdf7; }
      .launch-packet-item.good { border-left-color: var(--teal); background: var(--green-bg); }
      .launch-packet-item.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .launch-packet-item.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .launch-packet-item div { min-width: 0; display: grid; gap: 5px; }
      .launch-packet-item small { display: block; font-size: .82rem; }
      .repair-tickets { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); padding: 14px; }
      .repair-ticket-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .repair-ticket { min-width: 0; display: grid; gap: 10px; align-content: start; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; background: #fffdf7; padding: 12px; }
      .repair-ticket.good { border-left-color: var(--teal); background: var(--green-bg); }
      .repair-ticket.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .repair-ticket.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .repair-ticket-head strong { display: block; margin-top: 5px; font-size: 1.08rem; line-height: 1.18; overflow-wrap: anywhere; }
      .repair-ticket p, .repair-ticket small, .repair-ticket li { overflow-wrap: anywhere; }
      .repair-ticket-proof { display: grid; gap: 5px; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.78); }
      .repair-ticket ol { display: grid; gap: 6px; margin: 0; padding-left: 18px; color: var(--muted); }
      .repair-ticket-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .repair-ticket-actions a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); color: inherit; font-weight: 900; text-decoration: none; }
      .repair-runbook { border: 1px solid var(--line); border-left: 6px solid var(--blue); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); padding: 14px; }
      .repair-runbook.good { border-left-color: var(--teal); background: var(--green-bg); }
      .repair-runbook.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .repair-runbook.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .repair-runbook-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .42fr); gap: 14px; align-items: start; }
      .repair-runbook-head strong { display: block; margin-top: 5px; font-size: 1.24rem; line-height: 1.18; overflow-wrap: anywhere; }
      .repair-runbook-head p, .repair-runbook-head small, .repair-runbook-steps p, .repair-runbook-steps small { overflow-wrap: anywhere; }
      .repair-runbook-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .repair-runbook-stats article { border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.76); padding: 10px; }
      .repair-runbook-stats strong { display: block; margin-top: 3px; font-size: 1.05rem; }
      .repair-runbook-steps { list-style: none; margin: 0; padding: 0; }
      .repair-runbook-steps li { display: grid; grid-template-columns: 52px minmax(0, 1fr) minmax(220px, .42fr); gap: 10px; align-items: start; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; background: #fffdf7; padding: 10px; }
      .repair-runbook-steps li.good { border-left-color: var(--teal); background: var(--green-bg); }
      .repair-runbook-steps li.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .repair-runbook-steps li.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .repair-runbook-steps li > span { display: inline-grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--panel); }
      .repair-runbook-steps div, .repair-runbook-steps aside { min-width: 0; display: grid; gap: 5px; }
      .repair-runbook-steps strong, .repair-runbook-steps b { line-height: 1.16; overflow-wrap: anywhere; }
      .repair-runbook-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .repair-check-workbench { display: grid; gap: 12px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.82); padding: 12px; }
      .repair-check-workbench strong { display: block; margin-top: 4px; font-size: 1.08rem; line-height: 1.18; overflow-wrap: anywhere; }
      .repair-check-form { display: grid; grid-template-columns: minmax(220px, .45fr) minmax(0, 1fr) auto; gap: 10px; align-items: end; }
      .repair-check-form label { min-width: 0; display: grid; gap: 5px; }
      .repair-check-form span { color: var(--teal); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .repair-check-form select, .repair-check-form input { width: 100%; min-height: 40px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--ink); font: inherit; padding: 8px 10px; }
      .repair-check-form select:focus, .repair-check-form input:focus { outline: 3px solid rgba(15,118,110,.2); border-color: var(--teal); }
      .repair-check-inputs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .repair-check-inputs small { color: var(--muted); font-size: .78rem; line-height: 1.35; overflow-wrap: anywhere; }
      .repair-check-form button { min-height: 40px; border: 1px solid var(--ink); border-radius: 999px; background: var(--ink); color: var(--panel); font: inherit; font-weight: 950; padding: 8px 14px; cursor: pointer; }
      .repair-check-form button:disabled { cursor: default; opacity: .72; }
      .repair-check-status { color: var(--muted); font-size: .84rem; font-weight: 850; overflow-wrap: anywhere; }
      .repair-check-status.good { color: var(--teal); }
      .repair-check-status.watch { color: var(--amber); }
      .repair-check-status.bad { color: var(--rose); }
      .repair-check-result { display: none; gap: 8px; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; background: var(--blue-bg); padding: 10px; }
      .repair-check-result.is-visible { display: grid; }
      .repair-check-result.good { border-left-color: var(--teal); background: var(--green-bg); }
      .repair-check-result.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .repair-check-result.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .repair-check-result strong, .repair-check-result p, .repair-check-result small { overflow-wrap: anywhere; }
      .repair-check-result-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .repair-check-result a { width: max-content; }
      .review-response-workbench { grid-template-columns: minmax(250px, .38fr) minmax(0, 1fr); align-items: start; border: 1px solid var(--line); border-left: 6px solid var(--blue); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); padding: 14px; }
      .review-response-workbench.good { border-left-color: var(--teal); background: var(--green-bg); }
      .review-response-workbench.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .review-response-workbench.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .review-response-workbench strong { display: block; margin-top: 5px; font-size: 1.22rem; line-height: 1.18; overflow-wrap: anywhere; }
      .review-response-workbench p, .review-response-workbench small { overflow-wrap: anywhere; }
      .review-response-form { grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; }
      .review-response-form label, .review-response-form fieldset { min-width: 0; display: grid; gap: 5px; margin: 0; }
      .review-response-form fieldset { grid-column: 1 / -1; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.76); padding: 10px; }
      .review-response-form legend { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .review-response-form input, .review-response-form select, .review-response-form textarea { width: 100%; min-height: 40px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--ink); font: inherit; padding: 8px 10px; }
      .review-response-form textarea { min-height: 88px; resize: vertical; }
      .review-response-form input:focus, .review-response-form select:focus, .review-response-form textarea:focus { outline: 3px solid rgba(15,118,110,.2); border-color: var(--teal); }
      .review-response-note { grid-column: 1 / -1; }
      .review-response-proof-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .review-response-proof { border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; background: #fffdf7; padding: 10px; }
      .review-response-proof.good { border-left-color: var(--teal); background: var(--green-bg); }
      .review-response-proof.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .review-response-proof.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .review-response-proof input { width: auto; min-height: auto; justify-self: start; }
      .review-response-form button { justify-self: start; min-height: 40px; border: 1px solid var(--ink); border-radius: 999px; background: var(--ink); color: var(--panel); font: inherit; font-weight: 950; padding: 8px 14px; cursor: pointer; }
      .review-response-form button:disabled { cursor: default; opacity: .72; }
      .review-response-status { color: var(--muted); font-size: .84rem; font-weight: 850; overflow-wrap: anywhere; }
      .review-response-status.good { color: var(--teal); }
      .review-response-status.watch { color: var(--amber); }
      .review-response-status.bad { color: var(--rose); }
      .review-response-result { display: none; gap: 8px; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; background: var(--blue-bg); padding: 10px; }
      .review-response-result.is-visible { display: grid; }
      .review-response-result.good { border-left-color: var(--teal); background: var(--green-bg); }
      .review-response-result.watch { border-left-color: var(--amber); background: var(--amber-bg); }
      .review-response-result.bad { border-left-color: var(--rose); background: var(--rose-bg); }
      .review-response-result strong, .review-response-result p, .review-response-result small { overflow-wrap: anywhere; }
      .review-brief { grid-template-columns: minmax(0, .82fr) minmax(0, 1.05fr) minmax(280px, .72fr); align-items: start; }
      .value-route { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .gates { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .metric, .gate, .value-step, .review-summary, .review-check, .decision-option, .stop-rule, .repair, .pitch, .proof-strip { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 10px 26px rgba(23, 32, 31, .05); }
      .metric, .gate, .value-step, .review-summary, .review-check, .decision-option, .stop-rule, .repair, .pitch, .proof-strip { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.08rem; line-height: 1.14; overflow-wrap: anywhere; }
      .handoff-memo strong { display: block; margin-top: 6px; font-size: 1.18rem; line-height: 1.18; overflow-wrap: anywhere; }
      .handoff-memo p, .handoff-memo li, .handoff-memo small { overflow-wrap: anywhere; }
      .handoff-memo ul { display: grid; gap: 6px; margin: 0; padding-left: 18px; color: var(--muted); }
      .memo-warning { color: var(--rose); font-weight: 950; }
      .review-summary { border-top: 5px solid var(--blue); }
      .review-summary strong { display: block; margin: 6px 0 8px; font-size: 1.32rem; line-height: 1.16; overflow-wrap: anywhere; }
      .review-summary small, .stop-rule small { display: block; margin-top: 8px; overflow-wrap: anywhere; }
      .stop-rule { border-left: 5px solid var(--rose); background: var(--rose-bg); }
      .review-check, .decision-option { display: grid; grid-template-rows: auto auto 1fr auto auto; gap: 8px; border-left: 5px solid var(--blue); }
      .pitch { display: grid; grid-template-columns: minmax(0, .86fr) minmax(300px, .46fr); gap: 14px; align-items: start; }
      .pitch strong { display: block; margin-top: 6px; font-size: 1.2rem; line-height: 1.28; overflow-wrap: anywhere; }
      .repair ol { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
      .repair li { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px; border: 1px solid var(--line); border-left: 5px solid var(--amber); border-radius: 8px; background: #fffdf7; }
      .repair li.now { border-left-color: var(--rose); background: var(--rose-bg); }
      .repair p, .repair small { overflow-wrap: anywhere; }
      .gate { display: grid; grid-template-rows: auto auto auto 1fr auto; gap: 8px; border-top: 5px solid var(--blue); }
      .value-step { display: grid; grid-template-rows: auto auto 1fr auto auto; gap: 8px; border-left: 5px solid var(--blue); }
      .gate.good, .value-step.good, .review-check.good, .decision-option.good, .metric.good { border-color: #add6bd; border-top-color: var(--teal); border-left-color: var(--teal); background: var(--green-bg); }
      .gate.watch, .value-step.watch, .review-check.watch, .decision-option.watch, .metric.watch { border-color: #e2ca86; border-top-color: var(--amber); border-left-color: var(--amber); background: var(--amber-bg); }
      .gate.bad, .value-step.bad, .review-check.bad, .decision-option.bad, .metric.bad { border-color: #e6a9b5; border-top-color: var(--rose); border-left-color: var(--rose); background: var(--rose-bg); }
      .gate div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .gate b { font-size: 1.55rem; line-height: 1; }
      .gate strong, .gate p, .gate small, .value-step strong, .value-step p, .value-step small, .review-check strong, .review-check p, .review-check small, .decision-option strong, .decision-option p, .decision-option small { overflow-wrap: anywhere; }
      .gate p, .gate small, .value-step p, .value-step small, .review-check p, .review-check small, .decision-option p, .decision-option small { font-size: .88rem; }
      .proof-strip { display: grid; grid-template-columns: minmax(180px, .25fr) minmax(0, 1fr); gap: 12px; align-items: center; }
      .proof-strip strong { display: block; margin-top: 4px; }
      .proof-strip a.good, .proof-missing.good { color: var(--teal); background: var(--green-bg); }
      .proof-strip a.watch, .proof-missing.watch { color: var(--amber); background: var(--amber-bg); }
      .proof-strip a.bad, .proof-missing.bad { color: var(--rose); background: var(--rose-bg); }
      .launch-links { margin-top: 10px; }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 1040px) { .gates, .value-route, .review-brief, .handoff-memo, .launch-packet { grid-template-columns: repeat(2, minmax(0, 1fr)); } .decision-options, .memo-body, .launch-packet-grid { grid-column: 1 / -1; } .decision-options { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (max-width: 820px) { header, .pitch, .proof-strip, .metrics, .gates, .value-route, .review-brief, .decision-options, .review-response-workbench, .review-response-form, .review-response-proof-grid, .handoff-memo, .launch-packet, .receipt-strip, .repair-ticket-grid, .repair-runbook-head, .repair-runbook-stats, .repair-check-form, .repair-check-inputs { grid-template-columns: 1fr; } .decision-options, .review-response-note, .review-response-form fieldset, .memo-body, .launch-packet-grid { grid-column: auto; } .stamp { min-height: 150px; } .repair li, .launch-packet-item, .repair-runbook-steps li { grid-template-columns: 1fr; align-items: start; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Global Publishability Report</span>
        <h1>${escapeHtml(report.headline)}</h1>
        <p>${escapeHtml(report.hardTruth)}</p>
        <nav>${nav}</nav>
      </div>
      <div class="stamp">
        <span>${escapeHtml(report.decision)}</span>
        <strong>${escapeHtml(report.publishabilityScore)}</strong>
        <small>${escapeHtml(report.targetBuyer)}</small>
      </div>
    </header>
    <main>
      <section class="metrics" aria-label="Publishability metrics">
        <article class="metric ${tone(report.status)}"><span>Decision</span><strong>${escapeHtml(report.decision)}</strong></article>
        <article class="metric ${tone(report.status)}"><span>Score</span><strong>${escapeHtml(`${report.publishabilityScore}/100`)}</strong></article>
        <article class="metric ${report.repairLedger.some((repair) => repair.priority === "now") ? "bad" : report.repairLedger.length ? "watch" : "good"}"><span>Repairs</span><strong>${escapeHtml(`${report.repairLedger.length} open`)}</strong></article>
        <article class="metric ${tone(report.status)}"><span>Verified proof</span><strong>${escapeHtml(report.verifiedSummary)}</strong></article>
      </section>
      <section class="receipt-strip" aria-label="Publishability receipt">
        <div>
          <span>Publishability receipt</span>
          <strong>${escapeHtml(report.receipt.verification.status)}</strong>
        </div>
        <div>
          <strong>${escapeHtml(report.receipt.receiptId)}</strong>
          <code>${escapeHtml(`${report.receipt.checksumAlgorithm}:${report.receipt.checksum}`)}</code>
        </div>
        <div>
          <span>Replay API</span>
          <code>POST ${escapeHtml(report.receipt.verificationApiPath)}</code>
          <div class="receipt-actions">
            <button type="button" data-verify-receipt data-verify-api="${escapeHtml(report.receipt.verificationApiPath)}">Verify receipt</button>
            <small class="receipt-status" data-receipt-status>Receipt not checked in this browser yet.</small>
          </div>
          <div class="receipt-links">${receiptLinks}</div>
        </div>
      </section>
      <section class="handoff-memo ${tone(report.status)}" aria-label="Buyer handoff memo">
        <div>
          <span>${escapeHtml(report.handoffMemo.audience)}</span>
          <strong>${escapeHtml(report.handoffMemo.subject)}</strong>
          <p>${escapeHtml(report.handoffMemo.statusLine)}</p>
        </div>
        <div class="memo-body">
          <span>Memo body</span>
          <ul>${handoffMemoLines}</ul>
        </div>
        <aside>
          <span>Requested decision</span>
          <strong>${escapeHtml(report.handoffMemo.requestedDecision)}</strong>
          ${report.handoffMemo.noSendWarning ? `<p class="memo-warning">${escapeHtml(report.handoffMemo.noSendWarning)}</p>` : ""}
          <div class="memo-links">${handoffMemoLinks}</div>
        </aside>
      </section>
      <section class="launch-packet ${tone(report.launchPacket.status)}" aria-label="Global launch packet">
        <div class="launch-packet-head">
          <span>${escapeHtml(report.launchPacket.status)}</span>
          <strong>${escapeHtml(report.launchPacket.headline)}</strong>
          <p>${escapeHtml(report.launchPacket.publishRule)}</p>
          <small>${escapeHtml(`${report.launchPacket.blockedCount} blocker(s), ${report.launchPacket.watchCount} review item(s)`)}</small>
        </div>
        <div class="launch-packet-grid">
          <span>Launch items</span>
          ${launchPacketItems}
          ${launchPacketAdditional}
        </div>
        <aside class="launch-command">
          <span>Current command</span>
          <strong>${escapeHtml(report.launchPacket.currentOwner)}</strong>
          <p>${escapeHtml(report.launchPacket.currentCommand)}</p>
          <small>${escapeHtml(report.launchPacket.escalationRule)}</small>
          <div class="launch-packet-actions">
            <a class="primary" href="${escapeHtml(linkedHref(report.launchPacket.items[0]?.href ?? report.primaryAction.href, links.appUrl))}">Open launch action</a>
            <a class="primary" href="${escapeHtml(report.launchPacket.href)}" download="global-publishability-launch-packet.md">Download launch packet</a>
          </div>
        </aside>
      </section>
      <section class="repair-tickets" aria-label="Owner repair tickets">
        <div>
          <h2>Owner repair tickets</h2>
          <p>Each ticket names the owner, proof contract, acceptance criteria, and recheck signal needed before this can become a public buyer handoff.</p>
        </div>
        <div class="repair-ticket-grid">${repairTickets}</div>
      </section>
      <section class="repair-runbook ${tone(report.repairRunbook.status)}" aria-label="Owner repair runbook">
        <div class="repair-runbook-head">
          <div>
            <span>${escapeHtml(report.repairRunbook.mode)}</span>
            <strong>${escapeHtml(report.repairRunbook.headline)}</strong>
            <p>${escapeHtml(report.repairRunbook.summary)}</p>
            <small>${escapeHtml(report.repairRunbook.shareRule)}</small>
          </div>
          <aside>
            <span>Current owner</span>
            <strong>${escapeHtml(report.repairRunbook.currentOwner)}</strong>
            <p>${escapeHtml(report.repairRunbook.currentCommand)}</p>
            <small>${escapeHtml(report.repairRunbook.verificationCommand)}</small>
            <div class="repair-runbook-actions">
              <a class="primary" href="${escapeHtml(report.repairRunbook.href)}" download="global-publishability-owner-runbook.md">Download runbook</a>
              <a class="primary" href="${escapeHtml(report.repairRunbook.csvHref)}" download="global-publishability-owner-runbook.csv">Download CSV</a>
            </div>
          </aside>
        </div>
        <div class="repair-runbook-stats" aria-label="Repair runbook counters">
          <article><span>Steps</span><strong>${escapeHtml(String(report.repairRunbook.stepCount))}</strong></article>
          <article><span>Now</span><strong>${escapeHtml(String(report.repairRunbook.nowCount))}</strong></article>
          <article><span>Next</span><strong>${escapeHtml(String(report.repairRunbook.nextCount))}</strong></article>
          <article><span>Verify</span><strong>${escapeHtml(String(report.repairRunbook.verifyCount))}</strong></article>
        </div>
        <ol class="repair-runbook-steps">${repairRunbookSteps}</ol>
        <div class="repair-check-workbench" aria-label="Repair proof check workbench">
          <div>
            <span>Repair proof check</span>
            <strong>Check the evidence before rerunning the report</strong>
            <p>Paste the public URLs that close one runbook step. The checker uses the same reachability rules as the launch evidence audit and keeps external sharing locked when proof is missing or blocked.</p>
          </div>
          <form class="repair-check-form" data-repair-check-form data-api="${escapeHtml(GLOBAL_PUBLISHABILITY_REPAIR_CHECK_PATH)}">
            <label>
              <span>Runbook step</span>
              <select data-repair-step aria-label="Runbook step">${repairRunbookOptions}</select>
              <small data-repair-requirement-summary>${escapeHtml(`${report.repairRunbook.steps[0]?.proofRequirements.filter((requirement) => requirement.required).length ?? 0} required proof URL(s)`)}</small>
            </label>
            <div class="repair-check-inputs" data-repair-check-inputs>${initialRepairCheckInputs}</div>
            <button type="submit">Check repair proof</button>
          </form>
          <small class="repair-check-status" data-repair-check-status>Repair proof has not been checked in this browser yet.</small>
          <div class="repair-check-result" data-repair-check-result aria-live="polite">
            <strong data-repair-check-title></strong>
            <p data-repair-check-summary></p>
            <small data-repair-check-next></small>
            <div class="repair-check-result-actions">
              <a data-repair-check-download href="#" download="global-publishability-repair-proof-check.md">Download proof check</a>
              <a data-repair-check-receipt-download href="#" download="global-publishability-repair-check-receipt.md">Download receipt</a>
              <a data-repair-check-verifier href="/receipt-verifier">Verify receipt</a>
            </div>
          </div>
        </div>
      </section>
      <section class="review-brief" aria-label="Reviewer decision brief">
        <div class="review-copy">
          <article class="review-summary ${tone(report.status)}">
            <span>${escapeHtml(report.reviewerBrief.recommendedDecision)}</span>
            <strong>${escapeHtml(report.reviewerBrief.title)}</strong>
            <p>${escapeHtml(report.reviewerBrief.sponsorQuestion)}</p>
            <small>${escapeHtml(report.reviewerBrief.timebox)}</small>
          </article>
          <article class="stop-rule">
            <span>Stop rule</span>
            <strong>${escapeHtml(report.reviewerBrief.stopRule)}</strong>
          </article>
        </div>
        <div class="review-checks">${reviewerProofChecks}</div>
        <div class="decision-options">${decisionOptions}</div>
      </section>
      <section class="review-response-workbench ${tone(report.status)}" aria-label="External review response">
        <div>
          <span>External review response</span>
          <strong>Record the reviewer decision against this receipt</strong>
          <p>Capture approve, sponsor review, or hold from the public report. The response is accepted only when the source receipt verifies and the required value-route proof items were checked.</p>
          <small>Source receipt: ${escapeHtml(report.receipt.checksumAlgorithm)}:${escapeHtml(report.receipt.checksum)}</small>
        </div>
        <div>
          <form class="review-response-form" data-review-response-form data-api="${escapeHtml(GLOBAL_PUBLISHABILITY_REVIEW_RESPONSE_PATH)}">
            <label>
              <span>Reviewer</span>
              <input data-reviewer-name type="text" value="External reviewer" maxlength="180" />
            </label>
            <label>
              <span>Role</span>
              <input data-reviewer-role type="text" placeholder="Sponsor / buyer / evaluator" maxlength="180" />
            </label>
            <label>
              <span>Decision</span>
              <select data-reviewer-choice>${reviewResponseDecisionOptions}</select>
            </label>
            <label class="review-response-note">
              <span>Decision note</span>
              <textarea data-reviewer-note maxlength="1600" placeholder="Name the approval reason, sponsor concern, or stop condition."></textarea>
            </label>
            <fieldset>
              <legend>Proof checked</legend>
              <div class="review-response-proof-grid">${reviewResponseProofInputs}</div>
            </fieldset>
            <button type="submit">Record review response</button>
          </form>
          <small class="review-response-status" data-review-response-status>Reviewer response has not been recorded in this browser yet.</small>
          <div class="review-response-result" data-review-response-result aria-live="polite">
            <strong data-review-response-title></strong>
            <p data-review-response-summary></p>
            <small data-review-response-next></small>
            <div class="review-response-actions">
              <a data-review-response-download href="#" download="global-publishability-review-response.md">Download response</a>
              <a data-review-response-receipt href="#" download="global-publishability-review-response-receipt.md">Download receipt</a>
              <a data-review-response-verifier href="/receipt-verifier">Verify receipt</a>
            </div>
          </div>
        </div>
      </section>
      <section aria-label="Buyer value route">
        <h2>Buyer value route</h2>
        <div class="value-route">${valueRoute}</div>
      </section>
      <section class="pitch" aria-label="Public pitch and repairs">
        <div>
          <h2>Public reviewer route</h2>
          <strong>${escapeHtml(report.decisionAsk)}</strong>
          <p>${escapeHtml(report.publicPitch)}</p>
          <div class="launch-links">${launchLinks}</div>
          <a class="primary" href="${escapeHtml(linkedHref(report.primaryAction.href, links.appUrl))}">${escapeHtml(report.primaryAction.label)}</a>
        </div>
        <aside class="repair">
          <h2>Repair ledger</h2>
          <ol>${repairs}</ol>
        </aside>
      </section>
      <section class="gates" aria-label="Publishability gates">${gates}</section>
      <section class="proof-strip" aria-label="Public proof links">
        <div>
          <span>Proof links</span>
          <strong>${escapeHtml(`${report.proofLinks.filter((link) => link.status === "pass").length}/${report.proofLinks.length} pass`)}</strong>
        </div>
        <div>${proofLinks}</div>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace. Use this report as a public-readiness gate; verify legal, security, and procurement obligations separately.</footer>
    <script type="application/json" id="global-publishability-receipt-verify-request">${escapeScriptJson(report.receipt.verificationRequestJson)}</script>
    <script type="application/json" id="global-publishability-repair-requirements">${escapeScriptJson(repairRunbookRequirementJson)}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-verify-receipt]");
        const status = document.querySelector("[data-receipt-status]");
        const requestNode = document.getElementById("global-publishability-receipt-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Checking receipt";
          status.className = "receipt-status";
          status.textContent = "Checking publishability checksum...";
          try {
            const response = await fetch(button.getAttribute("data-verify-api") || "/api/global-publishability/receipt/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json();
            if (response.ok && result && result.verification && result.verification.status === "verified") {
              button.textContent = "Receipt verified";
              status.className = "receipt-status good";
              status.textContent = "Checksum " + result.verification.actualChecksum + " matches this report.";
              return;
            }
            button.disabled = false;
            button.textContent = "Verify receipt";
            status.className = "receipt-status bad";
            status.textContent = (result && result.verification && result.verification.instruction) || result.error || "Receipt verification failed.";
          } catch {
            button.disabled = false;
            button.textContent = "Verify receipt";
            status.className = "receipt-status bad";
            status.textContent = "Receipt verification could not reach the verification API.";
          }
        });
      })();
      (() => {
        const form = document.querySelector("[data-repair-check-form]");
        const requestNode = document.getElementById("global-publishability-receipt-verify-request");
        const requirementsNode = document.getElementById("global-publishability-repair-requirements");
        const status = document.querySelector("[data-repair-check-status]");
        const inputContainer = document.querySelector("[data-repair-check-inputs]");
        const requirementSummary = document.querySelector("[data-repair-requirement-summary]");
        const resultBox = document.querySelector("[data-repair-check-result]");
        const resultTitle = document.querySelector("[data-repair-check-title]");
        const resultSummary = document.querySelector("[data-repair-check-summary]");
        const resultNext = document.querySelector("[data-repair-check-next]");
        const resultDownload = document.querySelector("[data-repair-check-download]");
        const resultReceiptDownload = document.querySelector("[data-repair-check-receipt-download]");
        const resultVerifier = document.querySelector("[data-repair-check-verifier]");
        if (!form || !requestNode || !requirementsNode || !status || !inputContainer || !resultBox || !resultTitle || !resultSummary || !resultNext || !resultDownload || !resultReceiptDownload || !resultVerifier) return;
        let stepRequirements = [];
        try {
          stepRequirements = JSON.parse(requirementsNode.textContent || "[]");
        } catch {
          stepRequirements = [];
        }
        const toneFor = (state) => state === "ready-to-rerun" ? "good" : state === "needs-review" ? "watch" : "bad";
        const selectedStep = () => {
          const step = form.querySelector("[data-repair-step]");
          return stepRequirements.find((item) => item && item.id === step?.value) || stepRequirements[0] || null;
        };
        const renderRequirementInputs = () => {
          const selected = selectedStep();
          const requirements = selected && Array.isArray(selected.proofRequirements) ? selected.proofRequirements : [];
          inputContainer.textContent = "";
          for (const requirement of requirements) {
            const label = document.createElement("label");
            label.setAttribute("data-proof-requirement", requirement.id || "proofUrl");
            const span = document.createElement("span");
            span.textContent = requirement.label || "Proof URL";
            const input = document.createElement("input");
            input.setAttribute("data-proof-id", requirement.id || "proofUrl");
            input.setAttribute("data-proof-label", requirement.label || "Proof URL");
            input.type = "url";
            input.placeholder = requirement.placeholder || "<public proof URL reviewers can open>";
            const small = document.createElement("small");
            small.textContent = requirement.description || "Public URL required for this runbook step.";
            label.append(span, input, small);
            inputContainer.append(label);
          }
          if (requirementSummary) {
            const requiredCount = requirements.filter((requirement) => requirement.required !== false).length;
            requirementSummary.textContent = requiredCount + " required proof URL" + (requiredCount === 1 ? "" : "s");
          }
        };
        const stepSelect = form.querySelector("[data-repair-step]");
        if (stepSelect) stepSelect.addEventListener("change", renderRequirementInputs);
        renderRequirementInputs();
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submitButton = form.querySelector("button[type='submit']");
          const step = form.querySelector("[data-repair-step]");
          const proofUrls = Array.from(form.querySelectorAll("[data-proof-id]"))
            .map((input) => ({
              id: input.getAttribute("data-proof-id") || "proofUrl",
              label: input.getAttribute("data-proof-label") || "Proof URL",
              value: input.value || ""
            }))
            .filter((item) => item.value.trim());
          if (!step || proofUrls.length === 0) {
            status.className = "repair-check-status bad";
            status.textContent = "Paste at least one public proof URL before checking this repair.";
            return;
          }
          if (submitButton) submitButton.disabled = true;
          status.className = "repair-check-status";
          status.textContent = "Checking public proof URLs...";
          resultBox.className = "repair-check-result";
          try {
            const response = await fetch(form.getAttribute("data-api") || "/api/global-publishability/repair-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                verificationRequest: JSON.parse(requestNode.textContent || "{}"),
                stepId: step.value,
                proofUrls
              })
            });
            const body = await response.json();
            if (!response.ok || !body || !body.status) {
              throw new Error(body && body.error ? body.error : "Repair proof check failed.");
            }
            const resultTone = toneFor(body.status);
            status.className = "repair-check-status " + resultTone;
            status.textContent = body.status + ": " + body.summary;
            resultBox.className = "repair-check-result is-visible " + resultTone;
            resultTitle.textContent = body.decision + " / " + body.step.title;
            resultSummary.textContent = body.summary;
            resultNext.textContent = body.nextAction;
            resultDownload.setAttribute("href", body.href || "#");
            resultReceiptDownload.setAttribute("href", body.receipt?.href || "#");
            resultReceiptDownload.setAttribute("download", (body.receipt?.receiptId || "global-publishability-repair-check") + ".md");
            if (body.receipt?.verificationRequestJson) {
              resultVerifier.setAttribute("href", "/receipt-verifier?request=" + encodeURIComponent(body.receipt.verificationRequestJson) + "&verify=1");
            } else {
              resultVerifier.setAttribute("href", "/receipt-verifier");
            }
          } catch (error) {
            status.className = "repair-check-status bad";
            status.textContent = error instanceof Error ? error.message : "Repair proof check failed.";
          } finally {
            if (submitButton) submitButton.disabled = false;
          }
        });
      })();
      (() => {
        const form = document.querySelector("[data-review-response-form]");
        const requestNode = document.getElementById("global-publishability-receipt-verify-request");
        const status = document.querySelector("[data-review-response-status]");
        const resultBox = document.querySelector("[data-review-response-result]");
        const resultTitle = document.querySelector("[data-review-response-title]");
        const resultSummary = document.querySelector("[data-review-response-summary]");
        const resultNext = document.querySelector("[data-review-response-next]");
        const resultDownload = document.querySelector("[data-review-response-download]");
        const resultReceipt = document.querySelector("[data-review-response-receipt]");
        const resultVerifier = document.querySelector("[data-review-response-verifier]");
        if (!form || !requestNode || !status || !resultBox || !resultTitle || !resultSummary || !resultNext || !resultDownload || !resultReceipt || !resultVerifier) return;
        const toneFor = (state) => state === "accepted" ? "good" : state === "review" ? "watch" : "bad";
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submitButton = form.querySelector("button[type='submit']");
          const reviewerName = form.querySelector("[data-reviewer-name]");
          const reviewerRole = form.querySelector("[data-reviewer-role]");
          const reviewerChoice = form.querySelector("[data-reviewer-choice]");
          const reviewerNote = form.querySelector("[data-reviewer-note]");
          const checkedProofIds = Array.from(form.querySelectorAll("[data-review-proof-id]:checked"))
            .map((input) => input.getAttribute("data-review-proof-id") || "")
            .filter(Boolean);
          if (!reviewerName || !reviewerChoice || !String(reviewerName.value || "").trim()) {
            status.className = "review-response-status bad";
            status.textContent = "Enter the reviewer name before recording this response.";
            return;
          }
          if (submitButton) submitButton.disabled = true;
          status.className = "review-response-status";
          status.textContent = "Recording reviewer response against the verified receipt...";
          resultBox.className = "review-response-result";
          try {
            const response = await fetch(form.getAttribute("data-api") || "/api/global-publishability/review-response", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                verificationRequest: JSON.parse(requestNode.textContent || "{}"),
                reviewerName: reviewerName.value || "",
                reviewerRole: reviewerRole && reviewerRole.value ? reviewerRole.value : "External reviewer",
                reviewerChoice: reviewerChoice.value,
                reviewerNote: reviewerNote && reviewerNote.value ? reviewerNote.value : "",
                checkedProofIds
              })
            });
            const body = await response.json();
            if (!response.ok || !body || !body.status) {
              throw new Error(body && body.error ? body.error : "Review response could not be recorded.");
            }
            const resultTone = toneFor(body.status);
            status.className = "review-response-status " + resultTone;
            status.textContent = body.outcome + ": " + body.responseSummary;
            resultBox.className = "review-response-result is-visible " + resultTone;
            resultTitle.textContent = body.status + " / " + body.reviewerChoice;
            resultSummary.textContent = body.responseSummary;
            resultNext.textContent = body.nextAction;
            resultDownload.setAttribute("href", body.href || "#");
            resultReceipt.setAttribute("href", body.receipt && body.receipt.href ? body.receipt.href : "#");
            resultReceipt.setAttribute("download", (body.receipt && body.receipt.receiptId ? body.receipt.receiptId : "global-publishability-review-response") + ".md");
            if (body.receipt && body.receipt.verificationRequestJson) {
              resultVerifier.setAttribute("href", "/receipt-verifier?request=" + encodeURIComponent(body.receipt.verificationRequestJson) + "&verify=1");
            } else {
              resultVerifier.setAttribute("href", "/receipt-verifier");
            }
          } catch (error) {
            status.className = "review-response-status bad";
            status.textContent = error instanceof Error ? error.message : "Review response could not be recorded.";
          } finally {
            if (submitButton) submitButton.disabled = false;
          }
        });
      })();
    </script>
  </body>
</html>`;
}
