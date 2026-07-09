import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, Route } from "lucide-react";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepagePublishabilitySnapshot, HomepageReviewerHandoffKitSnapshot } from "./App";
import {
  buildHomepageOperatorNextMove,
  type HomepageOperatorNextMoveAction,
  type HomepageOperatorNextMoveStatus
} from "./homepageOperatorNextMove";
import "./HomepageOperatorNextMovePanel.css";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: HomepageOperatorNextMoveAction) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: HomepageOperatorNextMoveStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

export default function HomepageOperatorNextMovePanel({
  proofEntry,
  publishability,
  outcomeArtifact,
  reviewerHandoffKit,
  onCopyText
}: {
  proofEntry: HomepageProofEntrySnapshot;
  publishability: HomepagePublishabilitySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const snapshot = useMemo(
    () =>
      buildHomepageOperatorNextMove({
        proofEntry,
        publishability,
        outcomeArtifact,
        reviewerHandoffKit
      }),
    [outcomeArtifact, proofEntry, publishability, reviewerHandoffKit]
  );
  const primary = snapshot.primaryMove;
  const copyLabel = copyStatus === "copied" ? "Copied command" : copyStatus === "failed" ? "Copy failed" : "Copy command";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyCommand() {
    const copied = await onCopyText(snapshot.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("homepage-operator-next-move", `is-${snapshot.status}`)} aria-labelledby="homepage-operator-next-move-title">
      <div className="homepage-operator-next-move-main">
        <span>
          <Route size={15} />
          Operator next move
        </span>
        <h2 id="homepage-operator-next-move-title">{snapshot.headline}</h2>
        <p>{snapshot.summary}</p>
        <div className="homepage-operator-next-move-actions" aria-label="Operator next move actions">
          <a className="homepage-operator-next-move-primary" href={primary.action.href} {...routeActionAttrs(primary.action)}>
            {snapshot.status === "ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
            {primary.action.label}
          </a>
          <button className={cx("homepage-operator-next-move-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyCommand}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="homepage-operator-next-move-link" href={snapshot.markdownHref} download="operator-next-move.md">
            <Download size={14} />
            Export Markdown
          </a>
          <a className="homepage-operator-next-move-link" href={snapshot.csvHref} download="operator-next-move.csv">
            <Download size={14} />
            Export CSV
          </a>
        </div>
      </div>

      <aside className="homepage-operator-next-move-score" aria-label="Operator next move score lift">
        <span>{snapshot.readyCount}/{snapshot.candidateCount} lanes ready</span>
        <strong>+{snapshot.scoreDelta}</strong>
        <p>
          {snapshot.currentScore}/100 to {snapshot.projectedScore}/100
        </p>
        <small>{snapshot.blockedCount} blocked lanes</small>
      </aside>

      <article className="homepage-operator-next-move-command" aria-label="Owner command">
        <div>
          <span>{primary.label}</span>
          <strong>{primary.title}</strong>
          <p>{primary.command}</p>
        </div>
        <dl>
          <div>
            <dt>Owner</dt>
            <dd>{primary.owner}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{primary.due}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{primary.source}</dd>
          </div>
        </dl>
      </article>

      <div className="homepage-operator-next-move-acceptance" aria-label="Acceptance criteria">
        <span>Acceptance criteria</span>
        {primary.acceptanceCriteria.slice(0, 3).map((criterion) => (
          <p key={criterion}>{criterion}</p>
        ))}
        <small>{primary.shareRule}</small>
      </div>

      <div className="homepage-operator-next-move-queue" aria-label="Operator candidate queue">
        {snapshot.moves.map((move) => (
          <a key={move.id} className={move.status} href={move.action.href} {...routeActionAttrs(move.action)}>
            <span>
              {statusIcon(move.status)}
              {move.label}
            </span>
            <strong>{move.owner}</strong>
            <p>{move.title}</p>
            <small>
              +{move.scoreDelta} to {move.projectedScore}/100
            </small>
          </a>
        ))}
      </div>
    </section>
  );
}
