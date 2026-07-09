import { Copy, Download, FileText, Send } from "lucide-react";
import type { QuickBuyerValidationAnswerRecord, QuickProofRepairPlan } from "./QuickWorkflowIntakePanel";
import { buildQuickBuyerValidationDecisionHandoff } from "./quickBuyerValidationDecisionHandoff";

type QuickBuyerValidationDecisionHandoffPanelProps = {
  validationAnswerRecord: QuickBuyerValidationAnswerRecord;
  proofRepairPlan: QuickProofRepairPlan;
  reviewKitHref: string;
  acceptancePathHref: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

export default function QuickBuyerValidationDecisionHandoffPanel({
  validationAnswerRecord,
  proofRepairPlan,
  reviewKitHref,
  acceptancePathHref
}: QuickBuyerValidationDecisionHandoffPanelProps) {
  const handoff = buildQuickBuyerValidationDecisionHandoff({
    record: validationAnswerRecord,
    proofRepairPlan,
    reviewKitHref,
    acceptancePathHref
  });

  return (
    <div className={cx("quick-buyer-validation-handoff", handoff.status)} aria-label="Buyer validation decision handoff">
      <div className="quick-buyer-validation-handoff-head">
        <div>
          <span>
            <FileText size={14} />
            Decision handoff
          </span>
          <strong>{handoff.headline}</strong>
          <p>{handoff.summary}</p>
        </div>
        <div className="quick-buyer-validation-handoff-actions" aria-label="Validation decision handoff actions">
          <button type="button" onClick={() => copyText(handoff.copyText)}>
            <Copy size={14} />
            Copy packet
          </button>
          <a href={handoff.exportHref} download="quick-buyer-validation-decision-handoff.md">
            <Download size={14} />
            Export
          </a>
          <a href={handoff.mailtoHref}>
            <Send size={14} />
            Draft mail
          </a>
        </div>
      </div>
      <div className="quick-buyer-validation-handoff-steps">
        {handoff.steps.map((step) => (
          <a key={step.id} className={step.status} href={step.href} download={step.href.startsWith("data:") ? `quick-validation-${step.id}.md` : undefined}>
            <span>{step.label}</span>
            <strong>{step.owner}</strong>
            <p>{step.action}</p>
            <small>{step.evidence}</small>
          </a>
        ))}
      </div>
      <details className="quick-buyer-validation-handoff-brief">
        <summary>Packet text</summary>
        <pre>{handoff.copyText}</pre>
      </details>
    </div>
  );
}
