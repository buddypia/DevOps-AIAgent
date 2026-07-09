import { useMemo, useState } from "react";
import { BadgeCheck, ClipboardCheck, Copy, Download, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import { downloadTextFile } from "./downloadArtifact";
import type { HomepageValueLensSnapshot } from "./HomepageValueLens";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot, HomepageReviewerHandoffKitSnapshot } from "./AppHome";
import { buildHomepageBuyerBoardMemo, type HomepageBuyerBoardMemoSnapshot, type HomepageBuyerBoardMemoStatus } from "./homepageBuyerBoardMemo";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function actionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: HomepageBuyerBoardMemoStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <ShieldCheck size={15} />;
}

export function HomepageBuyerBoardMemoPanel({
  onCopyText,
  ...input
}:
  | {
      memo: HomepageBuyerBoardMemoSnapshot;
      onCopyText: (text: string) => Promise<boolean>;
    }
  | {
      valueLens: HomepageValueLensSnapshot;
      proofEntry: HomepageProofEntrySnapshot;
      outcomeArtifact: HomepageOutcomeArtifactSnapshot;
      reviewerHandoffKit: HomepageReviewerHandoffKitSnapshot;
      onCopyText: (text: string) => Promise<boolean>;
    }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const memo = useMemo(
    () =>
      "memo" in input
        ? input.memo
        : buildHomepageBuyerBoardMemo({
            valueLens: input.valueLens,
            proofEntry: input.proofEntry,
            outcomeArtifact: input.outcomeArtifact,
            reviewerHandoffKit: input.reviewerHandoffKit
          }),
    [input]
  );

  async function copyMemo() {
    setCopyStatus((await onCopyText(memo.exportMarkdown)) ? "copied" : "failed");
  }

  return (
    <section id="buyer-board-memo" className={cx("homepage-buyer-board-memo", `is-${memo.status}`)} aria-labelledby="homepage-buyer-board-memo-title">
      <div className="homepage-buyer-board-memo-main">
        <div className="homepage-buyer-board-memo-copy">
          <span>Buyer board memo</span>
          <h2 id="homepage-buyer-board-memo-title">{memo.headline}</h2>
          <p>{memo.summary}</p>
        </div>
        <div className="homepage-buyer-board-memo-actions" aria-label="Buyer board memo actions">
          <a className="homepage-buyer-board-memo-primary" href={memo.primaryAction.href} {...actionAttrs(memo.primaryAction)}>
            {statusIcon(memo.status)}
            {memo.primaryAction.label}
            {memo.primaryAction.external ? <ExternalLink size={13} /> : null}
          </a>
          <a className="homepage-buyer-board-memo-link" href={memo.secondaryAction.href}>
            <ClipboardCheck size={14} />
            {memo.secondaryAction.label}
          </a>
          <button type="button" className={cx("homepage-buyer-board-memo-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} onClick={copyMemo}>
            <Copy size={14} />
            {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy memo"}
          </button>
          <button type="button" className="homepage-buyer-board-memo-link" data-download-filename="buyer-board-memo.md" onClick={() => downloadTextFile("buyer-board-memo.md", memo.exportMarkdown)}>
            <Download size={14} />
            Export memo
          </button>
        </div>
      </div>
      <aside className="homepage-buyer-board-memo-verdict" aria-label="Buyer board verdict">
        <span>{memo.decisionLabel}</span>
        <strong>{memo.boardScore}</strong>
        <small>board score</small>
      </aside>
      <div className="homepage-buyer-board-memo-metrics" aria-label="Buyer board memo metrics">
        {memo.metrics.map((metric) => (
          <article key={metric.id} className={metric.status}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.evidence}</p>
          </article>
        ))}
      </div>
      <div className="homepage-buyer-board-memo-questions" aria-label="Buyer board questions">
        {memo.questions.map((item) => (
          <a key={item.id} className={item.status} href={item.href}>
            <span>{item.question}</span>
            <strong>{item.answer}</strong>
            <small>{item.evidence}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

export default HomepageBuyerBoardMemoPanel;
