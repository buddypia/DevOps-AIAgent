import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { buildBuyerValueScenario } from "../src/buyerValueScenario";
import { buildLaunchCommandQueue } from "../src/launchCommandQueue";
import { DEFAULT_PROJECT_BRIEF } from "../src/market";
import { buildSquadOptimizer } from "../src/squadOptimizer";

const publicWorkspace = {
  targetUrl: "https://a2a-marketplace.run.app",
  protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
  videoUrl: "https://youtu.be/demo",
  agentTrialEvidence: [
    {
      id: "trial-proof-trial-custom-agent-card-auditor",
      receiptId: "trial-custom-agent-card-auditor",
      agentId: "custom-agent-card-auditor",
      agentName: "Agent Card Auditor",
      skillId: "agent-card.audit",
      status: "accepted" as const,
      score: 100,
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/agent-card-audit/receipt.json",
      evidenceSource: "Cloud Run public logs and signed A2A receipt",
      headline: "Trial evidence satisfies the generated A2A receipt",
      summary: "Agent Card Auditor returned an accepted A2A proof receipt.",
      attachedAt: "2026-06-18T00:00:00.000Z"
    }
  ]
};

function strongBuyerScenario() {
  return buildBuyerValueScenario(recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"], 200), {
    teamSize: 8,
    hourlyCostYen: 12000,
    cyclesPerMonth: 5,
    manualHoursPerCycle: 28,
    adoptionRatePercent: 75,
    incidentRiskYenPerMonth: 240000
  });
}

