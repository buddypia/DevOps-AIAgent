import { ClipboardCheck, Download, ExternalLink, Gauge, Play, Workflow } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type PilotWorkflowPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  customAgents?: MarketAgent[];
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readinessTone(readiness: string) {
  if (readiness === "ready-to-run") return "low";
  if (readiness === "needs-scope") return "medium";
  return "high";
}

export default function PilotWorkflowPanel({ projectBrief, recommendation, valueBlueprint, buyerScenario, workspace, customAgents = [] }: PilotWorkflowPanelProps) {
  const plan = useMemo(() => buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario }), [buyerScenario, recommendation, valueBlueprint]);
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(plan.exportMarkdown)}`;
  const workflowSearchParams = useMemo(() => {
    const params = new URLSearchParams({
      brief: projectBrief.slice(0, 4000),
      agents: recommendation.selected.map((agent) => agent.id).join(","),
      teamSize: String(buyerScenario.assumptions.teamSize),
      hourlyCostYen: String(buyerScenario.assumptions.hourlyCostYen),
      cyclesPerMonth: String(buyerScenario.assumptions.cyclesPerMonth),
      manualHoursPerCycle: String(buyerScenario.assumptions.manualHoursPerCycle),
      adoptionRatePercent: String(buyerScenario.assumptions.adoptionRatePercent),
      incidentRiskYenPerMonth: String(buyerScenario.assumptions.incidentRiskYenPerMonth)
    });
    if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
    if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
    if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
    if (workspace.agentTrialEvidence.length) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));
    if (customAgents.length) params.set("customAgents", encodeCustomAgentsParam(customAgents));
    return params.toString();
  }, [buyerScenario.assumptions, customAgents, projectBrief, recommendation.selected, workspace]);
  const publicWorkflowHref = `/pilot-workflow?${workflowSearchParams}`;

  return (
    <section id="pilot-workflow" className={cx("pilot-workflow", plan.readiness)} aria-labelledby="pilot-workflow-title">
      <div className="pilot-workflow-heading">
        <div>
          <span className="eyebrow">Pilot Workflow</span>
          <h2 id="pilot-workflow-title">
            <Workflow size={20} />
            {plan.workflowName}
          </h2>
          <p>{plan.trigger}</p>
        </div>
        <div className="pilot-workflow-score" aria-label="Pilot workflow score">
          <span className={cx("risk-chip", readinessTone(plan.readiness))}>{plan.readiness}</span>
          <strong>{plan.workflowScore}</strong>
          <small>{plan.timebox}</small>
        </div>
      </div>

      <div className="pilot-workflow-time">
        <article>
          <span>Manual run</span>
          <strong>{plan.manualMinutesPerRun}m</strong>
          <p>Current cycle effort</p>
        </article>
        <article>
          <span>Assisted run</span>
          <strong>{plan.assistedMinutesPerRun}m</strong>
          <p>With selected agent squad</p>
        </article>
        <article>
          <span>Saved per run</span>
          <strong>{plan.minutesSavedPerRun}m</strong>
          <p>{plan.monthlyHoursSaved} monthly hours modeled</p>
        </article>
        <a className="icon-link pilot-workflow-export" href={exportHref} download="pilot-workflow.md">
          <Download size={16} />
          Export workflow
        </a>
        <a className="icon-link pilot-workflow-export" href={publicWorkflowHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public workflow
        </a>
      </div>

      <div className="pilot-workflow-body">
        <section className="pilot-workflow-steps">
          <h3>
            <Play size={16} />
            Run sequence
          </h3>
          <div>
            {plan.steps.map((step, index) => (
              <article key={step.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.owner} / {step.agentName}</small>
                  <p>{step.outcome}</p>
                  <b>{step.manualMinutes}m {"->"} {step.assistedMinutes}m</b>
                </div>
                <footer>
                  <small>{step.acceptance}</small>
                  <code>{step.evidence}</code>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-workflow-checkpoints">
          <h3>
            <ClipboardCheck size={16} />
            Decision checkpoints
          </h3>
          <div>
            {plan.checkpoints.map((checkpoint) => (
              <article key={checkpoint.id} className={checkpoint.status}>
                <div>
                  <span>{checkpoint.status}</span>
                  <strong>{checkpoint.label}</strong>
                </div>
                <p>{checkpoint.question}</p>
                <small>{checkpoint.evidence}</small>
              </article>
            ))}
          </div>
        </section>

        <aside className="pilot-workflow-script">
          <h3>
            <Gauge size={16} />
            Sponsor script
          </h3>
          <ol>
            {plan.handoffScript.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
