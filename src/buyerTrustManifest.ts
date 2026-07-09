import type { AdoptionOperatingPlan } from "./adoptionOperatingPlan.js";
import type { BuyerDecisionFollowUpLedger } from "./buyerDecisionFollowUp.js";
import { BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH, type BuyerEvidenceBoardReceipt } from "./buyerEvidenceBoard.js";
import { BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH, type BuyerPilotContract } from "./buyerPilotContract.js";
import type { BuyerProofPacket } from "./buyerProofPacket.js";
import type { BuyerTrustCenter } from "./buyerTrustCenter.js";
import { COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH, type CommercialOffer } from "./commercialOffer.js";
import type { SponsorDecisionReceipt, SponsorReviewRoom } from "./sponsorReviewRoom.js";

export type BuyerTrustManifestReadiness = "external-ready" | "needs-proof" | "blocked";
export type BuyerTrustManifestStatus = "pass" | "watch" | "block";
export const BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH = "/api/buyer-trust-manifest/receipt/verify";
export type BuyerTrustManifestArtifactId =
  | "value-report"
  | "work-order"
  | "pilot-receipt"
  | "evidence-ledger"
  | "delivery-memo"
  | "buyer-evidence-board"
  | "proof-packet"
  | "sponsor-review"
  | "adoption-plan"
  | "trust-center"
  | "commercial-offer"
  | "buyer-pilot-contract"
  | "decision-follow-up"
  | "live-proof-audit";

export type BuyerTrustManifestArtifact = {
  id: BuyerTrustManifestArtifactId;
  label: string;
  href: string;
  status: BuyerTrustManifestStatus;
  owner: string;
  evidence: string;
  verifier: string;
};

export type BuyerTrustManifestReceipt = {
  id: "buyer-proof-packet" | "buyer-evidence-board" | "commercial-offer" | "buyer-pilot-contract" | "sponsor-decision" | "buyer-trust-manifest";
  status: BuyerTrustManifestStatus;
  algorithm: "fnv1a-64" | "decision-receipt";
  digest: string;
  evidence: string;
  verifier: string;
};

export type BuyerTrustManifestPublicationDecision = "publish" | "repair" | "hold";

export type BuyerTrustManifestPublicationCheck = {
  id: string;
  kind: "artifact" | "receipt";
  label: string;
  status: BuyerTrustManifestStatus;
  owner: string;
  href: string;
  evidence: string;
  action: string;
  verifier: string;
};

export type BuyerTrustManifestPublicationGate = {
  decision: BuyerTrustManifestPublicationDecision;
  headline: string;
  score: number;
  passedCount: number;
  totalCount: number;
  blockedCount: number;
  watchCount: number;
  firstAction: string;
  firstActionHref: string;
  checks: BuyerTrustManifestPublicationCheck[];
};

export type BuyerTrustManifestPublicationWindowStatus = "current" | "recheck-required" | "blocked";

export type BuyerTrustManifestReviewTaskId = "live-proof-recheck" | "manifest-regeneration" | "sponsor-decision-replay" | "buyer-review-checkpoint";

export type BuyerTrustManifestReviewTask = {
  id: BuyerTrustManifestReviewTaskId;
  label: string;
  status: BuyerTrustManifestStatus;
  owner: string;
  dueAt: string;
  trigger: string;
  action: string;
  href: string;
};

export type BuyerTrustManifestPublicationWindow = {
  status: BuyerTrustManifestPublicationWindowStatus;
  generatedAt: string;
  proofExpiresAt: string;
  manifestExpiresAt: string;
  buyerReviewDueAt: string;
  summary: string;
  firstRecheck: string;
  firstRecheckHref: string;
  schedule: BuyerTrustManifestReviewTask[];
};

export type BuyerTrustManifestPayload = {
  manifestVersion: "buyer-trust-manifest.v1";
  subject: string;
  generatedAt: string;
  readiness: BuyerTrustManifestReadiness;
  score: number;
  proofPacketReceiptDigest: string;
  buyerEvidenceBoardReceiptChecksum?: string;
  commercialOfferReceiptChecksum?: string;
  buyerPilotContractId?: string;
  buyerPilotContractReceiptChecksum?: string;
  sponsorDecisionReceiptId: string;
  adoptionPlanId: string;
  trustCenterId: string;
  commercialOfferId: string;
  artifacts: Array<Pick<BuyerTrustManifestArtifact, "id" | "status" | "href" | "evidence">>;
  publicationWindow: {
    status: BuyerTrustManifestPublicationWindowStatus;
    proofExpiresAt: string;
    manifestExpiresAt: string;
    buyerReviewDueAt: string;
    schedule: Array<Pick<BuyerTrustManifestReviewTask, "id" | "status" | "dueAt" | "href" | "action">>;
  };
};

export type BuyerTrustManifestVerificationBrief = {
  headline: string;
  machineManifestHref: string;
  markdownHref: string;
  primaryArtifactHref: string;
  digest: string;
  proofPacketDigest: string;
  passedArtifacts: number;
  totalArtifacts: number;
  firstAction: string;
  firstActionHref: string;
  instructions: string[];
};

export type BuyerTrustManifestReceiptVerification = {
  status: "verified" | "mismatch";
  expectedDigest: string;
  actualDigest: string;
  instruction: string;
};

export type BuyerTrustManifest = {
  id: string;
  manifestVersion: BuyerTrustManifestPayload["manifestVersion"];
  generatedAt: string;
  issuer: string;
  subject: string;
  readiness: BuyerTrustManifestReadiness;
  score: number;
  headline: string;
  decision: string;
  proofPacketDigest: string;
  sponsorDecisionStatus: SponsorDecisionReceipt["status"];
  artifacts: BuyerTrustManifestArtifact[];
  receipts: BuyerTrustManifestReceipt[];
  publicationGate: BuyerTrustManifestPublicationGate;
  publicationWindow: BuyerTrustManifestPublicationWindow;
  verificationBrief: BuyerTrustManifestVerificationBrief;
  verification: {
    algorithm: "fnv1a-64";
    digest: string;
    verificationApiPath: typeof BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH;
    payload: BuyerTrustManifestPayload;
    payloadJson: string;
    payloadHref: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    replayVerification: BuyerTrustManifestReceiptVerification;
    instruction: string;
  };
  exportMarkdown: string;
};

