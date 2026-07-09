import { AlertTriangle, CalendarCheck, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildBuyerDecisionAgendaSnapshot,
  type BuyerDecisionAgendaBuildInput,
  type BuyerDecisionAgendaStatus
} from "./buyerDecisionAgenda.js";
import { buildBuyerDecisionFollowUpLedger } from "./buyerDecisionFollowUp.js";
import { downloadTextFile } from "./downloadArtifact";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: BuyerDecisionAgendaStatus) {
  if (status === "ready") return <ShieldCheck size={14} />;
  if (status === "attention") return <AlertTriangle size={14} />;
  return <Crosshair size={14} />;
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

type BuyerDecisionFollowUpPanelProps = BuyerDecisionAgendaBuildInput & {
  publicLedgerHref?: string;
  onCopyText: (text: string) => Promise<boolean>;
};

export default function BuyerDecisionFollowUpPanel({
  proofChain,
  publicDecisionPath,
  pilotContract,
  trustSnapshot,
  commercialOffer,
  publicLedgerHref,
  onCopyText
}: BuyerDecisionFollowUpPanelProps) {
  const ledger = useMemo(() => {
    const agenda = buildBuyerDecisionAgendaSnapshot({
      proofChain,
      publicDecisionPath,
      pilotContract,
      trustSnapshot,
      commercialOffer
    });
    return buildBuyerDecisionFollowUpLedger(agenda);
  }, [commercialOffer, pilotContract, proofChain, publicDecisionPath, trustSnapshot]);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied follow-up" : copyStatus === "failed" ? "Copy failed" : "Copy follow-up";
  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyLedger = async () => {
    const copied = await onCopyText(ledger.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-decision-follow-up", `is-${ledger.status}`)} aria-label="Buyer decision follow-up ledger">
      <div className="buyer-decision-follow-up-main">
        <span>Decision follow-up ledger</span>
        <strong>{ledger.headline}</strong>
        <p>{ledger.summary}</p>
        <div className="buyer-decision-follow-up-actions" aria-label="Buyer decision follow-up actions">
          <a className="buyer-decision-follow-up-primary" href={ledger.firstAction.href} {...routeActionAttrs(ledger.firstAction)}>
            {ledger.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {ledger.firstAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyLedger}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <button className="icon-link" type="button" data-download="buyer-decision-follow-up.md" data-download-filename="buyer-decision-follow-up.md" onClick={() => downloadTextFile("buyer-decision-follow-up.md", ledger.exportMarkdown)}>
            <Download size={14} />
            Export ledger
          </button>
          <button className="icon-link" type="button" data-download="buyer-decision-follow-up.csv" data-download-filename="buyer-decision-follow-up.csv" onClick={() => downloadTextFile("buyer-decision-follow-up.csv", ledger.csv, "text/csv;charset=utf-8")}>
            <FileText size={14} />
            Export CSV
          </button>
          {publicLedgerHref ? (
            <a className="icon-link" href={publicLedgerHref} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              Public ledger
            </a>
          ) : null}
        </div>
      </div>
      <aside className="buyer-decision-follow-up-state" aria-label="Follow-up state">
        <span>{ledger.mode}</span>
        <strong>{ledger.readyCount}/{ledger.taskTotal}</strong>
        <small>{ledger.meetingDecision} · first due: {ledger.firstDueLabel}</small>
      </aside>
      <div className="buyer-decision-follow-up-tasks" aria-label="Follow-up tasks">
        {ledger.tasks.map((task) => (
          <a key={task.id} className={task.status} href={task.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(task.href) })}>
            <span>
              {statusIcon(task.status)}
              {task.label}
            </span>
            <strong>{task.owner}</strong>
            <small>
              <CalendarCheck size={13} />
              {task.dueLabel}
            </small>
            <p>{task.nextStep}</p>
            <em>{task.closeCondition}</em>
          </a>
        ))}
      </div>
      <div className="buyer-decision-follow-up-rules" aria-label="Follow-up escalation rules">
        <span>Escalation rules</span>
        <ul>
          {ledger.escalationRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
