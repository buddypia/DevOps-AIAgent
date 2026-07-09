import type { BuyerDecisionMatrix } from "./buyerDecisionMatrix.js";
import type { BuyerDiligenceRoom } from "./buyerDiligence.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { PilotAgreement } from "./pilotAgreement.js";
import type { PilotEvidenceLedger } from "./pilotEvidenceLedger.js";
import type { PilotExecutionHandoff } from "./pilotExecution.js";
import type { PilotProposal, PilotProofStatus } from "./pilotProposal.js";
import type { PilotRunReceipt } from "./pilotRunReceipt.js";
import type { PilotWorkflowPlan } from "./pilotWorkflow.js";
import type { SponsorReviewRoom } from "./sponsorReviewRoom.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";

export type BuyerProofPacketReadiness = "share-ready" | "needs-evidence" | "blocked";
export const BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH = "/api/buyer-proof-packet/receipt/verify";
export type BuyerProofPacketArtifactId =
  | "value-report"
  | "proposal"
  | "workflow"
  | "receipt"
  | "decision"
  | "agreement"
  | "ledger"
  | "diligence"
  | "execution"
  | "review";

export type BuyerProofPacketRow = {
  id: string;
  label: string;
  status: BuyerValueScenarioStatus;
  owner: string;
  artifactId: BuyerProofPacketArtifactId;
  claim: string;
  evidence: string;
  nextAction: string;
};

export type BuyerProofPacketGap = {
  id: string;
  label: string;
  severity: "watch" | "blocked";
  owner: string;
  fix: string;
};

export type BuyerProofPacketRealityCheck = {
  label: string;
  value: string;
  source: string;
};

export type BuyerProofPacketReceiptCheck = {
  id: string;
  label: string;
  status: "sealed" | "watch" | "blocked";
  evidence: string;
  verifier: string;
};

export type BuyerProofPacketReceiptPayload = {
  manifestVersion: "buyer-proof-packet.v1";
  packetId: string;
  readiness: BuyerProofPacketReadiness;
  packetScore: number;
  headline: string;
  targetBuyer: string;
  decisionAsk: string;
  coveredArtifacts: BuyerProofPacketArtifactId[];
  sourceScores: {
    recommendation: number;
    valueBlueprint: number;
    buyerScenario: number;
    proposal: number;
    ledger: number;
    diligence: number;
    sponsorReview: number;
    evidenceRows: number;
  };
  rows: Array<Pick<BuyerProofPacketRow, "id" | "status" | "owner" | "artifactId" | "claim" | "evidence" | "nextAction">>;
  gaps: Array<Pick<BuyerProofPacketGap, "id" | "severity" | "owner" | "fix">>;
  realityChecks: BuyerProofPacketRealityCheck[];
};

export type BuyerProofPacketReceiptReplayVerification = {
  status: "verified" | "mismatch";
  expectedDigest: string;
  actualDigest: string;
  instruction: string;
};

export type BuyerProofPacketReceipt = {
  id: string;
  algorithm: "fnv1a-64";
  digest: string;
  verificationApiPath: typeof BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH;
  manifestVersion: BuyerProofPacketReceiptPayload["manifestVersion"];
  coveredArtifacts: BuyerProofPacketArtifactId[];
  payload: BuyerProofPacketReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  replayVerification: BuyerProofPacketReceiptReplayVerification;
  checks: BuyerProofPacketReceiptCheck[];
  verification: string;
};

export type BuyerProofPacket = {
  id: string;
  readiness: BuyerProofPacketReadiness;
  packetScore: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  decisionAsk: string;
  rows: BuyerProofPacketRow[];
  gaps: BuyerProofPacketGap[];
  realityChecks: BuyerProofPacketRealityCheck[];
  nextAction: BuyerProofPacketGap | null;
  receipt: BuyerProofPacketReceipt;
  exportMarkdown: string;
};

type BuyerProofPacketBase = Omit<BuyerProofPacket, "receipt" | "exportMarkdown">;
type BuyerProofPacketSourceScores = BuyerProofPacketReceiptPayload["sourceScores"];

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

