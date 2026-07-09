import { ClipboardCheck, Crosshair, Download, ExternalLink, FileText, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildProductionHardeningSnapshot,
  type ProductionHardeningBuildInput,
  type ProductionHardeningStatus
} from "./productionHardening.js";

function iconFor(status: ProductionHardeningStatus) {
  if (status === "ready") return <ShieldCheck size={14} />;
  if (status === "attention") return <Wrench size={14} />;
  return <Crosshair size={14} />;
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

type ProductionHardeningPanelProps = ProductionHardeningBuildInput & {
  publicGateHref: string;
  onCopyText: (text: string) => Promise<boolean>;
};

export default function ProductionHardeningPanel({
  workspace,
  workflowIntakeHref,
  currentAuditHref,
  deliveryMemoHref,
  trustManifestHref,
  launchRoomHref,
  publicGateHref,
  onCopyText
}: ProductionHardeningPanelProps) {
  const snapshot = useMemo(
    () =>
      buildProductionHardeningSnapshot({
        workspace,
        workflowIntakeHref,
        currentAuditHref,
        deliveryMemoHref,
        trustManifestHref,
        launchRoomHref
      }),
    [currentAuditHref, deliveryMemoHref, launchRoomHref, trustManifestHref, workflowIntakeHref, workspace]
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [issueCopyStatus, setIssueCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied gate" : copyStatus === "failed" ? "Copy failed" : "Copy gate";
  const issueCopyLabel = issueCopyStatus === "copied" ? "Copied issue" : issueCopyStatus === "failed" ? "Copy failed" : "Copy top issue";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;
  const actionPacketHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(snapshot.actionPacket, null, 2))}`;
  const recoveryKitHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(snapshot.recoveryKit, null, 2))}`;
  const recoveryCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(snapshot.recoveryKit.csvText)}`;
  const topIssue = snapshot.recoveryKit.issues[0];

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (issueCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setIssueCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [issueCopyStatus]);

  const copyGate = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  const copyTopIssue = async () => {
    const copied = await onCopyText(topIssue?.issueBody ?? snapshot.recoveryKit.copyText);
    setIssueCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={`production-hardening is-${snapshot.status}`} aria-label="Production hardening gate">
      <div className="production-hardening-main">
        <span>Production hardening gate</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
        <div className="production-hardening-actions" aria-label="Production hardening actions">
          <a className="production-hardening-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <button className={`icon-link ${copyStatus === "copied" ? "is-confirmed" : ""} ${copyStatus === "failed" ? "is-risk" : ""}`.trim()} type="button" onClick={copyGate}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={publicGateHref} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Public gate
          </a>
          <a className="icon-link" href={exportHref} download="production-hardening-gate.md">
            <Download size={14} />
            Export gate
          </a>
          <a className="icon-link" href={actionPacketHref} download="production-hardening-actions.json">
            <Download size={14} />
            Action packet
          </a>
        </div>
      </div>
      <aside className="production-hardening-score" aria-label="Production hardening score">
        <span>{snapshot.status}</span>
        <strong>{snapshot.score}</strong>
        <small>{snapshot.readyCount}/{snapshot.checkTotal} launch checks clear</small>
      </aside>
      <div className="production-hardening-checks" aria-label="Production hardening checks">
        {snapshot.checks.map((check) => (
          <a key={check.id} className={check.status} href={check.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(check.href) })}>
            <span>
              {iconFor(check.status)}
              {check.label}
            </span>
            <strong>{check.evidence}</strong>
            <small>{check.action}</small>
          </a>
        ))}
      </div>
      <div className="production-hardening-action-packet" aria-label="Release action packet">
        <span>Release action packet</span>
        <strong>{snapshot.actionPacket.openCount === 0 ? "No blocking action remains" : `${snapshot.actionPacket.openCount} actions due by ${snapshot.actionPacket.dueDate}`}</strong>
        <small>{snapshot.actionPacket.summary}</small>
        <div>
          {snapshot.actionPacket.items.slice(0, 4).map((item) => (
            <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(item.href) })}>
              <span>{item.priority}</span>
              <strong>{item.label}</strong>
              <small>
                {item.owner} by {item.dueDate}
              </small>
            </a>
          ))}
        </div>
      </div>
      <div className="production-hardening-recovery-kit" aria-label="Global release recovery kit">
        <div className="production-hardening-recovery-head">
          <div>
            <span>Global release recovery kit</span>
            <strong>{snapshot.recoveryKit.headline}</strong>
            <small>{snapshot.recoveryKit.summary}</small>
          </div>
          <aside aria-label="Recovery ticket count">
            <span>{snapshot.recoveryKit.status}</span>
            <strong>{snapshot.recoveryKit.blockedCount}/{snapshot.recoveryKit.issueCount}</strong>
            <small>blocked tickets / due {snapshot.recoveryKit.dueDate}</small>
          </aside>
        </div>
        {topIssue && (
          <article className={topIssue.status} aria-label="Top release recovery issue">
            <span>
              <FileText size={14} />
              {topIssue.priority} / {topIssue.owner}
            </span>
            <strong>{topIssue.issueTitle}</strong>
            <p>{topIssue.acceptance}</p>
            <small>{snapshot.recoveryKit.releaseRule}</small>
            <div className="production-hardening-recovery-actions" aria-label="Recovery kit exports">
              <button className={`icon-link ${issueCopyStatus === "copied" ? "is-confirmed" : ""} ${issueCopyStatus === "failed" ? "is-risk" : ""}`.trim()} type="button" onClick={copyTopIssue}>
                <ClipboardCheck size={14} />
                {issueCopyLabel}
              </button>
              <a className="icon-link" href={recoveryCsvHref} download="global-release-recovery-kit.csv">
                <Download size={14} />
                Recovery CSV
              </a>
              <a className="icon-link" href={recoveryKitHref} download="global-release-recovery-kit.json">
                <Download size={14} />
                Recovery JSON
              </a>
            </div>
          </article>
        )}
        <div className="production-hardening-recovery-issues" aria-label="Recovery issue queue">
          {snapshot.recoveryKit.issues.slice(0, 4).map((issue) => (
            <a key={issue.id} className={issue.status} href={issue.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(issue.href) })}>
              <span>{issue.priority}</span>
              <strong>{issue.title}</strong>
              <small>
                {issue.owner} verifies: {issue.verification}
              </small>
            </a>
          ))}
        </div>
      </div>
      <div className="production-hardening-rules" aria-label="No-launch rules">
        <span>No-launch rules</span>
        <ul>
          {snapshot.noLaunchRules.slice(0, 3).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
