import type { BuyerPilotCommand } from "./buyerPilotCommand.js";
import type { LaunchRoom, LaunchRoomDecisionVerdict, LaunchRoomStatus } from "./launchRoom.js";

export type HomepageRouteLockAction = {
  label: string;
  href: string;
  external: boolean;
};

export type HomepageRouteLockCheck = {
  id: "buyer-decision" | "current-gap" | "live-proof" | "artifact-closure";
  label: string;
  value: string;
  status: LaunchRoomStatus;
  evidence: string;
  href: string;
};

export type HomepageRouteLockStep = {
  id: "work-order" | "value-case" | "measured-run" | "live-proof" | "buyer-room";
  label: string;
  value: string;
  status: LaunchRoomStatus;
  evidence: string;
  href: string;
  external: boolean;
  isCurrent: boolean;
};

export type HomepageRouteLockHandoffItem = {
  id: "decision-receipt" | "trust-manifest" | "live-proof-audit" | "follow-up-ledger";
  label: string;
  title: string;
  detail: string;
  status: LaunchRoomStatus;
  href: string;
  external: boolean;
};

export type HomepageRouteLockHandoffPacket = {
  title: string;
  summary: string;
  primaryAction: HomepageRouteLockAction;
  secondaryAction: HomepageRouteLockAction;
  items: HomepageRouteLockHandoffItem[];
};

