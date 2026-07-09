import { summarizeAgentTrialEvidence } from "./agentTrialEvidence";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { isBuyerFacingProofUrl } from "./publicProofUrl";
import type { SquadOptimizerRun } from "./squadOptimizer";
import type { WorkspaceDraft } from "./workspaceDraft";

export type LaunchCommandQueueReadiness = "ready-to-check" | "needs-public-proof" | "needs-buyer-proof" | "needs-squad-decision";
export type LaunchCommandPriority = "now" | "next" | "watch";
export type LaunchCommandMilestoneStatus = "complete" | "attention" | "blocked" | "pending";

export type LaunchCommand = {
  id: string;
  label: string;
  owner: string;
  priority: LaunchCommandPriority;
  action: string;
  proof: string;
  href: string;
};

export type LaunchCommandMilestone = {
  id: string;
  label: string;
  status: LaunchCommandMilestoneStatus;
  score: number;
  evidence: string;
};

export type LaunchCommandQueue = {
  id: string;
  readiness: LaunchCommandQueueReadiness;
  commandScore: number;
  headline: string;
  hardTruth: string;
  primaryAction: LaunchCommand;
  commands: LaunchCommand[];
  milestones: LaunchCommandMilestone[];
  workOrder: LaunchCommandWorkOrder;
};

export type LaunchCommandWorkOrderIssue = {
  id: string;
  title: string;
  owner: string;
  priority: LaunchCommandPriority;
  labels: string[];
  body: string;
  acceptance: string;
  sourceHref: string;
};

export type LaunchCommandWorkOrder = {
  id: string;
  headline: string;
  issueCount: number;
  nowCount: number;
  filename: string;
  csvFilename: string;
  issues: LaunchCommandWorkOrderIssue[];
  primaryIssue: LaunchCommandWorkOrderIssue;
  markdown: string;
  href: string;
  csvText: string;
  csvHref: string;
};

export type BuildLaunchCommandQueueInput = {
  buyerScenario: BuyerValueScenario;
  squadOptimizer: SquadOptimizerRun | null;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl"> & Partial<Pick<WorkspaceDraft, "agentTrialEvidence">>;
};

function buyerImprovementCopy(scenario: BuyerValueScenario) {
  const directAction = scenario.nextActions.find((action) => action.id !== "seal-proof");
  if (directAction) {
    return {
      owner: directAction.owner,
      action: directAction.action,
      proof: directAction.proof
    };
  }

  if (scenario.readiness === "pilot-first") {
    return {
      owner: "A2A Market Broker",
      action: "Improve buyer economics by raising adoption confidence, reducing pilot scope, or selecting stronger automation before launch proof.",
      proof: "Buyer Value Simulator payback, adoption, and confidence"
    };
  }

  return {
    owner: "A2A Market Broker",
    action: "Fix adoption, payback, and confidence before presenting this as a buyer-ready offer.",
    proof: "Buyer Value Simulator assumptions and next proof moves"
  };
}

function buyerMilestone(scenario: BuyerValueScenario): LaunchCommandMilestone {
  if (scenario.readiness === "scales-now") {
    return {
      id: "buyer-value",
      label: "Buyer value case",
      status: "complete",
      score: 30,
      evidence: `${scenario.scenarioScore}/100 scenario score with ${scenario.paybackDays}-day payback.`
    };
  }
  const action = buyerImprovementCopy(scenario);

  return {
    id: "buyer-value",
    label: "Buyer value case",
    status: scenario.readiness === "pilot-first" ? "attention" : "blocked",
    score: scenario.readiness === "pilot-first" ? 18 : 8,
    evidence: `${scenario.readiness} at ${scenario.scenarioScore}/100. ${action.action}`
  };
}

function squadMilestone(optimizer: SquadOptimizerRun | null): LaunchCommandMilestone {
  if (!optimizer) {
    return {
      id: "squad-decision",
      label: "Squad decision",
      status: "pending",
      score: 10,
      evidence: "The squad optimizer is preparing the comparison from the current brief."
    };
  }

  if (optimizer.readiness === "optimized") {
    return {
      id: "squad-decision",
      label: "Squad decision",
      status: "complete",
      score: 20,
      evidence: `${optimizer.current.agents.length} agents selected with ${optimizer.optimizerScore}/100 optimizer score.`
    };
  }

  return {
    id: "squad-decision",
    label: "Squad decision",
    status: optimizer.readiness === "worth-swapping" ? "attention" : "blocked",
    score: optimizer.readiness === "worth-swapping" ? 13 : 9,
    evidence:
      optimizer.readiness === "worth-swapping"
        ? `Recommended squad improves total score by ${optimizer.delta.totalScore}.`
        : `Full coverage needs ${optimizer.budgetGap} more budget for the stretch squad.`
  };
}

