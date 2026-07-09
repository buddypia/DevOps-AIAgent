import { describe, expect, test } from "vitest";
import { buildProofBackedSampleWorkspaceDraft, SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID } from "../src/sampleWorkspace";
import { workspaceArtifactQuerySuffix, workspaceArtifactSearchParams, workspacePublicArtifactHref } from "../src/workspacePublicLinks";
import { decodeWorkspaceShareParam, WORKSPACE_SHARE_PARAM } from "../src/workspaceDraft";

function expectCompressedWorkspaceHref(href: string) {
  const url = new URL(href);
  const workspaceParam = url.searchParams.get(WORKSPACE_SHARE_PARAM);
  expect(workspaceParam).toMatch(/^lz1\./);
  expect(url.searchParams.has("brief")).toBe(false);
  expect(url.searchParams.has("customAgents")).toBe(false);
  expect(url.searchParams.has("trialEvidence")).toBe(false);
  return decodeWorkspaceShareParam(workspaceParam);
}

describe("workspace public links", () => {
  const submissionProof = {
    protopediaUrl: "https://protopedia.net/prototype/release-ready",
    videoUrl: "https://youtu.be/releaseReady12345"
  };

  test("serializes current workspace state for buyer-facing query routes without unsubmitted final URLs", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://proof.example.com");
    const params = workspaceArtifactSearchParams(workspace);

    expect(params.get("brief")).toContain("buyer proof");
    expect(params.get("agents")).toBe(`market-broker,cloud-run-sre,security-sentinel,test-forge,${SAMPLE_BUYER_PROOF_OPERATOR_AGENT_ID}`);
    expect(params.get("targetUrl")).toBe("https://proof.example.com");
    expect(params.has("protopediaUrl")).toBe(false);
    expect(params.has("videoUrl")).toBe(false);
    expect(params.get("pilotEvidenceUrl")).toBe("https://proof.example.com/sample/pilot-run-receipt");
    expect(params.get("workOrderEvidenceUrl")).toBe("https://proof.example.com/sample/work-order-brief");
    expect(params.get("pilotReviewer")).toBe("Platform sponsor");
    expect(params.get("workOrderDataSensitivity")).toBe("public");
    expect(params.get("customAgents")).toContain("eyJ");
    expect(params.has("workspace")).toBe(false);
  });

  test("serializes configured final submission URLs for complete public artifacts", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://proof.example.com", submissionProof);
    const params = workspaceArtifactSearchParams(workspace);

    expect(params.get("protopediaUrl")).toBe(submissionProof.protopediaUrl);
    expect(params.get("videoUrl")).toBe(submissionProof.videoUrl);
  });

  test("builds current artifact hrefs without carrying old query or hash state", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://proof.example.com");
    const href = workspacePublicArtifactHref("/buyer-proof-audit", workspace, "https://app.example.com/current?old=1#buyer-proof-intake");
    const url = new URL(href);
    const decoded = expectCompressedWorkspaceHref(href);

    expect(url.origin).toBe("https://app.example.com");
    expect(url.pathname).toBe("/buyer-proof-audit");
    expect(url.hash).toBe("");
    expect(url.searchParams.has("old")).toBe(false);
    expect(decoded.projectBrief).toContain("buyer proof");
    expect(decoded.targetUrl).toBe("https://proof.example.com");
    expect(decoded.buyerWorkOrder.request).toContain("Cloud Run release-readiness review");
  });

  test("builds a current buyer delivery memo route from workspace proof state", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://proof.example.com");
    const href = workspacePublicArtifactHref("/buyer-delivery-memo", workspace, "https://app.example.com/current?old=1#workflow");
    const url = new URL(href);
    const decoded = expectCompressedWorkspaceHref(href);

    expect(url.pathname).toBe("/buyer-delivery-memo");
    expect(url.hash).toBe("");
    expect(url.searchParams.has("old")).toBe(false);
    expect(decoded.projectBrief).toContain("buyer proof");
    expect(decoded.pilotRun.evidenceUrl).toBe("https://proof.example.com/sample/pilot-run-receipt");
    expect(decoded.buyerWorkOrder.evidenceUrl).toBe("https://proof.example.com/sample/work-order-brief");
  });

  test("builds a current buyer value report route from workspace value and measured-run state", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://proof.example.com");
    const href = workspacePublicArtifactHref("/buyer-value", workspace, "https://app.example.com/current?old=1#buyer-proof-command");
    const url = new URL(href);
    const decoded = expectCompressedWorkspaceHref(href);

    expect(url.pathname).toBe("/buyer-value");
    expect(url.hash).toBe("");
    expect(url.searchParams.has("old")).toBe(false);
    expect(decoded.buyerScenario.adoptionRatePercent).toBe(workspace.buyerScenario.adoptionRatePercent);
    expect(decoded.pilotRun.observedManualMinutes).toBe(workspace.pilotRun.observedManualMinutes);
    expect(decoded.pilotRun.observedAssistedMinutes).toBe(workspace.pilotRun.observedAssistedMinutes);
    expect(decoded.pilotRun.reviewerName).toBe("Platform sponsor");
  });

  test("builds a reusable query suffix for server-rendered artifact indexes", () => {
    const workspace = buildProofBackedSampleWorkspaceDraft("2026-06-20T00:00:00.000Z", "https://proof.example.com");
    const suffix = workspaceArtifactQuerySuffix(workspace);
    const url = new URL(`https://app.example.com/.well-known/buyer-proof.json${suffix}`);

    expect(suffix.startsWith("?")).toBe(true);
    expect(url.searchParams.get("brief")).toContain("buyer proof");
    expect(url.searchParams.get("targetUrl")).toBe("https://proof.example.com");
    expect(url.searchParams.get("pilotEvidenceUrl")).toBe("https://proof.example.com/sample/pilot-run-receipt");
    expect(url.searchParams.get("workOrderEvidenceUrl")).toBe("https://proof.example.com/sample/work-order-brief");
    expect(url.searchParams.has("workspace")).toBe(false);
  });
});
