import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const workflow = readFileSync(".github/workflows/deploy-cloud-run.yml", "utf8");

describe("Deploy Cloud Run workflow", () => {
  test("fails deployment when the public proof surface is stale", () => {
    expect(workflow).toContain("Deploy Cloud Run");
    expect(workflow).toContain("workflow_dispatch");
    expect(workflow).toContain("GCP_WORKLOAD_IDENTITY_PROVIDER");
    expect(workflow).toContain("gcloud builds submit");
    expect(workflow).toContain("decision-matrix-lock");
    expect(workflow).toContain("first-click-smoke-lock");
    expect(workflow).toContain("submission-dossier-lock");
    expect(workflow).toContain("/competitive-decision-matrix");
    expect(workflow).toContain("/api/first-click-smoke");
    expect(workflow).toContain("/publisher");
    expect(workflow).toContain("/dossier");
    expect(workflow).toContain("competitiveDecisionMatrixPageEndpoint");
    expect(workflow).toContain("firstClickSmokePageEndpoint");
    expect(workflow).toContain("publisherPageEndpoint");
    expect(workflow).toContain("dossierPageEndpoint");
  });
});
