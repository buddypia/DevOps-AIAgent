import { launchRoomEditAnchorFor, type LaunchRoom, type LaunchRoomArtifact, type LaunchRoomReadiness, type LaunchRoomStatus } from "./launchRoom.js";

export type BuyerPilotCommandStep = {
  id: string;
  label: string;
  status: LaunchRoomStatus;
  owner: string;
  href: string;
  editHref: string;
  summary: string;
  isCurrent: boolean;
};

export type BuyerPilotCommandGap = {
  id: string;
  artifactId: string;
  label: string;
  status: LaunchRoomStatus;
  owner: string;
  action: string;
  acceptanceSignal: string;
  proofToAttach: string;
  href: string;
  editHref: string;
  isCurrent: boolean;
};

export type BuyerPilotCommand = {
  readiness: LaunchRoomReadiness;
  launchScore: number;
  headline: string;
  targetBuyer: string;
  primaryMetric: string;
  proofClosure: string;
  pathLabel: string;
  nextGap: {
    label: string;
    owner: string;
    action: string;
    href: string;
    editHref: string;
  };
  gapQueue: BuyerPilotCommandGap[];
  steps: BuyerPilotCommandStep[];
};

function commandHeadline(readiness: LaunchRoomReadiness) {
  if (readiness === "buyer-ready") return "Share the launch room with a buyer";
  if (readiness === "needs-proof") return "Close the proof gaps before external sharing";
  if (readiness === "needs-work-order") return "Tighten the real buyer work order first";
  return "Make the buyer value case credible first";
}

function pathLabel(readiness: LaunchRoomReadiness) {
  if (readiness === "buyer-ready") return "Ready for external review";
  if (readiness === "needs-value") return "Value case is the first blocker";
  if (readiness === "needs-work-order") return "Work order is the first blocker";
  return "Proof closure is the current lane";
}

function currentArtifact(readiness: LaunchRoomReadiness, artifacts: LaunchRoomArtifact[]) {
  if (readiness === "needs-value") return artifacts.find((artifact) => artifact.id === "buyer-value") ?? artifacts[0];
  if (readiness === "needs-work-order") return artifacts.find((artifact) => artifact.id === "work-order-brief") ?? artifacts[0];
  if (readiness === "needs-proof") {
    return artifacts.find((artifact) => artifact.status === "blocked") ?? artifacts.find((artifact) => artifact.status === "attention") ?? artifacts[0];
  }
  return artifacts.find((artifact) => artifact.id === "delivery-memo") ?? artifacts.find((artifact) => artifact.id === "buyer-proof-packet") ?? artifacts[0];
}

export function buildBuyerPilotCommand(room: LaunchRoom): BuyerPilotCommand {
  const artifacts = room.artifacts.filter((artifact) => artifact.id !== "workspace");
  const readyCount = artifacts.filter((artifact) => artifact.status === "ready").length;
  const current = currentArtifact(room.readiness, artifacts);
  const currentClosureStep =
    room.closurePlan.find((step) => step.artifactId === current?.id) ?? room.closurePlan.find((step) => step.status !== "ready") ?? room.closurePlan[0];
  const gapQueue = room.closurePlan.slice(0, 3).map((step) => ({
    id: step.id,
    artifactId: step.artifactId,
    label: step.label,
    status: step.status,
    owner: step.owner,
    action: step.action,
    acceptanceSignal: step.acceptanceSignal,
    proofToAttach: step.proofToAttach,
    href: step.href,
    editHref: step.editHref,
    isCurrent: step.artifactId === current?.id
  }));
  const steps = artifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.label,
    status: artifact.status,
    owner: artifact.owner,
    href: artifact.href,
    editHref: launchRoomEditAnchorFor(artifact.id),
    summary: artifact.summary,
    isCurrent: artifact.id === current?.id
  }));

  return {
    readiness: room.readiness,
    launchScore: room.launchScore,
    headline: commandHeadline(room.readiness),
    targetBuyer: room.targetBuyer,
    primaryMetric: `${room.primaryMetric.value} modeled value`,
    proofClosure: `${readyCount}/${artifacts.length} artifacts sealed`,
    pathLabel: pathLabel(room.readiness),
    nextGap: {
      label: current?.label ?? room.nextAction.label,
      owner: current?.owner ?? room.nextAction.owner,
      action: currentClosureStep?.action ?? room.nextAction.action,
      href: current?.href ?? room.nextAction.href,
      editHref: current ? launchRoomEditAnchorFor(current.id) : room.nextAction.href
    },
    gapQueue,
    steps
  };
}
