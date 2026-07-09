import { summarizeAgentTrialEvidence } from "./agentTrialEvidence.js";
import type { BuyerValueScenario } from "./buyerValueScenario.js";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { buildPilotWorkflowPlan } from "./pilotWorkflow.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type OutcomeSnapshotReadiness = "publish-ready" | "needs-proof" | "needs-value";
export type OutcomeSnapshotStatus = "complete" | "attention" | "blocked";
export type OutcomeSnapshotPriority = "now" | "next" | "watch";

export type OutcomeSnapshotCheck = {
  id: string;
  label: string;
  status: OutcomeSnapshotStatus;
  score: number;
  owner: string;
  evidence: string;
  action: string;
  href: string;
};

export type OutcomeSnapshotAction = {
  id: string;
  label: string;
  owner: string;
  priority: OutcomeSnapshotPriority;
  action: string;
  proof: string;
  href: string;
};

export type OutcomeSnapshotMetric = {
  label: string;
  value: string;
  evidence: string;
};

export type OutcomeSnapshotLink = {
  id: string;
  label: string;
  href: string;
  status: OutcomeSnapshotStatus;
};

export type OutcomeSnapshot = {
  id: string;
  readiness: OutcomeSnapshotReadiness;
  outcomeScore: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  primaryMetric: OutcomeSnapshotMetric;
  nextAction: OutcomeSnapshotAction;
  checks: OutcomeSnapshotCheck[];
  quickLinks: OutcomeSnapshotLink[];
};

export type BuildOutcomeSnapshotInput = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  pilotRun: PilotRunReceiptInput;
};

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function statusScore(status: OutcomeSnapshotStatus) {
  if (status === "complete") return 100;
  if (status === "attention") return 62;
  return 18;
}

function buyerValueCheck(input: { scenario: BuyerValueScenario; buyer: string }): OutcomeSnapshotCheck {
  if (input.scenario.readiness === "scales-now") {
    return {
      id: "buyer-value",
      label: "Buyer value",
      status: "complete",
      score: 100,
      owner: input.buyer,
      evidence: `${input.scenario.monthlyHoursSaved}h/month, ${yen(input.scenario.monthlyGrossValueYen)} modeled value, ${input.scenario.paybackDays}-day payback.`,
      action: "Use this value case as the baseline for public proof and sponsor approval.",
      href: "#buyer-value-simulator"
    };
  }

  const directNext = input.scenario.nextActions.find((action) => action.id !== "seal-proof");
  const next =
    directNext ??
    (input.scenario.readiness === "pilot-first"
      ? {
          owner: "A2A Market Broker",
          action: "Improve buyer economics by raising adoption confidence, reducing pilot scope, or selecting stronger automation before launch proof."
        }
      : {
          owner: "A2A Market Broker",
          action: "Fix adoption, payback, and confidence before presenting this as a buyer-ready offer."
        });
  return {
    id: "buyer-value",
    label: "Buyer value",
    status: input.scenario.readiness === "pilot-first" ? "attention" : "blocked",
    score: input.scenario.readiness === "pilot-first" ? 62 : 18,
    owner: next.owner,
    evidence: `${input.scenario.readiness} at ${input.scenario.scenarioScore}/100 with ${input.scenario.paybackDays}-day payback.`,
    action: next.action,
    href: "#buyer-value-simulator"
  };
}

function deploymentCheck(targetUrl: string): OutcomeSnapshotCheck {
  const publicUrl = isBuyerFacingProofUrl(targetUrl);
  return {
    id: "deployment-proof",
    label: "Public deployment",
    status: publicUrl ? "complete" : "blocked",
    score: publicUrl ? 100 : 18,
    owner: "Cloud Run SRE",
    evidence: publicUrl ? "A public deployed target URL is saved." : "No public runtime URL is saved yet.",
    action: publicUrl ? "Keep the runtime URL attached to every buyer-facing packet." : "Save the deployed URL that an external reviewer can open.",
    href: "#launch-evidence-console"
  };
}

