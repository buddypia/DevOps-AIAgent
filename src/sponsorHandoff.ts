import { summarizeAgentTrialEvidence } from "./agentTrialEvidence.js";
import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import type { BuyerJourney, BuyerJourneyReadiness } from "./buyerJourney.js";

export type SponsorHandoffTone = "ready" | "evidence" | "blocked";

export type SponsorHandoffLink = {
  id: string;
  label: string;
  href: string;
  purpose: string;
};

export type SponsorHandoffProofHighlight = {
  id: string;
  label: string;
  value: string;
  evidence: string;
  tone: SponsorHandoffTone;
};

export type SponsorHandoffPacket = {
  id: string;
  tone: SponsorHandoffTone;
  subject: string;
  headline: string;
  summary: string;
  statusLine: string;
  nextActionLine: string;
  decisionAsk: string;
  proofHighlights: SponsorHandoffProofHighlight[];
  links: SponsorHandoffLink[];
  copyText: string;
};

function toneFor(readiness: BuyerJourneyReadiness): SponsorHandoffTone {
  if (readiness === "ready-for-sponsor") return "ready";
  if (readiness === "needs-evidence") return "evidence";
  return "blocked";
}

function subjectFor(readiness: BuyerJourneyReadiness) {
  if (readiness === "ready-for-sponsor") return "Sponsor review ready: AI agent pilot workspace";
  if (readiness === "needs-evidence") return "Evidence needed: AI agent pilot workspace";
  return "Draft only: AI agent pilot workspace is not approval-ready";
}

function headlineFor(readiness: BuyerJourneyReadiness) {
  if (readiness === "ready-for-sponsor") return "Send a sponsor-ready handoff";
  if (readiness === "needs-evidence") return "Send context with the evidence gap";
  return "Send as draft context only";
}

function summaryFor(readiness: BuyerJourneyReadiness) {
  if (readiness === "ready-for-sponsor") {
    return "This note gives the sponsor one workspace link, the decision context, and the proof-backed offer artifacts to inspect.";
  }
  if (readiness === "needs-evidence") {
    return "This note is safe to share as a working handoff because it names the open proof gap before asking for approval.";
  }
  return "This note prevents a weak demo from being mistaken for an approval request.";
}

function absoluteHref(baseHref: string, href: string) {
  try {
    return new URL(href, baseHref).toString();
  } catch {
    return href;
  }
}

function buildCopyText(input: {
  subject: string;
  statusLine: string;
  nextActionLine: string;
  decisionAsk: string;
  proofHighlights: SponsorHandoffProofHighlight[];
  shareHref: string;
  links: SponsorHandoffLink[];
}) {
  return [
    `Subject: ${input.subject}`,
    "",
    input.statusLine,
    input.nextActionLine,
    `Decision ask: ${input.decisionAsk}`,
    "",
    "Proof highlights:",
    ...input.proofHighlights.map((proof) => `- ${proof.label}: ${proof.value}. ${proof.evidence}`),
    "",
    `Workspace: ${input.shareHref}`,
    "",
    "Artifacts:",
    ...input.links.filter((link) => link.id !== "workspace").map((link) => `- ${link.label}: ${link.href}`),
    "",
    "Please open the workspace first so the brief, squad, ROI assumptions, public proof URLs, and buyer artifacts are reviewed from the same state."
  ].join("\n");
}

function proofTone(status: "ready" | "watch" | "missing"): SponsorHandoffTone {
  if (status === "ready") return "ready";
  if (status === "watch") return "evidence";
  return "blocked";
}

