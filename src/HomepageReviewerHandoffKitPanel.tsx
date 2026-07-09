import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, Scale } from "lucide-react";
import type { HomepageOutcomeArtifactAction, HomepageOutcomeArtifactStatus, HomepageReviewerHandoffKitSnapshot } from "./App";
import "./HomepageReviewerHandoffKitPanel.css";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function hrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function routeActionAttrs(action: Pick<HomepageOutcomeArtifactAction, "external">) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function reviewerStepStatusIcon(status: HomepageOutcomeArtifactStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

export default function HomepageReviewerHandoffKitPanel({
  snapshot,
  onCopyText
}: {
  snapshot: HomepageReviewerHandoffKitSnapshot;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(snapshot.exportMarkdown)}`;

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyHandoff() {
    const copied = await onCopyText(snapshot.exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("homepage-reviewer-kit", `is-${snapshot.status}`)} aria-labelledby="homepage-reviewer-kit-title">
      <div className="homepage-reviewer-kit-main">
        <span>
          <Scale size={15} />
          Reviewer handoff kit
        </span>
        <h2 id="homepage-reviewer-kit-title">{snapshot.headline}</h2>
        <p>{snapshot.summary}</p>
        <div className="homepage-reviewer-kit-actions" aria-label="Reviewer handoff actions">
          <a className="homepage-reviewer-kit-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {snapshot.primaryAction.label}
          </a>
          <button className={cx("homepage-reviewer-kit-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyHandoff}>
            <ClipboardCheck size={14} />
            {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy kit"}
          </button>
          <a className="homepage-reviewer-kit-link" href={exportHref} download="reviewer-handoff-kit.md">
            <Download size={14} />
            Export kit
          </a>
        </div>
      </div>
      <aside className="homepage-reviewer-kit-question" aria-label="Reviewer decision question">
        <span>{snapshot.decision}</span>
        <strong>{snapshot.reviewQuestion}</strong>
        <p>{snapshot.reviewAnswer}</p>
      </aside>
      <div className="homepage-reviewer-kit-rules" aria-label="Reviewer send rules">
        <article>
          <span>Send rule</span>
          <p>{snapshot.sendRule}</p>
        </article>
        <article>
          <span>Hold rule</span>
          <p>{snapshot.holdRule}</p>
        </article>
        <article>
          <span>Readiness</span>
          <strong>
            {snapshot.readyCount}/{snapshot.steps.length}
          </strong>
          <p>{snapshot.blockedCount} blocked steps</p>
        </article>
      </div>
      <div className="homepage-reviewer-kit-steps" aria-label="Reviewer handoff path">
        {snapshot.steps.map((step) => (
          <a key={step.id} className={step.status} href={step.href} {...routeActionAttrs({ external: hrefIsExternal(step.href) })}>
            <span>
              {reviewerStepStatusIcon(step.status)}
              {step.label}
            </span>
            <strong>{step.owner}</strong>
            <p>{step.evidence}</p>
            <small>{step.actionLabel}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
