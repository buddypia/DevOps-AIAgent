import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { BuyerValueScenarioInput } from "./buyerValueScenario.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type BuyerProofRepairStatus = "ready" | "attention" | "blocked";
export type BuyerProofRepairOwnership = "buyer-owned" | "reference" | "missing";

export type BuyerProofRepairProofKey = "targetUrl" | "protopediaUrl" | "videoUrl" | "pilotEvidenceUrl" | "workOrderEvidenceUrl";

export type BuyerProofRepairPatch = {
  proofIntake?: Partial<Record<BuyerProofRepairProofKey, string>>;
  buyerScenario?: Partial<BuyerValueScenarioInput>;
  pilotRun?: Partial<PilotRunReceiptInput>;
  buyerWorkOrder?: Partial<BuyerWorkOrderInput>;
  agentTrialEvidence?: AgentTrialEvidenceRecord[];
};

export type BuyerProofRepairQueueItem = {
  id: "public-product" | "work-order" | "measured-run" | "a2a-trial" | "walkthrough" | "protopedia";
  label: string;
  status: BuyerProofRepairStatus;
  ownership: BuyerProofRepairOwnership;
  priority: "now" | "next" | "done";
  decisionLift: number;
  buyerGate: string;
  owner: string;
  problem: string;
  action: string;
  proof: string;
  impact: string;
  valueAtStake: string;
  riskIfIgnored: string;
  buttonLabel: string;
  patch?: BuyerProofRepairPatch;
};

type BuyerProofRepairQueueItemBase = Omit<BuyerProofRepairQueueItem, "decisionLift" | "buyerGate" | "valueAtStake" | "riskIfIgnored">;

export type BuyerProofRepairQueue = {
  status: BuyerProofRepairStatus;
  headline: string;
  summary: string;
  readyCount: number;
  openCount: number;
  blockedCount: number;
  referenceCount: number;
  recoverableDecisionLift: number;
  totalCount: number;
  firstAction: string;
  highestImpactItem: Pick<BuyerProofRepairQueueItem, "id" | "label" | "decisionLift" | "action" | "riskIfIgnored"> | null;
  items: BuyerProofRepairQueueItem[];
  exportMarkdown: string;
};

export type BuyerProofRepairProjectionItem = {
  id: BuyerProofRepairQueueItem["id"];
  label: string;
  owner: string;
  beforeStatus: BuyerProofRepairStatus;
  afterStatus: BuyerProofRepairStatus;
  afterPriority: BuyerProofRepairQueueItem["priority"];
  beforeOwnership: BuyerProofRepairOwnership;
  afterOwnership: BuyerProofRepairOwnership;
  decisionLiftRecovered: number;
  remainingDecisionLift: number;
  replacementTarget: string;
  acceptanceCriteria: string;
  remainingRisk: string;
  actionAfterApply: string;
};

export type BuyerProofRepairProjectionWorkOrder = {
  id: BuyerProofRepairQueueItem["id"];
  label: string;
  priority: "now" | "next";
  owner: string;
  decisionLiftAtStake: number;
  proofState: BuyerProofRepairOwnership;
  proofStatus: BuyerProofRepairStatus;
  shareGate: string;
  inputHref: string;
  inputLabel: string;
  proofSlot: string;
  target: string;
  action: string;
  acceptanceCriteria: string;
  risk: string;
  doneSignal: string;
};

export type BuyerProofRepairProjectionWorkOrderPacket = {
  filename: string;
  href: string;
  markdown: string;
  csvFilename: string;
  csvText: string;
  csvHref: string;
  nowCount: number;
  nextCount: number;
  firstTask: Pick<BuyerProofRepairProjectionWorkOrder, "id" | "label" | "inputHref" | "inputLabel"> | null;
  workOrders: BuyerProofRepairProjectionWorkOrder[];
};

export type BuyerProofRepairOperatorBriefTask = Pick<
  BuyerProofRepairProjectionWorkOrder,
  "id" | "label" | "priority" | "owner" | "decisionLiftAtStake" | "inputHref" | "inputLabel" | "target" | "acceptanceCriteria" | "doneSignal"
>;

export type BuyerProofRepairOperatorBrief = {
  status: "send-ready" | "locked";
  headline: string;
  summary: string;
  firstOwner: string;
  firstAction: string;
  firstInputHref: string;
  firstInputLabel: string;
  shareRule: string;
  acceptanceChecklist: string[];
  topTasks: BuyerProofRepairOperatorBriefTask[];
  message: string;
  filename: string;
  href: string;
  markdown: string;
};

export type BuyerProofRepairPublicShareBlockingGate = {
  id: BuyerProofRepairQueueItem["id"];
  label: string;
  owner: string;
  proofState: BuyerProofRepairOwnership;
  proofStatus: BuyerProofRepairStatus;
  decisionLiftAtStake: number;
  inputHref: string;
  inputLabel: string;
  reason: string;
  replacementTarget: string;
};

export type BuyerProofRepairPublicShareLock = {
  status: "locked" | "ready";
  headline: string;
  summary: string;
  instruction: string;
  buyerOwnedCount: number;
  totalCount: number;
  referenceCount: number;
  missingCount: number;
  blockerCount: number;
  nextTask: Pick<BuyerProofRepairProjectionItem, "id" | "label" | "owner" | "replacementTarget"> | null;
  blockingGates: BuyerProofRepairPublicShareBlockingGate[];
};

export type BuyerProofRepairProjection = {
  status: BuyerProofRepairStatus;
  headline: string;
  summary: string;
  shareInstruction: string;
  appliedFixCount: number;
  currentBlockedCount: number;
  projectedBlockedCount: number;
  currentOpenCount: number;
  projectedOpenCount: number;
  currentReferenceCount: number;
  projectedReferenceCount: number;
  closedByAvailableFixes: number;
  decisionLiftRecovered: number;
  remainingDecisionLift: number;
  nextActionAfterApply: string;
  requiredReplacements: BuyerProofRepairProjectionItem[];
  publicShareLock: BuyerProofRepairPublicShareLock;
  workOrderPacket: BuyerProofRepairProjectionWorkOrderPacket;
  operatorBrief: BuyerProofRepairOperatorBrief;
  items: BuyerProofRepairProjectionItem[];
};

function hasPatchValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

export function hasBuyerProofRepairPatch(patch: BuyerProofRepairPatch | undefined): patch is BuyerProofRepairPatch {
  return Boolean(
    patch &&
      (hasPatchValue(patch.proofIntake) ||
        hasPatchValue(patch.buyerScenario) ||
        hasPatchValue(patch.pilotRun) ||
        hasPatchValue(patch.buyerWorkOrder) ||
        hasPatchValue(patch.agentTrialEvidence))
  );
}

export function mergeBuyerProofRepairPatches(items: BuyerProofRepairQueueItem[]): BuyerProofRepairPatch {
  const merged: BuyerProofRepairPatch = {};
  const evidenceById = new Map<string, AgentTrialEvidenceRecord>();

  for (const item of items) {
    if (item.status === "ready" || !hasBuyerProofRepairPatch(item.patch)) continue;
    if (item.patch.proofIntake) merged.proofIntake = { ...merged.proofIntake, ...item.patch.proofIntake };
    if (item.patch.buyerScenario) merged.buyerScenario = { ...merged.buyerScenario, ...item.patch.buyerScenario };
    if (item.patch.pilotRun) merged.pilotRun = { ...merged.pilotRun, ...item.patch.pilotRun };
    if (item.patch.buyerWorkOrder) merged.buyerWorkOrder = { ...merged.buyerWorkOrder, ...item.patch.buyerWorkOrder };
    for (const record of item.patch.agentTrialEvidence ?? []) {
      evidenceById.set(record.id, record);
    }
  }

  if (evidenceById.size > 0) merged.agentTrialEvidence = [...evidenceById.values()];
  return merged;
}

