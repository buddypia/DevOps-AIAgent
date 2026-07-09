import { describe, expect, test } from "vitest";
import { buildAgentTrialReceipt } from "../src/agentTrialReceipt";
import { verifyAgentTrialResponse } from "../src/agentTrialVerifier";
import { buildImportedAgentFromCard } from "../src/customAgent";

const ACCEPTED_ARTIFACT_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof/release-audit/receipt.json";

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

function buildReceipt() {
  const imported = buildImportedAgentFromCard(JSON.stringify(CARD));
  if (imported.status !== "accepted") throw new Error("fixture should import");
  return buildAgentTrialReceipt({ agent: imported.agent, assessment: imported.assessment });
}

function acceptanceFor(receipt: ReturnType<typeof buildReceipt>) {
  const dataPart = receipt.jsonRpcPayload.params.message.parts.find((part) => part.type === "data");
  return dataPart?.type === "data" && Array.isArray(dataPart.data.acceptance) ? dataPart.data.acceptance : [];
}

describe("Agent trial verifier", () => {
  test("accepts a response that matches receipt, skill, artifact, evidence, acceptance, and safety", () => {
    const receipt = buildReceipt();
    const verification = verifyAgentTrialResponse({
      receipt,
      rawResponse: JSON.stringify({
        receiptId: receipt.id,
        skillId: receipt.jsonRpcPayload.params.skillId,
        status: "completed",
        artifactUrl: ACCEPTED_ARTIFACT_URL,
        evidenceSource: "Cloud Run public logs and signed A2A receipt",
        acceptance: acceptanceFor(receipt),
        requiresCredentials: false,
        privateUrl: false,
        mutatedProduction: false
      })
    });

    expect(verification.status).toBe("accepted");
    expect(verification.score).toBe(100);
    expect(verification.missingEvidence).toEqual([]);
    expect(verification.copyText).toContain("Trial Verification");
    expect(verification.copyText).toContain(receipt.id);
  });

  test("keeps a matching response in needs-evidence when public proof is missing", () => {
    const receipt = buildReceipt();
    const verification = verifyAgentTrialResponse({
      receipt,
      rawResponse: JSON.stringify({
        receiptId: receipt.id,
        skillId: receipt.jsonRpcPayload.params.skillId,
        status: "completed",
        acceptance: acceptanceFor(receipt)
      })
    });

    expect(verification.status).toBe("needs-evidence");
    expect(verification.checks.find((item) => item.id === "artifact-evidence")?.status).toBe("watch");
    expect(verification.checks.find((item) => item.id === "evidence-source")?.status).toBe("watch");
    expect(verification.missingEvidence).toEqual(expect.arrayContaining(["Artifact evidence", "Evidence source"]));
  });

  test("fails placeholder proof artifact hosts before buyer handoff", () => {
    const receipt = buildReceipt();
    const verification = verifyAgentTrialResponse({
      receipt,
      rawResponse: JSON.stringify({
        receiptId: receipt.id,
        skillId: receipt.jsonRpcPayload.params.skillId,
        status: "completed",
        artifactUrl: "https://proof.your-company.com/receipts/a2a-trial.json",
        evidenceSource: "Cloud Run logs and A2A receipt",
        acceptance: acceptanceFor(receipt),
        requiresCredentials: false,
        privateUrl: false,
        mutatedProduction: false
      })
    });

    expect(verification.status).toBe("failed");
    expect(verification.checks.find((item) => item.id === "artifact-evidence")).toMatchObject({
      status: "fail",
      evidence: "Replace the placeholder proof host with a real public artifact URL."
    });
    expect(verification.hardTruth).toContain("Do not hire");
  });

  test("fails a response that requests credentials during the trial", () => {
    const receipt = buildReceipt();
    const verification = verifyAgentTrialResponse({
      receipt,
      rawResponse: JSON.stringify({
        receiptId: receipt.id,
        skillId: receipt.jsonRpcPayload.params.skillId,
        status: "completed",
        artifactUrl: ACCEPTED_ARTIFACT_URL,
        evidenceSource: "A2A receipt",
        acceptance: acceptanceFor(receipt),
        requiresCredentials: true
      })
    });

    expect(verification.status).toBe("failed");
    expect(verification.checks.find((item) => item.id === "safety-boundary")?.status).toBe("fail");
    expect(verification.hardTruth).toContain("Do not hire");
  });

  test("fails non-JSON trial responses", () => {
    const verification = verifyAgentTrialResponse({
      receipt: buildReceipt(),
      rawResponse: "done, trust me"
    });

    expect(verification.status).toBe("failed");
    expect(verification.score).toBe(0);
    expect(verification.missingEvidence).toContain("parseable JSON");
  });
});
