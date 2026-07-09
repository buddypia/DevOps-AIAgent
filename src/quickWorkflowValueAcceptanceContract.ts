import type { QuickWorkflowCommercialPilotOffer, QuickWorkflowInputReadiness, QuickWorkflowValueDiagnosis } from "./QuickWorkflowIntakePanel";
import {
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
  QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
  quickWorkflowValueAcceptanceContractChecksum,
  quickWorkflowValueAcceptanceContractPayloadJson,
  quickWorkflowValueAcceptanceContractRequestJson,
  quickWorkflowValueAcceptanceContractVerifierHref,
  type QuickWorkflowValueAcceptanceContractReceiptPayload
} from "./quickWorkflowValueAcceptanceContractReceipt";
import type { WorkflowIntakeDraft } from "./workflowIntakeDraft";

type ContractStatus = QuickWorkflowInputReadiness["status"];

export type QuickWorkflowValueAcceptanceGate = {
  id: "value-floor" | "proof-receipt" | "data-boundary" | "buyer-commitment" | "commercial-cap" | "stop-rule";
  label: string;
  status: ContractStatus;
  owner: string;
  requirement: string;
  evidence: string;
  action: string;
};

export type QuickWorkflowValueAcceptanceContract = {
  status: ContractStatus;
  decision: "Issue value acceptance contract" | "Draft contract internally" | "Do not contract yet";
  headline: string;
  summary: string;
  buyer: string;
  workflow: string;
  pilotWindow: "14-day proof pilot";
  valueFloorYen: number;
  stopLossYen: number;
  suggestedPilotPriceYen: number;
  acceptanceLine: string;
  creditLine: string;
  nextAction: string;
  gates: QuickWorkflowValueAcceptanceGate[];
  ownerActions: QuickWorkflowValueAcceptanceGate[];
  receipt: {
    receiptId: string;
    receiptVersion: typeof QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION;
    checksumAlgorithm: "fnv1a32";
    checksum: string;
    verificationApiPath: typeof QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH;
    payloadJson: string;
    payloadHref: string;
    verificationRequestJson: string;
    verificationRequestHref: string;
    verifierHref: string;
  };
  exportMarkdown: string;
  exportHref: string;
};

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function trimSentence(value: string, fallback: string) {
  const compact = value.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  return compact || fallback;
}

function roundedYen(value: number, unit = 1000) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / unit) * unit;
}

function gateScore(status: ContractStatus) {
  if (status === "ready") return 2;
  if (status === "watch") return 1;
  return 0;
}

function statusFromGates(gates: QuickWorkflowValueAcceptanceGate[], offer: QuickWorkflowCommercialPilotOffer): ContractStatus {
  if (offer.suggestedPilotPriceYen <= 0 || gates.some((gate) => gate.status === "blocked" && ["value-floor", "commercial-cap", "stop-rule"].includes(gate.id))) {
    return "blocked";
  }
  if (offer.status === "ready" && gates.every((gate) => gate.status === "ready")) return "ready";
  return "watch";
}

