import { ClipboardCheck, Download, FileText, Mail, ShieldCheck, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { QuickWorkflowPilotKickoffPack } from "./quickWorkflowPilotKickoffPack";
import QuickWorkflowPilotDecisionBriefPanel from "./QuickWorkflowPilotDecisionBriefPanel";
import type { QuickWorkflowPilotExpansionDraftState } from "./quickWorkflowPilotDraft";
import type { QuickWorkflowPilotDecisionBrief } from "./quickWorkflowPilotDecisionBrief";
import type { QuickWorkflowPilotExpansionGuardrail } from "./quickWorkflowPilotExpansionGuardrail";
import { buildQuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type QuickWorkflowPilotRunLogPanelProps = {
  pack: QuickWorkflowPilotKickoffPack;
  contract?: QuickWorkflowValueAcceptanceContract;
  evidenceText?: string;
  onEvidenceTextChange?: (evidenceText: string) => void;
  expansionDraft?: QuickWorkflowPilotExpansionDraftState;
  onExpansionDraftChange?: (draft: QuickWorkflowPilotExpansionDraftState) => void;
  onLogChange?: (log: QuickWorkflowPilotRunLog) => void;
  onDecisionBriefChange?: (brief: QuickWorkflowPilotDecisionBrief) => void;
  onExpansionGuardrailChange?: (guardrail: QuickWorkflowPilotExpansionGuardrail) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowPilotRunLogPanel({
  pack,
  contract,
  evidenceText,
  onEvidenceTextChange,
  expansionDraft,
  onExpansionDraftChange,
  onLogChange,
  onDecisionBriefChange,
  onExpansionGuardrailChange
}: QuickWorkflowPilotRunLogPanelProps) {
  const [localEvidenceText, setLocalEvidenceText] = useState("");
  const currentEvidenceText = evidenceText ?? localEvidenceText;
  const log = useMemo(() => buildQuickWorkflowPilotRunLog({ pack, evidenceText: currentEvidenceText }), [pack, currentEvidenceText]);

  function updateEvidenceText(nextEvidenceText: string) {
    if (evidenceText === undefined) setLocalEvidenceText(nextEvidenceText);
    onEvidenceTextChange?.(nextEvidenceText);
  }

  useEffect(() => {
    onLogChange?.(log);
  }, [log, onLogChange]);

  return (
    <div className={cx("quick-workflow-pilot-run-log", log.status)} aria-label="Pilot run log">
      <div className="quick-workflow-pilot-run-main">
        <span>
          <ClipboardCheck size={13} />
          Pilot run log
        </span>
        <strong>{log.headline}</strong>
        <p>{log.summary}</p>
        <label>
          <span>Paste live run evidence</span>
          <textarea
            value={currentEvidenceText}
            onChange={(event) => updateEvidenceText(event.currentTarget.value)}
            placeholder="Example: Day 0 kickoff opened with the buyer owner, Day 3 live proof verification passed, Day 7 accepted tasks were recorded, Day 14 review chose continue, Day 30 value floor and stop-loss were checked."
            rows={5}
          />
        </label>
        <div className="quick-workflow-pilot-run-actions" aria-label="Pilot run log actions">
          <a href={log.mailtoHref}>
            <Mail size={14} />
            Send closeout
          </a>
          <a href={log.exportHref} download="quick-workflow-pilot-run-log.md">
            <Download size={14} />
            Export log
          </a>
          <a href={log.taskCsvHref} download="quick-workflow-pilot-run-log.csv">
            <Table2 size={14} />
            Task CSV
          </a>
          <a href={log.receipt.payloadHref} download={`${log.receipt.receiptId}.json`}>
            <FileText size={14} />
            Run receipt
          </a>
          <a href={log.receipt.verificationRequestHref} download={`${log.receipt.receiptId}-verify.json`}>
            <FileText size={14} />
            Verifier request
          </a>
          <a href={log.receipt.verifierHref}>
            <ShieldCheck size={14} />
            Verify run
          </a>
        </div>
      </div>
      <aside className="quick-workflow-pilot-run-score" aria-label="Pilot run log score">
        <span>{log.status}</span>
        <strong>{log.evidenceScore}/100</strong>
        <small>{log.nextOwner}</small>
        <small>{log.nextAction}</small>
      </aside>
      <div className="quick-workflow-pilot-run-receipt" aria-label="Pilot run log receipt">
        <span>Run receipt</span>
        <strong>{log.receipt.receiptId}</strong>
        <small>
          {log.receipt.checksumAlgorithm}:{log.receipt.checksum}
        </small>
      </div>
      <div className="quick-workflow-pilot-run-tasks" aria-label="Pilot run log evidence tasks">
        {log.tasks.map((task) => (
          <article key={task.id} className={task.status}>
            <span>
              {task.dayLabel} / {task.dueDate || "No date"}
            </span>
            <strong>{task.label}</strong>
            <small>{task.nextAction}</small>
            <em>
              Missing: {task.missingSignals.join(", ") || "none"}
            </em>
          </article>
        ))}
      </div>
      {contract && (
        <QuickWorkflowPilotDecisionBriefPanel
          log={log}
          contract={contract}
          expansionDraft={expansionDraft}
          onExpansionDraftChange={onExpansionDraftChange}
          onDecisionBriefChange={onDecisionBriefChange}
          onExpansionGuardrailChange={onExpansionGuardrailChange}
        />
      )}
    </div>
  );
}
