import type { BuyerOutcomeBrief } from "./buyerOutcomeBrief";
import type { BuyerProofRepairProjection } from "./buyerProofRepairQueue";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepageReviewerHandoffKitSnapshot } from "./App";

export type HomepageFirstRunValueProofStatus = "ready" | "attention" | "blocked";

export type HomepageFirstRunValueProofAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageFirstRunValueProofCheck = {
  id: "value-case" | "proof-route" | "buyer-packet" | "reviewer-handoff";
  label: string;
  status: HomepageFirstRunValueProofStatus;
  value: string;
  evidence: string;
  href: string;
  actionLabel: string;
};

export type HomepageFirstRunValueProofReceipt = {
  id: "value" | "packet";
  label: string;
  receiptId: string;
  checksum: string;
  href: string;
  requestHref: string;
};

export type HomepageFirstRunValueProofRepairGuideTask = {
  id: string;
  label: string;
  priority: "now" | "next";
  owner: string;
  decisionLiftAtStake: number;
  proofState: string;
  proofStatus: HomepageFirstRunValueProofStatus;
  shareGate: string;
  inputHref: string;
  inputLabel: string;
  proofSlot: string;
  target: string;
  acceptanceCriteria: string;
};

export type HomepageFirstRunValueProofRepairGuide = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  shareRule: string;
  noSendHeadline: string;
  noSendSummary: string;
  firstOwner: string;
  firstAction: string;
  firstInputAction: HomepageFirstRunValueProofAction;
  operatorBriefAction: HomepageFirstRunValueProofAction;
  workOrdersAction: HomepageFirstRunValueProofAction;
  csvAction: HomepageFirstRunValueProofAction;
  buyerOwnedCount: number;
  proofGateCount: number;
  blockingGateCount: number;
  referenceCount: number;
  missingCount: number;
  decisionLiftRecovered: number;
  remainingDecisionLift: number;
  appliedFixCount: number;
  nowCount: number;
  nextCount: number;
  operatorBriefFilename: string;
  workOrdersFilename: string;
  csvFilename: string;
  tasks: HomepageFirstRunValueProofRepairGuideTask[];
};

export type HomepageFirstRunValueProofCommandSnapshot = {
  status: HomepageFirstRunValueProofStatus;
  headline: string;
  summary: string;
  buyer: string;
  decision: BuyerOutcomeBrief["decision"];
  valueLine: string;
  proofLine: string;
  packetLine: string;
  command: string;
  sendRule: string;
  holdRule: string;
  proofToAttach: string;
  readyCount: number;
  checkTotal: number;
  primaryAction: HomepageFirstRunValueProofAction;
  verifierAction: HomepageFirstRunValueProofAction & {
    requestKey: string;
    requestJson: string;
  };
  ownerPacketAction: HomepageFirstRunValueProofAction;
  checks: HomepageFirstRunValueProofCheck[];
  receipts: HomepageFirstRunValueProofReceipt[];
  repairGuide?: HomepageFirstRunValueProofRepairGuide;
  exportMarkdown: string;
};

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function compactBuyerWorkspaceExportHref(href: string) {
  if (!href) return "#";
  if (href.startsWith("#")) return href;
  if (href.startsWith("data:")) return "data export";
  try {
    const url = new URL(href, "https://local.invalid");
    const search = url.searchParams.has("workspace") ? url.search : "";
    const path = `${url.pathname}${search}${url.hash}`;
    if (url.origin === "https://local.invalid") return path;
    return `${url.origin}${path}`;
  } catch {
    return href.split("?")[0] || href;
  }
}

function worstStatus(statuses: HomepageFirstRunValueProofStatus[]): HomepageFirstRunValueProofStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function firstRunCommandAction(action: { label: string; href: string; external?: boolean }): HomepageFirstRunValueProofAction {
  return {
    label: action.label,
    href: action.href,
    external: action.external ?? isExternalHref(action.href)
  };
}

function firstRunCommandHeadline(status: HomepageFirstRunValueProofStatus) {
  if (status === "ready") return "Send the first buyer loop with proof attached";
  if (status === "attention") return "Review one owner packet before buyer delivery";
  return "Hold buyer delivery and close the first proof move";
}

