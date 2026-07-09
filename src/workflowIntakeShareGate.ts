import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import { buildWorkflowIntakeReadiness, type WorkflowIntakeBriefInput, type WorkflowIntakeStatus } from "./workflowIntake.js";

export type WorkflowIntakeProofSlot = {
  id: string;
  label: string;
  value: string;
  href: string;
};

export type WorkflowIntakeShareGateDecision = "share-ready" | "internal-review" | "blocked";

export type WorkflowIntakeShareGateCheck = {
  id: "buyer-packet" | "live-proof" | "submission-assets" | "review-room";
  label: string;
  status: WorkflowIntakeStatus;
  evidence: string;
  fix: string;
  href: string;
};

export type WorkflowIntakeShareGate = {
  decision: WorkflowIntakeShareGateDecision;
  score: number;
  headline: string;
  nextAction: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  primaryActionExternal: boolean;
  sealedProofCount: number;
  proofSlotCount: number;
  liveVerifiedCount: number;
  liveProofCount: number;
  checks: WorkflowIntakeShareGateCheck[];
};

function statusScore(status: WorkflowIntakeStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 65;
  return 20;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nonEmptyHref(value: string) {
  const trimmed = value.trim();
  return trimmed && trimmed !== "#";
}

function isExternalHref(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function shareHeadlineFor(decision: WorkflowIntakeShareGateDecision) {
  if (decision === "share-ready") return "External buyer packet is ready to send";
  if (decision === "internal-review") return "Internal review only until proof links close";
  return "Hold the packet inside the workspace";
}

function shareDecisionFromChecks(checks: WorkflowIntakeShareGateCheck[]): WorkflowIntakeShareGateDecision {
  if (checks.some((check) => check.status === "blocked")) return "blocked";
  if (checks.some((check) => check.status === "watch")) return "internal-review";
  return "share-ready";
}

function shareNextActionFor(decision: WorkflowIntakeShareGateDecision, checks: WorkflowIntakeShareGateCheck[]) {
  const firstBlocked = checks.find((check) => check.status === "blocked");
  const firstOpen = firstBlocked ?? checks.find((check) => check.status === "watch");
  if (decision === "share-ready") return "Open the launch room and send the current public packet to the buyer or sponsor.";
  if (decision === "internal-review") return firstOpen?.fix ?? "Close the remaining warning before buyer delivery.";
  return firstBlocked?.fix ?? "Fix the first blocked buyer-readiness item before this leaves the workspace.";
}

export function buildWorkflowIntakeShareGate(input: WorkflowIntakeBriefInput & {
  proofLinks: WorkflowIntakeProofSlot[];
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  launchRoomHref: string;
  proofAuditHref: string;
  trustManifestHref: string;
}): WorkflowIntakeShareGate {
  const readiness = buildWorkflowIntakeReadiness(input);
  const proofLinks = input.proofLinks;
  const sealedProofLinks = proofLinks.filter((link) => isBuyerFacingProofUrl(link.value));
  const firstMissingProof = proofLinks.find((link) => !isBuyerFacingProofUrl(link.value));
  const targetUrl = proofLinks.find((link) => link.id === "targetUrl");
  const protopediaUrl = proofLinks.find((link) => link.id === "protopediaUrl");
  const videoUrl = proofLinks.find((link) => link.id === "videoUrl");
  const submissionAssets = [targetUrl, protopediaUrl, videoUrl].filter(Boolean) as WorkflowIntakeProofSlot[];
  const sealedSubmissionAssets = submissionAssets.filter((link) => isBuyerFacingProofUrl(link.value));
  const firstMissingSubmissionAsset = submissionAssets.find((link) => !isBuyerFacingProofUrl(link.value));
  const hasReviewRoom = nonEmptyHref(input.launchRoomHref) && nonEmptyHref(input.proofAuditHref) && nonEmptyHref(input.trustManifestHref);
  const proofSlotCount = Math.max(1, proofLinks.length);
  const sealedProofCount = sealedProofLinks.length;
  const allProofSlotsSealed = proofLinks.length > 0 && sealedProofCount === proofLinks.length;
  const allSubmissionAssetsSealed = submissionAssets.length > 0 && sealedSubmissionAssets.length === submissionAssets.length;
  const proofVerification = input.proofVerification ?? undefined;
  const blockedLiveProof = proofVerification?.results.find((result) => result.status === "block");
  const watchedLiveProof = proofVerification?.results.find((result) => result.status === "watch");
  const firstOpenLiveProof = blockedLiveProof ?? watchedLiveProof;
  const matchingLiveProofLink = firstOpenLiveProof ? proofLinks.find((link) => link.id === firstOpenLiveProof.id) : undefined;
  const liveProofCount = proofVerification?.totalCount ?? proofLinks.length;
  const liveVerifiedCount = proofVerification?.verifiedCount ?? 0;
  const liveProofStatus: WorkflowIntakeStatus = proofVerification
    ? blockedLiveProof
      ? "blocked"
      : watchedLiveProof || !allProofSlotsSealed || liveVerifiedCount < proofLinks.length || proofVerification.results.length < proofLinks.length
        ? "watch"
        : "clear"
    : allProofSlotsSealed || sealedProofCount >= 2
      ? "watch"
      : "blocked";
  const liveProofEvidence = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} proof links verified live${firstOpenLiveProof ? `; ${firstOpenLiveProof.label}: ${firstOpenLiveProof.evidence}` : "."}`
    : `${sealedProofCount}/${proofLinks.length} proof slots have public HTTPS URLs; live verification has not run.`;
  const liveProofFix = proofVerification
    ? firstOpenLiveProof
      ? firstOpenLiveProof.action
      : liveProofStatus === "clear"
        ? "Keep verified proof URLs attached to the workspace."
        : "Run live verification again after every proof slot is sealed."
    : firstMissingProof
      ? `Attach ${firstMissingProof.label} and then run live verification.`
      : "Run live verification before buyer delivery.";

  const checks: WorkflowIntakeShareGateCheck[] = [
    {
      id: "buyer-packet",
      label: "Buyer packet",
      status: readiness.decision === "pilot-ready" ? "clear" : readiness.decision === "needs-proof" ? "watch" : "blocked",
      evidence: `${readiness.score}/100 intake score; ${readiness.headline}.`,
      fix: readiness.nextAction,
      href: "#marketplace-workbench"
    },
    {
      id: "live-proof",
      label: proofVerification ? "Live proof reachability" : "Live proof verification",
      status: liveProofStatus,
      evidence: liveProofEvidence,
      fix: liveProofFix,
      href: matchingLiveProofLink?.href ?? firstMissingProof?.href ?? input.proofAuditHref
    },
    {
      id: "submission-assets",
      label: "Submission assets",
      status: allSubmissionAssetsSealed ? "clear" : "watch",
      evidence: `${sealedSubmissionAssets.length}/${submissionAssets.length} launch URL, ProtoPedia, and walkthrough video slots are public.`,
      fix: allSubmissionAssetsSealed ? "Use these assets for global publication." : "Paste the deployed URL, ProtoPedia URL, and walkthrough video before global publication.",
      href: firstMissingSubmissionAsset?.href ?? firstMissingProof?.href ?? "#launch-evidence-console"
    },
    {
      id: "review-room",
      label: "Review room",
      status: hasReviewRoom ? "clear" : "watch",
      evidence: hasReviewRoom ? "Launch room, proof audit, and trust manifest are generated from the current workspace." : "Current workspace review artifacts are not all generated yet.",
      fix: hasReviewRoom ? "Open the launch room, proof audit, or trust manifest for current-workspace review." : "Regenerate the current workspace share artifacts before review.",
      href: input.launchRoomHref || "#marketplace-workbench"
    }
  ];
  const decision = shareDecisionFromChecks(checks);
  const rawScore = Math.round(average(checks.map((check) => statusScore(check.status))));
  const score = decision === "blocked" ? Math.min(rawScore, 68) : decision === "internal-review" ? Math.min(rawScore, 89) : rawScore;
  const firstBlocked = checks.find((check) => check.status === "blocked");
  const firstOpen = firstBlocked ?? checks.find((check) => check.status === "watch");
  const primaryActionHref = decision === "share-ready" ? input.launchRoomHref : decision === "internal-review" ? input.proofAuditHref : firstOpen?.href ?? "#marketplace-workbench";

  return {
    decision,
    score,
    headline: shareHeadlineFor(decision),
    nextAction: shareNextActionFor(decision, checks),
    primaryActionLabel: decision === "share-ready" ? "Open launch room" : decision === "internal-review" ? "Review proof audit" : "Fix blocker",
    primaryActionHref,
    primaryActionExternal: isExternalHref(primaryActionHref),
    sealedProofCount,
    proofSlotCount,
    liveVerifiedCount,
    liveProofCount,
    checks
  };
}
