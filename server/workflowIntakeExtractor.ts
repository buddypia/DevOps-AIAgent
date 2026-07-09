import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { buildWorkflowIntakeDraftFromText, buildWorkflowIntakeSourceTrace, type WorkflowIntakeDraft, type WorkflowIntakeProofLinks } from "../src/workflowIntakeDraft.js";

export const WORKFLOW_INTAKE_EXTRACT_API_PATH = "/api/workflow-intake/extract";
export const WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH = "/api/workflow-intake/extract/verify";
export const WORKFLOW_INTAKE_FALLBACK_MODEL = "deterministic-workflow-intake-v1";

export type WorkflowIntakeExtractionSource = "gemini" | "local-fallback";

export type WorkflowIntakeExtractionReceiptPayload = {
  receiptVersion: "workflow-intake-extraction.v1";
  source: WorkflowIntakeExtractionSource;
  model: string;
  extractedAt: string;
  inputChecksum: string;
  draft: WorkflowIntakeDraft;
  guardrails: string[];
  fallbackReason?: string;
};

export type WorkflowIntakeExtractionReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type WorkflowIntakeExtractionReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH;
  payload: WorkflowIntakeExtractionReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: WorkflowIntakeExtractionReceiptVerification;
  href: string;
};

export type WorkflowIntakeExtractionResult = {
  source: WorkflowIntakeExtractionSource;
  model: string;
  extractedAt: string;
  draft: WorkflowIntakeDraft;
  guardrails: string[];
  fallbackReason?: string;
  receipt: WorkflowIntakeExtractionReceipt;
};

export type WorkflowIntakeGeminiGenerator = (prompt: string, model: string) => Promise<string>;

export type WorkflowIntakeExtractionOptions = {
  apiKey?: string;
  model?: string;
  now?: string;
  generateContent?: WorkflowIntakeGeminiGenerator;
};

const WORKFLOW_INTAKE_GUARDRAILS = [
  "Public proof URLs are accepted only when they appear in the pasted note.",
  "Missing proof remains a repair action instead of being filled by the model.",
  "Restricted or internal data keeps the buyer room out of external sharing until redacted."
];

const OptionalText = z.string().trim().max(1000).optional();
const WorkOrderDraftSchema = z
  .object({
    request: z.string().trim().max(600).optional(),
    targetUser: z.string().trim().max(160).optional(),
    successMetric: z.string().trim().max(300).optional(),
    currentBaseline: z.string().trim().max(300).optional(),
    dataSensitivity: z.enum(["public", "internal", "restricted"]).optional(),
    evidenceUrl: OptionalText
  })
  .optional();
const BuyerScenarioDraftSchema = z
  .object({
    teamSize: z.number().finite().nonnegative().max(10000).optional(),
    hourlyCostYen: z.number().finite().nonnegative().max(10000000).optional(),
    cyclesPerMonth: z.number().finite().nonnegative().max(10000).optional(),
    manualHoursPerCycle: z.number().finite().nonnegative().max(10000).optional(),
    adoptionRatePercent: z.number().finite().nonnegative().max(100).optional(),
    incidentRiskYenPerMonth: z.number().finite().nonnegative().max(1000000000).optional()
  })
  .optional();
const PilotRunDraftSchema = z
  .object({
    observedManualMinutes: z.number().finite().nonnegative().max(1000000).optional(),
    observedAssistedMinutes: z.number().finite().nonnegative().max(1000000).optional(),
    participants: z.number().finite().nonnegative().max(10000).optional(),
    acceptedTasks: z.number().finite().nonnegative().max(10000).optional(),
    totalTasks: z.number().finite().nonnegative().max(10000).optional(),
    evidenceUrl: OptionalText,
    reviewerName: z.string().trim().max(160).optional(),
    notes: z.string().trim().max(600).optional()
  })
  .optional();
const ProofLinksDraftSchema = z
  .object({
    targetUrl: OptionalText,
    protopediaUrl: OptionalText,
    videoUrl: OptionalText,
    pilotEvidenceUrl: OptionalText,
    workOrderEvidenceUrl: OptionalText
  })
  .optional();
const AgentTrialEvidenceDraftSchema = z
  .object({
    artifactUrl: OptionalText,
    agentName: z.string().trim().max(160).optional(),
    skillId: z.string().trim().max(160).optional(),
    score: z.number().finite().nonnegative().max(100).optional(),
    evidenceSource: z.string().trim().max(300).optional()
  })
  .optional();
