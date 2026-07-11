import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { project } from "./project";

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

export const AnalyzeInputSchema = z.object({
  target: z.string().trim().max(4000).default(""),
  context: z.string().trim().max(20000).default(""),
  signals: z.string().trim().max(30000).default(""),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

const ActionSchema = z.object({
  title: z.string(),
  owner: z.string(),
  priority: z.string(),
});

const EvidenceSchema = z.object({
  label: z.string(),
  value: z.string(),
  weight: z.number().min(0).max(100),
});

export const AnalysisSchema = z.object({
  decision: z.string(),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  risks: z.array(z.string()),
  actions: z.array(ActionSchema),
  evidence: z.array(EvidenceSchema),
  automationPlan: z.array(z.string()),
  commentDraft: z.string(),
  source: z.enum(["gemini", "local-fallback"]),
  model: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

const riskyPatterns = [
  /5xx|error|exception|panic|timeout|failed|failure|critical|sev|incident/i,
  /latency|p95|p99|slow|degraded|spike|drop|missing|stale|late/i,
  /rollback|irreversible|migration|schema|secret|token|pii|email|privacy|leak/i,
  /unknown|manual|flaky|warning|retry|overloaded|unowned|not updated/i,
];

function riskScore(input: AnalyzeInput) {
  const text = [input.target, input.context, input.signals].join("\n");
  const lengthSignal = Math.min(18, Math.floor(text.length / 420));
  const patternScore = riskyPatterns.reduce((score, pattern) => {
    const matches = text.match(new RegExp(pattern.source, "gi"));
    return score + Math.min(18, (matches?.length || 0) * 5);
  }, 0);
  const focusScore = project.focusAreas.reduce((score, focus) => {
    const word = focus.split(" ")[0] || focus;
    return score + (new RegExp(word, "i").test(text) ? 4 : 0);
  }, 0);
  return Math.max(12, Math.min(92, 20 + lengthSignal + patternScore + focusScore));
}

function fallbackAnalysis(input: AnalyzeInput, reason: string): Analysis {
  const score = riskScore(input);
  const decision = score >= 67 ? project.negative : score >= 42 ? project.caution : project.positive;
  const confidence = Math.max(52, Math.min(88, 92 - Math.abs(55 - score)));
  const evidence = project.metrics.map((label, index) => {
    const weight = Math.max(18, Math.min(96, score + index * 9 - 10));
    return {
      label,
      value: weight >= 70 ? "high attention" : weight >= 45 ? "watch" : "healthy",
      weight,
    };
  });

  return AnalysisSchema.parse({
    decision,
    confidence,
    summary: `${project.name} used deterministic local analysis because ${reason}. The current evidence points to "${decision}" with the strongest signal around ${evidence[0]?.label || "operational risk"}.`,
    risks: [
      `Validate ${project.focusAreas[0]} before changing production state.`,
      `Check whether the sample evidence includes fresh Cloud Run or CI timestamps.`,
      `Keep a human owner attached to the next irreversible step.`,
    ],
    actions: [
      {
        title: `Review ${project.metrics[0]} evidence`,
        owner: "release owner",
        priority: score >= 67 ? "P0" : "P1",
      },
      {
        title: `Collect one more signal for ${project.focusAreas[1] || "the next decision"}`,
        owner: "on-call engineer",
        priority: "P1",
      },
      {
        title: "Publish the decision note and rollback/stop condition",
        owner: "incident commander",
        priority: "P2",
      },
    ],
    evidence,
    automationPlan: [
      `Fetch current Cloud Run revision and log window for ${input.target || project.name}.`,
      "Re-run the same scoring prompt after the next deploy or incident window.",
      "Write the final decision into the PR, runbook, or incident timeline.",
    ],
    commentDraft: `Decision: ${decision}. Confidence: ${confidence}%. Main check: ${project.focusAreas.join(", ")}. Next step: confirm owner and stop condition before proceeding.`,
    source: "local-fallback",
    model: DEFAULT_MODEL,
  });
}

function buildPrompt(input: AnalyzeInput) {
  return `You are ${project.name}, a ${project.role} for a DevOps x AI Agent hackathon.
Use Google Gemini Flash 3.1 style fast operational judgment.

Project objective:
${project.overview}

MVP behavior:
${project.mvp}

Focus areas:
${project.focusAreas.map((item) => `- ${item}`).join("\n")}

Return strict JSON only with this schema:
{
  "decision": "one of: ${project.positive}, ${project.caution}, ${project.negative}",
  "confidence": 0-100,
  "summary": "short operational judgment",
  "risks": ["risk"],
  "actions": [{"title":"action","owner":"role","priority":"P0/P1/P2"}],
  "evidence": [{"label":"metric","value":"short value","weight":0-100}],
  "automationPlan": ["step"],
  "commentDraft": "PR, runbook, or incident comment"
}

Target:
${input.target || "(not supplied)"}

Context:
${input.context || "(not supplied)"}

Signals:
${input.signals || "(not supplied)"}`;
}

function parseJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] || trimmed;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return JSON.parse(candidate.slice(first, last + 1));
  }
  return JSON.parse(candidate);
}

export async function analyze(input: AnalyzeInput): Promise<Analysis> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return fallbackAnalysis(input, "no Gemini API key is configured");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: buildPrompt(input),
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const parsed = parseJson(response.text || "{}");
    return AnalysisSchema.parse({
      ...parsed,
      source: "gemini",
      model: DEFAULT_MODEL,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Gemini error";
    return fallbackAnalysis(input, `Gemini call failed: ${message}`);
  }
}
