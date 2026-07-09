import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Download, ExternalLink, FileText } from "lucide-react";
import type { BuyerEvidenceTrace, BuyerEvidenceTraceClaim } from "./buyerEvidenceTrace";
import "./BuyerProofAnswerDeck.css";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function externalAttrs(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function answerStateLine(claim: BuyerEvidenceTraceClaim) {
  if (claim.status === "pass") return "Answer can be sent. Source, artifact, and claim-match checks are ready.";
  if (claim.status === "watch") return "Answer needs review. Resolve the watch item before treating this as final.";
  return "Do not send this answer yet. Repair the blocker first.";
}

export function buildBuyerProofAnswerDeckMarkdown(trace: BuyerEvidenceTrace, evidenceTraceHref: string) {
  const passingClaims = trace.claims.filter((claim) => claim.status === "pass").length;
  const nextRepair = trace.blockers[0] ?? {
    label: trace.primaryClaim.label,
    owner: "Buyer proof owner",
    action: trace.primaryClaim.nextAction,
    href: trace.primaryClaim.artifact.href,
    status: trace.primaryClaim.status
  };

  return [
    "# Buyer proof answer deck",
    "",
    `Readiness: ${trace.readiness}`,
    `Score: ${trace.score}`,
    `Claims linked: ${passingClaims}/${trace.claims.length}`,
    `Audit checks: ${trace.auditSummary.passCount}/${trace.auditSummary.totalCount}`,
    `Public trace: ${evidenceTraceHref}`,
    "",
    "## Next repair",
    `- ${nextRepair.label} (${nextRepair.status})`,
    `- Owner: ${nextRepair.owner}`,
    `- Action: ${nextRepair.action}`,
    `- Link: ${nextRepair.href}`,
    "",
    "## Buyer questions",
    ...trace.claims.flatMap((claim) => [
      "",
      `### ${claim.label}`,
      `Status: ${claim.status}`,
      `Question: ${claim.buyerQuestion}`,
      `Answer: ${claim.claim}`,
      `Evidence answer: ${claim.verification}`,
      `Source: ${claim.source.label} - ${claim.source.value}`,
      `Source link: ${claim.source.href}`,
      `Artifact: ${claim.artifact.label} - ${claim.artifact.value}`,
      `Artifact link: ${claim.artifact.href}`,
      `Next action: ${claim.nextAction}`,
      `Send rule: ${answerStateLine(claim)}`
    ])
  ].join("\n");
}

export default function BuyerProofAnswerDeck({
  evidenceTrace,
  evidenceTraceHref,
  onCopyText
}: {
  evidenceTrace: BuyerEvidenceTrace;
  evidenceTraceHref: string;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const answerMarkdown = useMemo(() => buildBuyerProofAnswerDeckMarkdown(evidenceTrace, evidenceTraceHref), [evidenceTrace, evidenceTraceHref]);
  const answerHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(answerMarkdown)}`;
  const passingClaims = evidenceTrace.claims.filter((claim) => claim.status === "pass").length;
  const firstRepair = evidenceTrace.blockers[0] ?? {
    label: evidenceTrace.primaryClaim.label,
    status: evidenceTrace.primaryClaim.status,
    owner: "Buyer proof owner",
    action: evidenceTrace.primaryClaim.nextAction,
    href: evidenceTrace.primaryClaim.artifact.href
  };
  const copyLabel = copyStatus === "copied" ? "Copied answers" : copyStatus === "failed" ? "Copy failed" : "Copy answers";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyAnswers() {
    const copied = await onCopyText(answerMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("buyer-proof-answer-deck", evidenceTrace.readiness)} aria-label="Buyer proof answer deck">
      <div className="buyer-proof-answer-deck-head">
        <div className="buyer-proof-answer-deck-copy">
          <span>Buyer answer deck</span>
          <strong>Answer procurement questions from verified evidence</strong>
          <p>Each answer names the buyer question, the exact evidence claim, source, artifact, send rule, and repair target.</p>
          <div className="buyer-proof-answer-deck-actions" aria-label="Buyer proof answer deck actions">
            <a href={evidenceTraceHref} {...externalAttrs(evidenceTraceHref)}>
              <FileText size={13} />
              Public trace
            </a>
            <button className={cx(copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyAnswers}>
              <ClipboardCheck size={13} />
              {copyLabel}
            </button>
            <a href={answerHref} download="buyer-proof-answer-deck.md">
              <Download size={13} />
              Download answers
            </a>
          </div>
        </div>
        <div className="buyer-proof-answer-deck-score" aria-label="Buyer proof answer score">
          <span>{evidenceTrace.readiness}</span>
          <strong>{passingClaims}/{evidenceTrace.claims.length}</strong>
          <small>{evidenceTrace.auditSummary.passCount}/{evidenceTrace.auditSummary.totalCount} evidence checks pass</small>
        </div>
      </div>
      <div className={cx("buyer-proof-answer-deck-next", firstRepair.status)} aria-label="Next buyer answer repair">
        <span>Next answer repair</span>
        <strong>{firstRepair.label}</strong>
        <p>{firstRepair.owner}: {firstRepair.action}</p>
      </div>
      <div className="buyer-proof-answer-list" aria-label="Evidence-backed buyer answers">
        {evidenceTrace.claims.map((claim) => (
          <article key={claim.id} className={cx("buyer-proof-answer-card", claim.status)}>
            <header>
              <span>{claim.status}</span>
              <strong>{claim.buyerQuestion}</strong>
            </header>
            <p>{claim.claim}</p>
            <dl>
              <dt>Evidence answer</dt>
              <dd>{claim.verification}</dd>
              <dt>Send rule</dt>
              <dd>{answerStateLine(claim)}</dd>
            </dl>
            <small>
              Source: {claim.source.label}. Artifact: {claim.artifact.label}.
            </small>
            <footer>
              <a href={claim.artifact.href} {...externalAttrs(claim.artifact.href)}>
                <ExternalLink size={12} />
                Open artifact
              </a>
              <a href={claim.source.href} {...externalAttrs(claim.source.href)}>
                Source
              </a>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
