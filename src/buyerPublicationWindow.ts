import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";

export type BuyerPublicationWindowStatus = "ready" | "attention" | "blocked";

export type BuyerPublicationWindowAction = {
  id: "primary";
  label: string;
  href: string;
  external: boolean;
};

export type BuyerPublicationWindowTaskId = "live-proof-recheck" | "manifest-regeneration" | "buyer-review-checkpoint";

export type BuyerPublicationWindowTask = {
  id: BuyerPublicationWindowTaskId;
  label: string;
  status: BuyerPublicationWindowStatus;
  owner: string;
  dueAt: string;
  action: string;
  href: string;
};

export type BuyerPublicationWindowHandoffMode = "send" | "review" | "hold";

export type BuyerPublicationWindowStopRuleId =
  | "live-proof-current"
  | "proof-links-open"
  | "proof-chain-sealed"
  | "trust-manifest-current"
  | "buyer-decision-clear";

export type BuyerPublicationWindowStopRule = {
  id: BuyerPublicationWindowStopRuleId;
  label: string;
  status: BuyerPublicationWindowStatus;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerPublicationWindowHandoffContract = {
  mode: BuyerPublicationWindowHandoffMode;
  status: BuyerPublicationWindowStatus;
  headline: string;
  summary: string;
  primaryOwner: string;
  proofAgeHours: number | null;
  verifiedCount: number;
  totalCount: number;
  stopRules: BuyerPublicationWindowStopRule[];
};

export type BuyerPublicationWindowSnapshot = {
  status: BuyerPublicationWindowStatus;
  headline: string;
  summary: string;
  generatedAt: string;
  proofExpiresAt: string;
  manifestExpiresAt: string;
  buyerReviewDueAt: string;
  timeboxLabel: string;
  firstAction: BuyerPublicationWindowAction;
  tasks: BuyerPublicationWindowTask[];
  handoffContract: BuyerPublicationWindowHandoffContract;
  copyText: string;
  exportMarkdown: string;
};

export type BuyerPublicationWindowBuildInput = {
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  proofChain: { status: BuyerPublicationWindowStatus };
  publicDecisionPath: { status: BuyerPublicationWindowStatus; decision: "send-to-buyer" | "sponsor-review" | "hold-internal" };
  trustSnapshot: { status: BuyerPublicationWindowStatus };
  currentAuditHref: string;
  trustManifestHref: string;
  launchRoomHref: string;
  now?: Date;
};

function chainHrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function addHoursToIso(value: string, hours: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + hours * 3_600_000).toISOString();
}

function hoursUntil(targetIso: string, now: Date) {
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round(((target.getTime() - now.getTime()) / 3_600_000) * 10) / 10;
}

function hoursSince(sourceIso: string | undefined, now: Date) {
  if (!sourceIso) return null;
  const source = new Date(sourceIso);
  if (Number.isNaN(source.getTime())) return null;
  return Math.max(0, Math.round(((now.getTime() - source.getTime()) / 3_600_000) * 10) / 10);
}

function publicationProofStatus(input: { verification: BuyerShareGateProofVerificationSummary | null; proofExpiresAt: string; now: Date }): BuyerPublicationWindowStatus {
  if (!input.verification || !input.proofExpiresAt) return "blocked";
  if (input.verification.results.some((result) => result.status === "block")) return "blocked";
  const remaining = hoursUntil(input.proofExpiresAt, input.now);
  if (remaining === null || remaining <= 0) return "blocked";
  if (input.verification.results.some((result) => result.status === "watch") || remaining <= 6) return "attention";
  return "ready";
}

function proofFreshnessWindowStatus(input: { verification: BuyerShareGateProofVerificationSummary | null; proofExpiresAt: string; now: Date }): BuyerPublicationWindowStatus {
  if (!input.verification || !input.proofExpiresAt) return "blocked";
  const remaining = hoursUntil(input.proofExpiresAt, input.now);
  if (remaining === null || remaining <= 0) return "blocked";
  if (remaining <= 6) return "attention";
  return "ready";
}

