import type { BuyerValueScenarioInput } from "./buyerValueScenario.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";

export type WorkflowIntakeProofLinks = {
  targetUrl?: string;
  protopediaUrl?: string;
  videoUrl?: string;
  pilotEvidenceUrl?: string;
  workOrderEvidenceUrl?: string;
};

export type WorkflowIntakeAgentTrialEvidence = {
  artifactUrl: string;
  agentName?: string;
  skillId?: string;
  score: number;
  evidenceSource: string;
};

export type WorkflowIntakeSourceTraceStatus = "traced" | "inferred" | "missing";

export type WorkflowIntakeSourceTraceItem = {
  id: "buyer" | "workflow" | "baseline" | "success" | "value-model" | "pilot-run" | "public-proof" | "agent-trial" | "data-boundary";
  label: string;
  status: WorkflowIntakeSourceTraceStatus;
  extracted: string;
  sourceLine: string;
  sourceLineNumber: number | null;
  action: string;
};

export type WorkflowIntakeDraft = {
  workOrder: Partial<BuyerWorkOrderInput>;
  buyerScenario: Partial<BuyerValueScenarioInput>;
  pilotRun: Partial<PilotRunReceiptInput>;
  proofLinks: WorkflowIntakeProofLinks;
  agentTrialEvidence?: WorkflowIntakeAgentTrialEvidence;
  confidence: number;
  summary: string;
  detectedSignals: string[];
  warnings: string[];
  sourceTrace: WorkflowIntakeSourceTraceItem[];
};

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasPlaceholderToken(value: string) {
  return /<[^>\n]+>/.test(value);
}

function isPlaceholderUrl(value: string) {
  const lower = value.toLowerCase();
  return lower.includes("...") || lower.includes("your-cloud-run-url");
}

function usableTextValue(value: string, maxLength: number) {
  const compacted = compactText(value);
  if (!compacted || hasPlaceholderToken(compacted)) return "";
  return compacted.slice(0, maxLength);
}

function lineValue(lines: string[], labels: RegExp[]) {
  for (const line of lines) {
    for (const label of labels) {
      const match = line.match(label);
      if (match?.[1]) {
        const value = usableTextValue(match[1], 240);
        if (value) return value;
      }
    }
  }
  return "";
}

function firstLongLine(lines: string[]) {
  return lines.find((line) => !hasPlaceholderToken(line) && compactText(line).length >= 48) ?? lines.find((line) => !hasPlaceholderToken(line)) ?? "";
}

function firstMatchingLine(lines: string[], patterns: RegExp[]) {
  return lines.find((line) => !hasPlaceholderToken(line) && patterns.some((pattern) => pattern.test(line))) ?? "";
}

function numberedLinesFrom(text: string) {
  return text
    .split(/\r?\n|[•]/)
    .map((line, index) => ({
      number: index + 1,
      text: compactText(line.replace(/^[-*]\s*/, ""))
    }))
    .filter((line) => Boolean(line.text));
}

function firstNumber(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function firstTaskPair(text: string) {
  const pair =
    text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:tasks?|accepted|件)?/i) ??
    text.match(/accepted[^\d]{0,14}(\d{1,2})[^\d]{1,12}(?:of|out of|\/)[^\d]{0,8}(\d{1,2})/i);
  if (!pair?.[1] || !pair?.[2]) return null;
  const accepted = Number(pair[1]);
  const total = Number(pair[2]);
  if (!Number.isFinite(accepted) || !Number.isFinite(total) || total <= 0) return null;
  return { acceptedTasks: Math.min(accepted, total), totalTasks: total };
}

