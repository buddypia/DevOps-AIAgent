import { BadgeCheck, CalendarCheck, Download, ExternalLink, FileText, HeartPulse, ListChecks, ShieldCheck, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { buildAdoptionOperatingPlan } from "./adoptionOperatingPlan";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "./buyerDiligence";
import { buildBuyerProofPacket } from "./buyerProofPacket";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildBuyerWorkOrderBrief, type BuyerWorkOrderInput } from "./buyerWorkOrder";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotAgreement } from "./pilotAgreement";
import { buildPilotEvidenceLedger } from "./pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "./pilotExecution";
import { buildPilotProposal } from "./pilotProposal";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import { buildSponsorDecisionReceipt, buildSponsorReviewRoom } from "./sponsorReviewRoom";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type AdoptionOperatingPlanPanelProps = {
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

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function readinessTone(readiness: string) {
  if (readiness === "ready-to-operate") return "low";
  if (readiness === "needs-owner-commitment") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "clear") return "low";
  if (status === "watch") return "medium";
  return "high";
}

export default function AdoptionOperatingPlanPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  buyerWorkOrder,
  pilotRun,
  workspace,
  customAgents = []
}: AdoptionOperatingPlanPanelProps) {
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
  const diligence = useMemo(
    () =>
      buildBuyerDiligenceRoom({
        proposal,
        handoff: execution,
        buyerScenario,
        valueBlueprint,
        recommendation
      }),
    [buyerScenario, execution, proposal, recommendation, valueBlueprint]
  );
  const sponsorReview = useMemo(
    () =>
      buildSponsorReviewRoom({
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        ledger,
        diligence,
        execution
      }),
    [agreement, buyerScenario, diligence, execution, ledger, matrix, proposal, receipt, valueBlueprint, workflow]
  );
  const proofPacket = useMemo(
    () =>
      buildBuyerProofPacket({
        recommendation,
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        ledger,
        diligence,
        execution,
        sponsorReview
      }),
    [agreement, buyerScenario, diligence, execution, ledger, matrix, proposal, receipt, recommendation, sponsorReview, valueBlueprint, workflow]
  );
  const sponsorDecisionReceipt = useMemo(() => buildSponsorDecisionReceipt(sponsorReview), [sponsorReview]);
  const plan = useMemo(
    () =>
      buildAdoptionOperatingPlan({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workOrder,
        workflow,
        pilotReceipt: receipt,
        agreement,
        ledger,
        proofPacketReceipt: proofPacket.receipt,
        sponsorDecisionReceipt
      }),
    [agreement, buyerScenario, ledger, proofPacket.receipt, receipt, recommendation, sponsorDecisionReceipt, valueBlueprint, workOrder, workflow]
  );
  const planSearchParams = useMemo(() => {
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
  const publicPlanHref = `/adoption-plan?${planSearchParams}`;
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(plan.exportMarkdown)}`;
  const openItems = [...plan.healthMetrics, ...plan.cadence].filter((item) => item.status !== "clear").length;

  return (
    <section id="adoption-operating-plan" className={cx("adoption-plan", plan.readiness)} aria-labelledby="adoption-plan-title">
      <div className="adoption-plan-heading">
        <div>
          <span className="eyebrow">Adoption Operating Plan</span>
          <h2 id="adoption-plan-title">
            <CalendarCheck size={20} />
            {plan.headline}
          </h2>
          <p>{plan.hardTruth}</p>
        </div>
        <div className="adoption-plan-score">
          <span className={cx("risk-chip", readinessTone(plan.readiness))}>{plan.readiness}</span>
          <strong>{plan.planScore}</strong>
          <small>{plan.buyer}</small>
        </div>
      </div>

      <div className="adoption-plan-metrics">
        <article>
          <span>Expected value</span>
          <strong>{yen(plan.expectedMonthlyValueYen)}</strong>
        </article>
        <article>
          <span>Risk-adjusted</span>
          <strong>{yen(plan.riskAdjustedMonthlyValueYen)}</strong>
        </article>
        <article>
          <span>Open operating items</span>
          <strong>{openItems}</strong>
        </article>
        <a className="icon-link adoption-plan-export" href={exportHref} download="adoption-operating-plan.md">
          <Download size={16} />
          Export plan
        </a>
        <a className="icon-link adoption-plan-export" href={publicPlanHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public plan
        </a>
        <a className="icon-link adoption-plan-export" href={plan.successLedger.href} download="adoption-success-ledger.md">
          <FileText size={16} />
          Success ledger
        </a>
        <a className="icon-link adoption-plan-export" href={plan.successLedger.receipt.href} download="adoption-success-receipt.md">
          <ShieldCheck size={16} />
          Success receipt
        </a>
        <a className="icon-link adoption-plan-export" href={plan.successLedger.csvHref} download="adoption-success-ledger.csv">
          <Download size={16} />
          Ledger CSV
        </a>
        <a className="icon-link adoption-plan-export" href={plan.operatingCalendar.icsHref} download="adoption-operating-calendar.ics">
          <CalendarCheck size={16} />
          Calendar ICS
        </a>
        <a className="icon-link adoption-plan-export" href={plan.operatingCalendar.href} download="adoption-operating-calendar.md">
          <FileText size={16} />
          Calendar plan
        </a>
      </div>

      <div className="adoption-plan-body">
        <section className="adoption-plan-cadence">
          <h3>
            <ListChecks size={16} />
            30-day cadence
          </h3>
          <div>
            {plan.cadence.map((step) => (
              <article key={step.id} className={step.status}>
                <span>{step.window}</span>
                <strong>{step.label}</strong>
                <p>{step.objective}</p>
                <small>
                  {step.owner} - {step.exitCriteria}
                </small>
              </article>
            ))}
          </div>
        </section>

        <aside className="adoption-plan-sidebar">
          <section>
            <h3>
              <HeartPulse size={16} />
              Health checks
            </h3>
            <div className="adoption-plan-health">
              {plan.healthMetrics.map((metric) => (
                <article key={metric.id} className={metric.status}>
                  <div>
                    <span className={cx("risk-chip", statusTone(metric.status))}>{metric.status}</span>
                    <strong>{metric.value}</strong>
                  </div>
                  <b>{metric.label}</b>
                  <p>{metric.evidence}</p>
                  <small>{metric.owner}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>
              <ShieldCheck size={16} />
              Interventions
            </h3>
            <div className="adoption-plan-interventions">
              {plan.interventions.map((intervention) => (
                <article key={intervention.id} className={intervention.severity}>
                  <span>{intervention.severity}</span>
                  <strong>{intervention.trigger}</strong>
                  <p>{intervention.action}</p>
                  <small>{intervention.owner}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>
              <UsersRound size={16} />
              Owner commitments
            </h3>
            <div className="adoption-plan-owners">
              {plan.ownerCommitments.map((commitment) => (
                <article key={`${commitment.role}-${commitment.owner}`}>
                  <span>{commitment.role}</span>
                  <strong>{commitment.owner}</strong>
                  <p>{commitment.commitment}</p>
                  <small>{commitment.artifact}</small>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="adoption-plan-anchors" aria-label="Approval anchors">
        <h3>
          <BadgeCheck size={16} />
          Approval anchors
        </h3>
        <div>
          {plan.approvalAnchors.map((anchor) => (
            <article key={anchor.id} className={anchor.status}>
              <span className={cx("risk-chip", statusTone(anchor.status))}>{anchor.status}</span>
              <strong>{anchor.label}</strong>
              <p>{anchor.evidence}</p>
              <small>
                {anchor.owner} - {anchor.action}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="adoption-success-ledger" aria-label="Adoption success ledger">
        <div>
          <span>Success ledger</span>
          <strong>{plan.successLedger.headline}</strong>
          <p>
            {plan.successLedger.decision} - {plan.successLedger.successScore}/100 - {plan.successLedger.renewalAsk}
          </p>
        </div>
        <div>
          {plan.successLedger.rows.slice(0, 6).map((row) => (
            <article key={row.id} className={row.status}>
              <span className={cx("risk-chip", statusTone(row.status))}>{row.status}</span>
              <strong>{row.label}</strong>
              <b>{row.value}</b>
              <p>{row.evidence}</p>
              <small>
                {row.owner} - {row.action}
              </small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
