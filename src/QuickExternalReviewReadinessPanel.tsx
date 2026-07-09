import { CalendarDays, Copy, Crosshair, Download, ExternalLink, FileText, Gauge, Send, ShieldCheck } from "lucide-react";
import type { QuickBuyerDecisionSuccessCommitment, QuickExternalReviewReadiness, QuickValueRealizationCalendarExport } from "./QuickWorkflowIntakePanel";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";

type QuickLiveProofStatus = "idle" | "checking" | "checked" | "failed";
type QuickProofLinkId = "targetUrl" | "protopediaUrl" | "videoUrl" | "pilotEvidenceUrl" | "workOrderEvidenceUrl";

type QuickExternalReviewReadinessPanelProps = {
  readiness: QuickExternalReviewReadiness;
  decisionSuccessCommitment?: QuickBuyerDecisionSuccessCommitment | null;
  valueRealizationCalendarExport?: QuickValueRealizationCalendarExport | null;
  repairValue?: string;
  proofVerifyStatus?: QuickLiveProofStatus;
  sendCopyLabel?: string;
  onRepairValueChange?: (id: QuickProofLinkId, value: string) => void;
  onVerifyProofLinks?: () => void;
  onCopySendPacket?: () => void;
};

const QUICK_LIVE_PROOF_AUDIT_ID = "quick-live-proof-audit";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function liveProofButtonLabel(status: QuickLiveProofStatus) {
  if (status === "checking") return "Checking links";
  if (status === "checked") return "Recheck live proof";
  if (status === "failed") return "Retry live proof";
  return "Check live proof";
}

function storeReceiptVerifierRequest(requestKey: string, verificationRequestJson: string) {
  if (typeof window === "undefined") return;
  const storageKey = `receipt-verifier-request:${requestKey}`;
  try {
    window.localStorage.setItem(storageKey, verificationRequestJson);
  } catch {
    // Session storage keeps the verifier handoff usable when local storage is unavailable.
  }
  try {
    window.sessionStorage.setItem(storageKey, verificationRequestJson);
  } catch {
    // The verifier page can still fall back to its sample request.
  }
}

