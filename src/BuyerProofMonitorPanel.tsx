import { Download, ExternalLink } from "lucide-react";
import type { BuyerProofMonitor } from "./buyerProofMonitor";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BuyerProofMonitorPanel({
  monitor,
  monitorHref,
  monitorExportHref
}: {
  monitor: BuyerProofMonitor;
  monitorHref: string;
  monitorExportHref: string;
}) {
  return (
    <section className={cx("buyer-proof-monitor", monitor.readiness)} aria-label="Buyer proof freshness monitor">
      <div className="buyer-proof-monitor-head">
        <div>
          <span>Proof monitor</span>
          <strong>{monitor.headline}</strong>
          <p>{monitor.hardTruth}</p>
        </div>
        <div className="buyer-proof-monitor-score">
          <span>{monitor.readiness}</span>
          <strong>{monitor.score}</strong>
          <small>{monitor.stopExternalSharing ? "Stop external sharing" : "External sharing can stay open"}</small>
        </div>
        <a className="icon-link" href={monitorHref} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          Open monitor
        </a>
        <a className="icon-link" href={monitorExportHref} download="buyer-proof-monitor.md">
          <Download size={14} />
          Download monitor
        </a>
      </div>
      <div className="buyer-proof-monitor-checks">
        {monitor.checks.map((check) => (
          <article key={check.id} className={check.status}>
            <div>
              <span>{check.status}</span>
              <strong>{check.label}</strong>
            </div>
            <p>{check.evidence}</p>
            <small>
              {check.owner} - {check.nextCheck}
            </small>
          </article>
        ))}
      </div>
      <ol className="buyer-proof-monitor-runbook">
        {monitor.runbook.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
