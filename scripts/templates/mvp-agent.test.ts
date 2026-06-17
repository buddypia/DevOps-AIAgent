import { beforeEach, describe, expect, test } from "vitest";
import { AnalysisSchema, AnalyzeInputSchema, analyze } from "./agent";
import { project } from "./project";

describe(`${project.name} agent contract`, () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  test("rejects empty operational evidence", () => {
    const parsed = AnalyzeInputSchema.safeParse({
      target: "",
      context: "",
      signals: "",
      mode: "balanced",
    });

    expect(parsed.success).toBe(false);
  });

  test("coerces numeric strings from model JSON", () => {
    const result = AnalysisSchema.parse({
      decision: project.positive,
      confidence: "72",
      executiveSummary: "",
      summary: "schema coercion check",
      risks: [],
      actions: [],
      evidence: project.metrics.map((label) => ({ label, value: "acceptable", weight: "64" })),
      verificationCommands: [],
      handoffChecklist: [],
      automationPlan: [],
      runbookPatch: "",
      commentDraft: "",
      source: "gemini",
      model: "gemini-3.1-flash-lite",
      mode: "balanced",
    });

    expect(result.confidence).toBe(72);
    expect(result.evidence.every((item) => typeof item.weight === "number")).toBe(true);
  });

  test("returns a useful fallback decision with handoff material", async () => {
    const result = await analyze({
      target: project.sampleTarget,
      context: project.sampleContext,
      signals: `${project.sampleSignals}\n5xx spike, warning burst, rollback status unknown`,
      mode: "conservative",
      evidenceWindow: "test evidence window",
      operatorNote: "test operator note",
    });

    expect([project.positive, project.caution, project.negative]).toContain(result.decision);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.actions.length).toBeGreaterThanOrEqual(3);
    expect(result.evidence.length).toBe(project.metrics.length);
    expect(result.verificationCommands.length).toBeGreaterThanOrEqual(2);
    expect(result.handoffChecklist.length).toBeGreaterThanOrEqual(3);
    expect(result.commentDraft).toContain("Decision:");
    expect(result.source).toBe("local-fallback");
  });
});