const GeminiWorkflowIntakeDraftSchema = z.object({
  workOrder: WorkOrderDraftSchema,
  buyerScenario: BuyerScenarioDraftSchema,
  pilotRun: PilotRunDraftSchema,
  proofLinks: ProofLinksDraftSchema,
  agentTrialEvidence: AgentTrialEvidenceDraftSchema,
  confidence: z.number().finite().nonnegative().max(100).optional(),
  summary: z.string().trim().max(600).optional(),
  detectedSignals: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  warnings: z.array(z.string().trim().min(1).max(240)).max(20).optional()
});
const WorkflowIntakeSourceTraceSchema = z.object({
  id: z.enum(["buyer", "workflow", "baseline", "success", "value-model", "pilot-run", "public-proof", "agent-trial", "data-boundary"]),
  label: z.string().trim().min(1).max(120),
  status: z.enum(["traced", "inferred", "missing"]),
  extracted: z.string().trim().min(1).max(420),
  sourceLine: z.string().trim().max(520),
  sourceLineNumber: z.number().int().positive().nullable(),
  action: z.string().trim().min(1).max(420)
});
const WorkflowIntakeDraftReceiptSchema = z.object({
  workOrder: WorkOrderDraftSchema.default({}),
  buyerScenario: BuyerScenarioDraftSchema.default({}),
  pilotRun: PilotRunDraftSchema.default({}),
  proofLinks: ProofLinksDraftSchema.default({}),
  agentTrialEvidence: AgentTrialEvidenceDraftSchema,
  confidence: z.number().finite().nonnegative().max(100),
  summary: z.string().trim().max(600),
  detectedSignals: z.array(z.string().trim().min(1).max(80)).max(40),
  warnings: z.array(z.string().trim().min(1).max(240)).max(40),
  sourceTrace: z.array(WorkflowIntakeSourceTraceSchema).max(12).default([])
});
const WorkflowIntakeExtractionReceiptPayloadSchema = z.object({
  receiptVersion: z.literal("workflow-intake-extraction.v1"),
  source: z.enum(["gemini", "local-fallback"]),
  model: z.string().trim().min(1).max(120),
  extractedAt: z.string().trim().min(1).max(120),
  inputChecksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  draft: WorkflowIntakeDraftReceiptSchema,
  guardrails: z.array(z.string().trim().min(1).max(260)).min(1).max(8),
  fallbackReason: z.string().trim().min(1).max(600).optional()
});
const WorkflowIntakeExtractionReceiptVerificationSchema = z.object({
  checksum: z.string().trim().regex(/^[a-f0-9]{16}$/i),
  payload: WorkflowIntakeExtractionReceiptPayloadSchema
});

type GeminiWorkflowIntakeDraft = z.infer<typeof GeminiWorkflowIntakeDraftSchema>;

function configuredGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

function compactText(value: string | undefined, maxLength: number) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function compactNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}

function rawContainsUrl(raw: string, value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return false;
  const withoutTrailingSlash = trimmed.replace(/\/$/, "");
  return raw.includes(trimmed) || raw.includes(withoutTrailingSlash);
}

function hasPlaceholderToken(value: string) {
  return /<[^>\n]+>/.test(value);
}

function isPlaceholderUrl(value: string) {
  const lower = value.toLowerCase();
  return lower.includes("...") || lower.includes("your-cloud-run-url");
}

