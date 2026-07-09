import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, Scale } from "lucide-react";
import type { BuyerPilotContractSnapshot, BuyerProofChainAction } from "./App";
import { downloadTextFile } from "./downloadArtifact";

type BuyerPilotStatus = BuyerPilotContractSnapshot["status"];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: BuyerProofChainAction) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function statusIcon(status: BuyerPilotStatus) {
  if (status === "ready") return <BadgeCheck size={14} />;
  if (status === "attention") return <AlertTriangle size={14} />;
  return <Crosshair size={14} />;
}

function sendStatusLabel(status: BuyerPilotStatus) {
  if (status === "ready") return "Sendable";
  if (status === "attention") return "Owner review";
  return "Internal draft";
}

function compactHref(href: string) {
  if (href.startsWith("data:")) return "inline-data";
  try {
    const url = new URL(href, "https://example.test");
    return `${url.pathname}${url.hash}`;
  } catch {
    return href;
  }
}

export function BuyerPilotSendNotePanel({
  snapshot,
  onCopyText
}: {
  snapshot: BuyerPilotContractSnapshot;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const sendNote = snapshot.sendNote;
  const openItems = snapshot.closeChecklist.filter((item) => item.status !== "ready");
  const readyAttachmentCount = sendNote.attachments.filter((attachment) => attachment.status === "ready").length;
  const copyLabel = copyStatus === "copied" ? "Copied note" : copyStatus === "failed" ? "Copy failed" : "Copy send note";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copySendNote() {
    const copied = await onCopyText(sendNote.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section id="buyer-pilot-send-note" className={cx("buyer-pilot-send-note-card", `is-${sendNote.status}`)} aria-labelledby="buyer-pilot-send-note-title">
      <div className="buyer-pilot-send-note-main">
        <span>
          <FileText size={14} />
          Buyer send brief
        </span>
        <h2 id="buyer-pilot-send-note-title">{sendNote.subject}</h2>
        <p>{sendNote.instruction}</p>
        <div className="buyer-pilot-send-note-actions" aria-label="Buyer send brief actions">
          <a className="buyer-pilot-send-note-primary" href={snapshot.firstAction.href} {...routeActionAttrs(snapshot.firstAction)}>
            {sendNote.status === "ready" ? <Scale size={14} /> : <Crosshair size={14} />}
            {snapshot.firstAction.label}
          </a>
          <a className="icon-link" href={snapshot.reviewAction.href} {...routeActionAttrs(snapshot.reviewAction)}>
            <ExternalLink size={14} />
            {snapshot.reviewAction.label}
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copySendNote}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <button type="button" className="icon-link" data-download-filename="buyer-send-note.txt" onClick={() => downloadTextFile("buyer-send-note.txt", sendNote.copyText)}>
            <Download size={14} />
            Export note
          </button>
        </div>
      </div>

      <aside className="buyer-pilot-send-note-readiness" aria-label="Buyer send brief readiness">
        <span>{sendStatusLabel(sendNote.status)}</span>
        <strong>
          {readyAttachmentCount}/{sendNote.attachments.length}
        </strong>
        <small>{readyAttachmentCount === sendNote.attachments.length ? "attachments ready" : "attachments need review"}</small>
      </aside>

      <div className={cx("buyer-pilot-contract-send", sendNote.status)} aria-label="Suggested buyer send note">
        <div className="buyer-pilot-contract-send-note">
          <span>Suggested message</span>
          <strong>{sendNote.body[0]}</strong>
          <p>{sendNote.body[1]}</p>
          <small>{sendNote.body[2]}</small>
        </div>
        <div className="buyer-pilot-contract-send-body" aria-label="Send note body">
          {sendNote.body.slice(3).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="buyer-pilot-contract-attachments" aria-label="Send note attachments">
          {sendNote.attachments.map((attachment) => (
            <a key={attachment.id} className={attachment.status} href={attachment.href}>
              <span>
                {statusIcon(attachment.status)}
                {attachment.label}
              </span>
              <strong>{compactHref(attachment.href)}</strong>
              <small>{attachment.evidence}</small>
            </a>
          ))}
        </div>
      </div>

      <div className="buyer-pilot-send-note-redlines" aria-label="Buyer send brief red lines">
        {openItems.length ? (
          openItems.slice(0, 3).map((item) => (
            <a key={item.id} className={item.status} href={item.href}>
              <span>
                {statusIcon(item.status)}
                Open blocker
              </span>
              <strong>{item.label}</strong>
              <p>{item.buyerDecision}</p>
              <small>
                {item.owner}: {item.evidence}
              </small>
            </a>
          ))
        ) : (
          <article>
            <span>
              <BadgeCheck size={14} />
              Send rule clear
            </span>
            <strong>{snapshot.stopRule}</strong>
            <p>The buyer can receive the launch room with the send note and five proof attachments.</p>
          </article>
        )}
      </div>
    </section>
  );
}

export default BuyerPilotSendNotePanel;
