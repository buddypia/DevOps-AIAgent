import type { QuickWorkflowCommercialPilotOffer } from "./QuickWorkflowIntakePanel";

type QuickWorkflowCommercialResponseStatus = "ready" | "watch" | "blocked";
export type QuickWorkflowCommercialResponseDecision = "approved" | "needs-revision" | "declined" | "waiting";

export type QuickWorkflowCommercialResponseFollowUp = {
  id: "approval-record" | "proof-repair" | "commercial-redline" | "kickoff" | "objection-log";
  label: string;
  status: QuickWorkflowCommercialResponseStatus;
  owner: string;
  action: string;
  evidence: string;
};

export type QuickWorkflowCommercialResponseRecord = {
  status: QuickWorkflowCommercialResponseStatus;
  decision: QuickWorkflowCommercialResponseDecision;
  headline: string;
  summary: string;
  nextAction: string;
  owner: string;
  meetingUpdate: string;
  closeoutLine: string;
  detectedSignals: string[];
  followUps: QuickWorkflowCommercialResponseFollowUp[];
  exportMarkdown: string;
  exportHref: string;
};

function includesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function compactLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function responseSignals(normalized: string) {
  const signals: string[] = [];
  if (includesAny(normalized, [/\bapprove[sd]?\b/, /\bapproved\b/, /\bgo ahead\b/, /\bproceed\b/, /\byes\b/, /\bsign[- ]?off\b/])) {
    signals.push("approval intent");
  }
  if (includesAny(normalized, [/\bsecurity\b/, /\blegal\b/, /\bprocurement\b/, /\bfinance\b/, /\bvendor\b/, /\bmsa\b/])) {
    signals.push("stakeholder review");
  }
  if (includesAny(normalized, [/\bproof\b/, /\breceipt\b/, /\bverify\b/, /\bverification\b/, /\bevidence\b/, /\blink\b/])) {
    signals.push("proof request");
  }
  if (includesAny(normalized, [/\bprice\b/, /\bdiscount\b/, /\bcap\b/, /\bbudget\b/, /\btoo expensive\b/, /\bcost\b/])) {
    signals.push("commercial question");
  }
  if (includesAny(normalized, [/\bno\b/, /\bdecline[sd]?\b/, /\breject(?:ed)?\b/, /\bnot approved\b/, /\bnot now\b/, /\bcancel\b/])) {
    signals.push("negative decision");
  }
  return signals.length > 0 ? signals : ["unclassified response"];
}

