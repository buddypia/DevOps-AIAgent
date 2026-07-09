import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Copy, Crosshair, Download, ExternalLink, Gauge } from "lucide-react";
import type { BuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun";
import type { BuyerPilotCommand } from "./buyerPilotCommand";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { downloadTextFile } from "./downloadArtifact";
import type { LaunchRoomStatus } from "./launchRoom";
import type { ProofTransformation } from "./proofTransformation";

export type HeroBuyerDecisionBriefStatus = "ready" | "attention" | "blocked";

export type HeroBuyerDecisionBriefMetric = {
  id: "value" | "receipt" | "proof";
  label: string;
  value: string;
  detail: string;
};

export type HeroBuyerDecisionOutcomeReplayStep = {
  id: "manual-work" | "agent-run" | "proof-packet" | "buyer-decision";
  label: string;
  status: LaunchRoomStatus;
  value: string;
  detail: string;
  href: string;
};

export type HeroBuyerDecisionBriefApprovalStep = {
  id: "work-order" | "receipt" | "trust" | "send-room";
  label: string;
  status: LaunchRoomStatus;
  owner: string;
  href: string;
  summary: string;
};

export type HeroBuyerDecisionBriefQuestion = {
  id: "value-case" | "proof-access" | "trust-gate" | "next-decision";
  question: string;
  answer: string;
  status: LaunchRoomStatus;
  href: string;
  evidence: string;
};

export type HeroBuyerDecisionBriefReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a32";
  checksum: string;
};

export type HeroBuyerDecisionBrief = {
  status: HeroBuyerDecisionBriefStatus;
  decision: "send" | "review" | "hold";
  decisionLabel: string;
  headline: string;
  evidence: string;
  buyer: string;
  score: number;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
  decisionReceiptAction: {
    label: string;
    href: string;
  };
  metrics: HeroBuyerDecisionBriefMetric[];
  outcomeReplay: HeroBuyerDecisionOutcomeReplayStep[];
  buyerQuestions: HeroBuyerDecisionBriefQuestion[];
  approvalPath: HeroBuyerDecisionBriefApprovalStep[];
  packetReceipt: HeroBuyerDecisionBriefReceipt;
  exportMarkdown: string;
};

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function statusFrom(input: { command: BuyerPilotCommand; transformation: ProofTransformation }): HeroBuyerDecisionBriefStatus {
  if (input.command.readiness === "buyer-ready" && input.transformation.current.openCount === 0) return "ready";
  if (input.transformation.current.blockedCount > 0) return "blocked";
  return "attention";
}

function decisionFrom(status: HeroBuyerDecisionBriefStatus) {
  if (status === "ready") return "send";
  if (status === "attention") return "review";
  return "hold";
}

function headlineFor(input: { status: HeroBuyerDecisionBriefStatus; command: BuyerPilotCommand; transformation: ProofTransformation }) {
  if (input.status === "ready") return `Send ${input.command.targetBuyer} a buyer-verifiable pilot contract`;
  if (input.status === "attention") return `Review ${input.transformation.current.watchCount || 1} warning before external sharing`;
  return `Hold external sharing: ${input.transformation.current.openCount} buyer repair item${input.transformation.current.openCount === 1 ? "" : "s"} open`;
}

function evidenceFor(input: { status: HeroBuyerDecisionBriefStatus; command: BuyerPilotCommand; transformation: ProofTransformation }) {
  if (input.status === "ready") {
    return `${input.command.proofClosure}; price, value, proof, trust, and stop rule are inspectable before approval.`;
  }
  return input.transformation.current.primaryAction;
}

function stableReceiptHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

type HeroBuyerDecisionBriefCore = Omit<HeroBuyerDecisionBrief, "exportMarkdown" | "packetReceipt">;

function commandStep(command: BuyerPilotCommand, ids: string[]) {
  return command.steps.find((step) => ids.includes(step.id));
}

function pathStatusFor(stepStatus: LaunchRoomStatus | undefined, fallback: HeroBuyerDecisionBriefStatus): LaunchRoomStatus {
  if (stepStatus) return stepStatus;
  if (fallback === "ready") return "ready";
  if (fallback === "attention") return "attention";
  return "blocked";
}