export type BuyerTrustManifestLinks = {
  valueReportUrl: string;
  workOrderUrl: string;
  pilotReceiptUrl: string;
  ledgerUrl: string;
  deliveryMemoUrl: string;
  buyerEvidenceBoardUrl?: string;
  proofPacketUrl: string;
  sponsorReviewUrl: string;
  adoptionPlanUrl: string;
  trustCenterUrl: string;
  commercialOfferUrl: string;
  buyerPilotContractUrl?: string;
  agreementUrl?: string;
  launchRoomUrl?: string;
  decisionFollowUpUrl: string;
  proofAuditUrl: string;
  jsonUrl?: string;
  markdownUrl?: string;
  wellKnownUrl?: string;
  verifierUrl?: string;
  appUrl?: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function escapeScriptJson(value: string) {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buyerTrustManifestReceiptDigest(payload: BuyerTrustManifestPayload) {
  return stableDigest(payload);
}

export function verifyBuyerTrustManifestReceipt(input: { digest: string; payload: BuyerTrustManifestPayload }): BuyerTrustManifestReceiptVerification {
  const expectedDigest = input.digest.toLowerCase();
  const actualDigest = buyerTrustManifestReceiptDigest(input.payload);
  const verified = actualDigest === expectedDigest;

  return {
    status: verified ? "verified" : "mismatch",
    expectedDigest,
    actualDigest,
    instruction: verified
      ? "Buyer trust manifest digest matches the attached verification payload."
      : "Buyer trust manifest digest does not match the attached verification payload. Do not rely on this proof index until the source workspace is regenerated."
  };
}

function statusScore(status: BuyerTrustManifestStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 18;
}

function packetStatus(packet: BuyerProofPacket): BuyerTrustManifestStatus {
  if (packet.readiness === "share-ready") return "pass";
  if (packet.readiness === "needs-evidence") return "watch";
  return "block";
}

function sponsorStatus(receipt: SponsorDecisionReceipt): BuyerTrustManifestStatus {
  if (receipt.status === "signed") return "pass";
  if (receipt.status === "needs-evidence") return "watch";
  return "block";
}

function adoptionStatus(plan: AdoptionOperatingPlan): BuyerTrustManifestStatus {
  if (plan.readiness === "ready-to-operate") return "pass";
  if (plan.readiness === "needs-owner-commitment") return "watch";
  return "block";
}

function trustStatus(center: BuyerTrustCenter): BuyerTrustManifestStatus {
  if (center.readiness === "trust-ready") return "pass";
  if (center.readiness === "needs-review") return "watch";
  return "block";
}

function offerStatus(offer: CommercialOffer): BuyerTrustManifestStatus {
  if (offer.readiness === "offer-ready") return "pass";
  if (offer.readiness === "needs-redlines") return "watch";
  return "block";
}

function contractStatus(contract: BuyerPilotContract): BuyerTrustManifestStatus {
  if (contract.readiness === "contract-ready") return "pass";
  if (contract.readiness === "needs-redlines") return "watch";
  return "block";
}

function followUpStatus(ledger: BuyerDecisionFollowUpLedger): BuyerTrustManifestStatus {
  if (ledger.status === "ready") return "pass";
  if (ledger.status === "attention") return "watch";
  return "block";
}

function evidenceBoardStatus(receipt: BuyerEvidenceBoardReceipt): BuyerTrustManifestStatus {
  if (receipt.payload.status === "sendable") return "pass";
  if (receipt.payload.status === "review-first") return "watch";
  return "block";
}

function readinessFrom(artifacts: BuyerTrustManifestArtifact[], receipts: BuyerTrustManifestReceipt[]): BuyerTrustManifestReadiness {
  if (artifacts.some((artifact) => artifact.status === "block") || receipts.some((receipt) => receipt.status === "block")) return "blocked";
  if (artifacts.every((artifact) => artifact.status === "pass") && receipts.every((receipt) => receipt.status === "pass")) return "external-ready";
  return "needs-proof";
}

function headlineFor(readiness: BuyerTrustManifestReadiness) {
  if (readiness === "external-ready") return "Buyer trust manifest is externally verifiable";
  if (readiness === "needs-proof") return "Buyer trust manifest needs proof closure";
  return "Buyer trust manifest blocks external sharing";
}

function decisionFor(readiness: BuyerTrustManifestReadiness, firstOpen: BuyerTrustManifestArtifact | undefined) {
  if (readiness === "external-ready") return "Share the proof packet with the buyer and keep the manifest digest attached.";
  if (readiness === "needs-proof") return `Close or acknowledge ${firstOpen?.label ?? "the remaining proof item"} before buyer delivery.`;
  return `Do not share externally until ${firstOpen?.label ?? "blocked proof"} is repaired and the manifest is regenerated.`;
}

function publicationDecisionFor(blockedCount: number, watchCount: number): BuyerTrustManifestPublicationDecision {
  if (blockedCount > 0) return "hold";
  if (watchCount > 0) return "repair";
  return "publish";
}

function publicationHeadlineFor(decision: BuyerTrustManifestPublicationDecision) {
  if (decision === "publish") return "Public buyer proof is ready to publish";
  if (decision === "repair") return "Public buyer proof needs final verification";
  return "Hold public buyer proof until blockers are repaired";
}

function addHoursIso(value: string, hours: number) {
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return "";
  return new Date(base.getTime() + hours * 3_600_000).toISOString();
}

function publicationWindowStatusFor(decision: BuyerTrustManifestPublicationDecision): BuyerTrustManifestPublicationWindowStatus {
  if (decision === "publish") return "current";
  if (decision === "repair") return "recheck-required";
  return "blocked";
}

function publicationWindowSummary(status: BuyerTrustManifestPublicationWindowStatus, proofExpiresAt: string, firstRecheck: string) {
  if (status === "current") {
    return `Public buyer proof can be shared until the live proof window expires at ${proofExpiresAt}; regenerate the manifest after any upstream artifact changes.`;
  }
  if (status === "recheck-required") {
    return `Keep the packet in sponsor review until ${firstRecheck}. The live proof window expires at ${proofExpiresAt}.`;
  }
  return `Do not publish this proof chain. ${firstRecheck}`;
}

function buildPublicationWindow(input: {
  generatedAt: string;
  proofPacket: BuyerProofPacket;
  sponsorDecisionReceipt: SponsorDecisionReceipt;
  publicationGate: BuyerTrustManifestPublicationGate;
  links: BuyerTrustManifestLinks;
}): BuyerTrustManifestPublicationWindow {
  const proofExpiresAt = addHoursIso(input.generatedAt, 24);
  const manifestExpiresAt = addHoursIso(input.generatedAt, 24 * 7);
  const buyerReviewDueAt = addHoursIso(input.generatedAt, 72);
  const status = publicationWindowStatusFor(input.publicationGate.decision);
  const sponsorCheckStatus = sponsorStatus(input.sponsorDecisionReceipt);
  const liveProofStatus: BuyerTrustManifestStatus = input.publicationGate.decision === "publish" ? "pass" : input.publicationGate.decision === "repair" ? "watch" : "block";
  const buyerReviewStatus: BuyerTrustManifestStatus = input.publicationGate.decision === "publish" ? "pass" : input.publicationGate.decision === "repair" ? "watch" : "block";
  const schedule: BuyerTrustManifestReviewTask[] = [
    {
      id: "live-proof-recheck",
      label: "Live proof recheck",
      status: liveProofStatus,
      owner: "Launch operator",
      dueAt: proofExpiresAt,
      trigger: "Every buyer-facing proof URL must be rechecked within 24 hours while the packet is under review.",
      action:
        liveProofStatus === "pass"
          ? "Re-run the live proof audit before this timestamp or after any public URL changes."
          : "Run the live proof audit and replace any blocked public URL before buyer delivery.",
      href: input.links.proofAuditUrl
    },
    {
      id: "manifest-regeneration",
      label: "Manifest regeneration",
      status: input.publicationGate.blockedCount > 0 ? "block" : input.publicationGate.watchCount > 0 ? "watch" : "pass",
      owner: "Launch operator",
      dueAt: manifestExpiresAt,
      trigger: "Regenerate whenever an artifact URL, receipt digest, sponsor decision, trust control, or commercial term changes.",
      action:
        input.publicationGate.blockedCount > 0
          ? "Repair blocked checks, regenerate this manifest, and publish the new digest."
          : "Publish a fresh manifest digest after upstream proof changes or before the seven-day window expires.",
      href: input.links.wellKnownUrl ?? input.links.jsonUrl ?? input.links.appUrl ?? input.links.proofAuditUrl
    },
    {
      id: "sponsor-decision-replay",
      label: "Sponsor decision replay",
      status: sponsorCheckStatus,
      owner: input.sponsorDecisionReceipt.signerName,
      dueAt: buyerReviewDueAt,
      trigger: "The sponsor decision must remain aligned with the current proof packet and open conditions.",
      action:
        sponsorCheckStatus === "pass"
          ? "Replay the sponsor decision receipt if the buyer asks for approval provenance."
          : "Clear sponsor decision evidence before relying on this proof chain externally.",
      href: input.links.sponsorReviewUrl
    },
    {
      id: "buyer-review-checkpoint",
      label: "Buyer review checkpoint",
      status: buyerReviewStatus,
      owner: input.proofPacket.targetBuyer,
      dueAt: buyerReviewDueAt,
      trigger: "Record continue, revise, or stop after the buyer inspects the packet.",
      action:
        buyerReviewStatus === "pass"
          ? "Capture the buyer decision before the 72-hour review window closes."
          : "Hold buyer review until the publication gate first action is closed.",
      href: input.publicationGate.firstActionHref
    }
  ];
  const firstOpen = schedule.find((task) => task.status === "block") ?? schedule.find((task) => task.status === "watch") ?? schedule[0];
  const firstRecheck = firstOpen ? `${firstOpen.label}: ${firstOpen.action}` : "Re-run the live proof audit before buyer delivery.";

  return {
    status,
    generatedAt: input.generatedAt,
    proofExpiresAt,
    manifestExpiresAt,
    buyerReviewDueAt,
    summary: publicationWindowSummary(status, proofExpiresAt, firstRecheck),
    firstRecheck,
    firstRecheckHref: firstOpen?.href ?? input.publicationGate.firstActionHref,
    schedule
  };
}

function artifactAction(artifact: BuyerTrustManifestArtifact) {
  if (artifact.status === "pass") return "Keep this artifact attached to the public buyer proof index.";
  switch (artifact.id) {
    case "value-report":
      return "Open the value report and close the buyer-value proof gap before using it externally.";
    case "work-order":
      return "Attach or update the buyer-approved work order evidence, then regenerate the manifest.";
    case "pilot-receipt":
      return "Attach the measured pilot receipt URL and rerun the buyer proof packet.";
    case "evidence-ledger":
      return "Regenerate the evidence ledger after the sponsor proof trail is current.";
    case "delivery-memo":
      return "Open the delivery memo and resolve the blocked proof packet row before sending it to a buyer.";
    case "buyer-evidence-board":
      return "Open the buyer evidence board and repair the first blocked evidence lane.";
    case "proof-packet":
      return "Open the proof packet and close the first blocked row before buyer delivery.";
    case "sponsor-review":
      return "Clear the sponsor review decision or keep this packet internal.";
    case "adoption-plan":
      return "Assign the open operating owner commitment before public buyer sharing.";
    case "trust-center":
      return "Close the first trust risk or mark the limitation explicitly for buyer review.";
    case "commercial-offer":
      return "Resolve the first commercial redline before procurement review.";
    case "buyer-pilot-contract":
      return "Open the buyer pilot contract and clear owner redlines before asking for buyer approval.";
    case "decision-follow-up":
      return "Open the follow-up ledger and close the first owner task before sending the buyer room.";
    case "live-proof-audit":
      return "Run the live proof audit after final public URLs are attached.";
    default:
      return "Open this artifact and repair the public proof gap before publishing.";
  }
}

function receiptAction(receipt: BuyerTrustManifestReceipt) {
  if (receipt.status === "pass") return "Keep this receipt digest attached to the public manifest.";
  if (receipt.id === "buyer-proof-packet") return "Regenerate the buyer proof packet after blocked rows are closed.";
  if (receipt.id === "buyer-evidence-board") return "Regenerate the buyer evidence board after blocked lanes are repaired.";
  if (receipt.id === "commercial-offer") return "Regenerate the commercial offer after pricing, approval, or guardrail changes.";
  if (receipt.id === "buyer-pilot-contract") return "Regenerate the buyer pilot contract after contract, commercial, trust, proof, or owner changes.";
  if (receipt.id === "sponsor-decision") return "Regenerate the sponsor decision receipt after sponsor review is cleared.";
  return "Regenerate the trust manifest after upstream proof changes.";
}

function receiptHref(receipt: BuyerTrustManifestReceipt, links: BuyerTrustManifestLinks) {
  if (receipt.id === "buyer-proof-packet") return links.proofPacketUrl;
  if (receipt.id === "buyer-evidence-board") return links.buyerEvidenceBoardUrl ?? links.deliveryMemoUrl;
  if (receipt.id === "commercial-offer") return links.commercialOfferUrl;
  if (receipt.id === "buyer-pilot-contract") return links.buyerPilotContractUrl ?? links.commercialOfferUrl;
  if (receipt.id === "sponsor-decision") return links.sponsorReviewUrl;
  return links.wellKnownUrl ?? links.jsonUrl ?? links.appUrl ?? links.proofAuditUrl;
}

function buildPublicationGate(input: {
  artifacts: BuyerTrustManifestArtifact[];
  receipts: BuyerTrustManifestReceipt[];
  links: BuyerTrustManifestLinks;
}): BuyerTrustManifestPublicationGate {
  const checks: BuyerTrustManifestPublicationCheck[] = [
    ...input.artifacts.map((artifact) => ({
      id: artifact.id,
      kind: "artifact" as const,
      label: artifact.label,
      status: artifact.status,
      owner: artifact.owner,
      href: artifact.href,
      evidence: artifact.evidence,
      action: artifactAction(artifact),
      verifier: artifact.verifier
    })),
    ...input.receipts.map((receipt) => ({
      id: receipt.id,
      kind: "receipt" as const,
      label: receipt.id,
      status: receipt.status,
      owner: receipt.id === "sponsor-decision" ? "Sponsor owner" : "Launch operator",
      href: receiptHref(receipt, input.links),
      evidence: receipt.evidence,
      action: receiptAction(receipt),
      verifier: receipt.verifier
    }))
  ];
  const blockedCount = checks.filter((check) => check.status === "block").length;
  const watchCount = checks.filter((check) => check.status === "watch").length;
  const passedCount = checks.filter((check) => check.status === "pass").length;
  const decision = publicationDecisionFor(blockedCount, watchCount);
  const firstOpen = checks.find((check) => check.status === "block") ?? checks.find((check) => check.status === "watch");

  return {
    decision,
    headline: publicationHeadlineFor(decision),
    score: Math.round(average(checks.map((check) => statusScore(check.status)))),
    passedCount,
    totalCount: checks.length,
    blockedCount,
    watchCount,
    firstAction: firstOpen?.action ?? "Publish the public buyer proof index with the manifest digest attached.",
    firstActionHref: firstOpen?.href ?? input.links.wellKnownUrl ?? input.links.jsonUrl ?? input.links.appUrl ?? input.links.proofAuditUrl,
    checks
  };
}

function buildArtifacts(input: {
  proofPacket: BuyerProofPacket;
  sponsorReview: SponsorReviewRoom;
  sponsorDecisionReceipt: SponsorDecisionReceipt;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  buyerPilotContract?: BuyerPilotContract;
  decisionFollowUpLedger: BuyerDecisionFollowUpLedger;
  buyerEvidenceBoardReceipt?: BuyerEvidenceBoardReceipt;
  links: BuyerTrustManifestLinks;
}): BuyerTrustManifestArtifact[] {
  const firstPacketGap = input.proofPacket.gaps[0];
  const firstTrustRisk = input.trustCenter.risks[0];
  const firstOfferRedline = input.commercialOffer.approvalMemo.redlineQueue[0];
  const firstFollowUpTask = input.decisionFollowUpLedger.tasks.find((task) => task.status === "blocked") ?? input.decisionFollowUpLedger.tasks.find((task) => task.status === "attention");
  const contractArtifact = input.buyerPilotContract
    ? [
        {
          id: "buyer-pilot-contract" as const,
          label: "Buyer pilot contract",
          href: input.links.buyerPilotContractUrl ?? input.links.commercialOfferUrl,
          status: contractStatus(input.buyerPilotContract),
          owner: input.buyerPilotContract.approvalMemo.signer,
          evidence: `${input.buyerPilotContract.contractScore}/100 contract score; approval decision ${input.buyerPilotContract.approvalMemo.decision}; receipt ${input.buyerPilotContract.receipt.receiptId}.`,
          verifier: `POST ${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}`
        }
      ]
    : [];
  const evidenceBoardArtifact =
    input.buyerEvidenceBoardReceipt && input.links.buyerEvidenceBoardUrl
      ? [
          {
            id: "buyer-evidence-board" as const,
            label: "Buyer evidence board",
            href: input.links.buyerEvidenceBoardUrl,
            status: evidenceBoardStatus(input.buyerEvidenceBoardReceipt),
            owner: input.buyerEvidenceBoardReceipt.payload.buyer,
            evidence: `${input.buyerEvidenceBoardReceipt.payload.readyCount}/${input.buyerEvidenceBoardReceipt.payload.itemCount} evidence lanes ready; receipt ${input.buyerEvidenceBoardReceipt.receiptId}.`,
            verifier: `POST ${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}`
          }
        ]
      : [];
  return [
    {
      id: "value-report",
      label: "Value report",
      href: input.links.valueReportUrl,
      status: input.proofPacket.rows.find((row) => row.id === "buyer-outcome")?.status === "clear" ? "pass" : "watch",
      owner: input.proofPacket.targetBuyer,
      evidence: input.proofPacket.rows.find((row) => row.id === "buyer-outcome")?.evidence ?? input.proofPacket.decisionAsk,
      verifier: "Buyer proof packet row: buyer-outcome"
    },
    {
      id: "work-order",
      label: "Work order",
      href: input.links.workOrderUrl,
      status: input.adoptionPlan.healthMetrics.find((metric) => metric.id === "work-order-operability")?.status === "clear" ? "pass" : "watch",
      owner: input.adoptionPlan.cadence[0]?.owner ?? "Pilot facilitator",
      evidence: input.adoptionPlan.cadence[0]?.evidence ?? input.adoptionPlan.operatingMetric,
      verifier: "Adoption operating plan cadence"
    },
    {
      id: "pilot-receipt",
      label: "Pilot receipt",
      href: input.links.pilotReceiptUrl,
      status: input.adoptionPlan.healthMetrics.find((metric) => metric.id === "first-run-proof")?.status === "clear" ? "pass" : "watch",
      owner: input.adoptionPlan.healthMetrics.find((metric) => metric.id === "first-run-proof")?.owner ?? "Pilot reviewer",
      evidence: input.adoptionPlan.healthMetrics.find((metric) => metric.id === "first-run-proof")?.evidence ?? "Measured run proof is required.",
      verifier: "Pilot run receipt health metric"
    },
    {
      id: "evidence-ledger",
      label: "Evidence ledger",
      href: input.links.ledgerUrl,
      status: input.adoptionPlan.healthMetrics.find((metric) => metric.id === "sponsor-ledger")?.status === "clear" ? "pass" : "watch",
      owner: "Sponsor owner",
      evidence: input.adoptionPlan.healthMetrics.find((metric) => metric.id === "sponsor-ledger")?.evidence ?? "Ledger status is not attached.",
      verifier: "Adoption operating plan health metric"
    },
    {
      id: "delivery-memo",
      label: "Delivery memo",
      href: input.links.deliveryMemoUrl,
      status: packetStatus(input.proofPacket),
      owner: input.proofPacket.targetBuyer,
      evidence: `${input.proofPacket.readiness} proof packet converted into a live-verified buyer handoff memo.`,
      verifier: `Buyer proof packet receipt ${input.proofPacket.receipt.digest}`
    },
    ...evidenceBoardArtifact,
    {
      id: "proof-packet",
      label: "Proof packet",
      href: input.links.proofPacketUrl,
      status: packetStatus(input.proofPacket),
      owner: firstPacketGap?.owner ?? "Buyer sponsor",
      evidence: `${input.proofPacket.packetScore}/100 packet score; ${input.proofPacket.gaps.length} open gaps.`,
      verifier: `Receipt digest ${input.proofPacket.receipt.digest}`
    },
    {
      id: "sponsor-review",
      label: "Sponsor review",
      href: input.links.sponsorReviewUrl,
      status: sponsorStatus(input.sponsorDecisionReceipt),
      owner: input.sponsorDecisionReceipt.signerName,
      evidence: `${input.sponsorDecisionReceipt.decision} decision is ${input.sponsorDecisionReceipt.status}; ${input.sponsorReview.reviewScore}/100 review score.`,
      verifier: input.sponsorDecisionReceipt.id
    },
    {
      id: "adoption-plan",
      label: "Adoption operating plan",
      href: input.links.adoptionPlanUrl,
      status: adoptionStatus(input.adoptionPlan),
      owner: input.adoptionPlan.ownerCommitments[0]?.owner ?? input.adoptionPlan.buyer,
      evidence: `${input.adoptionPlan.planScore}/100 plan score; ${input.adoptionPlan.approvalAnchors.filter((anchor) => anchor.status !== "clear").length} open approval anchors.`,
      verifier: input.adoptionPlan.id
    },
    {
      id: "trust-center",
      label: "Trust center",
      href: input.links.trustCenterUrl,
      status: trustStatus(input.trustCenter),
      owner: firstTrustRisk?.owner ?? input.trustCenter.buyer,
      evidence: `${input.trustCenter.trustScore}/100 trust score; ${input.trustCenter.risks.length} trust risks tracked.`,
      verifier: input.trustCenter.id
    },
    {
      id: "commercial-offer",
      label: "Commercial offer",
      href: input.links.commercialOfferUrl,
      status: offerStatus(input.commercialOffer),
      owner: firstOfferRedline?.owner ?? input.commercialOffer.approvalMemo.signer,
      evidence: `${input.commercialOffer.offerScore}/100 offer score; approval decision ${input.commercialOffer.approvalMemo.decision}.`,
      verifier: input.commercialOffer.id
    },
    ...contractArtifact,
    {
      id: "decision-follow-up",
      label: "Decision follow-up ledger",
      href: input.links.decisionFollowUpUrl,
      status: followUpStatus(input.decisionFollowUpLedger),
      owner: firstFollowUpTask?.owner ?? input.proofPacket.targetBuyer,
      evidence: `${input.decisionFollowUpLedger.readyCount}/${input.decisionFollowUpLedger.taskTotal} owner tasks ready; ${input.decisionFollowUpLedger.blockedCount} blocked and ${input.decisionFollowUpLedger.attentionCount} attention.`,
      verifier: `Buyer decision follow-up ledger: ${input.decisionFollowUpLedger.mode}`
    },
    {
      id: "live-proof-audit",
      label: "Live proof audit",
      href: input.links.proofAuditUrl,
      status: "watch",
      owner: "Launch operator",
      evidence: "Run the live proof audit to verify public reachability from outside the workspace.",
      verifier: "Server-side public proof link verifier"
    }
  ];
}

function buildReceipts(input: {
  proofPacket: BuyerProofPacket;
  buyerEvidenceBoardReceipt?: BuyerEvidenceBoardReceipt;
  commercialOffer: CommercialOffer;
  buyerPilotContract?: BuyerPilotContract;
  sponsorDecisionReceipt: SponsorDecisionReceipt;
  manifestPayload: BuyerTrustManifestPayload;
}): BuyerTrustManifestReceipt[] {
  const manifestDigest = stableDigest(input.manifestPayload);
  const packetCheckStatus = input.proofPacket.receipt.checks.some((check) => check.status === "blocked")
    ? "block"
    : input.proofPacket.receipt.checks.some((check) => check.status === "watch")
      ? "watch"
      : "pass";
  const commercialReceiptStatus = offerStatus(input.commercialOffer);
  const contractReceiptStatus = input.buyerPilotContract ? contractStatus(input.buyerPilotContract) : undefined;
  const evidenceBoardReceipt = input.buyerEvidenceBoardReceipt
    ? [
        {
          id: "buyer-evidence-board" as const,
          status: evidenceBoardStatus(input.buyerEvidenceBoardReceipt),
          algorithm: input.buyerEvidenceBoardReceipt.checksumAlgorithm,
          digest: input.buyerEvidenceBoardReceipt.checksum,
          evidence: `${input.buyerEvidenceBoardReceipt.payload.readyCount}/${input.buyerEvidenceBoardReceipt.payload.itemCount} evidence lanes sealed by ${input.buyerEvidenceBoardReceipt.receiptId}.`,
          verifier: `POST ${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}`
        }
      ]
    : [];
  const buyerPilotContractReceipt = input.buyerPilotContract
    ? [
        {
          id: "buyer-pilot-contract" as const,
          status: contractReceiptStatus ?? "watch",
          algorithm: input.buyerPilotContract.receipt.checksumAlgorithm,
          digest: input.buyerPilotContract.receipt.checksum,
          evidence: `${input.buyerPilotContract.approvalMemo.decision} decision sealed by ${input.buyerPilotContract.receipt.receiptId}; ${input.buyerPilotContract.approvalMemo.redlineCount} owner redlines.`,
          verifier: `POST ${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}`
        }
      ]
    : [];
  return [
    {
      id: "buyer-proof-packet",
      status: packetCheckStatus,
      algorithm: input.proofPacket.receipt.algorithm,
      digest: input.proofPacket.receipt.digest,
      evidence: `${input.proofPacket.receipt.coveredArtifacts.length} artifacts covered by the proof packet receipt.`,
      verifier: input.proofPacket.receipt.verification
    },
    ...evidenceBoardReceipt,
    {
      id: "commercial-offer",
      status: commercialReceiptStatus,
      algorithm: input.commercialOffer.receipt.checksumAlgorithm,
      digest: input.commercialOffer.receipt.checksum,
      evidence: `${input.commercialOffer.recommendedTierId} offer sealed with ${input.commercialOffer.approvalMemo.decision} approval memo and ${input.commercialOffer.offerScore}/100 score.`,
      verifier: `POST ${COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH}`
    },
    ...buyerPilotContractReceipt,
    {
      id: "sponsor-decision",
      status: sponsorStatus(input.sponsorDecisionReceipt),
      algorithm: "decision-receipt",
      digest: input.sponsorDecisionReceipt.id,
      evidence: `${input.sponsorDecisionReceipt.decision} / ${input.sponsorDecisionReceipt.status}; ${input.sponsorDecisionReceipt.conditions.length} conditions.`,
      verifier: input.sponsorDecisionReceipt.nextStep
    },
    {
      id: "buyer-trust-manifest",
      status: "pass",
      algorithm: "fnv1a-64",
      digest: manifestDigest,
      evidence: "Digest covers artifact ids, statuses, hrefs, evidence, and upstream receipt ids.",
      verifier: "Recompute fnv1a-64 over verification.payload."
    }
  ];
}

function buildPayload(input: {
  subject: string;
  generatedAt: string;
  readiness: BuyerTrustManifestReadiness;
  score: number;
  proofPacket: BuyerProofPacket;
  buyerEvidenceBoardReceipt?: BuyerEvidenceBoardReceipt;
  sponsorDecisionReceipt: SponsorDecisionReceipt;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  buyerPilotContract?: BuyerPilotContract;
  artifacts: BuyerTrustManifestArtifact[];
  publicationWindow: BuyerTrustManifestPublicationWindow;
}): BuyerTrustManifestPayload {
  const payload: BuyerTrustManifestPayload = {
    manifestVersion: "buyer-trust-manifest.v1",
    subject: input.subject,
    generatedAt: input.generatedAt,
    readiness: input.readiness,
    score: input.score,
    proofPacketReceiptDigest: input.proofPacket.receipt.digest,
    sponsorDecisionReceiptId: input.sponsorDecisionReceipt.id,
    adoptionPlanId: input.adoptionPlan.id,
    trustCenterId: input.trustCenter.id,
    commercialOfferId: input.commercialOffer.id,
    artifacts: input.artifacts.map((artifact) => ({
      id: artifact.id,
      status: artifact.status,
      href: artifact.href,
      evidence: artifact.evidence
    })),
    publicationWindow: {
      status: input.publicationWindow.status,
      proofExpiresAt: input.publicationWindow.proofExpiresAt,
      manifestExpiresAt: input.publicationWindow.manifestExpiresAt,
      buyerReviewDueAt: input.publicationWindow.buyerReviewDueAt,
      schedule: input.publicationWindow.schedule.map((task) => ({
        id: task.id,
        status: task.status,
        dueAt: task.dueAt,
        href: task.href,
        action: task.action
      }))
    }
  };
  if (input.buyerEvidenceBoardReceipt) {
    payload.buyerEvidenceBoardReceiptChecksum = input.buyerEvidenceBoardReceipt.checksum;
  }
  payload.commercialOfferReceiptChecksum = input.commercialOffer.receipt.checksum;
  if (input.buyerPilotContract) {
    payload.buyerPilotContractId = input.buyerPilotContract.id;
    payload.buyerPilotContractReceiptChecksum = input.buyerPilotContract.receipt.checksum;
  }
  return payload;
}

function buildMarkdown(manifest: Omit<BuyerTrustManifest, "exportMarkdown">) {
  return [
    `# ${manifest.headline}`,
    "",
    "Buyer Trust Manifest",
    "",
    `Readiness: ${manifest.readiness}`,
    `Score: ${manifest.score}/100`,
    `Subject: ${manifest.subject}`,
    `Generated: ${manifest.generatedAt}`,
    `Proof packet digest: ${manifest.proofPacketDigest}`,
    `Manifest digest: ${manifest.verification.digest}`,
    "",
    manifest.decision,
    "",
    "## Publication gate",
    `- Decision: ${manifest.publicationGate.decision}`,
    `- Score: ${manifest.publicationGate.score}/100`,
    `- Passed: ${manifest.publicationGate.passedCount}/${manifest.publicationGate.totalCount}`,
    `- Blocked: ${manifest.publicationGate.blockedCount}`,
    `- Watch: ${manifest.publicationGate.watchCount}`,
    `- First action: ${manifest.publicationGate.firstAction}`,
    `- First action link: ${manifest.publicationGate.firstActionHref}`,
    ...manifest.publicationGate.checks.map((check) => `- [${check.status}] ${check.kind}:${check.label} (${check.owner}): ${check.action} Evidence: ${check.evidence}`),
    "",
    "## Publication window",
    `- Status: ${manifest.publicationWindow.status}`,
    `- Generated: ${manifest.publicationWindow.generatedAt}`,
    `- Live proof expires: ${manifest.publicationWindow.proofExpiresAt}`,
    `- Manifest expires: ${manifest.publicationWindow.manifestExpiresAt}`,
    `- Buyer review due: ${manifest.publicationWindow.buyerReviewDueAt}`,
    `- First recheck: ${manifest.publicationWindow.firstRecheck}`,
    `- First recheck link: ${manifest.publicationWindow.firstRecheckHref}`,
    manifest.publicationWindow.summary,
    "",
    "### Recheck schedule",
    ...manifest.publicationWindow.schedule.map((task) => `- [${task.status}] ${task.label} (${task.owner}) due ${task.dueAt}: ${task.action} Trigger: ${task.trigger}`),
    "",
    "## Verification brief",
    manifest.verificationBrief.headline,
    `- Machine manifest: ${manifest.verificationBrief.machineManifestHref}`,
    `- Markdown manifest: ${manifest.verificationBrief.markdownHref}`,
    `- Primary artifact: ${manifest.verificationBrief.primaryArtifactHref}`,
    `- Manifest digest: ${manifest.verificationBrief.digest}`,
    `- API verification: POST ${manifest.verification.verificationApiPath}`,
    `- Proof packet digest: ${manifest.verificationBrief.proofPacketDigest}`,
    `- Artifacts passed: ${manifest.verificationBrief.passedArtifacts}/${manifest.verificationBrief.totalArtifacts}`,
    ...manifest.verificationBrief.instructions.map((instruction) => `- ${instruction}`),
    "",
    "## Manifest API verification",
    `POST ${manifest.verification.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    manifest.verification.verificationRequestJson,
    "```",
    "",
    "## Artifacts",
    ...manifest.artifacts.map((artifact) => `- [${artifact.status}] ${artifact.label} (${artifact.owner}): ${artifact.href} Evidence: ${artifact.evidence}`),
    "",
    "## Receipts",
    ...manifest.receipts.map((receipt) => `- [${receipt.status}] ${receipt.id}: ${receipt.algorithm} ${receipt.digest}. ${receipt.evidence}`),
    "",
    "## Verification",
    manifest.verification.instruction
  ].join("\n");
}

function buildVerificationBrief(input: {
  artifacts: BuyerTrustManifestArtifact[];
  publicationGate: BuyerTrustManifestPublicationGate;
  links: BuyerTrustManifestLinks;
  digest: string;
  proofPacketDigest: string;
  buyerEvidenceBoardReceipt?: BuyerEvidenceBoardReceipt;
  commercialOffer?: CommercialOffer;
  buyerPilotContract?: BuyerPilotContract;
}): BuyerTrustManifestVerificationBrief {
  const machineManifestHref = input.links.wellKnownUrl ?? input.links.jsonUrl ?? input.links.appUrl ?? input.links.proofAuditUrl;
  const markdownHref = input.links.markdownUrl ?? input.links.wellKnownUrl ?? input.links.jsonUrl ?? input.links.proofAuditUrl;
  const primaryArtifactHref = input.publicationGate.firstActionHref || input.links.deliveryMemoUrl;
  const passedArtifacts = input.artifacts.filter((artifact) => artifact.status === "pass").length;
  const headline =
    input.publicationGate.decision === "publish"
      ? "External reviewers can verify the proof chain from the manifest"
      : input.publicationGate.decision === "repair"
        ? "External reviewers can verify the chain after the open watch item is closed"
        : "External reviewers should not rely on this chain until blockers are repaired";

  return {
    headline,
    machineManifestHref,
    markdownHref,
    primaryArtifactHref,
    digest: input.digest,
    proofPacketDigest: input.proofPacketDigest,
    passedArtifacts,
    totalArtifacts: input.artifacts.length,
    firstAction: input.publicationGate.firstAction,
    firstActionHref: input.publicationGate.firstActionHref,
    instructions: [
      `Open ${machineManifestHref} and read verification.payload.`,
      `Recompute fnv1a-64 over verification.payload and compare it with ${input.digest}.`,
      `Compare the buyer-proof-packet receipt digest with ${input.proofPacketDigest}.`,
      ...(input.buyerEvidenceBoardReceipt
        ? [`Verify the buyer-evidence-board checksum ${input.buyerEvidenceBoardReceipt.checksum} with POST ${BUYER_EVIDENCE_BOARD_RECEIPT_VERIFY_PATH}.`]
        : []),
      ...(input.commercialOffer
        ? [`Verify the commercial-offer checksum ${input.commercialOffer.receipt.checksum} with POST ${COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH}.`]
        : []),
      ...(input.buyerPilotContract
        ? [`Verify the buyer-pilot-contract checksum ${input.buyerPilotContract.receipt.checksum} with POST ${BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH}.`]
        : []),
      `Open ${primaryArtifactHref} first because it is the current publication gate action.`
    ]
  };
}

function seedPublicationWindow(generatedAt: string): BuyerTrustManifestPublicationWindow {
  return {
    status: "blocked",
    generatedAt,
    proofExpiresAt: addHoursIso(generatedAt, 24),
    manifestExpiresAt: addHoursIso(generatedAt, 24 * 7),
    buyerReviewDueAt: addHoursIso(generatedAt, 72),
    summary: "Publication window is computed after the publication gate is built.",
    firstRecheck: "Compute publication gate first.",
    firstRecheckHref: "",
    schedule: []
  };
}

export function buildBuyerTrustManifest(input: {
  issuer?: string;
  generatedAt?: string;
  proofPacket: BuyerProofPacket;
  sponsorReview: SponsorReviewRoom;
  sponsorDecisionReceipt: SponsorDecisionReceipt;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  buyerPilotContract?: BuyerPilotContract;
  decisionFollowUpLedger: BuyerDecisionFollowUpLedger;
  buyerEvidenceBoardReceipt?: BuyerEvidenceBoardReceipt;
  links: BuyerTrustManifestLinks;
}): BuyerTrustManifest {
  const artifacts = buildArtifacts(input);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const score = Math.round(
    clamp(
      average([
        input.proofPacket.packetScore,
        input.sponsorReview.reviewScore,
        input.adoptionPlan.planScore,
        input.trustCenter.trustScore,
        input.commercialOffer.offerScore,
        ...(input.buyerPilotContract ? [input.buyerPilotContract.contractScore] : []),
        statusScore(followUpStatus(input.decisionFollowUpLedger)),
        average(artifacts.map((artifact) => statusScore(artifact.status)))
      ])
    )
  );
  const provisionalReadiness = readinessFrom(artifacts, []);
  const payload = buildPayload({
    subject: input.proofPacket.targetBuyer,
    generatedAt,
    readiness: provisionalReadiness,
    score,
    proofPacket: input.proofPacket,
    buyerEvidenceBoardReceipt: input.buyerEvidenceBoardReceipt,
    sponsorDecisionReceipt: input.sponsorDecisionReceipt,
    adoptionPlan: input.adoptionPlan,
    trustCenter: input.trustCenter,
    commercialOffer: input.commercialOffer,
    buyerPilotContract: input.buyerPilotContract,
    artifacts,
    publicationWindow: seedPublicationWindow(generatedAt)
  });
  const receipts = buildReceipts({
    proofPacket: input.proofPacket,
    buyerEvidenceBoardReceipt: input.buyerEvidenceBoardReceipt,
    commercialOffer: input.commercialOffer,
    buyerPilotContract: input.buyerPilotContract,
    sponsorDecisionReceipt: input.sponsorDecisionReceipt,
    manifestPayload: payload
  });
  const readiness = readinessFrom(artifacts, receipts);
  const firstOpen = artifacts.find((artifact) => artifact.status === "block") ?? artifacts.find((artifact) => artifact.status === "watch");
  const provisionalReceipts = receipts.map((receipt) => (receipt.id === "buyer-trust-manifest" ? { ...receipt, digest: "pending" } : receipt));
  const publicationGate = buildPublicationGate({ artifacts, receipts: provisionalReceipts, links: input.links });
  const publicationWindow = buildPublicationWindow({
    generatedAt,
    proofPacket: input.proofPacket,
    sponsorDecisionReceipt: input.sponsorDecisionReceipt,
    publicationGate,
    links: input.links
  });
  const finalPayload = buildPayload({
    subject: input.proofPacket.targetBuyer,
    generatedAt,
    readiness,
    score,
    proofPacket: input.proofPacket,
    buyerEvidenceBoardReceipt: input.buyerEvidenceBoardReceipt,
    sponsorDecisionReceipt: input.sponsorDecisionReceipt,
    adoptionPlan: input.adoptionPlan,
    trustCenter: input.trustCenter,
    commercialOffer: input.commercialOffer,
    buyerPilotContract: input.buyerPilotContract,
    artifacts,
    publicationWindow
  });
  const digest = buyerTrustManifestReceiptDigest(finalPayload);
  const payloadJson = canonicalJson(finalPayload);
  const verificationRequestJson = canonicalJson({ digest, payload: finalPayload });
  const replayVerification = verifyBuyerTrustManifestReceipt({ digest, payload: finalPayload });
  const finalReceipts = receipts.map((receipt) => (receipt.id === "buyer-trust-manifest" ? { ...receipt, digest } : receipt));
  const verificationBrief = buildVerificationBrief({
    artifacts,
    publicationGate,
    links: input.links,
    digest,
    proofPacketDigest: input.proofPacket.receipt.digest,
    buyerEvidenceBoardReceipt: input.buyerEvidenceBoardReceipt,
    commercialOffer: input.commercialOffer,
    buyerPilotContract: input.buyerPilotContract
  });
  const independentReceiptChecks = [
    "the buyer-proof-packet receipt digest",
    input.buyerEvidenceBoardReceipt ? "the buyer-evidence-board checksum" : "",
    "the commercial-offer checksum",
    input.buyerPilotContract ? "the buyer-pilot-contract checksum" : ""
  ].filter(Boolean);
  const independentReceiptInstruction =
    independentReceiptChecks.length === 1
      ? independentReceiptChecks[0]
      : `${independentReceiptChecks.slice(0, -1).join(", ")} and ${independentReceiptChecks[independentReceiptChecks.length - 1]}`;
  const partial = {
    id: `buyer-trust-manifest-${readiness}-${score}-${digest.slice(0, 8)}`,
    manifestVersion: "buyer-trust-manifest.v1" as const,
    generatedAt,
    issuer: input.issuer ?? "A2A Agent Marketplace",
    subject: input.proofPacket.targetBuyer,
    readiness,
    score,
    headline: headlineFor(readiness),
    decision: decisionFor(readiness, firstOpen),
    proofPacketDigest: input.proofPacket.receipt.digest,
    sponsorDecisionStatus: input.sponsorDecisionReceipt.status,
    artifacts,
    receipts: finalReceipts,
    publicationGate,
    publicationWindow,
    verificationBrief,
    verification: {
      algorithm: "fnv1a-64" as const,
      digest,
      verificationApiPath: BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH as typeof BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
      payload: finalPayload,
      payloadJson,
      payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
      verificationRequestJson,
      verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
      replayVerification,
      instruction: `Recompute fnv1a-64 over verification.payload and compare it with verification.digest. Then verify ${independentReceiptInstruction} independently.`
    }
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

function tone(status: BuyerTrustManifestStatus | BuyerTrustManifestReadiness) {
  if (status === "pass" || status === "external-ready") return "good";
  if (status === "block" || status === "blocked") return "bad";
  return "watch";
}

export function renderBuyerTrustManifestHtml(
  manifest: BuyerTrustManifest,
  links: Pick<BuyerTrustManifestLinks, "jsonUrl" | "markdownUrl" | "wellKnownUrl" | "verifierUrl" | "appUrl"> = {}
) {
  const nav = [
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON manifest</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown manifest</a>` : "",
    links.wellKnownUrl ? `<a href="${escapeHtml(links.wellKnownUrl)}">Well-known JSON</a>` : "",
    links.verifierUrl ? `<a href="${escapeHtml(links.verifierUrl)}">Proof verifier</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = [
    { label: "Readiness", value: manifest.readiness, status: manifest.readiness },
    { label: "Manifest score", value: `${manifest.score}/100`, status: manifest.readiness },
    { label: "Proof digest", value: manifest.proofPacketDigest, status: "pass" },
    { label: "Sponsor decision", value: manifest.sponsorDecisionStatus, status: manifest.sponsorDecisionStatus === "signed" ? "pass" : manifest.sponsorDecisionStatus === "needs-evidence" ? "watch" : "block" },
    { label: "Artifacts", value: `${manifest.artifacts.filter((artifact) => artifact.status === "pass").length}/${manifest.artifacts.length}`, status: manifest.readiness }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status as BuyerTrustManifestStatus | BuyerTrustManifestReadiness)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const artifacts = manifest.artifacts
    .map(
      (artifact) => `
        <article class="artifact ${tone(artifact.status)}">
          <div><strong><a href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a></strong><span>${escapeHtml(artifact.status)}</span></div>
          <p>${escapeHtml(artifact.evidence)}</p>
          <small>${escapeHtml(artifact.owner)} / ${escapeHtml(artifact.verifier)}</small>
        </article>`
    )
    .join("");
  const receipts = manifest.receipts
    .map(
      (receipt) => `
        <article class="receipt ${tone(receipt.status)}">
          <div><strong>${escapeHtml(receipt.id)}</strong><span>${escapeHtml(receipt.status)}</span></div>
          <code>${escapeHtml(receipt.digest)}</code>
          <p>${escapeHtml(receipt.evidence)}</p>
          <small>${escapeHtml(receipt.verifier)}</small>
        </article>`
    )
    .join("");
  const gateChecks = manifest.publicationGate.checks
    .map(
      (check) => `
        <article class="gate-check ${tone(check.status)}">
          <div><strong><a href="${escapeHtml(check.href)}">${escapeHtml(check.label)}</a></strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.action)}</p>
          <small>${escapeHtml(check.kind)} / ${escapeHtml(check.owner)} / ${escapeHtml(check.verifier)}</small>
        </article>`
    )
    .join("");
  const reviewTasks = manifest.publicationWindow.schedule
    .map(
      (task) => `
        <article class="review-task ${tone(task.status)}">
          <div><strong><a href="${escapeHtml(task.href)}">${escapeHtml(task.label)}</a></strong><span>${escapeHtml(task.status)}</span></div>
          <p>${escapeHtml(task.action)}</p>
          <small>${escapeHtml(task.owner)} / due ${escapeHtml(task.dueAt)}</small>
          <small>${escapeHtml(task.trigger)}</small>
        </article>`
    )
    .join("");
  const verificationSteps = manifest.verificationBrief.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join("");
  const verificationStatusClass = manifest.verification.replayVerification.status === "verified" ? "good" : "bad";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(manifest.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #14201d; --muted: #52645f; --line: #cbd8d2; --paper: #f3f7f4; --panel: #fffdf7; --teal: #0f766e; --blue: #2457a6; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 20px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: end; }
      .eyebrow, .metric span, .artifact span, .receipt span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      .stamp { min-height: 206px; display: grid; place-items: center; align-content: center; gap: 8px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #14201d, #2457a6); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp code { width: min(100% - 28px, 290px); padding: 10px; border-radius: 8px; background: rgba(255,255,255,.12); color: #fffdf7; overflow-wrap: anywhere; }
      .stamp small { max-width: 260px; color: rgba(255, 253, 247, .76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .artifact-grid, .receipt-grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .artifact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .receipt-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .publication-gate { display: grid; grid-template-columns: minmax(0, .58fr) minmax(0, 1fr); gap: 12px; align-items: stretch; border-color: rgba(36, 87, 166, .36); background: linear-gradient(105deg, #fffdf7, #eef6ff); }
      .publication-window { display: grid; grid-template-columns: minmax(0, .44fr) minmax(0, 1fr); gap: 12px; align-items: start; border-color: rgba(15, 118, 110, .34); background: linear-gradient(105deg, #fffdf7, #f0f9f6); }
      .verification-brief { display: grid; grid-template-columns: minmax(220px, .38fr) minmax(0, 1fr); gap: 12px; border-color: rgba(15, 118, 110, .34); background: linear-gradient(105deg, #fffdf7, #edf8f1); }
      .verification-brief > * { min-width: 0; }
      .window-summary { min-width: 0; display: grid; align-content: start; gap: 8px; }
      .window-summary strong { font-size: 1.34rem; line-height: 1.08; overflow-wrap: anywhere; }
      .window-dates { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .window-dates span { min-width: 0; display: grid; gap: 2px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255, 253, 247, .74); color: var(--muted); font-size: .78rem; font-weight: 850; overflow-wrap: anywhere; }
      .window-dates b { color: var(--ink); font-size: .86rem; line-height: 1.2; overflow-wrap: anywhere; }
      .review-schedule { min-width: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .verification-summary { display: grid; align-content: start; gap: 8px; }
      .verification-summary strong { font-size: 1.34rem; line-height: 1.08; overflow-wrap: anywhere; }
      .verification-summary code { display: block; padding: 9px; border-radius: 8px; color: #fffdf7; background: #14201d; overflow-wrap: anywhere; }
      .verification-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .verification-links a { min-width: 0; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 7px 10px; color: var(--ink); background: var(--panel); font-weight: 850; text-align: center; text-decoration: none; overflow-wrap: anywhere; }
      .verification-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .verification-actions a, .verification-actions button { border: 1px solid var(--line); border-radius: 999px; padding: 7px 10px; color: var(--teal); background: var(--panel); font: inherit; font-weight: 850; text-decoration: none; }
      .verification-actions button { cursor: pointer; }
      .verification-actions button:disabled { cursor: default; opacity: .72; }
      .verification-status { display: block; color: var(--muted); font-weight: 850; overflow-wrap: anywhere; }
      .verification-status.good { color: var(--teal); }
      .verification-status.bad { color: #a82135; }
      .verification-steps { min-width: 0; margin: 0; padding-left: 20px; color: var(--muted); }
      .verification-steps li { overflow-wrap: anywhere; }
      .verification-steps li + li { margin-top: 7px; }
      .gate-summary { display: grid; align-content: start; gap: 8px; }
      .gate-summary strong { font-size: 1.42rem; line-height: 1.08; overflow-wrap: anywhere; }
      .gate-score { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .gate-score span { display: grid; gap: 2px; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255, 253, 247, .74); color: var(--muted); font-size: .8rem; font-weight: 850; }
      .gate-score b { color: var(--ink); font-size: 1.15rem; }
      .gate-checks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .panel, .metric, .artifact, .receipt, .gate-check, .review-task { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(20, 32, 29, .07); }
      .panel, .metric, .artifact, .receipt, .gate-check, .review-task { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.16rem; line-height: 1.12; overflow-wrap: anywhere; }
      .artifact, .receipt, .gate-check, .review-task { display: grid; gap: 8px; }
      .artifact div, .receipt div, .gate-check div, .review-task div { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .artifact a, .gate-check a, .review-task a { text-decoration: none; }
      .receipt code { display: block; padding: 9px; border-radius: 8px; background: #14201d; color: #fffdf7; overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .artifact strong, .artifact p, .artifact small, .receipt strong, .receipt p, .receipt small, .gate-check strong, .gate-check p, .gate-check small, .review-task strong, .review-task p, .review-task small, .panel p { overflow-wrap: anywhere; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, main, footer { width: min(100% - 24px, 640px); } .hero, .metrics, .artifact-grid, .receipt-grid, .publication-gate, .publication-window, .verification-brief, .verification-links, .gate-checks, .gate-score, .window-dates, .review-schedule { grid-template-columns: 1fr; } .stamp { min-height: 142px; } .artifact div, .receipt div, .gate-check div, .review-task div { flex-direction: column; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Trust Manifest</span>
          <h1>${escapeHtml(manifest.headline)}</h1>
          <p>${escapeHtml(manifest.decision)}</p>
          <nav>${nav}</nav>
        </div>
        <aside class="stamp">
          <span>Manifest digest</span>
          <code>${escapeHtml(manifest.verification.digest)}</code>
          <small>${escapeHtml(manifest.subject)} / ${escapeHtml(manifest.generatedAt)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="metrics">${metrics}</section>
      <section class="panel publication-gate" aria-label="Publication gate">
        <div class="gate-summary">
          <span class="eyebrow">Publication gate</span>
          <strong>${escapeHtml(manifest.publicationGate.headline)}</strong>
          <p>${escapeHtml(manifest.publicationGate.firstAction)}</p>
          <nav><a href="${escapeHtml(manifest.publicationGate.firstActionHref)}">Open first action</a></nav>
          <div class="gate-score">
            <span><b>${escapeHtml(manifest.publicationGate.score)}</b> score</span>
            <span><b>${escapeHtml(`${manifest.publicationGate.passedCount}/${manifest.publicationGate.totalCount}`)}</b> passed</span>
            <span><b>${escapeHtml(`${manifest.publicationGate.blockedCount}/${manifest.publicationGate.watchCount}`)}</b> block/watch</span>
          </div>
        </div>
        <div class="gate-checks">${gateChecks}</div>
      </section>
      <section class="panel publication-window" aria-label="Publication window">
        <div class="window-summary">
          <span class="eyebrow">Publication window</span>
          <strong>${escapeHtml(manifest.publicationWindow.status)}</strong>
          <p>${escapeHtml(manifest.publicationWindow.summary)}</p>
          <nav><a href="${escapeHtml(manifest.publicationWindow.firstRecheckHref)}">Open first recheck</a></nav>
          <div class="window-dates">
            <span><b>${escapeHtml(manifest.publicationWindow.proofExpiresAt)}</b> proof expiry</span>
            <span><b>${escapeHtml(manifest.publicationWindow.buyerReviewDueAt)}</b> buyer checkpoint</span>
            <span><b>${escapeHtml(manifest.publicationWindow.manifestExpiresAt)}</b> manifest expiry</span>
          </div>
        </div>
        <div>
          <h2>Recheck schedule</h2>
          <div class="review-schedule">${reviewTasks}</div>
        </div>
      </section>
      <section class="panel verification-brief" aria-label="Verification brief">
        <div class="verification-summary">
          <span class="eyebrow">Verification brief</span>
          <strong>${escapeHtml(manifest.verificationBrief.headline)}</strong>
          <p>${escapeHtml(manifest.verificationBrief.passedArtifacts)} of ${escapeHtml(manifest.verificationBrief.totalArtifacts)} artifacts currently pass. First action: ${escapeHtml(manifest.verificationBrief.firstAction)}</p>
          <code>${escapeHtml(manifest.verificationBrief.digest)}</code>
          <div class="verification-links">
            <a href="${escapeHtml(manifest.verificationBrief.machineManifestHref)}">Machine manifest</a>
            <a href="${escapeHtml(manifest.verificationBrief.markdownHref)}">Markdown</a>
            <a href="${escapeHtml(manifest.verificationBrief.primaryArtifactHref)}">Primary artifact</a>
          </div>
          <div class="verification-actions">
            <button type="button" data-verify-manifest data-verify-api="${escapeHtml(manifest.verification.verificationApiPath)}">Verify manifest</button>
            <a href="${escapeHtml(manifest.verification.payloadHref)}" download="buyer-trust-manifest-payload.json">Download payload</a>
            <a href="${escapeHtml(manifest.verification.verificationRequestHref)}" download="buyer-trust-manifest-verify-request.json">Download verify request</a>
          </div>
          <small class="verification-status ${verificationStatusClass}" data-manifest-verification-status>Replay ${escapeHtml(manifest.verification.replayVerification.status)} for this exported manifest.</small>
        </div>
        <ol class="verification-steps">${verificationSteps}</ol>
      </section>
      <section class="panel">
        <h2>External artifact index</h2>
        <p>Each link is a buyer-facing artifact with status, owner, evidence, and verifier so reviewers can inspect the proof chain without private context.</p>
      </section>
      <section class="artifact-grid">${artifacts}</section>
      <section class="panel">
        <h2>Receipts</h2>
        <p>${escapeHtml(manifest.verification.instruction)}</p>
      </section>
      <section class="receipt-grid">${receipts}</section>
    </main>
    <footer>Generated by A2A Agent Marketplace as a machine-readable buyer proof index.</footer>
    <script type="application/json" id="buyer-trust-manifest-verify-request">${escapeScriptJson(manifest.verification.verificationRequestJson)}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-verify-manifest]");
        const status = document.querySelector("[data-manifest-verification-status]");
        const requestNode = document.getElementById("buyer-trust-manifest-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Checking manifest";
          status.className = "verification-status";
          status.textContent = "Checking manifest digest...";
          try {
            const response = await fetch(button.getAttribute("data-verify-api") || "/api/buyer-trust-manifest/receipt/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json();
            if (response.ok && result && result.verification && result.verification.status === "verified") {
              button.textContent = "Manifest verified";
              status.className = "verification-status good";
              status.textContent = "Digest " + result.verification.actualDigest + " matches this manifest.";
              return;
            }
            button.disabled = false;
            button.textContent = "Verify manifest";
            status.className = "verification-status bad";
            status.textContent = (result && result.verification && result.verification.instruction) || result.error || "Manifest verification failed.";
          } catch {
            button.disabled = false;
            button.textContent = "Verify manifest";
            status.className = "verification-status bad";
            status.textContent = "Manifest verification could not reach the verification API.";
          }
        });
      })();
    </script>
  </body>
</html>`;
}