function submissionCheck(input: Pick<WorkspaceDraft, "protopediaUrl" | "videoUrl">): OutcomeSnapshotCheck {
  const protopediaReady = isBuyerFacingProofUrl(input.protopediaUrl);
  const videoReady = isBuyerFacingProofUrl(input.videoUrl);
  const count = Number(protopediaReady) + Number(videoReady);
  return {
    id: "submission-proof",
    label: "Public story proof",
    status: count === 2 ? "complete" : count === 1 ? "attention" : "blocked",
    score: count === 2 ? 100 : count === 1 ? 62 : 18,
    owner: "Publication lead",
    evidence: count === 2 ? "Public story and walkthrough video URLs are saved." : count === 1 ? "One publication URL is public; one is still missing." : "Public story and walkthrough video URLs are missing.",
    action: count === 2 ? "Use the saved publication URLs in the proof packet." : "Attach both the public story page and the walkthrough video URL.",
    href: "#launch-evidence-console"
  };
}

function trialCheck(workspace: Partial<Pick<WorkspaceDraft, "agentTrialEvidence">>): OutcomeSnapshotCheck {
  const trial = summarizeAgentTrialEvidence(workspace.agentTrialEvidence ?? []);
  return {
    id: "a2a-trial-proof",
    label: "A2A trial proof",
    status: trial.status === "ready" ? "complete" : trial.status === "watch" ? "attention" : "blocked",
    score: trial.status === "ready" ? 100 : trial.status === "watch" ? 62 : 18,
    owner: "A2A Market Broker",
    evidence: trial.evidence,
    action: trial.status === "ready" ? "Keep the accepted trial proof attached to the workspace." : "Verify and attach an accepted A2A trial response.",
    href: "#marketplace-workbench"
  };
}

function pilotReceiptCheck(input: BuildOutcomeSnapshotInput): OutcomeSnapshotCheck {
  const workflow = buildPilotWorkflowPlan({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario
  });
  const receipt = buildPilotRunReceipt({
    recommendation: input.recommendation,
    valueBlueprint: input.valueBlueprint,
    buyerScenario: input.buyerScenario,
    workflow,
    pilotRun: input.pilotRun
  });
  return {
    id: "pilot-receipt",
    label: "First pilot receipt",
    status: receipt.readiness === "accepted" ? "complete" : receipt.readiness === "needs-evidence" ? "attention" : "blocked",
    score: receipt.readiness === "accepted" ? 100 : receipt.readiness === "needs-evidence" ? 62 : 18,
    owner: receipt.reviewerName || "Pilot reviewer",
    evidence: `${receipt.actualMinutesSavedPerRun}m saved/run, ${receipt.acceptanceRatePercent}% acceptance, evidence URL ${receipt.evidenceUrl ? "attached" : "missing"}.`,
    action: receipt.readiness === "accepted" ? "Use the first-run receipt as measured buyer proof." : "Attach a public receipt and rerun the measured pilot check.",
    href: "#pilot-run-receipt"
  };
}

function proofPacketCheck(input: { buyer: OutcomeSnapshotCheck; proofChecks: OutcomeSnapshotCheck[] }): OutcomeSnapshotCheck {
  const open = [input.buyer, ...input.proofChecks].filter((check) => check.status !== "complete");
  const blocked = open.some((check) => check.status === "blocked");
  return {
    id: "buyer-proof-packet",
    label: "Buyer proof packet",
    status: open.length === 0 ? "complete" : blocked ? "blocked" : "attention",
    score: open.length === 0 ? 100 : blocked ? 18 : 62,
    owner: "Sponsor owner",
    evidence: open.length === 0
      ? "Value, public proof, A2A trial, and measured run are ready to share."
      : `${open.length} prerequisite item${open.length === 1 ? "" : "s"} still ${open.length === 1 ? "needs" : "need"} closure.`,
    action: open.length === 0 ? "Share the buyer proof packet and ask for pilot approval." : `Close ${open[0]?.label ?? "the open proof gap"} before sharing externally.`,
    href: "#buyer-proof-packet"
  };
}

