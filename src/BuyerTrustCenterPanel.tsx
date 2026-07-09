import { ClipboardCheck, Download, ExternalLink, FileCheck2, HelpCircle, ShieldCheck, TriangleAlert, Waypoints } from "lucide-react";
import { useMemo } from "react";
import { buildAdoptionOperatingPlan } from "./adoptionOperatingPlan";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import { buildBuyerTrustCenter } from "./buyerTrustCenter";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildBuyerWorkOrderBrief, type BuyerWorkOrderInput } from "./buyerWorkOrder";
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

type BuyerTrustCenterPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  pilotRun: PilotRunReceiptInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  customAgents?: MarketAgent[];
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readinessTone(readiness: string) {
  if (readiness === "trust-ready") return "low";
  if (readiness === "needs-review") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "clear") return "low";
  if (status === "watch") return "medium";
  return "high";
}

export default function BuyerTrustCenterPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  buyerWorkOrder,
  pilotRun,
  workspace,
  customAgents = []
}: BuyerTrustCenterPanelProps) {
  const workOrder = useMemo(
    () => buildBuyerWorkOrderBrief({ recommendation, valueBlueprint, buyerScenario, workOrder: buyerWorkOrder }),
    [buyerScenario, buyerWorkOrder, recommendation, valueBlueprint]
  );
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
  const adoptionPlan = useMemo(
    () =>
      buildAdoptionOperatingPlan({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workOrder,
        workflow,
        pilotReceipt: receipt,
        agreement,
        ledger
      }),
    [agreement, buyerScenario, ledger, receipt, recommendation, valueBlueprint, workOrder, workflow]
  );
  const center = useMemo(
    () =>
      buildBuyerTrustCenter({
        recommendation,
        valueBlueprint,
        workOrder,
        workOrderInput: buyerWorkOrder,
        pilotReceipt: receipt,
        agreement,
        ledger,
        adoptionPlan,
        workspace
      }),
    [adoptionPlan, agreement, buyerWorkOrder, ledger, receipt, recommendation, valueBlueprint, workOrder, workspace]
  );
  const trustSearchParams = useMemo(() => {
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
      pilotTotalTasks: String(pilotRun.totalTasks),
      workOrder: buyerWorkOrder.request,
      workOrderSuccessMetric: buyerWorkOrder.successMetric,
      workOrderBaseline: buyerWorkOrder.currentBaseline,
      workOrderDataSensitivity: buyerWorkOrder.dataSensitivity
    });
    if (buyerWorkOrder.targetUser) params.set("workOrderTargetUser", buyerWorkOrder.targetUser);
    if (buyerWorkOrder.evidenceUrl) params.set("workOrderEvidenceUrl", buyerWorkOrder.evidenceUrl);
    if (pilotRun.evidenceUrl) params.set("pilotEvidenceUrl", pilotRun.evidenceUrl);
    if (pilotRun.reviewerName) params.set("pilotReviewer", pilotRun.reviewerName);
    if (pilotRun.notes) params.set("pilotNotes", pilotRun.notes);
    if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
    if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
    if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
    if (workspace.agentTrialEvidence.length) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));
    if (customAgents.length) params.set("customAgents", encodeCustomAgentsParam(customAgents));
    return params.toString();
  }, [buyerScenario.assumptions, buyerWorkOrder, customAgents, pilotRun, projectBrief, recommendation.selected, workspace]);
  const publicTrustHref = `/trust-center?${trustSearchParams}`;
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(center.exportMarkdown)}`;
  const openRisks = center.risks.filter((risk) => risk.severity === "blocked").length;

  return (
    <section id="buyer-trust-center" className={cx("buyer-trust-center", center.readiness)} aria-labelledby="buyer-trust-center-title">
      <div className="buyer-trust-heading">
        <div>
          <span className="eyebrow">Buyer Trust Center</span>
          <h2 id="buyer-trust-center-title">
            <ShieldCheck size={20} />
            {center.headline}
          </h2>
          <p>{center.hardTruth}</p>
        </div>
        <div className="buyer-trust-score">
          <span className={cx("risk-chip", readinessTone(center.readiness))}>{center.readiness}</span>
          <strong>{center.trustScore}</strong>
          <small>{center.dataBoundary}</small>
        </div>
      </div>

      <div className="buyer-trust-metrics">
        <article>
          <span>Controls</span>
          <strong>{center.controls.filter((control) => control.status === "clear").length}/{center.controls.length}</strong>
        </article>
        <article>
          <span>Open blockers</span>
          <strong>{openRisks}</strong>
        </article>
        <article>
          <span>Trust boundaries</span>
          <strong>{center.boundaries.length}</strong>
        </article>
        <a className="icon-link buyer-trust-export" href={exportHref} download="buyer-trust-center.md">
          <Download size={16} />
          Export trust center
        </a>
        <a className="icon-link buyer-trust-export" href={publicTrustHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public trust
        </a>
      </div>

      <section className="buyer-trust-memo" aria-labelledby="buyer-trust-memo-title">
        <div className="buyer-trust-memo-head">
          <div>
            <h3 id="buyer-trust-memo-title">
              <ClipboardCheck size={16} />
              Procurement decision memo
            </h3>
            <strong>{center.decisionMemo.headline}</strong>
            <p>{center.decisionMemo.sponsorAsk}</p>
            <small>{center.decisionMemo.committeeSummary}</small>
          </div>
          <span className={cx("risk-chip", readinessTone(center.readiness))}>{center.decisionMemo.verdict}</span>
        </div>

        <div className="buyer-trust-memo-grid">
          <article>
            <h4>Approval checks</h4>
            <div>
              {center.decisionMemo.approvalChecks.map((item) => (
                <section key={item.id} className={item.status}>
                  <span className={cx("risk-chip", statusTone(item.status))}>{item.status}</span>
                  <strong>{item.label}</strong>
                  <p>{item.evidence}</p>
                  <small>
                    {item.owner} - {item.nextAction}
                  </small>
                </section>
              ))}
            </div>
          </article>

          <article>
            <h4>Evidence requests</h4>
            <div>
              {center.decisionMemo.evidenceRequests.map((item) => (
                <section key={item.id} className={item.status}>
                  <span className={cx("risk-chip", statusTone(item.status))}>{item.status}</span>
                  <strong>{item.label}</strong>
                  <p>{item.nextAction}</p>
                  <small>
                    {item.owner} - {item.evidence}
                  </small>
                </section>
              ))}
            </div>
          </article>

          <article>
            <h4>Red lines</h4>
            <ul>
              {center.decisionMemo.redLines.map((redLine) => (
                <li key={redLine}>{redLine}</li>
              ))}
            </ul>
          </article>

          <article>
            <h4>Meeting agenda</h4>
            <ol>
              {center.decisionMemo.meetingAgenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <div className="buyer-trust-body">
        <section className="buyer-trust-controls">
          <h3>
            <FileCheck2 size={16} />
            Trust controls
          </h3>
          <div>
            {center.controls.map((control) => (
              <article key={control.id} className={control.status}>
                <div>
                  <span className={cx("risk-chip", statusTone(control.status))}>{control.status}</span>
                  <strong>{control.label}</strong>
                </div>
                <p>{control.evidence}</p>
                <small>
                  {control.owner} - {control.nextAction}
                </small>
              </article>
            ))}
          </div>
        </section>

        <aside className="buyer-trust-sidebar">
          <section>
            <h3>
              <Waypoints size={16} />
              Boundaries
            </h3>
            <div className="buyer-trust-boundaries">
              {center.boundaries.map((boundary) => (
                <article key={boundary.id}>
                  <span>
                    {boundary.from} -&gt; {boundary.to}
                  </span>
                  <strong>{boundary.guardrail}</strong>
                  <p>{boundary.dataHandled}</p>
                  <small>{boundary.evidence}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>
              <HelpCircle size={16} />
              Buyer questions
            </h3>
            <div className="buyer-trust-questions">
              {center.questions.map((question) => (
                <article key={question.id}>
                  <strong>{question.question}</strong>
                  <p>{question.answer}</p>
                  <small>{question.evidence}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>
              <TriangleAlert size={16} />
              Risks
            </h3>
            <div className="buyer-trust-risks">
              {center.risks.map((risk) => (
                <article key={risk.id} className={risk.severity}>
                  <span>{risk.severity}</span>
                  <strong>{risk.label}</strong>
                  <p>{risk.mitigation}</p>
                  <small>{risk.owner}</small>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
