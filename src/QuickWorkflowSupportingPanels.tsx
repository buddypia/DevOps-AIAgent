import { ClipboardCheck, Download, ExternalLink, Send, ShieldCheck } from "lucide-react";
import type { QuickA2ATrialStarter, QuickWorkflowLiveBuyerCase } from "./QuickWorkflowIntakePanel";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function QuickWorkflowLiveBuyerCasePanel({ liveBuyerCase }: { liveBuyerCase: QuickWorkflowLiveBuyerCase }) {
  return (
    <div className={cx("quick-workflow-live-case", liveBuyerCase.status)} aria-label="Live buyer case">
      <div className="quick-workflow-live-case-main">
        <span>
          <ClipboardCheck size={13} />
          Live buyer case
        </span>
        <strong>{liveBuyerCase.headline}</strong>
        <p>{liveBuyerCase.summary}</p>
      </div>
      <div className="quick-workflow-live-case-metrics" aria-label="Live buyer case metrics">
        {liveBuyerCase.items.map((item) => (
          <article key={item.id} className={item.status}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

export function QuickA2ATrialStarterPanel({ a2aTrialStarter }: { a2aTrialStarter: QuickA2ATrialStarter }) {
  return (
    <div className={cx("quick-a2a-trial-starter", a2aTrialStarter.status)} aria-label="A2A trial starter">
      <div className="quick-a2a-trial-starter-main">
        <span>
          <Send size={13} />
          A2A trial starter
        </span>
        <strong>{a2aTrialStarter.headline}</strong>
        <p>{a2aTrialStarter.summary}</p>
        <div className="quick-a2a-trial-actions" aria-label="A2A trial starter actions">
          <a href={a2aTrialStarter.payloadHref} download="quick-a2a-trial-payload.json">
            <Download size={14} />
            Payload
          </a>
          <a href={a2aTrialStarter.receiptHref} download={`${a2aTrialStarter.receipt.receiptId}.json`}>
            <ShieldCheck size={14} />
            Receipt
          </a>
          <a href={a2aTrialStarter.recommended.href}>
            <ExternalLink size={14} />
            Agent Card
          </a>
        </div>
      </div>
      <div className="quick-a2a-trial-lead" aria-label="Recommended A2A trial">
        <span>{a2aTrialStarter.trialMethod}</span>
        <strong>{a2aTrialStarter.recommended.name}</strong>
        <p>{a2aTrialStarter.recommended.skillId}</p>
        <small>
          {a2aTrialStarter.receipt.checksumAlgorithm}:{a2aTrialStarter.receipt.checksum}
        </small>
      </div>
      <div className="quick-a2a-trial-candidates" aria-label="A2A trial candidates">
        {a2aTrialStarter.candidates.map((candidate) => (
          <article key={candidate.agentId}>
            <span>{candidate.handle}</span>
            <strong>{candidate.name}</strong>
            <p>{candidate.reason}</p>
            <small>{candidate.skillLabel}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
