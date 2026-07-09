import { BarChart3, Download, ExternalLink, Gauge, Scale, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type BuyerDecisionMatrixPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  customAgents?: MarketAgent[];
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function readinessTone(readiness: string) {
  if (readiness === "buy-a2a") return "low";
  if (readiness === "pilot-more") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "recommended" || status === "clear") return "clear";
  if (status === "viable" || status === "watch") return "watch";
  return "blocked";
}

export default function BuyerDecisionMatrixPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  workspace,
  customAgents = []
}: BuyerDecisionMatrixPanelProps) {
  const workflow = useMemo(() => buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario }), [buyerScenario, recommendation, valueBlueprint]);
  const receipt = useMemo(
    () => buildPilotRunReceipt({ recommendation, valueBlueprint, buyerScenario, workflow, pilotRun }),
    [buyerScenario, pilotRun, recommendation, valueBlueprint, workflow]
  );
  const matrix = useMemo(
    () =>
      buildBuyerDecisionMatrix({
        recommendation,
        valueBlueprint,
        buyerScenario,
        pilotReceipt: receipt
      }),
    [buyerScenario, receipt, recommendation, valueBlueprint]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(matrix.exportMarkdown)}`;
  const decisionSearchParams = useMemo(() => {
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
  const publicMatrixHref = `/buyer-decision?${decisionSearchParams}`;
  const winner = matrix.alternatives.find((alternative) => alternative.id === matrix.winnerId) ?? matrix.alternatives[0];
  const a2a = matrix.alternatives.find((alternative) => alternative.id === "a2a-squad") ?? winner;
  const metrics = [
    { label: "Winner", value: winner?.label ?? matrix.winnerId },
    { label: "Confidence", value: `${matrix.confidenceScore}/100` },
    { label: "A2A payback", value: `${a2a?.paybackDays ?? 999} days` },
    { label: "Time to value", value: `${a2a?.timeToValueDays ?? 0} days` }
  ];

  return (
    <section id="buyer-decision-matrix" className={cx("buyer-decision-matrix", matrix.readiness)} aria-labelledby="buyer-decision-title">
      <div className="buyer-decision-heading">
        <div>
          <span className="eyebrow">Procurement Decision Matrix</span>
          <h2 id="buyer-decision-title">
            <Scale size={20} />
            {matrix.headline}
          </h2>
          <p>{matrix.hardTruth}</p>
        </div>
        <div className="buyer-decision-score">
          <span className={cx("risk-chip", readinessTone(matrix.readiness))}>{matrix.readiness}</span>
          <strong>{winner?.score ?? matrix.confidenceScore}</strong>
          <small>{winner?.label ?? "No winner"}</small>
        </div>
      </div>

      <div className="buyer-decision-metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
        <a className="icon-link buyer-decision-export" href={exportHref} download="buyer-decision-matrix.md">
          <Download size={16} />
          Export matrix
        </a>
        <a className="icon-link buyer-decision-export" href={publicMatrixHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public matrix
        </a>
      </div>

      <div className="buyer-decision-body">
        <section className="buyer-decision-alternatives">
          <h3>
            <BarChart3 size={16} />
            Alternatives
          </h3>
          <div>
            {matrix.alternatives.map((alternative) => (
              <article key={alternative.id} className={statusTone(alternative.status)}>
                <div>
                  <span>{alternative.status}</span>
                  <strong>{alternative.label}</strong>
                </div>
                <b>{alternative.score}/100</b>
                <p>
                  {yen(alternative.monthlyValueYen)} monthly value / {alternative.paybackDays} day payback / {alternative.timeToValueDays} days to value
                </p>
                <small>{alternative.evidence}</small>
                <small>{alternative.tradeoff}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="buyer-decision-checks">
          <h3>
            <ShieldCheck size={16} />
            Decision checks
          </h3>
          <div>
            {matrix.checks.map((check) => (
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

        <aside className="buyer-decision-proof">
          <h3>
            <Gauge size={16} />
            Decision ask
          </h3>
          <strong>{matrix.targetBuyer}</strong>
          <p>{winner?.decision ?? "Keep collecting evidence before asking for approval."}</p>
          <small>{matrix.id}</small>
        </aside>
      </div>
    </section>
  );
}