function escapeHtml(value: unknown) {
  return String(value)
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

function tone(status: string) {
  if (["share-ready", "clear", "sealed"].includes(status)) return "good";
  if (["blocked"].includes(status)) return "bad";
  return "watch";
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

export function buyerProofPacketReceiptDigest(payload: BuyerProofPacketReceiptPayload) {
  return stableDigest(payload);
}

export function verifyBuyerProofPacketReceipt(receipt: Pick<BuyerProofPacketReceipt, "digest" | "payload">): BuyerProofPacketReceiptReplayVerification {
  const actualDigest = buyerProofPacketReceiptDigest(receipt.payload);
  const verified = actualDigest === receipt.digest.toLowerCase();
  return {
    status: verified ? "verified" : "mismatch",
    expectedDigest: receipt.digest.toLowerCase(),
    actualDigest,
    instruction: verified
      ? "Receipt digest matches the attached buyer proof packet payload."
      : "Receipt digest does not match the attached buyer proof packet payload. Do not accept this packet until the source workspace is re-exported."
  };
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function scenarioStatus(scenario: BuyerValueScenario): BuyerValueScenarioStatus {
  if (scenario.readiness === "scales-now") return "clear";
  if (scenario.readiness === "pilot-first") return "watch";
  return "blocked";
}

function statusFrom(readiness: string, clearValues: string[], watchValues: string[] = []): BuyerValueScenarioStatus {
  if (clearValues.includes(readiness)) return "clear";
  if (watchValues.includes(readiness)) return "watch";
  return "blocked";
}

function proofStatusToRow(status: PilotProofStatus): BuyerValueScenarioStatus {
  if (status === "ready") return "clear";
  if (status === "watch") return "watch";
  return "blocked";
}

function combinedStatus(statuses: BuyerValueScenarioStatus[]): BuyerValueScenarioStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("watch")) return "watch";
  return "clear";
}

function readinessFrom(rows: BuyerProofPacketRow[]): BuyerProofPacketReadiness {
  if (rows.some((row) => row.status === "blocked")) return "blocked";
  if (rows.some((row) => row.status === "watch")) return "needs-evidence";
  return "share-ready";
}

function headlineFor(readiness: BuyerProofPacketReadiness) {
  if (readiness === "share-ready") return "Buyer proof packet is ready to share";
  if (readiness === "needs-evidence") return "Buyer proof packet needs evidence closure";
  return "Buyer proof packet should stay internal";
}

function hardTruthFor(readiness: BuyerProofPacketReadiness, gaps: BuyerProofPacketGap[]) {
  if (readiness === "share-ready") {
    return "A buyer can inspect the value case, proof trail, procurement logic, agreement boundary, and next pilot move from one packet.";
  }
  if (readiness === "needs-evidence") {
    return `${gaps.length} item${gaps.length === 1 ? "" : "s"} need owner confirmation before this becomes an approval packet.`;
  }
  return `${gaps.filter((gap) => gap.severity === "blocked").length} blocked proof gap${gaps.filter((gap) => gap.severity === "blocked").length === 1 ? "" : "s"} would make this feel like a demo if shared now.`;
}

function decisionAskFor(readiness: BuyerProofPacketReadiness, nextAction: BuyerProofPacketGap | null) {
  if (readiness === "share-ready") return "Share this packet and ask the sponsor to approve the first buyer pilot.";
  if (readiness === "needs-evidence") return `Close evidence before sharing: ${nextAction?.label ?? "review open items"}.`;
  return `Keep this packet internal: ${nextAction?.label ?? "blocked evidence"} is not ready.`;
}

function buildRows(input: {
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  diligence: BuyerDiligenceRoom;
  execution: PilotExecutionHandoff;
  sponsorReview: SponsorReviewRoom;
}): BuyerProofPacketRow[] {
  const runtimeProofs = input.proposal.proofs.filter((proof) => ["runtime", "submission", "a2a-trial"].includes(proof.id));
  const a2a = input.decisionMatrix.alternatives.find((alternative) => alternative.id === "a2a-squad");
  const openRisks = input.diligence.riskRegister.filter((risk) => risk.status !== "clear");

  return [
    {
      id: "buyer-outcome",
      label: "Buyer outcome",
      status: scenarioStatus(input.buyerScenario),
      owner: input.valueBlueprint.primaryUser,
      artifactId: "value-report",
      claim: `${input.valueBlueprint.primaryUser} can recover ${input.buyerScenario.monthlyHoursSaved}h/month with ${input.buyerScenario.paybackDays}-day payback.`,
      evidence: `${yen(input.buyerScenario.monthlyGrossValueYen)} modeled monthly value; ${input.buyerScenario.confidenceScore}/100 confidence.`,
      nextAction: input.buyerScenario.readiness === "not-yet" ? "Tighten buyer assumptions before sharing." : "Use the value report as the packet baseline."
    },
    {
      id: "inspectable-product",
      label: "Inspectable product",
      status: combinedStatus(runtimeProofs.map((proof) => proofStatusToRow(proof.status))),
      owner: "Cloud Run SRE",
      artifactId: "proposal",
      claim: "A buyer can inspect the deployed product and external proof links without private context.",
      evidence: `${runtimeProofs.filter((proof) => proof.status === "ready").length}/${runtimeProofs.length} public proof items ready.`,
      nextAction: runtimeProofs.find((proof) => proof.status !== "ready")?.evidence ?? "Keep public proof links attached to the proposal."
    },
    {
      id: "first-workflow",
      label: "First workflow",
      status: combinedStatus([
        statusFrom(input.workflow.readiness, ["ready-to-run"], ["needs-scope"]),
        statusFrom(input.execution.readiness, ["ready-to-start"], ["needs-proof"])
      ]),
      owner: "Pilot owner",
      artifactId: "workflow",
      claim: `Run "${input.workflow.workflowName}" with named work orders, gates, and a bounded timebox.`,
      evidence: `${input.workflow.workflowScore}/100 workflow score; ${input.execution.workOrders.length} work orders and ${input.execution.gates.length} proof gates.`,
      nextAction: input.execution.readiness === "ready-to-start" ? "Assign owners and start the bounded pilot." : "Close execution gates before kickoff."
    },
    {
      id: "measured-run",
      label: "Measured run",
      status: statusFrom(input.pilotReceipt.readiness, ["accepted"], ["needs-evidence"]),
      owner: input.pilotReceipt.reviewerName || "Pilot reviewer",
      artifactId: "receipt",
      claim: `${input.pilotReceipt.actualMinutesSavedPerRun} minutes were saved in the first recorded run.`,
      evidence: `${input.pilotReceipt.acceptanceRatePercent}% acceptance; evidence URL ${input.pilotReceipt.evidenceUrl ? "attached" : "missing"}.`,
      nextAction: input.pilotReceipt.readiness === "accepted" ? "Use the receipt as measured proof." : "Attach a public first-run receipt."
    },
    {
      id: "procurement-choice",
      label: "Procurement choice",
      status: statusFrom(input.decisionMatrix.readiness, ["buy-a2a"], ["pilot-more"]),
      owner: "Procurement reviewer",
      artifactId: "decision",
      claim: `A2A is ${a2a?.status ?? "weak"} with ${a2a?.score ?? 0}/100 against manual work, generic AI, and an internal build.`,
      evidence: `${input.decisionMatrix.confidenceScore}/100 decision confidence; winner ${input.decisionMatrix.alternatives.find((alternative) => alternative.id === input.decisionMatrix.winnerId)?.label ?? input.decisionMatrix.winnerId}.`,
      nextAction: input.decisionMatrix.readiness === "buy-a2a" ? "Use the decision matrix to defend the path." : "Resolve the procurement gap before expansion."
    },
    {
      id: "agreement-boundary",
      label: "Agreement boundary",
      status: combinedStatus([
        statusFrom(input.agreement.readiness, ["ready-to-sign"], ["needs-redlines"]),
        statusFrom(input.diligence.readiness, ["approval-ready"], ["needs-evidence"])
      ]),
      owner: "Buyer sponsor",
      artifactId: "agreement",
      claim: "Scope, budget cap, stop rules, and security boundaries are explicit before rollout.",
      evidence: `${input.agreement.terms.filter((term) => term.status === "clear").length}/${input.agreement.terms.length} terms clear; ${openRisks.length} open risks.`,
      nextAction: input.agreement.readiness === "ready-to-sign" && input.diligence.readiness === "approval-ready" ? "Use the agreement and diligence room as the approval boundary." : "Close agreement and diligence gaps before signature."
    },
    {
      id: "sponsor-decision",
      label: "Sponsor decision",
      status: statusFrom(input.sponsorReview.readiness, ["approve-review"], ["close-evidence"]),
      owner: "Buyer sponsor",
      artifactId: "review",
      claim: input.sponsorReview.decisionAsk,
      evidence: `${input.sponsorReview.reviewScore}/100 review score; ${input.sponsorReview.questions.filter((question) => question.status === "clear").length}/${input.sponsorReview.questions.length} sponsor answers clear.`,
      nextAction: input.sponsorReview.nextQuestion.nextAction
    }
  ];
}

function buildGaps(rows: BuyerProofPacketRow[], ledger: PilotEvidenceLedger): BuyerProofPacketGap[] {
  const gaps = rows
    .filter((row) => row.status !== "clear")
    .map((row) => ({
      id: `gap-${row.id}`,
      label: row.label,
      severity: row.status === "blocked" ? ("blocked" as const) : ("watch" as const),
      owner: row.owner,
      fix: row.nextAction
    }));

  for (const exception of ledger.exceptions) {
    if (gaps.some((gap) => gap.label === exception.label)) continue;
    gaps.push({
      id: `gap-ledger-${exception.id}`,
      label: exception.label,
      severity: exception.severity,
      owner: exception.owner,
      fix: exception.fix
    });
  }

  return gaps;
}

function buildRealityChecks(input: {
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  sponsorReview: SponsorReviewRoom;
}): BuyerProofPacketRealityCheck[] {
  const readyProofs = input.proposal.proofs.filter((proof) => proof.status === "ready").length;
  const a2a = input.decisionMatrix.alternatives.find((alternative) => alternative.id === "a2a-squad");
  return [
    {
      label: "Modeled value",
      value: `${input.buyerScenario.monthlyHoursSaved}h/month, ${yen(input.buyerScenario.monthlyGrossValueYen)}`,
      source: "Buyer value report"
    },
    {
      label: "Measured first run",
      value: `${input.pilotReceipt.actualMinutesSavedPerRun} min/run, ${input.pilotReceipt.acceptanceRatePercent}% accepted`,
      source: "Pilot receipt"
    },
    {
      label: "Public proof",
      value: `${readyProofs}/${input.proposal.proofs.length} proof items ready`,
      source: "Buyer proposal"
    },
    {
      label: "Procurement position",
      value: `A2A ${a2a?.score ?? 0}/100, confidence ${input.decisionMatrix.confidenceScore}/100`,
      source: "Decision matrix"
    },
    {
      label: "Approval boundary",
      value: `${input.agreement.stopRules.length} stop rules, ${input.sponsorReview.questions.length} sponsor questions`,
      source: "Agreement and review room"
    }
  ];
}

const EXPECTED_RECEIPT_ARTIFACTS: BuyerProofPacketArtifactId[] = ["value-report", "proposal", "workflow", "receipt", "decision", "agreement", "ledger", "diligence", "execution", "review"];

function uniqueArtifacts(artifacts: BuyerProofPacketArtifactId[]) {
  return artifacts.filter((artifact, index) => artifacts.indexOf(artifact) === index);
}

function buildReceipt(packet: BuyerProofPacketBase, sourceScores: BuyerProofPacketSourceScores): BuyerProofPacketReceipt {
  const coveredArtifacts = uniqueArtifacts([...packet.rows.map((row) => row.artifactId), "ledger", "diligence", "execution"]);
  const missingArtifacts = EXPECTED_RECEIPT_ARTIFACTS.filter((artifact) => !coveredArtifacts.includes(artifact));
  const blockedGaps = packet.gaps.filter((gap) => gap.severity === "blocked");
  const payload: BuyerProofPacketReceiptPayload = {
    manifestVersion: "buyer-proof-packet.v1",
    packetId: packet.id,
    readiness: packet.readiness,
    packetScore: packet.packetScore,
    headline: packet.headline,
    targetBuyer: packet.targetBuyer,
    decisionAsk: packet.decisionAsk,
    coveredArtifacts,
    sourceScores,
    rows: packet.rows.map(({ id, status, owner, artifactId, claim, evidence, nextAction }) => ({ id, status, owner, artifactId, claim, evidence, nextAction })),
    gaps: packet.gaps.map(({ id, severity, owner, fix }) => ({ id, severity, owner, fix })),
    realityChecks: packet.realityChecks
  };
  const digest = buyerProofPacketReceiptDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ digest, payload });
  const checks: BuyerProofPacketReceiptCheck[] = [
    {
      id: "manifest-digest",
      label: "Manifest digest",
      status: "sealed",
      evidence: `${payload.rows.length} evidence rows, ${payload.realityChecks.length} reality checks, and ${coveredArtifacts.length} artifacts are included in this checksum.`,
      verifier: "Recompute the checksum over receipt.payload and compare it with receipt.digest."
    },
    {
      id: "artifact-coverage",
      label: "Artifact coverage",
      status: missingArtifacts.length === 0 ? "sealed" : "watch",
      evidence: missingArtifacts.length === 0 ? "All buyer approval artifacts are named in the manifest." : `Missing from manifest: ${missingArtifacts.join(", ")}.`,
      verifier: "Compare coveredArtifacts with the packet links before external sharing."
    },
    {
      id: "gap-declaration",
      label: "Gap declaration",
      status: blockedGaps.length ? "blocked" : packet.gaps.length ? "watch" : "sealed",
      evidence: packet.gaps.length ? `${blockedGaps.length} blocked and ${packet.gaps.length - blockedGaps.length} watch gaps are declared.` : "No open gaps are hidden from the sponsor packet.",
      verifier: "Open gaps in the receipt must match the packet gap list."
    }
  ];

  return {
    id: `buyer-proof-receipt-${digest}`,
    algorithm: "fnv1a-64",
    digest,
    verificationApiPath: BUYER_PROOF_PACKET_RECEIPT_VERIFY_PATH,
    manifestVersion: payload.manifestVersion,
    coveredArtifacts,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    replayVerification: verifyBuyerProofPacketReceipt({ digest, payload }),
    checks,
    verification: "Recompute FNV-1a 64-bit over the canonical JSON of receipt.payload and compare it with receipt.digest."
  };
}

