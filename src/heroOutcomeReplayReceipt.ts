import type { BuyerValueSensitivity } from "./buyerValueSensitivity.js";

export const HERO_OUTCOME_REPLAY_RECEIPT_VERSION = "hero-outcome-replay.v1";
export const HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH = "/api/hero-outcome-replay/receipt/verify";

type HeroOutcomeReplayStatus = "ready" | "attention" | "blocked";
type HeroOutcomeReplayDecision = "send" | "review" | "hold";

type HeroOutcomeReplayAction = {
  label: string;
  href: string;
};

type HeroOutcomeReplayStep = {
  id: "manual-work" | "agent-run" | "proof-packet" | "buyer-decision";
  label: string;
  status: HeroOutcomeReplayStatus;
  value: string;
  detail: string;
  href: string;
};

type HeroOutcomeReplayQuestion = {
  id: "value-case" | "proof-access" | "trust-gate" | "next-decision";
  question: string;
  answer: string;
  status: HeroOutcomeReplayStatus;
  href: string;
  evidence: string;
};

type HeroOutcomeReplayApprovalStep = {
  id: "work-order" | "receipt" | "trust" | "send-room";
  label: string;
  status: HeroOutcomeReplayStatus;
  owner: string;
  href: string;
  summary: string;
};

export type HeroOutcomeReplayBrief = {
  status: HeroOutcomeReplayStatus;
  decision: HeroOutcomeReplayDecision;
  decisionLabel: string;
  buyer: string;
  score: number;
  primaryAction: HeroOutcomeReplayAction;
  decisionReceiptAction: HeroOutcomeReplayAction;
  outcomeReplay: HeroOutcomeReplayStep[];
  buyerQuestions: HeroOutcomeReplayQuestion[];
  approvalPath: HeroOutcomeReplayApprovalStep[];
  packetReceipt: {
    receiptId: string;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
  };
};

export type HeroOutcomeReplayReceiptPayload = {
  receiptVersion: typeof HERO_OUTCOME_REPLAY_RECEIPT_VERSION;
  source: "hero-outcome-replay";
  sourceReceiptId: string;
  sourceChecksum: string;
  status: HeroOutcomeReplayBrief["status"];
  decision: HeroOutcomeReplayBrief["decision"];
  decisionLabel: string;
  buyer: string;
  score: number;
  primaryAction: HeroOutcomeReplayAction;
  decisionReceiptHref: string;
  outcomeReplay: HeroOutcomeReplayBrief["outcomeReplay"];
  buyerQuestions: HeroOutcomeReplayBrief["buyerQuestions"];
  approvalPath: HeroOutcomeReplayBrief["approvalPath"];
  sensitivity: {
    verdict: BuyerValueSensitivity["verdict"];
    confidenceBand: string;
    breakEvenAdoptionPercent: number;
    valueAtRiskYen: number;
    downsidePaybackDays: number;
    downsideMonthlyValueYen: number;
    downsideAdoptionRatePercent: number;
    downsideAutomationRatePercent: number;
  };
};

export type HeroOutcomeReplayReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type HeroOutcomeReplayReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
  verificationApiPath: typeof HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH;
  payload: HeroOutcomeReplayReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: HeroOutcomeReplayReceiptVerification;
};

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

export function heroOutcomeReplayCanonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

export function heroOutcomeReplayReceiptChecksum(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function downsideCase(sensitivity: BuyerValueSensitivity) {
  return sensitivity.cases.find((item) => item.id === "pessimistic") ?? sensitivity.cases[0];
}

export function buildHeroOutcomeReplayPayload(brief: HeroOutcomeReplayBrief, sensitivity: BuyerValueSensitivity): HeroOutcomeReplayReceiptPayload {
  const downside = downsideCase(sensitivity);
  return {
    receiptVersion: HERO_OUTCOME_REPLAY_RECEIPT_VERSION,
    source: "hero-outcome-replay",
    sourceReceiptId: brief.packetReceipt.receiptId,
    sourceChecksum: `${brief.packetReceipt.checksumAlgorithm}:${brief.packetReceipt.checksum}`,
    status: brief.status,
    decision: brief.decision,
    decisionLabel: brief.decisionLabel,
    buyer: brief.buyer,
    score: brief.score,
    primaryAction: brief.primaryAction,
    decisionReceiptHref: brief.decisionReceiptAction.href,
    outcomeReplay: brief.outcomeReplay,
    buyerQuestions: brief.buyerQuestions,
    approvalPath: brief.approvalPath,
    sensitivity: {
      verdict: sensitivity.verdict,
      confidenceBand: sensitivity.confidenceBand,
      breakEvenAdoptionPercent: sensitivity.breakEvenAdoptionPercent,
      valueAtRiskYen: sensitivity.valueAtRiskYen,
      downsidePaybackDays: downside?.paybackDays ?? 999,
      downsideMonthlyValueYen: downside?.monthlyValueYen ?? 0,
      downsideAdoptionRatePercent: downside?.adoptionRatePercent ?? 0,
      downsideAutomationRatePercent: downside?.automationRatePercent ?? 0
    }
  };
}

export function verifyHeroOutcomeReplayReceipt(input: {
  checksum: string;
  payload: HeroOutcomeReplayReceiptPayload;
}): HeroOutcomeReplayReceiptVerification {
  const actualChecksum = heroOutcomeReplayReceiptChecksum(input.payload);
  const expectedChecksum = input.checksum.toLowerCase();
  const verified = actualChecksum === expectedChecksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum,
    actualChecksum,
    instruction: verified
      ? "Hero outcome replay receipt checksum matches the buyer decision replay, approval path, and downside sensitivity payload."
      : "Hero outcome replay receipt checksum does not match the buyer decision replay payload. Re-export the buyer outcome replay before accepting the packet."
  };
}

export function buildHeroOutcomeReplayReceipt(brief: HeroOutcomeReplayBrief, sensitivity: BuyerValueSensitivity): HeroOutcomeReplayReceipt {
  const payload = buildHeroOutcomeReplayPayload(brief, sensitivity);
  const checksum = heroOutcomeReplayReceiptChecksum(payload);
  const payloadJson = heroOutcomeReplayCanonicalJson(payload);
  const verificationRequestJson = heroOutcomeReplayCanonicalJson({ checksum, payload });
  const verification = verifyHeroOutcomeReplayReceipt({ checksum, payload });

  return {
    receiptId: `hero-outcome-replay-${payload.decision}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum,
    verificationApiPath: HERO_OUTCOME_REPLAY_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
}
