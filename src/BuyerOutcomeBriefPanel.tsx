import { BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildBuyerOutcomeBrief } from "./buyerOutcomeBrief";
import type { LaunchRoom } from "./launchRoom";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import type { Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type BuyerOutcomeBriefPanelProps = {
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  pilotRun: PilotRunReceiptInput;
  launchRoom: LaunchRoom;
  publicBriefHref: string;
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function tone(status: string) {
  if (["pass", "send-to-buyer"].includes(status)) return "low";
  if (["block", "repair-before-share"].includes(status)) return "high";
  return "medium";
}

function statusIcon(status: string) {
  if (status === "pass") return <BadgeCheck size={15} />;
  if (status === "watch") return <Gauge size={15} />;
  return <Crosshair size={15} />;
}

export default function BuyerOutcomeBriefPanel({
  recommendation,
  valueBlueprint,
  buyerScenario,
  workspace,
  pilotRun,
  launchRoom,
  publicBriefHref,
  onCopyText
}: BuyerOutcomeBriefPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const brief = useMemo(
    () =>
      buildBuyerOutcomeBrief({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workspace,
        pilotRun,
        launchRoom
      }),
    [buyerScenario, launchRoom, pilotRun, recommendation, valueBlueprint, workspace]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(brief.exportMarkdown)}`;
  const shownRedLines = brief.redLines.slice(0, 3);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyBrief() {
    const copied = await onCopyText(brief.exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  return (
    <section id="buyer-outcome-brief" className={cx("buyer-outcome-brief", brief.decision)} aria-labelledby="buyer-outcome-brief-title">
      <div className="buyer-outcome-head">
        <div>
          <span className="eyebrow">Buyer outcome brief</span>
          <h2 id="buyer-outcome-brief-title">
            <FileText size={20} />
            {brief.headline}
          </h2>
          <p>{brief.hardTruth}</p>
          <div className="buyer-outcome-actions" aria-label="Buyer outcome brief actions">
            <a className="buyer-outcome-primary" href={publicBriefHref} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              Open buyer brief
            </a>
            <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyBrief}>
              <ClipboardCheck size={14} />
              {copyStatus === "copied" ? "Copied brief" : copyStatus === "failed" ? "Copy failed" : "Copy Markdown"}
            </button>
            <a className="icon-link" href={exportHref} download="buyer-outcome-brief.md">
              <Download size={14} />
              Download
            </a>
          </div>
        </div>
        <div className="buyer-outcome-score" aria-label="Buyer brief score">
          <span className={cx("risk-chip", tone(brief.decision))}>{brief.decision}</span>
          <strong>{brief.briefScore}</strong>
          <small>{brief.decisionAsk}</small>
        </div>
      </div>

      <div className="buyer-outcome-metrics" aria-label="Buyer outcome metrics">
        {brief.metrics.map((metric) => (
          <article key={metric.id} className={metric.status}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.evidence}</p>
          </article>
        ))}
      </div>

      <div className="buyer-outcome-body">
        <section className="buyer-outcome-narrative" aria-label="Buyer value narrative">
          <span>Value claim</span>
          <strong>{brief.valueNarrative}</strong>
          <p>{brief.measuredOutcome}</p>
        </section>

        <section className="buyer-outcome-story" aria-label="Outcome story">
          {brief.story.map((item) => (
            <article key={item.id}>
              <span>{item.label}</span>
              <strong>{item.narrative}</strong>
              <p>{item.proof}</p>
            </article>
          ))}
        </section>

        <section className="buyer-outcome-proof" aria-label="Buyer outcome proof checks">
          {brief.proof.slice(0, 6).map((item) => (
            <article key={item.id} className={item.status}>
              <div>
                <span>
                  {statusIcon(item.status)}
                  {item.status}
                </span>
                <b>{item.score}</b>
              </div>
              <strong>{item.label}</strong>
              <p>{item.evidence}</p>
              <a href={item.href}>{item.status === "pass" ? "Inspect" : "Repair"}</a>
            </article>
          ))}
        </section>

        <aside className="buyer-outcome-redlines" aria-label="Buyer outcome red lines">
          <span>Red lines</span>
          {shownRedLines.length > 0 ? (
            <ol>
              {shownRedLines.map((line) => (
                <li key={line.id} className={line.status}>
                  <strong>{line.label}</strong>
                  <p>{line.action}</p>
                  <small>{line.owner}</small>
                </li>
              ))}
            </ol>
          ) : (
            <div className="buyer-outcome-clear">
              <BadgeCheck size={18} />
              <strong>No blocked buyer proof checks.</strong>
              <p>Use the public brief as the first external buyer artifact.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
