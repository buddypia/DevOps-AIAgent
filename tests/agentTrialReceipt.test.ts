import { describe, expect, test } from "vitest";
import { buildImportedAgentFromCard } from "../src/customAgent";
import { buildAgentTrialReceipt } from "../src/agentTrialReceipt";

const CARD = {
  name: "A2A Release Steward",
  description: "Runs A2A release handoffs, validates MCP tools, checks Cloud Run evidence, and writes safety receipts.",
  url: "https://agents.example.com/.well-known/agent-card.json",
  provider: { organization: "Example Agents" },
  defaultInputModes: ["application/json", "text/plain"],
  defaultOutputModes: ["application/json"],
  skills: [
    { id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." },
    { id: "handoff.write", name: "Handoff writer", description: "Writes buyer handoff receipts with acceptance gates." }
  ],
  mcp: { name: "release-steward", tools: ["read_checks", "read_logs", "write_receipt"] }
};

describe("Agent trial receipt", () => {
  test("builds a copyable A2A message/send trial payload", () => {
    const imported = buildImportedAgentFromCard(JSON.stringify(CARD));
    expect(imported.status).toBe("accepted");
    if (imported.status !== "accepted") return;

    const receipt = buildAgentTrialReceipt({ agent: imported.agent, assessment: imported.assessment });

    expect(receipt.id).toMatch(/^trial-custom-a2a-release-steward-/);
    expect(receipt.jsonRpcPayload).toMatchObject({
      jsonrpc: "2.0",
      method: "message/send",
      params: {
        skillId: "release.audit",
        metadata: {
          agentName: "A2A Release Steward",
          readiness: "hire-ready",
          riskLevel: "low"
        }
      }
    });
    expect(receipt.jsonRpcPayload.params.message.parts[1]).toMatchObject({
      type: "data",
      data: {
        requestedArtifact: "capability-proof-receipt"
      }
    });
    expect(receipt.copyText).toContain("A2A Trial Receipt: A2A Release Steward");
    expect(receipt.copyText).toContain("Stop if credentials are required.");
    expect(receipt.copyText).toContain(receipt.digest);
  });

  test("is deterministic for the same imported agent and assessment", () => {
    const first = buildImportedAgentFromCard(JSON.stringify(CARD));
    const second = buildImportedAgentFromCard(JSON.stringify(CARD));
    expect(first.status).toBe("accepted");
    expect(second.status).toBe("accepted");
    if (first.status !== "accepted" || second.status !== "accepted") return;

    const firstReceipt = buildAgentTrialReceipt({ agent: first.agent, assessment: first.assessment });
    const secondReceipt = buildAgentTrialReceipt({ agent: second.agent, assessment: second.assessment });

    expect(firstReceipt.id).toBe(secondReceipt.id);
    expect(firstReceipt.digest).toBe(secondReceipt.digest);
    expect(firstReceipt.copyText).toBe(secondReceipt.copyText);
  });
});