export function buildQuickWorkflowValueAcceptanceContract(input: {
  draft: WorkflowIntakeDraft;
  readiness: QuickWorkflowInputReadiness;
  valueDiagnosis: QuickWorkflowValueDiagnosis;
  commercialPilotOffer: QuickWorkflowCommercialPilotOffer;
}): QuickWorkflowValueAcceptanceContract {
  const { draft, readiness, valueDiagnosis, commercialPilotOffer } = input;
  const buyer = trimSentence(draft.workOrder.targetUser || "Target buyer", "Target buyer");
  const workflow = trimSentence(draft.workOrder.request || "the named workflow", "the named workflow");
  const successMetric = trimSentence(draft.workOrder.successMetric || "the named success metric", "the named success metric");
  const dataBoundary = readiness.items.find((item) => item.id === "data-boundary");
  const valueFloorYen =
    commercialPilotOffer.suggestedPilotPriceYen > 0 && valueDiagnosis.monthlyValueYen > 0
      ? Math.max(commercialPilotOffer.suggestedPilotPriceYen, roundedYen(valueDiagnosis.monthlyValueYen * 0.7))
      : 0;
  const stopLossYen =
    commercialPilotOffer.suggestedPilotPriceYen > 0 && valueDiagnosis.monthlyValueYen > 0
      ? Math.max(commercialPilotOffer.suggestedPilotPriceYen, roundedYen(valueDiagnosis.monthlyValueYen * 0.45))
      : 0;
  const proofStatus: ContractStatus =
    valueDiagnosis.proofReadyCount >= 5 && valueDiagnosis.proofRepairCount === 0 ? "ready" : valueDiagnosis.proofReadyCount > 0 ? "watch" : "blocked";
  const valueStatus: ContractStatus =
    commercialPilotOffer.suggestedPilotPriceYen > 0 && valueDiagnosis.monthlyValueYen >= 250000 && valueFloorYen > 0
      ? "ready"
      : valueDiagnosis.monthlyValueYen > 0
        ? "watch"
        : "blocked";
  const capStatus: ContractStatus =
    commercialPilotOffer.suggestedPilotPriceYen > 0 && valueDiagnosis.pilotBudgetCeilingYen >= commercialPilotOffer.suggestedPilotPriceYen
      ? "ready"
      : valueDiagnosis.pilotBudgetCeilingYen > 0
        ? "watch"
        : "blocked";
  const buyerCommitmentStatus: ContractStatus = readiness.status === "ready" ? "ready" : readiness.status === "watch" ? "watch" : "blocked";
  const gates: QuickWorkflowValueAcceptanceGate[] = [
    {
      id: "value-floor",
      label: "Accepted value floor",
      status: valueStatus,
      owner: "Pilot sponsor",
      requirement: valueFloorYen > 0 ? `${formatYen(valueFloorYen)}/month accepted value by Day 30` : "A non-zero accepted value floor",
      evidence:
        valueDiagnosis.monthlyValueYen > 0
          ? `${formatYen(valueDiagnosis.monthlyValueYen)}/month measured value from extracted run economics.`
          : "Measured monthly value is missing.",
      action: valueStatus === "ready" ? "Attach the value diagnosis and Day 30 review to the buyer room." : valueDiagnosis.nextAction
    },
    {
      id: "proof-receipt",
      label: "Live proof receipt",
      status: proofStatus,
      owner: "Proof owner",
      requirement: "All five public proof URLs pass live verification before buyer send",
      evidence: `${valueDiagnosis.proofReadyCount}/5 proof URLs ready; ${valueDiagnosis.proofRepairCount} still need repair.`,
      action: proofStatus === "ready" ? "Run live proof verification and attach the receipt." : "Close every public proof repair item before external send."
    },
    {
      id: "data-boundary",
      label: "Data boundary",
      status: dataBoundary?.status ?? "blocked",
      owner: "Security reviewer",
      requirement: "Only public-safe or explicitly approved evidence enters the buyer room",
      evidence: dataBoundary?.evidence ?? "Data boundary is missing.",
      action: dataBoundary?.status === "ready" ? "Keep the redacted evidence boundary in the contract." : dataBoundary?.action ?? "State the data boundary."
    },
    {
      id: "buyer-commitment",
      label: "Buyer commitment",
      status: buyerCommitmentStatus,
      owner: "Buyer owner",
      requirement: "Buyer names a continue, revise, or stop decision path before kickoff",
      evidence: readiness.headline,
      action: buyerCommitmentStatus === "ready" ? "Use the decision packet as the kickoff agenda." : readiness.nextAction
    },
    {
      id: "commercial-cap",
      label: "Commercial cap",
      status: capStatus,
      owner: commercialPilotOffer.owner,
      requirement:
        commercialPilotOffer.suggestedPilotPriceYen > 0
          ? `${formatYen(commercialPilotOffer.suggestedPilotPriceYen)} price under ${formatYen(valueDiagnosis.pilotBudgetCeilingYen)} cap`
          : "A priced pilot below the value-backed cap",
      evidence: commercialPilotOffer.guardrail,
      action: capStatus === "ready" ? "Attach the commercial offer and cap to the approval packet." : commercialPilotOffer.nextAction
    },
    {
      id: "stop-rule",
      label: "Stop rule",
      status: commercialPilotOffer.suggestedPilotPriceYen > 0 ? "ready" : "blocked",
      owner: "Finance owner",
      requirement: stopLossYen > 0 ? `Stop expansion if realized value falls below ${formatYen(stopLossYen)}/month` : "A stop rule tied to measured value",
      evidence: commercialPilotOffer.acceptance,
      action:
        commercialPilotOffer.suggestedPilotPriceYen > 0
          ? "Put the stop rule in the buyer decision packet before kickoff."
          : "Do not write a paid stop rule until the workflow has a defensible price."
    }
  ];
  const status = statusFromGates(gates, commercialPilotOffer);
  const decision: QuickWorkflowValueAcceptanceContract["decision"] =
    status === "ready" ? "Issue value acceptance contract" : status === "watch" ? "Draft contract internally" : "Do not contract yet";
  const headline =
    status === "ready"
      ? "Value acceptance contract is ready"
      : status === "watch"
        ? "Contract terms are useful, but buyer send is gated"
        : "Do not turn this workflow into a paid contract yet";
  const firstOpenGate = gates.find((gate) => gate.status !== "ready");
  const ownerActions = gates.filter((gate) => gate.status !== "ready").sort((left, right) => gateScore(left.status) - gateScore(right.status)).slice(0, 3);
  const nextAction = firstOpenGate?.action ?? "Attach the value contract to the buyer decision packet.";
  const acceptanceLine =
    valueFloorYen > 0
      ? `${buyer} accepts the 14-day proof pilot only when ${successMetric} and at least ${formatYen(valueFloorYen)}/month accepted value are recorded.`
      : "No paid acceptance line until the value floor and pilot price are defensible.";
  const creditLine =
    stopLossYen > 0
      ? `If Day 30 realized value is below ${formatYen(stopLossYen)}/month, the next sprint becomes repair work and expansion stays blocked.`
      : "No expansion, renewal, or paid follow-on until a measured value floor exists.";
  const summary =
    status === "ready"
      ? `${commercialPilotOffer.priceLine} has acceptance, proof, cap, and stop-rule gates a buyer can inspect.`
      : status === "watch"
        ? `${commercialPilotOffer.priceLine} can be drafted, but ${firstOpenGate?.label ?? "one contract gate"} must close before buyer send.`
        : valueDiagnosis.monthlyValueYen > 0
          ? `${formatYen(valueDiagnosis.monthlyValueYen)}/month is not enough to make the contract safe yet.`
          : "The workflow still lacks measured value, proof, or a priced pilot.";
  const payload: QuickWorkflowValueAcceptanceContractReceiptPayload = {
    receiptVersion: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
    source: "quick-workflow-intake",
    buyer,
    workflow,
    status,
    decision,
    pilotWindow: "14-day proof pilot",
    suggestedPilotPriceYen: commercialPilotOffer.suggestedPilotPriceYen,
    valueFloorYen,
    stopLossYen,
    readinessScore: readiness.score,
    commercialStatus: commercialPilotOffer.status,
    acceptanceLine,
    creditLine,
    nextAction,
    gateStatuses: gates.map((gate) => ({ id: gate.id, status: gate.status, owner: gate.owner, requirement: gate.requirement }))
  };
  const payloadJson = quickWorkflowValueAcceptanceContractPayloadJson(payload);
  const checksum = quickWorkflowValueAcceptanceContractChecksum(payload);
  const verificationRequestJson = quickWorkflowValueAcceptanceContractRequestJson({ checksum, payload });
  const receiptId = `quick-value-contract-${checksum}`;
  const exportMarkdown = [
    "# Quick workflow value acceptance contract",
    "",
    headline,
    summary,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Buyer: ${buyer}`,
    `Workflow: ${workflow}`,
    `Pilot window: 14-day proof pilot`,
    `Pilot price: ${commercialPilotOffer.priceLine}`,
    `Accepted value floor: ${valueFloorYen > 0 ? `${formatYen(valueFloorYen)}/month` : "not ready"}`,
    `Stop rule: ${stopLossYen > 0 ? `${formatYen(stopLossYen)}/month` : "not ready"}`,
    `Acceptance: ${acceptanceLine}`,
    `Credit rule: ${creditLine}`,
    `Next action: ${nextAction}`,
    `Receipt: ${receiptId} / fnv1a32:${checksum}`,
    "",
    "## Contract gates",
    ...gates.map((gate) => `- [${gate.status}] ${gate.label}: ${gate.requirement}. Owner: ${gate.owner}. Evidence: ${gate.evidence} Action: ${gate.action}`),
    "",
    "## Owner actions",
    ...(ownerActions.length > 0 ? ownerActions.map((gate) => `- ${gate.owner}: ${gate.action}`) : ["- Pilot sponsor: attach the contract to the buyer decision packet."])
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    buyer,
    workflow,
    pilotWindow: "14-day proof pilot",
    valueFloorYen,
    stopLossYen,
    suggestedPilotPriceYen: commercialPilotOffer.suggestedPilotPriceYen,
    acceptanceLine,
    creditLine,
    nextAction,
    gates,
    ownerActions,
    receipt: {
      receiptId,
      receiptVersion: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_RECEIPT_VERSION,
      checksumAlgorithm: "fnv1a32",
      checksum,
      verificationApiPath: QUICK_WORKFLOW_VALUE_ACCEPTANCE_CONTRACT_VERIFY_PATH,
      payloadJson,
      payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
      verificationRequestJson,
      verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
      verifierHref: quickWorkflowValueAcceptanceContractVerifierHref(verificationRequestJson)
    },
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
