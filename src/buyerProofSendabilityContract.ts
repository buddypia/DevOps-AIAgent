export type BuyerProofSendabilityStatus = "ready" | "attention" | "blocked";

export type BuyerProofSendabilityChecklist = {
  status: BuyerProofSendabilityStatus;
  readyCount: number;
  attentionCount: number;
  blockedCount: number;
  totalCount: number;
  primaryAction: string;
  items: Array<{
    label: string;
    status: BuyerProofSendabilityStatus;
    href: string;
  }>;
};

export type BuyerProofSendabilityContract = {
  status: BuyerProofSendabilityStatus;
  headline: string;
  sendRule: string;
  ownershipLine: string;
  primaryAction: string;
  proofLine: string;
  artifactLine: string;
  verifierLine: string;
  firstBlockerLabel: string;
  primaryActionHref: string;
};

type BuyerProofSendabilityContractOptions = {
  readyActionHref?: string;
  liveVerifiedCount?: number;
  liveTotalCount?: number;
};

function pluralizeProofSlots(count: number) {
  return `proof slot${count === 1 ? "" : "s"}`;
}

function buildProofOwnershipLine(checklist: BuyerProofSendabilityChecklist, options: BuyerProofSendabilityContractOptions) {
  const liveTotalCount = Math.max(0, options.liveTotalCount ?? checklist.totalCount);
  if (typeof options.liveVerifiedCount !== "number" || liveTotalCount === 0) {
    if (checklist.status === "ready") {
      return `Live verification and buyer-owned proof both show ${checklist.readyCount}/${checklist.totalCount} ready.`;
    }
    return "Live reachability has not proven buyer-owned proof yet.";
  }

  const liveVerifiedCount = Math.max(0, Math.min(options.liveVerifiedCount, liveTotalCount));
  const liveCount = `${liveVerifiedCount}/${liveTotalCount}`;
  const buyerOwnedCount = `${checklist.readyCount}/${checklist.totalCount}`;

  if (liveVerifiedCount > checklist.readyCount) {
    return `${liveCount} live links are reachable, but only ${buyerOwnedCount} are buyer-owned.`;
  }

  if (checklist.status === "ready") {
    return `Live verification and buyer-owned proof both show ${buyerOwnedCount} ready.`;
  }

  const openCount = checklist.attentionCount + checklist.blockedCount;
  return `${liveCount} live links are reachable and ${openCount} ${pluralizeProofSlots(openCount)} still need repair.`;
}

export function buildBuyerProofSendabilityContract(
  checklist: BuyerProofSendabilityChecklist,
  options: BuyerProofSendabilityContractOptions = {}
): BuyerProofSendabilityContract {
  const firstOpen = checklist.items.find((item) => item.status !== "ready");
  const firstBlockerLabel = firstOpen?.label ?? "None";
  const primaryActionHref = firstOpen?.href ?? options.readyActionHref ?? "#buyer-pilot-command";
  const proofLine = `${checklist.readyCount}/${checklist.totalCount} buyer-owned proof links verified`;
  const ownershipLine = buildProofOwnershipLine(checklist, options);
  const artifactLine =
    checklist.status === "ready"
      ? "Attach memo, trust manifest, launch room, and decision receipt."
      : checklist.blockedCount > 0
        ? `${checklist.blockedCount} proof slot${checklist.blockedCount === 1 ? "" : "s"} blocked.`
        : `${checklist.attentionCount} proof slot${checklist.attentionCount === 1 ? "" : "s"} need live check.`;
  const verifierLine =
    checklist.status === "ready"
      ? "Verifier can travel with the packet."
      : checklist.status === "attention"
        ? "Run live verification before sending."
        : "Keep verifier internal until proof is replaced.";

  if (checklist.status === "ready") {
    return {
      status: "ready",
      headline: "Buyer send is allowed with verifier attached",
      sendRule: "Send with verifier, launch room, proof audit, and decision receipt.",
      ownershipLine,
      primaryAction: "Open launch room",
      proofLine,
      artifactLine,
      verifierLine,
      firstBlockerLabel,
      primaryActionHref
    };
  }

  if (checklist.status === "attention") {
    return {
      status: "attention",
      headline: "Proof is shaped, live verification is still required",
      sendRule: "Keep in sponsor review until live verification passes.",
      ownershipLine,
      primaryAction: checklist.primaryAction,
      proofLine,
      artifactLine,
      verifierLine,
      firstBlockerLabel,
      primaryActionHref
    };
  }

  return {
    status: "blocked",
    headline: "Do not send this buyer room yet",
    sendRule: "Replace blocked proof before exporting a buyer-facing packet.",
    ownershipLine,
    primaryAction: checklist.primaryAction,
    proofLine,
    artifactLine,
    verifierLine,
    firstBlockerLabel,
    primaryActionHref
  };
}