function proofLinkStatus(verification: BuyerShareGateProofVerificationSummary | null): BuyerPublicationWindowStatus {
  if (!verification) return "blocked";
  if (verification.results.some((result) => result.status === "block")) return "blocked";
  if (verification.results.some((result) => result.status === "watch")) return "attention";
  return "ready";
}

function modeForStatus(status: BuyerPublicationWindowStatus): BuyerPublicationWindowHandoffMode {
  if (status === "ready") return "send";
  if (status === "attention") return "review";
  return "hold";
}

function buildStopRules(input: {
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  proofChain: { status: BuyerPublicationWindowStatus };
  publicDecisionPath: { status: BuyerPublicationWindowStatus; decision: "send-to-buyer" | "sponsor-review" | "hold-internal" };
  trustSnapshot: { status: BuyerPublicationWindowStatus };
  proofExpiresAt: string;
  currentAuditHref: string;
  trustManifestHref: string;
  launchRoomHref: string;
  now: Date;
}): BuyerPublicationWindowStopRule[] {
  const firstOpenProofLink =
    input.proofVerification?.results.find((result) => result.status === "block") ?? input.proofVerification?.results.find((result) => result.status === "watch");
  const linkStatus = proofLinkStatus(input.proofVerification);
  const freshnessStatus = proofFreshnessWindowStatus({ verification: input.proofVerification, proofExpiresAt: input.proofExpiresAt, now: input.now });
  const proofAgeHours = hoursSince(input.proofVerification?.checkedAt, input.now);

  return [
    {
      id: "live-proof-current",
      label: "Live proof is current",
      status: freshnessStatus,
      evidence: input.proofVerification
        ? `Checked ${proofAgeHours ?? "unknown"} hours ago; proof window expires ${input.proofExpiresAt || "not scheduled"}.`
        : "Live proof verification has not run in this workspace.",
      action:
        freshnessStatus === "ready"
          ? "Keep this receipt attached and rerun verification after any URL change."
          : freshnessStatus === "attention"
            ? "Rerun live verification before buyer or sponsor review."
            : "Run Verify live links before any external handoff.",
      href: input.currentAuditHref
    },
    {
      id: "proof-links-open",
      label: "Every proof link opens",
      status: linkStatus,
      evidence: input.proofVerification
        ? `${input.proofVerification.verifiedCount}/${input.proofVerification.totalCount} links verified.${firstOpenProofLink ? ` ${firstOpenProofLink.label}: ${firstOpenProofLink.evidence}` : ""}`
        : "No live link results are attached.",
      action: firstOpenProofLink?.action ?? (linkStatus === "ready" ? "Keep public proof links attached to the launch room." : "Run live proof verification."),
      href: input.currentAuditHref
    },
    {
      id: "proof-chain-sealed",
      label: "Proof chain is sealed",
      status: input.proofChain.status,
      evidence: input.proofChain.status === "ready" ? "Proof chain status is ready for external review." : "The proof chain still has open buyer-facing proof work.",
      action: input.proofChain.status === "ready" ? "Keep the sealed proof chain linked from the launch room." : "Close the open proof-chain action before handoff.",
      href: input.currentAuditHref
    },
    {
      id: "trust-manifest-current",
      label: "Trust manifest is current",
      status: input.trustSnapshot.status,
      evidence: input.trustSnapshot.status === "ready" ? "Trust snapshot is ready for buyer inspection." : "Trust, security, or offer commitments need another review.",
      action: input.trustSnapshot.status === "ready" ? "Regenerate the manifest after any proof, price, or scope change." : "Close trust review items and regenerate the manifest.",
      href: input.trustManifestHref
    },
    {
      id: "buyer-decision-clear",
      label: "Buyer decision path is clear",
      status: input.publicDecisionPath.status,
      evidence:
        input.publicDecisionPath.decision === "send-to-buyer"
          ? "Decision path allows buyer handoff."
          : input.publicDecisionPath.decision === "sponsor-review"
            ? "Sponsor review is still required before buyer handoff."
            : "Decision path is holding external sharing.",
      action:
        input.publicDecisionPath.status === "ready"
          ? "Capture continue, revise, or stop in the launch room."
          : "Clear the buyer decision path before sending this packet.",
      href: input.launchRoomHref
    }
  ];
}

