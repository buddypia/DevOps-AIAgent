import { AlertTriangle, BadgeCheck, ClipboardCheck, Download, ExternalLink, FileCheck2, Gauge, Globe2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import { buildBuyerEvidenceBoard, type BuyerEvidenceBoardHrefs, type BuyerEvidenceBoardItemStatus } from "./buyerEvidenceBoard";
import type { BuyerPilotCommand } from "./buyerPilotCommand";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import type { BuyerValueScenario } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import { downloadJsonFile, downloadTextFile } from "./downloadArtifact";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";

type BuyerEvidenceBoardPanelProps = {
  projectBrief: string;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  agentTrialEvidence: AgentTrialEvidenceRecord[];
  command: BuyerPilotCommand;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  issuedAt: string;
  hrefs: BuyerEvidenceBoardHrefs;
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeAttrs(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: BuyerEvidenceBoardItemStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "watch") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

export default function BuyerEvidenceBoardPanel({
  projectBrief,
  buyerScenario,
  pilotRun,
  buyerWorkOrder,
  agentTrialEvidence,
  command,
  proofVerification,
  issuedAt,
  hrefs,
  onCopyText
}: BuyerEvidenceBoardPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [reviewCopyStatus, setReviewCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const board = useMemo(
    () =>
      buildBuyerEvidenceBoard({
        projectBrief,
        buyerScenario,
        pilotRun,
        buyerWorkOrder,
        agentTrialEvidence,
        command,
        proofVerification,
        issuedAt,
        hrefs
      }),
    [agentTrialEvidence, buyerScenario, buyerWorkOrder, command, hrefs, issuedAt, pilotRun, projectBrief, proofVerification]
  );
  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (reviewCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setReviewCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [reviewCopyStatus]);

  async function copyMemo() {
    const copied = await onCopyText(board.memoMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function copyReviewerBrief() {
    const copied = await onCopyText(board.reviewerBrief.copyText);
    setReviewCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("buyer-evidence-board", `is-${board.status}`)} aria-labelledby="buyer-evidence-board-title">
      <div className="buyer-evidence-board-main">
        <span>
          <ShieldCheck size={15} />
          Buyer evidence board
        </span>
        <h2 id="buyer-evidence-board-title">{board.headline}</h2>
        <p>{board.summary}</p>
        <div className="buyer-evidence-board-actions" aria-label="Buyer evidence board actions">
          <a className="buyer-evidence-board-primary" href={board.primaryAction.href} {...routeAttrs(board.primaryAction.href)}>
            <ExternalLink size={14} />
            {board.primaryAction.label}
          </a>
          <a className="buyer-evidence-board-link" href={board.secondaryAction.href} {...routeAttrs(board.secondaryAction.href)}>
            <FileCheck2 size={14} />
            {board.secondaryAction.label}
          </a>
          {board.publicPageAction ? (
            <a className="buyer-evidence-board-link" href={board.publicPageAction.href} {...routeAttrs(board.publicPageAction.href)}>
              <Globe2 size={14} />
              {board.publicPageAction.label}
            </a>
          ) : null}
          <button className={cx("buyer-evidence-board-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyMemo}>
            <ClipboardCheck size={14} />
            {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy memo"}
          </button>
          <button className="buyer-evidence-board-link" type="button" data-download="buyer-evidence-board.md" data-download-filename="buyer-evidence-board.md" onClick={() => downloadTextFile("buyer-evidence-board.md", board.memoMarkdown)}>
            <Download size={14} />
            Memo
          </button>
          <button className="buyer-evidence-board-link" type="button" data-download={`${board.receipt.receiptId}.json`} data-download-filename={`${board.receipt.receiptId}.json`} onClick={() => downloadJsonFile(`${board.receipt.receiptId}.json`, board.receipt)}>
            <Download size={14} />
            Receipt
          </button>
        </div>
      </div>
      <aside className="buyer-evidence-board-score" aria-label="Buyer evidence score">
        <span>{board.status}</span>
        <strong>{board.score}</strong>
        <small>{board.readyCount}/{board.itemCount} lanes ready</small>
      </aside>
      <div className="buyer-evidence-board-rule" aria-label="Buyer evidence decision rule">
        <strong>{board.firstBlocker ? board.firstBlocker.label : "All lanes clear"}</strong>
        <p>{board.decisionRule}</p>
      </div>
      <div className="buyer-evidence-board-reviewer" aria-label="Reviewer decision brief">
        <div className="buyer-evidence-board-reviewer-main">
          <span>
            <ClipboardCheck size={15} />
            Reviewer decision brief
          </span>
          <strong>{board.reviewerBrief.title}</strong>
          <p>{board.reviewerBrief.meetingGoal}</p>
          <small>No-send rule: {board.reviewerBrief.noSendRule}</small>
          <button className={cx("buyer-evidence-board-link", reviewCopyStatus === "copied" && "is-confirmed", reviewCopyStatus === "failed" && "is-risk")} type="button" onClick={copyReviewerBrief}>
            <ClipboardCheck size={14} />
            {reviewCopyStatus === "copied" ? "Copied" : reviewCopyStatus === "failed" ? "Failed" : "Copy brief"}
          </button>
        </div>
        <div className="buyer-evidence-board-questions" aria-label="Reviewer questions">
          {board.reviewerBrief.questions.map((question) => (
            <a key={question.id} className={question.status} href={question.href} {...routeAttrs(question.href)}>
              <span>
                {statusIcon(question.status)}
                {question.label}
              </span>
              <strong>{question.question}</strong>
              <p>{question.answer}</p>
              <small>{question.nextAction}</small>
            </a>
          ))}
        </div>
      </div>
      <div className="buyer-evidence-board-items" aria-label="Buyer evidence lanes">
        {board.items.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeAttrs(item.href)}>
            <span>
              {statusIcon(item.status)}
              {item.label}
            </span>
            <strong>{item.value}</strong>
            <p>{item.evidence}</p>
            <small>{item.owner}: {item.nextAction}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
