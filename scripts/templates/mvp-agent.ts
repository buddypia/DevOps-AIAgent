import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { project } from "./project";

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

const DecisionModeSchema = z.enum(["conservative", "balanced", "aggressive"]).default("balanced");

export const AnalyzeInputSchema = z.object({
  target: z.string().trim().min(1, "Target is required").max(4000),
  context: z.string().trim().min(1, "Context is required").max(20000),
  signals: z.string().trim().min(1, "Signals are required").max(30000),
  mode: DecisionModeSchema,
  evidenceWindow: z.string().trim().max(1000).default(""),
  operatorNote: z.string().trim().max(4000).default(""),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

const ActionSchema = z.object({
  title: z.string().min(1),
  owner: z.string().min(1),
  priority: z.string().min(1),
});

const EvidenceSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  weight: z.coerce.number().min(0).max(100),
});

export const AnalysisSchema = z.object({
  decision: z.string().min(1),
  confidence: z.coerce.number().min(0).max(100),
  executiveSummary: z.string().default(""),
  summary: z.string().min(1),
  risks: z.array(z.string()).default([]),
  actions: z.array(ActionSchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  verificationCommands: z.array(z.string()).default([]),
  handoffChecklist: z.array(z.string()).default([]),
  automationPlan: z.array(z.string()).default([]),
  runbookPatch: z.string().default(""),
  commentDraft: z.string().default(""),
  source: z.enum(["gemini", "local-fallback"]),
  model: z.string(),
  mode: DecisionModeSchema,
});

export type Analysis = z.infer<typeof AnalysisSchema>;

const riskyPatterns = [
  /5xx|error|exception|panic|timeout|failed|failure|critical|sev|incident/i,
  /latency|p95|p99|slow|degraded|spike|drop|missing|stale|late/i,
  /rollback|irreversible|migration|schema|secret|token|pii|email|privacy|leak/i,
  /unknown|manual|flaky|warning|retry|overloaded|unowned|not updated/i,
  /customer|support|revenue|conversion|privacy|security|data loss|missing owner/i,
];

const healthyPatterns = [
  /pass|passed|healthy|stable|normal|baseline|no 5xx|rollback available|verified/i,
  /success|unchanged|ready|covered|tested|green|fresh|documented/i,
];

function modeAdjustment(mode: AnalyzeInput["mode"]) {
  if (mode === "conservative") return 12;
  if (mode === "aggressive") return -10;
  return 0;
}

function thresholds(mode: AnalyzeInput["mode"]) {
  if (mode === "conservative") return { caution: 35, negative: 60 };
  if (mode === "aggressive") return { caution: 55, negative: 78 };
  return { caution: 42, negative: 67 };
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((score, pattern) => {
    const matches = text.match(new RegExp(pattern.source, "gi"));
    return score + (matches?.length || 0);
  }, 0);
}

function riskScore(input: AnalyzeInput) {
  const text = [
    input.target,
    input.context,
    input.signals,
    input.evidenceWindow,
    input.operatorNote,
  ].join("\n");
  const lengthSignal = Math.min(16, Math.floor(text.length / 520));
  const riskHits = countMatches(text, riskyPatterns);
  const healthyHits = countMatches(text, healthyPatterns);
  const focusScore = project.focusAreas.reduce((score, focus) => {
    const word = focus.split(" ")[0] || focus;
    return score + (new RegExp(word, "i").test(text) ? 4 : 0);
  }, 0);
  return Math.max(
    6,
    Math.min(94, 24 + lengthSignal + Math.min(42, riskHits * 6) - Math.min(18, healthyHits * 4) + focusScore + modeAdjustment(input.mode)),
  );
}

function decisionFromScore(score: number, mode: AnalyzeInput["mode"]) {
  const limit = thresholds(mode);
  if (score >= limit.negative) return project.negative;
  if (score >= limit.caution) return project.caution;
  return project.positive;
}

function priority(score: number) {
  if (score >= 72) return "P0";
  if (score >= 44) return "P1";
  return "P2";
}

function fallbackAnalysis(input: AnalyzeInput, reason: string): Analysis {
  const score = riskScore(input);
  const decision = decisionFromScore(score, input.mode);
  const confidence = Math.max(56, Math.min(92, 96 - Math.abs(58 - score)));
  const evidence = project.metrics.map((label, index) => {
    const weight = Math.max(16, Math.min(98, score + index * 8 - 8));
    return {
      label,
      value: weight >= 72 ? "needs immediate attention" : weight >= 46 ? "watch closely" : "acceptable",
      weight,
    };
  });
  const mainOwner = project.role.includes("privacy")
    ? "privacy reviewer"
    : project.role.includes("incident")
      ? "incident commander"
      : project.role.includes("data")
        ? "data owner"
        : "release owner";

  return AnalysisSchema.parse({
    decision,
    confidence,
    executiveSummary: `${project.name} returned ${decision} in ${input.mode} mode. The highest-weighted signal is ${evidence[0]?.label || project.focusAreas[0]}.`,
    summary: `${project.name} used deterministic local analysis because ${reason}. The current evidence supports "${decision}" while preserving the next human approval point.`,
    risks: [
      `Validate ${project.focusAreas[0]} with fresh evidence before changing production state.`,
      `Confirm the stop condition for ${project.focusAreas[1] || "the next operational step"}.`,
      `Make sure the owner and communication channel are explicit before execution.`,
    ],
    actions: [
      {
        title: `Review ${project.metrics[0]} and decide whether to proceed`,
        owner: mainOwner,
        priority: priority(score),
      },
      {
        title: `Collect one more signal for ${project.focusAreas[1] || "the decision"}`,
        owner: "on-call engineer",
        priority: score >= 55 ? "P1" : "P2",
      },
      {
        title: "Publish the decision note with rollback or stop criteria",
        owner: "communications owner",
        priority: "P2",
      },
    ],
    evidence,
    verificationCommands: [
      "npm run test",
      `gcloud run services describe ${project.packageName} --region asia-northeast1`,
      `gcloud logging read 'resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${project.packageName}\"' --limit 50 --format=json`,
    ],
    handoffChecklist: [
      `Decision recorded as ${decision}`,
      `Owner assigned for ${project.focusAreas[0]}`,
      "Rollback or stop condition is written down",
      "Next update time is visible to stakeholders",
    ],
    automationPlan: [
      `Fetch current Cloud Run revision and log window for ${input.target}.`,
      `Apply ${input.mode} decision thresholds to the next evidence batch.`,
      "Write the final decision into the PR, runbook, incident timeline, or release record.",
    ],
    runbookPatch: `### ${project.name} decision note\n\n- Decision: ${decision}\n- Confidence: ${confidence}%\n- Mode: ${input.mode}\n- Verify: ${project.metrics.join(", ")}\n- Stop condition: define before execution\n`,
    commentDraft: `Decision: ${decision}. Confidence: ${confidence}%. Mode: ${input.mode}. Main checks: ${project.focusAreas.join(", ")}. Next step: assign an owner, run verification, and publish the stop condition.`,
    source: "local-fallback",
    model: DEFAULT_MODEL,
    mode: input.mode,
  });
}

function buildPrompt(input: AnalyzeInput) {
  return [
    `You are ${project.name}, a ${project.role} for a DevOps x AI Agent hackathon.`,
    "Use Google Gemini Flash 3.1 style fast operational judgment.",
    "",
    `Decision mode: ${input.mode}`,
    `Evidence window: ${input.evidenceWindow || "(not supplied)"}`,
    "",
    "Project objective:",
    project.overview,
    "",
    "MVP behavior:",
    project.mvp,
    "",
    "Focus areas:",
    ...project.focusAreas.map((item) => `- ${item}`),
    "",
    "Return strict JSON only with this schema:",
    JSON.stringify(
      {
        decision: `one of: ${project.positive}, ${project.caution}, ${project.negative}`,
        confidence: "0-100",
        executiveSummary: "one sentence for a release or incident lead",
        summary: "short operational judgment",
        risks: ["risk"],
        actions: [{ title: "action", owner: "role", priority: "P0/P1/P2" }],
        evidence: [{ label: "metric", value: "short value", weight: "0-100" }],
        verificationCommands: ["command a human can run next"],
        handoffChecklist: ["handoff item"],
        automationPlan: ["step"],
        runbookPatch: "markdown snippet to paste into a runbook",
        commentDraft: "PR, runbook, release, or incident comment",
      },
      null,
      2,
    ),
    "",
    "Target:",
    input.target,
    "",
    "Context:",
    input.context,
    "",
    "Signals:",
    input.signals,
    "",
    "Operator note:",
    input.operatorNote || "(not supplied)",
  ].join("\n");
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
        temperature: input.mode === "aggressive" ? 0.35 : 0.2,
      },
    });
    const parsed = parseJson(response.text || "{}");
    return AnalysisSchema.parse({
      ...parsed,
      source: "gemini",
      model: DEFAULT_MODEL,
      mode: input.mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown Gemini error";
    return fallbackAnalysis(input, `Gemini call failed: ${message}`);
  }
}