export function applyBuyerProofRepairPatchToWorkspace(current: WorkspaceDraft, patch: BuyerProofRepairPatch): WorkspaceDraft {
  const proofIntake = patch.proofIntake ?? {};
  const buyerWorkOrder = {
    ...current.buyerWorkOrder,
    ...patch.buyerWorkOrder,
    ...(proofIntake.workOrderEvidenceUrl !== undefined ? { evidenceUrl: proofIntake.workOrderEvidenceUrl } : {})
  };
  const pilotRun = {
    ...current.pilotRun,
    ...patch.pilotRun,
    ...(proofIntake.pilotEvidenceUrl !== undefined ? { evidenceUrl: proofIntake.pilotEvidenceUrl } : {})
  };
  const agentTrialEvidenceById = new Map(current.agentTrialEvidence.map((record) => [record.id, record]));
  for (const record of patch.agentTrialEvidence ?? []) {
    agentTrialEvidenceById.set(record.id, record);
  }

  return {
    ...current,
    buyerScenario: { ...current.buyerScenario, ...patch.buyerScenario },
    buyerWorkOrder,
    pilotRun,
    agentTrialEvidence: [...agentTrialEvidenceById.values()],
    targetUrl: proofIntake.targetUrl ?? current.targetUrl,
    protopediaUrl: proofIntake.protopediaUrl ?? current.protopediaUrl,
    videoUrl: proofIntake.videoUrl ?? current.videoUrl,
    proofVerification: patch.proofIntake ? null : current.proofVerification
  };
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function normalized(value: string | undefined) {
  return value?.trim() ?? "";
}

function sameText(left: string | undefined, right: string | undefined) {
  const normalizedLeft = normalized(left);
  const normalizedRight = normalized(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function shortUrl(value: string | undefined, fallback = "missing") {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 64 ? `${trimmed.slice(0, 61)}...` : trimmed;
}

function ownershipFromProof(hasProof: boolean, isReference: boolean): BuyerProofRepairOwnership {
  if (!hasProof) return "missing";
  return isReference ? "reference" : "buyer-owned";
}

function statusFromOwnership(ownership: BuyerProofRepairOwnership, patchAvailable: boolean): BuyerProofRepairStatus {
  if (ownership === "buyer-owned") return "ready";
  if (ownership === "reference") return "attention";
  return patchAvailable ? "blocked" : "attention";
}

function priorityFor(status: BuyerProofRepairStatus): BuyerProofRepairQueueItem["priority"] {
  if (status === "ready") return "done";
  if (status === "blocked") return "now";
  return "next";
}

const DECISION_LIFT_WEIGHT: Record<BuyerProofRepairQueueItem["id"], number> = {
  "public-product": 24,
  "work-order": 22,
  "measured-run": 25,
  "a2a-trial": 20,
  walkthrough: 8,
  protopedia: 7
};

function buyerGateFor(id: BuyerProofRepairQueueItem["id"]) {
  if (id === "public-product") return "Public inspection";
  if (id === "work-order") return "Real workflow";
  if (id === "measured-run") return "Measured value";
  if (id === "a2a-trial") return "Agent autonomy";
  if (id === "walkthrough") return "Reviewer comprehension";
  return "Submission story";
}

function valueAtStakeFor(id: BuyerProofRepairQueueItem["id"]) {
  if (id === "public-product") return "Buyer can open the product without a private tour.";
  if (id === "work-order") return "Value claim stays tied to a named workflow and target user.";
  if (id === "measured-run") return "Modeled ROI becomes a buyer-observed outcome.";
  if (id === "a2a-trial") return "The agent claim is backed by accepted delegated work.";
  if (id === "walkthrough") return "A remote reviewer can understand the workflow in one pass.";
  return "The public story connects the launch room to the submission surface.";
}

function riskIfIgnoredFor(id: BuyerProofRepairQueueItem["id"], ownership: BuyerProofRepairOwnership) {
  const prefix = ownership === "reference" ? "Reference proof can mislead the buyer: " : "";
  if (id === "public-product") return `${prefix}the room cannot prove the product is reachable from outside the workspace.`;
  if (id === "work-order") return `${prefix}the offer still reads like a showcase instead of a scoped buyer workflow.`;
  if (id === "measured-run") return `${prefix}the value story remains modeled and procurement has no observed run to trust.`;
  if (id === "a2a-trial") return `${prefix}the AI-agent claim looks cosmetic because no accepted delegated work is attached.`;
  if (id === "walkthrough") return "Reviewers must infer the workflow from artifacts instead of seeing the path end to end.";
  return "The submission story and launch room can drift, weakening external credibility.";
}

function decisionLiftFor(item: BuyerProofRepairQueueItemBase) {
  if (item.status === "ready") return 0;
  const weight = DECISION_LIFT_WEIGHT[item.id];
  if (item.ownership === "reference") return Math.ceil(weight * 0.65);
  if (item.status === "attention") return Math.ceil(weight * 0.45);
  return weight;
}

function addDecisionImpact(item: BuyerProofRepairQueueItemBase): BuyerProofRepairQueueItem {
  return {
    ...item,
    decisionLift: decisionLiftFor(item),
    buyerGate: buyerGateFor(item.id),
    valueAtStake: valueAtStakeFor(item.id),
    riskIfIgnored: riskIfIgnoredFor(item.id, item.ownership)
  };
}

function minutesSaved(input: PilotRunReceiptInput) {
  return input.observedManualMinutes - input.observedAssistedMinutes;
}

function buildMarkdown(queue: Omit<BuyerProofRepairQueue, "exportMarkdown">) {
  return [
    "# Buyer proof repair queue",
    "",
    `Status: ${queue.status}`,
    `Ready: ${queue.readyCount}/${queue.totalCount}`,
    `Open: ${queue.openCount}`,
    `Blocked: ${queue.blockedCount}`,
    `Reference: ${queue.referenceCount}`,
    `Recoverable decision lift: ${queue.recoverableDecisionLift}`,
    "",
    queue.summary,
    "",
    "## Repair items",
    ...queue.items.map(
      (item) =>
        `- [${item.status}/${item.ownership}] +${item.decisionLift} ${item.label}: ${item.action} (${item.owner}) Gate: ${item.buyerGate}. Risk: ${item.riskIfIgnored}`
    ),
    "",
    `First action: ${queue.firstAction}`
  ].join("\n");
}

function projectionHeadline(input: { appliedFixCount: number; projectedQueue: BuyerProofRepairQueue }) {
  if (input.appliedFixCount === 0) {
    return input.projectedQueue.status === "ready" ? "No automatic proof repair is needed" : "No automatic proof repair is available";
  }
  if (input.projectedQueue.status === "ready") return "Available fixes can close the repair queue";
  if (input.projectedQueue.blockedCount > 0) return "Available fixes still leave blockers";
  if (input.projectedQueue.referenceCount > 0) return "Available fixes create a rehearsal room, not final buyer proof";
  return "Available fixes reduce risk, then live verification remains";
}

function projectionShareInstruction(queue: BuyerProofRepairQueue) {
  if (queue.status === "ready") return "Buyer sharing can move to live verification and launch-room review.";
  if (queue.referenceCount > 0) return "Keep the room internal until every reference item is replaced with buyer-owned proof.";
  if (queue.blockedCount > 0) return "Do not share externally; blockers remain after the available fixes.";
  return "Review the remaining watch items before sending the buyer room.";
}

function buildProjectionSummary(input: {
  appliedFixCount: number;
  currentQueue: BuyerProofRepairQueue;
  projectedQueue: BuyerProofRepairQueue;
  decisionLiftRecovered: number;
  closedByAvailableFixes: number;
}) {
  if (input.appliedFixCount === 0) {
    return input.projectedQueue.status === "ready"
      ? "The current workspace already has the proof queue closed; no reference fix should be applied."
      : "The remaining proof gaps require buyer-owned URLs or evidence that cannot be auto-filled.";
  }
  const blockerDelta = Math.max(0, input.currentQueue.blockedCount - input.projectedQueue.blockedCount);
  return `Applying ${input.appliedFixCount} available fix${input.appliedFixCount === 1 ? "" : "es"} removes ${blockerDelta} blocker${blockerDelta === 1 ? "" : "s"}, closes ${input.closedByAvailableFixes} item${input.closedByAvailableFixes === 1 ? "" : "s"}, and recovers ${input.decisionLiftRecovered} decision-lift points.`;
}

function replacementTargetFor(id: BuyerProofRepairQueueItem["id"]) {
  if (id === "public-product") return "Paste the deployed product URL into Live product.";
  if (id === "work-order") return "Paste the buyer-approved work-order proof URL and target user.";
  if (id === "measured-run") return "Paste the buyer-observed pilot receipt URL, reviewer, and accepted task count.";
  if (id === "a2a-trial") return "Attach an accepted A2A trial receipt from this buyer workflow.";
  if (id === "walkthrough") return "Paste a public or unlisted walkthrough URL.";
  return "Paste the published ProtoPedia story URL.";
}

function acceptanceCriteriaFor(id: BuyerProofRepairQueueItem["id"]) {
  if (id === "public-product") return "A clean browser can open the HTTPS product URL, and it is not a reference or sample path.";
  if (id === "work-order") return "The proof names the target user, workflow request, success metric, data boundary, and owner.";
  if (id === "measured-run") return "The receipt shows time saved, named reviewer, public evidence URL, and accepted task output.";
  if (id === "a2a-trial") return "The receipt status is accepted and proves delegated agent work for this workflow.";
  if (id === "walkthrough") return "The video shows the buyer workflow from request to proof without private explanation.";
  return "The story links the product, system diagram, video, and buyer proof narrative under the submission tag.";
}

function executionTargetFor(id: BuyerProofRepairQueueItem["id"]) {
  if (id === "public-product") {
    return {
      inputHref: "#launch-evidence-console",
      inputLabel: "Open live URL",
      proofSlot: "Live product URL",
      doneSignal: "Buyer-owned HTTPS product URL replaces the reference URL."
    };
  }
  if (id === "work-order") {
    return {
      inputHref: "#buyer-work-order-studio",
      inputLabel: "Open work order",
      proofSlot: "Work-order evidence URL",
      doneSignal: "Buyer-approved scope and public work-order evidence are attached."
    };
  }
  if (id === "measured-run") {
    return {
      inputHref: "#pilot-run-receipt",
      inputLabel: "Open receipt",
      proofSlot: "Pilot receipt URL",
      doneSignal: "Buyer-observed run, reviewer, accepted task count, and receipt URL are attached."
    };
  }
  if (id === "a2a-trial") {
    return {
      inputHref: "#buyer-a2a-trial-intake",
      inputLabel: "Open A2A receipt",
      proofSlot: "Accepted A2A trial receipt",
      doneSignal: "Accepted buyer-workflow A2A receipt replaces starter trial evidence."
    };
  }
  if (id === "walkthrough") {
    return {
      inputHref: "#launch-evidence-console",
      inputLabel: "Open video URL",
      proofSlot: "Walkthrough video URL",
      doneSignal: "Public or unlisted walkthrough shows the buyer workflow end to end."
    };
  }
  return {
    inputHref: "#launch-evidence-console",
    inputLabel: "Open story URL",
    proofSlot: "ProtoPedia story URL",
    doneSignal: "Published ProtoPedia story links product, diagram, video, and buyer proof."
  };
}

function workOrderPriorityFor(item: BuyerProofRepairProjectionItem): BuyerProofRepairProjectionWorkOrder["priority"] {
  if (item.afterStatus === "blocked" || item.remainingDecisionLift >= 13) return "now";
  return "next";
}

function shareGateForWorkOrder(item: BuyerProofRepairProjectionItem) {
  if (item.afterOwnership === "buyer-owned") return "Share-ready after live verification confirms the attached proof remains reachable.";
  if (item.afterOwnership === "reference") return "Internal only: reference proof must be replaced before buyer sharing.";
  return "No-send: attach buyer-owned evidence before external review.";
}

function csvCell(value: string | number) {
  const text = String(value);
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function buildProjectionWorkOrders(items: BuyerProofRepairProjectionItem[]): BuyerProofRepairProjectionWorkOrder[] {
  return items.map((item) => {
    const executionTarget = executionTargetFor(item.id);
    return {
      id: item.id,
      label: item.label,
      priority: workOrderPriorityFor(item),
      owner: item.owner,
      decisionLiftAtStake: item.remainingDecisionLift,
      proofState: item.afterOwnership,
      proofStatus: item.afterStatus,
      shareGate: shareGateForWorkOrder(item),
      ...executionTarget,
      target: item.replacementTarget,
      action: item.actionAfterApply,
      acceptanceCriteria: item.acceptanceCriteria,
      risk: item.remainingRisk
    };
  });
}

function buildWorkOrderMarkdown(input: {
  status: BuyerProofRepairStatus;
  headline: string;
  shareInstruction: string;
  remainingDecisionLift: number;
  workOrders: BuyerProofRepairProjectionWorkOrder[];
}) {
  return [
    "# Buyer-owned proof replacement work orders",
    "",
    `Projection: ${input.status}`,
    `Outcome: ${input.headline}`,
    `Decision lift still at stake: ${input.remainingDecisionLift}`,
    `Share rule: ${input.shareInstruction}`,
    "",
    "## Work orders",
    ...(input.workOrders.length === 0
      ? ["No replacement work orders remain."]
      : input.workOrders.flatMap((order) => [
          "",
          `### ${order.label}`,
          `Priority: ${order.priority}`,
          `Owner: ${order.owner}`,
          `Decision lift at stake: ${order.decisionLiftAtStake}`,
          `Proof state: ${order.proofState}/${order.proofStatus}`,
          `Share gate: ${order.shareGate}`,
          `Input: ${order.inputLabel} (${order.inputHref})`,
          `Proof slot: ${order.proofSlot}`,
          `Target: ${order.target}`,
          `Action: ${order.action}`,
          `Acceptance: ${order.acceptanceCriteria}`,
          `Done signal: ${order.doneSignal}`,
          `Risk: ${order.risk}`
        ]))
  ].join("\n");
}

function buildWorkOrderCsv(workOrders: BuyerProofRepairProjectionWorkOrder[]) {
  const rows = [
    [
      "workOrderId",
      "label",
      "priority",
      "owner",
      "decisionLiftAtStake",
      "proofState",
      "proofStatus",
      "shareGate",
      "inputHref",
      "inputLabel",
      "proofSlot",
      "target",
      "action",
      "acceptanceCriteria",
      "doneSignal",
      "risk"
    ],
    ...workOrders.map((order) => [
      order.id,
      order.label,
      order.priority,
      order.owner,
      order.decisionLiftAtStake,
      order.proofState,
      order.proofStatus,
      order.shareGate,
      order.inputHref,
      order.inputLabel,
      order.proofSlot,
      order.target,
      order.action,
      order.acceptanceCriteria,
      order.doneSignal,
      order.risk
    ])
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function buildWorkOrderPacket(input: {
  status: BuyerProofRepairStatus;
  headline: string;
  shareInstruction: string;
  remainingDecisionLift: number;
  requiredReplacements: BuyerProofRepairProjectionItem[];
}): BuyerProofRepairProjectionWorkOrderPacket {
  const workOrders = buildProjectionWorkOrders(input.requiredReplacements);
  const markdown = buildWorkOrderMarkdown({ ...input, workOrders });
  const csvText = buildWorkOrderCsv(workOrders);
  const firstTask = workOrders[0] ?? null;

  return {
    filename: "buyer-proof-replacement-work-orders.md",
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    markdown,
    csvFilename: "buyer-proof-replacement-work-orders.csv",
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`,
    nowCount: workOrders.filter((order) => order.priority === "now").length,
    nextCount: workOrders.filter((order) => order.priority === "next").length,
    firstTask: firstTask
      ? {
          id: firstTask.id,
          label: firstTask.label,
          inputHref: firstTask.inputHref,
          inputLabel: firstTask.inputLabel
        }
      : null,
    workOrders
  };
}

function buildOperatorBriefMarkdown(brief: Omit<BuyerProofRepairOperatorBrief, "filename" | "href" | "markdown">) {
  return [
    "# Buyer proof operator brief",
    "",
    `Status: ${brief.status}`,
    `Owner: ${brief.firstOwner}`,
    `First action: ${brief.firstAction}`,
    `Input: ${brief.firstInputLabel} (${brief.firstInputHref})`,
    `Share rule: ${brief.shareRule}`,
    "",
    brief.headline,
    brief.summary,
    "",
    "## Acceptance checklist",
    ...brief.acceptanceChecklist.map((item) => `- ${item}`),
    "",
    "## Top tasks",
    ...(brief.topTasks.length === 0
      ? ["No open operator tasks remain."]
      : brief.topTasks.map((task) => `- [${task.priority}] ${task.label} (${task.owner}, +${task.decisionLiftAtStake}): ${task.target}. Acceptance: ${task.acceptanceCriteria}`)),
    "",
    "## Share message",
    brief.message
  ].join("\n");
}

function buildOperatorBrief(input: {
  publicShareLock: BuyerProofRepairPublicShareLock;
  workOrderPacket: BuyerProofRepairProjectionWorkOrderPacket;
  shareInstruction: string;
  remainingDecisionLift: number;
}): BuyerProofRepairOperatorBrief {
  const firstTask = input.workOrderPacket.workOrders[0] ?? null;
  const status: BuyerProofRepairOperatorBrief["status"] = input.publicShareLock.status === "ready" ? "send-ready" : "locked";
  const topTasks: BuyerProofRepairOperatorBriefTask[] = input.workOrderPacket.workOrders.slice(0, 3).map((task) => ({
    id: task.id,
    label: task.label,
    priority: task.priority,
    owner: task.owner,
    decisionLiftAtStake: task.decisionLiftAtStake,
    inputHref: task.inputHref,
    inputLabel: task.inputLabel,
    target: task.target,
    acceptanceCriteria: task.acceptanceCriteria,
    doneSignal: task.doneSignal
  }));
  const firstOwner = firstTask?.owner ?? "Launch owner";
  const firstAction = firstTask?.target ?? "Run live verification and attach the current digest.";
  const firstInputHref = firstTask?.inputHref ?? "#buyer-share-gate";
  const firstInputLabel = firstTask?.inputLabel ?? "Open share gate";
  const shareRule = status === "send-ready" ? input.publicShareLock.instruction : `${input.publicShareLock.instruction} ${input.remainingDecisionLift} decision-lift points remain at stake.`;
  const acceptanceChecklist =
    firstTask
      ? [firstTask.acceptanceCriteria, firstTask.doneSignal, "Run live verification after the proof slot is replaced."]
      : ["Run live verification once more.", "Confirm every proof gate is buyer-owned.", "Attach the current manifest digest before sharing."];
  const partial: Omit<BuyerProofRepairOperatorBrief, "filename" | "href" | "markdown"> = {
    status,
    headline: status === "send-ready" ? "Operator brief: final verification can start" : `Operator brief: ${firstTask?.label ?? "buyer-owned proof"} is the first no-send task`,
    summary:
      status === "send-ready"
        ? "All proof gates are buyer-owned in the projected workspace. The operator can run final live verification before external review."
        : `${input.publicShareLock.headline}. Start with ${firstOwner} so the buyer room does not leave the workspace with reference or missing proof.`,
    firstOwner,
    firstAction,
    firstInputHref,
    firstInputLabel,
    shareRule,
    acceptanceChecklist,
    topTasks,
    message:
      status === "send-ready"
        ? `Buyer proof is ready for final verification. ${input.shareInstruction}`
        : `${firstOwner}: ${firstTask?.label ?? "Proof replacement"} is first. ${firstAction} Share rule: ${shareRule}`,
  };
  const markdown = buildOperatorBriefMarkdown(partial);

  return {
    ...partial,
    filename: "buyer-proof-operator-brief.md",
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    markdown
  };
}

function plural(value: number, singular: string, pluralValue = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralValue}`;
}

function publicShareBlockingReason(item: BuyerProofRepairProjectionItem) {
  if (item.afterStatus === "blocked") return "Proof blocker remains after available fixes.";
  if (item.afterOwnership === "reference") return "Reference proof is still attached.";
  return "Buyer-owned proof is missing.";
}

function buildPublicShareBlockingGates(items: BuyerProofRepairProjectionItem[]): BuyerProofRepairPublicShareBlockingGate[] {
  return items.map((item) => {
    const executionTarget = executionTargetFor(item.id);
    return {
      id: item.id,
      label: item.label,
      owner: item.owner,
      proofState: item.afterOwnership,
      proofStatus: item.afterStatus,
      decisionLiftAtStake: item.remainingDecisionLift,
      inputHref: executionTarget.inputHref,
      inputLabel: executionTarget.inputLabel,
      reason: publicShareBlockingReason(item),
      replacementTarget: item.replacementTarget
    };
  });
}

function buildPublicShareLock(input: {
  projectedQueue: BuyerProofRepairQueue;
  requiredReplacements: BuyerProofRepairProjectionItem[];
}): BuyerProofRepairPublicShareLock {
  const buyerOwnedCount = input.projectedQueue.readyCount;
  const totalCount = input.projectedQueue.totalCount;
  const referenceCount = input.projectedQueue.referenceCount;
  const missingCount = input.projectedQueue.items.filter((item) => item.ownership === "missing").length;
  const blockerCount = input.projectedQueue.blockedCount;
  const nextReplacement = input.requiredReplacements[0] ?? null;
  const blockingGates = buildPublicShareBlockingGates(input.requiredReplacements);
  const nextTask = nextReplacement
    ? {
        id: nextReplacement.id,
        label: nextReplacement.label,
        owner: nextReplacement.owner,
        replacementTarget: nextReplacement.replacementTarget
      }
    : null;

  if (input.projectedQueue.status === "ready") {
    return {
      status: "ready",
      headline: "Buyer-owned proof cleared for external sharing",
      summary: `${buyerOwnedCount}/${totalCount} proof gates are buyer-owned. No reference or missing proof remains in the projected workspace.`,
      instruction: "Run live verification once more, then the buyer room can move to external review.",
      buyerOwnedCount,
      totalCount,
      referenceCount,
      missingCount,
      blockerCount,
      nextTask,
      blockingGates
    };
  }

  const blockerLine =
    blockerCount > 0
      ? `${plural(blockerCount, "blocker")} remain.`
      : `${plural(referenceCount, "reference proof item")} and ${plural(missingCount, "missing proof item")} remain.`;

  return {
    status: "locked",
    headline: blockerCount > 0 ? "External sharing locked by proof blockers" : referenceCount > 0 ? "External sharing locked by reference proof" : "External sharing locked by missing buyer proof",
    summary: `${buyerOwnedCount}/${totalCount} proof gates are buyer-owned. ${blockerLine}`,
    instruction: "Keep the room internal until every proof gate is buyer-owned and live verification confirms the public links.",
    buyerOwnedCount,
    totalCount,
    referenceCount,
    missingCount,
    blockerCount,
    nextTask,
    blockingGates
  };
}

export function buildBuyerProofRepairProjection(input: {
  current: WorkspaceDraft;
  sample: WorkspaceDraft;
  queue?: BuyerProofRepairQueue;
}): BuyerProofRepairProjection {
  const currentQueue = input.queue ?? buildBuyerProofRepairQueue({ current: input.current, sample: input.sample });
  const availablePatch = mergeBuyerProofRepairPatches(currentQueue.items);
  const appliedFixCount = currentQueue.items.filter((item) => item.status !== "ready" && hasBuyerProofRepairPatch(item.patch)).length;
  const projectedWorkspace = hasBuyerProofRepairPatch(availablePatch) ? applyBuyerProofRepairPatchToWorkspace(input.current, availablePatch) : input.current;
  const projectedQueue = hasBuyerProofRepairPatch(availablePatch) ? buildBuyerProofRepairQueue({ current: projectedWorkspace, sample: input.sample }) : currentQueue;
  const projectedById = new Map(projectedQueue.items.map((item) => [item.id, item]));
  const decisionLiftRecovered = Math.max(0, currentQueue.recoverableDecisionLift - projectedQueue.recoverableDecisionLift);
  const closedByAvailableFixes = Math.max(0, projectedQueue.readyCount - currentQueue.readyCount);
  const items = currentQueue.items.map((before) => {
    const after = projectedById.get(before.id) ?? before;
    return {
      id: before.id,
      label: before.label,
      owner: after.owner,
      beforeStatus: before.status,
      afterStatus: after.status,
      afterPriority: after.priority,
      beforeOwnership: before.ownership,
      afterOwnership: after.ownership,
      decisionLiftRecovered: Math.max(0, before.decisionLift - after.decisionLift),
      remainingDecisionLift: after.decisionLift,
      replacementTarget: replacementTargetFor(before.id),
      acceptanceCriteria: acceptanceCriteriaFor(before.id),
      remainingRisk: after.status === "ready" ? "Closed by the available proof update." : after.riskIfIgnored,
      actionAfterApply: after.status === "ready" ? "Keep the proof attached and run live verification." : after.action
    };
  });
  const requiredReplacements = items
    .filter((item) => item.afterStatus !== "ready")
    .sort((left, right) => {
      const statusRank = (status: BuyerProofRepairStatus) => (status === "blocked" ? 2 : status === "attention" ? 1 : 0);
      const ownershipRank = (ownership: BuyerProofRepairOwnership) => (ownership === "reference" ? 2 : ownership === "missing" ? 1 : 0);
      return statusRank(right.afterStatus) - statusRank(left.afterStatus) || ownershipRank(right.afterOwnership) - ownershipRank(left.afterOwnership) || right.remainingDecisionLift - left.remainingDecisionLift;
  });
  const partial = {
    status: projectedQueue.status,
    appliedFixCount,
    currentBlockedCount: currentQueue.blockedCount,
    projectedBlockedCount: projectedQueue.blockedCount,
    currentOpenCount: currentQueue.openCount,
    projectedOpenCount: projectedQueue.openCount,
    currentReferenceCount: currentQueue.referenceCount,
    projectedReferenceCount: projectedQueue.referenceCount,
    closedByAvailableFixes,
    decisionLiftRecovered,
    remainingDecisionLift: projectedQueue.recoverableDecisionLift,
    nextActionAfterApply: projectedQueue.firstAction,
    requiredReplacements,
    items
  };
  const headline = projectionHeadline({ appliedFixCount, projectedQueue });
  const shareInstruction = projectionShareInstruction(projectedQueue);
  const publicShareLock = buildPublicShareLock({ projectedQueue, requiredReplacements });
  const workOrderPacket = buildWorkOrderPacket({
    status: partial.status,
    headline,
    shareInstruction,
    remainingDecisionLift: partial.remainingDecisionLift,
    requiredReplacements
  });
  const operatorBrief = buildOperatorBrief({
    publicShareLock,
    workOrderPacket,
    shareInstruction,
    remainingDecisionLift: partial.remainingDecisionLift
  });

  return {
    ...partial,
    headline,
    summary: buildProjectionSummary({ appliedFixCount, currentQueue, projectedQueue, decisionLiftRecovered, closedByAvailableFixes }),
    shareInstruction,
    publicShareLock,
    workOrderPacket,
    operatorBrief
  };
}

export function buildBuyerProofRepairQueue(input: { current: WorkspaceDraft; sample: WorkspaceDraft }): BuyerProofRepairQueue {
  const { current, sample } = input;
  const targetOwnership = ownershipFromProof(hasText(current.targetUrl), sameText(current.targetUrl, sample.targetUrl));
  const targetStatus = statusFromOwnership(targetOwnership, hasText(sample.targetUrl));
  const workOrderReady = hasText(current.buyerWorkOrder.evidenceUrl) && hasText(current.buyerWorkOrder.targetUser);
  const workOrderOwnership = ownershipFromProof(workOrderReady, sameText(current.buyerWorkOrder.evidenceUrl, sample.buyerWorkOrder.evidenceUrl));
  const workOrderStatus = statusFromOwnership(workOrderOwnership, hasText(sample.buyerWorkOrder.evidenceUrl));
  const measuredRunReady =
    hasText(current.pilotRun.evidenceUrl) &&
    hasText(current.pilotRun.reviewerName) &&
    current.pilotRun.totalTasks > 0 &&
    current.pilotRun.acceptedTasks === current.pilotRun.totalTasks &&
    minutesSaved(current.pilotRun) > 0;
  const measuredRunOwnership = ownershipFromProof(measuredRunReady, sameText(current.pilotRun.evidenceUrl, sample.pilotRun.evidenceUrl));
  const measuredRunStatus = statusFromOwnership(measuredRunOwnership, hasText(sample.pilotRun.evidenceUrl));
  const acceptedTrials = current.agentTrialEvidence.filter((record) => record.status === "accepted");
  const acceptedTrialCount = acceptedTrials.length;
  const sampleAcceptedTrials = sample.agentTrialEvidence.filter((record) => record.status === "accepted");
  const sampleAcceptedTrialIds = new Set(sampleAcceptedTrials.map((record) => record.id));
  const buyerOwnedAcceptedTrialCount = acceptedTrials.filter((record) => !sampleAcceptedTrialIds.has(record.id)).length;
  const a2aOwnership = ownershipFromProof(acceptedTrialCount > 0, acceptedTrialCount > 0 && buyerOwnedAcceptedTrialCount === 0);
  const a2aStatus = statusFromOwnership(a2aOwnership, sampleAcceptedTrials.length > 0);
  const videoOwnership = ownershipFromProof(hasText(current.videoUrl), false);
  const videoStatus = statusFromOwnership(videoOwnership, hasText(sample.videoUrl));
  const protopediaOwnership = ownershipFromProof(hasText(current.protopediaUrl), false);
  const protopediaStatus = statusFromOwnership(protopediaOwnership, hasText(sample.protopediaUrl));

  const baseItems: BuyerProofRepairQueueItemBase[] = [
    {
      id: "public-product",
      label: "Public product URL",
      status: targetStatus,
      ownership: targetOwnership,
      priority: priorityFor(targetStatus),
      owner: "Launch owner",
      problem:
        targetOwnership === "reference"
          ? `Reference URL attached: ${shortUrl(current.targetUrl)}`
          : hasText(current.targetUrl)
            ? `Attached: ${shortUrl(current.targetUrl)}`
            : "The buyer cannot open the product surface from the room.",
      action:
        targetOwnership === "reference"
          ? "Replace the reference URL with the deployed product URL you control before external review."
          : hasText(current.targetUrl)
            ? "Keep this URL reachable from a clean browser session."
            : "Attach the deployed product URL before external review.",
      proof: hasText(current.targetUrl) ? shortUrl(current.targetUrl) : "Needs HTTPS product proof.",
      impact: "Unblocks public reachability and launch-room inspection.",
      buttonLabel: targetOwnership === "buyer-owned" ? "Attached" : targetOwnership === "reference" ? "Needs own URL" : "Use reference URL",
      patch: targetOwnership !== "missing" || !hasText(sample.targetUrl) ? undefined : { proofIntake: { targetUrl: sample.targetUrl } }
    },
    {
      id: "work-order",
      label: "Buyer work order proof",
      status: workOrderStatus,
      ownership: workOrderOwnership,
      priority: priorityFor(workOrderStatus),
      owner: "Product owner",
      problem:
        workOrderOwnership === "reference"
          ? "Starter work order proof is attached."
          : workOrderReady
            ? current.buyerWorkOrder.targetUser
            : "The workflow scope or its public work-order proof is incomplete.",
      action:
        workOrderOwnership === "reference"
          ? "Replace the starter work order with a buyer-approved work order and proof URL."
          : workOrderReady
            ? "Keep the work order tied to the buyer target and evidence URL."
            : "Replace the vague starter scope with a buyer-owned work order and proof URL.",
      proof: hasText(current.buyerWorkOrder.evidenceUrl) ? shortUrl(current.buyerWorkOrder.evidenceUrl) : "Needs work-order evidence URL.",
      impact: "Turns the site from a showcase into a bounded buyer workflow.",
      buttonLabel: workOrderOwnership === "buyer-owned" ? "Scoped" : workOrderOwnership === "reference" ? "Needs buyer scope" : "Apply proof scope",
      patch:
        workOrderOwnership !== "missing" || !hasText(sample.buyerWorkOrder.evidenceUrl)
          ? undefined
          : {
              buyerWorkOrder: sample.buyerWorkOrder,
              proofIntake: { workOrderEvidenceUrl: sample.buyerWorkOrder.evidenceUrl }
            }
    },
    {
      id: "measured-run",
      label: "Measured pilot receipt",
      status: measuredRunStatus,
      ownership: measuredRunOwnership,
      priority: priorityFor(measuredRunStatus),
      owner: "Pilot reviewer",
      problem:
        measuredRunOwnership === "reference"
          ? "Reference measured-run receipt is attached."
          : measuredRunReady
            ? `${minutesSaved(current.pilotRun)} minutes saved, ${current.pilotRun.acceptedTasks}/${current.pilotRun.totalTasks} accepted.`
            : "The value claim needs an accepted measured run with public receipt.",
      action:
        measuredRunOwnership === "reference"
          ? "Replace the reference measured run with one observed buyer run and its receipt URL."
          : measuredRunReady
            ? "Keep the measured receipt attached to the buyer memo."
            : "Attach one observed run, named reviewer, acceptance count, and receipt URL.",
      proof: hasText(current.pilotRun.evidenceUrl) ? shortUrl(current.pilotRun.evidenceUrl) : "Needs pilot receipt URL.",
      impact: "Moves the value story from modeled ROI to measured buyer evidence.",
      buttonLabel: measuredRunOwnership === "buyer-owned" ? "Measured" : measuredRunOwnership === "reference" ? "Needs buyer run" : "Apply receipt",
      patch:
        measuredRunOwnership !== "missing" || !hasText(sample.pilotRun.evidenceUrl)
          ? undefined
          : {
              pilotRun: sample.pilotRun,
              proofIntake: { pilotEvidenceUrl: sample.pilotRun.evidenceUrl }
            }
    },
    {
      id: "a2a-trial",
      label: "Accepted A2A trial proof",
      status: a2aStatus,
      ownership: a2aOwnership,
      priority: priorityFor(a2aStatus),
      owner: "Agent operator",
      problem:
        a2aOwnership === "reference"
          ? `${acceptedTrialCount} starter trial receipt${acceptedTrialCount === 1 ? "" : "s"} attached.`
          : acceptedTrialCount > 0
            ? `${acceptedTrialCount} accepted trial receipt${acceptedTrialCount === 1 ? "" : "s"} attached.`
            : "No accepted A2A trial receipt is attached to the buyer workspace.",
      action:
        a2aOwnership === "reference"
          ? "Replace starter A2A receipts with an accepted trial from this buyer workflow."
          : acceptedTrialCount > 0
            ? "Keep the accepted trial receipt in the buyer proof packet."
            : "Attach an accepted A2A trial receipt before claiming agent autonomy.",
      proof: acceptedTrialCount > 0 ? `${acceptedTrialCount} accepted` : "Needs accepted trial evidence.",
      impact: "Shows the AI agent did delegated work instead of only appearing in cards.",
      buttonLabel: a2aOwnership === "buyer-owned" ? "Attached" : a2aOwnership === "reference" ? "Needs buyer trial" : "Attach trial proof",
      patch: a2aOwnership !== "missing" || sampleAcceptedTrials.length === 0 ? undefined : { agentTrialEvidence: sampleAcceptedTrials.slice(0, 2) }
    },
    {
      id: "walkthrough",
      label: "Walkthrough video",
      status: videoStatus,
      ownership: videoOwnership,
      priority: priorityFor(videoStatus),
      owner: "Story owner",
      problem: hasText(current.videoUrl) ? `Attached: ${shortUrl(current.videoUrl)}` : "The first reviewer cannot watch the core workflow yet.",
      action: hasText(current.videoUrl) ? "Keep the walkthrough reachable and aligned with the buyer workflow." : "Attach a public or unlisted walkthrough URL.",
      proof: hasText(current.videoUrl) ? shortUrl(current.videoUrl) : "Needs walkthrough URL.",
      impact: "Makes the value inspectable without a private explanation.",
      buttonLabel: videoStatus === "ready" ? "Attached" : hasText(sample.videoUrl) ? "Use starter video" : "Add your video",
      patch: videoOwnership !== "missing" || !hasText(sample.videoUrl) ? undefined : { proofIntake: { videoUrl: sample.videoUrl } }
    },
    {
      id: "protopedia",
      label: "ProtoPedia story URL",
      status: protopediaStatus,
      ownership: protopediaOwnership,
      priority: priorityFor(protopediaStatus),
      owner: "Submission owner",
      problem: hasText(current.protopediaUrl) ? `Attached: ${shortUrl(current.protopediaUrl)}` : "The submission story is not connected to the launch room.",
      action: hasText(current.protopediaUrl) ? "Keep the ProtoPedia URL attached to the submission packet." : "Attach the published ProtoPedia work URL when registration opens.",
      proof: hasText(current.protopediaUrl) ? shortUrl(current.protopediaUrl) : "Needs ProtoPedia URL.",
      impact: "Closes the final public-submission evidence path.",
      buttonLabel: protopediaStatus === "ready" ? "Attached" : hasText(sample.protopediaUrl) ? "Use story URL" : "Add story URL",
      patch: protopediaOwnership !== "missing" || !hasText(sample.protopediaUrl) ? undefined : { proofIntake: { protopediaUrl: sample.protopediaUrl } }
    }
  ];
  const items = baseItems.map(addDecisionImpact);

  const readyCount = items.filter((item) => item.status === "ready").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const referenceCount = items.filter((item) => item.ownership === "reference").length;
  const openCount = items.length - readyCount;
  const status: BuyerProofRepairStatus = blockedCount > 0 ? "blocked" : openCount > 0 ? "attention" : "ready";
  const openItems = items.filter((item) => item.status !== "ready");
  const highestImpactItem = openItems.sort((left, right) => right.decisionLift - left.decisionLift)[0] ?? null;
  const firstOpen = highestImpactItem ?? items.find((item) => item.status !== "ready");
  const recoverableDecisionLift = items.reduce((sum, item) => sum + item.decisionLift, 0);
  const withoutMarkdown: Omit<BuyerProofRepairQueue, "exportMarkdown"> = {
    status,
    headline:
      status === "ready"
        ? "Buyer proof repairs are closed"
        : referenceCount > 0
          ? "Replace reference proof before sharing"
          : "Repair the proof chain before sharing",
    summary:
      status === "ready"
        ? "The workspace has product, work-order, measured-run, A2A, walkthrough, and submission proof attached."
        : referenceCount > 0
          ? `${referenceCount} reference proof item${referenceCount === 1 ? "" : "s"} need buyer-owned replacement. ${recoverableDecisionLift} decision-lift points are recoverable; start with ${firstOpen?.label ?? "live proof verification"}.`
          : `${openCount} proof repair item${openCount === 1 ? "" : "s"} remain. ${recoverableDecisionLift} decision-lift points are recoverable; start with ${firstOpen?.label ?? "live proof verification"}.`,
    readyCount,
    openCount,
    blockedCount,
    referenceCount,
    recoverableDecisionLift,
    totalCount: items.length,
    firstAction: firstOpen?.action ?? "Run live proof verification and keep the launch room current.",
    highestImpactItem: highestImpactItem
      ? {
          id: highestImpactItem.id,
          label: highestImpactItem.label,
          decisionLift: highestImpactItem.decisionLift,
          action: highestImpactItem.action,
          riskIfIgnored: highestImpactItem.riskIfIgnored
        }
      : null,
    items
  };

  return {
    ...withoutMarkdown,
    exportMarkdown: buildMarkdown(withoutMarkdown)
  };
}
