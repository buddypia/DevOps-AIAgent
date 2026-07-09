import type { AdoptionOperatingPlan } from "./adoptionOperatingPlan.js";
import type { BuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import type { BuyerTrustCenter } from "./buyerTrustCenter.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotAgreement } from "./pilotAgreement.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type CommercialOfferReadiness = "offer-ready" | "needs-redlines" | "blocked";
export type CommercialOfferTierId = "proof-pilot" | "team-rollout" | "operating-pack";

export type CommercialOfferTier = {
  id: CommercialOfferTierId;
  label: string;
  status: BuyerValueScenarioStatus;
  priceYen: number;
  term: string;
  scope: string;
  included: string[];
  buyerValueYen: number;
  paybackDays: number;
  acceptance: string;
};

export type CommercialOfferValueStressCase = {
  id: "contract-case" | "downside-half-adoption" | "break-even-floor";
  label: string;
  status: BuyerValueScenarioStatus;
  monthlyValueYen: number;
  paybackDays: number;
  assumption: string;
  buyerDecision: string;
};

export type CommercialOfferGuardrail = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  evidence: string;
  rule: string;
};

export type CommercialOfferObjection = {
  id: string;
  objection: string;
  answer: string;
  proof: string;
};

export type CommercialOfferApprovalDecision = "approve" | "redline" | "hold";

export type CommercialOfferApprovalCondition = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  evidence: string;
  requiredBefore: string;
};

export type CommercialOfferApprovalMemo = {
  decision: CommercialOfferApprovalDecision;
  score: number;
  signer: string;
  summary: string;
  sendLine: string;
  validUntilDays: number;
  conditions: CommercialOfferApprovalCondition[];
  redlineQueue: CommercialOfferApprovalCondition[];
};

export const COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH = "/api/commercial-offer/receipt/verify";

export type CommercialOfferReceiptPayload = {
  receiptVersion: "commercial-offer.v1";
  offerId: string;
  readiness: CommercialOfferReadiness;
  offerScore: number;
  buyer: string;
  recommendedTierId: CommercialOfferTierId;
  contractAsk: string;
  firstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  breakEvenMonthlyValueYen: number;
  breakEvenAdoptionRatePercent: number;
  approvalDecision: CommercialOfferApprovalDecision;
  approvalScore: number;
  approvalSigner: string;
  tiers: Array<Pick<CommercialOfferTier, "id" | "label" | "status" | "priceYen" | "term" | "buyerValueYen" | "paybackDays" | "acceptance">>;
  valueStressCases: CommercialOfferValueStressCase[];
  guardrails: CommercialOfferGuardrail[];
  approvalConditions: CommercialOfferApprovalCondition[];
  renewalCriteria: string[];
};

export type CommercialOfferReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type CommercialOfferReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH;
  payload: CommercialOfferReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: CommercialOfferReceiptVerification;
  copyText: string;
  href: string;
};

