import type { AdoptionOperatingPlan } from "./adoptionOperatingPlan.js";
import type { BuyerTrustCenter } from "./buyerTrustCenter.js";
import type { BuyerValueReport } from "./buyerValueReport.js";
import type { BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { CommercialOffer } from "./commercialOffer.js";
import type { PilotAgreement } from "./pilotAgreement.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";

export type BuyerPilotContractReadiness = "contract-ready" | "needs-redlines" | "blocked";
export type BuyerPilotContractDecision = "approve-contained-pilot" | "owner-redline" | "hold-internal";

export type BuyerPilotContractMilestoneId =
  | "value-proof"
  | "commercial-boundary"
  | "agreement-signature"
  | "measured-acceptance"
  | "trust-boundary"
  | "operating-owner";

export type BuyerPilotContractMilestone = {
  id: BuyerPilotContractMilestoneId;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  promise: string;
  proof: string;
  requiredBefore: string;
  href: string;
};

export type BuyerPilotContractCloseDecision = {
  id: "scope" | "price" | "proof" | "trust" | "renewal";
  label: string;
  status: BuyerValueScenarioStatus;
  buyerDecision: string;
  evidence: string;
  owner: string;
  href: string;
};

export type BuyerPilotContractAttachment = {
  id: "value-report" | "commercial-offer" | "pilot-agreement" | "adoption-plan" | "trust-center" | "launch-room";
  label: string;
  status: BuyerValueScenarioStatus;
  href: string;
  evidence: string;
};

export type BuyerPilotContractApprovalMemo = {
  decision: BuyerPilotContractDecision;
  score: number;
  signer: string;
  headline: string;
  sendLine: string;
  validUntilDays: number;
  redlineCount: number;
};

export const BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH = "/api/buyer-pilot-contract/receipt/verify";
export const BUYER_PILOT_CONTRACT_RECEIPT_OMITTED_QUERY_VALUE = "[omitted-from-receipt-payload]";

export type BuyerPilotContractReceiptPayload = {
  receiptVersion: "buyer-pilot-contract.v1";
  contractId: string;
  readiness: BuyerPilotContractReadiness;
  contractScore: number;
  approvalDecision: BuyerPilotContractDecision;
  buyer: string;
  pilotOffer: string;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  paybackDays: number;
  valueCoveragePercent: number;
  approvalSigner: string;
  commercialOfferReceiptChecksum: string;
  milestones: Array<Pick<BuyerPilotContractMilestone, "id" | "label" | "status" | "owner" | "promise" | "proof" | "requiredBefore">>;
  closeDecisions: Array<Pick<BuyerPilotContractCloseDecision, "id" | "label" | "status" | "buyerDecision" | "evidence" | "owner">>;
  stopRules: string[];
  attachments: Array<Pick<BuyerPilotContractAttachment, "id" | "label" | "status" | "href" | "evidence">>;
};

export type BuyerPilotContractReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerPilotContractReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH;
  payload: BuyerPilotContractReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerPilotContractReceiptVerification;
  copyText: string;
  href: string;
};

export type BuyerPilotContract = {
  id: string;
  readiness: BuyerPilotContractReadiness;
  contractScore: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  pilotOffer: string;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  valueCoveragePercent: number;
  paybackDays: number;
  approvalMemo: BuyerPilotContractApprovalMemo;
  milestones: BuyerPilotContractMilestone[];
  closeDecisions: BuyerPilotContractCloseDecision[];
  attachments: BuyerPilotContractAttachment[];
  stopRules: string[];
  buyerQuestions: Array<{
    question: string;
    answer: string;
    evidence: string;
  }>;
  receipt: BuyerPilotContractReceipt;
  exportMarkdown: string;
};