function launchStatusFromHero(status: HeroBuyerDecisionBriefStatus): LaunchRoomStatus {
  if (status === "ready") return "ready";
  if (status === "attention") return "attention";
  return "blocked";
}

function worstLaunchStatus(...statuses: LaunchRoomStatus[]): LaunchRoomStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function stepHref(step: ReturnType<typeof commandStep>, fallback: string) {
  return step?.editHref || step?.href || fallback;
}

function buildBuyerQuestions(input: {
  command: BuyerPilotCommand;
  transformation: ProofTransformation;
  status: HeroBuyerDecisionBriefStatus;
  buyerScenario: BuyerValueScenario;
  measuredRunSummary: BuyerPilotMeasuredRunSummary;
  launchRoomHref: string;
  proofAuditHref: string;
  actionHref: string;
}) {
  const valueStep = commandStep(input.command, ["buyer-value", "value-report", "workflow", "work-order-brief"]);
  const receiptStep = commandStep(input.command, ["pilot-run-receipt", "pilot-receipt"]);
  const proofStep = commandStep(input.command, ["live-proof-audit", "buyer-proof-packet"]);
  const trustStep = commandStep(input.command, ["trust-center"]);
  const commercialStep = commandStep(input.command, ["commercial-offer", "buyer-delivery-memo"]);
  const fallbackStatus = launchStatusFromHero(input.status);
  const valueStatus = worstLaunchStatus(pathStatusFor(valueStep?.status, input.status), pathStatusFor(receiptStep?.status, input.status));
  const proofStatus = proofStep?.status ?? (input.transformation.current.openCount === 0 ? "ready" : input.transformation.current.blockedCount > 0 ? "blocked" : "attention");
  const trustStatus = worstLaunchStatus(pathStatusFor(trustStep?.status, input.status), pathStatusFor(commercialStep?.status, input.status));

  return [
    {
      id: "value-case",
      question: "Is the pilot worth buying?",
      answer:
        valueStatus === "ready"
          ? `${input.command.primaryMetric} with a measured ${input.measuredRunSummary.actualMinutesSavedPerRun}m saved/run receipt.`
          : `Not yet. ${receiptStep?.summary ?? valueStep?.summary ?? input.command.nextGap.action}`,
      status: valueStatus,
      href: stepHref(receiptStep ?? valueStep, "#pilot-run-receipt"),
      evidence: `${yen(input.buyerScenario.monthlyGrossValueYen)} modeled; ${yen(input.measuredRunSummary.measuredMonthlyValueYen)} measured monthly value; ${input.measuredRunSummary.acceptanceRatePercent}% accepted.`
    },
    {
      id: "proof-access",
      question: "Can the reviewer open proof?",
      answer:
        proofStatus === "ready"
          ? `${input.command.proofClosure}; proof audit and launch room are available for review.`
          : input.transformation.current.primaryAction,
      status: proofStatus,
      href: stepHref(proofStep, input.proofAuditHref),
      evidence: `${input.transformation.current.readyCount} ready, ${input.transformation.current.watchCount} watch, ${input.transformation.current.blockedCount} blocked.`
    },
    {
      id: "trust-gate",
      question: "What keeps approval bounded?",
      answer:
        trustStatus === "ready"
          ? "Trust, commercial guardrails, data boundary, and stop rules are attached before send."
          : trustStep?.summary ?? commercialStep?.summary ?? "Trust and commercial guardrails still need owner review.",
      status: trustStatus,
      href: stepHref(trustStep ?? commercialStep, "#buyer-trust-center"),
      evidence: commercialStep?.summary ?? trustStep?.summary ?? "Approval stays internal until trust and commercial proof are ready."
    },
    {
      id: "next-decision",
      question: "What should happen next?",
      answer:
        input.status === "ready"
          ? "Send the launch room, then record the buyer decision receipt."
          : `Keep internal: ${input.command.nextGap.owner} must close ${input.command.nextGap.label}.`,
      status: fallbackStatus,
      href: input.status === "ready" ? input.launchRoomHref : input.actionHref,
      evidence: input.status === "ready" ? input.command.proofClosure : input.command.nextGap.action
    }
  ] satisfies HeroBuyerDecisionBriefQuestion[];
}

