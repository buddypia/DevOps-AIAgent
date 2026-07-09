import { BadgeCheck, ClipboardCheck, Download, ExternalLink, Landmark, ShieldCheck, Workflow } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { buildBuyerDiligenceRoom } from "./buyerDiligence";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotExecutionHandoff } from "./pilotExecution";
import { buildPilotProposal } from "./pilotProposal";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type BuyerDiligencePanelProps = {
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
  if (readiness === "approval-ready") return "low";
  if (readiness === "needs-evidence") return "medium";
  return "high";
}

export default function BuyerDiligencePanel({ projectBrief, recommendation, valueBlueprint, buyerScenario, workspace, customAgents = [] }: BuyerDiligencePanelProps) {
  const room = useMemo(() => {
    const proposal = buildPilotProposal({
      recommendation,
      valueBlueprint,
      buyerScenario,
      workspace
    });
    const handoff = buildPilotExecutionHandoff({ proposal, recommendation });
    return buildBuyerDiligenceRoom({
      proposal,
      handoff,
      buyerScenario,
      valueBlueprint,
      recommendation
    });
  }, [buyerScenario, recommendation, valueBlueprint, workspace]);

  const artifactSearchParams = useMemo(() => {
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
  const diligenceHref = `/buyer-diligence?${artifactSearchParams}`;
  const proposalHref = `/buyer-proposal?${artifactSearchParams}`;
  const executionHref = `/pilot-execution?${artifactSearchParams}`;
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(room.exportMarkdown)}`;
  const openRiskCount = room.riskRegister.filter((risk) => risk.status !== "clear").length;

  return (
    <section id="buyer-diligence-room" className="buyer-diligence" aria-labelledby="buyer-diligence-title">
      <div className="buyer-diligence-heading">
        <div>
          <span className="eyebrow">Buyer Due Diligence Room</span>
          <h2 id="buyer-diligence-title">
            <Landmark size={20} />
            {room.headline}
          </h2>
          <p>{room.hardTruth}</p>
        </div>
        <div className="buyer-diligence-actions">
          <a className="icon-link buyer-diligence-primary" href={diligenceHref} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Open diligence room
          </a>
          <a className="icon-link" href={proposalHref} target="_blank" rel="noreferrer">
            <BadgeCheck size={16} />
            Proposal
          </a>
          <a className="icon-link" href={executionHref} target="_blank" rel="noreferrer">
            <Workflow size={16} />
            Execution
          </a>
          <a className="icon-link" href={exportHref} download="buyer-diligence-room.md">
            <Download size={16} />
            Export room
          </a>
          <div className="buyer-diligence-score" aria-label="Buyer diligence score">
            <span className={cx("risk-chip", readinessTone(room.readiness))}>{room.readiness}</span>
            <strong>{room.diligenceScore}</strong>
            <small>diligence score</small>
          </div>
        </div>
      </div>

      <div className="buyer-diligence-body">
        <section className="buyer-diligence-commercial">
          <h3>
            <ClipboardCheck size={16} />
            Commercial case
          </h3>
          <div>
            {room.commercialTerms.map((term) => (
              <article key={term.id} className={term.status}>
                <span>{term.label}</span>
                <strong>{term.value}</strong>
                <p>{term.evidence}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="buyer-diligence-questions">
          <h3>
            <ShieldCheck size={16} />
            Approval questions
          </h3>
          <div>
            {room.approvalQuestions.map((question) => (
              <article key={question.id} className={question.status}>
                <div>
                  <span>{question.status}</span>
                  <strong>{question.label}</strong>
                </div>
                <p>{question.question}</p>
                <small>{question.owner}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="buyer-diligence-risks">
          <h3>
            <Landmark size={16} />
            Risk register
            <span>{openRiskCount} open</span>
          </h3>
          <div>
            {room.riskRegister.map((risk) => (
              <article key={risk.id} className={risk.status}>
                <div>
                  <span>{risk.status}</span>
                  <strong>{risk.label}</strong>
                </div>
                <p>{risk.risk}</p>
                <small>{risk.mitigation}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="buyer-diligence-review">
          <h3>
            <Workflow size={16} />
            Review path
          </h3>
          <ol>
            {room.reviewPath.map((step) => (
              <li key={step.id}>
                <span>{step.window}</span>
                <strong>{step.owner}</strong>
                <p>{step.decision}</p>
                <small>{step.acceptance}</small>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