function deploymentMilestone(targetUrl: string): LaunchCommandMilestone {
  const hasText = targetUrl.trim().length > 0;
  const publicUrl = isBuyerFacingProofUrl(targetUrl);

  return {
    id: "deployment-proof",
    label: "Public deployment",
    status: publicUrl ? "complete" : "blocked",
    score: publicUrl ? 20 : hasText ? 7 : 0,
    evidence: publicUrl ? "A public deployed target URL is saved." : hasText ? "Use a public https URL, not a local, HTTP, or internal target." : "Cloud Run or equivalent public URL is still missing."
  };
}

function submissionMilestone(workspace: Pick<WorkspaceDraft, "protopediaUrl" | "videoUrl">): LaunchCommandMilestone {
  const hasProtoPedia = isBuyerFacingProofUrl(workspace.protopediaUrl);
  const hasVideo = isBuyerFacingProofUrl(workspace.videoUrl);
  const savedCount = Number(hasProtoPedia) + Number(hasVideo);

  return {
    id: "submission-proof",
    label: "Submission proof",
    status: savedCount === 2 ? "complete" : savedCount === 1 ? "attention" : "blocked",
    score: savedCount === 2 ? 20 : savedCount === 1 ? 10 : 0,
    evidence:
      savedCount === 2
        ? "ProtoPedia and walkthrough video URLs are saved."
        : savedCount === 1
          ? "One final submission URL is still missing or not public."
          : "ProtoPedia and walkthrough video URLs are still missing."
  };
}

function trialMilestone(workspace: Partial<Pick<WorkspaceDraft, "agentTrialEvidence">>): LaunchCommandMilestone {
  const trial = summarizeAgentTrialEvidence(workspace.agentTrialEvidence ?? []);
  return {
    id: "a2a-trial-proof",
    label: "A2A trial proof",
    status: trial.status === "ready" ? "complete" : trial.status === "watch" ? "attention" : "blocked",
    score: trial.status === "ready" ? 10 : trial.status === "watch" ? 5 : 0,
    evidence: trial.evidence
  };
}

function publicProofReady(milestones: LaunchCommandMilestone[]) {
  return milestones.every((milestone) => milestone.status === "complete");
}

function buildPublicProofCommands(workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl"> & Partial<Pick<WorkspaceDraft, "agentTrialEvidence">>): LaunchCommand[] {
  const commands: LaunchCommand[] = [];

  if (!isBuyerFacingProofUrl(workspace.targetUrl)) {
    commands.push({
      id: "set-target-url",
      label: workspace.targetUrl.trim() ? "Fix deployed target URL" : "Set deployed target URL",
      owner: "Cloud Run SRE",
      priority: "now",
      action: "Save the public runtime URL that judges can open outside this workspace.",
      proof: "Cloud Run, Cloud Functions, GKE, App Engine, GCE, TPU, or GPU public endpoint",
      href: "#launch-evidence-console"
    });
  }

  if (!isBuyerFacingProofUrl(workspace.protopediaUrl) || !isBuyerFacingProofUrl(workspace.videoUrl)) {
    commands.push({
      id: "attach-submission-urls",
      label: "Attach submission URLs",
      owner: "Submission lead",
      priority: isBuyerFacingProofUrl(workspace.targetUrl) ? "now" : "next",
      action: "Add the ProtoPedia page and walkthrough video URL before treating this as a public launch.",
      proof: "ProtoPedia作品URL and walkthrough video URL",
      href: "#launch-evidence-console"
    });
  }

  if (summarizeAgentTrialEvidence(workspace.agentTrialEvidence ?? []).status !== "ready") {
    commands.push({
      id: "attach-a2a-trial-proof",
      label: "Attach A2A trial proof",
      owner: "A2A Market Broker",
      priority:
        isBuyerFacingProofUrl(workspace.targetUrl) && isBuyerFacingProofUrl(workspace.protopediaUrl) && isBuyerFacingProofUrl(workspace.videoUrl)
          ? "now"
          : "next",
      action: "Paste the returned trial response, verify it, and attach the accepted proof to this workspace.",
      proof: "Agent Card Intake response verifier",
      href: "#marketplace-workbench"
    });
  }

  return commands;
}

