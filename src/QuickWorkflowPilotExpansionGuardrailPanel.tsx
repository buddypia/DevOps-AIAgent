import { Download, FileText, Mail, ShieldCheck, Table2, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { QuickWorkflowPilotDecisionBrief } from "./quickWorkflowPilotDecisionBrief";
import {
  defaultQuickWorkflowPilotExpansionDraftState,
  normalizeQuickWorkflowPilotExpansionDraftState,
  type QuickWorkflowPilotExpansionDraftState
} from "./quickWorkflowPilotDraft";
import {
  buildQuickWorkflowPilotExpansionGuardrail,
  buildQuickWorkflowPilotExpansionRecheckEvidence,
  type QuickWorkflowPilotExpansionGuardrail,
  type QuickWorkflowPilotExpansionRecheckEvidenceInput
} from "./quickWorkflowPilotExpansionGuardrail";
import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type QuickWorkflowPilotExpansionGuardrailPanelProps = {
  brief: QuickWorkflowPilotDecisionBrief;
  log: QuickWorkflowPilotRunLog;
  contract: QuickWorkflowValueAcceptanceContract;
  draft?: QuickWorkflowPilotExpansionDraftState;
  onDraftChange?: (draft: QuickWorkflowPilotExpansionDraftState) => void;
  onGuardrailChange?: (guardrail: QuickWorkflowPilotExpansionGuardrail) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowPilotExpansionGuardrailPanel({
  brief,
  log,
  contract,
  draft,
  onDraftChange,
  onGuardrailChange
}: QuickWorkflowPilotExpansionGuardrailPanelProps) {
  const [localDraft, setLocalDraft] = useState(() => defaultQuickWorkflowPilotExpansionDraftState());
  const currentDraft = draft ?? localDraft;
  function updateDraft(patch: Partial<QuickWorkflowPilotExpansionDraftState>) {
    const nextDraft = normalizeQuickWorkflowPilotExpansionDraftState({
      ...currentDraft,
      ...patch
    });
    if (draft === undefined) setLocalDraft(nextDraft);
    onDraftChange?.(nextDraft);
  }
  const structuredEvidenceText = useMemo(
    () =>
      buildQuickWorkflowPilotExpansionRecheckEvidence({
        measuredMonthlyValueYen: Number(currentDraft.measuredValueText.replace(/,/g, "")),
        ownerName: currentDraft.ownerName,
        ownerDecision: currentDraft.ownerDecision,
        receiptChainAttached: currentDraft.receiptChainAttached,
        nextWindow: currentDraft.nextWindow,
        note: "",
        decisionBriefReceiptId: brief.receipt.receiptId
      }),
    [brief.receipt.receiptId, currentDraft.measuredValueText, currentDraft.nextWindow, currentDraft.ownerDecision, currentDraft.ownerName, currentDraft.receiptChainAttached]
  );
  const recheckEvidenceText = [structuredEvidenceText, currentDraft.manualEvidenceText.trim()].filter(Boolean).join(" ");
  const guardrail = useMemo(
    () => buildQuickWorkflowPilotExpansionGuardrail({ brief, log, contract, recheckEvidenceText }),
    [brief, contract, log, recheckEvidenceText]
  );
  useEffect(() => {
    onGuardrailChange?.(guardrail);
  }, [guardrail, onGuardrailChange]);
  const rulerStyle = {
    "--measured-position": `${guardrail.valueRuler.measuredPositionPercent}%`,
    "--stop-position": `${guardrail.valueRuler.stopPositionPercent}%`,
    "--floor-position": `${guardrail.valueRuler.floorPositionPercent}%`
  } as CSSProperties;

  return (
    <div className={cx("quick-workflow-pilot-expansion-guardrail", guardrail.status)} aria-label="Expansion guardrail ledger">
      <div className="quick-workflow-pilot-expansion-main">
        <span>
          <TrendingUp size={13} />
          Expansion guardrail ledger
        </span>
        <strong>{guardrail.headline}</strong>
        <p>{guardrail.summary}</p>
        <div className="quick-workflow-pilot-expansion-builder" aria-label="Structured value recheck builder">
          <label>
            <span>Actual monthly value</span>
            <input
              value={currentDraft.measuredValueText}
              onChange={(event) => updateDraft({ measuredValueText: event.currentTarget.value })}
              inputMode="numeric"
              placeholder={`${contract.valueFloorYen}`}
            />
          </label>
          <label>
            <span>Decision owner</span>
            <input value={currentDraft.ownerName} onChange={(event) => updateDraft({ ownerName: event.currentTarget.value })} placeholder="Finance owner" />
          </label>
          <label>
            <span>Owner decision</span>
            <select
              value={currentDraft.ownerDecision}
              onChange={(event) => updateDraft({ ownerDecision: event.currentTarget.value as QuickWorkflowPilotExpansionRecheckEvidenceInput["ownerDecision"] })}
            >
              <option value="not-recorded">Not recorded</option>
              <option value="approved">Approved</option>
              <option value="hold">Hold</option>
            </select>
          </label>
          <label>
            <span>Next window</span>
            <input
              value={currentDraft.nextWindow}
              onChange={(event) => updateDraft({ nextWindow: event.currentTarget.value })}
              placeholder="Next operating window, renewal date, or rollout scope"
            />
          </label>
          <label className="is-check">
            <input type="checkbox" checked={currentDraft.receiptChainAttached} onChange={(event) => updateDraft({ receiptChainAttached: event.currentTarget.checked })} />
            <span>Verifier results attached</span>
          </label>
        </div>
        <div className="quick-workflow-pilot-expansion-generated" aria-label="Generated value recheck evidence">
          <span>Generated evidence</span>
          <strong>{structuredEvidenceText || "Fill the recheck fields to generate buyer-ready evidence."}</strong>
        </div>
        <div className={cx("quick-workflow-pilot-expansion-ruler", guardrail.valueRuler.status)} style={rulerStyle} aria-label="Expansion value ruler">
          <div className="quick-workflow-pilot-expansion-ruler-head">
            <span>Expansion value ruler</span>
            <strong>{guardrail.valueRuler.label}</strong>
            <small>{guardrail.valueRuler.detail}</small>
          </div>
          <div className="quick-workflow-pilot-expansion-ruler-track" aria-hidden="true">
            <i className="stop" />
            <i className="floor" />
            <b />
          </div>
          <div className="quick-workflow-pilot-expansion-ruler-labels">
            <span>Stop ¥{guardrail.stopLossYen.toLocaleString("ja-JP")}</span>
            <span>Actual {guardrail.measuredMonthlyValueYen > 0 ? `¥${guardrail.measuredMonthlyValueYen.toLocaleString("ja-JP")}` : "not recorded"}</span>
            <span>Floor ¥{guardrail.valueFloorYen.toLocaleString("ja-JP")}</span>
          </div>
        </div>
        <label>
          <span>Additional value recheck evidence</span>
          <textarea
            value={currentDraft.manualEvidenceText}
            onChange={(event) => updateDraft({ manualEvidenceText: event.currentTarget.value })}
            placeholder="Optional: add source notes, meeting decisions, or buyer-specific acceptance language."
            rows={4}
          />
        </label>
        <div className="quick-workflow-pilot-expansion-actions" aria-label="Expansion guardrail actions">
          <a href={guardrail.mailtoHref}>
            <Mail size={14} />
            Send guardrail
          </a>
          <a href={guardrail.exportHref} download="quick-workflow-pilot-expansion-guardrail.md">
            <Download size={14} />
            Export ledger
          </a>
          <a href={guardrail.checkCsvHref} download="quick-workflow-pilot-expansion-guardrail.csv">
            <Table2 size={14} />
            Check CSV
          </a>
          <a href={guardrail.receipt.payloadHref} download="quick-workflow-pilot-expansion-guardrail-receipt.json">
            <FileText size={14} />
            Expansion receipt
          </a>
          <a href={guardrail.receipt.verificationRequestHref} download="quick-workflow-pilot-expansion-guardrail-verifier-request.json">
            <FileText size={14} />
            Verifier request
          </a>
          <a href={guardrail.receipt.verifierHref}>
            <ShieldCheck size={14} />
            Verify expansion
          </a>
        </div>
      </div>
      <aside className="quick-workflow-pilot-expansion-verdict" aria-label="Expansion guardrail verdict">
        <span>{guardrail.decision}</span>
        <strong>{guardrail.nextOwner}</strong>
        <small>{guardrail.nextAction}</small>
      </aside>
      <div className="quick-workflow-pilot-expansion-metrics" aria-label="Expansion guardrail metrics">
        <article>
          <span>Measured value</span>
          <strong>{guardrail.measuredMonthlyValueYen > 0 ? `¥${guardrail.measuredMonthlyValueYen.toLocaleString("ja-JP")}/month` : "Not recorded"}</strong>
        </article>
        <article>
          <span>Accepted floor</span>
          <strong>¥{guardrail.valueFloorYen.toLocaleString("ja-JP")}/month</strong>
        </article>
        <article>
          <span>Stop rule</span>
          <strong>¥{guardrail.stopLossYen.toLocaleString("ja-JP")}/month</strong>
        </article>
      </div>
      <div className="quick-workflow-pilot-expansion-receipt" aria-label="Expansion guardrail receipt">
        <span>Expansion receipt</span>
        <strong>{guardrail.receipt.receiptId}</strong>
        <small>
          {guardrail.receipt.checksumAlgorithm}:{guardrail.receipt.checksum}
        </small>
      </div>
      <div className="quick-workflow-pilot-expansion-checks" aria-label="Expansion guardrail checks">
        {guardrail.checks.map((check) => (
          <article key={check.id} className={check.status}>
            <span>{check.label}</span>
            <strong>{check.owner}</strong>
            <small>{check.evidence}</small>
            <em>{check.action}</em>
          </article>
        ))}
      </div>
    </div>
  );
}