function readinessFor(checks: OutcomeSnapshotCheck[]): OutcomeSnapshotReadiness {
  const buyer = checks.find((check) => check.id === "buyer-value");
  if (buyer?.status !== "complete") return "needs-value";
  if (checks.some((check) => check.status !== "complete")) return "needs-proof";
  return "publish-ready";
}

function copyFor(readiness: OutcomeSnapshotReadiness, input: { scenario: BuyerValueScenario; openCount: number }) {
  if (readiness === "needs-value") {
    return {
      headline: "Buyer value is the next gap",
      hardTruth: input.scenario.hardTruth
    };
  }
  if (readiness === "needs-proof") {
    return {
      headline: "Value is credible; public proof is still open",
      hardTruth: `${input.openCount} proof item${input.openCount === 1 ? "" : "s"} still make this workspace feel internal rather than globally publishable.`
    };
  }
  return {
    headline: "Publishable buyer proof is ready",
    hardTruth: "A reviewer can inspect the value case, deployed product, submission links, A2A trial proof, and first-run receipt without private context."
  };
}

function actionFrom(check: OutcomeSnapshotCheck, readiness: OutcomeSnapshotReadiness): OutcomeSnapshotAction {
  if (readiness === "publish-ready") {
    return {
      id: "share-proof-packet",
      label: "Share buyer proof packet",
      owner: "Sponsor owner",
      priority: "now",
      action: "Open the buyer proof packet and use it as the approval artifact for the first buyer pilot.",
      proof: "Buyer proof packet",
      href: "#buyer-proof-packet"
    };
  }

  return {
    id: `fix-${check.id}`,
    label: check.label,
    owner: check.owner,
    priority: check.status === "blocked" ? "now" : "next",
    action: check.action,
    proof: check.evidence,
    href: check.href
  };
}

export function buildOutcomeSnapshot(input: BuildOutcomeSnapshotInput): OutcomeSnapshot {
  const buyer = buyerValueCheck({ scenario: input.buyerScenario, buyer: input.valueBlueprint.primaryUser });
  const deployment = deploymentCheck(input.workspace.targetUrl);
  const submission = submissionCheck(input.workspace);
  const trial = trialCheck(input.workspace);
  const pilotReceipt = pilotReceiptCheck(input);
  const packet = proofPacketCheck({ buyer, proofChecks: [deployment, submission, trial, pilotReceipt] });
  const checks = [buyer, deployment, submission, trial, pilotReceipt, packet];
  const readiness = readinessFor(checks);
  const openChecks = checks.filter((check) => check.status !== "complete");
  const copy = copyFor(readiness, { scenario: input.buyerScenario, openCount: openChecks.length });
  const nextCheck = openChecks[0] ?? packet;
  const outcomeScore = Math.round(
    buyer.score * 0.34 + deployment.score * 0.13 + submission.score * 0.13 + trial.score * 0.14 + pilotReceipt.score * 0.16 + packet.score * 0.1
  );

  return {
    id: `outcome-snapshot-${readiness}-${outcomeScore}`,
    readiness,
    outcomeScore,
    ...copy,
    targetBuyer: input.valueBlueprint.primaryUser,
    primaryMetric: {
      label: "Modeled monthly value",
      value: yen(input.buyerScenario.monthlyGrossValueYen),
      evidence: `${input.buyerScenario.monthlyHoursSaved}h/month saved with ${input.buyerScenario.confidenceScore}/100 confidence.`
    },
    nextAction: actionFrom(nextCheck, readiness),
    checks,
    quickLinks: [
      { id: "proof-packet", label: "Proof packet", href: "#buyer-proof-packet", status: packet.status },
      { id: "launch-evidence", label: "Launch evidence", href: "#launch-evidence-console", status: deployment.status === "complete" && submission.status === "complete" && trial.status === "complete" ? "complete" : "attention" },
      { id: "pilot-receipt", label: "Pilot receipt", href: "#pilot-run-receipt", status: pilotReceipt.status },
      { id: "buyer-value", label: "Buyer value", href: "#buyer-value-simulator", status: buyer.status }
    ]
  };
}