function buildApprovalPath(input: { command: BuyerPilotCommand; status: HeroBuyerDecisionBriefStatus; launchRoomHref: string }): HeroBuyerDecisionBriefApprovalStep[] {
  const workOrder = commandStep(input.command, ["work-order-brief", "workflow"]);
  const receipt = commandStep(input.command, ["pilot-run-receipt", "pilot-receipt"]);
  const trust = commandStep(input.command, ["trust-center"]);
  const sendRoom = commandStep(input.command, ["delivery-memo", "buyer-proof-packet"]);
  const sendStatus: LaunchRoomStatus = input.command.readiness === "buyer-ready" ? "ready" : pathStatusFor(sendRoom?.status, input.status);

  return [
    {
      id: "work-order",
      label: "Scope work",
      status: pathStatusFor(workOrder?.status, input.status),
      owner: workOrder?.owner ?? input.command.targetBuyer,
      href: workOrder?.editHref || workOrder?.href || "#buyer-work-order-studio",
      summary: workOrder?.summary ?? "Name the buyer workflow, user, success metric, and evidence boundary."
    },
    {
      id: "receipt",
      label: "Measure receipt",
      status: pathStatusFor(receipt?.status, input.status),
      owner: receipt?.owner ?? "Pilot reviewer",
      href: receipt?.editHref || receipt?.href || "#pilot-run-receipt",
      summary: receipt?.summary ?? "Attach measured minutes saved, accepted tasks, reviewer, and proof URL."
    },
    {
      id: "trust",
      label: "Check trust memo",
      status: pathStatusFor(trust?.status, input.status),
      owner: trust?.owner ?? "Security reviewer",
      href: trust?.editHref || trust?.href || "#buyer-trust-center",
      summary: trust?.summary ?? "Confirm data boundary, owner, stop rules, and approval red lines."
    },
    {
      id: "send-room",
      label: "Send room",
      status: sendStatus,
      owner: sendRoom?.owner ?? "Sponsor owner",
      href: input.launchRoomHref,
      summary: sendStatus === "ready" ? "Launch room can be sent with the buyer packet attached." : `Final send waits for ${input.command.nextGap.label}.`
    }
  ];
}