export type BuyerPilotContractLinks = {
  valueReportUrl?: string;
  commercialOfferUrl?: string;
  agreementUrl?: string;
  adoptionPlanUrl?: string;
  trustCenterUrl?: string;
  launchRoomUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
  appUrl?: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function statusFrom(condition: boolean, watchCondition = false): BuyerValueScenarioStatus {
  if (condition) return "clear";
  if (watchCondition) return "watch";
  return "blocked";
}

function statusFromValueReport(report: BuyerValueReport): BuyerValueScenarioStatus {
  if (report.readiness === "board-ready" && report.evidence.mode === "measured-supported") return "clear";
  if (report.readiness !== "do-not-pitch" && report.evidence.mode !== "measurement-needed") return "watch";
  return "blocked";
}

function statusFromCommercialOffer(offer: CommercialOffer): BuyerValueScenarioStatus {
  if (offer.approvalMemo.decision === "approve" && offer.readiness === "offer-ready") return "clear";
  if (offer.approvalMemo.decision === "redline" || offer.readiness === "needs-redlines") return "watch";
  return "blocked";
}

function statusFromAgreement(agreement: PilotAgreement): BuyerValueScenarioStatus {
  if (agreement.readiness === "ready-to-sign") return "clear";
  if (agreement.readiness === "needs-redlines") return "watch";
  return "blocked";
}

function statusFromPilotReceipt(receipt: PilotRunReceipt): BuyerValueScenarioStatus {
  if (receipt.readiness === "accepted") return "clear";
  if (receipt.readiness === "needs-evidence") return "watch";
  return "blocked";
}

function statusFromTrustCenter(trustCenter: BuyerTrustCenter): BuyerValueScenarioStatus {
  if (trustCenter.readiness === "trust-ready") return "clear";
  if (trustCenter.readiness === "needs-review") return "watch";
  return "blocked";
}

function statusFromAdoptionPlan(adoptionPlan: AdoptionOperatingPlan): BuyerValueScenarioStatus {
  if (adoptionPlan.readiness === "ready-to-operate") return "clear";
  if (adoptionPlan.readiness === "needs-owner-commitment") return "watch";
  return "blocked";
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

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
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

function receiptPayloadHref(href: string) {
  if (!href.includes("?") || href.length <= 1400) return href;

  try {
    const parsed = new URL(href, "https://receipt.local");
    parsed.search = new URLSearchParams({ context: BUYER_PILOT_CONTRACT_RECEIPT_OMITTED_QUERY_VALUE }).toString();
    return href.startsWith("http") ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return href.slice(0, 1000);
  }
}

function tone(status: string) {
  if (["contract-ready", "approve-contained-pilot", "clear"].includes(status)) return "good";
  if (["blocked", "hold-internal"].includes(status)) return "bad";
  return "watch";
}

function readinessFrom(input: { score: number; milestones: BuyerPilotContractMilestone[]; approvalDecision: BuyerPilotContractDecision }): BuyerPilotContractReadiness {
  if (input.approvalDecision === "hold-internal" || input.milestones.some((milestone) => milestone.status === "blocked")) return "blocked";
  if (input.approvalDecision === "approve-contained-pilot" && input.score >= 82 && input.milestones.every((milestone) => milestone.status === "clear")) return "contract-ready";
  return "needs-redlines";
}

function decisionFrom(input: { score: number; milestones: BuyerPilotContractMilestone[]; commercialOffer: CommercialOffer }) {
  if (input.commercialOffer.approvalMemo.decision === "hold" || input.milestones.some((milestone) => milestone.status === "blocked")) return "hold-internal";
  if (input.score >= 82 && input.commercialOffer.approvalMemo.decision === "approve" && input.milestones.every((milestone) => milestone.status === "clear")) {
    return "approve-contained-pilot";
  }
  return "owner-redline";
}

function headlineFor(readiness: BuyerPilotContractReadiness) {
  if (readiness === "contract-ready") return "The buyer pilot contract is ready for external approval";
  if (readiness === "needs-redlines") return "The buyer pilot contract needs owner redlines";
  return "Do not send this pilot contract to the buyer yet";
}

function hardTruthFor(readiness: BuyerPilotContractReadiness, openCount: number) {
  if (readiness === "contract-ready") {
    return "The buyer can inspect scope, first commitment, measured proof, trust boundary, owner path, renewal gate, and receipt verification before approving the pilot.";
  }
  if (readiness === "needs-redlines") {
    return `${openCount} contract condition${openCount === 1 ? "" : "s"} need owner confirmation before this can leave the workspace.`;
  }
  return `${openCount} blocked contract condition${openCount === 1 ? "" : "s"} would make the buyer approve an unproven pilot. Keep this internal until the blockers close.`;
}

function approvalHeadlineFor(decision: BuyerPilotContractDecision) {
  if (decision === "approve-contained-pilot") return "Approve a contained buyer pilot";
  if (decision === "owner-redline") return "Redline before buyer approval";
  return "Hold the pilot contract internally";
}

function approvalSendLineFor(decision: BuyerPilotContractDecision, offer: CommercialOffer, redlineCount: number) {
  if (decision === "approve-contained-pilot") return `Approve ${offer.contractAsk} with expansion tied to measured value, trust controls, and day-30 renewal criteria.`;
  if (decision === "owner-redline") return `Keep the contract in owner review until ${redlineCount} open condition${redlineCount === 1 ? "" : "s"} are clear.`;
  return "Do not send the buyer a contract until blocked value, proof, trust, commercial, or operating evidence is repaired.";
}

function buildMilestones(input: {
  valueReport: BuyerValueReport;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  links: BuyerPilotContractLinks;
}): BuyerPilotContractMilestone[] {
  const budgetCondition = input.commercialOffer.approvalMemo.conditions.find((condition) => condition.id === "budget-cap");
  const proofCondition = input.commercialOffer.approvalMemo.conditions.find((condition) => condition.id === "measured-acceptance");
  const trustCondition = input.commercialOffer.approvalMemo.conditions.find((condition) => condition.id === "trust-boundary");
  const operatingCondition = input.commercialOffer.approvalMemo.conditions.find((condition) => condition.id === "operating-owner");
  const commercialPaybackDays = commercialOfferPaybackDays(input.commercialOffer);
  return [
    {
      id: "value-proof",
      label: "Value proof",
      status: statusFromValueReport(input.valueReport),
      owner: input.valueReport.commitment.decisionOwner,
      promise: input.valueReport.commitment.askInstruction,
      proof: `${yen(input.valueReport.buyerScenario.monthlyGrossValueYen)} modeled monthly value; ${input.valueReport.evidence.supportRatioPercent}% measured support.`,
      requiredBefore: "commercial approval",
      href: input.links.valueReportUrl ?? "#buyer-value-simulator"
    },
    {
      id: "commercial-boundary",
      label: "Commercial boundary",
      status: budgetCondition?.status ?? statusFromCommercialOffer(input.commercialOffer),
      owner: budgetCondition?.owner ?? input.commercialOffer.approvalMemo.signer,
      promise: input.commercialOffer.contractAsk,
      proof: budgetCondition?.evidence ?? `${yen(input.commercialOffer.totalFirstCommitmentYen)} first commitment; ${commercialPaybackDays} day payback.`,
      requiredBefore: "buyer signature",
      href: input.links.commercialOfferUrl ?? "#commercial-offer"
    },
    {
      id: "agreement-signature",
      label: "Agreement signature",
      status: statusFromAgreement(input.agreement),
      owner: input.agreement.signatures[0]?.name ?? input.agreement.buyer,
      promise: input.agreement.scopeTitle,
      proof: `${input.agreement.agreementScore}/100 agreement score; ${input.agreement.terms.filter((term) => term.status !== "clear").length} open terms.`,
      requiredBefore: "pilot kickoff",
      href: input.links.agreementUrl ?? "#pilot-agreement"
    },
    {
      id: "measured-acceptance",
      label: "Measured acceptance",
      status: proofCondition?.status ?? statusFromPilotReceipt(input.pilotReceipt),
      owner: input.pilotReceipt.reviewerName || proofCondition?.owner || "Pilot reviewer",
      promise: "Measured run must show accepted tasks and a buyer-openable proof URL.",
      proof: proofCondition?.evidence ?? `${input.pilotReceipt.actualMinutesSavedPerRun}m saved/run; ${input.pilotReceipt.acceptanceRatePercent}% accepted.`,
      requiredBefore: "buyer case citation",
      href: input.links.valueReportUrl ?? "#pilot-run-receipt"
    },
    {
      id: "trust-boundary",
      label: "Trust boundary",
      status: trustCondition?.status ?? statusFromTrustCenter(input.trustCenter),
      owner: trustCondition?.owner ?? input.trustCenter.controls.find((control) => control.id === "security-owner")?.owner ?? "Security reviewer",
      promise: input.trustCenter.dataBoundary,
      proof: trustCondition?.evidence ?? `${input.trustCenter.trustScore}/100 trust score; ${input.trustCenter.risks.length} risk items.`,
      requiredBefore: "external buyer review",
      href: input.links.trustCenterUrl ?? "#buyer-trust-center"
    },
    {
      id: "operating-owner",
      label: "Operating owner",
      status: operatingCondition?.status ?? statusFromAdoptionPlan(input.adoptionPlan),
      owner: operatingCondition?.owner ?? input.adoptionPlan.ownerCommitments[0]?.owner ?? input.adoptionPlan.buyer,
      promise: input.adoptionPlan.operatingMetric,
      proof: operatingCondition?.evidence ?? `${input.adoptionPlan.planScore}/100 adoption plan score; ${input.adoptionPlan.ownerCommitments.length} owner commitments.`,
      requiredBefore: "team rollout",
      href: input.links.adoptionPlanUrl ?? "#adoption-operating-plan"
    }
  ];
}

function buildCloseDecisions(input: {
  valueReport: BuyerValueReport;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  links: BuyerPilotContractLinks;
}): BuyerPilotContractCloseDecision[] {
  return [
    {
      id: "scope",
      label: "Buyer scope",
      status: statusFromAgreement(input.agreement),
      buyerDecision: `Approve only "${input.agreement.scopeTitle}" during ${input.agreement.effectiveWindow}.`,
      evidence: input.agreement.decisionSource,
      owner: input.agreement.signatures[0]?.name ?? input.agreement.buyer,
      href: input.links.agreementUrl ?? "#pilot-agreement"
    },
    {
      id: "price",
      label: "First commitment",
      status: statusFromCommercialOffer(input.commercialOffer),
      buyerDecision:
        input.commercialOffer.totalFirstCommitmentYen > 0
          ? `Approve ${yen(input.commercialOffer.totalFirstCommitmentYen)} for ${input.commercialOffer.recommendedTierId}; expansion waits for measured proof.`
          : "Hold pricing until proof, trust, and operating blockers close.",
      evidence: `${yen(input.commercialOffer.expectedMonthlyValueYen)} expected monthly value; break-even adoption ${input.commercialOffer.breakEvenAdoptionRatePercent}%.`,
      owner: input.commercialOffer.approvalMemo.signer,
      href: input.links.commercialOfferUrl ?? "#commercial-offer"
    },
    {
      id: "proof",
      label: "Proof acceptance",
      status: statusFromPilotReceipt(input.pilotReceipt),
      buyerDecision: "Accept the pilot only when measured minutes saved, task acceptance, reviewer, and public receipt are attached.",
      evidence: `${input.pilotReceipt.actualMinutesSavedPerRun}m saved/run, ${input.pilotReceipt.acceptanceRatePercent}% accepted, receipt ${input.pilotReceipt.evidenceUrl || "missing"}.`,
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      href: input.links.valueReportUrl ?? "#pilot-run-receipt"
    },
    {
      id: "trust",
      label: "Trust boundary",
      status: statusFromTrustCenter(input.trustCenter),
      buyerDecision: input.trustCenter.dataBoundary,
      evidence: input.trustCenter.hardTruth,
      owner: input.trustCenter.controls.find((control) => control.id === "security-owner")?.owner ?? "Security reviewer",
      href: input.links.trustCenterUrl ?? "#buyer-trust-center"
    },
    {
      id: "renewal",
      label: "Day-30 renewal",
      status: statusFromAdoptionPlan(input.adoptionPlan),
      buyerDecision: input.adoptionPlan.expansionCriteria[0] ?? "Renew only when value, trust, and owner commitments remain healthy.",
      evidence: input.adoptionPlan.successLedger.renewalAsk,
      owner: input.adoptionPlan.ownerCommitments[0]?.owner ?? input.adoptionPlan.buyer,
      href: input.links.adoptionPlanUrl ?? "#adoption-operating-plan"
    }
  ];
}

function buildAttachments(input: {
  valueReport: BuyerValueReport;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  links: BuyerPilotContractLinks;
}): BuyerPilotContractAttachment[] {
  return [
    {
      id: "value-report",
      label: "Buyer value report",
      status: statusFromValueReport(input.valueReport),
      href: input.links.valueReportUrl ?? "#buyer-value-simulator",
      evidence: input.valueReport.hardTruth
    },
    {
      id: "commercial-offer",
      label: "Commercial offer",
      status: statusFromCommercialOffer(input.commercialOffer),
      href: input.links.commercialOfferUrl ?? "#commercial-offer",
      evidence: input.commercialOffer.approvalMemo.sendLine
    },
    {
      id: "pilot-agreement",
      label: "Pilot agreement",
      status: statusFromAgreement(input.agreement),
      href: input.links.agreementUrl ?? "#pilot-agreement",
      evidence: input.agreement.hardTruth
    },
    {
      id: "adoption-plan",
      label: "Adoption plan",
      status: statusFromAdoptionPlan(input.adoptionPlan),
      href: input.links.adoptionPlanUrl ?? "#adoption-operating-plan",
      evidence: input.adoptionPlan.hardTruth
    },
    {
      id: "trust-center",
      label: "Trust center",
      status: statusFromTrustCenter(input.trustCenter),
      href: input.links.trustCenterUrl ?? "#buyer-trust-center",
      evidence: input.trustCenter.hardTruth
    },
    {
      id: "launch-room",
      label: "Launch room",
      status: statusFrom(statusFromCommercialOffer(input.commercialOffer) !== "blocked" && statusFromTrustCenter(input.trustCenter) !== "blocked", true),
      href: input.links.launchRoomUrl ?? "#buyer-pilot-command",
      evidence: "One room should carry value, proof, agreement, trust, operations, and commercial decision evidence."
    }
  ];
}

function buildStopRules(input: { commercialOffer: CommercialOffer; agreement: PilotAgreement; adoptionPlan: AdoptionOperatingPlan; trustCenter: BuyerTrustCenter; pilotReceipt: PilotRunReceipt }) {
  const renewal = input.commercialOffer.renewalCriteria.slice(0, 2);
  return [
    ...input.agreement.stopRules.slice(0, 2),
    ...renewal,
    `Stop if trust center readiness is blocked; current readiness is ${input.trustCenter.readiness}.`,
    `Stop if task acceptance falls below 70%; current receipt is ${input.pilotReceipt.acceptanceRatePercent}%.`,
    input.adoptionPlan.expansionCriteria[0] ?? "Stop expansion when the day-30 owner cannot confirm value, trust, and operating health."
  ].slice(0, 6);
}

function commercialOfferPaybackDays(offer: CommercialOffer) {
  return offer.valueStressCases[0]?.paybackDays ?? offer.tiers.find((tier) => tier.id === offer.recommendedTierId)?.paybackDays ?? 999;
}

function buildBuyerQuestions(input: { commercialOffer: CommercialOffer; valueReport: BuyerValueReport; trustCenter: BuyerTrustCenter; adoptionPlan: AdoptionOperatingPlan }) {
  return [
    {
      question: "What am I approving first?",
      answer: input.commercialOffer.contractAsk,
      evidence: input.valueReport.commitment.hardTruth
    },
    {
      question: "Why is the first commitment defensible?",
      answer: `${yen(input.commercialOffer.totalFirstCommitmentYen)} is compared with ${yen(input.commercialOffer.expectedMonthlyValueYen)} expected monthly value and ${commercialOfferPaybackDays(input.commercialOffer)}-day payback.`,
      evidence: input.commercialOffer.valueStressCases[0]?.buyerDecision ?? input.commercialOffer.approvalMemo.summary
    },
    {
      question: "What prevents an unsafe rollout?",
      answer: "Expansion is gated by measured acceptance, trust boundary, owner commitment, and renewal criteria.",
      evidence: `${input.trustCenter.dataBoundary}; ${input.adoptionPlan.successLedger.renewalAsk}`
    }
  ];
}

function buildReceiptMarkdown(receipt: Omit<BuyerPilotContractReceipt, "copyText" | "href">) {
  return [
    "# Buyer pilot contract receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Buyer: ${receipt.payload.buyer}`,
    `Readiness: ${receipt.payload.readiness}`,
    `Decision: ${receipt.payload.approvalDecision}`,
    `Contract score: ${receipt.payload.contractScore}/100`,
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the buyer pilot contract replay payload before accepting a forwarded pilot contract."
  ].join("\n");
}

export function verifyBuyerPilotContractReceipt(receipt: Pick<BuyerPilotContractReceipt, "checksum" | "payload">): BuyerPilotContractReceiptVerification {
  const expectedChecksum = receipt.checksum.toLowerCase();
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Buyer pilot contract receipt checksum matches the attached replay payload."
      : "Buyer pilot contract receipt checksum does not match the attached replay payload. Do not rely on this forwarded contract until it is regenerated."
  };
}

type ReceiptlessContract = Omit<BuyerPilotContract, "receipt" | "exportMarkdown"> & {
  receiptlessCommercialOfferChecksum: string;
};

function buildReceipt(contract: ReceiptlessContract): BuyerPilotContractReceipt {
  const payload: BuyerPilotContractReceiptPayload = {
    receiptVersion: "buyer-pilot-contract.v1",
    contractId: contract.id,
    readiness: contract.readiness,
    contractScore: contract.contractScore,
    approvalDecision: contract.approvalMemo.decision,
    buyer: contract.buyer,
    pilotOffer: contract.pilotOffer,
    firstCommitmentYen: contract.firstCommitmentYen,
    expectedMonthlyValueYen: contract.expectedMonthlyValueYen,
    paybackDays: contract.paybackDays,
    valueCoveragePercent: contract.valueCoveragePercent,
    approvalSigner: contract.approvalMemo.signer,
    commercialOfferReceiptChecksum: contract.receiptlessCommercialOfferChecksum,
    milestones: contract.milestones.map((milestone) => ({
      id: milestone.id,
      label: milestone.label,
      status: milestone.status,
      owner: milestone.owner,
      promise: milestone.promise,
      proof: milestone.proof,
      requiredBefore: milestone.requiredBefore
    })),
    closeDecisions: contract.closeDecisions.map((decision) => ({
      id: decision.id,
      label: decision.label,
      status: decision.status,
      buyerDecision: decision.buyerDecision,
      evidence: decision.evidence,
      owner: decision.owner
    })),
    stopRules: contract.stopRules,
    attachments: contract.attachments.map((attachment) => ({
      ...attachment,
      href: receiptPayloadHref(attachment.href)
    }))
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerPilotContractReceipt({ checksum, payload });
  const partial: Omit<BuyerPilotContractReceipt, "copyText" | "href"> = {
    receiptId: `buyer-pilot-contract-${contract.readiness}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_PILOT_CONTRACT_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

function buildMarkdown(contract: Omit<BuyerPilotContract, "exportMarkdown">) {
  return [
    `# ${contract.headline}`,
    "",
    "Buyer Pilot Contract",
    "",
    `Readiness: ${contract.readiness}`,
    `Contract score: ${contract.contractScore}/100`,
    `Decision: ${contract.approvalMemo.decision}`,
    `Buyer: ${contract.buyer}`,
    `Pilot offer: ${contract.pilotOffer}`,
    `First commitment: ${yen(contract.firstCommitmentYen)}`,
    `Expected monthly value: ${yen(contract.expectedMonthlyValueYen)}`,
    `Value coverage: ${contract.valueCoveragePercent}%`,
    `Payback: ${contract.paybackDays} days`,
    `Receipt: ${contract.receipt.receiptId}`,
    `Receipt checksum: ${contract.receipt.checksumAlgorithm}:${contract.receipt.checksum}`,
    "",
    contract.hardTruth,
    "",
    "## Approval memo",
    `Signer: ${contract.approvalMemo.signer}`,
    `Valid for: ${contract.approvalMemo.validUntilDays} days`,
    contract.approvalMemo.headline,
    contract.approvalMemo.sendLine,
    "",
    "## Contract milestones",
    ...contract.milestones.map(
      (milestone) =>
        `- [${milestone.status}] ${milestone.label} (${milestone.owner}): ${milestone.promise} Proof: ${milestone.proof} Required before ${milestone.requiredBefore}.`
    ),
    "",
    "## Buyer close decisions",
    ...contract.closeDecisions.map((decision) => `- [${decision.status}] ${decision.label} (${decision.owner}): ${decision.buyerDecision} Evidence: ${decision.evidence}`),
    "",
    "## Attachments",
    ...contract.attachments.map((attachment) => `- [${attachment.status}] ${attachment.label}: ${attachment.href}. ${attachment.evidence}`),
    "",
    "## Stop rules",
    ...contract.stopRules.map((rule) => `- ${rule}`),
    "",
    "## Buyer questions",
    ...contract.buyerQuestions.map((question) => `- ${question.question} ${question.answer} Evidence: ${question.evidence}`)
  ].join("\n");
}

export function buildBuyerPilotContract(input: {
  valueReport: BuyerValueReport;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  commercialOffer: CommercialOffer;
  links?: BuyerPilotContractLinks;
}): BuyerPilotContract {
  const links = input.links ?? {};
  const milestones = buildMilestones({ ...input, links });
  const milestoneScore = average(milestones.map((milestone) => statusScore(milestone.status)));
  const contractScore = Math.round(
    clamp(
      average([
        input.valueReport.buyerScenario.scenarioScore,
        input.valueReport.evidence.supportRatioPercent,
        input.pilotReceipt.receiptScore,
        input.agreement.agreementScore,
        input.adoptionPlan.planScore,
        input.trustCenter.trustScore,
        input.commercialOffer.offerScore,
        input.commercialOffer.approvalMemo.score,
        milestoneScore
      ])
    )
  );
  const decision = decisionFrom({ score: contractScore, milestones, commercialOffer: input.commercialOffer });
  const readiness = readinessFrom({ score: contractScore, milestones, approvalDecision: decision });
  const closeDecisions = buildCloseDecisions({ ...input, links });
  const attachments = buildAttachments({ ...input, links });
  const stopRules = buildStopRules(input);
  const redlineCount = milestones.filter((milestone) => milestone.status !== "clear").length + closeDecisions.filter((decisionItem) => decisionItem.status !== "clear").length;
  const approvalMemo: BuyerPilotContractApprovalMemo = {
    decision,
    score: contractScore,
    signer: input.commercialOffer.approvalMemo.signer,
    headline: approvalHeadlineFor(decision),
    sendLine: approvalSendLineFor(decision, input.commercialOffer, redlineCount),
    validUntilDays: decision === "approve-contained-pilot" ? 14 : 7,
    redlineCount
  };
  const valueCoveragePercent =
    input.commercialOffer.totalFirstCommitmentYen > 0
      ? Math.round((input.commercialOffer.expectedMonthlyValueYen / Math.max(1, input.commercialOffer.totalFirstCommitmentYen)) * 100)
      : 0;
  const partial: ReceiptlessContract = {
    id: `buyer-pilot-contract-${readiness}-${contractScore}`,
    readiness,
    contractScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, redlineCount),
    buyer: input.commercialOffer.buyer,
    pilotOffer: input.commercialOffer.recommendedTierId,
    firstCommitmentYen: input.commercialOffer.totalFirstCommitmentYen,
    expectedMonthlyValueYen: input.commercialOffer.expectedMonthlyValueYen,
    valueCoveragePercent,
    paybackDays: commercialOfferPaybackDays(input.commercialOffer),
    approvalMemo,
    milestones,
    closeDecisions,
    attachments,
    stopRules,
    buyerQuestions: buildBuyerQuestions(input),
    receiptlessCommercialOfferChecksum: input.commercialOffer.receipt.checksum
  };
  const receipt = buildReceipt(partial);
  const contract = { ...partial, receipt };
  const { receiptlessCommercialOfferChecksum, ...publicContract } = contract;
  void receiptlessCommercialOfferChecksum;

  return {
    ...publicContract,
    exportMarkdown: buildMarkdown(publicContract)
  };
}

export function renderBuyerPilotContractHtml(contract: BuyerPilotContract, links: BuyerPilotContractLinks = {}) {
  const receiptVerificationRequestJson = escapeScriptJson(contract.receipt.verificationRequestJson);
  const receiptVerificationApiPathJson = JSON.stringify(contract.receipt.verificationApiPath);
  const receiptJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(contract.receipt, null, 2))}`;
  const linkList = [
    links.valueReportUrl ? `<a href="${escapeHtml(links.valueReportUrl)}">Value report</a>` : "",
    links.commercialOfferUrl ? `<a href="${escapeHtml(links.commercialOfferUrl)}">Commercial offer</a>` : "",
    links.agreementUrl ? `<a href="${escapeHtml(links.agreementUrl)}">Agreement</a>` : "",
    links.adoptionPlanUrl ? `<a href="${escapeHtml(links.adoptionPlanUrl)}">Adoption plan</a>` : "",
    links.trustCenterUrl ? `<a href="${escapeHtml(links.trustCenterUrl)}">Trust center</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON contract</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown contract</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const milestones = contract.milestones
    .map(
      (milestone) => `
        <a class="card ${tone(milestone.status)}" href="${escapeHtml(milestone.href)}">
          <span>${escapeHtml(milestone.status)}</span>
          <strong>${escapeHtml(milestone.label)}</strong>
          <p>${escapeHtml(milestone.promise)}</p>
          <small>${escapeHtml(milestone.owner)} - ${escapeHtml(milestone.proof)}</small>
        </a>`
    )
    .join("");
  const closeDecisions = contract.closeDecisions
    .map(
      (decision) => `
        <a class="decision ${tone(decision.status)}" href="${escapeHtml(decision.href)}">
          <span>${escapeHtml(decision.status)}</span>
          <strong>${escapeHtml(decision.label)}</strong>
          <p>${escapeHtml(decision.buyerDecision)}</p>
          <small>${escapeHtml(decision.owner)} - ${escapeHtml(decision.evidence)}</small>
        </a>`
    )
    .join("");
  const attachments = contract.attachments
    .map(
      (attachment) => `
        <a class="attachment ${tone(attachment.status)}" href="${escapeHtml(attachment.href)}">
          <span>${escapeHtml(attachment.status)}</span>
          <strong>${escapeHtml(attachment.label)}</strong>
          <small>${escapeHtml(attachment.evidence)}</small>
        </a>`
    )
    .join("");
  const stopRules = contract.stopRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");
  const buyerQuestions = contract.buyerQuestions
    .map(
      (question) => `
        <article class="question">
          <strong>${escapeHtml(question.question)}</strong>
          <p>${escapeHtml(question.answer)}</p>
          <small>${escapeHtml(question.evidence)}</small>
        </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(contract.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cbd7d2; --paper: #f4f7f3; --panel: #fffdf7; --teal: #0f766e; --blue: #285b9f; --green-bg: #ebf8ef; --amber-bg: #fff7dc; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 20px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: end; }
      .eyebrow, .card span, .decision span, .attachment span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.25rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small, li { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a, .receipt-actions a, .receipt-verify button { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); color: inherit; font: inherit; font-size: .9rem; font-weight: 900; text-decoration: none; }
      .stamp { min-height: 210px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #172126, #0f766e); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 2.4rem; line-height: .95; }
      .stamp small { max-width: 250px; color: rgba(255, 253, 247, .76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .milestones, .close-grid, .attachments, .question-grid, .lower, .receipt-grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 20px; }
      .milestones { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .close-grid, .attachments { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .question-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .lower, .receipt-grid { grid-template-columns: minmax(0, .72fr) minmax(320px, .46fr); align-items: start; }
      .panel, .metric, .card, .decision, .attachment, .question, li { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .panel, .metric, .card, .decision, .attachment, .question, li { padding: 14px; }
      .metric strong { display: block; margin-top: 4px; font-size: 1.22rem; line-height: 1.1; overflow-wrap: anywhere; }
      .card, .decision, .attachment, .question { display: grid; gap: 7px; text-decoration: none; }
      .receipt-grid strong { display: block; margin: 4px 0 8px; font-size: 1.2rem; line-height: 1.12; overflow-wrap: anywhere; }
      .receipt-actions, .receipt-verify { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .receipt-verify { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
      .receipt-verify button { border-color: #172126; color: #fffdf7; background: #172126; cursor: pointer; }
      .receipt-verify button:disabled { cursor: wait; opacity: .72; }
      .receipt-verify output { min-width: 220px; color: var(--muted); font-size: .88rem; font-weight: 850; overflow-wrap: anywhere; }
      .receipt-verify output[data-status="checking"] { color: var(--blue); }
      .receipt-verify output[data-status="verified"] { color: var(--teal); }
      .receipt-verify output[data-status="mismatch"], .receipt-verify output[data-status="error"] { color: #b33755; }
      ul { display: grid; gap: 9px; padding: 0; margin: 0; list-style: none; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .card strong, .decision strong, .attachment strong, .question strong, p, small, li { overflow-wrap: anywhere; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 900px) { .milestones, .close-grid, .attachments, .question-grid { grid-template-columns: 1fr; } }
      @media (max-width: 780px) { header, main, footer { width: min(100% - 24px, 640px); } .hero, .metrics, .lower, .receipt-grid { grid-template-columns: 1fr; } .stamp { min-height: 132px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Pilot Contract</span>
          <h1>${escapeHtml(contract.headline)}</h1>
          <p>${escapeHtml(contract.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <aside class="stamp">
          <span>${escapeHtml(contract.approvalMemo.decision)}</span>
          <strong>${escapeHtml(yen(contract.firstCommitmentYen))}</strong>
          <small>${escapeHtml(contract.approvalMemo.sendLine)}</small>
        </aside>
      </div>
      <section class="metrics">
        <article class="metric ${tone(contract.readiness)}"><span>Readiness</span><strong>${escapeHtml(contract.readiness)}</strong></article>
        <article class="metric ${tone(contract.approvalMemo.decision)}"><span>Contract score</span><strong>${escapeHtml(contract.contractScore)}/100</strong></article>
        <article class="metric"><span>Value cover</span><strong>${escapeHtml(contract.valueCoveragePercent)}%</strong></article>
        <article class="metric"><span>Payback</span><strong>${escapeHtml(contract.paybackDays)} days</strong></article>
      </section>
    </header>
    <main>
      <section class="panel">
        <h2>Contract milestones</h2>
        <div class="milestones">${milestones}</div>
      </section>
      <section class="lower">
        <article class="panel">
          <h2>Buyer close decisions</h2>
          <div class="close-grid">${closeDecisions}</div>
        </article>
        <article class="panel">
          <h2>Stop rules</h2>
          <ul>${stopRules}</ul>
        </article>
      </section>
      <section class="panel">
        <h2>Send attachments</h2>
        <div class="attachments">${attachments}</div>
      </section>
      <section class="panel">
        <h2>Buyer questions</h2>
        <div class="question-grid">${buyerQuestions}</div>
      </section>
      <section class="panel receipt-grid" aria-label="Replayable buyer pilot contract receipt">
        <div>
          <h2>Replayable contract receipt</h2>
          <strong>${escapeHtml(contract.receipt.receiptId)}</strong>
          <p>${escapeHtml(contract.receipt.checksumAlgorithm)}:${escapeHtml(contract.receipt.checksum)}</p>
          <small>${escapeHtml(contract.receipt.verification.instruction)}</small>
          <div class="receipt-actions">
            <a href="${escapeHtml(contract.receipt.payloadHref)}" download="buyer-pilot-contract-receipt-payload.json">Download payload JSON</a>
            <a href="${escapeHtml(receiptJsonHref)}" download="buyer-pilot-contract-receipt.json">Download receipt JSON</a>
            <a href="${escapeHtml(contract.receipt.href)}" download="buyer-pilot-contract-receipt.md">Download receipt Markdown</a>
          </div>
        </div>
        <div>
          <h2>Verify forwarded copy</h2>
          <p>POST ${escapeHtml(contract.receipt.verificationApiPath)} with the replay request embedded in this page.</p>
          <div class="receipt-verify">
            <button type="button" data-verify-contract-receipt>Verify receipt</button>
            <output data-contract-receipt-result>Not verified in this browser session.</output>
          </div>
        </div>
      </section>
    </main>
    <footer>${escapeHtml(contract.id)} / Generated as a non-binding pilot contract for buyer review.</footer>
    <script type="application/json" id="buyer-pilot-contract-receipt-verify-request">${receiptVerificationRequestJson}</script>
    <script>
      (() => {
        const request = JSON.parse(document.getElementById("buyer-pilot-contract-receipt-verify-request").textContent);
        const verifyPath = ${receiptVerificationApiPathJson};
        const button = document.querySelector("[data-verify-contract-receipt]");
        const output = document.querySelector("[data-contract-receipt-result]");
        button?.addEventListener("click", async () => {
          button.disabled = true;
          output.dataset.status = "checking";
          output.textContent = "Checking receipt...";
          try {
            const response = await fetch(verifyPath, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request)
            });
            const body = await response.json();
            const status = body.verification?.status || (response.ok ? "verified" : "error");
            output.dataset.status = status;
            output.textContent = status === "verified" ? "Verified: checksum matches replay payload." : "Not verified: " + (body.verification?.instruction || body.error || response.status);
          } catch (error) {
            output.dataset.status = "error";
            output.textContent = "Verification failed: " + (error instanceof Error ? error.message : String(error));
          } finally {
            button.disabled = false;
          }
        });
      })();
    </script>
  </body>
</html>`;
}
