import type { QuickWorkflowPilotExpansionRecheckEvidenceInput } from "./quickWorkflowPilotExpansionGuardrail";

export const QUICK_WORKFLOW_PILOT_DRAFT_VERSION = "quick-workflow-pilot-draft.v1";

export type QuickWorkflowPilotExpansionDraftState = {
  measuredValueText: string;
  ownerName: string;
  ownerDecision: QuickWorkflowPilotExpansionRecheckEvidenceInput["ownerDecision"];
  receiptChainAttached: boolean;
  nextWindow: string;
  manualEvidenceText: string;
};

export type QuickWorkflowPilotDraftState = {
  buyerResponseText: string;
  kickoffStartDate: string;
  runEvidenceText: string;
  expansion: QuickWorkflowPilotExpansionDraftState;
};

export type QuickWorkflowPilotDraftSnapshot = {
  version: typeof QUICK_WORKFLOW_PILOT_DRAFT_VERSION;
  savedAt: string;
  state: QuickWorkflowPilotDraftState;
};

export type QuickWorkflowPilotDraftCompletion = {
  readyCount: number;
  totalCount: number;
  label: string;
  detail: string;
};

type QuickWorkflowPilotDraftStateInput = Partial<Omit<QuickWorkflowPilotDraftState, "expansion">> & {
  expansion?: Partial<QuickWorkflowPilotExpansionDraftState> | null;
};

const DEFAULT_KICKOFF_START_DATE = "2026-07-01";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function textField(value: unknown) {
  return typeof value === "string" ? value : "";
}

function compactLine(value: unknown) {
  return textField(value).replace(/\s+/g, " ").trim();
}

function ownerDecisionField(value: unknown): QuickWorkflowPilotExpansionDraftState["ownerDecision"] {
  return value === "approved" || value === "hold" || value === "not-recorded" ? value : "not-recorded";
}

function checkboxField(value: unknown) {
  return value === true;
}

function kickoffDateField(value: unknown) {
  const text = compactLine(value);
  return DATE_RE.test(text) ? text : DEFAULT_KICKOFF_START_DATE;
}

function fnv1a32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function defaultQuickWorkflowPilotExpansionDraftState(): QuickWorkflowPilotExpansionDraftState {
  return {
    measuredValueText: "",
    ownerName: "Finance owner",
    ownerDecision: "not-recorded",
    receiptChainAttached: false,
    nextWindow: "",
    manualEvidenceText: ""
  };
}

export function defaultQuickWorkflowPilotDraftState(): QuickWorkflowPilotDraftState {
  return {
    buyerResponseText: "",
    kickoffStartDate: DEFAULT_KICKOFF_START_DATE,
    runEvidenceText: "",
    expansion: defaultQuickWorkflowPilotExpansionDraftState()
  };
}

export function normalizeQuickWorkflowPilotExpansionDraftState(value: Partial<QuickWorkflowPilotExpansionDraftState> | null | undefined): QuickWorkflowPilotExpansionDraftState {
  return {
    measuredValueText: compactLine(value?.measuredValueText),
    ownerName: compactLine(value?.ownerName) || "Finance owner",
    ownerDecision: ownerDecisionField(value?.ownerDecision),
    receiptChainAttached: checkboxField(value?.receiptChainAttached),
    nextWindow: compactLine(value?.nextWindow),
    manualEvidenceText: textField(value?.manualEvidenceText).trim()
  };
}

export function normalizeQuickWorkflowPilotDraftState(value: QuickWorkflowPilotDraftStateInput | null | undefined): QuickWorkflowPilotDraftState {
  return {
    buyerResponseText: textField(value?.buyerResponseText).trim(),
    kickoffStartDate: kickoffDateField(value?.kickoffStartDate),
    runEvidenceText: textField(value?.runEvidenceText).trim(),
    expansion: normalizeQuickWorkflowPilotExpansionDraftState(value?.expansion)
  };
}

export function quickWorkflowPilotDraftHasContent(value: QuickWorkflowPilotDraftState) {
  const draft = normalizeQuickWorkflowPilotDraftState(value);
  return Boolean(
    draft.buyerResponseText ||
      draft.kickoffStartDate !== DEFAULT_KICKOFF_START_DATE ||
      draft.runEvidenceText ||
      draft.expansion.measuredValueText ||
      draft.expansion.ownerDecision !== "not-recorded" ||
      draft.expansion.receiptChainAttached ||
      draft.expansion.nextWindow ||
      draft.expansion.manualEvidenceText
  );
}

export function quickWorkflowPilotDraftCompletion(value: QuickWorkflowPilotDraftState): QuickWorkflowPilotDraftCompletion {
  const draft = normalizeQuickWorkflowPilotDraftState(value);
  const checks = [
    Boolean(draft.buyerResponseText),
    Boolean(draft.kickoffStartDate),
    Boolean(draft.runEvidenceText),
    Boolean(draft.expansion.measuredValueText),
    draft.expansion.ownerDecision !== "not-recorded",
    draft.expansion.receiptChainAttached,
    Boolean(draft.expansion.nextWindow)
  ];
  const readyCount = checks.filter(Boolean).length;
  const totalCount = checks.length;
  return {
    readyCount,
    totalCount,
    label: `${readyCount}/${totalCount} pilot fields saved`,
    detail:
      readyCount === totalCount
        ? "Buyer reply, run evidence, value recheck, receipt chain, and next window are stored for this workflow."
        : "Buyer reply, run evidence, value recheck, receipt chain, and next window stay available in this browser."
  };
}

export function buildQuickWorkflowPilotDraftSnapshot(
  state: QuickWorkflowPilotDraftState,
  savedAt = new Date().toISOString()
): QuickWorkflowPilotDraftSnapshot {
  return {
    version: QUICK_WORKFLOW_PILOT_DRAFT_VERSION,
    savedAt,
    state: normalizeQuickWorkflowPilotDraftState(state)
  };
}

export function serializeQuickWorkflowPilotDraft(state: QuickWorkflowPilotDraftState, savedAt?: string) {
  return JSON.stringify(buildQuickWorkflowPilotDraftSnapshot(state, savedAt), null, 2);
}

export function parseQuickWorkflowPilotDraft(serialized: string | null | undefined): QuickWorkflowPilotDraftState | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized) as Partial<QuickWorkflowPilotDraftSnapshot>;
    if (parsed.version !== QUICK_WORKFLOW_PILOT_DRAFT_VERSION || typeof parsed.savedAt !== "string") return null;
    const state = normalizeQuickWorkflowPilotDraftState(parsed.state);
    return quickWorkflowPilotDraftHasContent(state) ? state : null;
  } catch {
    return null;
  }
}

export function quickWorkflowPilotDraftStorageKey(input: { buyer: string; workflow: string }) {
  const buyer = compactLine(input.buyer) || "unknown-buyer";
  const workflow = compactLine(input.workflow) || "unknown-workflow";
  return `quick-workflow-pilot-draft:${fnv1a32(`${buyer}\n${workflow}`)}`;
}