function buildProofHighlights(input: { journey: BuyerJourney; agentTrialEvidence?: AgentTrialEvidenceRecord[] }): SponsorHandoffProofHighlight[] {
  const proofStep = input.journey.steps.find((step) => step.id === "public-proof");
  const trial = summarizeAgentTrialEvidence(input.agentTrialEvidence ?? []);
  const accepted = trial.latestAccepted;
  const trialReadyFromJourney = proofStep?.evidence.includes("A2A trial proof: ready") ?? false;
  const trialTone = accepted || trialReadyFromJourney ? "ready" : proofTone(trial.status);

  return [
    {
      id: "buyer-path",
      label: "Buyer path",
      value: `${input.journey.completedSteps}/${input.journey.totalSteps} steps ready`,
      evidence: `Journey score ${input.journey.journeyScore}/100; next owner ${input.journey.nextAction.owner}.`,
      tone: toneFor(input.journey.readiness)
    },
    {
      id: "a2a-trial",
      label: "A2A trial proof",
      value: accepted ? `${accepted.agentName} / ${accepted.skillId}` : trialReadyFromJourney ? "Accepted proof recorded in workspace" : trial.status === "watch" ? "Trial attached but not accepted" : "No accepted trial",
      evidence: accepted ? `${accepted.score}/100 via ${accepted.evidenceSource}. Artifact: ${accepted.artifactUrl || accepted.summary}` : trialReadyFromJourney ? proofStep?.evidence ?? trial.evidence : trial.evidence,
      tone: trialTone
    },
    {
      id: "public-proof",
      label: "Public proof",
      value: proofStep?.status === "complete" ? "Runtime, submission, and A2A proof attached" : proofStep?.action ?? input.journey.nextAction.label,
      evidence: proofStep?.evidence ?? input.journey.nextAction.reason,
      tone: proofStep?.status === "complete" ? "ready" : proofStep?.status === "attention" ? "evidence" : "blocked"
    }
  ];
}

function decisionAskFor(input: { journey: BuyerJourney; proofHighlights: SponsorHandoffProofHighlight[] }) {
  const blocked = input.proofHighlights.find((proof) => proof.tone === "blocked");
  if (input.journey.readiness === "ready-for-sponsor" && !blocked) {
    return "Approve the first buyer pilot review using the workspace, buyer proof packet, trust center, commercial offer, and execution handoff.";
  }
  return `Hold sponsor approval until ${blocked?.label ?? input.journey.nextAction.label} is clear.`;
}

export function buildSponsorHandoffPacket(input: { journey: BuyerJourney; shareHref: string; agentTrialEvidence?: AgentTrialEvidenceRecord[] }): SponsorHandoffPacket {
  const tone = toneFor(input.journey.readiness);
  const subject = subjectFor(input.journey.readiness);
  const statusLine = `Status: ${input.journey.readiness} (${input.journey.completedSteps}/${input.journey.totalSteps} buyer-path steps ready, score ${input.journey.journeyScore}/100).`;
  const nextActionLine = `Next action: ${input.journey.nextAction.label} - ${input.journey.nextAction.owner}. ${input.journey.nextAction.reason}`;
  const proofHighlights = buildProofHighlights({ journey: input.journey, agentTrialEvidence: input.agentTrialEvidence });
  const decisionAsk = decisionAskFor({ journey: input.journey, proofHighlights });
  const links: SponsorHandoffLink[] = [
    {
      id: "workspace",
      label: "Workspace",
      href: input.shareHref,
      purpose: "Reopens the exact brief, squad, ROI assumptions, and public proof URLs."
    },
    ...input.journey.artifacts.map((artifact) => ({
      id: artifact.id,
      label: artifact.label,
      href: absoluteHref(input.shareHref, artifact.href),
      purpose: artifact.purpose
    }))
  ];

  return {
    id: `sponsor-handoff-${tone}-${input.journey.journeyScore}`,
    tone,
    subject,
    headline: headlineFor(input.journey.readiness),
    summary: summaryFor(input.journey.readiness),
    statusLine,
    nextActionLine,
    decisionAsk,
    proofHighlights,
    links,
    copyText: buildCopyText({
      subject,
      statusLine,
      nextActionLine,
      decisionAsk,
      proofHighlights,
      shareHref: input.shareHref,
      links
    })
  };
}
