import { ArrowRight, CheckCircle2, ExternalLink, Map, PackageCheck, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import type { BuyerValueScenario } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import { buildBuyerJourney } from "./buyerJourney";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type BuyerJourneyNavigatorProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  buyerWorkOrder: BuyerWorkOrderInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence" | "pilotRun">;
  customAgents?: MarketAgent[];
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readinessTone(readiness: string) {
  if (readiness === "ready-for-sponsor") return "low";
  if (readiness === "needs-evidence") return "medium";
  return "high";
}

function stepIcon(status: string) {
  if (status === "complete") return <CheckCircle2 size={16} />;
  if (status === "attention") return <ShieldCheck size={16} />;
  return <ArrowRight size={16} />;
}

const PRIMARY_ARTIFACT_IDS = new Set(["commercial-offer", "proof-packet", "sponsor-review", "value-report", "work-order", "trust-center"]);

export default function BuyerJourneyNavigator({ projectBrief, recommendation, valueBlueprint, buyerScenario, buyerWorkOrder, workspace, customAgents = [] }: BuyerJourneyNavigatorProps) {
  const journey = useMemo(
    () =>
      buildBuyerJourney({
        projectBrief,
        recommendation,
        valueBlueprint,
        buyerScenario,
        buyerWorkOrder,
        workspace,
        customAgents
      }),
    [buyerScenario, buyerWorkOrder, customAgents, projectBrief, recommendation, valueBlueprint, workspace]
  );
  const primaryArtifacts = journey.artifacts.filter((artifact) => PRIMARY_ARTIFACT_IDS.has(artifact.id));

  return (
    <section className="buyer-journey" aria-labelledby="buyer-journey-title">
      <div className="buyer-journey-command">
        <div>
          <span className="eyebrow">First value path</span>
          <h2 id="buyer-journey-title">
            <Map size={20} />
            {journey.headline}
          </h2>
          <p>{journey.hardTruth}</p>
        </div>
        <div className="buyer-journey-next">
          <span className={cx("risk-chip", readinessTone(journey.readiness))}>{journey.readiness}</span>
          <strong>{journey.nextAction.label}</strong>
          <p>{journey.nextAction.reason}</p>
          <a className="icon-link buyer-journey-primary" href={journey.nextAction.href}>
            <ArrowRight size={16} />
            Go to next action
          </a>
        </div>
      </div>

      <div className="buyer-journey-session" aria-label="First value session">
        <div className="buyer-journey-session-copy">
          <span>Next 4 actions</span>
          <strong>{journey.remainingStepCount === 0 ? "Ready to share the proof-backed offer" : `${journey.remainingStepCount} checks remain before buyer approval`}</strong>
          <p>Work this row from left to right. Each step opens the exact artifact or workspace section that changes the readiness score.</p>
        </div>
        <div className="buyer-journey-focus-rail" aria-label="Focused buyer journey steps">
          {journey.focusSteps.map((step) => (
            <a key={step.id} className={cx("buyer-journey-step", step.status)} href={step.href} title={step.evidence}>
              <span>{stepIcon(step.status)}</span>
              <strong>{step.label}</strong>
              <small>{step.owner}</small>
              <p>{step.action}</p>
            </a>
          ))}
        </div>
      </div>

      <details className="buyer-journey-details">
        <summary>
          <span>All path checks</span>
          <strong>{journey.completedSteps}/{journey.totalSteps} ready</strong>
        </summary>
        <div className="buyer-journey-rail" aria-label="All buyer journey steps">
          {journey.steps.map((step) => (
            <a key={step.id} className={cx("buyer-journey-step", step.status)} href={step.href} title={step.evidence}>
              <span>{stepIcon(step.status)}</span>
              <strong>{step.label}</strong>
              <small>{step.owner}</small>
            </a>
          ))}
        </div>
      </details>

      <div className="buyer-journey-footer">
        <div className="buyer-journey-score" aria-label="Buyer journey score">
          <strong>{journey.journeyScore}</strong>
          <span>{journey.completedSteps}/{journey.totalSteps} ready</span>
        </div>
        <div className="buyer-journey-artifacts">
          {primaryArtifacts.map((artifact) => (
            <a key={artifact.id} className="icon-link" href={artifact.href} target="_blank" rel="noreferrer" title={artifact.purpose}>
              {artifact.id === "commercial-offer" || artifact.id === "proof-packet" ? <PackageCheck size={15} /> : <ExternalLink size={15} />}
              {artifact.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
