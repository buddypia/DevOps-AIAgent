import { Download, ExternalLink, Mail, PackageCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import QuickWorkflowBuyerExpansionHandoffPanel from "./QuickWorkflowBuyerExpansionHandoffPanel";
import type { QuickWorkflowBuyerExpansionPacket } from "./quickWorkflowBuyerExpansionPacket";

type QuickWorkflowBuyerExpansionPacketPanelProps = {
  packet: QuickWorkflowBuyerExpansionPacket;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowBuyerExpansionPacketPanel({ packet }: QuickWorkflowBuyerExpansionPacketPanelProps) {
  const [htmlObjectUrl, setHtmlObjectUrl] = useState("");

  useEffect(() => {
    if (typeof URL === "undefined" || typeof Blob === "undefined") return;
    const objectUrl = URL.createObjectURL(new Blob([packet.exportHtml], { type: "text/html;charset=utf-8" }));
    setHtmlObjectUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [packet.exportHtml]);

  return (
    <div className={cx("quick-workflow-buyer-expansion-packet", packet.status)} aria-label="Buyer expansion packet">
      <div className="quick-workflow-buyer-expansion-main">
        <span>
          <PackageCheck size={13} />
          Buyer expansion packet
        </span>
        <strong>{packet.headline}</strong>
        <p>{packet.summary}</p>
        <small>{packet.decisionAsk}</small>
        <div className="quick-workflow-buyer-expansion-actions" aria-label="Buyer expansion packet actions">
          <a href={packet.mailtoHref}>
            <Mail size={14} />
            Send packet
          </a>
          <a href={htmlObjectUrl || packet.exportHtmlHref} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Open one-pager
          </a>
          <a href={packet.exportHref} download="quick-workflow-buyer-expansion-packet.md">
            <Download size={14} />
            Export markdown
          </a>
        </div>
      </div>
      <aside className="quick-workflow-buyer-expansion-score" aria-label="Buyer expansion packet readiness">
        <span>{packet.status}</span>
        <strong>
          {packet.readyCount}/{packet.totalCount}
        </strong>
        <small>{packet.primaryMetric}</small>
      </aside>
      <div className="quick-workflow-buyer-expansion-receipts">
        <span>
          <ShieldCheck size={13} />
          Receipt chain
        </span>
        <strong>{packet.receiptLine}</strong>
        <small>
          {packet.nextOwner}: {packet.nextAction}
        </small>
      </div>
      <div className="quick-workflow-buyer-expansion-stages" aria-label="Buyer expansion packet stages">
        {packet.stages.map((stage) => (
          <article key={stage.id} className={stage.status}>
            <span>{stage.label}</span>
            <strong>{stage.value}</strong>
            <small>{stage.owner}</small>
            <em>{stage.action}</em>
            {stage.verifierHref ? (
              <a href={stage.verifierHref}>
                <ShieldCheck size={13} />
                Verify
              </a>
            ) : (
              stage.receiptId && <b>{stage.receiptId}</b>
            )}
          </article>
        ))}
      </div>
      <QuickWorkflowBuyerExpansionHandoffPanel handoff={packet.procurementHandoff} onePagerHref={htmlObjectUrl || packet.exportHtmlHref} />
    </div>
  );
}
