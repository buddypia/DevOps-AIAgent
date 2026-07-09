import { BadgeCheck, Crosshair, ExternalLink, Gauge, Play } from "lucide-react";
import type {
  ProofTransformation,
  ProofTransformationDelta,
  ProofTransformationGeneratedArtifact,
  ProofTransformationRepairItem,
  ProofTransformationStep
} from "./proofTransformation";

type ProofTransformationHeroProps = {
  transformation: ProofTransformation;
  sampleBriefHref: string;
  workflowHref: string;
  currentAuditHref: string;
  onLoadSample: () => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: string) {
  if (status === "pass") return <BadgeCheck size={14} />;
  if (status === "watch") return <Gauge size={14} />;
  return <Crosshair size={14} />;
}

function DeltaCard({ delta }: { delta: ProofTransformationDelta }) {
  return (
    <article className={cx("proof-delta-card", delta.status)}>
      <span>{delta.label}</span>
      <div>
        <small>{delta.before}</small>
        <strong>{delta.after}</strong>
      </div>
      <p>{delta.proof}</p>
    </article>
  );
}

function RunwayStep({ step }: { step: ProofTransformationStep }) {
  return (
    <li className={step.status}>
      <span>
        {statusIcon(step.status)}
        {step.label}
      </span>
      <strong>{step.action}</strong>
      <small>{step.proof}</small>
    </li>
  );
}

function RepairItem({ item }: { item: ProofTransformationRepairItem }) {
  return (
    <li className={item.status}>
      <span>
        {statusIcon(item.status)}
        {item.label}
      </span>
      <strong>{item.action}</strong>
      <small>{item.owner}: {item.proof}</small>
    </li>
  );
}

function GeneratedArtifact({ item }: { item: ProofTransformationGeneratedArtifact }) {
  return (
    <li className={item.status}>
      <span>
        {statusIcon(item.status)}
        {item.label}
      </span>
      <strong>{item.output}</strong>
      <small>{item.action}</small>
    </li>
  );
}

export default function ProofTransformationHero({ transformation, sampleBriefHref, workflowHref, currentAuditHref, onLoadSample }: ProofTransformationHeroProps) {
  const openRunwaySteps = transformation.runway.filter((step) => step.status !== "pass");
  const runwaySummary = openRunwaySteps.length === 0 ? "Ready to share" : `${openRunwaySteps.length} open step${openRunwaySteps.length === 1 ? "" : "s"}`;
  const detailsSummary = `${transformation.deltas.length} deltas, ${runwaySummary.toLowerCase()}`;
  const current = transformation.current;
  const currentSummary = current.openCount === 0 ? `${current.readyCount} ready artifacts` : `${current.blockedCount} block / ${current.watchCount} watch`;

  return (
    <aside className="proof-transformation-hero" aria-label="Proof transformation preview">
      <div className="proof-transform-head">
        <span>Proof transformation</span>
        <strong>{transformation.headline}</strong>
        <p>{transformation.hardTruth}</p>
      </div>

      <div className={cx("proof-current-diagnosis", current.status)} aria-label="Current workspace diagnosis">
        <div>
          <span>Current workspace</span>
          <strong>{current.headline}</strong>
          <p>{current.primaryAction}</p>
        </div>
        <div className="proof-current-score">
          <span>{current.score}</span>
          <small>{currentSummary}</small>
        </div>
      </div>

      <ol className="proof-current-queue" aria-label="Current repair queue">
        {current.items.slice(0, 3).map((item) => (
          <RepairItem key={item.id} item={item} />
        ))}
      </ol>

      <div className="proof-transform-stages" aria-label="Current and buyer proof target state">
        <article className={cx("proof-stage-card", transformation.before.status)}>
          <span>{transformation.before.label}</span>
          <strong>{transformation.before.score}</strong>
          <small>{transformation.before.decision}</small>
        </article>
        <div className="proof-stage-arrow" aria-hidden="true">
          <Play size={16} />
        </div>
        <article className={cx("proof-stage-card", transformation.after.status)}>
          <span>{transformation.after.label}</span>
          <strong>{transformation.after.score}</strong>
          <small>{transformation.after.proofClosure} proof</small>
        </article>
      </div>

      <div className="proof-keypoint-row" aria-label="Buyer proof target signals">
        {transformation.deltas.map((delta) => (
          <span key={delta.id} className={delta.status}>
            <small>{delta.label}</small>
            <strong>{delta.after}</strong>
          </span>
        ))}
      </div>

      <div className="proof-generated-output" aria-label="Generated workflow outputs">
        <div>
          <span>Generated from first workflow</span>
          <strong>Promise, repair plan, receipt trail</strong>
        </div>
        <ol>
          {transformation.generatedArtifacts.map((item) => (
            <GeneratedArtifact key={item.id} item={item} />
          ))}
        </ol>
      </div>

      <details className="proof-details">
        <summary>
          <span>Proof details</span>
          <strong>{detailsSummary}</strong>
        </summary>
        <div className="proof-delta-grid" aria-label="Proof deltas">
          {transformation.deltas.map((delta) => (
            <DeltaCard key={delta.id} delta={delta} />
          ))}
        </div>
        <ol className="proof-runway" aria-label="Proof runway">
          {transformation.runway.map((step) => (
            <RunwayStep key={step.id} step={step} />
          ))}
        </ol>
      </details>

      <div className="proof-transform-actions" aria-label="Proof transformation actions">
        <a href={workflowHref}>
          <Crosshair size={15} />
          Build approval loop
        </a>
        <a href={currentAuditHref} target="_blank" rel="noreferrer">
          <Gauge size={15} />
          Open proof audit
        </a>
        <a href={sampleBriefHref} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          Proof brief shape
        </a>
        <button type="button" onClick={onLoadSample}>
          <BadgeCheck size={15} />
          Use proof template
        </button>
      </div>
    </aside>
  );
}
