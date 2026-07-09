import { describe, expect, test } from "vitest";
import { recommendSquad } from "../src/agentEngine";
import { mergeAgentCatalog } from "../src/customAgent";
import { buildLaunchRoom } from "../src/launchRoom";
import {
  buildProofBackedSampleWorkspaceDraft,
  SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID,
  SAMPLE_PILOT_RECEIPT_PATH,
  SAMPLE_WORK_ORDER_PATH
} from "../src/sampleWorkspace";

describe("proof-backed sample workspace", () => {
  const submissionProof = {
    protopediaUrl: "https://protopedia.net/prototype/release-ready",
    videoUrl: "https://youtu.be/releaseReady12345"
  };

  test("loads a proof-backed sample with honest publication gaps by default", () => {
    const draft = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example");
    const room = buildLaunchRoom({
      workspace: draft,
      baseUrl: "https://sample.example",
      appUrl: "https://sample.example/?workspace=sample",
      now: new Date("2026-06-20T00:00:00.000Z")
    });

    expect(draft.targetUrl).toBe("https://sample.example");
    expect(draft.pilotRun.evidenceUrl).toBe(`https://sample.example${SAMPLE_PILOT_RECEIPT_PATH}`);
    expect(draft.buyerWorkOrder.evidenceUrl).toBe(`https://sample.example${SAMPLE_WORK_ORDER_PATH}`);
    expect(draft.protopediaUrl).toBe("");
    expect(draft.videoUrl).toBe("");
    expect(draft.proofVerification).toMatchObject({
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: 3,
      totalCount: 5
    });
    expect(draft.proofVerification?.results.filter((result) => result.status === "pass").map((result) => result.id)).toEqual([
      "targetUrl",
      "pilotEvidenceUrl",
      "workOrderEvidenceUrl"
    ]);
    expect(draft.proofVerification?.results.filter((result) => result.status === "block").map((result) => result.id)).toEqual(["protopediaUrl", "videoUrl"]);
    expect(room.proofHealth).toMatchObject({
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: 3,
      totalCount: 5,
      status: "blocked",
      readiness: "evidence-blocked"
    });
    expect(room.readiness).not.toBe("buyer-ready");
  });

  test("can become buyer-ready when public publication URLs are configured", () => {
    const draft = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://sample.example", submissionProof);
    const recommendation = recommendSquad(draft.projectBrief, draft.selectedAgentIds, 260, mergeAgentCatalog(draft.customAgents));
    const room = buildLaunchRoom({
      workspace: draft,
      baseUrl: "https://sample.example",
      appUrl: "https://sample.example/?workspace=sample",
      now: new Date("2026-06-20T00:00:00.000Z")
    });

    expect(draft.targetUrl).toBe("https://sample.example");
    expect(draft.selectedAgentIds).toEqual(["market-broker", "cloud-run-sre", "security-sentinel", "test-forge", SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID]);
    expect(draft.customAgents).toEqual([expect.objectContaining({ id: SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID, name: "Buyer Proof Operator" })]);
    expect(recommendation.budgetUsed).toBeLessThanOrEqual(260);
    expect(recommendation.selected.map((agent) => agent.id)).toContain(SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID);
    expect(draft.agentTrialEvidence).toHaveLength(2);
    expect(draft.agentTrialEvidence.every((evidence) => evidence.status === "accepted")).toBe(true);
    expect(draft.pilotRun).toMatchObject({
      acceptedTasks: 3,
      totalTasks: 3,
      reviewerName: "Platform sponsor"
    });
    expect(draft.pilotRun.evidenceUrl).toBe(`https://sample.example${SAMPLE_PILOT_RECEIPT_PATH}`);
    expect(draft.buyerWorkOrder.evidenceUrl).toBe(`https://sample.example${SAMPLE_WORK_ORDER_PATH}`);
    expect(draft.protopediaUrl).toBe(submissionProof.protopediaUrl);
    expect(draft.videoUrl).toBe(submissionProof.videoUrl);
    expect(draft.pilotRun.evidenceUrl.length).toBeLessThan(120);
    expect(draft.buyerWorkOrder.evidenceUrl.length).toBeLessThan(120);
    expect(draft.proofVerification).toMatchObject({
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: 5,
      totalCount: 5
    });
    expect(draft.proofVerification?.results.filter((result) => result.status === "pass").map((result) => result.id)).toEqual([
      "targetUrl",
      "pilotEvidenceUrl",
      "workOrderEvidenceUrl",
      "protopediaUrl",
      "videoUrl"
    ]);
    expect(draft.proofVerification?.results.filter((result) => result.status === "block")).toEqual([]);
    expect(room.proofHealth).toMatchObject({
      checkedAt: "2026-06-20T00:00:00.000Z",
      verifiedCount: 5,
      totalCount: 5,
      status: "ready",
      readiness: "evidence-current"
    });
    expect(room.readiness).toBe("buyer-ready");
    expect(room.buyerDecision.verdict).toBe("send");
    expect(room.buyerDecision.checks.find((check) => check.id === "measured-pilot")).toMatchObject({ status: "ready" });
  });
});
