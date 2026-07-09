import { AlertTriangle, BadgeCheck, Download, ExternalLink, FileText, ShieldCheck, TrendingUp, Workflow } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotProposal } from "./pilotProposal";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type PilotProposalPanelProps = {
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
  if (readiness === "buyer-ready") return "low";
  if (readiness === "pilot-ready") return "medium";
  return "high";
}

export default function PilotProposalPanel({ projectBrief, recommendation, valueBlueprint, buyerScenario, workspace, customAgents = [] }: PilotProposalPanelProps) {
  const proposal = useMemo(
    () =>
      buildPilotProposal({
        recommendation,
        valueBlueprint,
        buyerScenario,
        workspace
      }),
    [buyerScenario, recommendation, valueBlueprint, workspace]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(proposal.exportMarkdown)}`;
  const proposalSearchParams = useMemo(() => {
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
  const publicProposalHref = `/buyer-proposal?${proposalSearchParams}`;
  const pilotExecutionHref = `/pilot-execution?${proposalSearchParams}`;

  return (
    <section id="buyer-pilot-proposal" className="pilot-proposal" aria-labelledby="pilot-proposal-title">
      <div className="pilot-proposal-heading">
        <div>
          <span className="eyebrow">Buyer Pilot Proposal</span>
          <h2 id="pilot-proposal-title">
            <FileText size={20} />
            {proposal.title}
          </h2>
          <p>{proposal.openingClaim}</p>
        </div>
        <div className="pilot-proposal-actions">
          <a className="icon-link" href={publicProposalHref} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Open public proposal
          </a>
          <a className="icon-link" href={pilotExecutionHref} target="_blank" rel="noreferrer">
            <Workflow size={16} />
            Open execution handoff
          </a>
          <a className="icon-link" href={exportHref} download="buyer-pilot-proposal.md">
            <Download size={16} />
            Export proposal
          </a>
          <div className="pilot-proposal-score" aria-label="Pilot proposal score">
            <span className={cx("risk-chip", readinessTone(proposal.readiness))}>{proposal.readiness}</span>
            <strong>{proposal.proposalScore}</strong>
            <small>proposal score</small>
          </div>
        </div>
      </div>

      <div className="pilot-proposal-body">
        <section className="pilot-proposal-summary">
          <div>
            <span>Target buyer</span>
            <strong>{proposal.targetBuyer}</strong>
          </div>
          <article>
            <h3>Buyer problem</h3>
            <p>{proposal.buyerProblem}</p>
          </article>
          <article>
            <h3>Pilot offer</h3>
            <p>{proposal.proposedPilot}</p>
          </article>
          <div className="pilot-proposal-promises">
            <article>
              <TrendingUp size={16} />
              <span>Measurable promise</span>
              <strong>{proposal.measurablePromise}</strong>
            </article>
            <article>
              <ShieldCheck size={16} />
              <span>Commercial guardrail</span>
              <strong>{proposal.commercialGuardrail}</strong>
            </article>
          </div>
        </section>

        <section className="pilot-proposal-proof">
          <h3>
            <BadgeCheck size={16} />
            Proof checklist
          </h3>
          <div>
            {proposal.proofs.map((proof) => (
              <article key={proof.id} className={proof.status}>
                <div>
                  <span>{proof.status}</span>
                  <strong>{proof.label}</strong>
                </div>
                <p>{proof.evidence}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-proposal-phases">
          <h3>
            <Workflow size={16} />
            Pilot path
          </h3>
          <div>
            {proposal.phases.map((phase) => (
              <article key={phase.id}>
                <span>{phase.duration}</span>
                <strong>{phase.label}</strong>
                <p>{phase.buyerOutcome}</p>
                <small>{phase.proofGate}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-proposal-objections">
          <h3>
            <AlertTriangle size={16} />
            Buyer objections
          </h3>
          <div>
            {proposal.objections.map((objection) => (
              <article key={objection.id}>
                <strong>{objection.concern}</strong>
                <p>{objection.answer}</p>
                <small>{objection.proof}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-proposal-commitments">
          <h3>
            <ShieldCheck size={16} />
            Delivery commitments
          </h3>
          <div>
            {proposal.commitments.map((commitment) => (
              <article key={commitment.id}>
                <span>{commitment.owner}</span>
                <strong>{commitment.promise}</strong>
                <p>{commitment.acceptance}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
