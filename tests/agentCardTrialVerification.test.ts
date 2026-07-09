import { describe, expect, test } from "vitest";
import { runAgentCardTrialPlan } from "../server/agentCardTrialPlan";
import {
  buildAgentCardTrialVerification,
  renderAgentCardTrialVerificationHtml,
  runAgentCardTrialVerification,
  sampleTrialResponseFor
} from "../server/agentCardTrialVerification";

const PUBLIC_RECORDS = [{ address: "93.184.216.34" }];

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

describe("Agent Card trial verification", () => {
  test("accepts a response that matches the generated trial plan and public evidence contract", async () => {
    const plan = await buildStrongPlan();
    const verification = buildAgentCardTrialVerification(plan, sampleTrialResponseFor(plan), "2026-06-20T12:00:00.000Z");

    expect(verification.status).toBe("accepted");
    expect(verification.score).toBe(100);
    expect(verification.returnedReceiptId).toBe(plan.receiptId);
    expect(verification.checks.every((item) => item.status === "pass")).toBe(true);
    expect(verification.exportMarkdown).toContain("Trial response accepted");
  });

  test("keeps incomplete proof out of buyer packets until evidence is returned", async () => {
    const plan = await buildStrongPlan();
    const verification = buildAgentCardTrialVerification(plan, {
      receiptId: plan.receiptId,
      skillId: plan.skillId,
      status: "completed",
      acceptance: plan.acceptance,
      requiresCredentials: false,
      privateUrl: false,
      mutatedProduction: false,
      destructiveAction: false
    });

    expect(verification.status).toBe("needs-evidence");
    expect(verification.missingEvidence).toEqual(["Public artifact URL", "Evidence source"]);
    expect(verification.nextActions.join(" ")).toContain("public HTTPS artifactUrl");
  });

  test("fails responses that change the receipt or cross a safety boundary", async () => {
    const plan = await buildStrongPlan();
    const verification = buildAgentCardTrialVerification(plan, {
      receiptId: "changed-receipt",
      skillId: plan.skillId,
      status: "completed",
      artifactUrl: "https://proof.example.com/receipt.json",
      evidenceSource: "Public receipt",
      acceptance: plan.acceptance,
      requiresCredentials: true,
      privateUrl: false,
      mutatedProduction: false,
      destructiveAction: false
    });

    expect(verification.status).toBe("failed");
    expect(verification.score).toBeLessThanOrEqual(49);
    expect(verification.unsafeSignals).toEqual(["requiresCredentials"]);
    expect(verification.checks.find((item) => item.id === "receipt-id")?.status).toBe("fail");
  });

  test("runs verification from a JSON string and escapes unsafe values in HTML", async () => {
    const plan = await buildStrongPlan();
    const response = {
      receiptId: plan.receiptId,
      skillId: plan.skillId,
      status: "completed",
      artifactUrl: "https://proof.example.com/receipt.json",
      evidenceSource: "Receipt <script>alert(1)</script>",
      acceptance: plan.acceptance,
      requiresCredentials: false,
      privateUrl: false,
      mutatedProduction: false,
      destructiveAction: false
    };
    const verification = await runAgentCardTrialVerification("https://agents.example.com", JSON.stringify(response), {
      resolveHost: async () => PUBLIC_RECORDS,
      fetchImpl: async (url) =>
        new Response(JSON.stringify({ ...STRONG_CARD, url: String(url) }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
    });
    const html = renderAgentCardTrialVerificationHtml(verification, {
      jsonUrl: "https://proof.example/api/sample/agent-card-trial-verification",
      markdownUrl: "https://proof.example/sample/agent-card-trial-verification.md",
      trialPlanUrl: "https://proof.example/sample/agent-card-trial-plan",
      diligenceUrl: "https://proof.example/agent-card-diligence?url=x",
      appUrl: "https://proof.example/#agent-card-intake"
    });

    expect(verification.status).toBe("accepted");
    expect(html).toContain("Agent Card Trial Verification");
    expect(html).toContain("Receipt &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
