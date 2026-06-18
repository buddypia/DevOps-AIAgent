import { describe, expect, test } from "vitest";
import { buildLiveEvidenceRun, type LiveEvidenceProbe } from "../src/liveEvidence";

const passedProbe = (id: string): LiveEvidenceProbe => ({
  id,
  label: id,
  status: "passed",
  score: 100,
  url: `https://example.com/${id}`,
  evidence: `${id} ok`,
  latencyMs: 42,
  required: true
});

describe("live evidence monitor", () => {
  test("marks the public evidence live-ready when every required probe passes", () => {
    const run = buildLiveEvidenceRun({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: ["health", "agent-card", "squad-optimizer", "a2a", "ci"].map(passedProbe)
    });

    expect(run.evidenceScore).toBe(100);
    expect(run.readiness).toBe("live-ready");
    expect(run.nextActions).toHaveLength(0);
    expect(run.a2aPayload).toMatchObject({
      method: "message/send",
      skill: "evidence.monitor",
      readiness: "live-ready"
    });
  });

  test("blocks the monitor when a required public proof is missing", () => {
    const run = buildLiveEvidenceRun({
      baseUrl: "https://a2a-agent-marketplace-xhdqpudx6a-an.a.run.app",
      generatedAt: "2026-06-18T00:00:00.000Z",
      probes: [
        passedProbe("health"),
        {
          ...passedProbe("agent-card"),
          status: "missing",
          score: 0,
          evidence: "Agent Card HTTP 500"
        }
      ]
    });

    expect(run.readiness).toBe("blocked");
    expect(run.evidenceScore).toBeLessThan(80);
    expect(run.nextActions.map((action) => action.id)).toContain("agent-card");
  });
});
