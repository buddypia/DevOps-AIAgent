import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, ClipboardCheck, Download, FileText, Mail, ShieldCheck, Table2 } from "lucide-react";
import type { QuickWorkflowBuyerExpansionHandoff } from "./quickWorkflowBuyerExpansionHandoff";
import { buildQuickWorkflowBuyerExpansionRecheckCloseout } from "./quickWorkflowBuyerExpansionRecheckCloseoutReceipt";

type QuickWorkflowBuyerExpansionHandoffPanelProps = {
  handoff: QuickWorkflowBuyerExpansionHandoff;
  onePagerHref: string;
};

type RecheckStructuredDecision = "expand" | "revise" | "stop";

const recheckDecisionLabels: Record<RecheckStructuredDecision, string> = {
  expand: "Expand",
  revise: "Repair before expansion",
  stop: "Stop rollout"
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowBuyerExpansionHandoffPanel({ handoff, onePagerHref }: QuickWorkflowBuyerExpansionHandoffPanelProps) {
  const defaultRecheckEvidenceBody = [
    `Signoff receipt: ${handoff.signoff.receiptId} / ${handoff.signoff.checksumAlgorithm}:${handoff.signoff.checksum}.`,
    handoff.signoff.operatingPacket.recheckCloseout.evidenceTemplate
  ].join("\n");
  const [recheckEvidenceText, setRecheckEvidenceText] = useState(defaultRecheckEvidenceBody);
  const [structuredActualValue, setStructuredActualValue] = useState("");
  const [structuredDecision, setStructuredDecision] = useState<RecheckStructuredDecision>("expand");
  const [structuredVerifierAttached, setStructuredVerifierAttached] = useState(true);
  const [structuredReceiptChainReopened, setStructuredReceiptChainReopened] = useState(true);
  useEffect(() => setRecheckEvidenceText(defaultRecheckEvidenceBody), [defaultRecheckEvidenceBody]);
  useEffect(() => {
    setStructuredActualValue("");
    setStructuredDecision("expand");
    setStructuredVerifierAttached(true);
    setStructuredReceiptChainReopened(true);
  }, [defaultRecheckEvidenceBody]);
  const recheckCloseout = useMemo(
    () =>
      buildQuickWorkflowBuyerExpansionRecheckCloseout({
        signoff: handoff.signoff,
        evidenceText: recheckEvidenceText
      }),
    [handoff.signoff, recheckEvidenceText]
  );
  const structuredActualValueYen = Number(structuredActualValue.replace(/[^\d]/g, ""));
  const structuredValueOutcome =
    structuredActualValueYen > 0 && recheckCloseout.valueFloorYen > 0 && structuredActualValueYen >= recheckCloseout.valueFloorYen
      ? "clears floor"
      : "below floor";
  const structuredValueEntered = structuredActualValueYen > 0;
  const structuredDecisionAligned = structuredValueEntered
    ? structuredValueOutcome === "clears floor"
      ? structuredDecision === "expand"
      : structuredDecision !== "expand"
    : false;
  const structuredGuidanceLabel = !structuredValueEntered
    ? "Enter actual value"
    : structuredDecisionAligned
      ? "Decision aligned"
      : "Decision conflicts with floor";
  const structuredGuidanceDetail = !structuredValueEntered
    ? "Record the retained monthly value before exporting the closeout."
    : structuredDecisionAligned
      ? `${recheckDecisionLabels[structuredDecision]} matches the ${structuredValueOutcome} outcome.`
      : structuredValueOutcome === "clears floor"
        ? "Expansion is the only ready closeout when value clears the floor."
        : "Below-floor value must route to repair or stop before rollout.";
  const buildStructuredCloseoutEvidence = () => {
    const formattedActualValue = structuredActualValueYen > 0 ? `¥${structuredActualValueYen.toLocaleString("ja-JP")}` : "¥____";
    const receiptChainLine = structuredReceiptChainReopened
      ? `Receipt chain reopened before decision: ${handoff.signoff.operatingPacket.recheckCloseout.valueFloorEvidence}. Source handoff ${handoff.signoff.operatingPacket.recheckCloseout.sourceHandoffReceiptId}. Source signoff ${handoff.signoff.receiptId}.`
      : `Receipt chain not reopened yet. Source handoff ${handoff.signoff.operatingPacket.recheckCloseout.sourceHandoffReceiptId}. Source signoff ${handoff.signoff.receiptId}.`;
    return [
      `Signoff receipt: ${handoff.signoff.receiptId} / ${handoff.signoff.checksumAlgorithm}:${handoff.signoff.checksum}.`,
      `Recheck date: ${handoff.signoff.operatingPacket.recheckCloseout.scheduledDate}.`,
      structuredVerifierAttached
        ? "Signoff verifier verified HTTP 200 before closeout."
        : "Signoff verifier pending before closeout.",
      `Source handoff receipt: ${handoff.signoff.operatingPacket.recheckCloseout.sourceHandoffReceiptId} / ${handoff.signoff.operatingPacket.recheckCloseout.sourceHandoffChecksum}.`,
      "Handoff verifier output attached.",
      `Retained-value recheck scheduled on calendar for ${handoff.signoff.operatingPacket.recheckCloseout.scheduledDate}.`,
      `Finance retained value target named from proof: ${handoff.signoff.operatingPacket.recheckCloseout.valueFloorEvidence}.`,
      `Actual retained monthly value: ${formattedActualValue}/month.`,
      `Value floor outcome stated: ${structuredValueOutcome}.`,
      receiptChainLine,
      `Decision recorded: ${structuredDecision}.`,
      `Stop or repair rule: ${handoff.signoff.operatingPacket.recheckCloseout.decisionRule}`,
      `Next owner: ${handoff.signoff.operatingPacket.recheckCloseout.nextOwner}.`,
      `Next action: ${handoff.signoff.operatingPacket.recheckCloseout.nextAction}`
    ].join("\n");
  };
  const structuredPreviewEvidenceText = buildStructuredCloseoutEvidence();
  const structuredPreviewCloseout = useMemo(
    () =>
      buildQuickWorkflowBuyerExpansionRecheckCloseout({
        signoff: handoff.signoff,
        evidenceText: structuredPreviewEvidenceText
      }),
    [handoff.signoff, structuredPreviewEvidenceText]
  );
  const applyStructuredCloseoutEvidence = () => {
    setRecheckEvidenceText(structuredPreviewEvidenceText);
  };

  return (
    <div className={cx("quick-workflow-buyer-expansion-handoff", handoff.status)} aria-label="Procurement handoff">
      <div className="quick-workflow-buyer-expansion-handoff-main">
        <span>
          <ShieldCheck size={13} />
          Procurement handoff
        </span>
        <strong>{handoff.headline}</strong>
        <p>{handoff.summary}</p>
        <small>{handoff.approvalLine}</small>
        <div className="quick-workflow-buyer-expansion-handoff-actions" aria-label="Procurement handoff actions">
          <a href={handoff.mailtoHref}>
            <Mail size={14} />
            Send handoff
          </a>
          <a href={handoff.exportHref} download="quick-workflow-buyer-expansion-handoff.md">
            <FileText size={14} />
            Export handoff
          </a>
          <a href={handoff.taskCsvHref} download="quick-workflow-buyer-expansion-handoff.csv">
            <Table2 size={14} />
            Task CSV
          </a>
          <a href={handoff.receipt.payloadHref} download={`${handoff.receipt.receiptId}.json`}>
            <FileText size={14} />
            Handoff receipt
          </a>
          <a href={handoff.receipt.verificationRequestHref} download={`${handoff.receipt.receiptId}-verify.json`}>
            <FileText size={14} />
            Verifier request
          </a>
          <a href={handoff.receipt.verifierHref}>
            <ShieldCheck size={14} />
            Verify handoff
          </a>
          <a href={handoff.signoff.exportHref} download="quick-workflow-buyer-expansion-handoff-signoff.md">
            <ClipboardCheck size={14} />
            Export signoff
          </a>
          <a href={handoff.signoff.operatingPacket.exportHref} download="quick-workflow-buyer-expansion-operating-packet.md">
            <ClipboardCheck size={14} />
            Operating packet
          </a>
          <a href={handoff.signoff.operatingPacket.csvHref} download="quick-workflow-buyer-expansion-owner-ledger.csv">
            <Table2 size={14} />
            Owner ledger
          </a>
          {handoff.signoff.operatingPacket.calendarHref && (
            <a href={handoff.signoff.operatingPacket.calendarHref} download={handoff.signoff.operatingPacket.calendarFilename}>
              <CalendarCheck size={14} />
              Recheck calendar
            </a>
          )}
          <a href={handoff.signoff.operatingPacket.closeoutHref} download={handoff.signoff.operatingPacket.closeoutFilename}>
            <ClipboardCheck size={14} />
            Closeout template
          </a>
          <a href={handoff.signoff.payloadHref} download={`${handoff.signoff.receiptId}.json`}>
            <FileText size={14} />
            Signoff receipt
          </a>
          <a href={handoff.signoff.verificationRequestHref} download={`${handoff.signoff.receiptId}-verify.json`}>
            <FileText size={14} />
            Signoff request
          </a>
          <a href={handoff.signoff.verifierHref}>
            <ShieldCheck size={14} />
            Verify signoff
          </a>
          <a href={onePagerHref} download="quick-workflow-buyer-expansion-one-pager.html">
            <Download size={14} />
            Download one-pager
          </a>
        </div>
      </div>
      <aside className="quick-workflow-buyer-expansion-handoff-score" aria-label="Procurement handoff readiness">
        <span>{handoff.status}</span>
        <strong>
          {handoff.readyCount}/{handoff.totalCount}
        </strong>
        <small>{handoff.handoffId}</small>
      </aside>
      <div className="quick-workflow-buyer-expansion-handoff-risk">
        <span>Control rule</span>
        <strong>{handoff.riskLine}</strong>
        <small>
          {handoff.nextOwner}: {handoff.nextAction}
        </small>
      </div>
      <div className={cx("quick-workflow-buyer-expansion-handoff-signoff", handoff.signoff.status)} aria-label="Procurement signoff packet">
        <div>
          <span>Procurement signoff</span>
          <strong>{handoff.signoff.label}</strong>
          <small>{handoff.signoff.memo}</small>
        </div>
        <aside>
          <span>{handoff.signoff.decision}</span>
          <strong>{handoff.signoff.receiptId}</strong>
          <small>
            Source: {handoff.handoffId} / {handoff.checksumAlgorithm}:{handoff.checksum}
          </small>
        </aside>
      </div>
      <div
        className={cx("quick-workflow-buyer-expansion-handoff-operating", handoff.signoff.status)}
        aria-label="Procurement operating packet"
      >
        <div className="quick-workflow-buyer-expansion-handoff-operating-main">
          <span>Operating packet</span>
          <strong>{handoff.signoff.operatingPacket.headline}</strong>
          <small>{handoff.signoff.operatingPacket.summary}</small>
        </div>
        <aside className="quick-workflow-buyer-expansion-handoff-operating-score">
          <span>{handoff.signoff.operatingPacket.calendar.status}</span>
          <strong>
            {handoff.signoff.operatingPacket.readyCount}/{handoff.signoff.operatingPacket.taskTotal}
          </strong>
          <small>{handoff.signoff.operatingPacket.calendar.startDate || handoff.signoff.operatingPacket.firstDueLabel}</small>
        </aside>
        <aside className="quick-workflow-buyer-expansion-handoff-operating-closeout">
          <span>{handoff.signoff.operatingPacket.recheckCloseout.status}</span>
          <strong>{handoff.signoff.operatingPacket.recheckCloseout.label}</strong>
          <small>{handoff.signoff.operatingPacket.recheckCloseout.scheduledDate}</small>
        </aside>
        <div className="quick-workflow-buyer-expansion-handoff-operating-tasks" aria-label="Procurement operating owner ledger">
          {handoff.signoff.operatingPacket.tasks.map((task) => (
            <article key={task.id} className={task.status}>
              <span>{task.dueLabel}</span>
              <strong>{task.label}</strong>
              <small>{task.owner}</small>
              <em>{task.action}</em>
              <b>{task.acceptance}</b>
            </article>
          ))}
        </div>
        <div
          className={cx("quick-workflow-buyer-expansion-recheck-closeout-builder", recheckCloseout.status)}
          aria-label="Retained value recheck closeout builder"
        >
          <div className="quick-workflow-buyer-expansion-recheck-closeout-structured" aria-label="Structured recheck closeout input">
            <div className="quick-workflow-buyer-expansion-recheck-closeout-structured-head">
              <span>Structured closeout input</span>
              <strong>{structuredValueOutcome}</strong>
              <small>Floor ¥{recheckCloseout.valueFloorYen.toLocaleString("ja-JP")} / {handoff.signoff.operatingPacket.recheckCloseout.scheduledDate}</small>
            </div>
            <label>
              <span>Actual retained value</span>
              <input
                value={structuredActualValue}
                onChange={(event) => setStructuredActualValue(event.target.value)}
                inputMode="numeric"
                aria-label="Actual retained monthly value"
                placeholder="680000"
              />
            </label>
            <label>
              <span>Decision</span>
              <select
                value={structuredDecision}
                onChange={(event) => setStructuredDecision(event.target.value as RecheckStructuredDecision)}
                aria-label="Recheck closeout decision"
              >
                <option value="expand">Expand</option>
                <option value="revise">Repair before expansion</option>
                <option value="stop">Stop rollout</option>
              </select>
            </label>
            <label className="quick-workflow-buyer-expansion-recheck-closeout-toggle">
              <input
                type="checkbox"
                checked={structuredVerifierAttached}
                onChange={(event) => setStructuredVerifierAttached(event.target.checked)}
              />
              <span>Verifier HTTP 200 attached</span>
            </label>
            <label className="quick-workflow-buyer-expansion-recheck-closeout-toggle">
              <input
                type="checkbox"
                checked={structuredReceiptChainReopened}
                onChange={(event) => setStructuredReceiptChainReopened(event.target.checked)}
              />
              <span>Receipt chain reopened</span>
            </label>
            <button type="button" onClick={applyStructuredCloseoutEvidence}>
              <ClipboardCheck size={14} />
              Apply structured evidence
            </button>
            <aside className={cx("quick-workflow-buyer-expansion-recheck-closeout-guidance", structuredDecisionAligned && "ready")}>
              <span>{structuredGuidanceLabel}</span>
              <strong>{structuredPreviewCloseout.decision}</strong>
              <small>{structuredGuidanceDetail}</small>
            </aside>
            <aside className={cx("quick-workflow-buyer-expansion-recheck-closeout-preview", structuredPreviewCloseout.status)}>
              <span>Projected closeout</span>
              <strong>
                {structuredPreviewCloseout.readyCheckCount}/{structuredPreviewCloseout.checkCount}
              </strong>
              <small>{structuredPreviewCloseout.nextOwner}: {structuredPreviewCloseout.nextAction}</small>
            </aside>
          </div>
          <label>
            <span>Recheck closeout evidence</span>
            <textarea
              value={recheckEvidenceText}
              onChange={(event) => setRecheckEvidenceText(event.target.value)}
              aria-label="Retained value recheck closeout evidence"
            />
          </label>
          <aside className="quick-workflow-buyer-expansion-recheck-closeout-verdict">
            <span>{recheckCloseout.status}</span>
            <strong>{recheckCloseout.headline}</strong>
            <small>{recheckCloseout.summary}</small>
          </aside>
          <aside className="quick-workflow-buyer-expansion-recheck-closeout-values">
            <span>{recheckCloseout.decision}</span>
            <strong>
              {recheckCloseout.readyCheckCount}/{recheckCloseout.checkCount}
            </strong>
            <small>
              Actual ¥{recheckCloseout.actualMonthlyValueYen.toLocaleString("ja-JP")} / floor ¥
              {recheckCloseout.valueFloorYen.toLocaleString("ja-JP")}
            </small>
          </aside>
          <div className="quick-workflow-buyer-expansion-recheck-closeout-actions" aria-label="Recheck closeout receipt actions">
            <a href={recheckCloseout.exportHref} download="quick-buyer-expansion-recheck-closeout.md">
              <ClipboardCheck size={14} />
              Export closeout
            </a>
            <a href={recheckCloseout.receiptHref} download={`${recheckCloseout.receipt.receiptId}-verify.json`}>
              <FileText size={14} />
              Closeout request
            </a>
            <a href={recheckCloseout.verifierHref}>
              <ShieldCheck size={14} />
              Verify closeout
            </a>
          </div>
          <div className="quick-workflow-buyer-expansion-recheck-closeout-checks" aria-label="Recheck closeout checks">
            {recheckCloseout.checks.map((check) => (
              <article key={check.id} className={check.status}>
                <span>{check.status}</span>
                <strong>{check.label}</strong>
                <small>{check.owner}</small>
                <em>{check.missingSignals.join(", ") || "Ready"}</em>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="quick-workflow-buyer-expansion-handoff-tasks" aria-label="Procurement handoff owner tasks">
        {handoff.tasks.map((task) => (
          <article key={task.id} className={task.status}>
            <span>{task.label}</span>
            <strong>{task.owner}</strong>
            <small>{task.action}</small>
            <em>{task.acceptance}</em>
            {task.href ? (
              <a href={task.href}>
                <ShieldCheck size={13} />
                Verify
              </a>
            ) : (
              <b>{task.proof}</b>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