function buildMarkdown(input: Omit<BuyerProofPacket, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Buyer Proof Packet",
    "",
    `Readiness: ${input.readiness}`,
    `Packet score: ${input.packetScore}/100`,
    `Target buyer: ${input.targetBuyer}`,
    `Decision ask: ${input.decisionAsk}`,
    "",
    input.hardTruth,
    "",
    "## Evidence rows",
    ...input.rows.flatMap((row) => [
      `- [${row.status}] ${row.label}: ${row.claim}`,
      `  - Evidence: ${row.evidence}`,
      `  - Owner: ${row.owner}`,
      `  - Artifact: ${row.artifactId}`,
      `  - Next: ${row.nextAction}`
    ]),
    "",
    "## Reality checks",
    ...input.realityChecks.map((check) => `- ${check.label}: ${check.value} (${check.source})`),
    "",
    "## Manifest receipt",
    `- Receipt: ${input.receipt.id}`,
    `- Algorithm: ${input.receipt.algorithm}`,
    `- Digest: ${input.receipt.digest}`,
    `- Covered artifacts: ${input.receipt.coveredArtifacts.join(", ")}`,
    `- Verification: ${input.receipt.verification}`,
    `- Replay status: ${input.receipt.replayVerification.status}`,
    `- API verification: POST ${input.receipt.verificationApiPath}`,
    ...input.receipt.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence} Verifier: ${check.verifier}`),
    "",
    "## Receipt replay payload",
    "```json",
    input.receipt.payloadJson,
    "```",
    "",
    "## Receipt API verification",
    `POST ${input.receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    input.receipt.verificationRequestJson,
    "```",
    "",
    "## Open gaps",
    ...(input.gaps.length ? input.gaps.map((gap) => `- [${gap.severity}] ${gap.label}: ${gap.fix} Owner: ${gap.owner}`) : ["- None"])
  ].join("\n");
}