export type CommercialOffer = {
  id: string;
  readiness: CommercialOfferReadiness;
  offerScore: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  recommendedTierId: CommercialOfferTierId;
  contractAsk: string;
  totalFirstCommitmentYen: number;
  expectedMonthlyValueYen: number;
  breakEvenMonthlyValueYen: number;
  breakEvenAdoptionRatePercent: number;
  tiers: CommercialOfferTier[];
  valueStressCases: CommercialOfferValueStressCase[];
  guardrails: CommercialOfferGuardrail[];
  objections: CommercialOfferObjection[];
  approvalMemo: CommercialOfferApprovalMemo;
  renewalCriteria: string[];
  receipt: CommercialOfferReceipt;
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
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

function paybackDays(priceYen: number, monthlyValueYen: number) {
  if (monthlyValueYen <= 0) return 999;
  return Math.ceil((priceYen / monthlyValueYen) * 30);
}

function targetPaybackDays(term: string) {
  if (/14/.test(term)) return 30;
  if (/30/.test(term)) return 45;
  return 90;
}

function stressStatus(payback: number, target: number): BuyerValueScenarioStatus {
  if (payback <= target) return "clear";
  if (payback <= target * 1.5) return "watch";
  return "blocked";
}

function breakEvenStatus(requiredAdoptionRate: number, extractedAdoptionRate: number): BuyerValueScenarioStatus {
  if (requiredAdoptionRate <= extractedAdoptionRate) return "clear";
  if (requiredAdoptionRate <= 100) return "watch";
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

function tone(status: string) {
  if (["offer-ready", "clear"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
}

export function verifyCommercialOfferReceipt(receipt: Pick<CommercialOfferReceipt, "checksum" | "payload">): CommercialOfferReceiptVerification {
  const expectedChecksum = receipt.checksum.toLowerCase();
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Commercial offer receipt checksum matches the attached replay payload."
      : "Commercial offer receipt checksum does not match the attached replay payload. Do not rely on this procurement offer until it is regenerated."
  };
}

function buildReceiptMarkdown(receipt: Omit<CommercialOfferReceipt, "copyText" | "href">) {
  return [
    "# Commercial offer receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Buyer: ${receipt.payload.buyer}`,
    `Readiness: ${receipt.payload.readiness}`,
    `Offer score: ${receipt.payload.offerScore}/100`,
    `Recommended tier: ${receipt.payload.recommendedTierId}`,
    `First commitment: ${yen(receipt.payload.firstCommitmentYen)}`,
    `Expected monthly value: ${yen(receipt.payload.expectedMonthlyValueYen)}`,
    `Approval: ${receipt.payload.approvalDecision} / ${receipt.payload.approvalScore}`,
    "",
    "## Contract ask",
    receipt.payload.contractAsk,
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
    "Replay rule: Recompute fnv1a-64 over the commercial offer replay payload before accepting a forwarded procurement offer."
  ].join("\n");
}

export function buildCommercialOfferReceipt(offer: Omit<CommercialOffer, "exportMarkdown" | "receipt">): CommercialOfferReceipt {
  const payload: CommercialOfferReceiptPayload = {
    receiptVersion: "commercial-offer.v1",
    offerId: offer.id,
    readiness: offer.readiness,
    offerScore: offer.offerScore,
    buyer: offer.buyer,
    recommendedTierId: offer.recommendedTierId,
    contractAsk: offer.contractAsk,
    firstCommitmentYen: offer.totalFirstCommitmentYen,
    expectedMonthlyValueYen: offer.expectedMonthlyValueYen,
    breakEvenMonthlyValueYen: offer.breakEvenMonthlyValueYen,
    breakEvenAdoptionRatePercent: offer.breakEvenAdoptionRatePercent,
    approvalDecision: offer.approvalMemo.decision,
    approvalScore: offer.approvalMemo.score,
    approvalSigner: offer.approvalMemo.signer,
    tiers: offer.tiers.map((tier) => ({
      id: tier.id,
      label: tier.label,
      status: tier.status,
      priceYen: tier.priceYen,
      term: tier.term,
      buyerValueYen: tier.buyerValueYen,
      paybackDays: tier.paybackDays,
      acceptance: tier.acceptance
    })),
    valueStressCases: offer.valueStressCases,
    guardrails: offer.guardrails,
    approvalConditions: offer.approvalMemo.conditions,
    renewalCriteria: offer.renewalCriteria
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyCommercialOfferReceipt({ checksum, payload });
  const partial: Omit<CommercialOfferReceipt, "copyText" | "href"> = {
    receiptId: `commercial-offer-${offer.readiness}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: COMMERCIAL_OFFER_RECEIPT_VERIFY_PATH,
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

function buildTiers(input: {
  buyerScenario: BuyerValueScenario;
  pilotReceipt: PilotRunReceipt;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
}): CommercialOfferTier[] {
  const monthlyValue = input.buyerScenario.monthlyGrossValueYen;
  const measuredValue = Math.max(input.pilotReceipt.measuredMonthlyValueYen, monthlyValue * 0.62);
  const pilotPrice = Math.min(input.agreement.budgetCapYen, Math.max(input.buyerScenario.pilotInvestmentYen, measuredValue * 0.32));
  const rolloutPrice = Math.max(pilotPrice * 1.8, measuredValue * 0.55);
  const operatingPrice = Math.max(rolloutPrice * 1.35, input.adoptionPlan.riskAdjustedMonthlyValueYen * 0.7);
  return [
    {
      id: "proof-pilot",
      label: "Proof pilot",
      status: statusFrom(input.pilotReceipt.readiness === "accepted" && input.trustCenter.readiness !== "blocked", input.pilotReceipt.readiness === "needs-evidence"),
      priceYen: roundYen(pilotPrice),
      term: "14 days",
      scope: "One workflow, one sponsor, public proof packet, trust center, receipt, and stop decision.",
      included: ["Buyer value memo", "Work order brief", "Pilot run receipt", "Trust center", "Sponsor decision"],
      buyerValueYen: roundYen(measuredValue),
      paybackDays: paybackDays(roundYen(pilotPrice), measuredValue),
      acceptance: "Measured run saves time, reviewer accepts tasks, and no blocked trust controls remain."
    },
    {
      id: "team-rollout",
      label: "Team rollout",
      status: statusFrom(input.adoptionPlan.readiness === "ready-to-operate" && input.trustCenter.readiness === "trust-ready", input.adoptionPlan.readiness === "needs-owner-commitment" || input.trustCenter.readiness === "needs-review"),
      priceYen: roundYen(rolloutPrice),
      term: "30 days",
      scope: "One team rollout with weekly adoption health checks, evidence ledger, and expansion review.",
      included: ["30-day adoption plan", "Evidence ledger", "Decision matrix", "Agreement draft", "Owner commitments"],
      buyerValueYen: input.adoptionPlan.riskAdjustedMonthlyValueYen,
      paybackDays: paybackDays(roundYen(rolloutPrice), input.adoptionPlan.riskAdjustedMonthlyValueYen),
      acceptance: "Adoption plan clears owner commitments and trust controls are not blocked."
    },
    {
      id: "operating-pack",
      label: "Operating pack",
      status: statusFrom(input.agreement.readiness === "ready-to-sign" && input.trustCenter.readiness === "trust-ready", input.agreement.readiness === "needs-redlines" || input.trustCenter.readiness === "needs-review"),
      priceYen: roundYen(operatingPrice),
      term: "Quarterly",
      scope: "Multi-workflow operating cadence with renewal criteria, trust updates, and proof freshness review.",
      included: ["Quarterly proof review", "Stop-rule refresh", "Trust center update", "A2A receipt audit", "Commercial renewal criteria"],
      buyerValueYen: roundYen(monthlyValue * 3),
      paybackDays: paybackDays(roundYen(operatingPrice), monthlyValue),
      acceptance: "Agreement is ready to sign, trust center is clear, and sponsor approves expansion criteria."
    }
  ];
}

function buildGuardrails(input: {
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  recommendedTier: CommercialOfferTier;
}): CommercialOfferGuardrail[] {
  const commercialTerm = input.agreement.terms.find((term) => term.id === "commercial-cap");
  return [
    {
      id: "budget-cap",
      label: "Budget cap",
      status: statusFrom(input.recommendedTier.priceYen <= input.agreement.budgetCapYen, input.recommendedTier.id !== "proof-pilot"),
      owner: "Buyer sponsor",
      evidence: `${yen(input.recommendedTier.priceYen)} offer price against ${yen(input.agreement.budgetCapYen)} agreement cap.`,
      rule: commercialTerm?.text ?? "Pilot spend must stay under the agreed budget cap until measured value is accepted."
    },
    {
      id: "procurement-proof",
      label: "Procurement proof",
      status: statusFrom(input.decisionMatrix.readiness === "buy-a2a", input.decisionMatrix.readiness === "pilot-more"),
      owner: "Procurement reviewer",
      evidence: `${input.decisionMatrix.confidenceScore}/100 decision confidence; winner ${input.decisionMatrix.winnerId}.`,
      rule: "Do not present A2A as the default purchase unless the decision matrix says it is viable."
    },
    {
      id: "trust-gate",
      label: "Trust gate",
      status: statusFrom(input.trustCenter.readiness === "trust-ready", input.trustCenter.readiness === "needs-review"),
      owner: input.trustCenter.controls.find((control) => control.id === "security-owner")?.owner ?? "Security reviewer",
      evidence: `${input.trustCenter.trustScore}/100 trust score; ${input.trustCenter.risks.length} risk items.`,
      rule: "Expansion waits until data boundary, public proof, agent proof, audit trail, and stop rules are reviewable."
    },
    {
      id: "adoption-gate",
      label: "Adoption gate",
      status: statusFrom(input.adoptionPlan.readiness === "ready-to-operate", input.adoptionPlan.readiness === "needs-owner-commitment"),
      owner: input.adoptionPlan.ownerCommitments[0]?.owner ?? "Buyer sponsor",
      evidence: `${input.adoptionPlan.planScore}/100 adoption plan score.`,
      rule: "The buyer only expands from pilot to rollout after owners accept cadence, health checks, and interventions."
    }
  ];
}

function recommendedTier(tiers: CommercialOfferTier[], budgetCapYen: number) {
  return (
    tiers.find((tier) => tier.id === "team-rollout" && tier.status === "clear" && tier.priceYen <= budgetCapYen) ??
    tiers.find((tier) => tier.id === "proof-pilot" && tier.status !== "blocked" && tier.priceYen <= budgetCapYen) ??
    tiers.find((tier) => tier.status !== "blocked") ??
    tiers[0]
  );
}

function readinessFrom(input: { offerScore: number; guardrails: CommercialOfferGuardrail[]; recommendedTier: CommercialOfferTier }): CommercialOfferReadiness {
  if (input.recommendedTier.status === "blocked" || input.guardrails.some((guardrail) => guardrail.status === "blocked")) return "blocked";
  if (input.offerScore >= 82 && input.guardrails.every((guardrail) => guardrail.status === "clear")) return "offer-ready";
  return "needs-redlines";
}

function headlineFor(readiness: CommercialOfferReadiness) {
  if (readiness === "offer-ready") return "The commercial offer is ready for buyer review";
  if (readiness === "needs-redlines") return "The offer needs commercial redlines before approval";
  return "Do not send this commercial offer yet";
}

function hardTruthFor(readiness: CommercialOfferReadiness, openCount: number) {
  if (readiness === "offer-ready") {
    return "Price, scope, acceptance, trust gates, adoption gates, and renewal criteria are explicit enough for a buyer to review the offer.";
  }
  if (readiness === "needs-redlines") {
    return `${openCount} commercial guardrail${openCount === 1 ? "" : "s"} need owner confirmation before this can leave the workspace.`;
  }
  return `${openCount} commercial blocker${openCount === 1 ? "" : "s"} would make this look like pricing without proof.`;
}

function buildObjections(input: {
  recommendedTier: CommercialOfferTier;
  decisionMatrix: BuyerDecisionMatrix;
  trustCenter: BuyerTrustCenter;
  adoptionPlan: AdoptionOperatingPlan;
}): CommercialOfferObjection[] {
  return [
    {
      id: "why-now",
      objection: "Why buy now instead of waiting?",
      answer: `${input.recommendedTier.label} limits scope to ${input.recommendedTier.term} and ties payment to accepted proof.`,
      proof: input.decisionMatrix.hardTruth
    },
    {
      id: "why-this-price",
      objection: "Why is this price defensible?",
      answer: `${yen(input.recommendedTier.priceYen)} is compared against ${yen(input.recommendedTier.buyerValueYen)} buyer value and ${input.recommendedTier.paybackDays}-day payback.`,
      proof: input.recommendedTier.acceptance
    },
    {
      id: "what-if-risk",
      objection: "What if data or operational risk appears?",
      answer: "The trust center and agreement stop rules block expansion until the risk owner clears it.",
      proof: input.trustCenter.hardTruth
    },
    {
      id: "what-after-pilot",
      objection: "What happens after the first pilot?",
      answer: "Expansion follows the 30-day adoption cadence, not a vague rollout promise.",
      proof: input.adoptionPlan.hardTruth
    }
  ];
}

function buildRenewalCriteria(input: { adoptionPlan: AdoptionOperatingPlan; trustCenter: BuyerTrustCenter; pilotReceipt: PilotRunReceipt; buyerScenario: BuyerValueScenario }) {
  return [
    `Renew only if measured monthly value stays above ${yen(Math.round(input.buyerScenario.monthlyGrossValueYen * 0.65))}.`,
    `Renew only if task acceptance stays at or above 70%; current receipt is ${input.pilotReceipt.acceptanceRatePercent}%.`,
    `Renew only if trust center has no blocked controls; current readiness is ${input.trustCenter.readiness}.`,
    `Renew only if adoption plan owner commitments are accepted; current readiness is ${input.adoptionPlan.readiness}.`
  ];
}

function buildValueStressCases(input: {
  recommendedTier: CommercialOfferTier;
  buyerScenario: BuyerValueScenario;
}): {
  cases: CommercialOfferValueStressCase[];
  breakEvenMonthlyValueYen: number;
  breakEvenAdoptionRatePercent: number;
} {
  const targetPayback = targetPaybackDays(input.recommendedTier.term);
  const contractValue = roundYen(input.recommendedTier.buyerValueYen);
  const downsideValue = roundYen(input.recommendedTier.buyerValueYen * 0.5);
  const hasPricedOffer = input.recommendedTier.priceYen > 0 && input.recommendedTier.buyerValueYen > 0;
  const breakEvenMonthlyValueYen = hasPricedOffer ? roundYen((input.recommendedTier.priceYen * 30) / targetPayback) : 0;
  const modeledValue = Math.max(1, input.buyerScenario.monthlyGrossValueYen);
  const extractedAdoptionRate = input.buyerScenario.assumptions.adoptionRatePercent;
  const breakEvenAdoptionRatePercent = hasPricedOffer ? Math.ceil((breakEvenMonthlyValueYen / modeledValue) * 100) : 999;
  const contractPayback = paybackDays(input.recommendedTier.priceYen, contractValue);
  const downsidePayback = paybackDays(input.recommendedTier.priceYen, downsideValue);

  if (!hasPricedOffer) {
    return {
      breakEvenMonthlyValueYen,
      breakEvenAdoptionRatePercent,
      cases: [
        {
          id: "contract-case",
          label: "Contract case",
          status: "blocked",
          monthlyValueYen: contractValue,
          paybackDays: 999,
          assumption: "A defensible non-zero price and buyer value pair is not available yet.",
          buyerDecision: "Do not send pricing until the value proof can support a first commitment."
        },
        {
          id: "downside-half-adoption",
          label: "Downside half adoption",
          status: "blocked",
          monthlyValueYen: downsideValue,
          paybackDays: 999,
          assumption: "The downside case cannot be tested until the base commercial case has value.",
          buyerDecision: "Keep the offer internal and repair the measured value evidence."
        },
        {
          id: "break-even-floor",
          label: "Break-even floor",
          status: "blocked",
          monthlyValueYen: 0,
          paybackDays: targetPayback,
          assumption: "Break-even adoption cannot be trusted without a priced first commitment.",
          buyerDecision: "Name a smaller scoped paid pilot or hold procurement."
        }
      ]
    };
  }

  return {
    breakEvenMonthlyValueYen,
    breakEvenAdoptionRatePercent,
    cases: [
      {
        id: "contract-case",
        label: "Contract case",
        status: stressStatus(contractPayback, targetPayback),
        monthlyValueYen: contractValue,
        paybackDays: contractPayback,
        assumption: `${input.recommendedTier.label} uses the current measured value case and must pay back within ${targetPayback} days.`,
        buyerDecision:
          contractPayback <= targetPayback
            ? "Send the commercial ask with measured proof attached."
            : "Keep the ask internal until measured value improves."
      },
      {
        id: "downside-half-adoption",
        label: "Downside half adoption",
        status: stressStatus(downsidePayback, targetPayback),
        monthlyValueYen: downsideValue,
        paybackDays: downsidePayback,
        assumption: "Buyer adoption or realized value lands at 50% of the current case.",
        buyerDecision:
          downsidePayback <= targetPayback
            ? "Price is resilient enough for buyer review even under the downside case."
            : "Use this as the redline scenario and name the stop rule before sending."
      },
      {
        id: "break-even-floor",
        label: "Break-even floor",
        status: breakEvenStatus(breakEvenAdoptionRatePercent, extractedAdoptionRate),
        monthlyValueYen: breakEvenMonthlyValueYen,
        paybackDays: targetPayback,
        assumption: `${breakEvenAdoptionRatePercent}% adoption is needed to hit the ${targetPayback}-day payback floor from the modeled monthly value.`,
        buyerDecision:
          breakEvenAdoptionRatePercent <= extractedAdoptionRate
            ? "The extracted adoption case clears the payback floor."
            : "Ask the buyer to accept this adoption floor or lower the first commitment."
      }
    ]
  };
}

function buildApprovalConditions(input: {
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  pilotReceipt: PilotRunReceipt;
  recommendedTier: CommercialOfferTier;
}): CommercialOfferApprovalCondition[] {
  const securityOwner = input.trustCenter.controls.find((control) => control.id === "security-owner")?.owner ?? "Security reviewer";
  const signatureOwner = input.agreement.signatures[0]?.name ?? input.agreement.buyer;
  const adoptionOwner = input.adoptionPlan.ownerCommitments[0]?.owner ?? "Buyer sponsor";
  return [
    {
      id: "budget-cap",
      label: "Budget cap accepted",
      status: statusFrom(input.recommendedTier.priceYen <= input.agreement.budgetCapYen, input.recommendedTier.id !== "proof-pilot"),
      owner: "Buyer sponsor",
      evidence: `${yen(input.recommendedTier.priceYen)} first commitment against ${yen(input.agreement.budgetCapYen)} agreement cap.`,
      requiredBefore: "commercial signature"
    },
    {
      id: "proof-winner",
      label: "Procurement comparison",
      status: statusFrom(input.decisionMatrix.readiness === "buy-a2a", input.decisionMatrix.readiness === "pilot-more"),
      owner: "Procurement reviewer",
      evidence: `${input.decisionMatrix.confidenceScore}/100 decision confidence; winner ${input.decisionMatrix.winnerId}.`,
      requiredBefore: "purchase recommendation"
    },
    {
      id: "measured-acceptance",
      label: "Measured acceptance",
      status: statusFrom(input.pilotReceipt.readiness === "accepted", input.pilotReceipt.readiness === "needs-evidence"),
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      evidence: `${input.pilotReceipt.actualMinutesSavedPerRun}m saved/run, ${input.pilotReceipt.acceptanceRatePercent}% accepted, evidence ${input.pilotReceipt.evidenceUrl ? "attached" : "missing"}.`,
      requiredBefore: "buyer case citation"
    },
    {
      id: "trust-boundary",
      label: "Trust boundary",
      status: statusFrom(input.trustCenter.readiness === "trust-ready", input.trustCenter.readiness === "needs-review"),
      owner: securityOwner,
      evidence: `${input.trustCenter.trustScore}/100 trust score; ${input.trustCenter.risks.length} open trust risk items.`,
      requiredBefore: "external buyer rollout"
    },
    {
      id: "agreement-signature",
      label: "Agreement signature",
      status: statusFrom(input.agreement.readiness === "ready-to-sign", input.agreement.readiness === "needs-redlines"),
      owner: signatureOwner,
      evidence: `${input.agreement.agreementScore}/100 agreement score; ${input.agreement.terms.filter((term) => term.status !== "clear").length} open terms.`,
      requiredBefore: "pilot kickoff"
    },
    {
      id: "operating-owner",
      label: "Operating owner",
      status: statusFrom(input.adoptionPlan.readiness === "ready-to-operate", input.adoptionPlan.readiness === "needs-owner-commitment"),
      owner: adoptionOwner,
      evidence: `${input.adoptionPlan.planScore}/100 adoption plan score; ${input.adoptionPlan.ownerCommitments.length} owner commitments.`,
      requiredBefore: "team rollout"
    }
  ];
}

function approvalDecisionFrom(input: {
  readiness: CommercialOfferReadiness;
  recommendedTier: CommercialOfferTier;
  guardrails: CommercialOfferGuardrail[];
  conditions: CommercialOfferApprovalCondition[];
  approvalScore: number;
}): CommercialOfferApprovalDecision {
  if (input.readiness === "blocked" || input.recommendedTier.status === "blocked" || input.conditions.some((condition) => condition.status === "blocked")) return "hold";
  if (
    input.approvalScore >= 82 &&
    input.guardrails.every((guardrail) => guardrail.status === "clear") &&
    input.conditions.every((condition) => condition.status === "clear")
  ) {
    return "approve";
  }
  return "redline";
}

function approvalSummaryFor(decision: CommercialOfferApprovalDecision, recommendedTier: CommercialOfferTier, redlineCount: number) {
  if (decision === "approve") {
    return `${recommendedTier.label} can be sent for approval because price, proof, trust, agreement, and operating ownership are aligned.`;
  }
  if (decision === "redline") {
    return `${redlineCount} approval condition${redlineCount === 1 ? "" : "s"} need owner confirmation before this should leave the workspace.`;
  }
  return `${redlineCount} approval blocker${redlineCount === 1 ? "" : "s"} would make this procurement packet unsafe to send.`;
}

function approvalSendLineFor(decision: CommercialOfferApprovalDecision, recommendedTier: CommercialOfferTier) {
  if (decision === "approve") return `Approve ${recommendedTier.label} at ${yen(recommendedTier.priceYen)} with renewal tied to measured value and trust controls.`;
  if (decision === "redline") return `Redline ${recommendedTier.label}; keep the offer internal until the open approval conditions have named owners.`;
  return "Hold procurement. Do not send pricing until the blocked proof, trust, or agreement item is fixed.";
}

function buildApprovalMemo(input: {
  readiness: CommercialOfferReadiness;
  offerScore: number;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
  pilotReceipt: PilotRunReceipt;
  recommendedTier: CommercialOfferTier;
  guardrails: CommercialOfferGuardrail[];
}): CommercialOfferApprovalMemo {
  const conditions = buildApprovalConditions(input);
  const approvalScore = Math.round(
    clamp(
      average([
        input.offerScore,
        input.decisionMatrix.confidenceScore,
        input.agreement.agreementScore,
        input.adoptionPlan.planScore,
        input.trustCenter.trustScore,
        input.pilotReceipt.receiptScore,
        average(conditions.map((condition) => statusScore(condition.status)))
      ])
    )
  );
  const decision = approvalDecisionFrom({
    readiness: input.readiness,
    recommendedTier: input.recommendedTier,
    guardrails: input.guardrails,
    conditions,
    approvalScore
  });
  const redlineQueue = conditions.filter((condition) => condition.status !== "clear");
  return {
    decision,
    score: approvalScore,
    signer: input.agreement.signatures[0]?.name ?? input.trustCenter.buyer,
    summary: approvalSummaryFor(decision, input.recommendedTier, redlineQueue.length),
    sendLine: approvalSendLineFor(decision, input.recommendedTier),
    validUntilDays: decision === "approve" ? 14 : 7,
    conditions,
    redlineQueue
  };
}

function buildMarkdown(input: Omit<CommercialOffer, "exportMarkdown" | "receipt">, receipt: CommercialOfferReceipt) {
  return [
    `# ${input.headline}`,
    "",
    "Commercial Offer",
    "",
    `Readiness: ${input.readiness}`,
    `Offer score: ${input.offerScore}/100`,
    `Buyer: ${input.buyer}`,
    `Recommended tier: ${input.recommendedTierId}`,
    `First commitment: ${yen(input.totalFirstCommitmentYen)}`,
    `Expected monthly value: ${yen(input.expectedMonthlyValueYen)}`,
    `Break-even monthly value: ${yen(input.breakEvenMonthlyValueYen)}`,
    `Break-even adoption: ${input.breakEvenAdoptionRatePercent}%`,
    `Receipt: ${receipt.receiptId}`,
    `Receipt checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    "",
    input.hardTruth,
    "",
    "## Offer tiers",
    ...input.tiers.map((tier) => `- [${tier.status}] ${tier.label}: ${yen(tier.priceYen)}, ${tier.term}, ${tier.paybackDays} day payback. Scope: ${tier.scope}`),
    "",
    "## Value stress test",
    ...input.valueStressCases.map(
      (stressCase) =>
        `- [${stressCase.status}] ${stressCase.label}: ${yen(stressCase.monthlyValueYen)}/month, ${stressCase.paybackDays} day payback. ${stressCase.assumption} Decision: ${stressCase.buyerDecision}`
    ),
    "",
    "## Commercial guardrails",
    ...input.guardrails.map((guardrail) => `- [${guardrail.status}] ${guardrail.label} (${guardrail.owner}): ${guardrail.rule} Evidence: ${guardrail.evidence}`),
    "",
    "## Procurement approval memo",
    `Decision: ${input.approvalMemo.decision}`,
    `Approval score: ${input.approvalMemo.score}/100`,
    `Signer: ${input.approvalMemo.signer}`,
    `Valid for: ${input.approvalMemo.validUntilDays} days`,
    input.approvalMemo.summary,
    input.approvalMemo.sendLine,
    "",
    "## Approval conditions",
    ...input.approvalMemo.conditions.map(
      (condition) => `- [${condition.status}] ${condition.label} (${condition.owner}): ${condition.evidence} Required before ${condition.requiredBefore}.`
    ),
    "",
    "## Buyer objections",
    ...input.objections.map((objection) => `- ${objection.objection} ${objection.answer} Proof: ${objection.proof}`),
    "",
    "## Renewal criteria",
    ...input.renewalCriteria.map((criterion) => `- ${criterion}`)
  ].join("\n");
}

export function buildCommercialOffer(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  adoptionPlan: AdoptionOperatingPlan;
  trustCenter: BuyerTrustCenter;
}): CommercialOffer {
  const tiers = buildTiers(input);
  const recommended = recommendedTier(tiers, input.agreement.budgetCapYen);
  const stress = buildValueStressCases({ recommendedTier: recommended, buyerScenario: input.buyerScenario });
  const guardrails = buildGuardrails({ ...input, recommendedTier: recommended });
  const offerScore = Math.round(
    clamp(
      average([
        input.decisionMatrix.confidenceScore,
        input.agreement.agreementScore,
        input.adoptionPlan.planScore,
        input.trustCenter.trustScore,
        average(tiers.map((tier) => statusScore(tier.status))),
        average(guardrails.map((guardrail) => statusScore(guardrail.status)))
      ])
    )
  );
  const readiness = readinessFrom({ offerScore, guardrails, recommendedTier: recommended });
  const openCount = guardrails.filter((guardrail) => guardrail.status !== "clear").length;
  const approvalMemo = buildApprovalMemo({
    readiness,
    offerScore,
    decisionMatrix: input.decisionMatrix,
    agreement: input.agreement,
    adoptionPlan: input.adoptionPlan,
    trustCenter: input.trustCenter,
    pilotReceipt: input.pilotReceipt,
    recommendedTier: recommended,
    guardrails
  });
  const partial: Omit<CommercialOffer, "exportMarkdown" | "receipt"> = {
    id: `commercial-offer-${readiness}-${recommended.id}-${offerScore}`,
    readiness,
    offerScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, openCount),
    buyer: input.valueBlueprint.primaryUser,
    recommendedTierId: recommended.id,
    contractAsk: `${recommended.label}: ${yen(recommended.priceYen)} for ${recommended.term}. ${recommended.acceptance}`,
    totalFirstCommitmentYen: recommended.priceYen,
    expectedMonthlyValueYen: recommended.buyerValueYen,
    breakEvenMonthlyValueYen: stress.breakEvenMonthlyValueYen,
    breakEvenAdoptionRatePercent: stress.breakEvenAdoptionRatePercent,
    tiers,
    valueStressCases: stress.cases,
    guardrails,
    objections: buildObjections({ recommendedTier: recommended, decisionMatrix: input.decisionMatrix, trustCenter: input.trustCenter, adoptionPlan: input.adoptionPlan }),
    approvalMemo,
    renewalCriteria: buildRenewalCriteria(input)
  };
  const receipt = buildCommercialOfferReceipt(partial);

  return {
    ...partial,
    receipt,
    exportMarkdown: buildMarkdown(partial, receipt)
  };
}

export function renderCommercialOfferHtml(
  offer: CommercialOffer,
  links: {
    decisionUrl?: string;
    agreementUrl?: string;
    adoptionPlanUrl?: string;
    trustCenterUrl?: string;
    trustManifestUrl?: string;
    jsonUrl?: string;
    markdownUrl?: string;
    appUrl?: string;
  } = {}
) {
  const receiptVerificationRequestJson = escapeScriptJson(offer.receipt.verificationRequestJson);
  const receiptVerificationApiPathJson = JSON.stringify(offer.receipt.verificationApiPath);
  const receiptJsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(offer.receipt, null, 2))}`;
  const linkList = [
    links.decisionUrl ? `<a href="${escapeHtml(links.decisionUrl)}">Decision matrix</a>` : "",
    links.agreementUrl ? `<a href="${escapeHtml(links.agreementUrl)}">Agreement</a>` : "",
    links.adoptionPlanUrl ? `<a href="${escapeHtml(links.adoptionPlanUrl)}">Adoption plan</a>` : "",
    links.trustCenterUrl ? `<a href="${escapeHtml(links.trustCenterUrl)}">Trust center</a>` : "",
    links.trustManifestUrl ? `<a href="${escapeHtml(links.trustManifestUrl)}">Trust manifest</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON offer</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown offer</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const tiers = offer.tiers
    .map(
      (tier) => `
        <article class="tier ${tone(tier.status)}">
          <span>${escapeHtml(tier.status)}</span>
          <strong>${escapeHtml(tier.label)}</strong>
          <b>${escapeHtml(yen(tier.priceYen))}</b>
          <p>${escapeHtml(tier.scope)}</p>
          <small>${escapeHtml(tier.term)} / ${escapeHtml(tier.paybackDays)} day payback / ${escapeHtml(tier.acceptance)}</small>
        </article>`
    )
    .join("");
  const stressCases = offer.valueStressCases
    .map(
      (stressCase) => `
        <article class="stress ${tone(stressCase.status)}">
          <span>${escapeHtml(stressCase.status)}</span>
          <strong>${escapeHtml(stressCase.label)}</strong>
          <b>${escapeHtml(yen(stressCase.monthlyValueYen))}/month</b>
          <p>${escapeHtml(stressCase.assumption)}</p>
          <small>${escapeHtml(stressCase.paybackDays)} day payback - ${escapeHtml(stressCase.buyerDecision)}</small>
        </article>`
    )
    .join("");
  const guardrails = offer.guardrails
    .map(
      (guardrail) => `
        <article class="guardrail ${tone(guardrail.status)}">
          <div><strong>${escapeHtml(guardrail.label)}</strong><span>${escapeHtml(guardrail.status)}</span></div>
          <p>${escapeHtml(guardrail.rule)}</p>
          <small>${escapeHtml(guardrail.owner)} - ${escapeHtml(guardrail.evidence)}</small>
        </article>`
    )
    .join("");
  const approvalConditions = offer.approvalMemo.conditions
    .map(
      (condition) => `
        <article class="approval-condition ${tone(condition.status)}">
          <div><strong>${escapeHtml(condition.label)}</strong><span>${escapeHtml(condition.status)}</span></div>
          <p>${escapeHtml(condition.evidence)}</p>
          <small>${escapeHtml(condition.owner)} - before ${escapeHtml(condition.requiredBefore)}</small>
        </article>`
    )
    .join("");
  const objections = offer.objections
    .map(
      (objection) => `
        <article class="objection">
          <strong>${escapeHtml(objection.objection)}</strong>
          <p>${escapeHtml(objection.answer)}</p>
          <small>${escapeHtml(objection.proof)}</small>
        </article>`
    )
    .join("");
  const renewal = offer.renewalCriteria.map((criterion) => `<li>${escapeHtml(criterion)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(offer.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #52645f; --line: #cad7d1; --paper: #f4f7f3; --panel: #fffdf7; --teal: #0f766e; --blue: #285b9f; --green-bg: #ebf8ef; --amber-bg: #fff7dc; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 20px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: end; }
      .eyebrow, .tier span, .guardrail span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.25rem); line-height: 1; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p, small, li { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: var(--panel); font-weight: 850; text-decoration: none; }
      .stamp { min-height: 200px; display: grid; place-items: center; align-content: center; gap: 6px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #172126, #285b9f); text-align: center; }
      .stamp span { color: #d8fff5; font-size: .8rem; font-weight: 950; text-transform: uppercase; }
      .stamp strong { font-size: 2.3rem; line-height: .95; }
      .stamp small { max-width: 240px; color: rgba(255, 253, 247, .76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .tiers, .stress-grid, .guardrails, .objections, .lower, .receipt-grid { display: grid; gap: 10px; }
      .tiers, .stress-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .guardrails { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .approval-conditions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .lower { grid-template-columns: minmax(0, .75fr) minmax(320px, .5fr); align-items: start; }
      .receipt-grid { grid-template-columns: minmax(0, .72fr) minmax(260px, .44fr); align-items: start; }
      .panel, .tier, .stress, .guardrail, .approval-condition, .objection, li { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .panel, .tier, .stress, .guardrail, .approval-condition, .objection, li { padding: 14px; }
      .tier, .stress, .guardrail, .approval-condition, .objection { display: grid; gap: 7px; }
      .tier b, .stress b { width: fit-content; border-radius: 999px; padding: 4px 8px; color: #102226; background: #d8fff5; }
      .guardrail div, .approval-condition div { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
      .receipt-grid strong { display: block; margin: 4px 0 8px; font-size: 1.2rem; line-height: 1.12; overflow-wrap: anywhere; }
      .receipt-actions, .receipt-verify { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .receipt-actions a, .receipt-verify button { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); color: inherit; font: inherit; font-size: .9rem; font-weight: 900; text-decoration: none; }
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
      .tier strong, .stress strong, .guardrail strong, .approval-condition strong, .objection strong, p, small, li { overflow-wrap: anywhere; }
      footer { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, main, footer { width: min(100% - 24px, 640px); } .hero, .tiers, .stress-grid, .guardrails, .approval-conditions, .lower, .receipt-grid { grid-template-columns: 1fr; } .stamp { min-height: 132px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Commercial Offer</span>
          <h1>${escapeHtml(offer.headline)}</h1>
          <p>${escapeHtml(offer.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <aside class="stamp">
          <span>First commitment</span>
          <strong>${escapeHtml(yen(offer.totalFirstCommitmentYen))}</strong>
          <small>${escapeHtml(offer.readiness)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="panel">
        <h2>Contract ask</h2>
        <p><strong>${escapeHtml(offer.contractAsk)}</strong></p>
      </section>
      <section class="panel receipt-grid" aria-label="Replayable commercial receipt">
        <div>
          <h2>Replayable commercial receipt</h2>
          <strong>${escapeHtml(offer.receipt.receiptId)}</strong>
          <p>This receipt seals the recommended tier, first commitment, stress cases, guardrails, approval memo, and renewal criteria.</p>
          <div class="receipt-actions">
            <a href="${escapeHtml(receiptJsonHref)}" download="${escapeHtml(offer.receipt.receiptId)}.json">Download receipt JSON</a>
            <a href="${escapeHtml(offer.receipt.href)}" download="${escapeHtml(offer.receipt.receiptId)}.md">Download receipt memo</a>
            <a href="${escapeHtml(offer.receipt.verificationRequestHref)}" download="commercial-offer-verify-request.json">Download verify request</a>
          </div>
        </div>
        <div>
          <p><strong>${escapeHtml(`${offer.receipt.checksumAlgorithm}:${offer.receipt.checksum}`)}</strong></p>
          <p>${escapeHtml(offer.receipt.verification.instruction)}</p>
          <p><code>POST ${escapeHtml(offer.receipt.verificationApiPath)}</code></p>
          <div class="receipt-verify">
            <button type="button" data-commercial-offer-receipt-verify>Verify receipt</button>
            <output data-commercial-offer-receipt-status aria-live="polite">Receipt not checked in this browser yet.</output>
          </div>
        </div>
      </section>
      <section class="panel">
        <h2>Procurement approval memo</h2>
        <p><strong>${escapeHtml(offer.approvalMemo.decision)} / ${escapeHtml(offer.approvalMemo.score)} approval score</strong></p>
        <p>${escapeHtml(offer.approvalMemo.summary)}</p>
        <p>${escapeHtml(offer.approvalMemo.sendLine)}</p>
        <div class="approval-conditions">${approvalConditions}</div>
      </section>
      <section class="panel">
        <h2>Offer tiers</h2>
        <div class="tiers">${tiers}</div>
      </section>
      <section class="panel">
        <h2>Value stress test</h2>
        <p>Break-even floor: ${escapeHtml(yen(offer.breakEvenMonthlyValueYen))}/month or ${escapeHtml(offer.breakEvenAdoptionRatePercent)}% adoption.</p>
        <div class="stress-grid">${stressCases}</div>
      </section>
      <section class="panel">
        <h2>Commercial guardrails</h2>
        <div class="guardrails">${guardrails}</div>
      </section>
      <section class="lower">
        <article class="panel">
          <h2>Buyer objections</h2>
          <div class="objections">${objections}</div>
        </article>
        <aside class="panel">
          <h2>Renewal criteria</h2>
          <ul>${renewal}</ul>
        </aside>
      </section>
    </main>
    <footer>Generated by A2A Agent Marketplace as a proof-backed commercial offer, not as legal advice.</footer>
    <script type="application/json" id="commercial-offer-receipt-verify-request">${receiptVerificationRequestJson}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-commercial-offer-receipt-verify]");
        const status = document.querySelector("[data-commercial-offer-receipt-status]");
        const requestNode = document.getElementById("commercial-offer-receipt-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          status.dataset.status = "checking";
          status.textContent = "Checking commercial offer receipt...";
          try {
            const response = await fetch(${receiptVerificationApiPathJson}, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json().catch(() => ({}));
            const verification = result.verification || {};
            if (response.ok && verification.status === "verified") {
              status.dataset.status = "verified";
              status.textContent = "Verified in this browser. Checksum " + (verification.actualChecksum || "") + " matches the commercial offer payload.";
              return;
            }
            status.dataset.status = "mismatch";
            status.textContent = verification.instruction || result.error || "Commercial offer receipt verification failed.";
          } catch {
            status.dataset.status = "error";
            status.textContent = "Could not verify the commercial offer receipt. Check the API route and try again.";
          } finally {
            button.disabled = false;
          }
        });
      })();
    </script>
  </body>
</html>`;
}
