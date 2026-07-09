import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, ExternalLink, GitBranch, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { normalizeBuyerValueScenarioInput } from "./buyerValueScenario";
import { normalizeBuyerWorkOrderInput } from "./buyerWorkOrder";
import { normalizePilotRunReceiptInput } from "./pilotRunReceipt";
import { buildWorkflowIntakeReadiness } from "./workflowIntake";
import { buildWorkflowIntakeDraftFromText, type WorkflowIntakeDraft, type WorkflowIntakeSourceTraceItem } from "./workflowIntakeDraft";
import { WORKFLOW_INTAKE_STARTERS, buildWorkflowIntakePreviewRows, type WorkflowIntakePreviewRow } from "./workflowIntakePreview";

type ApplyState = "idle" | "applied" | "failed";
type CopyState = "idle" | "copied" | "failed";
type InsertState = "idle" | "inserted";
type HeroWorkflowExternalGateStatus = "ready" | "watch" | "blocked";
type HeroWorkflowAppliedProofSlotStatus = "ready" | "repair" | "missing";

export type HeroWorkflowProofAuthenticityCheck = {
  id: string;
  label: string;
  status: HeroWorkflowExternalGateStatus;
  value: string;
  action: string;
};

export type HeroWorkflowExternalGateAction = {
  id: string;
  label: string;
  status: HeroWorkflowExternalGateStatus;
  action: string;
  evidence: string;
};

export type HeroWorkflowValueEstimate = {
  hasMeasuredValueInputs: boolean;
  monthlyValueYen: number;
  monthlyHoursSaved: number;
  pilotBudgetCeilingYen: number;
  valueLine: string;
  budgetLine: string;
  proofLine: string;
};

export type HeroWorkflowRepairLine = {
  id: string;
  label: string;
  status: HeroWorkflowExternalGateStatus;
  line: string;
  why: string;
};

export type HeroWorkflowProofAuthenticity = {
  status: HeroWorkflowExternalGateStatus;
  headline: string;
  summary: string;
  checks: HeroWorkflowProofAuthenticityCheck[];
  realProofUrlCount: number;
  demoProofUrlCount: number;
  placeholderCount: number;
};

export type HeroWorkflowExternalGate = {
  status: HeroWorkflowExternalGateStatus;
  headline: string;
  summary: string;
  valueEstimate: HeroWorkflowValueEstimate;
  authenticity: HeroWorkflowProofAuthenticity;
  actions: HeroWorkflowExternalGateAction[];
  repairLines: HeroWorkflowRepairLine[];
  repairText: string;
  exportMarkdown: string;
};

export type HeroWorkflowArtifactChainItem = {
  id: "buyer-room" | "proof-gate" | "pilot-terms" | "receipt-brief";
  label: string;
  status: HeroWorkflowExternalGateStatus;
  value: string;
  source: string;
  action: string;
};

export type HeroWorkflowBuyerDecisionBriefEvidence = {
  id: "scope" | "value" | "proof" | "trust";
  label: string;
  status: HeroWorkflowExternalGateStatus;
  answer: string;
  source: string;
};

export type HeroWorkflowBuyerDecisionBrief = {
  status: HeroWorkflowExternalGateStatus;
  decision: "send" | "repair-first" | "hold";
  buyerQuestion: string;
  answer: string;
  nextAsk: string;
  redline: string;
  evidence: HeroWorkflowBuyerDecisionBriefEvidence[];
  exportMarkdown: string;
};

export type HeroWorkflowIntakeSnapshot = {
  draft: WorkflowIntakeDraft;
  rows: WorkflowIntakePreviewRow[];
  focusRows: WorkflowIntakePreviewRow[];
  tracedFacts: number;
  totalFacts: number;
  missingFacts: WorkflowIntakeSourceTraceItem[];
  readiness: ReturnType<typeof buildWorkflowIntakeReadiness>;
  sourceLine: string;
  nextRepair: string;
  sendGate: HeroWorkflowExternalGate;
  decisionBrief: HeroWorkflowBuyerDecisionBrief;
  artifactChain: HeroWorkflowArtifactChainItem[];
};

export type HeroWorkflowAppliedProofSlot = {
  id: keyof WorkflowIntakeDraft["proofLinks"];
  label: string;
  status: HeroWorkflowAppliedProofSlotStatus;
  value: string;
  action: string;
};

export type HeroWorkflowAppliedHandoff = {
  status: HeroWorkflowExternalGateStatus;
  headline: string;
  summary: string;
  readyCount: number;
  repairCount: number;
  missingCount: number;
  proofSlots: HeroWorkflowAppliedProofSlot[];
  nextAction: string;
};