function firstHttpsUrl(text: string) {
  const matches = text.matchAll(/https:\/\/[^\s)"'<>]+/gi);
  for (const match of matches) {
    const rawUrl = match[0] ?? "";
    const url = rawUrl.replace(/[.,;:]+$/, "");
    if (url && !isPlaceholderUrl(rawUrl) && !isPlaceholderUrl(url)) return url;
  }
  return "";
}

function firstHttpsUrlIn(value: string) {
  return firstHttpsUrl(value);
}

function urlValue(lines: string[], labels: RegExp[]) {
  for (const line of lines) {
    for (const label of labels) {
      const match = line.match(label);
      if (!match?.[1]) continue;
      const url = firstHttpsUrlIn(match[1]);
      if (url) return url;
      const value = usableTextValue(match[1], 1000);
      if (value && !isPlaceholderUrl(value)) return value;
    }
  }
  return "";
}

function dataSensitivityFrom(text: string): BuyerWorkOrderInput["dataSensitivity"] {
  const lower = text.toLowerCase();
  if (/(restricted|secret|credential|confidential|pii|personal data|個人情報|機密|秘匿)/i.test(lower)) return "restricted";
  if (/(public|redacted|synthetic|anonymized|public-safe|公開|匿名|合成)/i.test(lower)) return "public";
  return "internal";
}

function pushSignal(signals: string[], condition: unknown, label: string) {
  if (condition) signals.push(label);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function traceLine(
  numberedLines: Array<{ number: number; text: string }>,
  values: Array<string | number | undefined>,
  patterns: RegExp[] = []
) {
  const normalizedValues = values
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
  return (
    numberedLines.find((line) => normalizedValues.some((value) => line.text.toLowerCase().includes(value.toLowerCase()))) ??
    numberedLines.find((line) => patterns.some((pattern) => pattern.test(line.text))) ??
    null
  );
}

function traceItem(input: {
  id: WorkflowIntakeSourceTraceItem["id"];
  label: string;
  extracted: string;
  line: { number: number; text: string } | null;
  action: string;
  inferred?: boolean;
}): WorkflowIntakeSourceTraceItem {
  const extracted = compactText(input.extracted).slice(0, 320);
  return {
    id: input.id,
    label: input.label,
    status: extracted ? (input.line ? "traced" : "inferred") : "missing",
    extracted: extracted || "Missing",
    sourceLine: input.line?.text.slice(0, 420) ?? "",
    sourceLineNumber: input.line?.number ?? null,
    action: input.action
  };
}

export function buildWorkflowIntakeSourceTrace(raw: string, draft: Omit<WorkflowIntakeDraft, "sourceTrace">): WorkflowIntakeSourceTraceItem[] {
  const text = raw.trim().slice(0, 8000);
  const numberedLines = numberedLinesFrom(text);
  const valueParts = [
    draft.buyerScenario.teamSize ? `${draft.buyerScenario.teamSize} people` : "",
    draft.buyerScenario.cyclesPerMonth ? `${draft.buyerScenario.cyclesPerMonth} cycles/month` : "",
    draft.buyerScenario.manualHoursPerCycle ? `${draft.buyerScenario.manualHoursPerCycle}h manual/cycle` : "",
    draft.buyerScenario.adoptionRatePercent ? `${draft.buyerScenario.adoptionRatePercent}% adoption` : "",
    draft.buyerScenario.hourlyCostYen ? `¥${draft.buyerScenario.hourlyCostYen}/h` : ""
  ].filter(Boolean);
  const pilotParts = [
    draft.pilotRun.observedManualMinutes ? `manual ${draft.pilotRun.observedManualMinutes}` : "",
    draft.pilotRun.observedAssistedMinutes ? `assisted ${draft.pilotRun.observedAssistedMinutes}` : "",
    draft.pilotRun.acceptedTasks && draft.pilotRun.totalTasks ? `${draft.pilotRun.acceptedTasks}/${draft.pilotRun.totalTasks}` : "",
    draft.pilotRun.reviewerName || ""
  ].filter(Boolean);
  const proofValues = [
    draft.proofLinks.targetUrl,
    draft.proofLinks.protopediaUrl,
    draft.proofLinks.videoUrl,
    draft.proofLinks.pilotEvidenceUrl,
    draft.proofLinks.workOrderEvidenceUrl,
    draft.workOrder.evidenceUrl,
    draft.pilotRun.evidenceUrl
  ].filter((value): value is string => Boolean(value?.trim()));
  const trial = draft.agentTrialEvidence;

  return [
    traceItem({
      id: "buyer",
      label: "Target buyer",
      extracted: draft.workOrder.targetUser || "",
      line: traceLine(numberedLines, [draft.workOrder.targetUser], [/^(?:target user|buyer|sponsor|user|audience|対象ユーザー|対象|利用者)\s*[:：-]/i]),
      action: "Name the buyer or sponsor who can approve the workflow."
    }),
    traceItem({
      id: "workflow",
      label: "Workflow request",
      extracted: draft.workOrder.request || "",
      line: traceLine(numberedLines, [draft.workOrder.request], [/^(?:workflow|request|job|task|work order|作業|依頼)\s*[:：-]/i]),
      action: "State one bounded workflow request."
    }),
    traceItem({
      id: "baseline",
      label: "Current baseline",
      extracted: draft.workOrder.currentBaseline || "",
      line: traceLine(numberedLines, [draft.workOrder.currentBaseline], [/^(?:baseline|current|today|before|as-is|現状|現在|ベースライン)\s*[:：-]/i, /(manual|scattered|spreadsheet|copy|handoff|chat|ticket|手作業|散在|属人)/i]),
      action: "Describe the manual or scattered current state."
    }),
    traceItem({
      id: "success",
      label: "Success metric",
      extracted: draft.workOrder.successMetric || "",
      line: traceLine(numberedLines, [draft.workOrder.successMetric], [/^(?:success metric|metric|success|goal|kpi|成果指標|成功条件)\s*[:：-]/i, /(save|saved|reduce|close|prove|approve|hours|minutes|時間|削減|承認|検収)/i]),
      action: "Add the measurable success condition."
    }),
    traceItem({
      id: "value-model",
      label: "Value model",
      extracted: valueParts.join(" / "),
      line: traceLine(numberedLines, [draft.buyerScenario.teamSize, draft.buyerScenario.cyclesPerMonth, draft.buyerScenario.manualHoursPerCycle, draft.buyerScenario.adoptionRatePercent, draft.buyerScenario.hourlyCostYen], [/(team|people|reviews?|cycles?|manual|adoption|hourly|rate|cost|単価|時給)/i]),
      action: "Add team size, cycle volume, manual hours, adoption rate, and hourly cost."
    }),
    traceItem({
      id: "pilot-run",
      label: "Measured pilot",
      extracted: pilotParts.join(" / "),
      line: traceLine(numberedLines, [draft.pilotRun.observedManualMinutes, draft.pilotRun.observedAssistedMinutes, draft.pilotRun.acceptedTasks, draft.pilotRun.totalTasks, draft.pilotRun.reviewerName], [/(pilot|manual|assisted|accepted|tasks?|reviewer|検収者|レビュー担当)/i]),
      action: "Add manual minutes, assisted minutes, accepted tasks, and reviewer."
    }),
    traceItem({
      id: "public-proof",
      label: "Public proof",
      extracted: proofValues.length ? `${proofValues.length} URL${proofValues.length === 1 ? "" : "s"}: ${proofValues.slice(0, 2).join(" / ")}` : "",
      line: traceLine(numberedLines, proofValues, [/https:\/\//i, /(?:evidence|proof|receipt|protopedia|video|walkthrough|deployment|cloud run)/i]),
      action: "Attach public HTTPS proof links reviewers can open."
    }),
    traceItem({
      id: "agent-trial",
      label: "A2A trial receipt",
      extracted: trial ? [trial.agentName, trial.skillId, `${trial.score}/100`, trial.artifactUrl].filter(Boolean).join(" / ") : "",
      line: traceLine(numberedLines, [trial?.agentName, trial?.skillId, trial?.score, trial?.artifactUrl], [/accepted\s+a2a\s+trial|a2a\s+trial|agent\s+trial/i]),
      action: "Attach accepted A2A trial receipt with skill, score, and public artifact."
    }),
    traceItem({
      id: "data-boundary",
      label: "Data boundary",
      extracted: draft.workOrder.dataSensitivity || "",
      line: traceLine(numberedLines, [draft.workOrder.dataSensitivity], [/(data|public|redacted|synthetic|anonymized|restricted|secret|credential|confidential|pii|個人情報|機密|匿名)/i]),
      action: "State whether evidence is public-safe, internal, or restricted."
    })
  ];
}

function acceptedAgentTrialLineValue(lines: string[]) {
  const labelPatterns = [
    { pattern: /^accepted\s+a2a\s+trial(?:\s+(?:receipt|proof|evidence|artifact|verification))?\s*[:：-]\s*(.+)$/i, acceptedInLabel: true },
    { pattern: /^a2a\s+trial(?:\s+(?:receipt|proof|evidence|artifact|verification))?\s*[:：-]\s*(.+)$/i, acceptedInLabel: false },
    { pattern: /^agent\s+trial(?:\s+(?:receipt|proof|evidence|artifact|verification))?\s*[:：-]\s*(.+)$/i, acceptedInLabel: false },
    { pattern: /^accepted\s+agent\s+trial(?:\s+(?:receipt|proof|evidence|artifact|verification))?\s*[:：-]\s*(.+)$/i, acceptedInLabel: true }
  ];

  for (const line of lines) {
    for (const label of labelPatterns) {
      const match = line.match(label.pattern);
      if (!match?.[1]) continue;
      const value = compactText(match[1]);
      const acceptedInValue = /(?:^|[\s,;/|])(?:accepted|status\s*[:=]?\s*accepted)(?:$|[\s,;/|])/i.test(value);
      const hasScoredArtifact = Boolean(firstHttpsUrlIn(value)) && /(?:score|verification)[^\d]{0,12}\d{1,3}|\d{1,3}\s*\/\s*100/i.test(value);
      if (label.acceptedInLabel || acceptedInValue || hasScoredArtifact) return value;
    }
  }

  return "";
}

function agentTrialEvidenceFromAcceptedLine(value: string): WorkflowIntakeAgentTrialEvidence | undefined {
  const artifactUrl = firstHttpsUrlIn(value);
  const score = firstNumber(value, [
    /(?:score|verification)[^\d]{0,12}(\d{1,3})(?:\s*\/\s*100)?/i,
    /(\d{1,3})\s*\/\s*100/i
  ]);
  if (!artifactUrl || score === undefined) return undefined;

  const explicitAgentName = value.match(/(?:agent|agent name)\s*[:=]\s*([^/|,;]+)/i)?.[1]?.trim();
  const explicitSkillId = value.match(/(?:skill|skill id)\s*[:=]?\s*([a-z0-9_.-]{3,80})/i)?.[1]?.trim();
  const normalizedSegments = value
    .replace(artifactUrl, "")
    .replace(/(?:score|verification)[^\d]{0,12}\d{1,3}(?:\s*\/\s*100)?/gi, "")
    .replace(/\d{1,3}\s*\/\s*100/gi, "")
    .replace(/\bstatus\s*[:=]?\s*accepted\b/gi, "")
    .replace(/\baccepted\b/gi, "")
    .split(/\s*(?:\/|\||,|;)\s*/)
    .map((segment) => compactText(segment))
    .filter(Boolean);
  const segmentSkillId = normalizedSegments.find((segment) => /^[a-z][a-z0-9_.-]{2,79}$/i.test(segment) && /[._-]/.test(segment));
  const segmentAgentName = normalizedSegments.find((segment) => segment !== segmentSkillId && /[a-z]/i.test(segment) && !/^https?:/i.test(segment));
  const agentName = explicitAgentName || segmentAgentName || "";
  const skillId = explicitSkillId || segmentSkillId || "";

  return {
    artifactUrl,
    ...(agentName ? { agentName: compactText(agentName).slice(0, 100) } : {}),
    ...(skillId ? { skillId: compactText(skillId).slice(0, 120) } : {}),
    score: clampScore(score),
    evidenceSource: "User-provided accepted A2A trial receipt from quick workflow intake."
  };
}

export function emptyWorkflowIntakeDraft(): WorkflowIntakeDraft {
  const draft: Omit<WorkflowIntakeDraft, "sourceTrace"> = {
    workOrder: {},
    buyerScenario: {},
    pilotRun: {},
    proofLinks: {},
    confidence: 0,
    summary: "Paste a workflow note, issue, or review transcript to extract buyer packet inputs.",
    detectedSignals: [],
    warnings: ["No intake text provided."]
  };

  return {
    ...draft,
    sourceTrace: []
  };
}

export function buildWorkflowIntakeDraftFromText(raw: string): WorkflowIntakeDraft {
  const text = raw.trim().slice(0, 8000);
  if (!text) return emptyWorkflowIntakeDraft();

  const numberedLines = numberedLinesFrom(text);
  const lines = numberedLines.map((line) => line.text);
  const request =
    lineValue(lines, [/^(?:workflow|request|job|task|work order|作業|依頼)\s*[:：-]\s*(.+)$/i]) ||
    compactText(firstLongLine(lines)).slice(0, 400);
  const targetUser = lineValue(lines, [/^(?:target user|buyer|sponsor|user|audience|対象ユーザー|対象|利用者)\s*[:：-]\s*(.+)$/i]);
  const successMetric =
    lineValue(lines, [/^(?:success metric|metric|success|goal|kpi|成果指標|成功条件)\s*[:：-]\s*(.+)$/i]) ||
    compactText(firstMatchingLine(lines, [/(save|saved|reduce|close|prove|approve|hours|minutes|時間|削減|承認|検収)/i])).slice(0, 240);
  const currentBaseline =
    lineValue(lines, [/^(?:baseline|current|today|before|as-is|現状|現在|ベースライン)\s*[:：-]\s*(.+)$/i]) ||
    compactText(firstMatchingLine(lines, [/(manual|scattered|spreadsheet|copy|handoff|chat|ticket|手作業|散在|属人)/i])).slice(0, 240);
  const pilotReviewer = lineValue(lines, [/^(?:reviewer|pilot reviewer|sponsor reviewer|approver|検収者|レビュー担当)\s*[:：-]\s*(.+)$/i]);
  const pilotNotes = lineValue(lines, [/^(?:pilot notes|run notes|pilot result|observed result|notes|メモ|実行メモ)\s*[:：-]\s*(.+)$/i]);
  const genericEvidenceUrl = urlValue(lines, [/^(?:evidence|proof|evidence url|proof url|証拠|証跡)\s*[:：-]\s*(.+)$/i]) || firstHttpsUrl(text);
  const proofLinks: WorkflowIntakeProofLinks = {};
  const targetUrl = urlValue(lines, [/^(?:deployed url|deployment|cloud run|cloud run url|live product|product url|app url|target url|公開url|本番url)\s*[:：-]\s*(.+)$/i]);
  const protopediaUrl = urlValue(lines, [/^(?:protopedia|protopedia url|story url|submission page|作品url)\s*[:：-]\s*(.+)$/i]);
  const videoUrl = urlValue(lines, [/^(?:walkthrough|walkthrough video|video|recording|usage proof|操作動画|動画)\s*[:：-]\s*(.+)$/i]);
  const pilotEvidenceUrl = urlValue(lines, [/^(?:pilot receipt|pilot evidence|measured run|run receipt|pilot url|実測|検収)\s*[:：-]\s*(.+)$/i]);
  const workOrderEvidenceUrl = urlValue(lines, [/^(?:work order proof|work order evidence|scope proof|issue url|ticket url|作業証跡|スコープ証跡)\s*[:：-]\s*(.+)$/i]);
  if (targetUrl) proofLinks.targetUrl = targetUrl;
  if (protopediaUrl) proofLinks.protopediaUrl = protopediaUrl;
  if (videoUrl) proofLinks.videoUrl = videoUrl;
  if (pilotEvidenceUrl) proofLinks.pilotEvidenceUrl = pilotEvidenceUrl;
  if (workOrderEvidenceUrl) proofLinks.workOrderEvidenceUrl = workOrderEvidenceUrl;
  if (!proofLinks.pilotEvidenceUrl && !proofLinks.workOrderEvidenceUrl && genericEvidenceUrl) proofLinks.workOrderEvidenceUrl = genericEvidenceUrl;
  const acceptedTrialLine = acceptedAgentTrialLineValue(lines);
  const agentTrialEvidence = acceptedTrialLine ? agentTrialEvidenceFromAcceptedLine(acceptedTrialLine) : undefined;
  const taskPair = firstTaskPair(text);
  const buyerScenario: Partial<BuyerValueScenarioInput> = {};
  const pilotRun: Partial<PilotRunReceiptInput> = {};

  const teamSize = firstNumber(text, [
    /(?:team|users?|people|members|operators?|利用者|担当|チーム)[^\d]{0,20}(\d{1,3})/i,
    /(\d{1,3})\s*(?:people|users|members|operators|名|人)/i
  ]);
  const cyclesPerMonth = firstNumber(text, [
    /(\d{1,2})\s*(?:cycles?|runs?|reviews?|releases?|sign-?offs?|回)[^\n.]{0,28}(?:\/\s*month|per month|monthly|月)/i,
    /(?:monthly|per month|\/\s*month|月)[^\d]{0,24}(\d{1,2})\s*(?:cycles?|runs?|reviews?|releases?|sign-?offs?|回)?/i
  ]);
  const manualHoursPerCycle = firstNumber(text, [
    /(?:manual|baseline|current|手作業)[^\d]{0,24}(\d{1,3}(?:\.\d+)?)\s*(?:h|hours?|hrs|時間)(?:\s*(?:\/|per)\s*(?:cycle|run|review|release|回))?/i,
    /(\d{1,3}(?:\.\d+)?)\s*(?:h|hours?|hrs|時間)\s*(?:\/|per)\s*(?:cycle|run|review|release|回)/i
  ]);
  const adoptionRatePercent = firstNumber(text, [
    /(?:adoption|usage|rollout|導入|利用)[^\d]{0,24}(\d{1,3})\s*%/i,
    /(\d{1,3})\s*%[^\n.]{0,30}(?:adoption|usage|rollout|導入|利用)/i
  ]);
  const hourlyCostYen = firstNumber(text, [
    /(?:hourly|rate|cost|単価|時給)[^\d¥]{0,18}¥?\s*([\d,]{4,})/i,
    /¥\s*([\d,]{4,})\s*(?:\/\s*h|per hour|hourly|\/時間)/i
  ]);
  const incidentRiskYenPerMonth = firstNumber(text, [
    /(?:risk|incident|failure|delay|損失|障害)[^\d¥]{0,24}¥?\s*([\d,]{4,})/i,
    /¥\s*([\d,]{4,})[^\n.]{0,26}(?:risk|incident|failure|delay|損失|障害)/i
  ]);
  const observedManualMinutes = firstNumber(text, [
    /(?:manual|before|baseline|手作業)[^\d]{0,24}(\d{1,4})\s*(?:m|min|minutes|分)/i
  ]);
  const observedAssistedMinutes = firstNumber(text, [
    /(?:assisted|agent|ai|after|自動|支援)[^\d]{0,24}(\d{1,4})\s*(?:m|min|minutes|分)/i
  ]);
  const participants = firstNumber(text, [
    /(\d{1,3})\s*(?:participants?|reviewers?|operators?|参加者)/i,
    /(?:participants?|reviewers?|operators?|参加者|レビュー担当)[^\d]{0,18}(\d{1,3})/i
  ]);

  if (teamSize !== undefined) buyerScenario.teamSize = teamSize;
  if (cyclesPerMonth !== undefined) buyerScenario.cyclesPerMonth = cyclesPerMonth;
  if (manualHoursPerCycle !== undefined) buyerScenario.manualHoursPerCycle = manualHoursPerCycle;
  if (adoptionRatePercent !== undefined) buyerScenario.adoptionRatePercent = adoptionRatePercent;
  if (hourlyCostYen !== undefined) buyerScenario.hourlyCostYen = hourlyCostYen;
  if (incidentRiskYenPerMonth !== undefined) buyerScenario.incidentRiskYenPerMonth = incidentRiskYenPerMonth;
  if (observedManualMinutes !== undefined) pilotRun.observedManualMinutes = observedManualMinutes;
  if (observedAssistedMinutes !== undefined) pilotRun.observedAssistedMinutes = observedAssistedMinutes;
  if (participants !== undefined) pilotRun.participants = participants;
  if (pilotReviewer) pilotRun.reviewerName = pilotReviewer;
  if (pilotNotes) pilotRun.notes = pilotNotes;
  if (taskPair) {
    pilotRun.acceptedTasks = taskPair.acceptedTasks;
    pilotRun.totalTasks = taskPair.totalTasks;
  }
  const evidenceUrl = proofLinks.pilotEvidenceUrl || proofLinks.workOrderEvidenceUrl || genericEvidenceUrl;
  if (evidenceUrl) pilotRun.evidenceUrl = evidenceUrl;

  const workOrder: Partial<BuyerWorkOrderInput> = {
    ...(request ? { request } : {}),
    ...(targetUser ? { targetUser } : {}),
    ...(successMetric ? { successMetric } : {}),
    ...(currentBaseline ? { currentBaseline } : {}),
    dataSensitivity: dataSensitivityFrom(text),
    ...(proofLinks.workOrderEvidenceUrl || evidenceUrl ? { evidenceUrl: proofLinks.workOrderEvidenceUrl || evidenceUrl } : {})
  };
  const detectedSignals: string[] = [];
  pushSignal(detectedSignals, request, "workflow request");
  pushSignal(detectedSignals, targetUser, "target buyer");
  pushSignal(detectedSignals, successMetric, "success metric");
  pushSignal(detectedSignals, currentBaseline, "baseline");
  pushSignal(detectedSignals, Object.keys(buyerScenario).length > 0, "ROI assumptions");
  pushSignal(detectedSignals, observedManualMinutes !== undefined || observedAssistedMinutes !== undefined, "measured minutes");
  pushSignal(detectedSignals, taskPair, "accepted tasks");
  pushSignal(detectedSignals, pilotReviewer, "pilot reviewer");
  pushSignal(detectedSignals, pilotNotes, "pilot notes");
  pushSignal(detectedSignals, evidenceUrl, "public evidence URL");
  pushSignal(detectedSignals, proofLinks.targetUrl, "deployed URL");
  pushSignal(detectedSignals, proofLinks.protopediaUrl, "ProtoPedia URL");
  pushSignal(detectedSignals, proofLinks.videoUrl, "walkthrough URL");
  pushSignal(detectedSignals, agentTrialEvidence, "accepted A2A trial receipt");
  pushSignal(detectedSignals, workOrder.dataSensitivity, "data boundary");
  const hasPlaceholderEvidence = hasPlaceholderToken(text) || isPlaceholderUrl(text);
  const warnings = [
    ...(targetUser ? [] : ["Target buyer was not explicit."]),
    ...(hasPlaceholderEvidence ? ["Replace placeholder source lines before using this workflow externally."] : []),
    ...(evidenceUrl ? [] : ["Public evidence URL is still missing."]),
    ...(observedManualMinutes !== undefined && observedAssistedMinutes !== undefined ? [] : ["Measured manual/assisted minutes were not both explicit."]),
    ...(acceptedTrialLine && !agentTrialEvidence ? ["Accepted A2A trial receipt needs an HTTPS artifact URL and numeric score."] : [])
  ];
  const confidence = Math.round(Math.min(100, (detectedSignals.length / 10) * 100));

  const draft: Omit<WorkflowIntakeDraft, "sourceTrace"> = {
    workOrder,
    buyerScenario,
    pilotRun,
    proofLinks,
    ...(agentTrialEvidence ? { agentTrialEvidence } : {}),
    confidence,
    summary: `${targetUser || "Target buyer"} / ${request || "workflow request"}${evidenceUrl ? " / evidence linked" : " / proof pending"}`,
    detectedSignals,
    warnings
  };

  return {
    ...draft,
    sourceTrace: buildWorkflowIntakeSourceTrace(text, draft)
  };
}
