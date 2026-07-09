import { AlertTriangle, ClipboardCheck, Download, ExternalLink, Gauge, TrendingUp, Workflow } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam, type AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import { buildBuyerValueAcceptanceReceipt } from "./buyerValueAcceptanceReceipt";
import { buildBuyerValueReport } from "./buyerValueReport";
import type { BuyerValueScenario, BuyerValueScenarioInput } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export default function BuyerValueSimulatorPanel({
  scenario,
  onChange,
  projectBrief,
  recommendation,
  valueBlueprint,
  workspace,
  pilotRun,
  customAgents = []
}: {
  scenario: BuyerValueScenario;
  onChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  workspace: {
    targetUrl: string;
    protopediaUrl: string;
    videoUrl: string;
    agentTrialEvidence: AgentTrialEvidenceRecord[];
  };
  pilotRun: PilotRunReceiptInput;
  customAgents?: MarketAgent[];
}) {
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(scenario.exportMarkdown)}`;
  const reportSearchParams = useMemo(() => {
    const params = new URLSearchParams({
      brief: projectBrief.slice(0, 4000),
      agents: recommendation.selected.map((agent) => agent.id).join(","),
      teamSize: String(scenario.assumptions.teamSize),
      hourlyCostYen: String(scenario.assumptions.hourlyCostYen),
      cyclesPerMonth: String(scenario.assumptions.cyclesPerMonth),
      manualHoursPerCycle: String(scenario.assumptions.manualHoursPerCycle),
      adoptionRatePercent: String(scenario.assumptions.adoptionRatePercent),
      incidentRiskYenPerMonth: String(scenario.assumptions.incidentRiskYenPerMonth)
    });
    if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
    if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
    if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
    if (workspace.agentTrialEvidence.length) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));
    if (customAgents.length) params.set("customAgents", encodeCustomAgentsParam(customAgents));
    params.set("pilotManualMinutes", String(pilotRun.observedManualMinutes));
    params.set("pilotAssistedMinutes", String(pilotRun.observedAssistedMinutes));
    params.set("pilotParticipants", String(pilotRun.participants));
    params.set("pilotAcceptedTasks", String(pilotRun.acceptedTasks));
    params.set("pilotTotalTasks", String(pilotRun.totalTasks));
    if (pilotRun.evidenceUrl) params.set("pilotEvidenceUrl", pilotRun.evidenceUrl);
    if (pilotRun.reviewerName) params.set("pilotReviewer", pilotRun.reviewerName);
    if (pilotRun.notes) params.set("pilotNotes", pilotRun.notes);
    return params.toString();
  }, [customAgents, pilotRun, projectBrief, recommendation.selected, scenario.assumptions, workspace]);
  const publicReportHref = `/buyer-value?${reportSearchParams}`;
  const valueReport = useMemo(
    () => buildBuyerValueReport({ recommendation, valueBlueprint, buyerScenario: scenario, pilotRun }),
    [pilotRun, recommendation, scenario, valueBlueprint]
  );
  const sensitivity = valueReport.sensitivity;
  const sensitivityExportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(sensitivity.exportMarkdown)}`;
  const commitment = valueReport.commitment;
  const commitmentExportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(commitment.exportMarkdown)}`;
  const measured = valueReport.evidence.measuredRun;
  const measuredSupportRatio = valueReport.evidence.supportRatioPercent;
  const measuredTone = measured.readiness === "measured" && measuredSupportRatio >= 70 ? "low" : measured.readiness === "needs-savings" || measuredSupportRatio < 40 ? "high" : "medium";
  const acceptanceReceipt = useMemo(
    () => buildBuyerValueAcceptanceReceipt({ report: valueReport, valueReportHref: publicReportHref }),
    [publicReportHref, valueReport]
  );
  const acceptanceTone = acceptanceReceipt.payload.status === "ready" ? "low" : acceptanceReceipt.payload.status === "watch" ? "medium" : "high";
  const assumptions = scenario.assumptions;
  const readinessTone = scenario.readiness === "scales-now" ? "low" : scenario.readiness === "pilot-first" ? "medium" : "high";
  const sensitivityTone = sensitivity.verdict === "defensible" ? "low" : sensitivity.verdict === "fragile" ? "medium" : "high";
  const commitmentTone = commitment.decision === "send-to-sponsor" ? "low" : commitment.decision === "run-contained-pilot" ? "medium" : "high";
  const updateNumberField = (key: keyof BuyerValueScenarioInput, value: number) => onChange({ [key]: value } as Partial<BuyerValueScenarioInput>);
  const fieldGroups = [
    { key: "teamSize", label: "Team size", min: 1, max: 200, step: 1, value: assumptions.teamSize },
    { key: "hourlyCostYen", label: "Loaded hourly cost", min: 1000, max: 50000, step: 1000, value: assumptions.hourlyCostYen },
    { key: "cyclesPerMonth", label: "Cycles per month", min: 1, max: 40, step: 1, value: assumptions.cyclesPerMonth },
    { key: "manualHoursPerCycle", label: "Manual hours / cycle", min: 1, max: 120, step: 1, value: assumptions.manualHoursPerCycle },
    { key: "adoptionRatePercent", label: "Adoption rate %", min: 5, max: 100, step: 5, value: assumptions.adoptionRatePercent },
    { key: "incidentRiskYenPerMonth", label: "Monthly incident risk", min: 0, max: 10000000, step: 10000, value: assumptions.incidentRiskYenPerMonth }
  ] as const;

  return (
    <section id="buyer-value-simulator" className="buyer-simulator" aria-labelledby="buyer-simulator-title">
      <div className="buyer-simulator-heading">
        <div>
          <span className="eyebrow">Buyer Value Simulator</span>
          <h2 id="buyer-simulator-title">
            <Gauge size={20} />
            Make the ROI claim adjustable
          </h2>
          <p>チーム規模、工数、導入率、運用リスクを変えて、AI squadが本当に買う価値になる条件を確認します。</p>
        </div>
        <div className="buyer-simulator-links">
          <a className="icon-link" href={exportHref} download="buyer-value-scenario.md">
            <Download size={16} />
            Export ROI memo
          </a>
          <a className="icon-link" href={publicReportHref} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Open value report
          </a>
        </div>
      </div>

      <div className="buyer-simulator-body">
        <section className="buyer-simulator-verdict">
          <div>
            <span className={cx("risk-chip", readinessTone)}>{scenario.readiness}</span>
            <h3>{scenario.headline}</h3>
            <p>{scenario.hardTruth}</p>
          </div>
          <div className="buyer-simulator-score" aria-label="Buyer value scenario score">
            <strong>{scenario.scenarioScore}</strong>
            <span>scenario score</span>
          </div>
        </section>

        <div className="buyer-simulator-form" aria-label="Buyer value assumptions">
          {fieldGroups.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <input type="number" min={field.min} max={field.max} step={field.step} value={field.value} onChange={(event) => updateNumberField(field.key, Number(event.target.value))} />
            </label>
          ))}
        </div>

        <div className="buyer-simulator-outcomes">
          <article>
            <span>Monthly value</span>
            <strong>{yen(scenario.monthlyGrossValueYen)}</strong>
            <p>
              {yen(scenario.monthlyLaborValueYen)} labor + {yen(scenario.monthlyRiskValueYen)} risk avoided
            </p>
          </article>
          <article>
            <span>Hours saved</span>
            <strong>{scenario.monthlyHoursSaved}h</strong>
            <p>
              {scenario.assistedHoursPerCycle}h assisted per cycle at {scenario.automationRatePercent}% automation
            </p>
          </article>
          <article>
            <span>Payback</span>
            <strong>{scenario.paybackDays} days</strong>
            <p>{yen(scenario.pilotInvestmentYen)} pilot investment model</p>
          </article>
          <article>
            <span>Budget ceiling</span>
            <strong>{yen(scenario.pilotBudgetCeilingYen)}</strong>
            <p>Keep the first pilot below half of one month of value.</p>
          </article>
        </div>

        <section className={cx("buyer-measured-proof-card", measured.readiness)} aria-label="Measured pilot evidence">
          <div>
            <span className={cx("risk-chip", measuredTone)}>{measured.readiness}</span>
            <h3>
              <ClipboardCheck size={16} />
              {measured.headline}
            </h3>
            <p>
              {measured.actualMinutesSavedPerRun}m saved/run, {measured.acceptanceRatePercent}% accepted, {measuredSupportRatio}% model support.
            </p>
          </div>
          <div className="buyer-measured-proof-metrics">
            <article>
              <span>Measured value</span>
              <strong>{yen(measured.measuredMonthlyValueYen)}</strong>
            </article>
            <article>
              <span>Measured hours</span>
              <strong>{measured.measuredMonthlyHoursSaved}h</strong>
            </article>
            <article>
              <span>Receipt</span>
              <strong>{pilotRun.evidenceUrl ? "attached" : "missing"}</strong>
            </article>
          </div>
        </section>

        <section className={cx("buyer-value-commitment", commitment.decision)} aria-labelledby="buyer-value-commitment-title">
          <div className="buyer-value-commitment-main">
            <div className="buyer-value-commitment-head">
              <div>
                <span className={cx("risk-chip", commitmentTone)}>{commitment.decision}</span>
                <h3 id="buyer-value-commitment-title">
                  <ClipboardCheck size={16} />
                  {commitment.headline}
                </h3>
                <p>{commitment.hardTruth}</p>
              </div>
              <a className="icon-link" href={commitmentExportHref} download="buyer-value-commitment.md">
                <Download size={16} />
                Export board memo
              </a>
            </div>
            <div className="buyer-value-conditions">
              {commitment.conditions.map((condition) => (
                <article key={condition.id} className={condition.status}>
                  <div>
                    <span>{condition.status}</span>
                    <strong>{condition.label}</strong>
                  </div>
                  <p>{condition.value}</p>
                  <small>{condition.evidence}</small>
                </article>
              ))}
            </div>
          </div>
          <aside className="buyer-value-ask">
            <span>{commitment.askLabel}</span>
            <strong>{yen(commitment.recommendedAskYen)}</strong>
            <p>{commitment.askInstruction}</p>
            <small>
              {commitment.decisionOwner} owns the decision. {commitment.nextProofMove.owner} owns the next proof move.
            </small>
          </aside>
          <div className="buyer-value-red-lines">
            <div>
              <span>Red lines</span>
              <strong>Stop expansion if any trigger fails</strong>
            </div>
            {commitment.redLines.map((redLine) => (
              <article key={redLine.id} className={redLine.status}>
                <div>
                  <span>{redLine.status}</span>
                  <strong>{redLine.label}</strong>
                </div>
                <p>{redLine.trigger}</p>
                <small>{redLine.action}</small>
              </article>
            ))}
            <article className={commitment.nextProofMove.priority}>
              <div>
                <span>{commitment.nextProofMove.priority}</span>
                <strong>{commitment.nextProofMove.owner}</strong>
              </div>
              <p>{commitment.nextProofMove.action}</p>
              <small>{commitment.nextProofMove.proof}</small>
            </article>
          </div>
        </section>

        <section className={cx("buyer-value-acceptance", acceptanceReceipt.payload.status)} aria-labelledby="buyer-value-acceptance-title">
          <div className="buyer-value-acceptance-head">
            <div>
              <span className={cx("risk-chip", acceptanceTone)}>{acceptanceReceipt.payload.decision}</span>
              <h3 id="buyer-value-acceptance-title">
                <ClipboardCheck size={16} />
                {acceptanceReceipt.headline}
              </h3>
              <p>{acceptanceReceipt.summary}</p>
            </div>
            <div className="buyer-value-acceptance-actions">
              <a className="icon-link" href={acceptanceReceipt.requestHref} download={`${acceptanceReceipt.receiptId}.json`}>
                <Download size={16} />
                Receipt JSON
              </a>
              <a className="icon-link" href={acceptanceReceipt.verifierHref} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Verify receipt
              </a>
              <a className="icon-link" href={acceptanceReceipt.exportHref} download={`${acceptanceReceipt.receiptId}.md`}>
                <Download size={16} />
                Acceptance memo
              </a>
            </div>
          </div>
          <div className="buyer-value-acceptance-body">
            <aside className="buyer-value-acceptance-claim">
              <span>Buyer claim</span>
              <strong>{acceptanceReceipt.payload.status}</strong>
              <p>{acceptanceReceipt.payload.buyerClaim}</p>
              <small>
                fnv1a32:{acceptanceReceipt.checksum} / {acceptanceReceipt.payload.nextOwner}
              </small>
            </aside>
            <div className="buyer-value-acceptance-checks">
              {acceptanceReceipt.payload.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <span>{check.status}</span>
                    <strong>{check.label}</strong>
                  </div>
                  <p>{check.value}</p>
                  <small>{check.evidence}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="buyer-simulator-sensitivity" aria-labelledby="buyer-sensitivity-title">
          <div className="buyer-sensitivity-main">
            <div className="buyer-sensitivity-heading">
              <div>
                <span className={cx("risk-chip", sensitivityTone)}>{sensitivity.verdict}</span>
                <h3 id="buyer-sensitivity-title">
                  <AlertTriangle size={16} />
                  Value sensitivity
                </h3>
                <p>導入率・自動化率・リスク削減が崩れた時も買える条件を確認します。</p>
              </div>
              <a className="icon-link" href={sensitivityExportHref} download="buyer-value-sensitivity.md">
                <Download size={16} />
                Export stress test
              </a>
            </div>
            <div className="buyer-sensitivity-cases">
              {sensitivity.cases.map((caseItem) => (
                <article key={caseItem.id} className={caseItem.status}>
                  <div>
                    <span>{caseItem.label}</span>
                    <strong>{yen(caseItem.monthlyValueYen)}</strong>
                  </div>
                  <p>
                    {caseItem.monthlyHoursSaved}h saved / {caseItem.paybackDays} day payback
                  </p>
                  <small>
                    {caseItem.adoptionRatePercent}% adoption, {caseItem.automationRatePercent}% automation. {caseItem.evidence}
                  </small>
                </article>
              ))}
            </div>
          </div>
          <aside className="buyer-sensitivity-guardrails">
            <div>
              <span>Confidence band</span>
              <strong>{sensitivity.confidenceBand}</strong>
            </div>
            <div>
              <span>Break-even adoption</span>
              <strong>{sensitivity.breakEvenAdoptionPercent}%</strong>
            </div>
            <div>
              <span>Value at risk</span>
              <strong>{yen(sensitivity.valueAtRiskYen)}</strong>
            </div>
            <div className="buyer-sensitivity-guardrail-list">
              {sensitivity.guardrails.map((guardrail) => (
                <article key={guardrail.id} className={guardrail.status}>
                  <span>{guardrail.status}</span>
                  <strong>
                    {guardrail.label}: {guardrail.value}
                  </strong>
                  <p>{guardrail.evidence}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <div className="buyer-simulator-grid">
          <section>
            <h3>
              <TrendingUp size={16} />
              Evidence metrics
            </h3>
            <div className="buyer-simulator-metrics">
              {scenario.metrics.map((metric) => (
                <article key={metric.id} className={metric.status}>
                  <div>
                    <strong>{metric.label}</strong>
                    <span>{metric.status}</span>
                  </div>
                  <p>{metric.value}</p>
                  <small>{metric.evidence}</small>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h3>
              <Workflow size={16} />
              Next proof moves
            </h3>
            <div className="buyer-simulator-actions">
              {scenario.nextActions.map((action) => (
                <article key={action.id} className={action.priority}>
                  <span>{action.priority}</span>
                  <strong>{action.owner}</strong>
                  <p>{action.action}</p>
                  <small>{action.proof}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
