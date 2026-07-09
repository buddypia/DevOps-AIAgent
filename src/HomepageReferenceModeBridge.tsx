import { BadgeCheck, ClipboardCheck, Crosshair, ExternalLink, FileText, Gauge, RotateCcw, Workflow } from "lucide-react";
import type { InitialWorkspaceSource } from "./App";
import type { ProofTransformation } from "./proofTransformation";

type BridgeStatus = "pass" | "watch" | "block";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: BridgeStatus) {
  if (status === "pass") return <BadgeCheck size={15} />;
  if (status === "watch") return <Gauge size={15} />;
  return <Crosshair size={15} />;
}

function modeLabel(source: InitialWorkspaceSource) {
  if (source === "sample") return "Reference mode";
  if (source === "shared") return "Shared buyer room";
  return "Saved buyer room";
}

function proofStatusLabel(status: BridgeStatus) {
  if (status === "pass") return "Ready";
  if (status === "watch") return "Review";
  return "Blocked";
}

function headlineFor(source: InitialWorkspaceSource, transformation: ProofTransformation) {
  if (source === "sample") return "This reference room is a map, not a sendable buyer claim";
  if (transformation.current.openCount === 0) return "Your buyer room is ready for external review";
  return "Your buyer room has proof work before external review";
}

function summaryFor(source: InitialWorkspaceSource, transformation: ProofTransformation) {
  if (source === "sample") {
    return "The reference workspace shows the end-to-end path, but it stays locked until you replace reference proof with buyer-owned workflow, evidence URLs, and receipts.";
  }
  if (transformation.current.openCount === 0) {
    return "Workflow, value, proof, and decision artifacts are aligned. Use the send brief as the first external handoff.";
  }
  return `${transformation.current.openCount} proof item${transformation.current.openCount === 1 ? "" : "s"} must close before this reads like a buyer-owned room.`;
}

export function HomepageReferenceModeBridge({
  workspaceSource,
  transformation,
  workflowHref,
  proofAuditHref,
  sendBriefHref,
  onLoadSample
}: {
  workspaceSource: InitialWorkspaceSource;
  transformation: ProofTransformation;
  workflowHref: string;
  proofAuditHref: string;
  sendBriefHref: string;
  onLoadSample: () => void;
}) {
  const proofStatus: BridgeStatus = transformation.current.blockedCount > 0 ? "block" : transformation.current.watchCount > 0 ? "watch" : "pass";
  const sendStatus: BridgeStatus = transformation.current.openCount === 0 ? "pass" : "watch";
  const steps = [
    {
      id: "workflow",
      label: "1. Paste workflow",
      status: "pass" as const,
      href: workflowHref,
      icon: <Workflow size={15} />,
      headline: "Start from a real operating job",
      evidence: `${transformation.before.targetBuyer}: ${transformation.before.measuredOutcome}.`
    },
    {
      id: "proof",
      label: "2. Replace proof",
      status: proofStatus,
      href: proofAuditHref,
      icon: <Gauge size={15} />,
      headline: transformation.current.openCount === 0 ? "Public proof is attached" : "Reference proof still blocks sharing",
      evidence: transformation.current.primaryAction
    },
    {
      id: "send",
      label: "3. Send brief",
      status: sendStatus,
      href: sendBriefHref,
      icon: <FileText size={15} />,
      headline: transformation.current.openCount === 0 ? "External handoff is ready" : "Send note stays internal",
      evidence: "Subject, message body, attachments, and no-send blockers stay tied to the current proof state."
    }
  ];

  return (
    <section className={cx("homepage-reference-bridge", `is-${workspaceSource}`, `is-${proofStatus}`)} aria-labelledby="homepage-reference-bridge-title">
      <div className="homepage-reference-bridge-main">
        <span>
          <ClipboardCheck size={14} />
          {modeLabel(workspaceSource)}
        </span>
        <h2 id="homepage-reference-bridge-title">{headlineFor(workspaceSource, transformation)}</h2>
        <p>{summaryFor(workspaceSource, transformation)}</p>
        <div className="homepage-reference-bridge-actions" aria-label="Reference mode actions">
          <a className="homepage-reference-bridge-primary" href={workflowHref}>
            <Workflow size={14} />
            Paste your workflow
          </a>
          <a className="homepage-reference-bridge-link" href={proofAuditHref}>
            <Gauge size={14} />
            Replace proof URLs
          </a>
          <a className="homepage-reference-bridge-link" href={sendBriefHref}>
            <FileText size={14} />
            Review send brief
          </a>
          {workspaceSource !== "sample" && (
            <button type="button" className="homepage-reference-bridge-link" onClick={onLoadSample}>
              <RotateCcw size={14} />
              Reload reference
            </button>
          )}
        </div>
      </div>
      <aside className="homepage-reference-bridge-score" aria-label="Reference mode proof score">
        <span>{proofStatusLabel(transformation.current.status)}</span>
        <strong>{transformation.current.score}</strong>
        <small>
          {transformation.current.openCount} open / {transformation.current.readyCount} ready
        </small>
      </aside>
      <div className="homepage-reference-bridge-steps" aria-label="Buyer room unlock path">
        {steps.map((step) => (
          <a key={step.id} className={step.status} href={step.href}>
            <span>
              {statusIcon(step.status)}
              {step.label}
            </span>
            <strong>{step.headline}</strong>
            <p>{step.evidence}</p>
            <small>
              {step.icon}
              Open step <ExternalLink size={13} />
            </small>
          </a>
        ))}
      </div>
      <div className="homepage-reference-bridge-repairs" aria-label="First proof repairs">
        <span>First repairs</span>
        {transformation.current.items.slice(0, 3).map((item) => (
          <a key={item.id} className={item.status} href={item.href}>
            <strong>{item.label}</strong>
            <p>{item.action}</p>
            <small>{item.owner}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

export default HomepageReferenceModeBridge;
