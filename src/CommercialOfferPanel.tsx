import { BadgeDollarSign, ClipboardCheck, Download, ExternalLink, FileCheck2, MessageSquareQuote, ReceiptText, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { buildAdoptionOperatingPlan } from "./adoptionOperatingPlan";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import { buildBuyerTrustCenter } from "./buyerTrustCenter";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildBuyerWorkOrderBrief, type BuyerWorkOrderInput } from "./buyerWorkOrder";
import { buildCommercialOffer } from "./commercialOffer";
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

type CommercialOfferPanelProps = {
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
  if (readiness === "offer-ready") return "low";
  if (readiness === "needs-redlines") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "clear") return "low";
  if (status === "watch") return "medium";
  return "high";
}

function approvalTone(decision: string) {
  if (decision === "approve") return "low";
  if (decision === "redline") return "medium";
  return "high";
}

export default function CommercialOfferPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  buyerWorkOrder,
  pilotRun,
  workspace,
  customAgents = []
}: CommercialOfferPanelProps) {
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
  const trustCenter = useMemo(
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
  const offer = useMemo(
    () =>
      buildCommercialOffer({
        recommendation,
        valueBlueprint,
        buyerScenario,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        adoptionPlan,
        trustCenter
      }),
    [adoptionPlan, agreement, buyerScenario, matrix, receipt, recommendation, trustCenter, valueBlueprint]
  );
  const offerSearchParams = useMemo(() => {
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
  const recommendedTier = offer.tiers.find((tier) => tier.id === offer.recommendedTierId) ?? offer.tiers[0];
  const publicOfferHref = `/commercial-offer?${offerSearchParams}`;
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(offer.exportMarkdown)}`;
  const clearGuardrails = offer.guardrails.filter((guardrail) => guardrail.status === "clear").length;
  const clearApprovalConditions = offer.approvalMemo.conditions.filter((condition) => condition.status === "clear").length;

  return (
    <section id="commercial-offer" className={cx("commercial-offer", offer.readiness)} aria-labelledby="commercial-offer-title">
      <div className="commercial-offer-heading">
        <div>
          <span className="eyebrow">Commercial Offer</span>
          <h2 id="commercial-offer-title">
            <ReceiptText size={20} />
            {offer.headline}
          </h2>
          <p>{offer.hardTruth}</p>
        </div>
        <div className="commercial-offer-score">
          <span className={cx("risk-chip", readinessTone(offer.readiness))}>{offer.readiness}</span>
          <strong>{offer.offerScore}</strong>
          <small>{offer.contractAsk}</small>
        </div>
      </div>

      <div className="commercial-offer-metrics">
        <article>
          <span>First commitment</span>
          <strong>{yen(offer.totalFirstCommitmentYen)}</strong>
        </article>
        <article>
          <span>Expected value</span>
          <strong>{yen(offer.expectedMonthlyValueYen)}</strong>
        </article>
        <article>
          <span>Guardrails clear</span>
          <strong>{clearGuardrails}/{offer.guardrails.length}</strong>
        </article>
        <article>
          <span>Approval</span>
          <strong>{offer.approvalMemo.decision}</strong>
        </article>
        <a className="icon-link commercial-offer-export" href={exportHref} download="commercial-offer.md">
          <Download size={16} />
          Export offer
        </a>
        <a className="icon-link commercial-offer-export" href={publicOfferHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public offer
        </a>
      </div>

      <section className={cx("commercial-approval-memo", offer.approvalMemo.decision)} aria-label="Procurement approval memo">
        <div className="commercial-approval-head">
          <div>
            <span className={cx("risk-chip", approvalTone(offer.approvalMemo.decision))}>{offer.approvalMemo.decision}</span>
            <h3>
              <ClipboardCheck size={16} />
              Procurement approval memo
            </h3>
            <p>{offer.approvalMemo.summary}</p>
            <strong>{offer.approvalMemo.sendLine}</strong>
          </div>
          <div className="commercial-approval-score">
            <span>Approval score</span>
            <strong>{offer.approvalMemo.score}</strong>
            <small>
              {clearApprovalConditions}/{offer.approvalMemo.conditions.length} clear / signer {offer.approvalMemo.signer}
            </small>
          </div>
        </div>
        <div className="commercial-approval-conditions">
          {offer.approvalMemo.conditions.map((condition) => (
            <article key={condition.id} className={condition.status}>
              <div>
                <span className={cx("risk-chip", statusTone(condition.status))}>{condition.status}</span>
                <strong>{condition.label}</strong>
              </div>
              <p>{condition.evidence}</p>
              <small>
                {condition.owner} - before {condition.requiredBefore}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="commercial-offer-receipt" aria-label="Replayable commercial receipt">
        <div>
          <span className="risk-chip low">fnv1a-64</span>
          <h3>
            <FileCheck2 size={16} />
            Replayable commercial receipt
          </h3>
          <p>{offer.receipt.verification.instruction}</p>
        </div>
        <div className="commercial-offer-receipt-meta">
          <article>
            <span>Receipt</span>
            <strong>{offer.receipt.receiptId}</strong>
          </article>
          <article>
            <span>Checksum</span>
            <strong>{offer.receipt.checksum}</strong>
          </article>
          <a className="icon-link commercial-offer-export" href={offer.receipt.href} download={`${offer.receipt.receiptId}.md`}>
            <Download size={16} />
            Export receipt
          </a>
          <a className="icon-link commercial-offer-export" href={offer.receipt.verificationRequestHref} download="commercial-offer-verify-request.json">
            <ExternalLink size={16} />
            Verify request
          </a>
        </div>
      </section>

      <section className="commercial-value-stress" aria-label="Commercial value stress test">
        <div className="commercial-value-stress-head">
          <div>
            <span className="eyebrow">Value stress test</span>
            <h3>
              <BadgeDollarSign size={16} />
              Price survives the downside case
            </h3>
            <p>
              Break-even floor is {yen(offer.breakEvenMonthlyValueYen)}/month or {offer.breakEvenAdoptionRatePercent}% adoption before the first commitment is defensible.
            </p>
          </div>
          <strong>{recommendedTier.paybackDays} day base payback</strong>
        </div>
        <div className="commercial-value-stress-grid">
          {offer.valueStressCases.map((stressCase) => (
            <article key={stressCase.id} className={stressCase.status}>
              <div>
                <span className={cx("risk-chip", statusTone(stressCase.status))}>{stressCase.status}</span>
                <strong>{stressCase.label}</strong>
              </div>
              <b>{yen(stressCase.monthlyValueYen)}/mo</b>
              <p>{stressCase.assumption}</p>
              <small>
                {stressCase.paybackDays} day payback - {stressCase.buyerDecision}
              </small>
            </article>
          ))}
        </div>
      </section>

      <div className="commercial-offer-body">
        <section className="commercial-offer-tiers">
          <h3>
            <BadgeDollarSign size={16} />
            Proof-backed tiers
          </h3>
          <div>
            {offer.tiers.map((tier) => (
              <article key={tier.id} className={cx(tier.status, tier.id === offer.recommendedTierId && "recommended")}>
                <div>
                  <span className={cx("risk-chip", statusTone(tier.status))}>{tier.status}</span>
                  {tier.id === offer.recommendedTierId ? <b>Recommended</b> : null}
                </div>
                <strong>{tier.label}</strong>
                <small>{tier.term}</small>
                <p>{tier.scope}</p>
                <dl>
                  <div>
                    <dt>Price</dt>
                    <dd>{yen(tier.priceYen)}</dd>
                  </div>
                  <div>
                    <dt>Value</dt>
                    <dd>{yen(tier.buyerValueYen)}</dd>
                  </div>
                  <div>
                    <dt>Payback</dt>
                    <dd>{tier.paybackDays} days</dd>
                  </div>
                </dl>
                <small>{tier.acceptance}</small>
              </article>
            ))}
          </div>
        </section>

        <aside className="commercial-offer-sidebar">
          <section className="commercial-offer-guardrails">
            <h3>
              <FileCheck2 size={16} />
              Commercial guardrails
            </h3>
            <div>
              {offer.guardrails.map((guardrail) => (
                <article key={guardrail.id} className={guardrail.status}>
                  <div>
                    <span className={cx("risk-chip", statusTone(guardrail.status))}>{guardrail.status}</span>
                    <strong>{guardrail.label}</strong>
                  </div>
                  <p>{guardrail.rule}</p>
                  <small>
                    {guardrail.owner} - {guardrail.evidence}
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="commercial-offer-objections">
            <h3>
              <MessageSquareQuote size={16} />
              Buyer objections
            </h3>
            <div>
              {offer.objections.map((objection) => (
                <article key={objection.id}>
                  <strong>{objection.objection}</strong>
                  <p>{objection.answer}</p>
                  <small>{objection.proof}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="commercial-offer-renewal">
            <h3>
              <RefreshCw size={16} />
              Renewal criteria
            </h3>
            <div>
              {offer.renewalCriteria.map((criterion) => (
                <article key={criterion}>
                  <p>{criterion}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="commercial-offer-contract">
        <span className="risk-chip low">{recommendedTier.label}</span>
        <strong>{offer.contractAsk}</strong>
      </div>
    </section>
  );
}