function buildBuyerCommand(scenario: BuyerValueScenario): LaunchCommand | null {
  if (scenario.readiness === "scales-now") return null;
  const action = buyerImprovementCopy(scenario);

  return {
    id: "tighten-buyer-value",
    label: "Tighten buyer value",
    owner: action.owner,
    priority: "now",
    action: action.action,
    proof: action.proof,
    href: "#buyer-value-simulator"
  };
}

function buildSquadCommand(optimizer: SquadOptimizerRun | null): LaunchCommand | null {
  if (!optimizer) {
    return {
      id: "wait-for-squad-comparison",
      label: "Wait for squad comparison",
      owner: "A2A Market Broker",
      priority: "watch",
      action: "Let the optimizer finish comparing the current, recommended, and stretch squads.",
      proof: "Squad Decision Board",
      href: "#squad-decision-board"
    };
  }

  if (optimizer.readiness === "optimized") return null;

  if (optimizer.readiness === "worth-swapping") {
    return {
      id: "apply-recommended-squad",
      label: "Apply recommended squad",
      owner: "A2A Market Broker",
      priority: "now",
      action: `Switch to the recommended squad for +${optimizer.delta.totalScore} total score before launch proof.`,
      proof: optimizer.swapPlan[0]?.reason ?? "Squad optimizer recommendation",
      href: "#squad-decision-board"
    };
  }

  return {
    id: "review-stretch-squad",
    label: "Review stretch squad",
    owner: "A2A Market Broker",
    priority: "next",
    action: `Decide whether +${optimizer.budgetGap} budget is worth the full-coverage stretch squad.`,
    proof: optimizer.stretch ? optimizer.stretch.tradeoffs[0] : "Squad optimizer stretch comparison",
    href: "#squad-decision-board"
  };
}

function launchCheckCommand(): LaunchCommand {
  return {
    id: "run-launch-check",
    label: "Run launch check",
    owner: "Cloud Run SRE",
    priority: "now",
    action: "Generate the public launch receipt from live product, release drift, and submission URL evidence.",
    proof: "Launch Evidence Console",
    href: "#launch-evidence-console"
  };
}

function readinessFor(input: {
  buyer: LaunchCommandMilestone;
  publicProof: LaunchCommandMilestone[];
  squad: LaunchCommandMilestone;
}): LaunchCommandQueueReadiness {
  if (input.buyer.status !== "complete") return "needs-buyer-proof";
  if (!publicProofReady(input.publicProof)) return "needs-public-proof";
  if (input.squad.status !== "complete") return "needs-squad-decision";
  return "ready-to-check";
}

function copyFor(readiness: LaunchCommandQueueReadiness, input: { buyerScenario: BuyerValueScenario; squadOptimizer: SquadOptimizerRun | null }): Pick<LaunchCommandQueue, "headline" | "hardTruth"> {
  if (readiness === "needs-buyer-proof") {
    return {
      headline: "Buyer value is the next blocker",
      hardTruth: `The scenario is ${input.buyerScenario.readiness}, so the launch story needs stronger economics before more proof collection.`
    };
  }

  if (readiness === "needs-public-proof") {
    return {
      headline: "Public proof is the next blocker",
      hardTruth: "The product needs public URLs and an accepted A2A trial proof before the launch check can be meaningful."
    };
  }

  if (readiness === "needs-squad-decision") {
    return {
      headline: "Squad decision is the next blocker",
      hardTruth: input.squadOptimizer?.hardTruth ?? "The squad comparison is still loading, so the launch queue is waiting on the final agent decision."
    };
  }

  return {
    headline: "Ready for a launch evidence run",
    hardTruth: "Buyer value, public URLs, and squad decision are aligned enough to generate the launch receipt."
  };
}

function commandAcceptance(command: LaunchCommand) {
  if (command.id === "set-target-url") return "A public HTTPS deployment URL is saved and the deployment-proof milestone is complete.";
  if (command.id === "attach-submission-urls") return "ProtoPedia and walkthrough video URLs are public, saved, and reflected in the submission-proof milestone.";
  if (command.id === "attach-a2a-trial-proof") return "An accepted A2A trial receipt is attached and the a2a-trial-proof milestone is complete.";
  if (command.id === "tighten-buyer-value") return "Buyer value readiness moves to scales-now or the launch remains intentionally held.";
  if (command.id === "apply-recommended-squad") return "The recommended squad is selected and the squad-decision milestone is complete.";
  if (command.id === "review-stretch-squad") return "A named owner accepts or rejects the stretch squad tradeoff before launch proof is generated.";
  if (command.id === "wait-for-squad-comparison") return "The optimizer result is available and the next squad decision command is recalculated.";
  if (command.id === "run-launch-check") return "A launch evidence receipt is generated from live public URLs and current squad/value inputs.";
  return "The command is resolved and the Launch Command Queue is recalculated.";
}