export type HomepageRouteLock = {
  status: LaunchRoomStatus;
  verdict: LaunchRoomDecisionVerdict;
  headline: string;
  instruction: string;
  operatorLine: string;
  score: number;
  scoreLabel: string;
  primaryAction: HomepageRouteLockAction;
  secondaryAction: HomepageRouteLockAction;
  routeSteps: HomepageRouteLockStep[];
  checks: HomepageRouteLockCheck[];
  handoffPacket: HomepageRouteLockHandoffPacket;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function worstStatus(statuses: LaunchRoomStatus[]): LaunchRoomStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function routeHeadline(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "Send the buyer room now";
  if (verdict === "pilot-review") return "Route this through sponsor review";
  return "Fix the first buyer blocker";
}

function scoreLabel(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "buyer-send";
  if (verdict === "pilot-review") return "sponsor-review";
  return "hold-share";
}

function decisionReceiptTitle(verdict: LaunchRoomDecisionVerdict) {
  if (verdict === "send") return "Continue record";
  if (verdict === "pilot-review") return "Revise record";
  return "Stop record";
}

function operatorLine(room: LaunchRoom, command: BuyerPilotCommand) {
  const blockingDecision = room.buyerDecision.checks.find((check) => check.status === "blocked");
  if (room.buyerDecision.verdict === "send") {
    return `${room.targetBuyer} can review the bounded pilot with live proof, measured value, and operating gates attached.`;
  }
  if (room.buyerDecision.verdict === "pilot-review") {
    const warning = room.buyerDecision.checks.find((check) => check.status === "attention");
    return `Sponsor should clear ${warning?.label ?? command.nextGap.label} before buyer delivery.`;
  }
  return `${blockingDecision?.label ?? command.nextGap.label} must be fixed before a buyer sees this room.`;
}

function routeStepIdForArtifact(artifactId: string | undefined): HomepageRouteLockStep["id"] {
  if (artifactId === "work-order-brief") return "work-order";
  if (artifactId === "buyer-value") return "value-case";
  if (artifactId === "pilot-run-receipt") return "measured-run";
  if (artifactId === "live-proof-audit" || artifactId === "buyer-proof-packet") return "live-proof";
  return "buyer-room";
}

function decisionFixTarget(room: LaunchRoom, command: BuyerPilotCommand) {
  const decisionGap = room.buyerDecision.checks.find((check) => check.status === "blocked") ?? room.buyerDecision.checks.find((check) => check.status === "attention");
  if (!decisionGap) {
    const currentGap = command.gapQueue.find((gap) => gap.isCurrent) ?? command.gapQueue[0];
    return {
      label: command.nextGap.label,
      href: command.nextGap.editHref,
      status: command.gapQueue.find((gap) => gap.isCurrent)?.status ?? "attention",
      evidence: command.nextGap.owner,
      routeStepId: routeStepIdForArtifact(currentGap?.artifactId)
    };
  }

  const hrefById: Partial<Record<typeof decisionGap.id, string>> = {
    "value-case": "#buyer-value-simulator",
    "measured-pilot": "#buyer-pilot-measured-run",
    "live-proof": "#buyer-proof-intake",
    "operating-gates": "#buyer-share-gate"
  };
  const routeStepIdById: Partial<Record<typeof decisionGap.id, HomepageRouteLockStep["id"]>> = {
    "value-case": "value-case",
    "measured-pilot": "measured-run",
    "live-proof": "live-proof",
    "operating-gates": "buyer-room"
  };

  return {
    label: decisionGap.label,
    href: hrefById[decisionGap.id] ?? "#buyer-acceptance-path",
    status: decisionGap.status,
    evidence: decisionGap.evidence,
    routeStepId: routeStepIdById[decisionGap.id] ?? "buyer-room"
  };
}

function statusValue(status: LaunchRoomStatus, ready: string, attention: string, blocked: string) {
  if (status === "ready") return ready;
  if (status === "attention") return attention;
  return blocked;
}

function commandStep(command: BuyerPilotCommand, artifactId: string) {
  return command.steps.find((step) => step.id === artifactId);
}

function routeHref(step: ReturnType<typeof commandStep>, fallbackHref: string) {
  if (!step) return fallbackHref;
  return step.status === "ready" ? step.href : step.editHref;
}

function buildRouteSteps(room: LaunchRoom, command: BuyerPilotCommand, launchRoomHref: string, currentRouteStepId: HomepageRouteLockStep["id"]): HomepageRouteLockStep[] {
  const workOrder = commandStep(command, "work-order-brief");
  const value = commandStep(command, "buyer-value");
  const measuredRun = commandStep(command, "pilot-run-receipt");
  const liveProof = commandStep(command, "live-proof-audit");
  const valueCheck = room.buyerDecision.checks.find((check) => check.id === "value-case");
  const measuredRunCheck = room.buyerDecision.checks.find((check) => check.id === "measured-pilot");
  const rawSteps: Array<Omit<HomepageRouteLockStep, "external" | "isCurrent">> = [
    {
      id: "work-order",
      label: "Scope",
      value: statusValue(workOrder?.status ?? "blocked", "bounded", "needs proof", "needs scope"),
      status: workOrder?.status ?? "blocked",
      evidence: workOrder?.summary ?? "Name the buyer, workflow, success metric, and public work-order proof.",
      href: routeHref(workOrder, "#buyer-work-order-studio")
    },
    {
      id: "value-case",
      label: "Value",
      value: valueCheck?.value ?? room.primaryMetric.value,
      status: valueCheck?.status ?? value?.status ?? "blocked",
      evidence: valueCheck?.evidence ?? value?.summary ?? room.primaryMetric.evidence,
      href: routeHref(value, "#buyer-value-simulator")
    },
    {
      id: "measured-run",
      label: "Measured run",
      value: measuredRunCheck?.value ?? statusValue(measuredRun?.status ?? "blocked", "accepted", "needs evidence", "missing"),
      status: measuredRunCheck?.status ?? measuredRun?.status ?? "blocked",
      evidence: measuredRunCheck?.evidence ?? measuredRun?.summary ?? "Attach one observed pilot run before asking a buyer to trust the value claim.",
      href: routeHref(measuredRun, "#pilot-run-receipt")
    },
    {
      id: "live-proof",
      label: "Live proof",
      value: room.proofHealth.checkedAt ? `${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount}` : "not checked",
      status: room.proofHealth.status,
      evidence: room.proofHealth.summary,
      href: routeHref(liveProof, "#launch-evidence-console")
    },
    {
      id: "buyer-room",
      label: "Decision room",
      value: room.buyerDecision.verdict,
      status: room.buyerDecision.status,
      evidence: room.buyerDecision.buyerQuestion,
      href: launchRoomHref
    }
  ];
  const firstOpenStep = rawSteps.find((step) => step.status !== "ready");
  const currentStepId = room.buyerDecision.verdict === "send" ? "buyer-room" : currentRouteStepId || firstOpenStep?.id;

  return rawSteps.map((step) => ({
    ...step,
    external: isExternalHref(step.href),
    isCurrent: step.id === currentStepId
  }));
}

function buildHandoffPacket({
  room,
  command,
  currentGap,
  artifactClosureStatus,
  proofAuditHref,
  trustManifestHref,
  decisionReceiptHref,
  decisionFollowUpHref,
  reviewKitHref,
  acceptancePathHref
}: {
  room: LaunchRoom;
  command: BuyerPilotCommand;
  currentGap: ReturnType<typeof decisionFixTarget>;
  artifactClosureStatus: LaunchRoomStatus;
  proofAuditHref: string;
  trustManifestHref: string;
  decisionReceiptHref: string;
  decisionFollowUpHref: string;
  reviewKitHref: string;
  acceptancePathHref: string;
}): HomepageRouteLockHandoffPacket {
  const isSendable = room.buyerDecision.verdict === "send";
  const title = isSendable ? "Handoff attachable" : room.buyerDecision.verdict === "pilot-review" ? "Sponsor packet open" : "Handoff stopped";
  const summary = isSendable
    ? `Attach receipts, manifest, and audit when ${room.targetBuyer} receives the room.`
    : `Do not send to ${room.targetBuyer} until ${currentGap.label} closes and the receipt updates.`;
  const proofTitle = room.proofHealth.checkedAt ? `${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount} verified` : "Not checked";

  return {
    title,
    summary,
    primaryAction: {
      label: isSendable ? "Open review kit" : "Review blockers",
      href: reviewKitHref,
      external: isExternalHref(reviewKitHref)
    },
    secondaryAction: {
      label: isSendable ? "Open acceptance path" : "Preview acceptance path",
      href: acceptancePathHref,
      external: isExternalHref(acceptancePathHref)
    },
    items: [
      {
        id: "decision-receipt",
        label: "Decision receipt",
        title: decisionReceiptTitle(room.buyerDecision.verdict),
        detail: "Checksum record for continue, revise, or stop.",
        status: room.buyerDecision.status,
        href: decisionReceiptHref,
        external: isExternalHref(decisionReceiptHref)
      },
      {
        id: "trust-manifest",
        label: "Trust manifest",
        title: command.proofClosure,
        detail: "Sealed artifacts, owners, receipts, and open blockers.",
        status: artifactClosureStatus,
        href: trustManifestHref,
        external: isExternalHref(trustManifestHref)
      },
      {
        id: "live-proof-audit",
        label: "Live proof audit",
        title: proofTitle,
        detail: room.proofHealth.summary,
        status: room.proofHealth.status,
        href: proofAuditHref,
        external: isExternalHref(proofAuditHref)
      },
      {
        id: "follow-up-ledger",
        label: "Follow-up ledger",
        title: isSendable ? "Post-send ownership" : currentGap.label,
        detail: isSendable ? "Keeps next owner, review cadence, and buyer conditions attached." : currentGap.evidence,
        status: isSendable ? "ready" : currentGap.status,
        href: decisionFollowUpHref,
        external: isExternalHref(decisionFollowUpHref)
      }
    ]
  };
}

export function buildHomepageRouteLock({
  room,
  command,
  launchRoomHref,
  proofAuditHref,
  trustManifestHref,
  decisionReceiptHref,
  decisionFollowUpHref,
  reviewKitHref,
  acceptancePathHref
}: {
  room: LaunchRoom;
  command: BuyerPilotCommand;
  launchRoomHref: string;
  proofAuditHref: string;
  trustManifestHref: string;
  decisionReceiptHref: string;
  decisionFollowUpHref: string;
  reviewKitHref: string;
  acceptancePathHref: string;
}): HomepageRouteLock {
  const currentGap = decisionFixTarget(room, command);
  const artifactClosureStatus = worstStatus(command.steps.map((step) => step.status));
  const primaryHref = room.buyerDecision.verdict === "send" ? launchRoomHref : currentGap.href;
  const primaryLabel = room.buyerDecision.verdict === "send" ? "Open buyer room" : `Fix ${currentGap.label}`;
  const secondaryHref = room.buyerDecision.verdict === "send" ? command.nextGap.href : launchRoomHref;
  const secondaryLabel = room.buyerDecision.verdict === "send" ? "Review proof packet" : "Open launch room";

  return {
    status: room.buyerDecision.status,
    verdict: room.buyerDecision.verdict,
    headline: routeHeadline(room.buyerDecision.verdict),
    instruction: room.buyerDecision.instruction,
    operatorLine: operatorLine(room, command),
    score: room.launchScore,
    scoreLabel: scoreLabel(room.buyerDecision.verdict),
    primaryAction: {
      label: primaryLabel,
      href: primaryHref,
      external: isExternalHref(primaryHref)
    },
    secondaryAction: {
      label: secondaryLabel,
      href: secondaryHref,
      external: isExternalHref(secondaryHref)
    },
    routeSteps: buildRouteSteps(room, command, launchRoomHref, currentGap.routeStepId),
    checks: [
      {
        id: "buyer-decision",
        label: "Buyer decision",
        value: room.buyerDecision.verdict,
        status: room.buyerDecision.status,
        evidence: room.buyerDecision.headline,
        href: launchRoomHref
      },
      {
        id: "current-gap",
        label: "Current gap",
        value: currentGap.label,
        status: currentGap.status,
        evidence: currentGap.evidence,
        href: currentGap.href
      },
      {
        id: "live-proof",
        label: "Live proof",
        value: room.proofHealth.checkedAt ? `${room.proofHealth.verifiedCount}/${room.proofHealth.totalCount}` : "not checked",
        status: room.proofHealth.status,
        evidence: room.proofHealth.summary,
        href: "#launch-evidence-console"
      },
      {
        id: "artifact-closure",
        label: "Artifact closure",
        value: command.proofClosure,
        status: artifactClosureStatus,
        evidence: command.pathLabel,
        href: "#buyer-pilot-command-title"
      }
    ],
    handoffPacket: buildHandoffPacket({
      room,
      command,
      currentGap,
      artifactClosureStatus,
      proofAuditHref,
      trustManifestHref,
      decisionReceiptHref,
      decisionFollowUpHref,
      reviewKitHref,
      acceptancePathHref
    })
  };
}
