import { BadgeCheck, ClipboardCheck, ExternalLink, Gauge, Play, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildOutcomeSnapshot } from "./outcomeSnapshot";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import type { Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type OutcomeSnapshotPanelProps = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  pilotRun: PilotRunReceiptInput;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readinessTone(readiness: string) {
  if (readiness === "publish-ready") return "low";
  if (readiness === "needs-proof") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "complete") return "low";
  if (status === "attention") return "medium";
  return "high";
}

export default function OutcomeSnapshotPanel({ recommendation, valueBlueprint, buyerScenario, workspace, pilotRun }: OutcomeSnapshotPanelProps) {
  const snapshot = useMemo(
    () =>
      buildOutcomeSnapshot({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workspace,
        pilotRun
      }),
    [buyerScenario, pilotRun, recommendation, valueBlueprint, workspace]
  );
  const completedChecks = snapshot.checks.filter((check) => check.status === "complete").length;

  return (
    <section id="outcome-snapshot" className={cx("outcome-snapshot", snapshot.readiness)} aria-labelledby="outcome-snapshot-title">
      <div className="outcome-snapshot-heading">
        <div>
          <span className="eyebrow">Outcome Snapshot</span>
          <h2 id="outcome-snapshot-title">
            <Gauge size={20} />
            {snapshot.headline}
          </h2>
          <p>{snapshot.hardTruth}</p>
          <div className="outcome-quick-links" aria-label="Outcome proof links">
            {snapshot.quickLinks.map((link) => (
              <a key={link.id} className={cx("icon-link", link.status)} href={link.href}>
                <ExternalLink size={14} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="outcome-snapshot-score" aria-label="Outcome score">
          <span className={cx("risk-chip", readinessTone(snapshot.readiness))}>{snapshot.readiness}</span>
          <strong>{snapshot.outcomeScore}</strong>
          <small>
            {completedChecks}/{snapshot.checks.length} checks complete
          </small>
        </div>
      </div>

      <div className="outcome-snapshot-body">
        <section className="outcome-next-action">
          <div>
            <span>{snapshot.nextAction.priority}</span>
            <h3>
              <Play size={16} />
              {snapshot.nextAction.label}
            </h3>
            <p>{snapshot.nextAction.action}</p>
            <small>
              {snapshot.nextAction.owner} - {snapshot.nextAction.proof}
            </small>
          </div>
          <a className="icon-link outcome-next-link" href={snapshot.nextAction.href}>
            <ClipboardCheck size={15} />
            Go fix
          </a>
        </section>

        <section className="outcome-primary-metric">
          <span>{snapshot.targetBuyer}</span>
          <strong>{snapshot.primaryMetric.value}</strong>
          <p>{snapshot.primaryMetric.label}</p>
          <small>{snapshot.primaryMetric.evidence}</small>
        </section>

        <section className="outcome-checks" aria-label="Outcome readiness checks">
          {snapshot.checks.map((check) => (
            <article key={check.id} className={check.status}>
              <div>
                <span className={cx("risk-chip", statusTone(check.status))}>{check.status}</span>
                <b>{check.score}</b>
              </div>
              <strong>
                {check.status === "complete" ? <BadgeCheck size={15} /> : <TrendingUp size={15} />}
                {check.label}
              </strong>
              <p>{check.evidence}</p>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
