import { Download, ExternalLink, FileSignature, ShieldCheck, SquarePen } from "lucide-react";
import { useMemo } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotAgreement } from "./pilotAgreement";
import { buildPilotProposal } from "./pilotProposal";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type PilotAgreementPanelProps = {
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

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function readinessTone(readiness: string) {
  if (readiness === "ready-to-sign") return "low";
  if (readiness === "needs-redlines") return "medium";
  return "high";
}

export default function PilotAgreementPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  workspace,
  customAgents = []
}: PilotAgreementPanelProps) {
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
    () =>
      buildPilotAgreement({
        recommendation,
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        decisionMatrix: matrix,
        pilotReceipt: receipt
      }),
    [buyerScenario, matrix, proposal, receipt, recommendation, valueBlueprint, workflow]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(agreement.exportMarkdown)}`;
  const agreementSearchParams = useMemo(() => {
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
  const publicAgreementHref = `/pilot-agreement?${agreementSearchParams}`;
  const openTerms = agreement.terms.filter((term) => term.status !== "clear").length;

  return (
    <section id="pilot-agreement" className={cx("pilot-agreement", agreement.readiness)} aria-labelledby="pilot-agreement-title">
      <div className="pilot-agreement-heading">
        <div>
          <span className="eyebrow">Pilot Agreement Draft</span>
          <h2 id="pilot-agreement-title">
            <FileSignature size={20} />
            {agreement.headline}
          </h2>
          <p>{agreement.hardTruth}</p>
        </div>
        <div className="pilot-agreement-score">
          <span className={cx("risk-chip", readinessTone(agreement.readiness))}>{agreement.readiness}</span>
          <strong>{agreement.agreementScore}</strong>
          <small>{agreement.scopeTitle}</small>
        </div>
      </div>

      <div className="pilot-agreement-metrics">
        <article>
          <span>Budget cap</span>
          <strong>{yen(agreement.budgetCapYen)}</strong>
        </article>
        <article>
          <span>Open terms</span>
          <strong>{openTerms}</strong>
        </article>
        <article>
          <span>Signatures</span>
          <strong>{agreement.signatures.length}</strong>
        </article>
        <a className="icon-link pilot-agreement-export" href={exportHref} download="pilot-agreement.md">
          <Download size={16} />
          Export agreement
        </a>
        <a className="icon-link pilot-agreement-export" href={publicAgreementHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public agreement
        </a>
      </div>

      <div className="pilot-agreement-body">
        <section className="pilot-agreement-terms">
          <h3>
            <SquarePen size={16} />
            Terms
          </h3>
          <div>
            {agreement.terms.map((term) => (
              <article key={term.id} className={term.status}>
                <div>
                  <span>{term.status}</span>
                  <strong>{term.label}</strong>
                </div>
                <p>{term.text}</p>
                <small>
                  {term.owner} / {term.acceptance}
                </small>
              </article>
            ))}
          </div>
        </section>

        <section className="pilot-agreement-stop">
          <h3>
            <ShieldCheck size={16} />
            Stop rules
          </h3>
          <ol>
            {agreement.stopRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>

        <aside className="pilot-agreement-signatures">
          <h3>
            <FileSignature size={16} />
            Signatures
          </h3>
          {agreement.signatures.map((signature) => (
            <article key={signature.role}>
              <span>{signature.role}</span>
              <strong>{signature.name}</strong>
              <p>{signature.condition}</p>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
