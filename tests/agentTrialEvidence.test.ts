import { describe, expect, test } from "vitest";
import { buildAgentTrialEvidenceRecord, decodeAgentTrialEvidenceParam, encodeAgentTrialEvidenceParam, summarizeAgentTrialEvidence } from "../src/agentTrialEvidence";
import { buildAgentTrialReceipt } from "../src/agentTrialReceipt";
import { verifyAgentTrialResponse } from "../src/agentTrialVerifier";
import { buildImportedAgentFromCard } from "../src/customAgent";

const ACCEPTED_ARTIFACT_URL = "https://storage.googleapis.com/a2a-agent-marketplace-proof/release-audit/receipt.json";

const CARD = {
  name: "A2A Release Steward",
  description: "Runs A2A release handoffs, validates MCP tools, checks Cloud Run evidence, and writes safety receipts.",
  url: "https://agents.example.com/.well-known/agent-card.json",
  provider: { organization: "Example Agents" },
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
  skills: [{ id: "release.audit", name: "Release audit", description: "Audits CI, Cloud Run, observability, and A2A proof." }],
  mcp: { name: "release-steward", tools: ["read_checks", "read_logs", "write_receipt"] }
};

function buildAcceptedRecord() {
  const imported = buildImportedAgentFromCard(JSON.stringify(CARD));
  if (imported.status !== "accepted") throw new Error("fixture should import");
  const receipt = buildAgentTrialReceipt({ agent: imported.agent, assessment: imported.assessment });
  const dataPart = receipt.jsonRpcPayload.params.message.parts.find((part) => part.type === "data");
  const acceptance = dataPart?.type === "data" && Array.isArray(dataPart.data.acceptance) ? dataPart.data.acceptance : [];
  const verification = verifyAgentTrialResponse({
    receipt,
    rawResponse: JSON.stringify({
      receiptId: receipt.id,
      skillId: receipt.jsonRpcPayload.params.skillId,
      status: "completed",
      artifactUrl: ACCEPTED_ARTIFACT_URL,
      evidenceSource: "Cloud Run public logs and signed A2A receipt",
      acceptance
    })
  });

  return buildAgentTrialEvidenceRecord({
    agent: imported.agent,
    receipt,
    verification,
    attachedAt: "2026-06-18T00:00:00.000Z"
  });
}

describe("Agent trial evidence ledger", () => {
  test("builds a share-safe accepted evidence record from a verification", () => {
    const record = buildAcceptedRecord();

    expect(record).toMatchObject({
      status: "accepted",
      score: 100,
      skillId: "release.audit",
      artifactUrl: ACCEPTED_ARTIFACT_URL,
      evidenceSource: "Cloud Run public logs and signed A2A receipt"
    });
    expect(record.id).toMatch(/^trial-proof-trial-/);
  });

  test("summarizes and round-trips encoded public trial evidence", () => {
    const records = [buildAcceptedRecord()];
    const summary = summarizeAgentTrialEvidence(records);
    const encoded = encodeAgentTrialEvidenceParam(records);

    expect(summary.status).toBe("ready");
    expect(summary.evidence).toContain("accepted A2A trial proof");
    expect(decodeAgentTrialEvidenceParam(encoded)).toEqual(records);
    expect(decodeAgentTrialEvidenceParam("broken")).toEqual([]);
  });

  test("downgrades tampered accepted evidence when the artifact URL is plain HTTP", () => {
    const [record] = decodeAgentTrialEvidenceParam(
      encodeAgentTrialEvidenceParam([
        {
          ...buildAcceptedRecord(),
          artifactUrl: "http://proof.example.com/release-audit/receipt.json"
        }
      ])
    );

    expect(record).toMatchObject({
      status: "needs-evidence",
      artifactUrl: ""
    });
    expect(summarizeAgentTrialEvidence([record]).status).toBe("watch");
  });

  test("downgrades accepted evidence when the artifact URL is still a placeholder host", () => {
    const [record] = decodeAgentTrialEvidenceParam(
      encodeAgentTrialEvidenceParam([
        {
          ...buildAcceptedRecord(),
          artifactUrl: "https://proof.your-company.com/receipts/a2a-trial.json"
        }
      ])
    );

    expect(record).toMatchObject({
      status: "needs-evidence",
      artifactUrl: ""
    });
    expect(summarizeAgentTrialEvidence([record]).status).toBe("watch");
  });
});