export function buildBuyerProofPacket(input: {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  proposal: PilotProposal;
  workflow: PilotWorkflowPlan;
  pilotReceipt: PilotRunReceipt;
  decisionMatrix: BuyerDecisionMatrix;
  agreement: PilotAgreement;
  ledger: PilotEvidenceLedger;
  diligence: BuyerDiligenceRoom;
  execution: PilotExecutionHandoff;
  sponsorReview: SponsorReviewRoom;
}): BuyerProofPacket {
  const rows = buildRows(input);
  const gaps = buildGaps(rows, input.ledger);
  const readiness = readinessFrom(rows);
  const evidenceRowsScore = average(rows.map((row) => statusScore(row.status)));
  const sourceScores: BuyerProofPacketSourceScores = {
    recommendation: input.recommendation.after.total,
    valueBlueprint: input.valueBlueprint.boardScore,
    buyerScenario: input.buyerScenario.scenarioScore,
    proposal: input.proposal.proposalScore,
    ledger: input.ledger.ledgerScore,
    diligence: input.diligence.diligenceScore,
    sponsorReview: input.sponsorReview.reviewScore,
    evidenceRows: Math.round(evidenceRowsScore)
  };
  const packetScore = Math.round(
    clamp(
      average(Object.values(sourceScores))
    )
  );
  const nextAction = gaps.find((gap) => gap.severity === "blocked") ?? gaps[0] ?? null;
  const partial: BuyerProofPacketBase = {
    id: `buyer-proof-packet-${readiness}-${packetScore}`,
    readiness,
    packetScore,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, gaps),
    targetBuyer: input.valueBlueprint.primaryUser,
    decisionAsk: decisionAskFor(readiness, nextAction),
    rows,
    gaps,
    realityChecks: buildRealityChecks(input),
    nextAction
  };
  const withReceipt = {
    ...partial,
    receipt: buildReceipt(partial, sourceScores)
  };

  return {
    ...withReceipt,
    exportMarkdown: buildMarkdown(withReceipt)
  };
}

