import { BadgeDollarSign, ClipboardCheck, Copy, Download, ExternalLink, FileCheck2, ListChecks, Scale, ShieldCheck, SlidersHorizontal, TimerReset, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { encodeAgentTrialEvidenceParam, type AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import { buildBuyerProcurementDecision, type BuyerProcurementBuyabilityLever } from "./buyerProcurementDecision";
import type { BuyerValueScenario, BuyerValueScenarioInput } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import { encodeCustomAgentsParam } from "./customAgent";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import { buyerFacingProofUrlProblem, PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";

type BuyerProcurementDecisionDeskProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  buyerScenarioInput: BuyerValueScenarioInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  pilotRun: PilotRunReceiptInput;
  workspace: {
    targetUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    agentTrialEvidence: AgentTrialEvidenceRecord[];
  };
  customAgents?: MarketAgent[];
  onBuyerScenarioChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  onBuyerWorkOrderChange: (patch: Partial<BuyerWorkOrderInput>) => void;
  onPilotRunChange: (patch: Partial<PilotRunReceiptInput>) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function readinessTone(readiness: string) {
  if (readiness === "buy-now") return "low";
  if (readiness === "pilot-first") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "clear") return "low";
  if (status === "watch") return "medium";
  return "high";
}

function leverHasPatch(lever: BuyerProcurementBuyabilityLever) {
  const patch = lever.patch;
  return Boolean(
    patch &&
      ((patch.buyerScenario && Object.keys(patch.buyerScenario).length > 0) ||
        (patch.buyerWorkOrder && Object.keys(patch.buyerWorkOrder).length > 0) ||
        (patch.pilotRun && Object.keys(patch.pilotRun).length > 0))
  );
}

export default function BuyerProcurementDecisionDesk({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  buyerScenarioInput,
  buyerWorkOrder,
  pilotRun,
  workspace,
  customAgents = [],
  onBuyerScenarioChange,
  onBuyerWorkOrderChange,
  onPilotRunChange
}: BuyerProcurementDecisionDeskProps) {
  const [memoCopyStatus, setMemoCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const decision = useMemo(
    () =>
      buildBuyerProcurementDecision({
        recommendation,
        valueBlueprint,
        buyerScenario,
        buyerWorkOrder,
        pilotRun
      }),
    [buyerScenario, buyerWorkOrder, pilotRun, recommendation, valueBlueprint]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(decision.exportMarkdown)}`;
  const actionPlanMarkdownHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(decision.mutualActionPlan.exportMarkdown)}`;
  const actionPlanCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(decision.mutualActionPlan.exportCsv)}`;
  const decisionContractHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(decision.decisionContract.exportMarkdown)}`;
  const approvalMemoHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(decision.approvalMemo.exportMarkdown)}`;
  const procurementProofUrl = pilotRun.evidenceUrl || buyerWorkOrder.evidenceUrl;
  const procurementProofUrlProblem = buyerFacingProofUrlProblem(procurementProofUrl);
  const procurementProofUrlLine = procurementProofUrlProblem || "Proof URL is buyer-facing and can support procurement approval.";
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
      pilotTotalTasks: String(pilotRun.totalTasks),
      workOrder: buyerWorkOrder.request,
      workOrderTargetUser: buyerWorkOrder.targetUser,
      workOrderSuccessMetric: buyerWorkOrder.successMetric,
      workOrderBaseline: buyerWorkOrder.currentBaseline,
      workOrderDataSensitivity: buyerWorkOrder.dataSensitivity
    });
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
  const publicMatrixHref = `/buyer-decision?${decisionSearchParams}`;
  const publicDecisionHref = `/procurement-decision?${decisionSearchParams}`;
  const topAlternatives = decision.alternatives.slice(0, 4);
  const primaryAction = decision.actions[0];
  const applyBuyabilityLever = (lever: BuyerProcurementBuyabilityLever) => {
    if (!lever.patch) return;
    if (lever.patch.buyerScenario) onBuyerScenarioChange(lever.patch.buyerScenario);
    if (lever.patch.buyerWorkOrder) onBuyerWorkOrderChange(lever.patch.buyerWorkOrder);
    if (lever.patch.pilotRun) onPilotRunChange(lever.patch.pilotRun);
  };
  const copyApprovalMemo = async () => {
    try {
      await navigator.clipboard.writeText(decision.approvalMemo.exportMarkdown);
      setMemoCopyStatus("copied");
    } catch {
      setMemoCopyStatus("failed");
    }
  };

  useEffect(() => {
    setMemoCopyStatus("idle");
  }, [decision.approvalMemo.id]);

  return (
    <section id="procurement-decision-desk" className={cx("procurement-decision", decision.readiness)} aria-labelledby="procurement-decision-title">
      <div className="procurement-decision-head">
        <div>
          <span className="eyebrow">Procurement Decision Desk</span>
          <h2 id="procurement-decision-title">
            <Scale size={20} />
            {decision.headline}
          </h2>
          <p>{decision.hardTruth}</p>
        </div>
        <div className="procurement-decision-score" aria-label="Procurement decision score">
          <span className={cx("risk-chip", readinessTone(decision.readiness))}>{decision.readiness}</span>
          <strong>{decision.score}</strong>
          <small>{decision.winnerLabel}</small>
        </div>
      </div>

      <div className="procurement-decision-metrics" aria-label="Procurement decision metrics">
        <article>
          <span>Monthly value</span>
          <strong>{yen(decision.monthlyValueYen)}</strong>
        </article>
        <article>
          <span>First ask</span>
          <strong>{yen(decision.firstCommitmentYen)}</strong>
        </article>
        <article>
          <span>Payback</span>
          <strong>{decision.paybackDays} days</strong>
        </article>
        <article>
          <span>Time to value</span>
          <strong>{decision.timeToValueDays} days</strong>
        </article>
        <a className="icon-link procurement-decision-export" href={exportHref} download="procurement-decision.md">
          <Download size={15} />
          Export decision
        </a>
      </div>

      <section className={cx("procurement-approval-memo", decision.approvalMemo.readiness)} aria-label="Procurement approval memo">
        <header>
          <div>
            <h3>
              <ClipboardCheck size={16} />
              Approval memo
            </h3>
            <strong>{decision.approvalMemo.headline}</strong>
            <p>{decision.approvalMemo.executiveSummary}</p>
          </div>
          <div className="procurement-approval-memo-actions">
            <button type="button" className="icon-link" onClick={copyApprovalMemo}>
              <Copy size={15} />
              {memoCopyStatus === "copied" ? "Copied memo" : memoCopyStatus === "failed" ? "Copy failed" : "Copy memo"}
            </button>
            <a className="icon-link" href={approvalMemoHref} download="procurement-approval-memo.md">
              <Download size={15} />
              Memo MD
            </a>
          </div>
        </header>
        <div className="procurement-approval-memo-summary">
          <article>
            <span>Recommendation</span>
            <strong>{decision.approvalMemo.recommendation}</strong>
          </article>
          <article>
            <span>Approval line</span>
            <strong>{decision.approvalMemo.approvalLine}</strong>
          </article>
          <article>
            <span>Proof line</span>
            <strong>{decision.approvalMemo.proofLine}</strong>
          </article>
          <article>
            <span>Risk line</span>
            <strong>{decision.approvalMemo.riskLine}</strong>
          </article>
        </div>
        <div className="procurement-approval-memo-sections">
          {decision.approvalMemo.sections.map((section) => (
            <article key={section.id} className={section.status}>
              <div>
                <span className={cx("risk-chip", statusTone(section.status))}>{section.status}</span>
                <strong>{section.label}</strong>
              </div>
              <p>{section.headline}</p>
              <small>{section.evidence}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="procurement-decision-body">
        <section className="procurement-decision-verdict" aria-label="Procurement verdict">
          <div className="procurement-decision-stamp">
            <span>{decision.targetBuyer}</span>
            <strong>{decision.a2aScore}/100 A2A</strong>
            <p>
              {decision.evidenceGapCount} proof gap{decision.evidenceGapCount === 1 ? "" : "s"} before full approval.
            </p>
          </div>
          {primaryAction && (
            <a className="procurement-decision-primary" href={primaryAction.href}>
              <TrendingUp size={15} />
              <span>{primaryAction.owner}</span>
              <strong>{primaryAction.action}</strong>
            </a>
          )}
          <div className="procurement-decision-actions">
            <a className="icon-link" href={publicMatrixHref} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              Open public matrix
            </a>
            <a className="icon-link" href={publicDecisionHref} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              Open decision proof
            </a>
            <a className="icon-link" href="#commercial-offer">
              <BadgeDollarSign size={15} />
              Open offer
            </a>
          </div>
        </section>

        <section className="procurement-decision-controls" aria-label="Procurement decision controls">
          <div className="procurement-decision-control-head">
            <span>Decision inputs</span>
            <strong>{decision.confidenceScore}/100 confidence</strong>
          </div>
          <label className="procurement-decision-wide">
            <span>Target user</span>
            <input value={buyerWorkOrder.targetUser} onChange={(event) => onBuyerWorkOrderChange({ targetUser: event.target.value })} placeholder="Platform sponsor" />
          </label>
          <label className="procurement-decision-wide">
            <span>Work order</span>
            <textarea value={buyerWorkOrder.request} onChange={(event) => onBuyerWorkOrderChange({ request: event.target.value })} />
          </label>
          <div className="procurement-decision-field-grid">
            <label>
              <span>Adoption</span>
              <input type="number" min={5} max={100} step={5} value={buyerScenarioInput.adoptionRatePercent} onChange={(event) => onBuyerScenarioChange({ adoptionRatePercent: Number(event.target.value) })} />
              <small>%</small>
            </label>
            <label>
              <span>Manual h/cycle</span>
              <input type="number" min={1} max={120} step={1} value={buyerScenarioInput.manualHoursPerCycle} onChange={(event) => onBuyerScenarioChange({ manualHoursPerCycle: Number(event.target.value) })} />
              <small>h</small>
            </label>
            <label>
              <span>Manual run</span>
              <input type="number" min={1} max={7200} value={pilotRun.observedManualMinutes} onChange={(event) => onPilotRunChange({ observedManualMinutes: Number(event.target.value) })} />
              <small>min</small>
            </label>
            <label>
              <span>Assisted run</span>
              <input type="number" min={1} max={7200} value={pilotRun.observedAssistedMinutes} onChange={(event) => onPilotRunChange({ observedAssistedMinutes: Number(event.target.value) })} />
              <small>min</small>
            </label>
          </div>
          <div className="procurement-decision-field-grid">
            <label>
              <span>Data</span>
              <select value={buyerWorkOrder.dataSensitivity} onChange={(event) => onBuyerWorkOrderChange({ dataSensitivity: event.target.value as BuyerWorkOrderInput["dataSensitivity"] })}>
                <option value="public">Public-safe</option>
                <option value="internal">Internal</option>
                <option value="restricted">Restricted</option>
              </select>
            </label>
            <label>
              <span>Reviewer</span>
              <input value={pilotRun.reviewerName} onChange={(event) => onPilotRunChange({ reviewerName: event.target.value })} placeholder="Buyer reviewer" />
            </label>
          </div>
          <label
            className={cx(
              "procurement-decision-wide",
              !procurementProofUrlProblem && "is-confirmed",
              procurementProofUrl.trim() && procurementProofUrlProblem && "is-risk"
            )}
          >
            <span>Proof URL</span>
            <input
              type="url"
              value={procurementProofUrl}
              onChange={(event) => {
                onPilotRunChange({ evidenceUrl: event.target.value });
                onBuyerWorkOrderChange({ evidenceUrl: event.target.value });
              }}
              placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl}
            />
            <small>{procurementProofUrlLine}</small>
          </label>
        </section>
      </div>

      <section className="procurement-buyability-levers" aria-label="Buyability levers">
        <header>
          <div>
            <h3>
              <SlidersHorizontal size={16} />
              Buyability levers
            </h3>
            <p>Use these levers to move the current inputs toward a buyer-ready procurement decision.</p>
          </div>
          <strong>{decision.buyabilityLevers.filter((lever) => lever.priority !== "sealed").length || "No"} open levers</strong>
        </header>
        <div className="procurement-buyability-grid">
          {decision.buyabilityLevers.map((lever) => (
            <article key={lever.id} className={cx(lever.status, `priority-${lever.priority}`)}>
              <div className="procurement-buyability-card-head">
                <span className={cx("risk-chip", statusTone(lever.status))}>{lever.priority}</span>
                <strong>{lever.headline}</strong>
              </div>
              <p>{lever.impact}</p>
              <dl>
                <div>
                  <dt>Current</dt>
                  <dd>{lever.current}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>{lever.target}</dd>
                </div>
              </dl>
              <footer>
                <small>
                  {lever.owner}: {lever.action}
                </small>
                {leverHasPatch(lever) && lever.applyLabel ? (
                  <button type="button" className="icon-link procurement-buyability-apply" onClick={() => applyBuyabilityLever(lever)}>
                    <TrendingUp size={15} />
                    {lever.applyLabel}
                  </button>
                ) : (
                  <a className="icon-link" href={lever.href}>
                    <ExternalLink size={15} />
                    Open evidence
                  </a>
                )}
              </footer>
            </article>
          ))}
        </div>
      </section>

      <div className="procurement-decision-lower">
        <section className="procurement-decision-checks" aria-label="Procurement checks">
          <h3>
            <ShieldCheck size={16} />
            Approval checks
          </h3>
          <div>
            {decision.checks.map((check) => (
              <a key={check.id} href={check.href} className={check.status}>
                <span className={cx("risk-chip", statusTone(check.status))}>{check.status}</span>
                <strong>{check.label}</strong>
                <p>{check.evidence}</p>
                <small>
                  {check.owner}: {check.action}
                </small>
              </a>
            ))}
          </div>
        </section>

        <section className="procurement-decision-ladder" aria-label="Procurement approval ladder">
          <h3>
            <ClipboardCheck size={16} />
            Approval ladder
          </h3>
          <div>
            {decision.approvalLadder.map((lane) => (
              <a key={lane.id} href={lane.href} className={lane.status}>
                <div>
                  <span className={cx("risk-chip", statusTone(lane.status))}>{lane.status}</span>
                  <strong>{lane.label}</strong>
                </div>
                <p>{lane.buyerQuestion}</p>
                <dl>
                  <div>
                    <dt>Current</dt>
                    <dd>{lane.current}</dd>
                  </div>
                  <div>
                    <dt>Target</dt>
                    <dd>{lane.target}</dd>
                  </div>
                  <div>
                    <dt>Delta</dt>
                    <dd>{lane.delta || "None."}</dd>
                  </div>
                </dl>
                <small>
                  {lane.owner}: {lane.action}
                </small>
              </a>
            ))}
          </div>
        </section>

        <section className="procurement-decision-map" aria-label="Mutual action plan">
          <header>
            <div>
              <h3>
                <ListChecks size={16} />
                Mutual action plan
              </h3>
              <strong>{decision.mutualActionPlan.decisionGate}</strong>
              <p>{decision.mutualActionPlan.summary}</p>
            </div>
            <div className="procurement-decision-map-actions">
              <a className="icon-link" href={actionPlanMarkdownHref} download="procurement-mutual-action-plan.md">
                <Download size={15} />
                Plan MD
              </a>
              <a className="icon-link" href={actionPlanCsvHref} download="procurement-mutual-action-plan.csv">
                <Download size={15} />
                Plan CSV
              </a>
            </div>
          </header>
          <div className="procurement-decision-map-steps">
            {decision.mutualActionPlan.steps.map((step) => (
              <a key={step.id} href={step.href} className={step.status}>
                <div>
                  <span className={cx("risk-chip", statusTone(step.status))}>{step.priority}</span>
                  <strong>
                    {step.due} · {step.buyerOwner}
                  </strong>
                </div>
                <p>{step.commitment}</p>
                <dl>
                  <div>
                    <dt>A2A owner</dt>
                    <dd>{step.a2aOwner}</dd>
                  </div>
                  <div>
                    <dt>Exit</dt>
                    <dd>{step.exitCriteria}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{step.evidence}</dd>
                  </div>
                </dl>
              </a>
            ))}
          </div>
        </section>

        <section className={cx("procurement-decision-contract", decision.decisionContract.readiness)} aria-label="Procurement decision contract">
          <header>
            <div>
              <h3>
                <FileCheck2 size={16} />
                Decision contract
              </h3>
              <strong>{decision.decisionContract.approvalAsk}</strong>
              <p>{decision.decisionContract.summary}</p>
            </div>
            <div className="procurement-decision-contract-score">
              <span>{decision.decisionContract.readiness}</span>
              <strong>
                {decision.decisionContract.clearClauseCount}/{decision.decisionContract.clauseCount}
              </strong>
              <small>{decision.decisionContract.decisionGate}</small>
              <a className="icon-link" href={decisionContractHref} download="procurement-decision-contract.md">
                <Download size={15} />
                Contract MD
              </a>
            </div>
          </header>
          <div className="procurement-decision-contract-clauses">
            {decision.decisionContract.clauses.map((clause) => (
              <a key={clause.id} href={clause.href} className={clause.status}>
                <div>
                  <span className={cx("risk-chip", statusTone(clause.status))}>{clause.status}</span>
                  <strong>{clause.label}</strong>
                </div>
                <p>{clause.buyerCommitment}</p>
                <dl>
                  <div>
                    <dt>A2A</dt>
                    <dd>{clause.a2aCommitment}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{clause.evidence}</dd>
                  </div>
                  <div>
                    <dt>Stop if</dt>
                    <dd>{clause.failureRule}</dd>
                  </div>
                </dl>
                <small>{clause.owner}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="procurement-decision-alternatives" aria-label="Procurement alternatives">
          <h3>
            <TimerReset size={16} />
            Buying table
          </h3>
          <div>
            {topAlternatives.map((alternative) => (
              <article key={alternative.id} className={alternative.status}>
                <div>
                  <span>{alternative.status}</span>
                  <strong>{alternative.label}</strong>
                </div>
                <p>
                  {alternative.score}/100, {yen(alternative.monthlyValueYen)} / month, {alternative.paybackDays} day payback
                </p>
                <small>{alternative.tradeoff}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="procurement-decision-receipt" aria-label="Procurement receipt">
          <h3>
            <ClipboardCheck size={16} />
            Pilot receipt
          </h3>
          <div>
            <span>{decision.pilotReceipt.readiness}</span>
            <strong>{decision.pilotReceipt.actualMinutesSavedPerRun}m saved/run</strong>
            <p>
              {decision.pilotReceipt.acceptanceRatePercent}% accepted by {decision.pilotReceipt.reviewerName || "unnamed reviewer"}.
            </p>
            <small>{decision.pilotReceipt.evidenceUrl || "Public receipt URL missing"}</small>
          </div>
        </section>
      </div>
    </section>
  );
}
