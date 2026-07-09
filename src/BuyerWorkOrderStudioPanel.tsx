import { ClipboardCheck, Download, ExternalLink, Gauge, ListChecks, Network, Play, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { buildBuyerWorkOrderBrief, type BuyerWorkOrderInput, type BuyerWorkOrderSensitivity } from "./buyerWorkOrder";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";

type BuyerWorkOrderStudioPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workOrder: BuyerWorkOrderInput;
  onChange: (patch: Partial<BuyerWorkOrderInput>) => void;
  customAgents?: MarketAgent[];
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readinessTone(readiness: string) {
  if (readiness === "ready-to-run") return "low";
  if (readiness === "needs-proof" || readiness === "needs-scope") return "medium";
  return "high";
}

function statusTone(status: string) {
  if (status === "clear") return "low";
  if (status === "watch") return "medium";
  return "high";
}

export default function BuyerWorkOrderStudioPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  workOrder,
  onChange,
  customAgents = []
}: BuyerWorkOrderStudioPanelProps) {
  function updateWorkOrder(patch: Partial<BuyerWorkOrderInput>) {
    onChange(patch);
  }

  const brief = useMemo(
    () =>
      buildBuyerWorkOrderBrief({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workOrder
      }),
    [buyerScenario, recommendation, valueBlueprint, workOrder]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(brief.exportMarkdown)}`;
  const publicBriefHref = useMemo(() => {
    const params = new URLSearchParams({
      brief: projectBrief.slice(0, 4000),
      agents: recommendation.selected.map((agent) => agent.id).join(","),
      teamSize: String(buyerScenario.assumptions.teamSize),
      hourlyCostYen: String(buyerScenario.assumptions.hourlyCostYen),
      cyclesPerMonth: String(buyerScenario.assumptions.cyclesPerMonth),
      manualHoursPerCycle: String(buyerScenario.assumptions.manualHoursPerCycle),
      adoptionRatePercent: String(buyerScenario.assumptions.adoptionRatePercent),
      incidentRiskYenPerMonth: String(buyerScenario.assumptions.incidentRiskYenPerMonth),
      workOrder: workOrder.request,
      workOrderTargetUser: workOrder.targetUser,
      workOrderSuccessMetric: workOrder.successMetric,
      workOrderBaseline: workOrder.currentBaseline,
      workOrderDataSensitivity: workOrder.dataSensitivity
    });
    if (workOrder.evidenceUrl) params.set("workOrderEvidenceUrl", workOrder.evidenceUrl);
    if (customAgents.length) params.set("customAgents", encodeCustomAgentsParam(customAgents));
    return `/work-order-brief?${params.toString()}`;
  }, [buyerScenario.assumptions, customAgents, projectBrief, recommendation.selected, workOrder]);

  return (
    <section id="buyer-work-order-studio" className={cx("buyer-work-order", brief.readiness)} aria-labelledby="buyer-work-order-title">
      <div className="buyer-work-order-heading">
        <div>
          <span className="eyebrow">Buyer Work Order Studio</span>
          <h2 id="buyer-work-order-title">
            <ClipboardCheck size={20} />
            {brief.headline}
          </h2>
          <p>{brief.hardTruth}</p>
        </div>
        <div className="buyer-work-order-score" aria-label="Buyer work order score">
          <span className={cx("risk-chip", readinessTone(brief.readiness))}>{brief.readiness}</span>
          <strong>{brief.workOrderScore}</strong>
          <small>{brief.targetUser}</small>
        </div>
      </div>

      <div className="buyer-work-order-body">
        <section className="buyer-work-order-form" aria-label="Buyer work order input">
          <h3>
            <Play size={16} />
            Real work to delegate
          </h3>
          <label>
            <span>Work order</span>
            <textarea value={workOrder.request} onChange={(event) => updateWorkOrder({ request: event.target.value })} />
          </label>
          <div className="buyer-work-order-fields">
            <label>
              <span>Target user</span>
              <input value={workOrder.targetUser} onChange={(event) => updateWorkOrder({ targetUser: event.target.value })} />
            </label>
            <label>
              <span>Data boundary</span>
              <select value={workOrder.dataSensitivity} onChange={(event) => updateWorkOrder({ dataSensitivity: event.target.value as BuyerWorkOrderSensitivity })}>
                <option value="public">Public or synthetic</option>
                <option value="internal">Internal, redact before sharing</option>
                <option value="restricted">Restricted, security approval first</option>
              </select>
            </label>
          </div>
          <label>
            <span>Success metric</span>
            <input value={workOrder.successMetric} onChange={(event) => updateWorkOrder({ successMetric: event.target.value })} />
          </label>
          <label>
            <span>Current baseline</span>
            <input value={workOrder.currentBaseline} onChange={(event) => updateWorkOrder({ currentBaseline: event.target.value })} />
          </label>
          <label>
            <span>Evidence URL</span>
            <input type="url" value={workOrder.evidenceUrl} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.workOrderEvidenceUrl} onChange={(event) => updateWorkOrder({ evidenceUrl: event.target.value })} />
          </label>
        </section>

        <section className="buyer-work-order-preview">
          <div className="buyer-work-order-next">
            <span>Next action</span>
            <strong>{brief.nextAction}</strong>
            <p>{brief.stopRule}</p>
            <div className="buyer-work-order-actions">
              <a className="icon-link" href={exportHref} download="buyer-work-order.md">
                <Download size={15} />
                Export brief
              </a>
              <a className="icon-link" href={publicBriefHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open public brief
              </a>
            </div>
          </div>

          <div className="buyer-work-order-pilot">
            <span>Pilot question</span>
            <strong>{brief.pilotQuestion}</strong>
            <p>{brief.currentBaseline}</p>
          </div>
        </section>
      </div>

      <div className="buyer-work-order-lower">
        <section className="buyer-work-order-assignments">
          <h3>
            <Network size={16} />
            Agent assignments
          </h3>
          <div>
            {brief.assignments.map((assignment) => (
              <article key={assignment.id}>
                <span>{assignment.role}</span>
                <strong>{assignment.agentName}</strong>
                <p>{assignment.objective}</p>
                <small>{assignment.acceptance}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="buyer-work-order-checks">
          <h3>
            <ListChecks size={16} />
            Acceptance checks
          </h3>
          <div>
            {brief.checks.map((check) => (
              <article key={check.id} className={check.status}>
                <div>
                  <span className={cx("risk-chip", statusTone(check.status))}>{check.status}</span>
                  <b>{check.label}</b>
                </div>
                <p>{check.evidence}</p>
                <small>{check.fix}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="buyer-work-order-payload">
          <h3>
            <Gauge size={16} />
            A2A payload
          </h3>
          <pre>{JSON.stringify(brief.a2aPayload, null, 2)}</pre>
          <div className="buyer-work-order-proof-plan">
            {brief.proofPlan.slice(0, 3).map((step) => (
              <a key={step.id} href={step.href} className={step.status}>
                <ShieldCheck size={14} />
                <span>{step.owner}</span>
                <strong>{step.label}</strong>
              </a>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
