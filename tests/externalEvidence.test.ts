import { describe, expect, test } from "vitest";
import { buildExternalEvidenceRun, type ExternalEvidenceProbe } from "../src/externalEvidence";

const passedProbe = (id: ExternalEvidenceProbe["id"]): ExternalEvidenceProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `https://example.com/${id}`,
  evidence: `${id} reachable`,
  latencyMs: 42,
  required: true
});

describe("external evidence verifier", () => {
  test("marks the final submission evidence ready when every external URL is reachable", () => {
    const run = buildExternalEvidenceRun({
      baseUrl: "https://a2a-agent-marketplace.example.com",
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [passedProbe("github-url"), passedProbe("deployed-url"), passedProbe("protopedia-url"), passedProbe("video-url")]
    });

    expect(run.readiness).toBe("external-ready");
    expect(run.evidenceScore).toBe(100);
    expect(run.nextActions).toHaveLength(0);
    expect(run.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "external.evidence",
      finalUrlsReady: true
    });
  });

  test("keeps ProtoPedia and video gaps visible until final URLs are published", () => {
    const run = buildExternalEvidenceRun({
      baseUrl: "https://a2a-agent-marketplace.example.com",
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("github-url"),
        passedProbe("deployed-url"),
        {
          ...passedProbe("protopedia-url"),
          status: "missing",
          score: 30,
          url: "",
          evidence: "ProtoPedia URL is missing."
        },
        {
          ...passedProbe("video-url"),
          status: "missing",
          score: 30,
          url: "",
          evidence: "Video URL is missing."
        }
      ]
    });

    expect(run.readiness).toBe("needs-external-urls");
    expect(run.evidenceScore).toBeLessThan(80);
    expect(run.nextActions.map((action) => action.id)).toEqual(["protopedia-url", "video-url"]);
    expect(run.a2aPayload).toMatchObject({
      skill: "external.evidence",
      finalUrlsReady: false
    });
  });

  test("blocks final submission when the deployed URL is not reachable", () => {
    const run = buildExternalEvidenceRun({
      baseUrl: "https://a2a-agent-marketplace.example.com",
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("github-url"),
        {
          ...passedProbe("deployed-url"),
          status: "missing",
          score: 30,
          evidence: "Cloud Run HTTP 503"
        },
        passedProbe("protopedia-url"),
        passedProbe("video-url")
      ]
    });

    expect(run.readiness).toBe("blocked");
    expect(run.nextActions.map((action) => action.id)).toContain("deployed-url");
  });
});
