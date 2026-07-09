import { Download, FileText, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo } from "react";
import type { QuickWorkflowPilotExpansionDraftState } from "./quickWorkflowPilotDraft";
import { buildQuickWorkflowPilotDecisionBrief, type QuickWorkflowPilotDecisionBrief } from "./quickWorkflowPilotDecisionBrief";
import QuickWorkflowPilotExpansionGuardrailPanel from "./QuickWorkflowPilotExpansionGuardrailPanel";
import type { QuickWorkflowPilotExpansionGuardrail } from "./quickWorkflowPilotExpansionGuardrail";
import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type QuickWorkflowPilotDecisionBriefPanelProps = {
  log: QuickWorkflowPilotRunLog;
  contract: QuickWorkflowValueAcceptanceContract;
  expansionDraft?: QuickWorkflowPilotExpansionDraftState;
  onExpansionDraftChange?: (draft: QuickWorkflowPilotExpansionDraftState) => void;
  onDecisionBriefChange?: (brief: QuickWorkflowPilotDecisionBrief) => void;
  onExpansionGuardrailChange?: (guardrail: QuickWorkflowPilotExpansionGuardrail) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowPilotDecisionBriefPanel({
  log,
  contract,
  expansionDraft,
  onExpansionDraftChange,
  onDecisionBriefChange,
  onExpansionGuardrailChange
}: QuickWorkflowPilotDecisionBriefPanelProps) {
  const brief = useMemo(() => buildQuickWorkflowPilotDecisionBrief({ log, contract }), [contract, log]);

  useEffect(() => {
    onDecisionBriefChange?.(brief);
  }, [brief, onDecisionBriefChange]);

  return (
    <div className={cx("quick-workflow-pilot-decision-brief", brief.status)} aria-label="Pilot decision brief">
      <div className="quick-workflow-pilot-decision-main">
        <span>
          <ShieldCheck size={13} />
          Pilot decision brief
        </span>
        <strong>{brief.headline}</strong>
        <p>{brief.summary}</p>
        <small>{brief.decisionAsk}</small>
        <div className="quick-workflow-pilot-decision-actions" aria-label="Pilot decision brief actions">
          <a href={brief.mailtoHref}>
            <Mail size={14} />
            Send decision
          </a>
          <a href={brief.exportHref} download="quick-workflow-pilot-decision-brief.md">
            <Download size={14} />
            Export brief
          </a>
          <a href={brief.receipt.payloadHref} download="quick-workflow-pilot-decision-brief-receipt.json">
            <FileText size={14} />
            Decision receipt
          </a>
          <a href={brief.receipt.verificationRequestHref} download="quick-workflow-pilot-decision-brief-verifier-request.json">
            <FileText size={14} />
            Verifier request
          </a>
          <a href={brief.receipt.verifierHref}>
            <ShieldCheck size={14} />
            Verify decision
          </a>
          <a href={brief.runVerifierHref}>
            <ShieldCheck size={14} />
            Verify run
          </a>
          <a href={brief.contractVerifierHref}>
            <ShieldCheck size={14} />
            Verify contract
          </a>
        </div>
      </div>
      <aside className="quick-workflow-pilot-decision-verdict" aria-label="Pilot decision verdict">
        <span>{brief.decision}</span>
        <strong>{brief.nextOwner}</strong>
        <small>{brief.nextAction}</small>
      </aside>
      <div className="quick-workflow-pilot-decision-metrics" aria-label="Pilot decision guardrails">
        <article>
          <span>Value guardrail</span>
          <strong>{brief.valueLine}</strong>
        </article>
        <article>
          <span>Risk guardrail</span>
          <strong>{brief.riskLine}</strong>
        </article>
      </div>
      <div className="quick-workflow-pilot-decision-task-list" aria-label="Pilot decision actions">
        {brief.actions.map((action) => (
          <article key={action.id} className={action.status}>
            <span>{action.label}</span>
            <strong>{action.owner}</strong>
            <small>{action.action}</small>
            <em>{action.acceptance}</em>
          </article>
        ))}
      </div>
      <QuickWorkflowPilotExpansionGuardrailPanel
        brief={brief}
        log={log}
        contract={contract}
        draft={expansionDraft}
        onDraftChange={onExpansionDraftChange}
        onGuardrailChange={onExpansionGuardrailChange}
      />
    </div>
  );
}