export type HeroWorkflowApplyPreview = {
  status: HeroWorkflowExternalGateStatus;
  headline: string;
  summary: string;
  signalLine: string;
  proofLine: string;
  nextAction: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function firstRepairFrom(draft: WorkflowIntakeDraft) {
  const firstMissing = draft.sourceTrace.find((item) => item.status === "missing");
  return firstMissing?.action || draft.warnings[0] || "The workflow note has enough source facts for a buyer packet preview.";
}

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundYen(value: number) {
  return Math.round(value / 1000) * 1000;
}

function formatYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

function compactArtifactText(value: string, maxLength = 92) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, maxLength - 3).trimEnd()}...`;
}

function hasPlaceholderToken(value: string) {
  return /<[^>\n]+>/.test(value);
}

function proofUrlIssue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "missing proof URL";
  if (hasPlaceholderToken(trimmed) || trimmed.includes("...")) return "placeholder proof URL";
  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return "non-HTTPS proof URL";
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return "local proof URL";
    if (hostname === "example.com" || hostname.endsWith(".example.com")) return "demo proof domain";
    if (hostname.endsWith(".test") || hostname.endsWith(".invalid")) return "placeholder proof domain";
    if (hostname.includes("your-cloud-run-url") || hostname.includes("your-service")) return "placeholder deployment host";
    return "";
  } catch {
    return "invalid proof URL";
  }
}

function proofUrlsFromDraft(draft: WorkflowIntakeDraft) {
  return Array.from(
    new Set(
      [
        ...Object.values(draft.proofLinks),
        draft.workOrder.evidenceUrl,
        draft.pilotRun.evidenceUrl,
        draft.agentTrialEvidence?.artifactUrl
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim())
    )
  );
}

function buildHeroWorkflowProofAuthenticity(draft: WorkflowIntakeDraft): HeroWorkflowProofAuthenticity {
  const urls = proofUrlsFromDraft(draft);
  const checkedUrls = urls.map((url) => ({ url, issue: proofUrlIssue(url) }));
  const placeholderWarnings = draft.warnings.filter((warning) => /placeholder/i.test(warning));
  const demoUrls = checkedUrls.filter((item) => item.issue === "demo proof domain");
  const placeholderUrls = checkedUrls.filter((item) => item.issue && item.issue !== "demo proof domain");
  const realProofUrlCount = checkedUrls.filter((item) => !item.issue).length;
  const placeholderCount = placeholderUrls.length + placeholderWarnings.length;
  const checks: HeroWorkflowProofAuthenticityCheck[] = [
    ...demoUrls.map((item, index) => ({
      id: `demo-proof-${index + 1}`,
      label: "Demo proof URL",
      status: "blocked" as const,
      value: item.url,
      action: "Replace the example.com proof URL with a real public artifact URL reviewers can open."
    })),
    ...placeholderUrls.map((item, index) => ({
      id: `placeholder-proof-${index + 1}`,
      label: "Placeholder proof URL",
      status: "blocked" as const,
      value: item.url,
      action: `Replace this ${item.issue} with a real HTTPS artifact URL.`
    })),
    ...placeholderWarnings.map((warning, index) => ({
      id: `placeholder-source-${index + 1}`,
      label: "Placeholder source line",
      status: "blocked" as const,
      value: warning,
      action: "Replace placeholder source lines before using this workflow externally."
    }))
  ];
  if (checks.length === 0 && realProofUrlCount > 0) {
    checks.push({
      id: "real-proof-url",
      label: "Public proof URL",
      status: "ready",
      value: `${realProofUrlCount} real public proof URL${realProofUrlCount === 1 ? "" : "s"}`,
      action: "Keep the real public proof URL attached and verify freshness before buyer review."
    });
  }
	  if (checks.length === 0) {
	    checks.push({
	      id: "no-proof-url",
	      label: "Public proof",
	      status: "blocked",
	      value: "No public proof URL attached yet.",
	      action: "Attach a real HTTPS proof URL before external sharing."
	    });
	  }
  const status: HeroWorkflowExternalGateStatus = checks.some((check) => check.status === "blocked") ? "blocked" : checks.some((check) => check.status === "watch") ? "watch" : "ready";
  const headline = status === "ready" ? "Real proof URLs attached" : demoUrls.length > 0 ? "Demo proof blocks publishing" : "Proof authenticity needs repair";
	  const summary =
	    status === "ready"
	      ? `${realProofUrlCount} real public proof URL${realProofUrlCount === 1 ? "" : "s"} attached.`
	      : demoUrls.length > 0
	        ? `${demoUrls.length} example.com proof URL${demoUrls.length === 1 ? "" : "s"} must be replaced before external send.`
	        : urls.length === 0 && placeholderWarnings.length === 0
	          ? "No public proof URL attached yet."
	        : `${placeholderCount || checks.length} placeholder proof item${(placeholderCount || checks.length) === 1 ? "" : "s"} must be replaced.`;

  return {
    status,
    headline,
    summary,
    checks,
    realProofUrlCount,
    demoProofUrlCount: demoUrls.length,
    placeholderCount
  };
}

function buildHeroWorkflowValueEstimate(draft: WorkflowIntakeDraft, sourceLine: string): HeroWorkflowValueEstimate {
  const manual = hasFiniteNumber(draft.pilotRun.observedManualMinutes) ? draft.pilotRun.observedManualMinutes : 0;
  const assisted = hasFiniteNumber(draft.pilotRun.observedAssistedMinutes) ? draft.pilotRun.observedAssistedMinutes : 0;
  const savedMinutes = Math.max(0, manual - assisted);
  const cyclesPerMonth = hasFiniteNumber(draft.buyerScenario.cyclesPerMonth) ? draft.buyerScenario.cyclesPerMonth : 0;
  const adoptionRatePercent = hasFiniteNumber(draft.buyerScenario.adoptionRatePercent) ? draft.buyerScenario.adoptionRatePercent : 0;
  const hourlyCostYen = hasFiniteNumber(draft.buyerScenario.hourlyCostYen) ? draft.buyerScenario.hourlyCostYen : 0;
  const incidentRiskYenPerMonth = hasFiniteNumber(draft.buyerScenario.incidentRiskYenPerMonth) ? draft.buyerScenario.incidentRiskYenPerMonth : 0;
  const adoptionRate = adoptionRatePercent > 0 ? adoptionRatePercent / 100 : 0;
  const hasMeasuredValueInputs = savedMinutes > 0 && cyclesPerMonth > 0 && adoptionRate > 0 && hourlyCostYen > 0;
  const monthlyHoursSavedExact = hasMeasuredValueInputs ? (savedMinutes / 60) * cyclesPerMonth * adoptionRate : 0;
  const monthlyHoursSaved = round1(monthlyHoursSavedExact);
  const monthlyLaborValueYen = monthlyHoursSavedExact * hourlyCostYen;
  const monthlyRiskValueYen = hasMeasuredValueInputs ? incidentRiskYenPerMonth * 0.22 * adoptionRate : 0;
  const monthlyValueExactYen = hasMeasuredValueInputs ? monthlyLaborValueYen + monthlyRiskValueYen : 0;
  const monthlyValueYen = monthlyValueExactYen > 0 ? roundYen(monthlyValueExactYen) : 0;
  const pilotBudgetCeilingYen = monthlyValueExactYen > 0 ? Math.max(1000, roundYen(monthlyValueExactYen * 0.5)) : 0;
  const proofUrlCount = Object.values(draft.proofLinks).filter((value) => Boolean(value?.trim())).length;
  const proofLine = proofUrlCount > 0 ? `${proofUrlCount}/5 proof URL${proofUrlCount === 1 ? "" : "s"} plus ${sourceLine}` : sourceLine;

  return {
    hasMeasuredValueInputs,
    monthlyValueYen,
    monthlyHoursSaved,
    pilotBudgetCeilingYen,
    valueLine: monthlyValueYen > 0 ? `${formatYen(monthlyValueYen)}/month, ${monthlyHoursSaved}h saved` : "Value not defensible yet",
    budgetLine: pilotBudgetCeilingYen > 0 ? `${formatYen(pilotBudgetCeilingYen)} pilot cap` : "No buyer-safe cap yet",
    proofLine
  };
}

function actionStatusFromSource(item: WorkflowIntakeSourceTraceItem, readiness: ReturnType<typeof buildWorkflowIntakeReadiness>): HeroWorkflowExternalGateStatus {
  if (item.status === "traced") return "ready";
  if (item.id === "agent-trial" && readiness.decision === "pilot-ready") return "watch";
  return item.status === "inferred" ? "watch" : "blocked";
}

function actionStatusFromCheck(status: ReturnType<typeof buildWorkflowIntakeReadiness>["checks"][number]["status"]): HeroWorkflowExternalGateStatus {
  if (status === "clear") return "ready";
  return status === "watch" ? "watch" : "blocked";
}

function buildSourceGateAction(item: WorkflowIntakeSourceTraceItem, readiness: ReturnType<typeof buildWorkflowIntakeReadiness>): HeroWorkflowExternalGateAction {
  return {
    id: `source-${item.id}`,
    label: item.label,
    status: actionStatusFromSource(item, readiness),
    action: item.action,
    evidence: item.status === "inferred" ? "Only inferred from the pasted note." : "No source line traced yet."
  };
}

function buildRepairLineForAction(action: HeroWorkflowExternalGateAction): HeroWorkflowRepairLine | null {
  const id = action.id.toLowerCase();
  const label = action.label.toLowerCase();
  const has = (token: string) => id.includes(token) || label.includes(token);
  const base = {
    id: `repair-${action.id}`,
    label: action.label,
    status: action.status,
    why: action.action
  };

  if (has("data-boundary")) {
    return {
      ...base,
      line: "Data: public-safe redacted evidence. Restricted inputs removed before external sharing."
    };
  }
  if (has("a2a") || has("agent-trial")) {
    return {
      ...base,
      line: "Accepted A2A trial receipt: agent=<agent name>, skill=<skill id>, status accepted, score <score>/100, artifact <https public receipt URL>."
    };
  }
	  if (has("public-proof") || has("proof")) {
	    return {
	      ...base,
	      line: [
	        "Evidence: artifact=<https public work-order, pilot-run, or receipt URL reviewers can open>.",
	        "Receipt: id=<receipt id>, verifier=<https public verifier URL or /receipt-verifier>, openedBy=<buyer reviewer role>."
	      ].join("\n")
	    };
	  }
  if (has("measured-run") || has("pilot-run") || has("measured pilot")) {
    return {
      ...base,
      line: "Pilot: manual <minutes> min, assisted <minutes> min, <participants> participants, <accepted>/<total> tasks accepted."
    };
  }
  if (has("value-model")) {
    return {
      ...base,
      line: "Team <people> people, <runs>/month, manual <hours> hours/run, <adoption>% adoption, hourly ¥<loaded cost>, risk ¥<monthly risk>."
    };
  }
  if (has("scope") || has("workflow") || has("buyer")) {
    return {
      ...base,
      line: [
        "Buyer: <role that can approve this workflow>",
        "Workflow: <one bounded recurring approval workflow, source systems, and handoff owner>",
        "Baseline: <manual current state, scattered systems, owner gaps, and approval delay>",
        "Success: <measurable time saved, proof gaps closed, and decision condition>"
      ].join("\n")
    };
  }
  if (has("baseline")) {
    return {
      ...base,
      line: "Baseline: <manual current state, scattered systems, owner gaps, and approval delay>."
    };
  }
  if (has("success")) {
    return {
      ...base,
      line: "Success: <measurable time saved, proof gaps closed, and decision condition>."
    };
  }

  return null;
}

function buildRepairLines(actions: HeroWorkflowExternalGateAction[]) {
  return actions
    .filter((action) => action.status !== "ready")
    .map((action) => buildRepairLineForAction(action))
    .filter((line): line is HeroWorkflowRepairLine => Boolean(line));
}

function buildRepairText(repairLines: HeroWorkflowRepairLine[]) {
  if (repairLines.length === 0) return "";
  return [
    "Repair lines to complete before external sharing:",
    ...repairLines.flatMap((item) => [`${item.label}:`, item.line])
  ].join("\n");
}

function buildHeroWorkflowExternalGate(
  draft: WorkflowIntakeDraft,
  readiness: ReturnType<typeof buildWorkflowIntakeReadiness>,
  sourceLine: string
): HeroWorkflowExternalGate {
  const valueEstimate = buildHeroWorkflowValueEstimate(draft, sourceLine);
  const authenticity = buildHeroWorkflowProofAuthenticity(draft);
  const authenticityActions: HeroWorkflowExternalGateAction[] = authenticity.checks
    .filter((check) => check.status !== "ready")
    .map((check) => ({
      id: `authenticity-${check.id}`,
      label: check.label,
      status: check.status,
      action: check.action,
      evidence: check.value
    }));
  const readinessActions: HeroWorkflowExternalGateAction[] = readiness.checks
    .filter((check) => check.status !== "clear")
    .map((check) => ({
      id: `readiness-${check.id}`,
      label: check.label,
      status: actionStatusFromCheck(check.status),
      action: check.fix,
      evidence: check.evidence
    }));
  const sourceActions = draft.sourceTrace.filter((item) => item.status !== "traced").map((item) => buildSourceGateAction(item, readiness));
  const orderedActions =
    readiness.decision === "do-not-share"
      ? [...readinessActions, ...authenticityActions, ...sourceActions]
      : [...authenticityActions, ...sourceActions, ...readinessActions];
  const dedupedActions = orderedActions.filter((action, index, actions) => actions.findIndex((candidate) => candidate.label === action.label) === index);
  const openActions = dedupedActions.slice(0, 3);
  const actions =
    openActions.length > 0
      ? openActions
      : [
          {
            id: "external-review",
            label: "Buyer review",
            status: "ready" as const,
            action: "Apply this workflow, open the buyer room, and ask for a continue, revise, or stop decision.",
            evidence: "All required source facts are traced."
          }
        ];
  const hasBlockedActions = actions.some((action) => action.status === "blocked");
  const hasWatchActions = actions.some((action) => action.status === "watch");
  const repairLines = buildRepairLines(actions);
  const repairText = buildRepairText(repairLines);
  const status: HeroWorkflowExternalGateStatus =
    readiness.decision === "do-not-share" || readiness.decision === "needs-scope" || hasBlockedActions || authenticity.status === "blocked"
      ? "blocked"
      : readiness.decision !== "pilot-ready" || hasWatchActions || authenticity.status === "watch"
        ? "watch"
        : "ready";
  const repairCount = actions.filter((action) => action.status !== "ready").length;
  const firstOpen = actions.find((action) => action.status !== "ready") ?? actions[0];
  const headline =
    status === "ready"
      ? "Ready for external buyer review"
      : status === "watch"
        ? `${pluralize(repairCount, "repair item")} before external send`
        : "Do not send externally yet";
  const summary =
    status === "ready"
      ? `${valueEstimate.valueLine}. Buyer can inspect the room and receipt trail.`
      : firstOpen
        ? `${valueEstimate.valueLine}. External sharing waits on ${firstOpen.label}.`
        : `${valueEstimate.valueLine}. Keep repairing the source evidence before sharing.`;
  const exportMarkdown = [
    "# External send gate",
    "",
    `Status: ${status}`,
    `Readiness: ${readiness.headline}`,
    `Value: ${valueEstimate.valueLine}`,
    `Pilot cap: ${valueEstimate.budgetLine}`,
    `Proof: ${valueEstimate.proofLine}`,
    `Proof authenticity: ${authenticity.summary}`,
    `Next action: ${firstOpen?.action ?? readiness.nextAction}`,
    "",
    "## Repair actions",
    ...actions.map((action) => `- [${action.status}] ${action.label}: ${action.action} Evidence: ${action.evidence}`),
    "",
    "## Repair lines",
    ...(repairLines.length > 0 ? repairLines.map((item) => `- ${item.label}: ${item.line.replace(/\n/g, " / ")}`) : ["No repair lines needed."])
  ].join("\n");

  return {
    status,
    headline,
    summary,
    valueEstimate,
    authenticity,
    actions,
    repairLines,
    repairText,
    exportMarkdown
  };
}

function artifactSourceLine(draft: WorkflowIntakeDraft, sourceIds: WorkflowIntakeSourceTraceItem["id"][], fallback: string) {
  const source =
    sourceIds.map((id) => draft.sourceTrace.find((item) => item.id === id && item.status === "traced")).find(Boolean) ??
    sourceIds.map((id) => draft.sourceTrace.find((item) => item.id === id && item.status === "inferred")).find(Boolean);
  if (!source) return fallback;
  if (source.sourceLineNumber && source.sourceLine) return `L${source.sourceLineNumber}: ${compactArtifactText(source.sourceLine, 68)}`;
  if (source.extracted) return compactArtifactText(source.extracted, 68);
  return source.action || fallback;
}

function artifactStatusFromDecision(decision: ReturnType<typeof buildWorkflowIntakeReadiness>["decision"]): HeroWorkflowExternalGateStatus {
  if (decision === "pilot-ready") return "ready";
  if (decision === "needs-proof") return "watch";
  return "blocked";
}

function buildHeroWorkflowArtifactChain(
  draft: WorkflowIntakeDraft,
  readiness: ReturnType<typeof buildWorkflowIntakeReadiness>,
  sendGate: HeroWorkflowExternalGate,
  sourceLine: string
): HeroWorkflowArtifactChainItem[] {
  const buyer = draft.workOrder.targetUser || "Target buyer";
  const workflow = draft.workOrder.request || "workflow request";
  const primaryGateAction = sendGate.actions.find((action) => action.status !== "ready") ?? sendGate.actions[0];
  const valueStatus: HeroWorkflowExternalGateStatus = sendGate.valueEstimate.hasMeasuredValueInputs ? (sendGate.status === "ready" ? "ready" : "watch") : "blocked";
  const receiptStatus: HeroWorkflowExternalGateStatus = sendGate.repairLines.length > 0 ? "watch" : "ready";

  return [
    {
      id: "buyer-room",
      label: "Buyer room",
      status: artifactStatusFromDecision(readiness.decision),
      value: `${buyer}: ${compactArtifactText(workflow, 72)}`,
      source: artifactSourceLine(draft, ["buyer", "workflow"], "Buyer and workflow still need source lines."),
      action: draft.workOrder.successMetric || "Name the success metric before sharing."
    },
    {
      id: "proof-gate",
      label: "Proof gate",
      status: sendGate.status,
      value: sendGate.headline,
      source: artifactSourceLine(draft, ["public-proof", "agent-trial"], "No public proof source line yet."),
      action: primaryGateAction?.action ?? readiness.nextAction
    },
    {
      id: "pilot-terms",
      label: "Pilot terms",
      status: valueStatus,
      value: `${sendGate.valueEstimate.valueLine} / ${sendGate.valueEstimate.budgetLine}`,
      source: artifactSourceLine(draft, ["value-model", "pilot-run"], "Value model and measured run still need source lines."),
      action: sendGate.valueEstimate.hasMeasuredValueInputs ? "Use this cap until the buyer accepts measured value." : "Add manual and assisted minutes before pricing."
    },
    {
      id: "receipt-brief",
      label: "Receipt brief",
      status: receiptStatus,
      value: sendGate.repairLines.length > 0 ? `${pluralize(sendGate.repairLines.length, "repair line")} ready to paste` : "Copy-ready external send gate",
      source: sourceLine,
      action: sendGate.repairLines.length > 0 ? "Insert repair lines, analyze again, then apply." : "Copy the brief or apply this room to the workspace."
    }
  ];
}

function evidenceStatusFromReadiness(status: ReturnType<typeof buildWorkflowIntakeReadiness>["checks"][number]["status"] | undefined): HeroWorkflowExternalGateStatus {
  if (status === "clear") return "ready";
  if (status === "watch") return "watch";
  return "blocked";
}

function decisionFromSendGate(status: HeroWorkflowExternalGateStatus): HeroWorkflowBuyerDecisionBrief["decision"] {
  if (status === "ready") return "send";
  if (status === "watch") return "repair-first";
  return "hold";
}

function decisionLabel(decision: HeroWorkflowBuyerDecisionBrief["decision"]) {
  if (decision === "send") return "Send";
  if (decision === "repair-first") return "Repair first";
  return "Hold";
}

function buildHeroWorkflowBuyerDecisionBrief(
  draft: WorkflowIntakeDraft,
  readiness: ReturnType<typeof buildWorkflowIntakeReadiness>,
  sendGate: HeroWorkflowExternalGate,
  sourceLine: string
): HeroWorkflowBuyerDecisionBrief {
  const buyer = draft.workOrder.targetUser || "the buyer";
  const workflow = compactArtifactText(draft.workOrder.request || "this workflow", 92);
  const scopeCheck = readiness.checks.find((check) => check.id === "scope");
  const valueCheck = readiness.checks.find((check) => check.id === "value-model");
  const dataCheck = readiness.checks.find((check) => check.id === "data-boundary");
  const nextOpen = sendGate.actions.find((action) => action.status !== "ready") ?? sendGate.actions[0];
  const decision = decisionFromSendGate(sendGate.status);
  const buyerQuestion = `Should ${buyer} approve a bounded pilot for ${workflow}?`;
  const answer =
    decision === "send"
      ? `Yes. Send a bounded pilot request with ${sendGate.valueEstimate.valueLine}, public proof, and a continue/revise/stop decision path.`
      : decision === "repair-first"
        ? `Not yet. The value case is promising, but ${nextOpen?.label ?? "one proof item"} needs repair before buyer delivery.`
        : `No. Hold external sharing until ${nextOpen?.label ?? "the first proof blocker"} is repaired and the proof can be opened by a reviewer.`;
  const nextAsk =
    decision === "send"
      ? "Ask the buyer to choose continue, revise, or stop in the decision cockpit."
      : decision === "repair-first"
        ? `Repair ${nextOpen?.label ?? "the open proof item"}, re-run proof verification, then reopen the buyer room.`
        : "Insert the repair lines, attach real public proof, then analyze again before applying to the workspace.";
  const redline =
    decision === "send"
      ? "Do not claim expansion, renewal, or production rollout until the buyer accepts the measured pilot receipt."
      : "Do not call this globally publishable or buyer-ready until public proof, measured value, and data boundary are all reviewable.";
  const evidence: HeroWorkflowBuyerDecisionBriefEvidence[] = [
    {
      id: "scope",
      label: "Buyer scope",
      status: evidenceStatusFromReadiness(scopeCheck?.status),
      answer: scopeCheck?.evidence ?? "Buyer and workflow scope are not named yet.",
      source: artifactSourceLine(draft, ["buyer", "workflow", "success"], "Buyer, workflow, and success source lines are still missing.")
    },
    {
      id: "value",
      label: "Value case",
      status: sendGate.valueEstimate.hasMeasuredValueInputs ? evidenceStatusFromReadiness(valueCheck?.status) : "blocked",
      answer: `${sendGate.valueEstimate.valueLine}; ${sendGate.valueEstimate.budgetLine}.`,
      source: artifactSourceLine(draft, ["value-model", "pilot-run"], "Value model and measured run still need source lines.")
    },
    {
      id: "proof",
      label: "Public proof",
      status: sendGate.authenticity.status,
      answer: sendGate.authenticity.summary,
      source: artifactSourceLine(draft, ["public-proof", "agent-trial"], "No public proof source line yet.")
    },
    {
      id: "trust",
      label: "Trust boundary",
      status: evidenceStatusFromReadiness(dataCheck?.status),
      answer: dataCheck?.evidence ?? "Data boundary is not declared.",
      source: artifactSourceLine(draft, ["data-boundary"], "Data boundary source line is still missing.")
    }
  ];
  const exportMarkdown = [
    "# Buyer decision brief",
    "",
    `Decision: ${decisionLabel(decision)}`,
    `Question: ${buyerQuestion}`,
    `Answer: ${answer}`,
    `Next ask: ${nextAsk}`,
    `Redline: ${redline}`,
    `Source coverage: ${sourceLine}`,
    "",
    "## Evidence",
    ...evidence.map((item) => `- [${item.status}] ${item.label}: ${item.answer} Source: ${item.source}`)
  ].join("\n");

  return {
    status: sendGate.status,
    decision,
    buyerQuestion,
    answer,
    nextAsk,
    redline,
    evidence,
    exportMarkdown
  };
}

const HERO_WORKFLOW_APPLIED_PROOF_SLOTS: Array<{ id: keyof WorkflowIntakeDraft["proofLinks"]; label: string }> = [
  { id: "targetUrl", label: "Deployed URL" },
  { id: "protopediaUrl", label: "ProtoPedia URL" },
  { id: "videoUrl", label: "Walkthrough video" },
  { id: "pilotEvidenceUrl", label: "Pilot receipt" },
  { id: "workOrderEvidenceUrl", label: "Work order proof" }
];

function appliedProofSlotFor(draft: WorkflowIntakeDraft, slot: (typeof HERO_WORKFLOW_APPLIED_PROOF_SLOTS)[number]): HeroWorkflowAppliedProofSlot {
  const value = draft.proofLinks[slot.id]?.trim() ?? "";
  if (!value) {
    return {
      ...slot,
      status: "missing",
      value: "Missing",
      action: `Attach ${slot.label} before live verification.`
    };
  }
  const issue = proofUrlIssue(value);
  if (issue) {
    return {
      ...slot,
      status: "repair",
      value,
      action: `Replace this ${issue} before buyer sharing.`
    };
  }
  return {
    ...slot,
    status: "ready",
    value,
    action: "Ready for live link verification."
  };
}

export function buildHeroWorkflowAppliedHandoff(snapshot: HeroWorkflowIntakeSnapshot): HeroWorkflowAppliedHandoff {
  const proofSlots = HERO_WORKFLOW_APPLIED_PROOF_SLOTS.map((slot) => appliedProofSlotFor(snapshot.draft, slot));
  const readyCount = proofSlots.filter((slot) => slot.status === "ready").length;
  const repairCount = proofSlots.filter((slot) => slot.status === "repair").length;
  const missingCount = proofSlots.filter((slot) => slot.status === "missing").length;
  const openProofItems = repairCount + missingCount;
  const status: HeroWorkflowExternalGateStatus =
    readyCount === proofSlots.length && snapshot.sendGate.status === "ready" ? "ready" : readyCount > 0 ? "watch" : "blocked";
  const nextOpenSlot = proofSlots.find((slot) => slot.status !== "ready");
  const headline =
    status === "ready"
      ? "Workspace applied with complete public proof"
      : status === "watch"
        ? "Workspace applied with proof repair list"
        : "Workspace applied, proof still missing";
  const summary =
    `${snapshot.draft.detectedSignals.length} workflow signals applied. ` +
    `${readyCount}/${proofSlots.length} public proof slots ready; ${openProofItems} proof ${openProofItems === 1 ? "item remains" : "items remain"}.`;
  const nextAction =
    status === "ready"
      ? "Live proof verification starts on apply; inspect results before sending the buyer room."
      : nextOpenSlot
        ? nextOpenSlot.action
        : "Open the proof workbench and verify the buyer room.";

  return {
    status,
    headline,
    summary,
    readyCount,
    repairCount,
    missingCount,
    proofSlots,
    nextAction
  };
}

export function buildHeroWorkflowApplyPreview(snapshot: HeroWorkflowIntakeSnapshot): HeroWorkflowApplyPreview {
  const handoff = buildHeroWorkflowAppliedHandoff(snapshot);
  const openProofItems = handoff.repairCount + handoff.missingCount;
  const headline =
    handoff.status === "ready"
      ? "Apply creates a buyer-ready workspace"
      : handoff.status === "watch"
        ? "Apply creates the workspace and repair list"
        : "Apply creates the workspace, proof still blocks send";
  const summary = `${snapshot.draft.detectedSignals.length} extracted workflow signals will update buyer scope, value model, pilot run, and proof fields.`;
  const proofLine =
    openProofItems > 0
      ? `${handoff.readyCount}/5 proof slots ready, ${openProofItems} to repair`
      : `${handoff.readyCount}/5 proof slots ready for live verification`;

  return {
    status: handoff.status,
    headline,
    summary,
    signalLine: `${snapshot.draft.detectedSignals.length} workflow signals`,
    proofLine,
    nextAction: handoff.nextAction
  };
}

export function buildHeroWorkflowIntakeSnapshot(rawNote: string): HeroWorkflowIntakeSnapshot {
  const draft = buildWorkflowIntakeDraftFromText(rawNote);
  const workOrder = normalizeBuyerWorkOrderInput(draft.workOrder);
  const buyerScenario = normalizeBuyerValueScenarioInput(draft.buyerScenario);
  const pilotRun = normalizePilotRunReceiptInput(draft.pilotRun);
  const readiness = buildWorkflowIntakeReadiness({ workOrder, buyerScenario, pilotRun });
  const rows = buildWorkflowIntakePreviewRows(draft);
  const missingFacts = draft.sourceTrace.filter((item) => item.status === "missing");
  const tracedFacts = draft.sourceTrace.filter((item) => item.status === "traced").length;
  const focusRows = rows.filter((row) => row.id === "buyer" || row.id === "value" || row.id === "pilot" || row.id === "proof");
  const sourceLine = draft.sourceTrace.length ? `${tracedFacts}/${draft.sourceTrace.length} source facts traced` : "No source facts traced yet";
  const sendGate = buildHeroWorkflowExternalGate(draft, readiness, sourceLine);
  const decisionBrief = buildHeroWorkflowBuyerDecisionBrief(draft, readiness, sendGate, sourceLine);

  return {
    draft,
    rows,
    focusRows,
    tracedFacts,
    totalFacts: draft.sourceTrace.length,
    missingFacts,
    readiness,
    sourceLine,
    nextRepair: firstRepairFrom(draft),
    sendGate,
    decisionBrief,
    artifactChain: buildHeroWorkflowArtifactChain(draft, readiness, sendGate, sourceLine)
  };
}

export default function HeroWorkflowIntakeConsole({
  onApplyDraft,
  intakeHref = "#quick-workflow-intake",
  buyerDecisionCockpitHref = "/buyer-decision-cockpit",
  launchEvidenceHref = "/launch-evidence",
  buyerEvidenceBoardHref = "/buyer-evidence-board"
}: {
  onApplyDraft: (draft: WorkflowIntakeDraft) => void;
  intakeHref?: string;
  buyerDecisionCockpitHref?: string;
  launchEvidenceHref?: string;
  buyerEvidenceBoardHref?: string;
}) {
  const initialStarter = WORKFLOW_INTAKE_STARTERS[0];
  const [rawNote, setRawNote] = useState(initialStarter.note);
  const [selectedStarterId, setSelectedStarterId] = useState(initialStarter.id);
  const [previewNote, setPreviewNote] = useState(initialStarter.note);
  const [applyState, setApplyState] = useState<ApplyState>("idle");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [insertState, setInsertState] = useState<InsertState>("idle");
  const [appliedHandoff, setAppliedHandoff] = useState<HeroWorkflowAppliedHandoff | null>(null);
  const snapshot = useMemo(() => buildHeroWorkflowIntakeSnapshot(previewNote), [previewNote]);
  const canAnalyze = rawNote.trim().length > 0;
  const canApply = snapshot.draft.detectedSignals.length > 0;
  const canInsertRepairLines = snapshot.sendGate.repairText.length > 0;
  const blockedCount = snapshot.rows.filter((row) => row.status === "missing").length;
  const actionLabel = applyState === "applied" ? "Workspace updated" : applyState === "failed" ? "Apply failed" : "Apply to workspace";
  const copyLabel = copyState === "copied" ? "Brief copied" : copyState === "failed" ? "Copy failed" : "Copy brief";
  const insertLabel = insertState === "inserted" ? "Lines inserted" : "Insert repair lines";
  const primaryGateAction = snapshot.sendGate.actions.find((action) => action.status !== "ready") ?? snapshot.sendGate.actions[0];
  const currentAppliedHandoff = useMemo(() => buildHeroWorkflowAppliedHandoff(snapshot), [snapshot]);
  const applyPreview = useMemo(() => buildHeroWorkflowApplyPreview(snapshot), [snapshot]);
  const outputSummary =
    snapshot.sendGate.status === "ready"
      ? "Buyer room can move to receipt verification and external review."
      : primaryGateAction
        ? primaryGateAction.action
        : snapshot.readiness.nextAction;
  const detailSummary = `${snapshot.focusRows.length} extracted facts, ${snapshot.sendGate.actions.length} gate action${snapshot.sendGate.actions.length === 1 ? "" : "s"}, ${snapshot.sendGate.repairLines.length} repair line${snapshot.sendGate.repairLines.length === 1 ? "" : "s"}`;
  const buyerDecisionExport = `${snapshot.decisionBrief.exportMarkdown}\n\n---\n\n${snapshot.sendGate.exportMarkdown}`;

  useEffect(() => {
    if (applyState === "idle") return;
    const timeout = window.setTimeout(() => setApplyState("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [applyState]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => {
    if (insertState === "idle") return;
    const timeout = window.setTimeout(() => setInsertState("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [insertState]);

  function loadStarter(starterId: string) {
    const starter = WORKFLOW_INTAKE_STARTERS.find((item) => item.id === starterId) ?? initialStarter;
    setRawNote(starter.note);
    setPreviewNote(starter.note);
    setSelectedStarterId(starter.id);
    setApplyState("idle");
    setCopyState("idle");
    setInsertState("idle");
    setAppliedHandoff(null);
  }

  function analyzeNote() {
    if (!canAnalyze) return;
    setPreviewNote(rawNote);
    setSelectedStarterId("");
    setApplyState("idle");
    setCopyState("idle");
    setInsertState("idle");
    setAppliedHandoff(null);
  }

  function applySnapshot() {
    if (!canApply) return;
    try {
      onApplyDraft(snapshot.draft);
      setAppliedHandoff(currentAppliedHandoff);
      setApplyState("applied");
    } catch {
      setApplyState("failed");
    }
  }

  function copyBrief() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyState("failed");
      return;
    }
    void navigator.clipboard.writeText(buyerDecisionExport).then(
      () => setCopyState("copied"),
      () => setCopyState("failed")
    );
  }

  function insertRepairLines() {
    if (!canInsertRepairLines) return;
    setRawNote((current) => {
      const trimmed = current.trimEnd();
      return `${trimmed}${trimmed ? "\n\n" : ""}${snapshot.sendGate.repairText}`;
    });
    setSelectedStarterId("");
    setApplyState("idle");
    setCopyState("idle");
    setInsertState("inserted");
    setAppliedHandoff(null);
  }

  return (
    <section className={cx("hero-workflow-intake-console", `is-${snapshot.readiness.decision}`)} aria-label="Live workflow intake console">
      <div className="hero-workflow-intake-head">
        <div>
          <span>Live workflow intake</span>
          <strong>{snapshot.readiness.headline}</strong>
          <p>
            {snapshot.sourceLine}. {snapshot.nextRepair}
          </p>
        </div>
        <div className="hero-workflow-intake-score" aria-label="Workflow readiness score">
          <span>{snapshot.readiness.decision}</span>
          <strong>{snapshot.readiness.score}</strong>
          <small>{blockedCount} missing rows</small>
        </div>
      </div>

      <div className="hero-workflow-intake-starters" aria-label="Workflow starter notes">
        {WORKFLOW_INTAKE_STARTERS.map((starter) => (
          <button key={starter.id} className={cx(selectedStarterId === starter.id && "is-selected")} type="button" onClick={() => loadStarter(starter.id)}>
            <span>{starter.buyer}</span>
            <strong>{starter.title}</strong>
          </button>
        ))}
      </div>

      <section className={cx("hero-buyer-decision-brief", snapshot.decisionBrief.status)} aria-label="Buyer decision brief">
        <div className="hero-buyer-decision-main">
          <span>Buyer decision brief</span>
          <strong>{snapshot.decisionBrief.buyerQuestion}</strong>
          <p>{snapshot.decisionBrief.answer}</p>
        </div>
        <div className="hero-buyer-decision-badge" aria-label="Recommended buyer decision">
          <span>{snapshot.decisionBrief.decision}</span>
          <strong>{decisionLabel(snapshot.decisionBrief.decision)}</strong>
        </div>
      </section>

      <label className="hero-workflow-intake-note">
        <span>Workflow note</span>
        <textarea
          value={rawNote}
          onChange={(event) => {
            setRawNote(event.target.value);
            setAppliedHandoff(null);
          }}
        />
      </label>

      <div className="hero-workflow-intake-actions">
        <button type="button" onClick={analyzeNote} disabled={!canAnalyze}>
          <Search size={14} />
          Analyze
        </button>
        <button className={cx(applyState === "applied" && "is-confirmed", applyState === "failed" && "is-risk")} type="button" onClick={applySnapshot} disabled={!canApply}>
          {applyState === "applied" ? <BadgeCheck size={14} /> : applyState === "failed" ? <AlertTriangle size={14} /> : <GitBranch size={14} />}
          {actionLabel}
        </button>
        <button className={cx(copyState === "copied" && "is-confirmed", copyState === "failed" && "is-risk")} type="button" onClick={copyBrief}>
          {copyState === "copied" ? <BadgeCheck size={14} /> : copyState === "failed" ? <AlertTriangle size={14} /> : <ClipboardCheck size={14} />}
          {copyLabel}
        </button>
        <button className={cx(insertState === "inserted" && "is-confirmed")} type="button" onClick={insertRepairLines} disabled={!canInsertRepairLines}>
          <GitBranch size={14} />
          {insertLabel}
        </button>
        <a href={intakeHref}>
          <Crosshair size={14} />
          Full intake
        </a>
      </div>

      <details className="hero-workflow-intake-details hero-workflow-brief-details">
        <summary>
          <span>判断の根拠と成果物を表示</span>
          <strong>バリュー経路・証拠・アーティファクト・適用プレビュー</strong>
        </summary>
        <div className="hero-workflow-brief-details-body">
      <div className={cx("hero-workflow-value-path", snapshot.sendGate.status)} aria-label="Buyer value path">
        <article className="hero-workflow-value-path-main">
          <span>Buyer value path</span>
          <strong>{snapshot.sendGate.valueEstimate.valueLine}</strong>
          <p>
            {snapshot.sendGate.valueEstimate.budgetLine}. {snapshot.sendGate.valueEstimate.proofLine}.
          </p>
        </article>
        <article className={cx("hero-workflow-next-task", primaryGateAction?.status)}>
          <span>{snapshot.sendGate.status === "ready" ? "Ready action" : "Next proof task"}</span>
          <strong>{primaryGateAction?.label ?? snapshot.readiness.headline}</strong>
          <p>{outputSummary}</p>
        </article>
      </div>
        <div className="hero-buyer-decision-evidence" aria-label="Decision evidence">
          {snapshot.decisionBrief.evidence.map((item) => (
            <article key={item.id} className={item.status}>
              <span>{item.label}</span>
              <strong>{item.answer}</strong>
              <small>{item.source}</small>
            </article>
          ))}
        </div>
        <div className="hero-buyer-decision-footer">
          <div>
            <span>Next ask</span>
            <strong>{snapshot.decisionBrief.nextAsk}</strong>
          </div>
          <div>
            <span>Redline</span>
            <strong>{snapshot.decisionBrief.redline}</strong>
          </div>
        </div>
      <div className="hero-workflow-artifact-chain" aria-label="Generated source-to-artifact chain">
        {snapshot.artifactChain.map((item) => (
          <article key={item.id} className={item.status}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.source}</p>
            <small>{item.action}</small>
          </article>
        ))}
      </div>
      <div className={cx("hero-workflow-apply-preview", applyPreview.status)} aria-label="Apply outcome preview">
        <div className="hero-workflow-apply-preview-copy">
          <span>Apply outcome</span>
          <strong>{applyPreview.headline}</strong>
          <p>{applyPreview.summary}</p>
        </div>
        <dl>
          <div>
            <dt>Workspace update</dt>
            <dd>{applyPreview.signalLine}</dd>
          </div>
          <div>
            <dt>Proof readiness</dt>
            <dd>{applyPreview.proofLine}</dd>
          </div>
          <div>
            <dt>Next move</dt>
            <dd>{applyPreview.nextAction}</dd>
          </div>
        </dl>
      </div>
        </div>
      </details>

      {appliedHandoff && (
        <div className={cx("hero-workflow-applied-handoff", appliedHandoff.status)} aria-live="polite">
          <div className="hero-workflow-applied-handoff-head">
            <span>Applied handoff</span>
            <strong>{appliedHandoff.headline}</strong>
            <p>{appliedHandoff.summary}</p>
          </div>
          <div className="hero-workflow-applied-output-links" aria-label="Applied buyer output links">
            <a href={buyerDecisionCockpitHref}>
              <ClipboardCheck size={14} />
              <span>Open buyer cockpit</span>
            </a>
            <a href={launchEvidenceHref}>
              <ExternalLink size={14} />
              <span>Launch evidence</span>
            </a>
            <a href={buyerEvidenceBoardHref}>
              <ShieldCheck size={14} />
              <span>Evidence board</span>
            </a>
          </div>
          <div className="hero-workflow-applied-slots" aria-label="Applied public proof slots">
            {appliedHandoff.proofSlots.map((slot) => (
              <article key={slot.id} className={slot.status}>
                <span>{slot.status}</span>
                <strong>{slot.label}</strong>
                <p>{slot.value}</p>
              </article>
            ))}
          </div>
          <div className="hero-workflow-applied-next">
            <span>Next proof move</span>
            <strong>{appliedHandoff.nextAction}</strong>
            <a href="#homepage-proof-entry">Open proof workbench</a>
          </div>
        </div>
      )}

      <details className="hero-workflow-intake-details">
        <summary>
          <span>Inspect extraction and repair lines</span>
          <strong>{detailSummary}</strong>
        </summary>

        <div className="hero-workflow-intake-preview" aria-label="Workflow extraction preview">
          {snapshot.focusRows.map((row) => (
            <article key={row.id} className={row.status}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </article>
          ))}
        </div>

        <div className={cx("hero-workflow-external-gate", snapshot.sendGate.status)} aria-label="External send gate">
          <div className="hero-workflow-external-gate-head">
            <div>
              <span>External send gate</span>
              <strong>{snapshot.sendGate.headline}</strong>
              <p>{snapshot.sendGate.summary}</p>
            </div>
          </div>
          <dl className="hero-workflow-external-gate-metrics">
            <div>
              <dt>Value</dt>
              <dd>{snapshot.sendGate.valueEstimate.valueLine}</dd>
            </div>
            <div>
              <dt>Pilot cap</dt>
              <dd>{snapshot.sendGate.valueEstimate.budgetLine}</dd>
            </div>
            <div>
              <dt>Proof</dt>
              <dd>{snapshot.sendGate.valueEstimate.proofLine}</dd>
            </div>
            <div>
              <dt>Proof quality</dt>
              <dd>{snapshot.sendGate.authenticity.summary}</dd>
            </div>
          </dl>
          <div className="hero-workflow-external-gate-actions" aria-label="External send repair actions">
            {snapshot.sendGate.actions.map((action) => (
              <div key={action.id} className={action.status}>
                <span>{action.status}</span>
                <strong>{action.label}</strong>
                <p>{action.action}</p>
              </div>
            ))}
          </div>
          {snapshot.sendGate.repairLines.length > 0 && (
            <div className="hero-workflow-repair-lines" aria-label="Paste-ready repair lines">
              <span>Paste-ready repair lines</span>
              {snapshot.sendGate.repairLines.map((item) => (
                <article key={item.id} className={item.status}>
                  <strong>{item.label}</strong>
                  <code>{item.line}</code>
                </article>
              ))}
            </div>
          )}
        </div>
      </details>

      <div className="hero-workflow-intake-signals" aria-label="Detected workflow signals">
        <Sparkles size={13} />
        {snapshot.draft.detectedSignals.slice(0, 5).map((signal) => (
          <span key={signal}>{signal}</span>
        ))}
        {snapshot.draft.detectedSignals.length > 5 && <span>{snapshot.draft.detectedSignals.length - 5} more</span>}
      </div>
    </section>
  );
}
