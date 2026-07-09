import { ClipboardCheck, Download, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadHrefFile } from "./downloadArtifact";
import { launchRoomHandoffCopyText, type LaunchRoom } from "./launchRoom";

type BuyerLaunchHandoffComposerProps = {
  launchRoom: LaunchRoom;
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isDataHref(href: string) {
  return href.startsWith("data:");
}

export default function BuyerLaunchHandoffComposer({ launchRoom, onCopyText }: BuyerLaunchHandoffComposerProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [receiptCopyStatus, setReceiptCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const handoffPacket = launchRoom.handoffPacket;
  const buyerCoverSheet = launchRoom.buyerCoverSheet;
  const activityTrail = launchRoom.buyerActivityTrail;
  const copyLabel = copyStatus === "copied" ? "Copied handoff" : copyStatus === "failed" ? "Copy failed" : "Copy buyer handoff";
  const receiptCopyLabel = receiptCopyStatus === "copied" ? "Copied receipt" : receiptCopyStatus === "failed" ? "Copy failed" : "Copy receipt";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (receiptCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setReceiptCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [receiptCopyStatus]);

  async function copyHandoff() {
    const copied = await onCopyText(launchRoomHandoffCopyText(launchRoom));
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function copyReceipt() {
    const copied = await onCopyText(handoffPacket.decisionReceipt.copyText);
    setReceiptCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section className={cx("buyer-launch-handoff", handoffPacket.status)} aria-label="Buyer handoff composer">
      <div className="buyer-launch-handoff-head">
        <div>
          <span>Buyer handoff composer</span>
          <strong>{handoffPacket.subject}</strong>
          <p>{handoffPacket.sendInstruction}</p>
        </div>
        <div className="buyer-launch-handoff-actions">
          <span>{launchRoom.buyerDecision.verdict}</span>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyHandoff}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
        </div>
      </div>
      <div className="buyer-launch-handoff-grid">
        <article className="buyer-launch-handoff-email">
          <span>Suggested email</span>
          <strong>{handoffPacket.preview}</strong>
          <p>{handoffPacket.emailBody[1]}</p>
        </article>
        <div className="buyer-launch-handoff-list" aria-label="Buyer review agenda">
          <span>Review agenda</span>
          {handoffPacket.agenda.map((item) => (
            <article key={item.id}>
              <strong>
                {item.duration} / {item.label}
              </strong>
              <small>
                {item.owner}: {item.proof}
              </small>
            </article>
          ))}
        </div>
        <div className="buyer-launch-handoff-list" aria-label="Handoff acceptance checks">
          <span>Acceptance checks</span>
          {handoffPacket.acceptanceChecks.map((check) => (
            <article key={check.id} className={check.status}>
              <strong>{check.label}</strong>
              <small>
                {check.status}: {check.evidence}
              </small>
            </article>
          ))}
        </div>
        <div className="buyer-launch-handoff-list buyer-launch-handoff-routes" aria-label="Buyer reply router">
          <span>Reply router</span>
          {handoffPacket.replyRoutes.map((route) => (
            <article key={route.id} className={cx(route.status, route.id === handoffPacket.recommendedReply && "recommended")}>
              <strong>{route.label}</strong>
              <p>{route.record}</p>
              <small>
                {route.owner}: {route.nextAction}
              </small>
            </article>
          ))}
        </div>
      </div>
      <section className={cx("buyer-launch-forward-pack", buyerCoverSheet.status)} aria-label="Stakeholder brief forwarding pack">
        <div className="buyer-launch-forward-head">
          <div>
            <span>Forwarding pack</span>
            <strong>{buyerCoverSheet.headline}</strong>
            <p>{buyerCoverSheet.primaryAsk}</p>
          </div>
          <button className="icon-link" type="button" data-download="buyer-cover-sheet.md" data-download-filename="buyer-cover-sheet.md" onClick={() => downloadHrefFile("buyer-cover-sheet.md", buyerCoverSheet.href)}>
            <Download size={14} />
            Cover sheet
          </button>
        </div>
        <div className="buyer-launch-cover-signals" aria-label="Buyer cover signals">
          {buyerCoverSheet.signals.map((signal) => (
            <article key={signal.id} className={signal.status}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <small>{signal.evidence}</small>
              <a href={signal.href}>
                <ExternalLink size={13} />
                Open proof
              </a>
            </article>
          ))}
        </div>
        <div className="buyer-launch-stakeholders" aria-label="Stakeholder briefs">
          {launchRoom.stakeholderBriefs.map((brief) => (
            <article key={brief.id} className={brief.status}>
              <div>
                <span>{brief.status}</span>
                <strong>{brief.role}</strong>
              </div>
              <p>{brief.decisionAsk}</p>
              <dl>
                <dt>Owner</dt>
                <dd>{brief.owner}</dd>
                <dt>Proof</dt>
                <dd>{brief.proofToOpen}</dd>
                <dt>Concern</dt>
                <dd>{brief.concern}</dd>
                <dt>Next</dt>
                <dd>{brief.nextAction}</dd>
              </dl>
              <div className="buyer-launch-stakeholder-actions">
                <a href={brief.artifactHref}>
                  <ExternalLink size={13} />
                  Open proof
                </a>
                <button type="button" data-download={`launch-room-${brief.id}-brief.md`} data-download-filename={`launch-room-${brief.id}-brief.md`} onClick={() => downloadHrefFile(`launch-room-${brief.id}-brief.md`, brief.href)}>
                  <Download size={13} />
                  Download brief
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section id="buyer-launch-activity-trail" className={cx("buyer-launch-activity-trail", activityTrail.status)} aria-label="Buyer activity trail">
        <div className="buyer-launch-activity-head">
          <div>
            <span>Buyer activity trail</span>
            <strong>{activityTrail.headline}</strong>
            <p>{activityTrail.summary}</p>
          </div>
          <aside>
            <span>Next owner</span>
            <strong>{activityTrail.nextOwner}</strong>
            <small>{activityTrail.nextAction}</small>
            <button className="icon-link" type="button" data-download="buyer-activity-trail.md" data-download-filename="buyer-activity-trail.md" onClick={() => downloadHrefFile("buyer-activity-trail.md", activityTrail.href)}>
              <Download size={14} />
              Download trail
            </button>
            <button className="icon-link" type="button" data-download="buyer-follow-up-crm-note.md" data-download-filename="buyer-follow-up-crm-note.md" onClick={() => downloadHrefFile("buyer-follow-up-crm-note.md", activityTrail.crmNoteHref)}>
              <Download size={14} />
              CRM note
            </button>
            <button className="icon-link" type="button" data-download="buyer-follow-up-slack-update.txt" data-download-filename="buyer-follow-up-slack-update.txt" onClick={() => downloadHrefFile("buyer-follow-up-slack-update.txt", activityTrail.slackUpdateHref)}>
              <Download size={14} />
              Slack update
            </button>
            <button className="icon-link" type="button" data-download="buyer-follow-up-tasks.csv" data-download-filename="buyer-follow-up-tasks.csv" onClick={() => downloadHrefFile("buyer-follow-up-tasks.csv", activityTrail.taskCsvHref)}>
              <Download size={14} />
              Task CSV
            </button>
            <small>
              Follow-up receipt {activityTrail.followUpReceipt.checksumAlgorithm}:{activityTrail.followUpReceipt.checksum}
            </small>
            <button className="icon-link" type="button" data-download="buyer-follow-up-receipt.md" data-download-filename="buyer-follow-up-receipt.md" onClick={() => downloadHrefFile("buyer-follow-up-receipt.md", activityTrail.followUpReceipt.href)}>
              <Download size={14} />
              Follow-up receipt
            </button>
            <button
              className="icon-link"
              type="button"
              data-download="buyer-follow-up-replay-payload.json"
              data-download-filename="buyer-follow-up-replay-payload.json"
              onClick={() => downloadHrefFile("buyer-follow-up-replay-payload.json", activityTrail.followUpReceipt.payloadHref)}
            >
              <Download size={14} />
              Replay payload
            </button>
          </aside>
        </div>
        <div className="buyer-launch-activity-events">
          {activityTrail.events.map((event, index) => (
            <article key={event.id} className={event.status}>
              <span>
                {String(index + 1).padStart(2, "0")} / {event.status}
              </span>
              <strong>{event.label}</strong>
              <p>{event.signal}</p>
              <small>
                {event.actor}: {event.nextAction}
              </small>
              <a href={isDataHref(event.href) ? "#buyer-launch-activity-trail" : event.href}>
                <ExternalLink size={13} />
                Open trail link
              </a>
            </article>
          ))}
        </div>
      </section>
      <div className={cx("buyer-launch-handoff-receipt", handoffPacket.decisionReceipt.status)} aria-label="Handoff decision receipt">
        <div>
          <span>Decision receipt</span>
          <strong>{handoffPacket.decisionReceipt.receiptId}</strong>
          <p>{handoffPacket.decisionReceipt.record}</p>
          <small>
            {handoffPacket.decisionReceipt.verification.status} / {handoffPacket.decisionReceipt.checksumAlgorithm}:{handoffPacket.decisionReceipt.checksum}
          </small>
          <small className="buyer-launch-handoff-receipt-api">POST {handoffPacket.decisionReceipt.verificationApiPath}</small>
        </div>
        <div className="buyer-launch-handoff-receipt-actions">
          <button
            className="icon-link"
            type="button"
            data-download="launch-room-handoff-decision-receipt.md"
            data-download-filename="launch-room-handoff-decision-receipt.md"
            onClick={() => downloadHrefFile("launch-room-handoff-decision-receipt.md", handoffPacket.decisionReceipt.href)}
          >
            <Download size={14} />
            Download receipt
          </button>
          <button
            className="icon-link"
            type="button"
            data-download="launch-room-handoff-replay-payload.json"
            data-download-filename="launch-room-handoff-replay-payload.json"
            onClick={() => downloadHrefFile("launch-room-handoff-replay-payload.json", handoffPacket.decisionReceipt.payloadHref)}
          >
            <Download size={14} />
            Download payload
          </button>
          <button className={cx("icon-link", receiptCopyStatus === "copied" && "is-confirmed", receiptCopyStatus === "failed" && "is-risk")} type="button" onClick={copyReceipt}>
            <ClipboardCheck size={14} />
            {receiptCopyLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
