import { BadgeCheck, CalendarDays, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, Gauge, ShieldCheck } from "lucide-react";
import type {
  QuickBuyerDecisionSuccessCommitment,
  QuickBuyerRoomPreview,
  QuickValueRealizationAcceptancePacket,
  QuickValueRealizationBuyerReviewDossier,
  QuickValueRealizationCalendarExport,
  QuickValueRealizationCloseout,
  QuickValueRealizationCloseoutRepairAcknowledgement,
  QuickValueReviewExecutionCloseout,
  QuickValueReviewExecutionPacket
} from "./QuickWorkflowIntakePanel";

type QuickBuyerDecisionSuccessPanelProps = {
  roomPreview: QuickBuyerRoomPreview;
  decisionSuccessCommitment: QuickBuyerDecisionSuccessCommitment;
  valueRealizationCalendarExport: QuickValueRealizationCalendarExport | null;
  valueRealizationCloseout: QuickValueRealizationCloseout | null;
  valueRealizationCloseoutText: string;
  setValueRealizationCloseoutText: (value: string) => void;
  valueRealizationRepairAcknowledgement: QuickValueRealizationCloseoutRepairAcknowledgement | null;
  valueRealizationRepairAcknowledgementText: string;
  setValueRealizationRepairAcknowledgementText: (value: string) => void;
  valueRealizationAcceptancePacket: QuickValueRealizationAcceptancePacket | null;
  valueRealizationBuyerReviewDossier: QuickValueRealizationBuyerReviewDossier | null;
  valueReviewExecutionPacket: QuickValueReviewExecutionPacket | null;
  valueReviewExecutionCloseout: QuickValueReviewExecutionCloseout | null;
  valueReviewExecutionCloseoutText: string;
  setValueReviewExecutionCloseoutText: (value: string) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}

type QuickEvidenceGuideItem = {
  id: string;
  label: string;
  status: "ready" | "watch" | "blocked";
  owner: string;
  action: string;
  signals: string[];
  evidence: string;
};

type QuickEvidenceGuide = {
  status: "ready" | "watch" | "blocked";
  ariaLabel: string;
  label: string;
  headline: string;
  summary: string;
  copyLabel: string;
  briefText: string;
  items: QuickEvidenceGuideItem[];
};

function evidenceSignals(signals: string[]) {
  return signals.length > 0 ? signals : ["No open signal"];
}

function evidenceSignalsText(signals: string[]) {
  return evidenceSignals(signals).join(", ");
}

