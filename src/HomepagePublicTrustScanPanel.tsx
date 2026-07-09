import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Download, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import type {
  HomepageOutcomeArtifactSnapshot,
  HomepageProofEntrySnapshot,
  HomepagePublishabilitySnapshot,
  HomepageReviewerHandoffKitSnapshot
} from "./App";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";
import { buildHomepagePublicTrustScan, type HomepagePublicTrustScanStatus } from "./homepagePublicTrustScan";
import "./HomepagePublicTrustScanPanel.css";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: HomepagePublicTrustScanStatus) {
  if (status === "ready") return <BadgeCheck size={14} />;
  if (status === "attention") return <Gauge size={14} />;
  return <AlertTriangle size={14} />;
}

export default function HomepagePublicTrustScanPanel({
  valueLens,
  proofEntry,
  outcomeArtifact,
  publishability,
  reviewerHandoffKit,
  onCopyText
}: {
  valueLens: HomepageValueLensSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
  outcomeArtifact: HomepageOutcomeArtifactSnapshot;
  publishability: HomepagePublishabilitySnapshot;
  reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const scan = useMemo(
    () =>
      buildHomepagePublicTrustScan({
        valueLens,
        proofEntry,
        outcomeArtifact,
        publishability,
        reviewerHandoffKit
      }),
    [outcomeArtifact, proofEntry, publishability, reviewerHandoffKit, valueLens]
  );

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyScan() {
    const copied = await onCopyText(scan.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("homepage-public-trust-scan", `is-${scan.status}`)} aria-labelledby="homepage-public-trust-scan-title">
      <div className="homepage-public-trust-scan-main">
        <span>
          <ShieldCheck size={14} />
          Public trust scan
        </span>
        <h2 id="homepage-public-trust-scan-title">{scan.headline}</h2>
        <p>{scan.summary}</p>
        <div className="homepage-public-trust-scan-actions" aria-label="Public trust scan actions">
          <a className="homepage-public-trust-scan-primary" href={scan.primaryAction.href} {...routeActionAttrs(scan.primaryAction)}>
            {scan.status === "ready" ? <ExternalLink size={14} /> : <AlertTriangle size={14} />}
            {scan.primaryAction.label}
          </a>
          <button className={cx("homepage-public-trust-scan-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyScan}>
            <ClipboardCheck size={14} />
            {copyStatus === "copied" ? "Copied scan" : copyStatus === "failed" ? "Copy failed" : "Copy scan"}
          </button>
          <a className="homepage-public-trust-scan-link" href={scan.markdownHref} download="public-trust-scan.md">
            <Download size={14} />
            Export Markdown
          </a>
          <a className="homepage-public-trust-scan-link" href={scan.csvHref} download="public-trust-scan.csv">
            <Download size={14} />
            Export CSV
          </a>
        </div>
      </div>

      <aside className="homepage-public-trust-scan-score" aria-label="Public trust score">
        <span>
          {statusIcon(scan.status)}
          {scan.status}
        </span>
        <strong>{scan.score}</strong>
        <small>
          {scan.trustedCount}/{scan.checkCount} trusted, {scan.blockedCount} blocked
        </small>
      </aside>

      <article className="homepage-public-trust-scan-question" aria-label="First public buyer question">
        <span>{scan.firstQuestion.label}</span>
        <strong>{scan.firstQuestion.buyerQuestion}</strong>
        <p>{scan.firstQuestion.action}</p>
        <small>Repair owner: {scan.firstQuestion.owner}</small>
      </article>

      <article className="homepage-public-trust-scan-rule" aria-label="Public publish rule">
        <span>Publish rule</span>
        <strong>{scan.publishRule}</strong>
        <p>{scan.visitorPromise}</p>
      </article>

      <div className="homepage-public-trust-scan-answer-deck" aria-label="Buyer question answer deck">
        <div className="homepage-public-trust-scan-answer-summary">
          <span>Buyer answer deck</span>
          <strong>
            {scan.answeredCount}/{scan.answerCount} safe to cite
          </strong>
          <p>{scan.answerDeckSummary}</p>
        </div>
        <div className="homepage-public-trust-scan-answers">
          {scan.buyerAnswers.map((answer) => (
            <a key={answer.id} className={answer.status} href={answer.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(answer.href) })}>
              <span>
                {statusIcon(answer.status)}
                {answer.label}
              </span>
              <strong>{answer.question}</strong>
              <p>{answer.answer}</p>
              <small>{answer.decisionUse}</small>
            </a>
          ))}
        </div>
      </div>

      <div className="homepage-public-trust-scan-checks" aria-label="Public trust checks">
        {scan.checks.map((check) => (
          <a key={check.id} className={check.status} href={check.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(check.href) })}>
            <span>
              {statusIcon(check.status)}
              {check.label}
            </span>
            <strong>{check.score}/100</strong>
            <p>{check.evidence}</p>
            <small>{check.buyerQuestion}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
