import { describe, expect, test } from "vitest";
import { buildAgentCardAssessment } from "../src/agentCardAssessment";
import { buildImportedAgentFromCard } from "../src/customAgent";

const STRONG_CARD = {
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

describe("Agent Card trust passport", () => {
  test("marks a complete Agent Card as ready for a supervised hiring trial", () => {
    const result = buildImportedAgentFromCard(JSON.stringify(STRONG_CARD));
    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;

    expect(result.assessment.score).toBeGreaterThanOrEqual(82);
    expect(result.assessment.readiness).toBe("hire-ready");
    expect(result.assessment.riskLevel).toBe("low");
    expect(result.assessment.trialTask.method).toBe("message/send");
    expect(result.assessment.trialTask.skillId).toBe("release.audit");
    expect(result.assessment.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining(["public-url", "provider", "skills", "a2a", "io-modes", "tools", "capability-balance"])
    );
  });

  test("blocks a weak imported card when core trust metadata is missing", () => {
    const result = buildImportedAgentFromCard(
      JSON.stringify({
        name: "Thin Agent",
        description: "Very thin Agent Card with no public url and no useful tooling evidence."
      })
    );
    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;

    expect(result.assessment.readiness).toBe("blocked");
    expect(result.assessment.riskLevel).toBe("high");
    expect(result.assessment.redFlags.join(" ")).toContain("Public Agent Card URL");
  });

  test("can assess a normalized agent with the discovery URL as source evidence", () => {
    const result = buildImportedAgentFromCard(JSON.stringify({ ...STRONG_CARD, url: "" }));
    expect(result.status).toBe("accepted");
    if (result.status !== "accepted") return;
    const assessment = buildAgentCardAssessment({
      card: { ...STRONG_CARD, url: "" },
      agent: result.agent,
      sourceUrl: "https://registry.example.com"
    });

    expect(assessment.checks.find((check) => check.id === "public-url")?.status).toBe("pass");
    expect(assessment.trialTask.payload.safetyBoundary).toContain("No credentials");
  });
});