export function buildQuickWorkflowCommercialResponseRecord(
  offer: QuickWorkflowCommercialPilotOffer,
  responseText: string
): QuickWorkflowCommercialResponseRecord {
  const response = compactLine(responseText);
  const normalized = response.toLowerCase();
  const signals = response ? responseSignals(normalized) : [];
  const hasApproval = signals.includes("approval intent");
  const hasNegative = signals.includes("negative decision");
  const proofAttachment = offer.decisionPacket.attachments.find((attachment) => attachment.id === "public-proof");
  const proofNeedsRepair = proofAttachment?.status !== "ready";
  const hasRevision = signals.some(
    (signal) => ["stakeholder review", "commercial question"].includes(signal) || (signal === "proof request" && proofNeedsRepair)
  );
  const offerCanMove = offer.status === "ready" && offer.decisionPacket.status === "ready" && offer.approvalMemo.decision === "approve";
  const decision: QuickWorkflowCommercialResponseDecision = !response
    ? "waiting"
    : hasNegative
      ? "declined"
      : hasApproval && offerCanMove && !hasRevision
        ? "approved"
        : "needs-revision";
  const status: QuickWorkflowCommercialResponseStatus =
    decision === "approved" ? "ready" : decision === "needs-revision" ? "watch" : "blocked";
  const firstRedline = offer.approvalMemo.redlines.find((redline) => !/no commercial redlines/i.test(redline));
  const headline =
    decision === "approved"
      ? "Buyer approved the pilot path"
      : decision === "needs-revision"
        ? "Buyer response needs a controlled revision"
        : decision === "declined"
          ? "Buyer declined or paused the pilot"
          : "Paste a buyer response to close the loop";
  const summary =
    decision === "approved"
      ? `${offer.priceLine} can move to kickoff because the buyer response has approval intent and the send gate is clear.`
      : decision === "needs-revision"
        ? "The response contains approval friction or the offer still has redlines; keep the packet internal until the follow-up closes."
        : decision === "declined"
          ? "Do not keep selling the same packet. Log the objection and repair the value case before reopening."
          : "After sending the packet, paste the buyer or sponsor reply here to classify the next action.";
  const nextAction =
    decision === "approved"
      ? "Schedule kickoff, attach the buyer approval response, and issue the pilot acceptance receipt."
      : decision === "needs-revision"
        ? firstRedline || "Answer the buyer's open question, refresh the packet, and resend with the changed evidence."
        : decision === "declined"
          ? "Capture the objection, stop buyer-send, and choose whether to lower scope, repair proof, or abandon this workflow."
          : "Send the decision packet or paste the buyer reply once it arrives.";
  const owner =
    decision === "approved"
      ? "Pilot sponsor"
      : decision === "needs-revision"
        ? offer.owner
        : decision === "declined"
          ? "Workflow owner"
          : "Commercial owner";
  const meetingUpdate =
    decision === "approved"
      ? `Move ${offer.priceLine} to kickoff with receipt-based acceptance.`
      : decision === "needs-revision"
        ? `Hold external send until follow-up closes: ${nextAction}`
        : decision === "declined"
          ? "Close the current commercial ask and record the reason before another buyer touch."
          : "No buyer decision recorded yet.";
  const closeoutLine =
    decision === "approved"
      ? "Approval recorded; next gate is pilot kickoff and live proof verification."
      : decision === "needs-revision"
        ? "Revision recorded; next gate is a repaired packet with explicit changed evidence."
        : decision === "declined"
          ? "Decline recorded; next gate is an objection-led value repair."
          : "Waiting for response.";
  const followUps: QuickWorkflowCommercialResponseFollowUp[] = [
    {
      id: "approval-record",
      label: "Buyer response record",
      status: response ? status : "blocked",
      owner,
      action:
        decision === "approved"
          ? "Attach this response to the buyer room as approval evidence."
          : response
            ? "Store this response as the current buyer decision evidence."
            : "Paste the buyer response after sending the packet.",
      evidence: response || "No response captured yet."
    },
    {
      id: "proof-repair",
      label: "Proof follow-up",
      status: proofAttachment?.status === "ready" && decision !== "declined" ? "ready" : "watch",
      owner: "Proof owner",
      action:
        proofAttachment?.status === "ready"
          ? "Attach the live verification receipt before kickoff."
          : proofAttachment?.action || "Repair proof before another buyer send.",
      evidence: proofAttachment?.value || "Proof packet not attached."
    },
    {
      id: decision === "declined" ? "objection-log" : "commercial-redline",
      label: decision === "declined" ? "Objection log" : "Commercial redline",
      status: decision === "approved" ? "ready" : decision === "declined" ? "blocked" : "watch",
      owner: offer.owner,
      action:
        decision === "approved"
          ? "No commercial redline remains before kickoff."
          : decision === "declined"
            ? "Write the strongest objection into the value diagnosis before repricing."
            : nextAction,
      evidence: decision === "approved" ? offer.approvalMemo.sendLine : signals.join(", ")
    },
    {
      id: "kickoff",
      label: "Pilot kickoff",
      status: decision === "approved" ? "ready" : "blocked",
      owner: "Pilot sponsor",
      action: decision === "approved" ? "Schedule kickoff and confirm the acceptance receipt owner." : "Do not schedule kickoff until approval is recorded.",
      evidence: offer.decisionPacket.decisionAsk
    }
  ];
  const exportMarkdown = [
    "# Quick workflow commercial response record",
    "",
    headline,
    `Status: ${status}`,
    `Decision: ${decision}`,
    `Owner: ${owner}`,
    `Next action: ${nextAction}`,
    `Meeting update: ${meetingUpdate}`,
    `Closeout: ${closeoutLine}`,
    "",
    "## Buyer response",
    response || "No response captured yet.",
    "",
    "## Detected signals",
    ...signals.map((signal) => `- ${signal}`),
    "",
    "## Follow-ups",
    ...followUps.map((followUp) => `- [${followUp.status}] ${followUp.label} (${followUp.owner}): ${followUp.action} Evidence: ${followUp.evidence}`)
  ].join("\n");

  return {
    status,
    decision,
    headline,
    summary,
    nextAction,
    owner,
    meetingUpdate,
    closeoutLine,
    detectedSignals: signals,
    followUps,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}