function copyEvidenceBrief(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

function buildCloseoutEvidenceGuide(roomPreview: QuickBuyerRoomPreview, closeout: QuickValueRealizationCloseout): QuickEvidenceGuide {
  const openTasks = closeout.tasks.filter((task) => task.status !== "ready");
  const guideTasks = openTasks.length > 0 ? openTasks : closeout.tasks;
  const briefText = [
    "Value closeout evidence brief",
    `Buyer: ${roomPreview.buyer}`,
    `Primary ask: ${roomPreview.primaryAsk}`,
    `Source ledger: ${closeout.sourceLedgerReceiptId}`,
    `Retained value target: ${formatYen(closeout.retainedValueTargetYen)}/month`,
    "",
    ...guideTasks.flatMap((task) => [
      `${task.window} ${task.label}`,
      `Owner: ${task.owner}`,
      `Required signals: ${evidenceSignalsText(task.missingSignals)}`,
      "Real proof to attach: [paste the public receipt, owner note, reviewer record, or verifier output]",
      `Acceptance check: ${task.evidence}`,
      ""
    ]),
    "Do not submit this as evidence until every bracketed proof source is replaced with real buyer evidence."
  ].join("\n");

  return {
    status: closeout.status,
    ariaLabel: "Value closeout evidence guide",
    label: "Value closeout evidence guide",
    headline: openTasks.length === 0 ? "All closeout proof signals are present" : `${openTasks.length} closeout proof item${openTasks.length === 1 ? "" : "s"} need owner evidence`,
    summary:
      openTasks.length === 0
        ? "The operating evidence field has enough Day 0/7/14/30 signals for buyer-verifiable closeout."
        : "Use this brief to collect the exact missing signals without inventing proof in the evidence field.",
    copyLabel: "Copy closeout brief",
    briefText,
    items: guideTasks.map((task) => ({
      id: task.id,
      label: `${task.window} ${task.label}`,
      status: task.status,
      owner: task.owner,
      action: task.outcome,
      signals: evidenceSignals(task.missingSignals),
      evidence: task.evidence
    }))
  };
}

function buildExecutionEvidenceGuide(executionPacket: QuickValueReviewExecutionPacket, closeout: QuickValueReviewExecutionCloseout): QuickEvidenceGuide {
  const openTasks = closeout.tasks.filter((task) => task.status !== "ready");
  const guideTasks = openTasks.length > 0 ? openTasks : closeout.tasks;
  const sourceReady = executionPacket.status === "ready" && executionPacket.receipt.verification.status === "verified";
  const briefText = [
    "Value review execution completion brief",
    `Execution receipt: ${executionPacket.receipt.receiptId}`,
    `Execution decision: ${executionPacket.decision}`,
    `Acceptance receipt: ${executionPacket.receipt.payload.sourceAcceptanceReceiptId}`,
    `Closeout receipt: ${executionPacket.receipt.payload.sourceCloseoutReceiptId}`,
    "",
    ...guideTasks.flatMap((task) => [
      `${task.dueWindow} ${task.label}`,
      `Owner: ${task.owner}`,
      `Required signals: ${evidenceSignalsText(task.missingSignals)}`,
      "Real proof to attach: [paste the decision record, calendar entry, verifier output, or executive brief URL]",
      `Acceptance check: ${task.acceptance}`,
      ""
    ]),
    sourceReady
      ? "Paste completed proof into the completion evidence field only after these owner records are real."
      : "Do not ask for completion proof until the execution packet is ready and verified."
  ].join("\n");

  return {
    status: closeout.status,
    ariaLabel: "Execution evidence guide",
    label: "Execution evidence guide",
    headline: !sourceReady
      ? "Execution proof is locked until the packet is ready"
      : openTasks.length === 0
        ? "All execution completion signals are present"
        : `${openTasks.length} execution proof item${openTasks.length === 1 ? "" : "s"} still need evidence`,
    summary: sourceReady
      ? "Collect only real decision, owner, calendar, and executive-brief proof before accepting execution closeout."
      : "The execution closeout field should stay empty until the source execution receipt verifies.",
    copyLabel: "Copy execution brief",
    briefText,
    items: guideTasks.map((task) => ({
      id: task.id,
      label: task.label,
      status: task.status,
      owner: task.owner,
      action: task.command,
      signals: evidenceSignals(task.missingSignals),
      evidence: task.acceptance
    }))
  };
}

function QuickEvidenceGuideBlock({ guide }: { guide: QuickEvidenceGuide }) {
  return (
    <div className={cx("quick-buyer-decision-evidence-guide", guide.status)} aria-label={guide.ariaLabel}>
      <div className="quick-buyer-decision-evidence-guide-head">
        <div>
          <span>
            <FileText size={14} />
            {guide.label}
          </span>
          <strong>{guide.headline}</strong>
          <p>{guide.summary}</p>
        </div>
        <button type="button" onClick={() => copyEvidenceBrief(guide.briefText)}>
          <ClipboardCheck size={14} />
          {guide.copyLabel}
        </button>
      </div>
      <div className="quick-buyer-decision-evidence-guide-items">
        {guide.items.map((item) => (
          <article key={item.id} className={item.status}>
            <span>{item.label}</span>
            <strong>{item.owner}</strong>
            <p>{item.action}</p>
            <small>Required signals: {item.signals.join(", ")}</small>
            <small>{item.evidence}</small>
          </article>
        ))}
      </div>
      <details className="quick-buyer-decision-evidence-guide-brief">
        <summary>Brief template</summary>
        <pre>{guide.briefText}</pre>
      </details>
    </div>
  );
}

export default function QuickBuyerDecisionSuccessPanel({
  roomPreview,
  decisionSuccessCommitment,
  valueRealizationCalendarExport,
  valueRealizationCloseout,
  valueRealizationCloseoutText,
  setValueRealizationCloseoutText,
  valueRealizationRepairAcknowledgement,
  valueRealizationRepairAcknowledgementText,
  setValueRealizationRepairAcknowledgementText,
  valueRealizationAcceptancePacket,
  valueRealizationBuyerReviewDossier,
  valueReviewExecutionPacket,
  valueReviewExecutionCloseout,
  valueReviewExecutionCloseoutText,
  setValueReviewExecutionCloseoutText
}: QuickBuyerDecisionSuccessPanelProps) {
  const closeoutEvidenceGuide = valueRealizationCloseout ? buildCloseoutEvidenceGuide(roomPreview, valueRealizationCloseout) : null;
  const executionEvidenceGuide =
    valueReviewExecutionPacket && valueReviewExecutionCloseout ? buildExecutionEvidenceGuide(valueReviewExecutionPacket, valueReviewExecutionCloseout) : null;

  return (
    <div className={cx("quick-buyer-decision-success-commitment", decisionSuccessCommitment.status)} aria-label="Buyer success commitment">
      <div className="quick-buyer-decision-success-main">
        <span>
          <Gauge size={14} />
          {decisionSuccessCommitment.label}
        </span>
        <strong>{decisionSuccessCommitment.headline}</strong>
        <p>{decisionSuccessCommitment.summary}</p>
        <small>
          {decisionSuccessCommitment.reviewWindow} / {decisionSuccessCommitment.retainedValueLine}
        </small>
        <small>
          {decisionSuccessCommitment.sourceReceiptId} / {decisionSuccessCommitment.sourceChecksum}
        </small>
        <div className="quick-buyer-decision-success-actions" aria-label="Success commitment actions">
          <a href={decisionSuccessCommitment.exportHref} download="quick-buyer-success-commitment.md">
            <Download size={14} />
            Success plan
          </a>
          <a href={roomPreview.adoptionSuccessPlan.exportHref} download="quick-30-day-adoption-success-plan.md">
            <ExternalLink size={14} />
            Day 30 plan
          </a>
          <a href={decisionSuccessCommitment.valueRealizationLedger.taskCsvHref} download="quick-value-realization-ledger.csv">
            <Download size={14} />
            Value CSV
          </a>
          {valueRealizationCalendarExport && (
            <a href={valueRealizationCalendarExport.icsHref} download="quick-value-realization-calendar.ics">
              <CalendarDays size={14} />
              Value calendar
            </a>
          )}
          <a href={decisionSuccessCommitment.valueRealizationLedger.receiptHref} download="quick-value-realization-receipt.json">
            <FileText size={14} />
            Ledger receipt
          </a>
        </div>
      </div>
      <div className="quick-buyer-decision-success-detail">
        <div className={cx("quick-buyer-decision-value-ledger", decisionSuccessCommitment.valueRealizationLedger.status)} aria-label="Value realization ledger">
          <div className="quick-buyer-decision-value-ledger-head">
            <span>
              <CalendarDays size={14} />
              Value ledger
            </span>
            <strong>{decisionSuccessCommitment.valueRealizationLedger.headline}</strong>
            <p>{decisionSuccessCommitment.valueRealizationLedger.summary}</p>
            <small>
              {decisionSuccessCommitment.valueRealizationLedger.nextOwner}: {decisionSuccessCommitment.valueRealizationLedger.nextAction}
            </small>
            <small>
              {decisionSuccessCommitment.valueRealizationLedger.receipt.receiptId} / {decisionSuccessCommitment.valueRealizationLedger.receipt.checksumAlgorithm}:
              {decisionSuccessCommitment.valueRealizationLedger.receipt.checksum}
            </small>
          </div>
          <div className="quick-buyer-decision-value-ledger-tasks">
            {decisionSuccessCommitment.valueRealizationLedger.tasks.map((task) => (
              <a key={task.id} className={task.status} href={task.href} download={task.href.startsWith("data:text") ? `quick-${task.id}.md` : undefined}>
                <span>{task.window}</span>
                <strong>{task.label}</strong>
                <small>
                  {task.owner}: {task.closeCriteria}
                </small>
              </a>
            ))}
          </div>
        </div>
        {valueRealizationCloseout && (
          <div className={cx("quick-buyer-decision-value-closeout", valueRealizationCloseout.status)} aria-label="Value realization closeout">
            <div className="quick-buyer-decision-value-closeout-head">
              <div>
                <span>
                  <ClipboardCheck size={14} />
                  Value closeout
                </span>
                <strong>{valueRealizationCloseout.headline}</strong>
                <p>{valueRealizationCloseout.summary}</p>
                <small>
                  {valueRealizationCloseout.completedCount}/4 completed / decision {valueRealizationCloseout.decision} / retained{" "}
                  {valueRealizationCloseout.retainedValueYen > 0 ? `${formatYen(valueRealizationCloseout.retainedValueYen)}/month` : "missing"}
                </small>
                <small>
                  {valueRealizationCloseout.receipt.receiptId} / {valueRealizationCloseout.receipt.checksumAlgorithm}:{valueRealizationCloseout.receipt.checksum}
                </small>
              </div>
              <div className="quick-buyer-decision-value-closeout-actions" aria-label="Value closeout exports">
                <a href={valueRealizationCloseout.exportHref} download="quick-value-realization-closeout.md">
                  <Download size={14} />
                  Closeout
                </a>
                <a href={valueRealizationCloseout.receiptHref} download="quick-value-realization-closeout-receipt.json">
                  <FileText size={14} />
                  Receipt
                </a>
                <a href={valueRealizationCloseout.verifierHref}>
                  <ShieldCheck size={14} />
                  Verify
                </a>
                {valueRealizationCloseout.repairQueue.itemCount > 0 && (
                  <a href={valueRealizationCloseout.repairQueue.exportHref} download="quick-value-closeout-repair-queue.md">
                    <Crosshair size={14} />
                    Repair
                  </a>
                )}
              </div>
            </div>
            {closeoutEvidenceGuide && <QuickEvidenceGuideBlock guide={closeoutEvidenceGuide} />}
            <label className="quick-buyer-decision-value-closeout-field">
              <span>Operating evidence</span>
              <textarea
                value={valueRealizationCloseoutText}
                onChange={(event) => setValueRealizationCloseoutText(event.currentTarget.value)}
                rows={4}
                placeholder={`Example: Day 0 baseline owner named; metric, proof packet, stop rule, and review date locked. Day 7 repeat usage accepted with pilot receipt. Day 14 finance retained value ${formatYen(roomPreview.adoptionSuccessPlan.retainedMonthlyValueYen)}/month. Day 30 proof verified and expansion approved with closeout URL.`}
                aria-label="Value realization closeout evidence"
              />
            </label>
            <div className="quick-buyer-decision-value-closeout-tasks">
              {valueRealizationCloseout.tasks.map((task) => (
                <article key={task.id} className={task.status}>
                  <span>{task.window}</span>
                  <strong>{task.label}</strong>
                  <p>{task.outcome}</p>
                  <small>
                    {task.status} / matched {task.matchedSignals.length}; missing {task.missingSignals.length}
                  </small>
                </article>
              ))}
            </div>
            {valueRealizationCloseout.repairQueue.itemCount > 0 && (
              <div className={cx("quick-buyer-decision-value-closeout-repair", valueRealizationCloseout.repairQueue.status)} aria-label="Value closeout repair queue">
                <div className="quick-buyer-decision-value-closeout-repair-head">
                  <div>
                    <span>
                      <Crosshair size={14} />
                      Repair queue
                    </span>
                    <strong>{valueRealizationCloseout.repairQueue.headline}</strong>
                    <p>{valueRealizationCloseout.repairQueue.summary}</p>
                    <small>
                      {valueRealizationCloseout.repairQueue.sourceRepairCount} source repairs / {valueRealizationCloseout.repairQueue.evidenceGapCount} evidence gaps
                    </small>
                  </div>
                  <a href={valueRealizationCloseout.repairQueue.exportHref} download="quick-value-closeout-repair-queue.md">
                    <Download size={14} />
                    Queue
                  </a>
                </div>
                <div className="quick-buyer-decision-value-closeout-repair-items">
                  {valueRealizationCloseout.repairQueue.items.map((item) => (
                    <article key={item.id} className={item.status}>
                      <span>{item.reason === "source-ledger-repair" ? "Source ledger" : "Evidence gap"}</span>
                      <strong>{item.owner}</strong>
                      <p>{item.action}</p>
                      <small>
                        {item.sourceStatus} source / {item.evidenceStatus} evidence
                      </small>
                      <small>{item.acceptance}</small>
                    </article>
                  ))}
                </div>
                {valueRealizationRepairAcknowledgement && (
                  <div
                    className={cx("quick-buyer-decision-value-closeout-ack", valueRealizationRepairAcknowledgement.status)}
                    aria-label="Value closeout repair acknowledgement"
                  >
                    <label className="quick-buyer-decision-value-closeout-field">
                      <span>Owner acknowledgement</span>
                      <textarea
                        value={valueRealizationRepairAcknowledgementText}
                        onChange={(event) => setValueRealizationRepairAcknowledgementText(event.currentTarget.value)}
                        rows={3}
                        placeholder={`Example: ${valueRealizationCloseout.repairQueue.nextOwner} accepted ${valueRealizationCloseout.repairQueue.items[0]?.label ?? "source ledger repair"}; source ledger ${valueRealizationCloseout.sourceLedgerReceiptId} was re-exported ready.`}
                        aria-label="Value closeout repair acknowledgement evidence"
                      />
                    </label>
                    <div className="quick-buyer-decision-value-closeout-ack-head">
                      <div>
                        <span>
                          <BadgeCheck size={14} />
                          Repair acceptance
                        </span>
                        <strong>{valueRealizationRepairAcknowledgement.headline}</strong>
                        <p>{valueRealizationRepairAcknowledgement.summary}</p>
                        <small>
                          {valueRealizationRepairAcknowledgement.acknowledgedCount}/{valueRealizationRepairAcknowledgement.requiredAcknowledgementCount} acknowledged /{" "}
                          {valueRealizationRepairAcknowledgement.receipt.receiptId}
                        </small>
                      </div>
                      <div className="quick-buyer-decision-value-closeout-ack-actions" aria-label="Value repair acknowledgement exports">
                        <a href={valueRealizationRepairAcknowledgement.exportHref} download="quick-value-closeout-repair-acknowledgement.md">
                          <Download size={14} />
                          Ack
                        </a>
                        <a href={valueRealizationRepairAcknowledgement.receiptHref} download="quick-value-closeout-repair-acknowledgement-receipt.json">
                          <FileText size={14} />
                          Receipt
                        </a>
                        <a href={valueRealizationRepairAcknowledgement.verifierHref}>
                          <ShieldCheck size={14} />
                          Verify
                        </a>
                      </div>
                    </div>
                    <div className="quick-buyer-decision-value-closeout-ack-items">
                      {valueRealizationRepairAcknowledgement.items.map((item) => (
                        <article key={item.id} className={item.status}>
                          <span>{item.reason === "source-ledger-repair" ? "Owner repair" : "Evidence first"}</span>
                          <strong>{item.owner}</strong>
                          <p>{item.requiredAction}</p>
                          <small>
                            {item.status} / matched {item.matchedSignals.length}; missing {item.missingSignals.length}
                          </small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {valueRealizationAcceptancePacket && (
                  <div
                    className={cx("quick-buyer-decision-value-closeout-acceptance", valueRealizationAcceptancePacket.status)}
                    aria-label="Value realization acceptance packet"
                  >
                    <div className="quick-buyer-decision-value-closeout-acceptance-head">
                      <div>
                        <span>
                          <ShieldCheck size={14} />
                          Value acceptance
                        </span>
                        <strong>{valueRealizationAcceptancePacket.headline}</strong>
                        <p>{valueRealizationAcceptancePacket.summary}</p>
                        <small>
                          {valueRealizationAcceptancePacket.decision} / {valueRealizationAcceptancePacket.receipt.receiptId}
                        </small>
                      </div>
                      <div className="quick-buyer-decision-value-closeout-acceptance-actions" aria-label="Value acceptance exports">
                        <a href={valueRealizationAcceptancePacket.exportHref} download="quick-value-realization-acceptance.md">
                          <Download size={14} />
                          Packet
                        </a>
                        <a href={valueRealizationAcceptancePacket.receiptHref} download="quick-value-realization-acceptance-receipt.json">
                          <FileText size={14} />
                          Receipt
                        </a>
                        <a href={valueRealizationAcceptancePacket.verifierHref}>
                          <ShieldCheck size={14} />
                          Verify
                        </a>
                      </div>
                    </div>
                    <p>{valueRealizationAcceptancePacket.buyerClaim}</p>
                    <div className="quick-buyer-decision-value-closeout-acceptance-checks">
                      {valueRealizationAcceptancePacket.checks.map((check) => (
                        <article key={check.id} className={check.status}>
                          <span>{check.label}</span>
                          <strong>{check.owner}</strong>
                          <p>{check.evidence}</p>
                          <small>{check.acceptance}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {valueRealizationBuyerReviewDossier && (
                  <div
                    className={cx("quick-buyer-decision-value-review-dossier", valueRealizationBuyerReviewDossier.status)}
                    aria-label="Buyer value review dossier"
                  >
                    <div className="quick-buyer-decision-value-review-dossier-head">
                      <div>
                        <span>
                          <ClipboardCheck size={14} />
                          Value review dossier
                        </span>
                        <strong>{valueRealizationBuyerReviewDossier.headline}</strong>
                        <p>{valueRealizationBuyerReviewDossier.summary}</p>
                        <small>{valueRealizationBuyerReviewDossier.reviewQuestion}</small>
                      </div>
                      <div className="quick-buyer-decision-value-review-dossier-verdict">
                        <span>Buyer ask</span>
                        <strong>{valueRealizationBuyerReviewDossier.decision}</strong>
                        <small>
                          {valueRealizationBuyerReviewDossier.confidenceScore}/100 confidence / {valueRealizationBuyerReviewDossier.readyCount}/
                          {valueRealizationBuyerReviewDossier.totalCount} questions ready
                        </small>
                        <a href={valueRealizationBuyerReviewDossier.exportHref} download="quick-buyer-value-review-dossier.md">
                          <Download size={14} />
                          Dossier
                        </a>
                        <a href={valueRealizationBuyerReviewDossier.items.find((item) => item.id === "receipt-chain")?.href ?? "#"}>
                          <ShieldCheck size={14} />
                          Verify receipt
                        </a>
                      </div>
                    </div>
                    <div className="quick-buyer-decision-value-review-dossier-rule">
                      <strong>{valueRealizationBuyerReviewDossier.buyerAsk}</strong>
                      <p>{valueRealizationBuyerReviewDossier.decisionRule}</p>
                    </div>
                    <div className="quick-buyer-decision-value-review-dossier-items">
                      {valueRealizationBuyerReviewDossier.items.map((item) => (
                        <a
                          key={item.id}
                          className={item.status}
                          href={item.href}
                          download={item.href.startsWith("data:text") ? `quick-${item.id}-value-review.md` : undefined}
                        >
                          <span>{item.label}</span>
                          <strong>{item.question}</strong>
                          <p>{item.answer}</p>
                          <small>
                            {item.owner}: {item.evidence}
                          </small>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {valueReviewExecutionPacket && (
                  <div className={cx("quick-buyer-decision-value-execution-packet", valueReviewExecutionPacket.status)} aria-label="Value review execution packet">
                    <div className="quick-buyer-decision-value-execution-packet-head">
                      <div>
                        <span>
                          <CalendarDays size={14} />
                          Execution packet
                        </span>
                        <strong>{valueReviewExecutionPacket.headline}</strong>
                        <p>{valueReviewExecutionPacket.summary}</p>
                        <small>
                          {valueReviewExecutionPacket.decision} / {valueReviewExecutionPacket.receipt.receiptId}
                        </small>
                      </div>
                      <div className="quick-buyer-decision-value-execution-packet-next">
                        <span>Next owner</span>
                        <strong>{valueReviewExecutionPacket.nextOwner}</strong>
                        <p>{valueReviewExecutionPacket.nextAction}</p>
                        <small>
                          {valueReviewExecutionPacket.readyTaskCount}/{valueReviewExecutionPacket.taskCount} tasks ready / {valueReviewExecutionPacket.blockedTaskCount} blocked
                        </small>
                      </div>
                      <div className="quick-buyer-decision-value-execution-packet-actions" aria-label="Value execution exports">
                        <a href={valueReviewExecutionPacket.exportHref} download="quick-value-review-execution-packet.md">
                          <Download size={14} />
                          Packet
                        </a>
                        <a href={valueReviewExecutionPacket.receiptHref} download="quick-value-review-execution-receipt.json">
                          <FileText size={14} />
                          Receipt
                        </a>
                        <a href={valueReviewExecutionPacket.verifierHref}>
                          <ShieldCheck size={14} />
                          Verify
                        </a>
                      </div>
                    </div>
                    <div className="quick-buyer-decision-value-execution-packet-guardrails">
                      {valueReviewExecutionPacket.guardrails.map((guardrail) => (
                        <span key={guardrail}>{guardrail}</span>
                      ))}
                    </div>
                    <div className="quick-buyer-decision-value-execution-packet-tasks">
                      {valueReviewExecutionPacket.tasks.map((task) => (
                        <article key={task.id} className={task.status}>
                          <span>{task.dueWindow}</span>
                          <strong>{task.label}</strong>
                          <p>{task.command}</p>
                          <small>
                            {task.owner}: {task.acceptance}
                          </small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {valueReviewExecutionPacket && valueReviewExecutionCloseout && (
                  <div
                    className={cx("quick-buyer-decision-value-execution-closeout", valueReviewExecutionCloseout.status)}
                    aria-label="Value review execution closeout"
                  >
                    {executionEvidenceGuide && <QuickEvidenceGuideBlock guide={executionEvidenceGuide} />}
                    <label className="quick-buyer-decision-value-execution-closeout-field">
                      <span>Completion evidence</span>
                      <textarea
                        value={valueReviewExecutionCloseoutText}
                        onChange={(event) => setValueReviewExecutionCloseoutText(event.currentTarget.value)}
                        rows={3}
                        placeholder={`Example: Acceptance receipt ${valueReviewExecutionPacket.receipt.payload.sourceAcceptanceReceiptId} verified HTTP 200. Decision recorded for ${valueReviewExecutionPacket.decision}. Operating owner accepted the next window. Finance scheduled retained value recheck. Executive brief published with buyer ask, decision rule, verifier link, and next owner.`}
                        aria-label="Value review execution completion evidence"
                      />
                    </label>
                    <div className="quick-buyer-decision-value-execution-closeout-head">
                      <div>
                        <span>
                          <BadgeCheck size={14} />
                          Execution closeout
                        </span>
                        <strong>{valueReviewExecutionCloseout.headline}</strong>
                        <p>{valueReviewExecutionCloseout.summary}</p>
                        <small>
                          {valueReviewExecutionCloseout.decision} / {valueReviewExecutionCloseout.receipt.receiptId}
                        </small>
                      </div>
                      <div className="quick-buyer-decision-value-execution-closeout-score">
                        <span>Closed tasks</span>
                        <strong>
                          {valueReviewExecutionCloseout.readyTaskCount}/{valueReviewExecutionCloseout.taskCount}
                        </strong>
                        <p>{valueReviewExecutionCloseout.nextAction}</p>
                        <small>{valueReviewExecutionCloseout.nextOwner}</small>
                      </div>
                      <div className="quick-buyer-decision-value-execution-closeout-actions" aria-label="Value execution closeout exports">
                        <a href={valueReviewExecutionCloseout.exportHref} download="quick-value-review-execution-closeout.md">
                          <Download size={14} />
                          Closeout
                        </a>
                        <a href={valueReviewExecutionCloseout.receiptHref} download="quick-value-review-execution-closeout-receipt.json">
                          <FileText size={14} />
                          Receipt
                        </a>
                        <a href={valueReviewExecutionCloseout.verifierHref}>
                          <ShieldCheck size={14} />
                          Verify
                        </a>
                      </div>
                    </div>
                    <div className="quick-buyer-decision-value-execution-closeout-tasks">
                      {valueReviewExecutionCloseout.tasks.map((task) => (
                        <article key={task.id} className={task.status}>
                          <span>{task.label}</span>
                          <strong>{task.owner}</strong>
                          <p>Matched: {task.matchedSignals.join(", ") || "none"}</p>
                          <small>Missing: {task.missingSignals.join(", ") || "none"}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        )}
        <div className="quick-buyer-decision-success-items" aria-label="Buyer success commitment metrics">
          {decisionSuccessCommitment.items.map((item) => (
            <article key={item.id} className={item.status}>
              <span>{item.label}</span>
              <strong>{item.owner}</strong>
              <p>{item.target}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
