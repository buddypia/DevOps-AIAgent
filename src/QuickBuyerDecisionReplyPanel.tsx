import { ClipboardCheck, Copy, Download, ExternalLink, FileText, Rocket, Send, ShieldCheck } from "lucide-react";
import type {
  QuickBuyerDecisionActivationBrief,
  QuickBuyerDecisionReplyDeck,
  QuickBuyerDecisionReplyRecord
} from "./QuickWorkflowIntakePanel";
import { buildQuickBuyerDecisionReplyHandoff } from "./quickBuyerDecisionReplyHandoff";

type QuickBuyerDecisionReplyPanelProps = {
  replyPathId: string;
  decisionReplyDeck: QuickBuyerDecisionReplyDeck;
  buyerReplyText: string;
  setBuyerReplyText: (value: string) => void;
  decisionReplyRecord: QuickBuyerDecisionReplyRecord | null;
  decisionReplyReviewKitHref: string;
  decisionReplyAcceptancePathHref: string;
  decisionActivationBrief: QuickBuyerDecisionActivationBrief | null;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

export default function QuickBuyerDecisionReplyPanel({
  replyPathId,
  decisionReplyDeck,
  buyerReplyText,
  setBuyerReplyText,
  decisionReplyRecord,
  decisionReplyReviewKitHref,
  decisionReplyAcceptancePathHref,
  decisionActivationBrief
}: QuickBuyerDecisionReplyPanelProps) {
  const recommendedReply = decisionReplyDeck.options.find((option) => option.id === decisionReplyDeck.recommendedOptionId);
  const replyHandoff = decisionReplyRecord ? buildQuickBuyerDecisionReplyHandoff(decisionReplyRecord) : null;

  return (
    <>
      <div id={replyPathId} className={cx("quick-buyer-decision-reply-path", decisionReplyDeck.status)} aria-label="Buyer decision reply path">
        <div className="quick-buyer-decision-reply-path-main">
          <span>
            <Send size={14} />
            {decisionReplyDeck.label}
          </span>
          <strong>{decisionReplyDeck.headline}</strong>
          <p>{decisionReplyDeck.summary}</p>
          <small>
            One-pager receipt {decisionReplyDeck.onePagerReceiptId} / {decisionReplyDeck.onePagerChecksum}
          </small>
          <div className="quick-buyer-decision-reply-path-actions" aria-label="Buyer reply path actions">
            <a href={decisionReplyDeck.exportHref} download="quick-buyer-decision-reply-path.md">
              <Download size={14} />
              Reply path
            </a>
            {decisionReplyDeck.options
              .filter((option) => option.recommended)
              .map((option) => (
                <a key={option.id} href={option.mailtoHref}>
                  <Send size={14} />
                  Draft {option.label}
                </a>
              ))}
          </div>
        </div>
        <div className="quick-buyer-decision-reply-options" aria-label="Buyer decision reply options">
          {decisionReplyDeck.options.map((option) => (
            <article key={option.id} className={cx(option.status, option.recommended && "is-recommended")}>
              <span>{option.label}</span>
              <strong>{option.headline}</strong>
              <p>{option.buyerSays}</p>
              <small>
                {option.nextOwner}: {option.nextAction}
              </small>
            </article>
          ))}
        </div>
      </div>
      <div className={cx("quick-buyer-decision-reply-recorder", decisionReplyRecord?.status)} aria-label="Buyer decision reply recorder">
        <div className="quick-buyer-decision-reply-recorder-main">
          <span>
            <ClipboardCheck size={14} />
            Reply recorder
          </span>
          <strong>{decisionReplyRecord ? decisionReplyRecord.headline : "Paste the buyer reply to record the decision"}</strong>
          <p>
            {decisionReplyRecord
              ? decisionReplyRecord.summary
              : "Convert a buyer email or chat reply into continue, revise, or stop with an owner action and checksum receipt."}
          </p>
          <label>
            <span>Buyer reply text</span>
            <textarea
              value={buyerReplyText}
              onChange={(event) => setBuyerReplyText(event.target.value)}
              placeholder="Approved. Continue with the bounded pilot after live proof verification."
            />
          </label>
        </div>
        {decisionReplyRecord && replyHandoff ? (
          <div className="quick-buyer-decision-reply-record" aria-label="Recorded buyer reply">
            <span>{decisionReplyRecord.label}</span>
            <strong>
              {decisionReplyRecord.decision} / {decisionReplyRecord.confidence}/100 confidence
            </strong>
            <small>
              {decisionReplyRecord.nextOwner}: {decisionReplyRecord.nextAction}
            </small>
            <small>
              {decisionReplyRecord.receipt.receiptId} / {decisionReplyRecord.receipt.checksumAlgorithm}:{decisionReplyRecord.receipt.checksum}
            </small>
            <div className="quick-buyer-decision-reply-record-actions" aria-label="Recorded reply actions">
              <a href={decisionReplyRecord.exportHref} download="quick-buyer-decision-reply-record.md">
                <Download size={14} />
                Reply record
              </a>
              <a href={decisionReplyRecord.receiptHref} download={`${decisionReplyRecord.receipt.receiptId}.json`}>
                <ShieldCheck size={14} />
                Verify JSON
              </a>
              <a href={decisionReplyRecord.verifierHref} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Verifier
              </a>
              <a href={decisionReplyReviewKitHref} target="_blank" rel="noreferrer">
                <FileText size={14} />
                Review kit
              </a>
              <a href={decisionReplyAcceptancePathHref} target="_blank" rel="noreferrer">
                <Rocket size={14} />
                Acceptance path
              </a>
              <a href={decisionReplyRecord.activation.exportHref} download="quick-buyer-decision-activation.md">
                <ClipboardCheck size={14} />
                Work order
              </a>
            </div>
            <div className={cx("quick-buyer-decision-reply-handoff", replyHandoff.status)} aria-label="Buyer reply action packet">
              <div className="quick-buyer-decision-reply-handoff-head">
                <div>
                  <span>
                    <FileText size={14} />
                    Action packet
                  </span>
                  <strong>{replyHandoff.headline}</strong>
                  <p>{replyHandoff.summary}</p>
                </div>
                <button type="button" onClick={() => copyText(replyHandoff.copyText)}>
                  <Copy size={14} />
                  Copy packet
                </button>
              </div>
              <div className="quick-buyer-decision-reply-handoff-steps">
                {replyHandoff.steps.map((step) => (
                  <a
                    key={step.id}
                    className={step.status}
                    href={step.href}
                    download={step.href.startsWith("data:") ? `quick-${step.id}.md` : undefined}
                  >
                    <span>{step.label}</span>
                    <strong>{step.owner}</strong>
                    <p>{step.action}</p>
                    <small>{step.evidence}</small>
                  </a>
                ))}
              </div>
              <details className="quick-buyer-decision-reply-handoff-brief">
                <summary>Packet text</summary>
                <pre>{replyHandoff.copyText}</pre>
              </details>
            </div>
            <ul>
              {decisionReplyRecord.matchedSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="quick-buyer-decision-reply-record is-empty" aria-label="Reply recorder empty state">
            <span>{decisionReplyDeck.label}</span>
            <strong>Waiting for buyer reply</strong>
            <small>Suggested reply: {recommendedReply?.label ?? "Revise"}</small>
            {recommendedReply && <p>{recommendedReply.replyText}</p>}
          </div>
        )}
      </div>
      {decisionActivationBrief && (
        <div className={cx("quick-buyer-decision-activation", decisionActivationBrief.status)} aria-label="Buyer decision activation brief">
          <div className="quick-buyer-decision-activation-main">
            <span>
              <ClipboardCheck size={14} />
              {decisionActivationBrief.label}
            </span>
            <strong>{decisionActivationBrief.headline}</strong>
            <p>{decisionActivationBrief.summary}</p>
            <small>
              {decisionActivationBrief.sourceReceiptId} / {decisionActivationBrief.sourceChecksum}
            </small>
            <div className="quick-buyer-decision-activation-actions" aria-label="Decision activation actions">
              <a href={decisionActivationBrief.exportHref} download="quick-buyer-decision-activation.md">
                <Download size={14} />
                Activation
              </a>
              <a href={decisionActivationBrief.primaryHref} download={decisionActivationBrief.primaryHref.startsWith("data:text") ? "quick-owner-brief.md" : undefined}>
                <ExternalLink size={14} />
                {decisionActivationBrief.primaryLabel}
              </a>
            </div>
          </div>
          <div className="quick-buyer-decision-activation-items" aria-label="Decision activation tasks">
            {decisionActivationBrief.items.map((item) => (
              <a key={item.id} className={item.status} href={item.href} download={item.href.startsWith("data:text") ? `quick-${item.id}.md` : undefined}>
                <span>{item.label}</span>
                <strong>{item.owner}</strong>
                <p>{item.command}</p>
                <small>{item.evidence}</small>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
