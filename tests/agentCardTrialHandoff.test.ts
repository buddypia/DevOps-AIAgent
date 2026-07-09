import { describe, expect, test } from "vitest";
import { buildAgentCardTrialPlan, runAgentCardTrialPlan } from "../server/agentCardTrialPlan";
import { buildAgentCardTrialVerification, sampleTrialResponseFor } from "../server/agentCardTrialVerification";
import { buildAgentCardTrialHandoff, evidenceRecordFromTrialVerification, runAgentCardTrialHandoff } from "../server/agentCardTrialHandoff";
import { buildWorkspaceDraft, decodeWorkspaceShareParam } from "../src/workspaceDraft";
import type { AgentCardDiscoveryResult } from "../server/agentCardDiscovery";
import { buildAgentCardDiligence } from "../server/agentCardDiligence";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];
const BASE_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof";

const STRONG_CARD = {
  name: "Global Release Steward",
  description: "Runs A2A release handoffs, validates MCP tools, checks Cloud Run evidence, and writes buyer safety receipts.",
  url: "https://agents.example.com/.well-known/agent-card.json",
  provider: { organization: "Example Agents" },
  defaultInputModes: ["application/json", "text/plain"],
  defaultOutputModes: ["application/json"],
  skills: [
    { id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." },
    { id: "receipt.write", name: "Receipt writer", description: "Writes buyer handoff receipts with acceptance gates." }
  ],
  mcp: { name: "release-steward", tools: ["read_checks", "read_logs", "write_receipt"] }
};

async function buildStrongPlan() {
  return runAgentCardTrialPlan("https://agents.example.com", {
    resolveHost: async () => PUBLIC_RECORDS,
    fetchImpl: async (url) =>
      new Response(JSON.stringify({ ...STRONG_CARD, url: String(url) }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
  });
}

function providedWorkspace() {
  return buildWorkspaceDraft({
    activeTemplateId: "custom",
    projectBrief: "Buyer evaluates release-proof automation for a global platform team.",
    selectedAgentIds: ["market-broker", "cloud-run-sre"],
    buyerScenario: {
      teamSize: 10,
      hourlyCostYen: 15000,
      cyclesPerMonth: 6,
      manualHoursPerCycle: 24,
      adoptionRatePercent: 70,
      incidentRiskYenPerMonth: 250000
    },
    targetUrl: "https://buyer.example.com",
    protopediaUrl: "",
    videoUrl: "",
    updatedAt: "2026-06-20T12:00:00.000Z"
  });
}

describe("Agent Card trial handoff", () => {
  test("turns an accepted trial verification into workspace evidence and buyer links", async () => {
    const plan = await buildStrongPlan();
    const verification = buildAgentCardTrialVerification(plan, sampleTrialResponseFor(plan), "2026-06-20T12:00:00.000Z");
    const handoff = buildAgentCardTrialHandoff({
      verification,
      baseUrl: BASE_URL,
      workspace: providedWorkspace(),
      checkedAt: "2026-06-20T12:01:00.000Z",
      workspaceAgentId: "custom-global-release-steward"
    });

    expect(handoff.status).toBe("workspace-ready");
    expect(handoff.evidenceRecord).toMatchObject({
      receiptId: plan.receiptId,
      agentId: "custom-global-release-steward",
      agentName: "Global Release Steward",
      skillId: "release.audit",
      status: "accepted"
    });
    expect(handoff.workspace.agentTrialEvidence[0]).toMatchObject({
      receiptId: plan.receiptId,
      agentId: "custom-global-release-steward",
      status: "accepted"
    });
    expect(handoff.links.map((link) => link.id)).toEqual(["launch-room", "buyer-proof-packet", "procurement-decision", "proof-monitor"]);
    expect(handoff.exportMarkdown).toContain("## Workspace links");
    expect(handoff.exportMarkdown).toContain(`- Evidence record: trial-proof-${plan.receiptId}`);
    expect(handoff.exportMarkdown).not.toContain("[object Object]");
    const decoded = decodeWorkspaceShareParam(new URL(handoff.links[0].url).searchParams.get("workspace"));
    expect(decoded.projectBrief).toContain("global platform team");
    expect(decoded.agentTrialEvidence[0].receiptId).toBe(plan.receiptId);
    expect(decoded.agentTrialEvidence[0].agentId).toBe("custom-global-release-steward");
  });

  test("does not generate workspace evidence when verification fails", () => {
    const report = buildAgentCardDiligence(
      "https://agents.example.com/broken.json",
      {
        status: "rejected",
        error: "Host resolves to a private address.",
        warnings: [],
        signals: []
      } satisfies AgentCardDiscoveryResult,
      "2026-06-20T12:00:00.000Z"
    );
    const plan = buildAgentCardTrialPlan(report, "2026-06-20T12:00:00.000Z");
    const verification = buildAgentCardTrialVerification(plan, {
      receiptId: "changed",
      skillId: plan.skillId,
      status: "completed",
      artifactUrl: "https://storage.googleapis.com/a2a-agent-marketplace-proof/receipt.json",
      evidenceSource: "Public receipt",
      requiresCredentials: false,
      privateUrl: false,
      mutatedProduction: false,
      destructiveAction: false
    });
    const handoff = buildAgentCardTrialHandoff({ verification, baseUrl: BASE_URL, workspace: providedWorkspace() });

    expect(verification.status).toBe("failed");
    expect(evidenceRecordFromTrialVerification(verification)).toBeNull();
    expect(handoff.status).toBe("blocked");
    expect(handoff.evidenceRecord).toBeNull();
    expect(handoff.workspace.agentTrialEvidence).toEqual([]);
  });

  test("runs handoff from a raw response and preserves the supplied workspace", async () => {
    const plan = await buildStrongPlan();
    const handoff = await runAgentCardTrialHandoff({
      sourceUrl: "https://agents.example.com",
      rawResponse: sampleTrialResponseFor(plan),
      baseUrl: BASE_URL,
      workspace: providedWorkspace(),
      workspaceAgentId: "custom-global-release-steward",
      deps: {
        resolveHost: async () => PUBLIC_RECORDS,
        fetchImpl: async (url) =>
          new Response(JSON.stringify({ ...STRONG_CARD, url: String(url) }), {
            status: 200,
            headers: { "content-type": "application/json" }
          })
      }
    });

    expect(handoff.status).toBe("workspace-ready");
    expect(handoff.workspace.targetUrl).toBe("https://buyer.example.com");
    expect(handoff.workspace.agentTrialEvidence[0].agentId).toBe("custom-global-release-steward");
    expect(handoff.workspace.agentTrialEvidence[0].artifactUrl).toContain("storage.googleapis.com/a2a-agent-marketplace-proof");
    expect(handoff.exportMarkdown).toContain("Workspace links");
  });
});
