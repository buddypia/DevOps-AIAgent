import type { BuyerShareGateProofLink, BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import type { BuyerValueScenario, BuyerValueScenarioStatus } from "./buyerValueScenario.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import { buildWorkflowIntakeReadiness } from "./workflowIntake.js";

export type BuyerPilotAcceptanceDecision = "ready-to-send" | "redline-first" | "hold";
export type BuyerPilotAcceptanceGateId = "scope" | "value-threshold" | "measured-run" | "public-proof" | "data-boundary" | "commercial-cap";

export type BuyerPilotAcceptanceRepairTarget = {
  type: "proof-link";
  fieldId: string;
  label: string;
  currentValue: string;
  href: string;
};

export type BuyerPilotAcceptanceGate = {
  id: BuyerPilotAcceptanceGateId;
  label: string;
  status: BuyerValueScenarioStatus;
  value: string;
  evidence: string;
  acceptance: string;
  fix: string;
  href: string;
  repairTarget?: BuyerPilotAcceptanceRepairTarget;
};

export type BuyerPilotAcceptanceRepairCommand = {
  id: string;
  gateId: BuyerPilotAcceptanceGateId;
  label: string;
  priority: "now" | "next";
  owner: string;
  command: string;
  acceptance: string;
  evidence: string;
  href: string;
  target?: BuyerPilotAcceptanceRepairTarget;
};

export type BuyerPilotAcceptanceContract = {
  id: string;
  decision: BuyerPilotAcceptanceDecision;
  status: BuyerValueScenarioStatus;
  score: number;
  headline: string;
  hardTruth: string;
  buyer: string;
  successMetric: string;
  continueRule: string;
  reviseRule: string;
  stopRule: string;
  proofWindow: string;
  primaryAction: {
    label: string;
    href: string;
  };
  gates: BuyerPilotAcceptanceGate[];
  repairCommands: BuyerPilotAcceptanceRepairCommand[];
  openGateCount: number;
  watchGateCount: number;
  repairPacketText: string;
  exportMarkdown: string;
  copyText: string;
};

export type BuildBuyerPilotAcceptanceContractInput = {
  workOrder: BuyerWorkOrderInput;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  proofLinks: BuyerShareGateProofLink[];
  proofVerification?: BuyerShareGateProofVerificationSummary | null;
  workflowIntakeHref?: string;
  valueReportHref?: string;
  measuredRunHref?: string;
  proofRoomHref?: string;
  launchRoomHref?: string;
};

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function statusScore(status: BuyerValueScenarioStatus) {
  if (status === "clear") return 100;
  if (status === "watch") return 66;
  return 18;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function decisionFrom(gates: BuyerPilotAcceptanceGate[]): BuyerPilotAcceptanceDecision {
  if (gates.some((gate) => gate.status === "blocked")) return "hold";
  if (gates.some((gate) => gate.status === "watch")) return "redline-first";
  return "ready-to-send";
}

function statusFromDecision(decision: BuyerPilotAcceptanceDecision): BuyerValueScenarioStatus {
  if (decision === "ready-to-send") return "clear";
  if (decision === "redline-first") return "watch";
  return "blocked";
}

function headlineFor(decision: BuyerPilotAcceptanceDecision) {
  if (decision === "ready-to-send") return "Buyer can approve a bounded pilot";
  if (decision === "redline-first") return "Redline the pilot terms before sending";
  return "Hold buyer sharing until blockers close";
}

function proofGate(input: BuildBuyerPilotAcceptanceContractInput & { proofRoomHref: string }): BuyerPilotAcceptanceGate {
  if (input.proofVerification) {
    const firstOpen = input.proofVerification.results.find((result) => result.status === "block") ?? input.proofVerification.results.find((result) => result.status === "watch");
    const firstOpenLink = firstOpen ? input.proofLinks.find((link) => link.id === firstOpen.id) : undefined;
    const status: BuyerValueScenarioStatus = input.proofVerification.results.some((result) => result.status === "block")
      ? "blocked"
      : input.proofVerification.results.some((result) => result.status === "watch")
        ? "watch"
        : "clear";
    return {
      id: "public-proof",
      label: "Live proof",
      status,
      value: `${input.proofVerification.verifiedCount}/${input.proofVerification.totalCount} live`,
      evidence: firstOpen ? `${firstOpen.label}: ${firstOpen.evidence}` : "All attached public proof links passed live verification.",
      acceptance: "Reviewer can open every public proof link without private access.",
      fix: firstOpen?.action ?? "Keep verified proof URLs attached.",
      href: input.proofRoomHref,
      repairTarget:
        firstOpen && firstOpenLink
          ? {
              type: "proof-link",
              fieldId: firstOpenLink.id,
              label: firstOpenLink.label,
              currentValue: firstOpenLink.value,
              href: firstOpenLink.href ?? input.proofRoomHref
            }
          : undefined
    };
  }

  const total = Math.max(1, input.proofLinks.length);
  const publicCount = input.proofLinks.filter((link) => isBuyerFacingProofUrl(link.value)).length;
  const firstMissing = input.proofLinks.find((link) => !isBuyerFacingProofUrl(link.value));
  const allPublic = publicCount === input.proofLinks.length && input.proofLinks.length > 0;
  return {
    id: "public-proof",
    label: "Live proof",
    status: allPublic ? "watch" : "blocked",
    value: `${publicCount}/${total} public`,
    evidence: allPublic ? "Public proof URLs are attached but live reachability has not been checked." : `${firstMissing?.label ?? "Proof URL"} is missing or not public.`,
    acceptance: "Run live verification after every proof URL change.",
    fix: allPublic ? "Run Verify live links before sending." : `Attach ${firstMissing?.label ?? "public proof"} before external sharing.`,
    href: input.proofRoomHref,
    repairTarget: firstMissing
      ? {
          type: "proof-link",
          fieldId: firstMissing.id,
          label: firstMissing.label,
          currentValue: firstMissing.value,
          href: firstMissing.href ?? input.proofRoomHref
        }
      : undefined
  };
}

function measuredGate(input: { pilotRun: PilotRunReceiptInput; measuredRunHref: string }): BuyerPilotAcceptanceGate {
  const minutesSaved = Math.max(0, input.pilotRun.observedManualMinutes - input.pilotRun.observedAssistedMinutes);
  const acceptanceRate = Math.round((input.pilotRun.acceptedTasks / Math.max(1, input.pilotRun.totalTasks)) * 100);
  const status: BuyerValueScenarioStatus = minutesSaved >= 30 && acceptanceRate >= 70 ? "clear" : minutesSaved > 0 && acceptanceRate >= 50 ? "watch" : "blocked";
  return {
    id: "measured-run",
    label: "Measured run",
    status,
    value: `${minutesSaved}m saved / ${acceptanceRate}% accepted`,
    evidence: `${input.pilotRun.acceptedTasks}/${input.pilotRun.totalTasks} tasks accepted by ${input.pilotRun.reviewerName || "the reviewer"}.`,
    acceptance: "First run saves at least 30 minutes and at least 70% of tasks are accepted.",
    fix: status === "clear" ? "Use the measured run as the first buyer proof." : "Rerun or narrow the workflow until savings and acceptance clear.",
    href: input.measuredRunHref
  };
}

function dataBoundaryGate(input: { workOrder: BuyerWorkOrderInput; workflowIntakeHref: string }): BuyerPilotAcceptanceGate {
  const status: BuyerValueScenarioStatus = input.workOrder.dataSensitivity === "public" ? "clear" : input.workOrder.dataSensitivity === "internal" ? "watch" : "blocked";
  return {
    id: "data-boundary",
    label: "Data boundary",
    status,
    value: input.workOrder.dataSensitivity,
    evidence:
      input.workOrder.dataSensitivity === "public"
        ? "Pilot can be shown with public or synthetic data."
        : input.workOrder.dataSensitivity === "internal"
          ? "Internal data needs redaction before buyer review."
          : "Restricted data cannot be shared externally.",
    acceptance: "No private customer data, production credential, or restricted payload leaves the workspace.",
    fix: status === "blocked" ? "Redact restricted inputs or keep the pilot internal." : "Confirm the public-safe data boundary in the work order.",
    href: input.workflowIntakeHref
  };
}

function valueGate(input: { buyerScenario: BuyerValueScenario; valueReportHref: string }): BuyerPilotAcceptanceGate {
  const status: BuyerValueScenarioStatus = input.buyerScenario.readiness === "scales-now" ? "clear" : input.buyerScenario.readiness === "pilot-first" ? "watch" : "blocked";
  return {
    id: "value-threshold",
    label: "Value threshold",
    status,
    value: `${yen(input.buyerScenario.monthlyGrossValueYen)} / mo`,
    evidence: `${input.buyerScenario.monthlyHoursSaved}h/month modeled, ${input.buyerScenario.paybackDays}d payback, ${input.buyerScenario.confidenceScore}/100 confidence.`,
    acceptance: "Modeled payback is defensible before the first external pilot ask.",
    fix: status === "clear" ? "Keep the value report attached." : "Tighten ROI assumptions, adoption, or scope before sending.",
    href: input.valueReportHref
  };
}

function commercialGate(input: { buyerScenario: BuyerValueScenario; valueReportHref: string }): BuyerPilotAcceptanceGate {
  const status: BuyerValueScenarioStatus = input.buyerScenario.pilotBudgetCeilingYen <= 0 ? "blocked" : input.buyerScenario.paybackDays <= 45 ? "clear" : input.buyerScenario.paybackDays <= 90 ? "watch" : "blocked";
  return {
    id: "commercial-cap",
    label: "Commercial cap",
    status,
    value: yen(input.buyerScenario.pilotBudgetCeilingYen),
    evidence: `${yen(input.buyerScenario.pilotInvestmentYen)} modeled investment with ${input.buyerScenario.paybackDays}d payback.`,
    acceptance: "First ask stays below the pilot budget ceiling until measured proof clears.",
    fix: status === "blocked" ? "Reduce scope or hold pricing until payback is buyer-safe." : "Keep the first ask capped by measured value.",
    href: input.valueReportHref
  };
}

function scopeGate(input: { workOrder: BuyerWorkOrderInput; buyerScenario: BuyerValueScenario; pilotRun: PilotRunReceiptInput; workflowIntakeHref: string }): BuyerPilotAcceptanceGate {
  const readiness = buildWorkflowIntakeReadiness({
    workOrder: input.workOrder,
    buyerScenario: input.buyerScenario.assumptions,
    pilotRun: input.pilotRun
  });
  const scope = readiness.checks.find((check) => check.id === "scope");
  return {
    id: "scope",
    label: "Buyer scope",
    status: scope?.status ?? "blocked",
    value: input.workOrder.targetUser || "Target buyer missing",
    evidence: scope?.evidence ?? "Workflow scope is missing.",
    acceptance: "One buyer, one workflow request, one baseline, and one success metric are explicit.",
    fix: scope?.fix ?? "Complete the buyer workflow intake.",
    href: input.workflowIntakeHref
  };
}

function hardTruthFor(decision: BuyerPilotAcceptanceDecision, gates: BuyerPilotAcceptanceGate[]) {
  const firstOpen = gates.find((gate) => gate.status === "blocked") ?? gates.find((gate) => gate.status === "watch");
  if (decision === "ready-to-send") return "Scope, value, measured proof, public proof, data boundary, and commercial cap are explicit enough for buyer review.";
  if (decision === "redline-first") return `${firstOpen?.label ?? "One gate"} needs buyer confirmation before this should leave the workspace.`;
  return `${firstOpen?.label ?? "A buyer gate"} blocks external sharing: ${firstOpen?.fix ?? "close the first open gate."}`;
}

function repairCommandForGate(gate: BuyerPilotAcceptanceGate): Omit<BuyerPilotAcceptanceRepairCommand, "id" | "priority" | "evidence" | "href"> {
  if (gate.id === "scope") {
    return {
      gateId: gate.id,
      label: "Rewrite buyer scope",
      owner: "Pilot owner",
      command: "Rewrite the work order with one target buyer, one bounded workflow request, one current baseline, and one success metric.",
      acceptance: "Buyer scope gate returns clear and the primary action no longer points to workflow intake."
    };
  }
  if (gate.id === "public-proof") {
    return {
      gateId: gate.id,
      label: gate.status === "watch" ? "Verify public proof" : "Attach public proof",
      owner: "Proof owner",
      command:
        gate.status === "watch"
          ? "Run Verify live links before sending and attach the latest result to the buyer room."
          : "Attach a public HTTPS proof URL for the missing evidence, then run Verify live links before sending.",
      acceptance: "Live proof gate returns clear and every reviewer link opens without private access."
    };
  }
  if (gate.id === "measured-run") {
    return {
      gateId: gate.id,
      label: "Rerun measured pilot",
      owner: "Pilot reviewer",
      command: "Rerun or narrow the pilot until it saves at least 30 minutes and 70% of tasks are accepted.",
      acceptance: "Measured run gate returns clear with reviewer name, task count, and minutes saved."
    };
  }
  if (gate.id === "data-boundary") {
    return {
      gateId: gate.id,
      label: gate.status === "blocked" ? "Redact restricted data" : "Confirm public-safe data",
      owner: "Security reviewer",
      command:
        gate.status === "blocked"
          ? "Redact restricted inputs or keep the pilot internal until a public-safe version exists."
          : "Confirm the public-safe data boundary and replace internal inputs with redacted or synthetic evidence before sending.",
      acceptance: "Data boundary gate returns clear and no restricted payload is present in the buyer room."
    };
  }
  if (gate.id === "commercial-cap") {
    return {
      gateId: gate.id,
      label: "Reset pilot ask",
      owner: "Commercial owner",
      command: "Reduce scope or pilot ask until payback is buyer-safe and the first ask stays below the pilot budget ceiling.",
      acceptance: "Commercial cap gate returns clear and the first ask is capped by measured value."
    };
  }
  return {
    gateId: gate.id,
    label: "Tighten value proof",
    owner: "Value owner",
    command: "Tighten ROI assumptions, adoption, or workflow scope until payback is defensible before sending.",
    acceptance: "Value threshold gate returns clear or only one redline remains with no blocked gates."
  };
}

function buildRepairCommands(gates: BuyerPilotAcceptanceGate[]): BuyerPilotAcceptanceRepairCommand[] {
  return gates
    .filter((gate) => gate.status !== "clear")
    .map((gate, index) => {
      const repair = repairCommandForGate(gate);
      return {
        ...repair,
        id: `repair-${gate.id}`,
        priority: index === 0 ? "now" : "next",
        evidence: gate.evidence,
        href: gate.href,
        target: gate.repairTarget
      };
    });
}

function buildRepairPacketText(input: Omit<BuyerPilotAcceptanceContract, "copyText" | "exportMarkdown" | "repairPacketText">) {
  if (input.repairCommands.length === 0) {
    return [
      "# Buyer pilot repair packet",
      "",
      `Decision: ${input.decision}`,
      `Buyer: ${input.buyer}`,
      "",
      "No repair commands. Contract is ready to send from the launch room."
    ].join("\n");
  }

  return [
    "# Buyer pilot repair packet",
    "",
    `Decision: ${input.decision}`,
    `Score: ${input.score}/100`,
    `Buyer: ${input.buyer}`,
    `Primary action: ${input.primaryAction.label} (${input.primaryAction.href})`,
    "",
    "## Repair commands",
    ...input.repairCommands.map(
      (repair) =>
        `- [${repair.priority}] ${repair.label}. Owner: ${repair.owner}. Command: ${repair.command} Acceptance: ${repair.acceptance} Evidence: ${repair.evidence} Target: ${repair.target ? `${repair.target.label} (${repair.target.fieldId})` : "none"} Link: ${repair.href}`
    ),
    "",
    "## Send rule",
    "Re-export the acceptance contract after repairs and rerun live proof verification before buyer send."
  ].join("\n");
}

function buildMarkdown(input: Omit<BuyerPilotAcceptanceContract, "copyText" | "exportMarkdown" | "repairPacketText">) {
  return [
    `# ${input.headline}`,
    "",
    `Decision: ${input.decision}`,
    `Score: ${input.score}/100`,
    `Buyer: ${input.buyer}`,
    `Success metric: ${input.successMetric}`,
    `Primary action: ${input.primaryAction.label} (${input.primaryAction.href})`,
    "",
    input.hardTruth,
    "",
    "## Acceptance gates",
    ...input.gates.map((gate) => `- [${gate.status}] ${gate.label}: ${gate.value}. Evidence: ${gate.evidence} Acceptance: ${gate.acceptance} Fix: ${gate.fix}`),
    "",
    ...(input.repairCommands.length > 0
      ? [
          "## Repair commands",
          ...input.repairCommands.map((repair) => `- [${repair.priority}] ${repair.label}: ${repair.command} Acceptance: ${repair.acceptance}`)
        ]
      : ["## Repair commands", "- none"]),
    "",
    "## Decision rules",
    `- Continue: ${input.continueRule}`,
    `- Revise: ${input.reviseRule}`,
    `- Stop: ${input.stopRule}`,
    "",
    `Proof window: ${input.proofWindow}`
  ].join("\n");
}

export function buildBuyerPilotAcceptanceContract(input: BuildBuyerPilotAcceptanceContractInput): BuyerPilotAcceptanceContract {
  const workflowIntakeHref = input.workflowIntakeHref ?? "#quick-workflow-intake";
  const valueReportHref = input.valueReportHref ?? "#buyer-value-simulator";
  const measuredRunHref = input.measuredRunHref ?? "#pilot-run-receipt";
  const proofRoomHref = input.proofRoomHref ?? "#buyer-proof-command";
  const launchRoomHref = input.launchRoomHref ?? "#buyer-proof-command";
  const gates: BuyerPilotAcceptanceGate[] = [
    scopeGate({ workOrder: input.workOrder, buyerScenario: input.buyerScenario, pilotRun: input.pilotRun, workflowIntakeHref }),
    valueGate({ buyerScenario: input.buyerScenario, valueReportHref }),
    measuredGate({ pilotRun: input.pilotRun, measuredRunHref }),
    proofGate({ ...input, proofRoomHref }),
    dataBoundaryGate({ workOrder: input.workOrder, workflowIntakeHref }),
    commercialGate({ buyerScenario: input.buyerScenario, valueReportHref })
  ];
  const decision = decisionFrom(gates);
  const status = statusFromDecision(decision);
  const score = Math.round(average(gates.map((gate) => statusScore(gate.status))));
  const firstOpen = gates.find((gate) => gate.status === "blocked") ?? gates.find((gate) => gate.status === "watch");
  const repairCommands = buildRepairCommands(gates);
  const partial: Omit<BuyerPilotAcceptanceContract, "copyText" | "exportMarkdown" | "repairPacketText"> = {
    id: `buyer-pilot-acceptance-${decision}-${score}`,
    decision,
    status,
    score,
    headline: headlineFor(decision),
    hardTruth: hardTruthFor(decision, gates),
    buyer: input.workOrder.targetUser || input.buyerScenario.id || "Buyer sponsor",
    successMetric: input.workOrder.successMetric,
    continueRule: `Continue only if ${input.workOrder.successMetric || "the agreed success metric"} clears and every gate is clear.`,
    reviseRule: "Revise when exactly one gate is watch and no gate is blocked.",
    stopRule: `Stop if any gate is blocked, measured savings fall to 0 minutes, or payback exceeds ${Math.max(90, input.buyerScenario.paybackDays)} days.`,
    proofWindow: "Re-run live proof verification after changing any public proof URL and before buyer send.",
    primaryAction: {
      label: firstOpen ? `Fix ${firstOpen.label}` : "Open launch room",
      href: firstOpen?.href ?? launchRoomHref
    },
    gates,
    repairCommands,
    openGateCount: gates.filter((gate) => gate.status === "blocked").length,
    watchGateCount: gates.filter((gate) => gate.status === "watch").length
  };
  const exportMarkdown = buildMarkdown(partial);
  const repairPacketText = buildRepairPacketText(partial);
  return {
    ...partial,
    repairPacketText,
    exportMarkdown,
    copyText: exportMarkdown
  };
}
