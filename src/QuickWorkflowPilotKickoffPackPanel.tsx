import { CalendarDays, Download, FileText, Mail, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { QuickWorkflowCommercialResponseRecord } from "./quickWorkflowCommercialResponse";
import { buildQuickWorkflowPilotKickoffPack, type QuickWorkflowPilotKickoffPack } from "./quickWorkflowPilotKickoffPack";
import type { QuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";

type QuickWorkflowPilotKickoffPackPanelProps = {
  contract: QuickWorkflowValueAcceptanceContract;
  responseRecord: QuickWorkflowCommercialResponseRecord;
  kickoffStartDate?: string;
  onKickoffStartDateChange?: (value: string) => void;
  pack?: QuickWorkflowPilotKickoffPack;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickWorkflowPilotKickoffPackPanel({
  contract,
  responseRecord,
  kickoffStartDate,
  onKickoffStartDateChange,
  pack: providedPack
}: QuickWorkflowPilotKickoffPackPanelProps) {
  const [localKickoffStartDate, setLocalKickoffStartDate] = useState("2026-07-01");
  const resolvedKickoffStartDate = kickoffStartDate ?? localKickoffStartDate;
  const pack = useMemo(
    () =>
      providedPack ??
      buildQuickWorkflowPilotKickoffPack({
        contract,
        responseRecord,
        kickoffStartDate: resolvedKickoffStartDate
      }),
    [contract, responseRecord, resolvedKickoffStartDate, providedPack]
  );
  const updateKickoffStartDate = (value: string) => {
    if (onKickoffStartDateChange) {
      onKickoffStartDateChange(value);
      return;
    }
    setLocalKickoffStartDate(value);
  };

  return (
    <div className={cx("quick-workflow-kickoff-pack", pack.status)} aria-label="Pilot kickoff pack">
      <div className="quick-workflow-kickoff-pack-main">
        <span>
          <CalendarDays size={13} />
          Pilot kickoff pack
        </span>
        <strong>{pack.headline}</strong>
        <p>{pack.summary}</p>
        <label>
          <span>Kickoff date</span>
          <input type="date" value={resolvedKickoffStartDate} onChange={(event) => updateKickoffStartDate(event.currentTarget.value)} />
        </label>
        <div className="quick-workflow-kickoff-pack-actions" aria-label="Pilot kickoff pack actions">
          <a href={pack.mailtoHref}>
            <Mail size={14} />
            Send note
          </a>
          <a href={pack.exportHref} download="quick-workflow-pilot-kickoff-pack.md">
            <Download size={14} />
            Export pack
          </a>
          {pack.icsHref && (
            <a href={pack.icsHref} download="quick-workflow-pilot-kickoff.ics">
              <CalendarDays size={14} />
              Import calendar
            </a>
          )}
          <a href={pack.taskCsvHref} download="quick-workflow-pilot-kickoff-tasks.csv">
            <Table2 size={14} />
            Task CSV
          </a>
          <a href={pack.receipt.payloadHref} download={`${pack.receipt.receiptId}.json`}>
            <FileText size={14} />
            Pack receipt
          </a>
        </div>
      </div>
      <aside className="quick-workflow-kickoff-pack-verdict" aria-label="Pilot kickoff pack verdict">
        <span>{pack.status}</span>
        <strong>{pack.nextOwner}</strong>
        <small>{pack.nextAction}</small>
        <small>
          {pack.readyCount}/{pack.tasks.length} tasks ready, {pack.blockedCount} blocked.
        </small>
      </aside>
      <div className="quick-workflow-kickoff-pack-receipt" aria-label="Pilot kickoff pack receipt">
        <span>Kickoff receipt</span>
        <strong>{pack.receipt.receiptId}</strong>
        <small>
          {pack.receipt.checksumAlgorithm}:{pack.receipt.checksum}
        </small>
      </div>
      <div className="quick-workflow-kickoff-pack-tasks" aria-label="Pilot kickoff owner tasks">
        {pack.tasks.map((task) => (
          <article key={task.id} className={task.status}>
            <span>
              {task.dayLabel} / {task.dueDate || "No date"}
            </span>
            <strong>{task.label}</strong>
            <small>{task.action}</small>
            <em>
              {task.owner}: {task.acceptance}
            </em>
          </article>
        ))}
      </div>
    </div>
  );
}
