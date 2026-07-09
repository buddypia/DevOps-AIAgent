import { ClipboardCheck, Crosshair, Download, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildProductionHardeningDemoResidueAudit,
  buildProductionHardeningSnapshot,
  type ProductionHardeningBuildInput,
  type ProductionHardeningStatus
} from "./productionHardening.js";

type BuyerDemoResidueAuditPanelProps = ProductionHardeningBuildInput & {
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function iconFor(status: ProductionHardeningStatus) {
  if (status === "ready") return <ShieldCheck size={14} />;
  if (status === "attention") return <Wrench size={14} />;
  return <Crosshair size={14} />;
}

function hrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

export default function BuyerDemoResidueAuditPanel({
  workspace,
  workflowIntakeHref,
  currentAuditHref,
  deliveryMemoHref,
  trustManifestHref,
  launchRoomHref,
  onCopyText
}: BuyerDemoResidueAuditPanelProps) {
  const audit = useMemo(() => {
    const snapshot = buildProductionHardeningSnapshot({
      workspace,
      workflowIntakeHref,
      currentAuditHref,
      deliveryMemoHref,
      trustManifestHref,
      launchRoomHref
    });

    return buildProductionHardeningDemoResidueAudit(snapshot);
  }, [currentAuditHref, deliveryMemoHref, launchRoomHref, trustManifestHref, workflowIntakeHref, workspace]);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const openCount = audit.blockedCount + audit.attentionCount;
  const copyLabel = copyStatus === "copied" ? "Copied audit" : copyStatus === "failed" ? "Copy failed" : "Copy audit";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(audit.exportMarkdown)}`;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyAudit = async () => {
    const copied = await onCopyText(audit.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-demo-residue-audit", `is-${audit.status}`)} aria-label="Reference residue audit">
      <div className="buyer-demo-residue-main">
        <span>Reference residue audit</span>
        <strong>{audit.headline}</strong>
        <p>{audit.summary}</p>
        <div className="buyer-demo-residue-actions" aria-label="Reference residue actions">
          <a className="buyer-demo-residue-primary" href={audit.primaryAction.href} {...routeActionAttrs(audit.primaryAction)}>
            {iconFor(audit.status)}
            {audit.primaryAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyAudit}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="reference-residue-audit.md">
            <Download size={14} />
            Export audit
          </a>
        </div>
      </div>
      <aside className="buyer-demo-residue-score" aria-label="Reference residue score">
        <span>{audit.status}</span>
        <strong>{audit.readyCount}/{audit.totalCount}</strong>
        <small>{openCount === 0 ? "No buyer-facing residue open" : `${openCount} buyer-facing residue checks open`}</small>
      </aside>
      <div className="buyer-demo-residue-items" aria-label="Reference residue checks">
        {audit.items.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ external: hrefIsExternal(item.href) })}>
            <span>
              {iconFor(item.status)}
              {item.label}
            </span>
            <strong>{item.evidence}</strong>
            <small>
              {item.owner}: {item.action}
            </small>
          </a>
        ))}
      </div>
    </section>
  );
}