function firstRunCommandSummary(status: HomepageFirstRunValueProofStatus, buyer: string) {
  if (status === "ready") {
    return `${buyer} can receive a value case, proof route, packet receipt, and reviewer handoff from the first screen.`;
  }
  if (status === "attention") {
    return `${buyer} has a reviewable path, but the named owner packet should be accepted before external delivery.`;
  }
  return `${buyer} should not receive the room yet. The command names the owner, proof to attach, and verifier to reopen after repair.`;
}

function receiptDeskHref(requestJson: string) {
  const params = new URLSearchParams({ request: requestJson, verify: "1" });
  return `/receipt-verifier?${params.toString()}`;
}

function firstRunReceiptJsonHref(receipt: unknown) {
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(receipt, null, 2))}`;
}

function buildHomepageFirstRunValueProofMarkdown(snapshot: Omit<HomepageFirstRunValueProofCommandSnapshot, "exportMarkdown">) {
  const repairLines = snapshot.repairGuide
    ? [
        "",
        "## Repair cockpit",
        `No-send lock: ${snapshot.repairGuide.noSendHeadline}`,
        `Share rule: ${snapshot.repairGuide.shareRule}`,
        `First owner: ${snapshot.repairGuide.firstOwner}`,
        `First repair: ${snapshot.repairGuide.firstAction}`,
        `First input: ${snapshot.repairGuide.firstInputAction.label} (${compactBuyerWorkspaceExportHref(snapshot.repairGuide.firstInputAction.href)})`,
        `Proof gates: ${snapshot.repairGuide.buyerOwnedCount}/${snapshot.repairGuide.proofGateCount} buyer-owned`,
        `Remaining decision lift: ${snapshot.repairGuide.remainingDecisionLift}`,
        `Work orders: ${snapshot.repairGuide.workOrdersAction.label} (${compactBuyerWorkspaceExportHref(snapshot.repairGuide.workOrdersAction.href)})`,
        ...snapshot.repairGuide.tasks.map(
          (task) =>
            `- [${task.priority}/${task.proofState}] +${task.decisionLiftAtStake} ${task.label}: ${task.target}. Input: ${task.inputLabel} (${task.inputHref})`
        )
      ]
    : [];

  return [
    "# First-run buyer value command",
    "",
    `Status: ${snapshot.status}`,
    `Buyer: ${snapshot.buyer}`,
    `Decision: ${snapshot.decision}`,
    `Ready checks: ${snapshot.readyCount}/${snapshot.checkTotal}`,
    `First action: ${snapshot.primaryAction.label} (${compactBuyerWorkspaceExportHref(snapshot.primaryAction.href)})`,
    `Verifier: ${snapshot.verifierAction.label} (${compactBuyerWorkspaceExportHref(snapshot.verifierAction.href)})`,
    `Owner packet: ${snapshot.ownerPacketAction.label} (${compactBuyerWorkspaceExportHref(snapshot.ownerPacketAction.href)})`,
    "",
    snapshot.headline,
    snapshot.summary,
    "",
    "## Command",
    snapshot.command,
    "",
    "## Buyer value and proof",
    `Value: ${snapshot.valueLine}`,
    `Proof: ${snapshot.proofLine}`,
    `Packet: ${snapshot.packetLine}`,
    "",
    "## Rules",
    `Send rule: ${snapshot.sendRule}`,
    `Hold rule: ${snapshot.holdRule}`,
    `Proof to attach: ${snapshot.proofToAttach}`,
    ...repairLines,
    "",
    "## Receipts",
    ...snapshot.receipts.map((receipt) => `- ${receipt.label}: ${receipt.receiptId} (${receipt.checksum})`),
    "",
    "## Checks",
    ...snapshot.checks.map(
      (check) =>
        `- [${check.status}] ${check.label}: ${check.value}. ${check.evidence} Action: ${check.actionLabel} (${compactBuyerWorkspaceExportHref(check.href)})`
    )
  ].join("\n");
}

function buildHomepageFirstRunRepairGuide(
  projection: BuyerProofRepairProjection | undefined,
  commandStatus: HomepageFirstRunValueProofStatus
): HomepageFirstRunValueProofRepairGuide | undefined {
  if (!projection || commandStatus === "ready") return undefined;
  const operatorBrief = projection.operatorBrief;
  const workOrderPacket = projection.workOrderPacket;

  return {
    status: projection.status,
    headline: operatorBrief.headline,
    summary: operatorBrief.summary,
    shareRule: operatorBrief.shareRule,
    noSendHeadline: projection.publicShareLock.headline,
    noSendSummary: projection.publicShareLock.summary,
    firstOwner: operatorBrief.firstOwner,
    firstAction: operatorBrief.firstAction,
    firstInputAction: firstRunCommandAction({
      label: operatorBrief.firstInputLabel,
      href: operatorBrief.firstInputHref
    }),
    operatorBriefAction: firstRunCommandAction({
      label: "Export operator brief",
      href: operatorBrief.href
    }),
    workOrdersAction: firstRunCommandAction({
      label: "Export work orders",
      href: workOrderPacket.href
    }),
    csvAction: firstRunCommandAction({
      label: "Export CSV",
      href: workOrderPacket.csvHref
    }),
    buyerOwnedCount: projection.publicShareLock.buyerOwnedCount,
    proofGateCount: projection.publicShareLock.totalCount,
    blockingGateCount: projection.publicShareLock.blockingGates.length,
    referenceCount: projection.publicShareLock.referenceCount,
    missingCount: projection.publicShareLock.missingCount,
    decisionLiftRecovered: projection.decisionLiftRecovered,
    remainingDecisionLift: projection.remainingDecisionLift,
    appliedFixCount: projection.appliedFixCount,
    nowCount: workOrderPacket.nowCount,
    nextCount: workOrderPacket.nextCount,
    operatorBriefFilename: operatorBrief.filename,
    workOrdersFilename: workOrderPacket.filename,
    csvFilename: workOrderPacket.csvFilename,
    tasks: workOrderPacket.workOrders.slice(0, 3).map((task) => ({
      id: task.id,
      label: task.label,
      priority: task.priority,
      owner: task.owner,
      decisionLiftAtStake: task.decisionLiftAtStake,
      proofState: task.proofState,
      proofStatus: task.proofStatus,
      shareGate: task.shareGate,
      inputHref: task.inputHref,
      inputLabel: task.inputLabel,
      proofSlot: task.proofSlot,
      target: task.target,
      acceptanceCriteria: task.acceptanceCriteria
    }))
  };
}

export function buildHomepageFirstRunValueProofCommand({
  valueLens,
  proofEntry,
  outcomeArtifact,
  reviewerHandoffKit,
  proofRepairProjection
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  proofRepairProjection?: BuyerProofRepairProjection;
}): HomepageFirstRunValueProofCommandSnapshot {
  const checks: HomepageFirstRunValueProofCheck[] = [
    {
      id: "value-case",
      label: "Value case",
      status: valueLens.status,
      value: `${yen(valueLens.measuredMonthlyValueYen)} measured support`,
      evidence: `${valueLens.measuredSupportPercent}% measured support, ${valueLens.paybackDays} days payback, ${valueLens.confidenceScore}/100 confidence.`,
      href: valueLens.primaryAction.href,
      actionLabel: valueLens.primaryAction.label
    },
    {
      id: "proof-route",
      label: "Proof route",
      status: proofEntry.status,
      value: `${proofEntry.proofScore}/100 proof`,
      evidence: `${proofEntry.readyCount}/${proofEntry.items.length} rails ready. ${proofEntry.nextMove.headline}.`,
      href: proofEntry.nextMove.action.href,
      actionLabel: proofEntry.nextMove.action.label
    },
    {
      id: "buyer-packet",
      label: "Buyer packet",
      status: outcomeArtifact.packet.status,
      value: `${outcomeArtifact.packet.readyCount}/${outcomeArtifact.packet.itemCount} artifacts`,
      evidence: `${outcomeArtifact.packet.headline}. ${outcomeArtifact.packet.summary}`,
      href: outcomeArtifact.primaryAction.href,
      actionLabel: outcomeArtifact.primaryAction.label
    },
    {
      id: "reviewer-handoff",
      label: "Reviewer handoff",
      status: reviewerHandoffKit.status,
      value: `${reviewerHandoffKit.readyCount}/${reviewerHandoffKit.steps.length} steps`,
      evidence: reviewerHandoffKit.sendRule,
      href: reviewerHandoffKit.primaryAction.href,
      actionLabel: reviewerHandoffKit.primaryAction.label
    }
  ];
  const status = worstStatus(checks.map((check) => check.status));
  const repairGuide = buildHomepageFirstRunRepairGuide(proofRepairProjection, status);
  const primaryAction =
    status === "ready"
      ? firstRunCommandAction(proofEntry.primaryAction)
      : repairGuide
        ? repairGuide.firstInputAction
        : firstRunCommandAction(proofEntry.nextMove.action);
  const verifierAction = {
    ...firstRunCommandAction({
      label: "Verify packet receipt",
      href: receiptDeskHref(outcomeArtifact.packet.receipt.verificationRequestJson)
    }),
    requestKey: outcomeArtifact.packet.receipt.receiptId,
    requestJson: outcomeArtifact.packet.receipt.verificationRequestJson
  };
  const ownerPacketAction = firstRunCommandAction({
    label: `${proofEntry.nextMove.owner} packet`,
    href: proofEntry.nextMove.ownerPacket.href
  });
  const valueLine = `${yen(valueLens.measuredMonthlyValueYen)} measured / ${yen(valueLens.monthlyValueYen)} modeled`;
  const proofLine = `${proofEntry.proofScore}/100 proof, ${proofEntry.readyCount}/${proofEntry.items.length} rails ready`;
  const packetLine = `${outcomeArtifact.packet.readyCount}/${outcomeArtifact.packet.itemCount} packet artifacts, ${reviewerHandoffKit.readyCount}/${reviewerHandoffKit.steps.length} handoff steps`;
  const command =
    status === "ready"
      ? `${primaryAction.label}: send ${proofEntry.buyer} the buyer room with ${valueLine}, ${outcomeArtifact.packet.receipt.receiptId}, and the ${proofEntry.decisionHandoff.recommendedDecision} decision handoff.`
      : repairGuide
        ? `${repairGuide.firstInputAction.label}: ${repairGuide.firstOwner} owns the first no-send repair. ${repairGuide.firstAction} Then rerun ${outcomeArtifact.packet.receipt.receiptId}.`
        : `${primaryAction.label}: ${proofEntry.nextMove.headline}. Attach ${proofEntry.nextMove.ownerPacket.proofToAttach} Then rerun ${outcomeArtifact.packet.receipt.receiptId}.`;
  const partial: Omit<HomepageFirstRunValueProofCommandSnapshot, "exportMarkdown"> = {
    status,
    headline: firstRunCommandHeadline(status),
    summary: firstRunCommandSummary(status, proofEntry.buyer),
    buyer: proofEntry.buyer,
    decision: outcomeArtifact.decision,
    valueLine,
    proofLine,
    packetLine,
    command,
    sendRule:
      status === "ready"
        ? reviewerHandoffKit.sendRule
        : `Do not send until ${proofEntry.nextMove.headline.toLowerCase()}.`,
    holdRule:
      status === "ready"
        ? "Hold if the receipt verifier rejects the packet replay or any public proof link requires private access."
        : reviewerHandoffKit.holdRule,
    proofToAttach: proofEntry.nextMove.ownerPacket.proofToAttach,
    readyCount: checks.filter((check) => check.status === "ready").length,
    checkTotal: checks.length,
    primaryAction,
    verifierAction,
    ownerPacketAction,
    checks,
    receipts: [
      {
        id: "value",
        label: "Value receipt",
        receiptId: valueLens.receipt.receiptId,
        checksum: `${valueLens.receipt.checksumAlgorithm}:${valueLens.receipt.checksum}`,
        href: firstRunReceiptJsonHref(valueLens.receipt),
        requestHref: valueLens.receipt.verificationRequestHref
      },
      {
        id: "packet",
        label: "Packet receipt",
        receiptId: outcomeArtifact.packet.receipt.receiptId,
        checksum: `${outcomeArtifact.packet.receipt.checksumAlgorithm}:${outcomeArtifact.packet.receipt.checksum}`,
        href: firstRunReceiptJsonHref(outcomeArtifact.packet.receipt),
        requestHref: outcomeArtifact.packet.receipt.verificationRequestHref
      }
    ],
    repairGuide
  };

  return {
    ...partial,
    exportMarkdown: buildHomepageFirstRunValueProofMarkdown(partial)
  };
}
