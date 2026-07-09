import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, FileText } from "lucide-react";
import type { BuyerProofFocusPlan } from "./App";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: BuyerProofFocusPlan["primaryAction"]) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function FocusStatusIcon({ status }: { status: BuyerProofFocusPlan["status"] }) {
  if (status === "ready") return <BadgeCheck size={16} />;
  if (status === "attention") return <AlertTriangle size={16} />;
  return <Crosshair size={16} />;
}

export default function BuyerProofFocusPlanPanel({ plan, onCopyText }: { plan: BuyerProofFocusPlan; onCopyText: (text: string) => Promise<boolean> }) {
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(plan.exportMarkdown)}`;

  return (
    <section className={cx("buyer-proof-focus-plan", plan.status)} aria-label="Buyer proof focus plan">
      <div className="buyer-proof-focus-main">
        <span>Focused pilot path</span>
        <strong>{plan.headline}</strong>
        <p>{plan.buyerPromise}</p>
        <div className="buyer-proof-focus-actions" aria-label="Focused pilot path actions">
          <a className="buyer-proof-focus-primary" href={plan.primaryAction.href} {...routeActionAttrs(plan.primaryAction)}>
            <Crosshair size={15} />
            {plan.primaryAction.label}
          </a>
          <button className="icon-link" type="button" onClick={() => void onCopyText(plan.copyText)}>
            <ClipboardCheck size={14} />
            Copy plan
          </button>
          <a className="icon-link" href={exportHref} download="buyer-proof-focus-plan.md">
            <Download size={14} />
            Export plan
          </a>
          <a className="icon-link" href={plan.taskCsvHref} download="buyer-proof-focus-tasks.csv">
            <FileText size={14} />
            Export tasks
          </a>
        </div>
      </div>
      <div className="buyer-proof-focus-stages">
        {plan.stages.map((stage) => (
          <a key={stage.id} className={stage.status} href={stage.action.href} {...routeActionAttrs(stage.action)}>
            <span>
              <FocusStatusIcon status={stage.status} />
              {stage.label}
            </span>
            <strong>{stage.metric}</strong>
            <p>{stage.headline}</p>
            <small>{stage.detail}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
