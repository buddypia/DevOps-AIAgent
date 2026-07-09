import { CheckCircle2, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";
import { buildBuyerPublicationWindowSnapshot, type BuyerPublicationWindowBuildInput, type BuyerPublicationWindowStatus } from "./buyerPublicationWindow.js";

function iconFor(status: BuyerPublicationWindowStatus) {
  if (status === "ready") return <CheckCircle2 size={14} />;
  if (status === "attention") return <Gauge size={14} />;
  return <Crosshair size={14} />;
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

type BuyerPublicationWindowPanelProps = Omit<BuyerPublicationWindowBuildInput, "now" | "proofVerification"> & {
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  onCopyText: (text: string) => Promise<boolean>;
};

export default function BuyerPublicationWindowPanel({
  proofVerification,
  proofChain,
  publicDecisionPath,
  trustSnapshot,
  currentAuditHref,
  trustManifestHref,
  launchRoomHref,
  onCopyText
}: BuyerPublicationWindowPanelProps) {
  const snapshot = useMemo(
    () =>
      buildBuyerPublicationWindowSnapshot({
        proofVerification,
        proofChain,
        publicDecisionPath,
        trustSnapshot,
        currentAuditHref,
        trustManifestHref,
        launchRoomHref
      }),
    [currentAuditHref, launchRoomHref, proofChain, proofVerification, publicDecisionPath, trustManifestHref, trustSnapshot]
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied window" : copyStatus === "failed" ? "Copy failed" : "Copy window";
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;
  const clearTasks = snapshot.tasks.filter((task) => task.status === "ready").length;
  const blockedTasks = snapshot.tasks.filter((task) => task.status === "blocked").length;
  const clearStopRules = snapshot.handoffContract.stopRules.filter((rule) => rule.status === "ready").length;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyPublicationWindow = async () => {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={`buyer-publication-window is-${snapshot.status}`} aria-label="Buyer publication window">
      <div className="buyer-publication-window-main">
        <span>Publication window</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
        <div className="buyer-publication-window-actions" aria-label="Buyer publication window actions">
          <a className="buyer-publication-window-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <button className={`icon-link ${copyStatus === "copied" ? "is-confirmed" : ""} ${copyStatus === "failed" ? "is-risk" : ""}`.trim()} type="button" onClick={copyPublicationWindow}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={exportHref} download="buyer-publication-window.md">
            <Download size={14} />
            Export window
          </a>
        </div>
      </div>
      <aside className="buyer-publication-window-clock" aria-label="Buyer proof publication timebox">
        <span>{snapshot.timeboxLabel}</span>
        <strong>{clearTasks}/{snapshot.tasks.length}</strong>
        <small>{blockedTasks} blocked / {snapshot.status}</small>
      </aside>
      <div className="buyer-publication-window-dates" aria-label="Publication window dates">
        <article>
          <span>Proof expires</span>
          <strong>{snapshot.proofExpiresAt}</strong>
        </article>
        <article>
          <span>Buyer review due</span>
          <strong>{snapshot.buyerReviewDueAt}</strong>
        </article>
        <article>
          <span>Manifest expires</span>
          <strong>{snapshot.manifestExpiresAt}</strong>
        </article>
      </div>
      <div className={`buyer-publication-window-contract ${snapshot.handoffContract.mode}`} aria-label="Buyer handoff contract">
        <div className="buyer-publication-window-contract-main">
          <span>Handoff contract</span>
          <strong>{snapshot.handoffContract.headline}</strong>
          <p>{snapshot.handoffContract.summary}</p>
        </div>
        <aside>
          <span>{snapshot.handoffContract.mode}</span>
          <strong>{clearStopRules}/{snapshot.handoffContract.stopRules.length}</strong>
          <small>
            {snapshot.handoffContract.verifiedCount}/{snapshot.handoffContract.totalCount} links
            {snapshot.handoffContract.proofAgeHours === null ? " / not checked" : ` / ${snapshot.handoffContract.proofAgeHours}h old`}
          </small>
        </aside>
        <ol>
          {snapshot.handoffContract.stopRules.map((rule) => (
            <li key={rule.id} className={rule.status}>
              <span>
                {iconFor(rule.status)}
                {rule.status}
              </span>
              <strong>{rule.label}</strong>
              <p>{rule.evidence}</p>
              <small>{rule.action}</small>
              <a href={rule.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(rule.href) })}>
                <ExternalLink size={12} />
                Open
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="buyer-publication-window-tasks" aria-label="Publication recheck schedule">
        {snapshot.tasks.map((task) => (
          <a key={task.id} className={task.status} href={task.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(task.href) })}>
            <span>
              {iconFor(task.status)}
              {task.label}
            </span>
            <strong>{task.owner}</strong>
            <small>{task.action}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