describe("launch command queue", () => {
  test("uses buyer-improvement copy for pilot-first scenarios", () => {
    const queue = buildLaunchCommandQueue({
      buyerScenario: buildBuyerValueScenario(recommendSquad(DEFAULT_PROJECT_BRIEF, ["market-broker", "cloud-run-sre", "gemini-strategist"], 140)),
      squadOptimizer: null,
      workspace: publicWorkspace
    });

    expect(queue.readiness).toBe("needs-buyer-proof");
    expect(queue.primaryAction).toMatchObject({
      id: "tighten-buyer-value",
      owner: "A2A Market Broker"
    });
    expect(queue.primaryAction.action).toContain("Improve buyer economics");
    expect(queue.primaryAction.action).not.toContain("Seal this value claim");
  });

  test("prioritizes missing public proof once buyer value is credible", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"],
      budget: 200,
      maxSquadSize: 4
    });
    const queue = buildLaunchCommandQueue({
      buyerScenario: strongBuyerScenario(),
      squadOptimizer: optimizer,
      workspace: {
        targetUrl: "",
        protopediaUrl: "",
        videoUrl: "",
        agentTrialEvidence: []
      }
    });

    expect(queue.readiness).toBe("needs-public-proof");
    expect(queue.primaryAction).toMatchObject({
      id: "set-target-url",
      href: "#launch-evidence-console",
      priority: "now"
    });
    expect(queue.workOrder).toMatchObject({
      headline: "3 launch issues ready to assign",
      issueCount: 3,
      nowCount: 1,
      filename: "launch-command-work-order.md",
      csvFilename: "launch-command-work-order.csv"
    });
    expect(queue.workOrder.primaryIssue).toMatchObject({
      title: "[now] Set deployed target URL",
      owner: "Cloud Run SRE",
      labels: ["launch-command", "priority-now", "owner-cloud-run-sre"]
    });
    expect(queue.workOrder.primaryIssue.body).toContain("A public HTTPS deployment URL is saved");
    expect(queue.workOrder.markdown).toContain("# Launch command work order");
    expect(queue.workOrder.markdown).toContain("## Issue: [now] Set deployed target URL");
    expect(queue.workOrder.csvText).toContain("issueId,title,priority,owner,labels,action,acceptance,sourceHref");
    expect(queue.workOrder.csvText).toContain('"[now] Set deployed target URL"');
    expect(queue.workOrder.href).toMatch(/^data:text\/markdown;charset=utf-8,/);
    expect(queue.workOrder.csvHref).toMatch(/^data:text\/csv;charset=utf-8,/);
    expect(queue.milestones.find((milestone) => milestone.id === "deployment-proof")?.status).toBe("blocked");
  });

  test("keeps URL-only proof in public-proof mode until A2A trial proof is attached", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"],
      budget: 200,
      maxSquadSize: 4
    });
    const queue = buildLaunchCommandQueue({
      buyerScenario: strongBuyerScenario(),
      squadOptimizer: optimizer,
      workspace: {
        targetUrl: "https://a2a-marketplace.run.app",
        protopediaUrl: "https://protopedia.net/prototype/a2a-marketplace",
        videoUrl: "https://youtu.be/demo",
        agentTrialEvidence: []
      }
    });

    expect(queue.readiness).toBe("needs-public-proof");
    expect(queue.primaryAction).toMatchObject({
      id: "attach-a2a-trial-proof",
      priority: "now"
    });
    expect(queue.milestones.find((milestone) => milestone.id === "a2a-trial-proof")?.status).toBe("blocked");
  });

  test("treats plain HTTP launch links as missing public proof", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"],
      budget: 200,
      maxSquadSize: 4
    });
    const queue = buildLaunchCommandQueue({
      buyerScenario: strongBuyerScenario(),
      squadOptimizer: optimizer,
      workspace: {
        ...publicWorkspace,
        targetUrl: "http://a2a-marketplace.run.app",
        protopediaUrl: "http://protopedia.net/prototype/a2a-marketplace",
        videoUrl: "http://youtu.be/demo"
      }
    });

    expect(queue.readiness).toBe("needs-public-proof");
    expect(queue.milestones.find((milestone) => milestone.id === "deployment-proof")).toMatchObject({
      status: "blocked",
      score: 7
    });
    expect(queue.primaryAction.id).toBe("set-target-url");
  });

  test("blocks launch on a weak buyer case before URL or squad work", () => {
    const weakScenario = buildBuyerValueScenario(recommendSquad(DEFAULT_PROJECT_BRIEF, ["brief-cartographer"], 140), {
      teamSize: 2,
      hourlyCostYen: 3500,
      cyclesPerMonth: 1,
      manualHoursPerCycle: 5,
      adoptionRatePercent: 15,
      incidentRiskYenPerMonth: 0
    });
    const queue = buildLaunchCommandQueue({
      buyerScenario: weakScenario,
      squadOptimizer: null,
      workspace: publicWorkspace
    });

    expect(queue.readiness).toBe("needs-buyer-proof");
    expect(queue.primaryAction).toMatchObject({
      id: "tighten-buyer-value",
      href: "#buyer-value-simulator"
    });
  });

  test("surfaces squad changes after buyer value and public proof are present", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["cloud-run-sre"],
      budget: 140,
      maxSquadSize: 4
    });
    const queue = buildLaunchCommandQueue({
      buyerScenario: strongBuyerScenario(),
      squadOptimizer: optimizer,
      workspace: publicWorkspace
    });

    expect(queue.readiness).toBe("needs-squad-decision");
    expect(queue.primaryAction).toMatchObject({
      id: "apply-recommended-squad",
      href: "#squad-decision-board"
    });
  });

  test("moves to launch check when value, proof URLs, and squad are aligned", () => {
    const optimizer = buildSquadOptimizer({
      projectBrief: DEFAULT_PROJECT_BRIEF,
      selectedAgentIds: ["market-broker", "cloud-run-sre", "gemini-strategist", "ux-guildmaster"],
      budget: 200,
      maxSquadSize: 4
    });
    const queue = buildLaunchCommandQueue({
      buyerScenario: strongBuyerScenario(),
      squadOptimizer: optimizer,
      workspace: publicWorkspace
    });

    expect(queue.readiness).toBe("ready-to-check");
    expect(queue.commandScore).toBe(100);
    expect(queue.primaryAction).toMatchObject({
      id: "run-launch-check",
      href: "#launch-evidence-console"
    });
    expect(queue.workOrder).toMatchObject({
      headline: "1 launch issue ready to assign",
      issueCount: 1,
      nowCount: 1
    });
    expect(queue.workOrder.primaryIssue.body).toContain("A launch evidence receipt is generated");
  });
});