export function renderBuyerProofPacketHtml(
  packet: BuyerProofPacket,
  links: Partial<Record<BuyerProofPacketArtifactId | "manifest" | "json" | "markdown" | "app", string>> = {}
) {
  const metrics = [
    { label: "Readiness", value: packet.readiness, status: packet.readiness },
    { label: "Packet Score", value: packet.packetScore, status: packet.readiness },
    { label: "Clear Rows", value: `${packet.rows.filter((row) => row.status === "clear").length}/${packet.rows.length}`, status: packet.readiness },
    { label: "Manifest Digest", value: packet.receipt.digest, status: "sealed" },
    { label: "Open Gaps", value: packet.gaps.length, status: packet.gaps.length ? packet.gaps[0].severity : packet.readiness }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const rows = packet.rows
    .map((row) => {
      const href = links[row.artifactId];
      return `
        <article class="row ${tone(row.status)}">
          <div><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.status)}</span></div>
          <h3>${escapeHtml(row.claim)}</h3>
          <p>${escapeHtml(row.evidence)}</p>
          <footer>
            <em>${escapeHtml(row.owner)}</em>
            ${href ? `<a href="${escapeHtml(href)}">${escapeHtml(row.artifactId)}</a>` : `<b>${escapeHtml(row.artifactId)}</b>`}
          </footer>
        </article>`;
    })
    .join("");
  const checks = packet.realityChecks
    .map(
      (check) => `
        <article class="check">
          <span>${escapeHtml(check.label)}</span>
          <strong>${escapeHtml(check.value)}</strong>
          <small>${escapeHtml(check.source)}</small>
        </article>`
    )
    .join("");
  const gaps = packet.gaps.length
    ? packet.gaps
        .map(
          (gap) => `
            <li class="${tone(gap.severity)}">
              <strong>${escapeHtml(gap.label)}</strong>
              <span>${escapeHtml(gap.owner)}</span>
              <p>${escapeHtml(gap.fix)}</p>
            </li>`
        )
        .join("")
    : `<li class="good"><strong>No open gaps</strong><span>${escapeHtml(packet.targetBuyer)}</span><p>The packet is ready for external review.</p></li>`;
  const receiptChecks = packet.receipt.checks
    .map(
      (check) => `
        <article class="receipt-check ${tone(check.status)}">
          <div><strong>${escapeHtml(check.label)}</strong><span>${escapeHtml(check.status)}</span></div>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.verifier)}</small>
        </article>`
    )
    .join("");
  const linkList = [
    links.review ? `<a href="${escapeHtml(links.review)}">Sponsor review</a>` : "",
    links["value-report"] ? `<a href="${escapeHtml(links["value-report"])}">Value report</a>` : "",
    links.ledger ? `<a href="${escapeHtml(links.ledger)}">Evidence ledger</a>` : "",
    links.agreement ? `<a href="${escapeHtml(links.agreement)}">Agreement</a>` : "",
    links.execution ? `<a href="${escapeHtml(links.execution)}">Execution</a>` : "",
    links.manifest ? `<a href="${escapeHtml(links.manifest)}">Trust manifest</a>` : "",
    links.json ? `<a href="${escapeHtml(links.json)}">JSON packet</a>` : "",
    links.markdown ? `<a href="${escapeHtml(links.markdown)}">Markdown packet</a>` : "",
    links.app ? `<a href="${escapeHtml(links.app)}">Open workbench</a>` : ""
  ]
    .filter(Boolean)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(packet.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #51635f; --line: #c9d7d2; --paper: #eef4f1; --panel: #fffdf7; --teal: #0f766e; --green-bg: #edf8f1; --amber-bg: #fff7dd; --rose-bg: #fff1f2; }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer.page { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { padding: 38px 0 20px; }
      .eyebrow, .metric span, .check span, h2, .row span { color: var(--teal); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 7px 0 10px; font-size: clamp(2rem, 5vw, 4.05rem); line-height: 1; letter-spacing: 0; }
      p, small { color: var(--muted); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 18px; align-items: end; }
      .stamp { min-height: 196px; display: grid; place-items: center; align-content: center; gap: 8px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #172126, #125b54); text-align: center; }
      .stamp strong { padding: 0 18px; font-size: 1.5rem; line-height: 1.05; overflow-wrap: anywhere; }
      .stamp span, .stamp small { color: rgba(255, 253, 247, .78); font-weight: 900; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a, .row a, .row b { border: 1px solid var(--line); border-radius: 999px; padding: 5px 9px; background: var(--panel); color: var(--teal); font-weight: 850; text-decoration: none; }
      nav a { color: var(--ink); }
      .metrics, .checks, .rows { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 20px; }
      .checks { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .rows { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .receipt-lock, .receipt-checks { display: grid; gap: 10px; }
      .receipt-lock { grid-template-columns: minmax(0, .7fr) minmax(0, 1.3fr); }
      .receipt-checks { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 10px; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metric, .panel, .check, .row, .receipt-card, .receipt-check { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 12px 28px rgba(23, 33, 38, .07); }
      .metric, .panel, .check, .row, .receipt-card, .receipt-check { padding: 14px; }
      .metric strong, .check strong { display: block; margin-top: 6px; font-size: 1.18rem; line-height: 1.12; overflow-wrap: anywhere; }
      .receipt-card code { display: block; padding: 10px; border-radius: 8px; background: #172126; color: #fffdf7; overflow-wrap: anywhere; }
      .receipt-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .receipt-card a, .receipt-card button { justify-self: start; border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; color: var(--teal); font: inherit; font-weight: 850; text-decoration: none; background: var(--panel); }
      .receipt-card button { cursor: pointer; }
      .receipt-card button:disabled { cursor: default; opacity: .72; }
      .receipt-status.good { color: var(--teal); font-weight: 900; }
      .receipt-status.bad { color: #a82135; font-weight: 900; }
      .receipt-card strong, .receipt-check strong, .receipt-check p, .receipt-check small { overflow-wrap: anywhere; }
      .receipt-card span, .receipt-check span { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .receipt-check div { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
      .row { display: grid; gap: 8px; border-left: 4px solid #add6bd; }
      .row div, .row footer { display: flex; align-items: start; justify-content: space-between; gap: 10px; }
      .row h3 { margin: 0; font-size: 1.06rem; line-height: 1.22; }
      .row em { color: var(--ink); font-style: normal; font-weight: 850; }
      .row strong, .row h3, .row p, .row footer, .check small { overflow-wrap: anywhere; }
      .good { border-color: #add6bd; background: var(--green-bg); }
      .watch { border-color: #ead39a; background: var(--amber-bg); }
      .bad { border-color: #e8aeb8; background: var(--rose-bg); }
      .gaps { display: grid; gap: 8px; padding-left: 0; list-style: none; }
      .gaps li { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
      .gaps li span { display: block; color: var(--muted); font-weight: 850; }
      footer.page { padding: 0 0 28px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 780px) { header, main, footer.page { width: min(100% - 24px, 620px); } .hero, .metrics, .checks, .rows, .receipt-lock, .receipt-checks { grid-template-columns: 1fr; } .stamp { min-height: 136px; } .row div, .row footer, .receipt-check div { flex-direction: column; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div>
          <span class="eyebrow">Buyer Proof Packet</span>
          <h1>${escapeHtml(packet.headline)}</h1>
          <p>${escapeHtml(packet.hardTruth)}</p>
          <nav>${linkList}</nav>
        </div>
        <div class="stamp">
          <span>Decision ask</span>
          <strong>${escapeHtml(packet.decisionAsk)}</strong>
          <small>${escapeHtml(packet.targetBuyer)}</small>
        </div>
      </div>
      <section class="metrics">${metrics}</section>
    </header>
    <main>
      <section class="panel">
        <h2>Reality checks</h2>
        <div class="checks">${checks}</div>
      </section>
      <section class="panel">
        <h2>Manifest receipt</h2>
        <div class="receipt-lock">
          <article class="receipt-card">
            <span>${escapeHtml(packet.receipt.algorithm)}</span>
            <code>${escapeHtml(packet.receipt.digest)}</code>
            <code>POST ${escapeHtml(packet.receipt.verificationApiPath)}</code>
            <small>${escapeHtml(packet.receipt.verification)}</small>
            <small>${escapeHtml(`Replay ${packet.receipt.replayVerification.status}: ${packet.receipt.replayVerification.instruction}`)}</small>
            <div class="receipt-actions">
              <button type="button" data-verify-receipt data-verify-api="${escapeHtml(packet.receipt.verificationApiPath)}">Verify receipt</button>
              <a href="${escapeHtml(packet.receipt.payloadHref)}" download="buyer-proof-packet-receipt-payload.json">Download receipt payload</a>
              <a href="${escapeHtml(packet.receipt.verificationRequestHref)}" download="buyer-proof-packet-receipt-verify-request.json">Download verify request</a>
            </div>
            <small class="receipt-status" data-receipt-status>Receipt not checked in this browser yet.</small>
          </article>
          <article class="receipt-card">
            <span>Covered artifacts</span>
            <strong>${escapeHtml(packet.receipt.coveredArtifacts.join(", "))}</strong>
            <small>${escapeHtml(packet.receipt.id)}</small>
          </article>
        </div>
        <div class="receipt-checks">${receiptChecks}</div>
      </section>
      <section class="panel">
        <h2>Evidence rows</h2>
        <p>Each row names the claim, owner, evidence, and artifact a buyer can inspect before approval.</p>
      </section>
      <section class="rows">${rows}</section>
      <section class="panel">
        <h2>Open gaps</h2>
        <ul class="gaps">${gaps}</ul>
      </section>
    </main>
    <footer class="page">Generated by A2A Agent Marketplace as a buyer-facing proof packet.</footer>
    <script type="application/json" id="buyer-proof-receipt-verify-request">${escapeScriptJson(packet.receipt.verificationRequestJson)}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-verify-receipt]");
        const status = document.querySelector("[data-receipt-status]");
        const requestNode = document.getElementById("buyer-proof-receipt-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          button.textContent = "Checking receipt";
          status.className = "receipt-status";
          status.textContent = "Checking manifest digest...";
          try {
            const response = await fetch(button.getAttribute("data-verify-api") || "/api/buyer-proof-packet/receipt/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json();
            if (response.ok && result && result.verification && result.verification.status === "verified") {
              button.textContent = "Receipt verified";
              status.className = "receipt-status good";
              status.textContent = "Digest " + result.verification.actualDigest + " matches this packet.";
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
    </script>
  </body>
</html>`;
}
