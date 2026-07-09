import { ClipboardCheck, Crosshair, Download, ExternalLink, Scale, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildBuyerDecisionAgendaSnapshot,
  type BuyerDecisionAgendaBuildInput,
  type BuyerDecisionAgendaStatus
} from "./buyerDecisionAgenda.js";

function iconFor(status: BuyerDecisionAgendaStatus) {
  if (status === "ready") return <ShieldCheck size={14} />;
  if (status === "attention") return <Scale size={14} />;
  return <Crosshair size={14} />;
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

type BuyerDecisionAgendaPanelProps = BuyerDecisionAgendaBuildInput & {
  onCopyText: (text: string) => Promise<boolean>;
};

export default function BuyerDecisionAgendaPanel({
  proofChain,
  publicDecisionPath,
  pilotContract,
  trustSnapshot,
  commercialOffer,
  onCopyText
}: BuyerDecisionAgendaPanelProps) {
  const agenda = useMemo(
    () =>
      buildBuyerDecisionAgendaSnapshot({
        proofChain,
        publicDecisionPath,
        pilotContract,
        trustSnapshot,
        commercialOffer
      }),
    [commercialOffer, pilotContract, proofChain, publicDecisionPath, trustSnapshot]
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied agenda" : copyStatus === "failed" ? "Copy failed" : "Copy agenda";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(agenda.exportMarkdown)}`;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyAgenda = async () => {
    const copied = await onCopyText(agenda.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={`buyer-decision-agenda is-${agenda.status}`} aria-label="Buyer decision agenda">
      <div className="buyer-decision-agenda-main">
        <span>Buyer decision agenda</span>
        <strong>{agenda.headline}</strong>
        <p>{agenda.summary}</p>
        <div className="buyer-decision-agenda-actions" aria-label="Buyer decision agenda actions">
          <a className="buyer-decision-agenda-primary" href={agenda.firstAction.href} {...routeActionAttrs(agenda.firstAction)}>
            {agenda.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {agenda.firstAction.label}
          </a>
          <button className={`icon-link ${copyStatus === "copied" ? "is-confirmed" : ""} ${copyStatus === "failed" ? "is-risk" : ""}`.trim()} type="button" onClick={copyAgenda}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-decision-agenda.md">
            <Download size={14} />
            Export agenda
          </a>
        </div>
      </div>
      <aside className="buyer-decision-agenda-state" aria-label="Buyer decision state">
        <span>{agenda.decisionLabel}</span>
        <strong>{agenda.readyCount}/{agenda.agendaTotal}</strong>
        <small>{agenda.valueLine}</small>
      </aside>
      <div className="buyer-decision-agenda-items" aria-label="Buyer meeting agenda">
        {agenda.items.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(item.href) })}>
            <span>
              {iconFor(item.status)}
              {item.label}
            </span>
            <strong>{item.owner}</strong>
            <p>{item.outcome}</p>
            <small>{item.evidence}</small>
          </a>
        ))}
      </div>
      <div className="buyer-decision-agenda-rules" aria-label="No-send rules">
        <span>No-send rules</span>
        <ul>
          {agenda.noSendRules.slice(0, 3).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
