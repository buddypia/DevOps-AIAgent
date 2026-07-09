import { ClipboardCheck, Download, ExternalLink, Gauge, Link2, TimerReset } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type PilotRunReceiptPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  customAgents?: MarketAgent[];
  onChange: (patch: Partial<PilotRunReceiptInput>) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function readinessTone(readiness: string) {
  if (readiness === "accepted") return "low";
  if (readiness === "needs-evidence") return "medium";
  return "high";
}

export default function PilotRunReceiptPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  workspace,
  customAgents = [],
  onChange
}: PilotRunReceiptPanelProps) {
  const workflow = useMemo(() => buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario }), [buyerScenario, recommendation, valueBlueprint]);
  const receipt = useMemo(
    () => buildPilotRunReceipt({ recommendation, valueBlueprint, buyerScenario, workflow, pilotRun }),
    [buyerScenario, pilotRun, recommendation, valueBlueprint, workflow]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(receipt.exportMarkdown)}`;
  const receiptSearchParams = useMemo(() => {
    const params = new URLSearchParams({
      brief: projectBrief.slice(0, 4000),
      agents: recommendation.selected.map((agent) => agent.id).join(","),
      teamSize: String(buyerScenario.assumptions.teamSize),
      hourlyCostYen: String(buyerScenario.assumptions.hourlyCostYen),
      cyclesPerMonth: String(buyerScenario.assumptions.cyclesPerMonth),
      manualHoursPerCycle: String(buyerScenario.assumptions.manualHoursPerCycle),
      adoptionRatePercent: String(buyerScenario.assumptions.adoptionRatePercent),
      incidentRiskYenPerMonth: String(buyerScenario.assumptions.incidentRiskYenPerMonth),
      pilotManualMinutes: String(pilotRun.observedManualMinutes),
      pilotAssistedMinutes: String(pilotRun.observedAssistedMinutes),
      pilotParticipants: String(pilotRun.participants),
      pilotAcceptedTasks: String(pilotRun.acceptedTasks),
      pilotTotalTasks: String(pilotRun.totalTasks)
    });
    if (pilotRun.evidenceUrl) params.set("pilotEvidenceUrl", pilotRun.evidenceUrl);
    if (pilotRun.reviewerName) params.set("pilotReviewer", pilotRun.reviewerName);
    if (pilotRun.notes) params.set("pilotNotes", pilotRun.notes);
    if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
    if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
    if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
    if (workspace.agentTrialEvidence.length) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));
    if (customAgents.length) params.set("customAgents", encodeCustomAgentsParam(customAgents));
    return params.toString();
  }, [buyerScenario.assumptions, customAgents, pilotRun, projectBrief, recommendation.selected, workspace]);
  const publicReceiptHref = `/pilot-run-receipt?${receiptSearchParams}`;
  const fields = [
    { key: "observedManualMinutes", label: "Manual minutes", min: 1, max: 7200, step: 1, value: pilotRun.observedManualMinutes },
    { key: "observedAssistedMinutes", label: "Assisted minutes", min: 1, max: 7200, step: 1, value: pilotRun.observedAssistedMinutes },
    { key: "participants", label: "Participants", min: 1, max: 200, step: 1, value: pilotRun.participants },
    { key: "acceptedTasks", label: "Accepted tasks", min: 0, max: pilotRun.totalTasks, step: 1, value: pilotRun.acceptedTasks },
    { key: "totalTasks", label: "Total tasks", min: 1, max: 20, step: 1, value: pilotRun.totalTasks }
  ] as const;

  return (
    <section id="pilot-run-receipt" className={cx("pilot-run-receipt", receipt.readiness)} aria-labelledby="pilot-run-receipt-title">
      <div className="pilot-run-receipt-heading">
        <div>
          <span className="eyebrow">First Pilot Receipt</span>
          <h2 id="pilot-run-receipt-title">
            <ClipboardCheck size={20} />
            {receipt.headline}
          </h2>
          <p>{receipt.hardTruth}</p>
        </div>
        <div className="pilot-run-receipt-score">
          <span className={cx("risk-chip", readinessTone(receipt.readiness))}>{receipt.readiness}</span>
          <strong>{receipt.receiptScore}</strong>
          <small>{receipt.workflowName}</small>
        </div>
      </div>

      <div className="pilot-run-receipt-metrics">
        <article>
          <span>Saved per run</span>
          <strong>{receipt.actualMinutesSavedPerRun}m</strong>
          <p>Planned {receipt.plannedMinutesSavedPerRun}m</p>
        </article>
        <article>
          <span>Measured value</span>
          <strong>{yen(receipt.measuredMonthlyValueYen)}</strong>
          <p>{receipt.measuredMonthlyHoursSaved}h measured monthly hours</p>
        </article>
        <article>
          <span>Acceptance</span>
          <strong>{receipt.acceptanceRatePercent}%</strong>
          <p>{receipt.acceptedTasks}/{receipt.totalTasks} tasks accepted</p>
        </article>
        <a className="icon-link pilot-run-receipt-export" href={exportHref} download="pilot-run-receipt.md">
          <Download size={16} />
          Export receipt
        </a>
        <a className="icon-link pilot-run-receipt-export" href={publicReceiptHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public receipt
        </a>
      </div>

      <div className="pilot-run-receipt-body">
        <section className="pilot-run-receipt-inputs">
          <h3>
            <TimerReset size={16} />
            Measured run
          </h3>
          <div>
            {fields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={field.value}
                  onChange={(event) => onChange({ [field.key]: Number(event.target.value) } as Partial<PilotRunReceiptInput>)}
                />
              </label>
            ))}
          </div>
          <label>
            <span>Evidence URL</span>
            <input type="url" value={pilotRun.evidenceUrl} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl} onChange={(event) => onChange({ evidenceUrl: event.target.value })} />
          </label>
          <label>
            <span>Reviewer</span>
            <input type="text" value={pilotRun.reviewerName} placeholder="Buyer sponsor or pilot owner" onChange={(event) => onChange({ reviewerName: event.target.value })} />
          </label>
          <label>
            <span>Notes</span>
            <textarea value={pilotRun.notes} placeholder="What happened in the first run?" onChange={(event) => onChange({ notes: event.target.value })} />
          </label>
        </section>

        <section className="pilot-run-receipt-checks">
          <h3>
            <Gauge size={16} />
            Receipt checks
          </h3>
          <div>
            {receipt.checks.map((check) => (
              <article key={check.id} className={check.status}>
                <div>
                  <span>{check.status}</span>
                  <strong>{check.label}</strong>
                </div>
                <p>{check.evidence}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="pilot-run-receipt-proof">
          <h3>
            <Link2 size={16} />
            Proof link
          </h3>
          <p>{receipt.evidenceUrl || "Attach a public run log, recording, issue, or receipt URL before asking a sponsor to approve the pilot."}</p>
          <small>{receipt.notes || "No run notes recorded yet."}</small>
        </aside>
      </div>
    </section>
  );
}