function buildOutcomeReplay(
  command: BuyerPilotCommand,
  transformation: ProofTransformation,
  buyerScenario: BuyerValueScenario,
  measuredRunSummary: BuyerPilotMeasuredRunSummary,
  decisionLabel: string,
  actionHref: string,
  launchRoomHref: string,
  proofAuditHref: string
): HeroBuyerDecisionOutcomeReplayStep[] {
  const valueStep = commandStep(command, ["buyer-value", "value-report", "workflow", "work-order-brief"]);
  const receiptStep = commandStep(command, ["pilot-run-receipt", "pilot-receipt"]);
  const proofStep = commandStep(command, ["live-proof-audit", "buyer-proof-packet"]);
  const fallbackStatus = launchStatusFromHero(command.readiness === "buyer-ready" && transformation.current.openCount === 0 ? "ready" : transformation.current.blockedCount > 0 ? "blocked" : "attention");
  const valueStatus = pathStatusFor(valueStep?.status, fallbackStatus === "ready" ? "ready" : "attention");
  const receiptStatus = pathStatusFor(receiptStep?.status, fallbackStatus === "ready" ? "ready" : "attention");
  const proofStatus = proofStep?.status ?? (transformation.current.openCount === 0 ? "ready" : transformation.current.blockedCount > 0 ? "blocked" : "attention");
  const manualExposure = Number.isFinite(buyerScenario.monthlyHoursSaved) && buyerScenario.monthlyHoursSaved > 0 ? `${buyerScenario.monthlyHoursSaved}h/month exposed` : `${yen(buyerScenario.monthlyGrossValueYen)} / month modeled`;

  return [
    {
      id: "manual-work",
      label: "Manual work",
      status: valueStatus,
      value: manualExposure,
      detail: `${command.targetBuyer}: ${buyerScenario.paybackDays}d payback pressure.`,
      href: stepHref(valueStep, "#buyer-value-simulator")
    },
    {
      id: "agent-run",
      label: "Agent run",
      status: receiptStatus,
      value: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run`,
      detail: `${measuredRunSummary.acceptanceRatePercent}% accepted, ${yen(measuredRunSummary.measuredMonthlyValueYen)} measured.`,
      href: stepHref(receiptStep, "#pilot-run-receipt")
    },
    {
      id: "proof-packet",
      label: "Proof packet",
      status: proofStatus,
      value: transformation.current.proofClosure,
      detail: transformation.current.openCount === 0 ? "Live proof is inspectable." : transformation.current.primaryAction,
      href: stepHref(proofStep, proofAuditHref)
    },
    {
      id: "buyer-decision",
      label: "Buyer decision",
      status: fallbackStatus,
      value: `${decisionLabel} / ${command.launchScore}`,
      detail: fallbackStatus === "ready" ? "Open the room and record the receipt." : command.nextGap.action,
      href: fallbackStatus === "ready" ? launchRoomHref : actionHref
    }
  ];
}

function sendDraftFor(brief: HeroBuyerDecisionBriefCore, command: BuyerPilotCommand) {
  if (brief.status === "ready") {
    return {
      subject: `Pilot contract ready: ${brief.buyer}`,
      instruction: "Send this after the launch room and proof audit have been attached.",
      body: [
        `I am sharing a buyer-verifiable AI pilot room for ${brief.buyer}.`,
        brief.evidence,
        `Decision: ${brief.decisionLabel}. Score: ${brief.score}.`,
        "Please review the launch room, proof audit, value case, and stop rule before approving the first pilot."
      ]
    };
  }

  return {
    subject: `Internal repair before buyer sharing: ${command.nextGap.label}`,
    instruction: "Use this internally until the current blocker is closed; do not ask the buyer to approve from this state.",
    body: [
      `Current decision: ${brief.decisionLabel}. ${brief.headline}.`,
      `Repair owner: ${command.nextGap.owner}.`,
      `Repair action: ${command.nextGap.action}`,
      "After the repair closes, reopen the launch room and proof audit before external sharing."
    ]
  };
}

function buildPacketReceipt(brief: HeroBuyerDecisionBriefCore, command: BuyerPilotCommand): HeroBuyerDecisionBriefReceipt {
  const checksumSource = [
    brief.decision,
    brief.status,
    brief.buyer,
    String(brief.score),
    brief.primaryAction.label,
    brief.primaryAction.href,
    brief.secondaryAction.href,
    command.proofClosure,
    command.nextGap.label,
    command.nextGap.owner,
    command.nextGap.action,
    ...brief.metrics.map((metric) => `${metric.id}:${metric.value}:${metric.detail}`),
    ...brief.outcomeReplay.map((step) => `${step.id}:${step.status}:${step.value}:${step.detail}:${step.href}`),
    ...brief.buyerQuestions.map((question) => `${question.id}:${question.status}:${question.question}:${question.answer}:${question.href}`),
    ...brief.approvalPath.map((step) => `${step.id}:${step.status}:${step.href}:${step.summary}`),
    command.nextGap.editHref || command.nextGap.href
  ].join("\n");
  const checksum = stableReceiptHash(checksumSource);

  return {
    receiptId: `buyer-send-${brief.decision}-${checksum}`,
    checksumAlgorithm: "fnv1a32",
    checksum
  };
}

function buildDecisionPacketMarkdown(brief: HeroBuyerDecisionBriefCore & { packetReceipt: HeroBuyerDecisionBriefReceipt }, command: BuyerPilotCommand) {
  const sendDraft = sendDraftFor(brief, command);
  return [
    "# Buyer send packet",
    "",
    `Receipt: ${brief.packetReceipt.receiptId}`,
    `Checksum: ${brief.packetReceipt.checksumAlgorithm}:${brief.packetReceipt.checksum}`,
    "",
    `Decision: ${brief.decisionLabel}`,
    `Status: ${brief.status}`,
    `Buyer: ${brief.buyer}`,
    `Score: ${brief.score}`,
    "",
    brief.headline,
    "",
    `Evidence: ${brief.evidence}`,
    "",
    "## Actions",
    `- Primary: ${brief.primaryAction.label} (${brief.primaryAction.href})`,
    `- Proof audit: ${brief.secondaryAction.label} (${brief.secondaryAction.href})`,
    `- Decision receipt: ${brief.decisionReceiptAction.label} (${brief.decisionReceiptAction.href})`,
    "",
    "## Buyer send draft",
    `Subject: ${sendDraft.subject}`,
    `Instruction: ${sendDraft.instruction}`,
    ...sendDraft.body.map((line) => `- ${line}`),
    "",
    "## Evidence metrics",
    ...brief.metrics.map((metric) => `- ${metric.label}: ${metric.value}. ${metric.detail}`),
    "",
    "## Outcome replay",
    ...brief.outcomeReplay.map((step) => `- [${step.status}] ${step.label}: ${step.value}. ${step.detail} Link: ${step.href}`),
    "",
    "## Buyer questions",
    ...brief.buyerQuestions.map((question) => `- [${question.status}] ${question.question} ${question.answer} Evidence: ${question.evidence} Link: ${question.href}`),
    "",
    "## Approval path",
    ...brief.approvalPath.map((step) => `- [${step.status}] ${step.label} (${step.owner}): ${step.summary} Link: ${step.href}`),
    "",
    "## Repair queue",
    ...(command.gapQueue.length
      ? command.gapQueue.map(
          (gap) =>
            `- [${gap.status}] ${gap.label} (${gap.owner}): ${gap.action} Acceptance: ${gap.acceptanceSignal}. Proof to attach: ${gap.proofToAttach}. Link: ${gap.editHref || gap.href}`
        )
      : [`- [${brief.status}] ${command.nextGap.label} (${command.nextGap.owner}): ${command.nextGap.action}`]),
    "",
    "## Artifact readiness",
    ...command.steps.map((step) => `- [${step.status}] ${step.label} (${step.owner}): ${step.summary} Link: ${step.editHref || step.href}`)
  ].join("\n");
}

export function buildHeroBuyerDecisionBrief({
  command,
  transformation,
  buyerScenario,
  measuredRunSummary,
  launchRoomHref,
  proofAuditHref,
  decisionReceiptHref
}: {
  command: BuyerPilotCommand;
  transformation: ProofTransformation;
  buyerScenario: BuyerValueScenario;
  measuredRunSummary: BuyerPilotMeasuredRunSummary;
  launchRoomHref: string;
  proofAuditHref: string;
  decisionReceiptHref: string;
}): HeroBuyerDecisionBrief {
  const status = statusFrom({ command, transformation });
  const decision = decisionFrom(status);
  const actionHref = status === "ready" ? launchRoomHref : command.nextGap.editHref || command.nextGap.href;
  const actionLabel = status === "ready" ? "Open launch room" : `Fix ${command.nextGap.label}`;
  const metrics: HeroBuyerDecisionBriefMetric[] = [
    {
      id: "value",
      label: "Buyer value",
      value: command.primaryMetric,
      detail: `${yen(buyerScenario.monthlyGrossValueYen)} modeled, ${buyerScenario.paybackDays}d payback.`
    },
    {
      id: "receipt",
      label: "Measured receipt",
      value: `${measuredRunSummary.actualMinutesSavedPerRun}m saved/run`,
      detail: `${measuredRunSummary.acceptanceRatePercent}% accepted, ${yen(measuredRunSummary.measuredMonthlyValueYen)} measured monthly value.`
    },
    {
      id: "proof",
      label: "Public proof",
      value: transformation.current.proofClosure,
      detail: command.nextGap.action
    }
  ];
  const buyerQuestions = buildBuyerQuestions({
    command,
    transformation,
    status,
    buyerScenario,
    measuredRunSummary,
    launchRoomHref,
    proofAuditHref,
    actionHref
  });
  const partial: HeroBuyerDecisionBriefCore = {
    status,
    decision,
    decisionLabel: status === "ready" ? "Send" : status === "attention" ? "Review" : "Hold",
    headline: headlineFor({ status, command, transformation }),
    evidence: evidenceFor({ status, command, transformation }),
    buyer: command.targetBuyer,
    score: command.launchScore,
    primaryAction: {
      label: actionLabel,
      href: actionHref
    },
    secondaryAction: {
      label: "Open proof audit",
      href: proofAuditHref
    },
    decisionReceiptAction: {
      label: "Open decision receipt",
      href: decisionReceiptHref
    },
    metrics,
    outcomeReplay: buildOutcomeReplay(
      command,
      transformation,
      buyerScenario,
      measuredRunSummary,
      status === "ready" ? "Send" : status === "attention" ? "Review" : "Hold",
      actionHref,
      launchRoomHref,
      proofAuditHref
    ),
    buyerQuestions,
    approvalPath: buildApprovalPath({ command, status, launchRoomHref })
  };

  const packetReceipt = buildPacketReceipt(partial, command);
  const brief = {
    ...partial,
    packetReceipt
  };

  return {
    ...brief,
    exportMarkdown: buildDecisionPacketMarkdown(brief, command)
  };
}

function statusIcon(status: HeroBuyerDecisionBriefStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

function launchStatusIcon(status: LaunchRoomStatus) {
  if (status === "ready") return <BadgeCheck size={13} />;
  if (status === "attention") return <Gauge size={13} />;
  return <AlertTriangle size={13} />;
}

export default function HeroBuyerDecisionBriefPanel({
  brief,
  onCopyText
}: {
  brief: HeroBuyerDecisionBrief;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyPacket = async () => {
    const copied = await onCopyText(brief.exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={`hero-buyer-decision is-${brief.status}`} aria-label="Live buyer decision brief">
      <div className="hero-buyer-decision-main">
        <span>
          {statusIcon(brief.status)}
          Live buyer decision
        </span>
        <strong>{brief.headline}</strong>
        <p>{brief.evidence}</p>
        <div className="hero-buyer-decision-actions" aria-label="Live buyer decision actions">
          <a className="hero-buyer-decision-primary" href={brief.primaryAction.href}>
            {brief.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {brief.primaryAction.label}
          </a>
          <a className="hero-buyer-decision-secondary" href={brief.secondaryAction.href} target="_blank" rel="noreferrer" aria-label={brief.secondaryAction.label}>
            <Gauge size={14} />
            Audit
          </a>
          <a className="hero-buyer-decision-secondary" href={brief.decisionReceiptAction.href} target="_blank" rel="noreferrer" aria-label={brief.decisionReceiptAction.label}>
            <ClipboardCheck size={14} />
            Receipt
          </a>
          <button
            className={`hero-buyer-decision-secondary ${copyStatus === "copied" ? "is-confirmed" : ""} ${copyStatus === "failed" ? "is-risk" : ""}`.trim()}
            type="button"
            aria-label="Copy buyer send packet"
            onClick={copyPacket}
          >
            {copyStatus === "copied" ? <BadgeCheck size={14} /> : copyStatus === "failed" ? <AlertTriangle size={14} /> : <Copy size={14} />}
            {copyLabel}
          </button>
          <button className="hero-buyer-decision-secondary" type="button" data-download="buyer-send-packet.md" data-download-filename="buyer-send-packet.md" aria-label="Download buyer send packet" onClick={() => downloadTextFile("buyer-send-packet.md", brief.exportMarkdown)}>
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
      <div className="hero-buyer-decision-score" aria-label="Live buyer decision score">
        <span>{brief.decisionLabel}</span>
        <strong>{brief.score}</strong>
        <small>{brief.buyer}</small>
      </div>
      <div className="hero-buyer-decision-metrics" aria-label="Live buyer decision evidence">
        {brief.metrics.map((metric) => (
          <article key={metric.id}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>
      <div className="hero-outcome-replay" aria-label="Buyer outcome replay">
        {brief.outcomeReplay.map((step) => (
          <a key={step.id} className={`hero-outcome-step is-${step.status}`} href={step.href}>
            <span>
              {launchStatusIcon(step.status)}
              {step.label}
            </span>
            <strong>{step.value}</strong>
            <small>{step.detail}</small>
          </a>
        ))}
      </div>
      <div className="hero-buyer-question-ledger" aria-label="Buyer decision questions">
        {brief.buyerQuestions.map((question) => (
          <a key={question.id} className={`hero-buyer-question is-${question.status}`} href={question.href}>
            <span>
              {launchStatusIcon(question.status)}
              {question.status}
            </span>
            <strong>{question.question}</strong>
            <p>{question.answer}</p>
            <small>{question.evidence}</small>
          </a>
        ))}
      </div>
      <div className="hero-buyer-approval-path" aria-label="Buyer approval path">
        {brief.approvalPath.map((step) => (
          <a key={step.id} className={`hero-buyer-approval-step is-${step.status}`} href={step.href}>
            <span>{step.status}</span>
            <strong>{step.label}</strong>
            <small>{step.summary}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