function normalizedSearchText(value: string) {
  return value
    .replace(/[.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function rawContainsText(raw: string, value: string | undefined) {
  const trimmed = compactText(value, 1000);
  if (!trimmed || hasPlaceholderToken(trimmed) || isPlaceholderUrl(trimmed)) return false;
  return normalizedSearchText(raw).includes(normalizedSearchText(trimmed));
}

function rawContainsNumber(raw: string, value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return false;
  const normalizedRaw = raw.replace(/,/g, "");
  const rounded = Math.round(value);
  const escaped = String(rounded).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\d.])${escaped}(?:\\.0+)?([^\\d.]|$)`).test(normalizedRaw);
}

function safeTextFromModel(input: {
  raw: string;
  value: string | undefined;
  label: string;
  maxLength: number;
  warnings: string[];
}) {
  const value = compactText(input.value, input.maxLength);
  if (!value) return undefined;
  if (rawContainsText(input.raw, value)) return value;
  input.warnings.push(`Gemini suggested ${input.label} that was not present in the pasted note, so it was ignored.`);
  return undefined;
}

function safeNumberFromModel(input: {
  raw: string;
  value: number | undefined;
  label: string;
  warnings: string[];
}) {
  const value = compactNumber(input.value);
  if (value === undefined) return undefined;
  if (rawContainsNumber(input.raw, value)) return value;
  input.warnings.push(`Gemini suggested ${input.label} that was not present in the pasted note, so it was ignored.`);
  return undefined;
}

function safeUrlFromModel(input: {
  raw: string;
  value: string | undefined;
  label: string;
  warnings: string[];
}) {
  const value = compactText(input.value, 1000);
  if (!value) return undefined;
  if (!hasPlaceholderToken(value) && !isPlaceholderUrl(value) && rawContainsUrl(input.raw, value)) return value;
  input.warnings.push(`Gemini suggested ${input.label} that was not present in the pasted note, so it was ignored.`);
  return undefined;
}

function pushSignal(signals: string[], condition: unknown, label: string) {
  if (condition) signals.push(label);
}

function detectedSignalsForDraft(draft: Omit<WorkflowIntakeDraft, "sourceTrace">) {
  const signals: string[] = [];
  pushSignal(signals, draft.workOrder.request, "workflow request");
  pushSignal(signals, draft.workOrder.targetUser, "target buyer");
  pushSignal(signals, draft.workOrder.successMetric, "success metric");
  pushSignal(signals, draft.workOrder.currentBaseline, "baseline");
  pushSignal(signals, Object.keys(draft.buyerScenario).length > 0, "ROI assumptions");
  pushSignal(signals, draft.pilotRun.observedManualMinutes !== undefined || draft.pilotRun.observedAssistedMinutes !== undefined, "measured minutes");
  pushSignal(signals, draft.pilotRun.acceptedTasks !== undefined && draft.pilotRun.totalTasks !== undefined, "accepted tasks");
  pushSignal(signals, draft.pilotRun.reviewerName, "pilot reviewer");
  pushSignal(signals, draft.pilotRun.notes, "pilot notes");
  pushSignal(signals, draft.workOrder.evidenceUrl || draft.pilotRun.evidenceUrl, "public evidence URL");
  pushSignal(signals, draft.proofLinks.targetUrl, "deployed URL");
  pushSignal(signals, draft.proofLinks.protopediaUrl, "ProtoPedia URL");
  pushSignal(signals, draft.proofLinks.videoUrl, "walkthrough URL");
  pushSignal(signals, draft.agentTrialEvidence, "accepted A2A trial receipt");
  pushSignal(signals, draft.workOrder.dataSensitivity, "data boundary");
  return signals;
}

function summaryForDraft(draft: Omit<WorkflowIntakeDraft, "sourceTrace">) {
  const evidenceUrl =
    draft.workOrder.evidenceUrl ||
    draft.pilotRun.evidenceUrl ||
    draft.proofLinks.targetUrl ||
    draft.proofLinks.protopediaUrl ||
    draft.proofLinks.videoUrl ||
    draft.proofLinks.pilotEvidenceUrl ||
    draft.proofLinks.workOrderEvidenceUrl;
  return `${draft.workOrder.targetUser || "Target buyer"} / ${draft.workOrder.request || "workflow request"}${evidenceUrl ? " / evidence linked" : " / proof pending"}`;
}

function uniqueLines(...groups: Array<string[] | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const group of groups) {
    for (const item of group ?? []) {
      const text = item.trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      result.push(text);
    }
  }
  return result;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function verifyWorkflowIntakeExtractionReceipt(
  receipt: Pick<WorkflowIntakeExtractionReceipt, "checksum" | "payload">
): WorkflowIntakeExtractionReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Workflow intake extraction receipt checksum matches the attached buyer-room replay payload."
      : "Workflow intake extraction receipt checksum does not match the attached buyer-room replay payload. Re-run intake before trusting this buyer room."
  };
}

const GEMINI_UNGROUNDED_WARNING_PATTERN = /^Gemini suggested .+ that was not present in the pasted note, so it was ignored\.$/;

function ignoredModelSuggestionsFrom(warnings: string[]) {
  return warnings.filter((warning) => GEMINI_UNGROUNDED_WARNING_PATTERN.test(warning));
}

function buildReceiptMarkdown(receipt: Omit<WorkflowIntakeExtractionReceipt, "href">) {
  const ignoredModelSuggestions = ignoredModelSuggestionsFrom(receipt.payload.draft.warnings);
  const sourceTrace = receipt.payload.draft.sourceTrace;
  const tracedCount = sourceTrace.filter((item) => item.status === "traced").length;

  return [
    "# Workflow intake extraction receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Source: ${receipt.payload.source}`,
    `Model: ${receipt.payload.model}`,
    `Extracted at: ${receipt.payload.extractedAt}`,
    `Input checksum: ${receipt.payload.inputChecksum}`,
    `Target buyer: ${receipt.payload.draft.workOrder.targetUser ?? "missing"}`,
    `Confidence: ${receipt.payload.draft.confidence}/100`,
    "",
    "## Guardrails",
    ...receipt.payload.guardrails.map((guardrail) => `- ${guardrail}`),
    "",
    "## Ignored model suggestions",
    ...(ignoredModelSuggestions.length > 0 ? ignoredModelSuggestions.map((warning) => `- ${warning}`) : ["- None."]),
    "",
    "## Source trace",
    `${tracedCount}/${sourceTrace.length} extracted facts traced to source lines.`,
    ...sourceTrace.map((item) => {
      const source = item.sourceLineNumber ? `L${item.sourceLineNumber}: ${item.sourceLine}` : item.action;
      return `- [${item.status}] ${item.label}: ${item.extracted} (${source})`;
    }),
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the workflow intake replay payload before accepting a forwarded buyer-room extraction."
  ].join("\n");
}