function buildHandoffContract(input: {
  status: BuyerPublicationWindowStatus;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  stopRules: BuyerPublicationWindowStopRule[];
  now: Date;
}): BuyerPublicationWindowHandoffContract {
  const mode = modeForStatus(input.status);
  const firstOpen = input.stopRules.find((rule) => rule.status === "blocked") ?? input.stopRules.find((rule) => rule.status === "attention");
  const proofAgeHours = hoursSince(input.proofVerification?.checkedAt, input.now);
  const headline =
    mode === "send"
      ? "Send only with this live proof receipt attached"
      : mode === "review"
        ? "Sponsor review can proceed, buyer send waits on recheck"
        : "Hold the handoff until the first stop rule is cleared";
  const summary = firstOpen ? `${firstOpen.label}: ${firstOpen.action}` : "All handoff stop rules are clear for the current proof window.";

  return {
    mode,
    status: input.status,
    headline,
    summary,
    primaryOwner: firstOpen ? (firstOpen.id === "buyer-decision-clear" ? "Sponsor owner" : firstOpen.id === "trust-manifest-current" ? "Proof owner" : "Launch operator") : "Launch operator",
    proofAgeHours,
    verifiedCount: input.proofVerification?.verifiedCount ?? 0,
    totalCount: input.proofVerification?.totalCount ?? 0,
    stopRules: input.stopRules
  };
}

function buildMarkdown(snapshot: Omit<BuyerPublicationWindowSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Buyer publication window",
    "",
    `Status: ${snapshot.status}`,
    `Generated: ${snapshot.generatedAt}`,
    `Live proof expires: ${snapshot.proofExpiresAt}`,
    `Manifest expires: ${snapshot.manifestExpiresAt}`,
    `Buyer review due: ${snapshot.buyerReviewDueAt}`,
    `First action: ${snapshot.firstAction.label} (${snapshot.firstAction.href})`,
    "",
    snapshot.summary,
    "",
    "## Handoff contract",
    `Mode: ${snapshot.handoffContract.mode}`,
    `Owner: ${snapshot.handoffContract.primaryOwner}`,
    `Verified proof: ${snapshot.handoffContract.verifiedCount}/${snapshot.handoffContract.totalCount}`,
    `Proof age hours: ${snapshot.handoffContract.proofAgeHours ?? "not checked"}`,
    snapshot.handoffContract.summary,
    "",
    "### Stop rules",
    ...snapshot.handoffContract.stopRules.map((rule) => `- [${rule.status}] ${rule.label}: ${rule.evidence} Action: ${rule.action}`),
    "",
    "## Recheck schedule",
    ...snapshot.tasks.map((task) => `- [${task.status}] ${task.label} (${task.owner}) due ${task.dueAt}: ${task.action}`)
  ].join("\n");
}