export default function QuickExternalReviewReadinessPanel({
  readiness,
  decisionSuccessCommitment = null,
  valueRealizationCalendarExport = null,
  repairValue = "",
  proofVerifyStatus = "idle",
  sendCopyLabel = "Copy message",
  onRepairValueChange,
  onVerifyProofLinks,
  onCopySendPacket
}: QuickExternalReviewReadinessPanelProps) {
  const repairProofLinkId = readiness.repairPath?.proofLinkId ?? null;
  const repairPlaceholder = readiness.repairPath?.sampleValue || PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl;
  const canRunLiveProof = Boolean(readiness.repairPath?.href === `#${QUICK_LIVE_PROOF_AUDIT_ID}` && onVerifyProofLinks);
  const valueRunway = readiness.sendPacket ? decisionSuccessCommitment?.valueRealizationLedger : null;

  return (
    <div className={cx("quick-external-review-readiness", readiness.status)} aria-label="External review readiness">
      <div className="quick-external-review-readiness-main">
        <span>
          <ShieldCheck size={14} />
          {readiness.label}
        </span>
        <strong>{readiness.headline}</strong>
        <p>{readiness.summary}</p>
        <small>{readiness.receiptLine}</small>
        <div className="quick-external-review-readiness-actions" aria-label="External review readiness actions">
          <a href={readiness.exportHref} download="quick-external-review-readiness.md">
            <Download size={14} />
            Readiness memo
          </a>
          <a href={readiness.primaryHref} download={readiness.primaryHref.startsWith("data:text") ? "quick-external-review-next-action.md" : undefined}>
            <ExternalLink size={14} />
            Next action
          </a>
          <a
            href={readiness.verifyHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => storeReceiptVerifierRequest(readiness.manifestVerificationStorageKey, readiness.manifestVerificationRequestJson)}
          >
            <ShieldCheck size={14} />
            Verify manifest
          </a>
        </div>
      </div>
      <aside className="quick-external-review-readiness-score" aria-label="External review readiness score">
        <span>{readiness.clearance}</span>
        <strong>{readiness.scoreLine}</strong>
        <small>{readiness.primaryAction}</small>
        <small>{readiness.manifestLine}</small>
      </aside>
      {readiness.sendPacket && (
        <div className={cx("quick-external-review-send-packet", readiness.status)} aria-label="Reviewer send packet">
          <div className="quick-external-review-send-packet-main">
            <span>
              <Send size={14} />
              Reviewer send packet
            </span>
            <strong>{readiness.sendPacket.headline}</strong>
            <p>{readiness.sendPacket.summary}</p>
            <small>{readiness.sendPacket.proofWindow}</small>
            <div className="quick-external-review-send-packet-actions" aria-label="Reviewer send packet actions">
              {onCopySendPacket && (
                <button type="button" onClick={onCopySendPacket}>
                  <Copy size={14} />
                  {sendCopyLabel}
                </button>
              )}
              <a href={readiness.primaryHref} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Review desk
              </a>
              <a
                href={readiness.verifyHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => storeReceiptVerifierRequest(readiness.manifestVerificationStorageKey, readiness.manifestVerificationRequestJson)}
              >
                <ShieldCheck size={14} />
                Verify manifest
              </a>
              <a href={readiness.exportHref} download="quick-external-reviewer-send-packet.md">
                <Download size={14} />
                Send packet
              </a>
            </div>
          </div>
          <div className="quick-external-review-send-packet-message">
            <span>{readiness.sendPacket.subject}</span>
            <pre role="textbox" aria-readonly="true" tabIndex={0} aria-label="External reviewer send message">
              {readiness.sendPacket.messageText}
            </pre>
          </div>
          <div className="quick-external-review-send-packet-attachments" aria-label="Reviewer send packet attachments">
            {readiness.sendPacket.attachments.slice(0, 4).map((attachment) => (
              <a key={attachment.label} href={attachment.href} download={attachment.download}>
                <span>{attachment.label}</span>
                <strong>{attachment.detail}</strong>
              </a>
            ))}
          </div>
        </div>
      )}
      {valueRunway && (
        <div className={cx("quick-external-review-value-runway", valueRunway.status)} aria-label="Post-review value runway">
          <div className="quick-external-review-value-runway-main">
            <span>
              <Gauge size={14} />
              Post-review value runway
            </span>
            <strong>{valueRunway.headline}</strong>
            <p>{valueRunway.summary}</p>
            <small>
              {decisionSuccessCommitment?.reviewWindow} / {decisionSuccessCommitment?.retainedValueLine}
            </small>
            <div className="quick-external-review-value-runway-actions" aria-label="Post-review value runway actions">
              {decisionSuccessCommitment && (
                <a href={decisionSuccessCommitment.exportHref} download="quick-buyer-success-commitment.md">
                  <Download size={14} />
                  Success plan
                </a>
              )}
              <a href={valueRunway.taskCsvHref} download="quick-value-realization-ledger.csv">
                <Download size={14} />
                Value CSV
              </a>
              {valueRealizationCalendarExport && (
                <a href={valueRealizationCalendarExport.icsHref} download="quick-value-realization-calendar.ics">
                  <CalendarDays size={14} />
                  Calendar
                </a>
              )}
              <a href={valueRunway.receiptHref} download="quick-value-realization-receipt.json">
                <FileText size={14} />
                Ledger receipt
              </a>
            </div>
          </div>
          <aside className="quick-external-review-value-runway-next" aria-label="Post-review value runway next action">
            <span>Next owner</span>
            <strong>{valueRunway.nextOwner}</strong>
            <p>{valueRunway.nextAction}</p>
            <small>
              {valueRunway.readyCount}/4 tasks ready / {valueRunway.receipt.receiptId}
            </small>
          </aside>
          <div className="quick-external-review-value-runway-tasks" aria-label="Post-review value runway tasks">
            {valueRunway.tasks.map((task) => (
              <a key={task.id} className={task.status} href={task.href} download={task.href.startsWith("data:text") ? `quick-${task.id}.md` : undefined}>
                <span>{task.window}</span>
                <strong>{task.label}</strong>
                <p>{task.owner}</p>
                <small>{task.closeCriteria}</small>
              </a>
            ))}
          </div>
        </div>
      )}
      {readiness.repairPath && (
        <div className={cx("quick-external-review-repair-path", readiness.repairPath.projectedStatus)} aria-label="External review repair path">
          <div className="quick-external-review-repair-path-main">
            <span>
              <Crosshair size={14} />
              {readiness.repairPath.label}
            </span>
            <strong>{readiness.repairPath.headline}</strong>
            <p>{readiness.repairPath.summary}</p>
            <small>
              {readiness.repairPath.currentScore}/100 now to {readiness.repairPath.projectedScore}/100 after {readiness.repairPath.targetLabel}
              {readiness.repairPath.scoreDelta > 0 ? ` (+${readiness.repairPath.scoreDelta})` : ""}
            </small>
            <div className="quick-external-review-repair-path-actions" aria-label="External review repair actions">
              <a href={readiness.repairPath.href}>
                <Crosshair size={14} />
                Open repair
              </a>
              <a href={readiness.repairPath.exportHref} download="quick-external-review-repair-command.txt">
                <Download size={14} />
                Owner command
              </a>
              {canRunLiveProof && (
                <button type="button" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
                  <ShieldCheck size={14} />
                  {liveProofButtonLabel(proofVerifyStatus)}
                </button>
              )}
              {repairProofLinkId && onRepairValueChange && (
                <label className="quick-external-review-repair-inline-input">
                  <span>Repair URL</span>
                  <input
                    type="url"
                    value={repairValue}
                    placeholder={repairPlaceholder}
                    aria-label={`${readiness.repairPath.targetLabel} repair URL`}
                    onChange={(event) => onRepairValueChange(repairProofLinkId, event.currentTarget.value)}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="quick-external-review-repair-path-checks" aria-label="External review repair acceptance criteria">
            {readiness.repairPath.acceptanceCriteria.slice(0, 3).map((criterion) => (
              <article key={criterion}>
                <span>{readiness.repairPath?.owner}</span>
                <strong>{criterion}</strong>
              </article>
            ))}
          </div>
          <div className="quick-external-review-repair-path-next" aria-label="External review repair next checks">
            <article>
              <span>Next after repair</span>
              <strong>{readiness.repairPath.nextAction}</strong>
            </article>
            <article>
              <span>Verification</span>
              <strong>{readiness.repairPath.verificationLabel}</strong>
            </article>
          </div>
        </div>
      )}
      <div className="quick-external-review-readiness-items" aria-label="External review readiness chain">
        {readiness.items.map((item) => (
          <a key={item.id} className={item.status} href={item.href} download={item.href.startsWith("data:text") ? `quick-${item.id}.md` : undefined}>
            <span>{item.status === "ready" ? "Ready" : item.status === "watch" ? "Review" : "Blocked"}</span>
            <strong>{item.label}</strong>
            <p>{item.value}</p>
            <small>{item.detail}</small>
            <em>{item.action}</em>
          </a>
        ))}
      </div>
    </div>
  );
}