function labelFor(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function csvCell(value: unknown) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function issueBody(command: LaunchCommand, acceptance: string) {
  return [
    "## Command",
    `Priority: ${command.priority}`,
    `Owner: ${command.owner}`,
    `Proof surface: ${command.proof}`,
    "",
    "## Action",
    command.action,
    "",
    "## Acceptance",
    `- ${acceptance}`,
    "",
    "## Source",
    command.href
  ].join("\n");
}

export function buildLaunchCommandWorkOrder(queue: Omit<LaunchCommandQueue, "workOrder">): LaunchCommandWorkOrder {
  const issues = queue.commands.map((command, index): LaunchCommandWorkOrderIssue => {
    const acceptance = commandAcceptance(command);
    return {
      id: `${queue.id}-issue-${index + 1}-${command.id}`,
      title: `[${command.priority}] ${command.label}`,
      owner: command.owner,
      priority: command.priority,
      labels: ["launch-command", `priority-${command.priority}`, `owner-${labelFor(command.owner)}`],
      body: issueBody(command, acceptance),
      acceptance,
      sourceHref: command.href
    };
  });
  const nowCount = issues.filter((issue) => issue.priority === "now").length;
  const csvText = [
    "issueId,title,priority,owner,labels,action,acceptance,sourceHref",
    ...issues.map((issue, index) =>
      [
        issue.id,
        issue.title,
        issue.priority,
        issue.owner,
        issue.labels.join("|"),
        queue.commands[index]?.action ?? "",
        issue.acceptance,
        issue.sourceHref
      ]
        .map(csvCell)
        .join(",")
    )
  ].join("\n");
  const markdown = [
    "# Launch command work order",
    "",
    `Queue: ${queue.headline}`,
    `Readiness: ${queue.readiness}`,
    `Command score: ${queue.commandScore}`,
    `Open issues: ${issues.length}`,
    `Now issues: ${nowCount}`,
    "",
    ...issues.flatMap((issue) => [
      `## Issue: ${issue.title}`,
      "",
      `Owner: ${issue.owner}`,
      `Labels: ${issue.labels.join(", ")}`,
      "",
      issue.body
    ])
  ].join("\n");

  return {
    id: `${queue.id}-work-order`,
    headline: `${issues.length} launch ${issues.length === 1 ? "issue" : "issues"} ready to assign`,
    issueCount: issues.length,
    nowCount,
    filename: "launch-command-work-order.md",
    csvFilename: "launch-command-work-order.csv",
    issues,
    primaryIssue: issues[0],
    markdown,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    csvText,
    csvHref: `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`
  };
}

export function buildLaunchCommandQueue(input: BuildLaunchCommandQueueInput): LaunchCommandQueue {
  const buyer = buyerMilestone(input.buyerScenario);
  const squad = squadMilestone(input.squadOptimizer);
  const deployment = deploymentMilestone(input.workspace.targetUrl);
  const submission = submissionMilestone(input.workspace);
  const trial = trialMilestone(input.workspace);
  const publicProof = [deployment, submission, trial];
  const readiness = readinessFor({ buyer, publicProof, squad });
  const commands = [
    buildBuyerCommand(input.buyerScenario),
    ...buildPublicProofCommands(input.workspace),
    buildSquadCommand(input.squadOptimizer)
  ].filter((command): command is LaunchCommand => command !== null);
  const queuedCommands = commands.length > 0 ? commands : [launchCheckCommand()];
  const commandScore = Math.round(buyer.score + squad.score + deployment.score + submission.score + trial.score);
  const copy = copyFor(readiness, input);

  const queue: Omit<LaunchCommandQueue, "workOrder"> = {
    id: `launch-command-${readiness}-${commandScore}`,
    readiness,
    commandScore,
    ...copy,
    primaryAction: queuedCommands[0],
    commands: queuedCommands,
    milestones: [buyer, deployment, submission, trial, squad]
  };

  return {
    ...queue,
    workOrder: buildLaunchCommandWorkOrder(queue)
  };
}
