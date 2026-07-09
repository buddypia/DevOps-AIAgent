import { AlertTriangle, Download, ExternalLink, History, ListChecks, NotebookTabs } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotAgreement } from "./pilotAgreement";
import { buildPilotEvidenceLedger } from "./pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "./pilotExecution";
import { buildPilotProposal } from "./pilotProposal";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type PilotEvidenceLedgerPanelProps = {
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

function readinessTone(readiness: string) {
  if (readiness === "sponsor-ready") return "low";
  if (readiness === "needs-proof") return "medium";
  return "high";
}

export default function PilotEvidenceLedgerPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  workspace,
  customAgents = []
}: PilotEvidenceLedgerPanelProps) {
  const proposal = useMemo(() => buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace }), [buyerScenario, recommendation, valueBlueprint, workspace]);
  const workflow = useMemo(() => buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario }), [buyerScenario, recommendation, valueBlueprint]);
  const receipt = useMemo(
    () => buildPilotRunReceipt({ recommendation, valueBlueprint, buyerScenario, workflow, pilotRun }),
    [buyerScenario, pilotRun, recommendation, valueBlueprint, workflow]
  );
  const matrix = useMemo(
    () => buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt: receipt }),
    [buyerScenario, receipt, recommendation, valueBlueprint]
  );
  const agreement = useMemo(
    () => buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix: matrix, pilotReceipt: receipt }),
    [buyerScenario, matrix, proposal, receipt, recommendation, valueBlueprint, workflow]
  );
  const execution = useMemo(() => buildPilotExecutionHandoff({ proposal, recommendation }), [proposal, recommendation]);
  const ledger = useMemo(
    () =>
      buildPilotEvidenceLedger({
        recommendation,
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        execution
      }),
    [agreement, buyerScenario, execution, matrix, proposal, receipt, recommendation, valueBlueprint, workflow]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(ledger.exportMarkdown)}`;
  const ledgerSearchParams = useMemo(() => {
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
  const publicLedgerHref = `/pilot-evidence-ledger?${ledgerSearchParams}`;

  return (
    <section id="pilot-evidence-ledger" className={cx("pilot-evidence-ledger", ledger.readiness)} aria-labelledby="pilot-evidence-ledger-title">
      <div className="pilot-evidence-heading">
        <div>
          <span className="eyebrow">Pilot Evidence Ledger</span>
          <h2 id="pilot-evidence-ledger-title">
            <NotebookTabs size={20} />
            {ledger.headline}
          </h2>
          <p>{ledger.hardTruth}</p>
        </div>
        <div className="pilot-evidence-score">
          <span className={cx("risk-chip", readinessTone(ledger.readiness))}>{ledger.readiness}</span>
          <strong>{ledger.ledgerScore}</strong>
          <small>{ledger.buyer}</small>
        </div>
      </div>

      <div className="pilot-evidence-metrics">
        <article>
          <span>Events</span>
          <strong>{ledger.events.length}</strong>
        </article>
        <article>
          <span>Exceptions</span>
          <strong>{ledger.exceptions.length}</strong>
        </article>
        <article>
          <span>Clear events</span>
          <strong>{ledger.events.filter((event) => event.status === "clear").length}</strong>
        </article>
        <a className="icon-link pilot-evidence-export" href={exportHref} download="pilot-evidence-ledger.md">
          <Download size={16} />
          Export ledger
        </a>
        <a className="icon-link pilot-evidence-export" href={publicLedgerHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public ledger
        </a>
      </div>

      <div className="pilot-evidence-body">
        <section className="pilot-evidence-memo">
          <h3>
            <ListChecks size={16} />
            Review memo
          </h3>
          <p>{ledger.reviewMemo}</p>
        </section>

        <section className="pilot-evidence-events">
          <h3>
            <History size={16} />
            Evidence events
          </h3>
          <div>
            {ledger.events.map((event) => (
              <article key={event.id} className={event.status}>
                <div>
                  <span>{event.status}</span>
                  <strong>{event.label}</strong>
                  <b>{event.score}/100</b>
                </div>
                <p>{event.evidence}</p>
                <small>
                  {event.owner} / {event.artifact}
                </small>
                <em>{event.nextAction}</em>
              </article>
            ))}
          </div>
        </section>

        <aside className="pilot-evidence-exceptions">
          <h3>
            <AlertTriangle size={16} />
            Exceptions
          </h3>
          {ledger.exceptions.length ? (
            ledger.exceptions.map((exception) => (
              <article key={exception.id} className={exception.severity}>
                <span>{exception.severity}</span>
                <strong>{exception.label}</strong>
                <p>{exception.fix}</p>
                <small>{exception.owner}</small>
              </article>
            ))
          ) : (
            <article className="clear">
              <span>clear</span>
              <strong>No open exceptions</strong>
              <p>All ledger events are clear enough for sponsor review.</p>
            </article>
          )}
        </aside>
      </div>
    </section>
  );
}