function buildWorkflowIntakeExtractionReceipt(
  text: string,
  result: Omit<WorkflowIntakeExtractionResult, "receipt">
): WorkflowIntakeExtractionReceipt {
  const payload: WorkflowIntakeExtractionReceiptPayload = {
    receiptVersion: "workflow-intake-extraction.v1",
    source: result.source,
    model: result.model,
    extractedAt: result.extractedAt,
    inputChecksum: stableDigest(text.trim().slice(0, 8000)),
    draft: result.draft,
    guardrails: result.guardrails,
    fallbackReason: result.fallbackReason
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyWorkflowIntakeExtractionReceipt({ checksum, payload });
  const partial: Omit<WorkflowIntakeExtractionReceipt, "href"> = {
    receiptId: `workflow-intake-${payload.source}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: WORKFLOW_INTAKE_EXTRACT_VERIFY_API_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };

  return {
    ...partial,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(buildReceiptMarkdown(partial))}`
  };
}

export function verifyWorkflowIntakeExtractionReceiptRequest(input: unknown) {
  const parsed = WorkflowIntakeExtractionReceiptVerificationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_request",
        issues: parsed.error.issues
      }
    };
  }

  const payload = parsed.data.payload as WorkflowIntakeExtractionReceiptPayload;
  const verification = verifyWorkflowIntakeExtractionReceipt({
    checksum: parsed.data.checksum.toLowerCase(),
    payload
  });
  const ignoredModelSuggestions = ignoredModelSuggestionsFrom(payload.draft.warnings);
  const tracedSourceFacts = payload.draft.sourceTrace.filter((item) => item.status === "traced").length;

  return {
    statusCode: verification.status === "verified" ? 200 : 422,
    body: {
      skill: "workflow.intake.extract.verify",
      verification,
      receipt: {
        receiptVersion: payload.receiptVersion,
        source: payload.source,
        model: payload.model,
        extractedAt: payload.extractedAt,
        inputChecksum: payload.inputChecksum,
        targetBuyer: payload.draft.workOrder.targetUser ?? "missing",
        confidence: payload.draft.confidence,
        detectedSignals: payload.draft.detectedSignals.length,
        warnings: payload.draft.warnings.length,
        ignoredModelSuggestions: ignoredModelSuggestions.length,
        sourceTrace: payload.draft.sourceTrace.length,
        tracedSourceFacts
      }
    }
  };
}