export function buildBuyerPublicationWindowSnapshot({
  proofVerification,
  proofChain,
  publicDecisionPath,
  trustSnapshot,
  currentAuditHref,
  trustManifestHref,
  launchRoomHref,
  now = new Date()
}: BuyerPublicationWindowBuildInput): BuyerPublicationWindowSnapshot {
  const generatedAt = proofVerification?.checkedAt ?? "";
  const proofExpiresAt = generatedAt ? addHoursToIso(generatedAt, 24) : "";
  const manifestExpiresAt = generatedAt ? addHoursToIso(generatedAt, 24 * 7) : "";
  const buyerReviewDueAt = generatedAt ? addHoursToIso(generatedAt, 72) : "";
  const proofStatus = publicationProofStatus({ verification: proofVerification, proofExpiresAt, now });
  const stopRules = buildStopRules({
    proofVerification,
    proofChain,
    publicDecisionPath,
    trustSnapshot,
    proofExpiresAt,
    currentAuditHref,
    trustManifestHref,
    launchRoomHref,
    now
  });
  const status: BuyerPublicationWindowStatus =
    [proofStatus, trustSnapshot.status, publicDecisionPath.status, proofChain.status].includes("blocked")
      ? "blocked"
      : [proofStatus, trustSnapshot.status, publicDecisionPath.status, proofChain.status].includes("attention")
        ? "attention"
        : "ready";
  const remainingHours = hoursUntil(proofExpiresAt, now);
  const timeboxLabel =
    remainingHours === null ? "Live proof not checked" : remainingHours <= 0 ? "Live proof expired" : `${remainingHours}h proof window`;
  const tasks: BuyerPublicationWindowTask[] = [
    {
      id: "live-proof-recheck",
      label: "Live proof recheck",
      status: proofStatus,
      owner: "Launch operator",
      dueAt: proofExpiresAt || "Run before sharing",
      action:
        proofStatus === "ready"
          ? "Re-run the live proof audit before the 24-hour window closes or after any public URL changes."
          : "Run Verify live links and replace blocked public URLs before buyer delivery.",
      href: currentAuditHref
    },
    {
      id: "manifest-regeneration",
      label: "Manifest regeneration",
      status: trustSnapshot.status === "blocked" || proofStatus === "blocked" ? "blocked" : trustSnapshot.status === "attention" || proofStatus === "attention" ? "attention" : "ready",
      owner: "Proof owner",
      dueAt: manifestExpiresAt || "After proof check",
      action:
        trustSnapshot.status === "ready"
          ? "Regenerate the trust manifest after any artifact, receipt, sponsor decision, or commercial term changes."
          : "Close trust review items, then publish a fresh manifest digest.",
      href: trustManifestHref
    },
    {
      id: "buyer-review-checkpoint",
      label: "Buyer review checkpoint",
      status: publicDecisionPath.status === "ready" && proofStatus === "ready" ? "ready" : publicDecisionPath.status === "blocked" || proofStatus === "blocked" ? "blocked" : "attention",
      owner: publicDecisionPath.decision === "send-to-buyer" ? "Buyer sponsor" : "Launch operator",
      dueAt: buyerReviewDueAt || "After proof check",
      action:
        publicDecisionPath.status === "ready"
          ? "Capture continue, revise, or stop before the 72-hour buyer review window closes."
          : "Hold external review until the current buyer decision path is clear.",
      href: launchRoomHref
    }
  ];
  const firstOpen = tasks.find((task) => task.status === "blocked") ?? tasks.find((task) => task.status === "attention");
  const firstAction: BuyerPublicationWindowAction = firstOpen
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
      };
  const headline =
    status === "ready"
      ? "Buyer proof is inside its publication window"
      : status === "attention"
        ? "Buyer proof needs a recheck before it stays credible"
        : "Buyer proof is outside the safe publication window";
  const summary =
    status === "ready"
      ? `The current proof packet can travel until ${proofExpiresAt}; keep the trust manifest attached and re-run proof checks after every URL change.`
      : firstOpen
        ? `${firstOpen.label}: ${firstOpen.action}`
        : "Run live proof verification and regenerate the trust manifest before external sharing.";
  const partial: Omit<BuyerPublicationWindowSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    headline,
    summary,
    generatedAt: generatedAt || "not checked",
    proofExpiresAt: proofExpiresAt || "not checked",
    manifestExpiresAt: manifestExpiresAt || "not issued",
    buyerReviewDueAt: buyerReviewDueAt || "not scheduled",
    timeboxLabel,
    firstAction,
    tasks,
    handoffContract: buildHandoffContract({ status, proofVerification, stopRules, now })
  };
  const exportMarkdown = buildMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}
