import { type MouseEvent } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import type {
  HomepageOutcomeArtifactAction,
  HomepageOutcomeArtifactSnapshot,
  HomepageOutcomeArtifactStatus,
  HomepageProofEntrySnapshot,
  HomepageReviewerHandoffKitSnapshot
} from "./App";
import { downloadTextFile } from "./downloadArtifact";
import { buildHomepageExternalReviewerDockSnapshot, type HomepageExternalReviewerDockSnapshot } from "./homepageExternalReviewerDock";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function routeActionAttrs(action: HomepageOutcomeArtifactAction) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: HomepageOutcomeArtifactStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

export function HomepageExternalReviewerDockPanel({ snapshot }: { snapshot: HomepageExternalReviewerDockSnapshot }) {
  function openVerifierDesk(event: MouseEvent<HTMLAnchorElement>) {
    if (typeof window === "undefined") return;
    event.preventDefault();
    try {
      const storageKey = `receipt-verifier-request:${snapshot.verifierRequestKey}`;
      window.sessionStorage.setItem(storageKey, snapshot.verifierRequestJson);
      window.localStorage.setItem(storageKey, snapshot.verifierRequestJson);
      window.location.assign(snapshot.verifierAction.href);
    } catch {
      // The verifier href carries the request JSON; storage is only a restore aid.
      window.location.assign(snapshot.verifierFallbackHref);
    }
  }

  return (
    <section className={cx("homepage-external-review-dock", `is-${snapshot.status}`)} aria-label="External reviewer decision dock">
      <div className="homepage-external-review-dock-main">
        <span>
          <ShieldCheck size={14} />
          External review room
        </span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
      </div>
      <div className="homepage-external-review-dock-score" aria-label="External reviewer readiness">
        <span>{snapshot.status}</span>
        <strong>{snapshot.score}/100</strong>
        <small>
          {snapshot.readyCount}/{snapshot.itemCount} surfaces ready
        </small>
      </div>
      <div className="homepage-external-review-dock-actions" aria-label="External reviewer actions">
        <a className="homepage-external-review-dock-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
          {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
          {snapshot.primaryAction.label}
        </a>
        <a className="homepage-external-review-dock-link" href={snapshot.verifierAction.href} onClick={openVerifierDesk}>
          <ClipboardCheck size={14} />
          {snapshot.verifierAction.label}
        </a>
        <button type="button" className="homepage-external-review-dock-link" data-download-filename="external-reviewer-dock.md" onClick={() => downloadTextFile("external-reviewer-dock.md", snapshot.exportMarkdown)}>
          <Download size={14} />
          Export dock
        </button>
      </div>
      <aside className="homepage-external-review-dock-rule" aria-label="External review send rule">
        <span>{snapshot.decision}</span>
        <strong>{snapshot.reviewQuestion}</strong>
        <p>{snapshot.sendRule}</p>
      </aside>
      <div className="homepage-external-review-dock-items" aria-label="External reviewer surfaces">
        {snapshot.items.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ label: item.actionLabel, href: item.href, external: isExternalHref(item.href) })}>
            <span>
              {statusIcon(item.status)}
              {item.label}
            </span>
            <strong>{item.title}</strong>
            <p>{item.evidence}</p>
            <small>{item.actionLabel}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

export function HomepageExternalReviewerDockRuntimePanel({
  artifact,
  proofEntry,
  reviewerKit
}: {
  artifact: HomepageOutcomeArtifactSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  reviewerKit: HomepageReviewerHandoffKitSnapshot;
}) {
  return <HomepageExternalReviewerDockPanel snapshot={buildHomepageExternalReviewerDockSnapshot({ artifact, proofEntry, reviewerKit })} />;
}

export default HomepageExternalReviewerDockRuntimePanel;
