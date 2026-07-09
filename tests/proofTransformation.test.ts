import { describe, expect, test } from "vitest";
import { buildProofTransformation } from "../src/proofTransformation";
import { buildProofBackedSampleWorkspaceDraft } from "../src/sampleWorkspace";
import { defaultWorkspaceDraft } from "../src/workspaceDraft";

describe("proof transformation", () => {
  const submissionProof = {
    protopediaUrl: "https://protopedia.net/prototype/release-ready",
    videoUrl: "https://youtu.be/releaseReady12345"
  };

  test("surfaces the current workspace repair queue before using the proof-backed starter", () => {
    const checkedAt = new Date().toISOString();
    const current = defaultWorkspaceDraft(checkedAt);
    const sample = buildProofBackedSampleWorkspaceDraft(checkedAt, "https://sample.example", submissionProof);
    const transformation = buildProofTransformation({
      current,
      sample,
      baseUrl: "https://sample.example",
      appUrl: "https://sample.example/?workspace=share-token"
    });

    expect(transformation.headline).toBe("Turn one workflow into buyer proof");
    expect(transformation.before.label).toBe("Current workspace");
    expect(transformation.after.label).toBe("Buyer proof target");
    expect(transformation.after.score).toBeGreaterThan(transformation.before.score);
    expect(transformation.after.proofClosure).toBe("5/5");
    expect(transformation.after.acceptedTrials).toBe("2 accepted");
    expect(transformation.hardTruth).toContain("current workspace still has");
    expect(transformation.current.openCount).toBeGreaterThan(0);
    expect(transformation.current.blockedCount).toBeGreaterThan(0);
    expect(transformation.current.items.length).toBeGreaterThan(0);
    expect(transformation.current.primaryAction).not.toMatch(/demo/i);
    expect(JSON.stringify(transformation.current)).toContain("Public story proof");
    expect(JSON.stringify(transformation.current)).toContain("public story page");
    expect(JSON.stringify(transformation.current)).not.toMatch(/Submission proof|ProtoPedia|final submission/i);
    expect(transformation.deltas.map((delta) => delta.id)).toEqual(["buyer-value", "measured-run", "public-proof", "a2a-trials"]);
    expect(transformation.deltas.find((delta) => delta.id === "measured-run")).toMatchObject({
      after: "1260m saved/run, 100% accepted",
      status: "pass"
    });
    expect(transformation.deltas.find((delta) => delta.id === "public-proof")).toMatchObject({
      after: "5/5 proof links",
      proof: "Deployment, public story, walkthrough, pilot receipt, and work order proof are attached as one buyer-inspectable chain.",
      status: "pass"
    });
    expect(transformation.generatedArtifacts.map((item) => item.id)).toEqual(["promise-gate", "repair-plan", "receipt-trail"]);
    expect(transformation.generatedArtifacts.find((item) => item.id === "promise-gate")).toMatchObject({
      status: "pass",
      output: expect.stringContaining("public-safe promise")
    });
    expect(transformation.generatedArtifacts.find((item) => item.id === "repair-plan")).toMatchObject({
      status: transformation.current.status,
      output: expect.stringContaining("current repair")
    });
    expect(transformation.generatedArtifacts.find((item) => item.id === "receipt-trail")).toMatchObject({
      status: "pass",
      output: "5/5 live proof checks plus 2 accepted A2A receipts."
    });
    expect(transformation.runway.map((step) => step.id)).toEqual(["load-sample", "inspect-brief", "inspect-send-note", "share-room"]);
    expect(transformation.runway.find((step) => step.id === "load-sample")).toMatchObject({
      label: "Apply proof template",
      action: "Use the proof template to see the contract shape, then replace reference artifacts with buyer-owned proof."
    });
    expect(transformation.runway.find((step) => step.id === "inspect-send-note")).toMatchObject({
      status: "pass",
      proof: "0 blocking red lines in the target brief."
    });
    expect(transformation.runway.find((step) => step.id === "share-room")?.status).toBe("pass");
    expect(JSON.stringify(transformation.current)).not.toMatch(/demo/i);
  });

  test("does not present the default starter as complete final proof", () => {
    const checkedAt = new Date().toISOString();
    const current = defaultWorkspaceDraft(checkedAt);
    const starter = buildProofBackedSampleWorkspaceDraft(checkedAt, "https://sample.example");
    const transformation = buildProofTransformation({
      current,
      sample: starter,
      baseUrl: "https://sample.example",
      appUrl: "https://sample.example/?workspace=share-token"
    });

    expect(transformation.after.proofClosure).toBe("3/5");
    expect(transformation.deltas.find((delta) => delta.id === "public-proof")).toMatchObject({
      after: "3/5 proof links",
      status: "watch"
    });
    expect(transformation.generatedArtifacts.find((item) => item.id === "receipt-trail")).toMatchObject({
      status: "watch",
      output: "3/5 live proof checks plus 2 accepted A2A receipts."
    });
    expect(transformation.hardTruth).toContain("buyer-owned proof");
  });

  test("keeps the current stage honest when proof is already loaded", () => {
    const sample = buildProofBackedSampleWorkspaceDraft(new Date().toISOString(), "https://sample.example", submissionProof);
    const transformation = buildProofTransformation({
      current: sample,
      sample,
      baseUrl: "https://sample.example",
      appUrl: "https://sample.example/?workspace=sample"
    });

    expect(transformation.before.score).toBe(transformation.after.score);
    expect(transformation.before.proofClosure).toBe("5/5");
    expect(transformation.before.acceptedTrials).toBe("2 accepted");
    expect(transformation.current.status).toBe("pass");
    expect(transformation.current.openCount).toBe(0);
    expect(transformation.current.headline).toBe("Current workspace is buyer-verifiable");
    expect(transformation.hardTruth).toContain("current workspace is ready for inspection");
    expect(transformation.deltas.find((delta) => delta.id === "buyer-value")?.status).toBe("watch");
    expect(transformation.generatedArtifacts.find((item) => item.id === "repair-plan")).toMatchObject({
      status: "pass",
      output: "No current repair items before buyer inspection."
    });
    expect(transformation.runway.find((step) => step.id === "share-room")?.status).toBe("pass");
  });
});