function mergeProofLinks(input: {
  fallback: WorkflowIntakeProofLinks;
  candidate: GeminiWorkflowIntakeDraft["proofLinks"];
  raw: string;
  warnings: string[];
}): WorkflowIntakeProofLinks {
  const targetUrl = safeUrlFromModel({ raw: input.raw, value: input.candidate?.targetUrl, label: "Deployed URL", warnings: input.warnings });
  const protopediaUrl = safeUrlFromModel({ raw: input.raw, value: input.candidate?.protopediaUrl, label: "ProtoPedia URL", warnings: input.warnings });
  const videoUrl = safeUrlFromModel({ raw: input.raw, value: input.candidate?.videoUrl, label: "Walkthrough video URL", warnings: input.warnings });
  const pilotEvidenceUrl = safeUrlFromModel({ raw: input.raw, value: input.candidate?.pilotEvidenceUrl, label: "Pilot receipt URL", warnings: input.warnings });
  const workOrderEvidenceUrl = safeUrlFromModel({ raw: input.raw, value: input.candidate?.workOrderEvidenceUrl, label: "Work order proof URL", warnings: input.warnings });

  return {
    ...input.fallback,
    ...(targetUrl ? { targetUrl } : {}),
    ...(protopediaUrl ? { protopediaUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(pilotEvidenceUrl ? { pilotEvidenceUrl } : {}),
    ...(workOrderEvidenceUrl ? { workOrderEvidenceUrl } : {})
  };
}

function normalizeGeminiDraft(raw: string, candidate: GeminiWorkflowIntakeDraft, fallback: WorkflowIntakeDraft): WorkflowIntakeDraft {
  const warnings: string[] = [];
  const proofLinks = mergeProofLinks({ fallback: fallback.proofLinks, candidate: candidate.proofLinks, raw, warnings });
  const workOrderEvidenceUrl = safeUrlFromModel({ raw, value: candidate.workOrder?.evidenceUrl, label: "work-order evidence URL", warnings });
  const pilotEvidenceUrl = safeUrlFromModel({ raw, value: candidate.pilotRun?.evidenceUrl, label: "pilot evidence URL", warnings });
  const agentArtifactUrl = safeUrlFromModel({ raw, value: candidate.agentTrialEvidence?.artifactUrl, label: "A2A trial artifact URL", warnings });
  const agentName = safeTextFromModel({ raw, value: candidate.agentTrialEvidence?.agentName, label: "A2A agent name", maxLength: 160, warnings });
  const agentSkillId = safeTextFromModel({ raw, value: candidate.agentTrialEvidence?.skillId, label: "A2A skill ID", maxLength: 160, warnings });
  const agentScore = safeNumberFromModel({ raw, value: candidate.agentTrialEvidence?.score, label: "A2A trial score", warnings });
  const agentTrialEvidence =
    agentArtifactUrl && agentScore !== undefined
      ? {
          artifactUrl: agentArtifactUrl,
          ...(agentName ? { agentName } : {}),
          ...(agentSkillId ? { skillId: agentSkillId } : {}),
          score: Math.max(0, Math.min(100, agentScore)),
          evidenceSource: "Gemini-assisted extraction from a user-provided accepted A2A trial receipt."
        }
      : fallback.agentTrialEvidence;
  const request = safeTextFromModel({ raw, value: candidate.workOrder?.request, label: "workflow request", maxLength: 600, warnings });
  const targetUser = safeTextFromModel({ raw, value: candidate.workOrder?.targetUser, label: "target buyer", maxLength: 160, warnings });
  const successMetric = safeTextFromModel({ raw, value: candidate.workOrder?.successMetric, label: "success metric", maxLength: 300, warnings });
  const currentBaseline = safeTextFromModel({ raw, value: candidate.workOrder?.currentBaseline, label: "current baseline", maxLength: 300, warnings });
  const dataSensitivity = safeTextFromModel({ raw, value: candidate.workOrder?.dataSensitivity, label: "data sensitivity", maxLength: 40, warnings });
  const pilotReviewer = safeTextFromModel({ raw, value: candidate.pilotRun?.reviewerName, label: "pilot reviewer", maxLength: 160, warnings });
  const pilotNotes = safeTextFromModel({ raw, value: candidate.pilotRun?.notes, label: "pilot notes", maxLength: 600, warnings });
  const teamSize = safeNumberFromModel({ raw, value: candidate.buyerScenario?.teamSize, label: "team size", warnings });
  const hourlyCostYen = safeNumberFromModel({ raw, value: candidate.buyerScenario?.hourlyCostYen, label: "hourly cost", warnings });
  const cyclesPerMonth = safeNumberFromModel({ raw, value: candidate.buyerScenario?.cyclesPerMonth, label: "cycles per month", warnings });
  const manualHoursPerCycle = safeNumberFromModel({ raw, value: candidate.buyerScenario?.manualHoursPerCycle, label: "manual hours per cycle", warnings });
  const adoptionRatePercent = safeNumberFromModel({ raw, value: candidate.buyerScenario?.adoptionRatePercent, label: "adoption rate", warnings });
  const incidentRiskYenPerMonth = safeNumberFromModel({ raw, value: candidate.buyerScenario?.incidentRiskYenPerMonth, label: "monthly risk", warnings });
  const observedManualMinutes = safeNumberFromModel({ raw, value: candidate.pilotRun?.observedManualMinutes, label: "manual minutes", warnings });
  const observedAssistedMinutes = safeNumberFromModel({ raw, value: candidate.pilotRun?.observedAssistedMinutes, label: "assisted minutes", warnings });
  const participants = safeNumberFromModel({ raw, value: candidate.pilotRun?.participants, label: "pilot participants", warnings });
  const acceptedTasks = safeNumberFromModel({ raw, value: candidate.pilotRun?.acceptedTasks, label: "accepted tasks", warnings });
  const totalTasks = safeNumberFromModel({ raw, value: candidate.pilotRun?.totalTasks, label: "total tasks", warnings });

  const draft: Omit<WorkflowIntakeDraft, "sourceTrace"> = {
    workOrder: {
      ...fallback.workOrder,
      ...(request ? { request } : {}),
      ...(targetUser ? { targetUser } : {}),
      ...(successMetric ? { successMetric } : {}),
      ...(currentBaseline ? { currentBaseline } : {}),
      ...(dataSensitivity === "public" || dataSensitivity === "internal" || dataSensitivity === "restricted" ? { dataSensitivity } : {}),
      ...(workOrderEvidenceUrl ? { evidenceUrl: workOrderEvidenceUrl } : {})
    },
    buyerScenario: {
      ...fallback.buyerScenario,
      ...(teamSize !== undefined ? { teamSize } : {}),
      ...(hourlyCostYen !== undefined ? { hourlyCostYen } : {}),
      ...(cyclesPerMonth !== undefined ? { cyclesPerMonth } : {}),
      ...(manualHoursPerCycle !== undefined ? { manualHoursPerCycle } : {}),
      ...(adoptionRatePercent !== undefined ? { adoptionRatePercent } : {}),
      ...(incidentRiskYenPerMonth !== undefined ? { incidentRiskYenPerMonth } : {})
    },
    pilotRun: {
      ...fallback.pilotRun,
      ...(observedManualMinutes !== undefined ? { observedManualMinutes } : {}),
      ...(observedAssistedMinutes !== undefined ? { observedAssistedMinutes } : {}),
      ...(participants !== undefined ? { participants } : {}),
      ...(acceptedTasks !== undefined ? { acceptedTasks } : {}),
      ...(totalTasks !== undefined ? { totalTasks } : {}),
      ...(pilotEvidenceUrl ? { evidenceUrl: pilotEvidenceUrl } : {}),
      ...(pilotReviewer ? { reviewerName: pilotReviewer } : {}),
      ...(pilotNotes ? { notes: pilotNotes } : {})
    },
    proofLinks,
    ...(agentTrialEvidence ? { agentTrialEvidence } : {}),
    confidence: fallback.confidence,
    summary: fallback.summary,
    detectedSignals: fallback.detectedSignals,
    warnings: uniqueLines(fallback.warnings, candidate.warnings, warnings)
  };
  draft.detectedSignals = detectedSignalsForDraft(draft);
  draft.confidence = Math.round(Math.min(100, (draft.detectedSignals.length / 10) * 100));
  draft.summary = summaryForDraft(draft);

  return {
    ...draft,
    sourceTrace: buildWorkflowIntakeSourceTrace(raw, draft)
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
  return JSON.parse(candidate);
}

function buildWorkflowIntakePrompt(text: string, fallback: WorkflowIntakeDraft) {
  return [
    "You are the intake operator for a buyer-ready AI pilot room.",
    "Return strict JSON only. No markdown.",
    "Extract only facts explicitly present in the workflow note. Do not invent URLs, metrics, receipts, people, or proof.",
    "If a field is uncertain, omit it and add a warning.",
    "",
    "Allowed JSON shape:",
    JSON.stringify(
      {
        workOrder: {
          request: "bounded workflow request",
          targetUser: "buyer or sponsor",
          successMetric: "specific success metric",
          currentBaseline: "current manual baseline",
          dataSensitivity: "public|internal|restricted",
          evidenceUrl: "https URL from the note only"
        },
        buyerScenario: {
          teamSize: 0,
          hourlyCostYen: 0,
          cyclesPerMonth: 0,
          manualHoursPerCycle: 0,
          adoptionRatePercent: 0,
          incidentRiskYenPerMonth: 0
        },
        pilotRun: {
          observedManualMinutes: 0,
          observedAssistedMinutes: 0,
          participants: 0,
          acceptedTasks: 0,
          totalTasks: 0,
          evidenceUrl: "https URL from the note only",
          reviewerName: "reviewer named in the note",
          notes: "observed pilot result"
        },
        proofLinks: {
          targetUrl: "https URL from the note only",
          protopediaUrl: "https URL from the note only",
          videoUrl: "https URL from the note only",
          pilotEvidenceUrl: "https URL from the note only",
          workOrderEvidenceUrl: "https URL from the note only"
        },
        agentTrialEvidence: {
          artifactUrl: "https URL from the note only",
          agentName: "agent named in accepted A2A trial receipt",
          skillId: "skill id from the note",
          score: 0,
          evidenceSource: "where the accepted A2A trial proof came from"
        },
        confidence: 0,
        summary: "one sentence",
        detectedSignals: ["signal"],
        warnings: ["warning"]
      },
      null,
      2
    ),
    "",
    "Deterministic fallback already found:",
    JSON.stringify(fallback, null, 2),
    "",
    "Workflow note:",
    text
  ].join("\n");
}

async function generateGeminiText(input: { prompt: string; model: string; apiKey: string; generateContent?: WorkflowIntakeGeminiGenerator }) {
  if (input.generateContent) return input.generateContent(input.prompt, input.model);
  const ai = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await ai.models.generateContent({
    model: input.model,
    contents: input.prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });
  return response.text ?? "{}";
}

function withReceipt(text: string, result: Omit<WorkflowIntakeExtractionResult, "receipt">): WorkflowIntakeExtractionResult {
  return {
    ...result,
    receipt: buildWorkflowIntakeExtractionReceipt(text, result)
  };
}

function fallbackExtraction(input: { text: string; draft: WorkflowIntakeDraft; now: string; reason: string }): WorkflowIntakeExtractionResult {
  return withReceipt(input.text, {
    source: "local-fallback",
    model: WORKFLOW_INTAKE_FALLBACK_MODEL,
    extractedAt: input.now,
    draft: input.draft,
    guardrails: WORKFLOW_INTAKE_GUARDRAILS,
    fallbackReason: input.reason
  });
}

export async function extractWorkflowIntakeDraft(text: string, options: WorkflowIntakeExtractionOptions = {}): Promise<WorkflowIntakeExtractionResult> {
  const raw = text.trim().slice(0, 8000);
  const now = options.now ?? new Date().toISOString();
  const fallbackDraft = buildWorkflowIntakeDraftFromText(raw);
  const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const apiKey = options.apiKey ?? configuredGeminiApiKey();

  if (!apiKey && !options.generateContent) {
    return fallbackExtraction({ text: raw, draft: fallbackDraft, now, reason: "GEMINI_API_KEY is not configured." });
  }

  try {
    const prompt = buildWorkflowIntakePrompt(raw, fallbackDraft);
    const generated = await generateGeminiText({ prompt, model, apiKey, generateContent: options.generateContent });
    const parsed = GeminiWorkflowIntakeDraftSchema.parse(extractJson(generated));
    return withReceipt(raw, {
      source: "gemini",
      model,
      extractedAt: now,
      draft: normalizeGeminiDraft(raw, parsed, fallbackDraft),
      guardrails: WORKFLOW_INTAKE_GUARDRAILS
    });
  } catch (error) {
    return fallbackExtraction({
      text: raw,
      draft: fallbackDraft,
      now,
      reason: error instanceof Error ? `Gemini extraction failed: ${error.message}` : "Gemini extraction failed."
    });
  }
}
