import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const deployWorkflow = readFileSync(".github/workflows/deploy-cloud-run.yml", "utf8");
const publicProofWorkflow = readFileSync(".github/workflows/verify-public-proof.yml", "utf8");

describe("Deploy Cloud Run workflow", () => {
  test("fails deployment when the public proof surface is stale", () => {
    expect(deployWorkflow).toContain("Deploy Cloud Run");
    expect(deployWorkflow).toContain("workflow_dispatch");
    expect(deployWorkflow).toContain("GCP_WORKLOAD_IDENTITY_PROVIDER");
    expect(deployWorkflow).toContain("gcloud builds submit");
    expect(deployWorkflow).toContain("decision-matrix-lock");
    expect(deployWorkflow).toContain("first-click-smoke-lock");
    expect(deployWorkflow).toContain("submission-dossier-lock");
    expect(deployWorkflow).toContain("/competitive-decision-matrix");
    expect(deployWorkflow).toContain("/api/first-click-smoke");
    expect(deployWorkflow).toContain("/publisher");
    expect(deployWorkflow).toContain("/dossier");
    expect(deployWorkflow).toContain("competitiveDecisionMatrixPageEndpoint");
    expect(deployWorkflow).toContain("firstClickSmokePageEndpoint");
    expect(deployWorkflow).toContain("publisherPageEndpoint");
    expect(deployWorkflow).toContain("dossierPageEndpoint");
  });

  test("offers a secrets-free public proof verification workflow", () => {
    expect(publicProofWorkflow).toContain("Verify Public Proof");
    expect(publicProofWorkflow).toContain("workflow_dispatch");
    expect(publicProofWorkflow).not.toContain("GCP_WORKLOAD_IDENTITY_PROVIDER");
    expect(publicProofWorkflow).not.toContain("gcloud builds submit");
    expect(publicProofWorkflow).toContain("decision-matrix-lock");
    expect(publicProofWorkflow).toContain("first-click-route-lock");
    expect(publicProofWorkflow).toContain("first-click-smoke-lock");
    expect(publicProofWorkflow).toContain("submission-dossier-lock");
    expect(publicProofWorkflow).toContain("/competitive-decision-matrix");
    expect(publicProofWorkflow).toContain("/deploy-recovery");
    expect(publicProofWorkflow).toContain("competitiveDecisionMatrixPageEndpoint");
    expect(publicProofWorkflow).toContain("deployRecoveryPageEndpoint");
  });
});
