import { Activity, ClipboardCheck, Download, ExternalLink, FileText, Play, Radar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildLaunchCommandQueue } from "./launchCommandQueue";
import type { SquadOptimizerRun } from "./squadOptimizer";
import type { WorkspaceDraft } from "./workspaceDraft";

type LaunchCommandQueuePanelProps = {
  buyerScenario: BuyerValueScenario;
  squadOptimizer: SquadOptimizerRun | null;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function LaunchCommandQueuePanel({ buyerScenario, squadOptimizer, workspace, onCopyText }: LaunchCommandQueuePanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const queue = useMemo(
    () =>
      buildLaunchCommandQueue({
        buyerScenario,
        squadOptimizer,
        workspace
      }),
    [buyerScenario, squadOptimizer, workspace]
  );
  const readinessTone = queue.readiness === "ready-to-check" ? "low" : queue.readiness === "needs-squad-decision" ? "medium" : "high";
  const copyLabel = copyStatus === "copied" ? "Copied issue" : copyStatus === "failed" ? "Copy failed" : "Copy issue";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyPrimaryIssue = async () => {
    const copied = await onCopyText(`# ${queue.workOrder.primaryIssue.title}\n\n${queue.workOrder.primaryIssue.body}`);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section id="launch-command-queue" className="launch-command-queue" aria-labelledby="launch-command-title">
      <div className="launch-command-heading">
        <div>
          <span className="eyebrow">Global Launch Command Queue</span>
          <h2 id="launch-command-title">
            <ClipboardCheck size={20} />
            {queue.headline}
          </h2>
          <p>{queue.hardTruth}</p>
        </div>
        <div className="launch-command-score" aria-label="Launch command score">
          <span className={cx("risk-chip", readinessTone)}>{queue.readiness}</span>
          <strong>{queue.commandScore}</strong>
          <small>command score</small>
        </div>
      </div>

      <div className="launch-command-body">
        <section className="launch-command-list">
          <div className="launch-command-section-title">
            <h3>
              <Activity size={16} />
              Next commands
            </h3>
            <a className="icon-link launch-command-primary" href={queue.primaryAction.href}>
              <Play size={15} />
              {queue.primaryAction.label}
            </a>
          </div>
          <div className="launch-command-execution-pack">
            <div>
              <span>Execution pack</span>
              <strong>{queue.workOrder.headline}</strong>
              <p>
                {queue.workOrder.nowCount} now / {queue.workOrder.issueCount} total. Primary issue: {queue.workOrder.primaryIssue.title}
              </p>
            </div>
            <div className="launch-command-export-actions" aria-label="Launch command work order actions">
              <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyPrimaryIssue}>
                <ClipboardCheck size={14} />
                {copyLabel}
              </button>
              <a className="icon-link" href={queue.workOrder.href} download={queue.workOrder.filename}>
                <FileText size={14} />
                Work order
              </a>
              <a className="icon-link" href={queue.workOrder.csvHref} download={queue.workOrder.csvFilename}>
                <Download size={14} />
                Issue CSV
              </a>
            </div>
          </div>
          <div className="launch-command-cards">
            {queue.commands.slice(0, 4).map((command) => (
              <a key={command.id} className={cx("launch-command-card", command.priority)} href={command.href}>
                <div>
                  <span>{command.priority}</span>
                  <strong>{command.label}</strong>
                </div>
                <p>{command.action}</p>
                <small>
                  {command.owner} - {command.proof}
                </small>
                <ExternalLink size={13} />
              </a>
            ))}
          </div>
        </section>

        <section className="launch-command-milestones">
          <h3>
            <Radar size={16} />
            Readiness map
          </h3>
          <div>
            {queue.milestones.map((milestone) => (
              <article key={milestone.id} className={milestone.status}>
                <div>
                  <span>{milestone.status}</span>
                  <b>{milestone.score}</b>
                </div>
                <strong>{milestone.label}</strong>
                <p>{milestone.evidence}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
