import { BadgeCheck, ClipboardCheck, Crosshair, Gauge, ShieldCheck, Workflow } from "lucide-react";
import type { HomepagePublishabilitySnapshot } from "./App";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function chainHrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function RouteLockStatusIcon({ status }: { status: HomepagePublishabilitySnapshot["status"] }) {
  if (status === "ready") return <BadgeCheck size={16} />;
  if (status === "attention") return <Gauge size={16} />;
  return <Crosshair size={16} />;
}

export default function HeroPublishabilityVerdict({
  snapshot,
  reviewKitHref
}: {
  snapshot: HomepagePublishabilitySnapshot;
  reviewKitHref: string;
}) {
  const proofLink = snapshot.gates.find((gate) => gate.id === "live-surface") ?? snapshot.gates[0];
  const releaseLiftActions = snapshot.releaseLift.actions.slice(0, 2);

  return (
    <section className={cx("hero-publishability-verdict", `is-${snapshot.status}`)} aria-label="Public release verdict">
      <div className="hero-publishability-main">
        <span>Public release verdict</span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.hardTruth}</p>
        <div className="hero-publishability-actions" aria-label="Public release actions">
          <a className="hero-publishability-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            {snapshot.status === "ready" ? <BadgeCheck size={14} /> : <Crosshair size={14} />}
            {snapshot.primaryAction.label}
          </a>
          <a className="hero-publishability-link" href={snapshot.reviewerCover.href} {...routeActionAttrs(snapshot.reviewerCover)}>
            <Gauge size={14} />
            {snapshot.reviewerCover.label}
          </a>
          <a className="hero-publishability-link" href={snapshot.workflowAction.href} {...routeActionAttrs(snapshot.workflowAction)}>
            <Workflow size={14} />
            {snapshot.workflowAction.label}
          </a>
          <a className="hero-publishability-link" href={reviewKitHref} target="_blank" rel="noreferrer">
            <ClipboardCheck size={14} />
            Review
          </a>
          <a className="hero-publishability-link" href="/submission-assets" target="_blank" rel="noreferrer">
            Assets
          </a>
        </div>
      </div>
      <aside className="hero-publishability-score" aria-label="Publishability score">
        <span>{snapshot.decision}</span>
        <strong>{snapshot.score}</strong>
        <small>
          {snapshot.readyCount}/{snapshot.gateTotal} ready, {snapshot.blockedCount} blocked
        </small>
      </aside>
      <div className={cx("hero-publishability-review-cover", snapshot.reviewerCover.status)} aria-label="Public review cover protocol">
        <span>
          <ShieldCheck size={13} />
          10-minute cover
        </span>
        <div>
          <strong>{snapshot.reviewerCover.headline}</strong>
          <p>{snapshot.reviewerCover.summary}</p>
        </div>
        <a href={snapshot.reviewerCover.href} {...routeActionAttrs(snapshot.reviewerCover)}>
          <ClipboardCheck size={14} />
          {snapshot.reviewerCover.label}
        </a>
      </div>
      <div className="hero-publishability-lift" aria-label="First release lift">
        <div>
          <span>Release lift</span>
          <strong>{snapshot.releaseLift.summary}</strong>
          <small>
            Target {snapshot.releaseLift.targetScore} / gap {snapshot.releaseLift.scoreGap} / first fix {snapshot.releaseLift.projectedScoreAfterFirstFix}
          </small>
        </div>
        <ol>
          {releaseLiftActions.map((action) => (
            <li key={action.id} className={action.status}>
              <span>{action.priority}</span>
              <b>+{action.scoreLift}</b>
              <strong>{action.label}</strong>
              <small>{action.proofRequired}</small>
              <a href={action.href} {...routeActionAttrs({ external: chainHrefIsExternal(action.href) })}>
                {action.projectedScore}/100
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="hero-publishability-gates" aria-label="First-screen publishability gates">
        {snapshot.gates.map((gate) => (
          <a key={gate.id} className={gate.status} href={gate.href} {...routeActionAttrs({ external: chainHrefIsExternal(gate.href) })}>
            <span>
              <RouteLockStatusIcon status={gate.status} />
              {gate.label}
            </span>
            <strong>{gate.score}/100</strong>
          </a>
        ))}
      </div>
      <div className="hero-publishability-value-route" aria-label="Buyer value route">
        {snapshot.valueRoute.map((step) => (
          <a key={step.id} className={step.status} href={step.href} {...routeActionAttrs({ external: chainHrefIsExternal(step.href) })}>
            <span>
              <RouteLockStatusIcon status={step.status} />
              {step.label}
            </span>
            <strong>{step.title}</strong>
            <small>{step.evidence}</small>
          </a>
        ))}
      </div>
      <div className="hero-publishability-claim-ledger" aria-label="Public claim ledger">
        <div className="hero-publishability-claim-ledger-head">
          <span>Public claim ledger</span>
          <strong>
            {snapshot.publicClaimLedger.filter((claim) => claim.status === "ready").length}/{snapshot.publicClaimLedger.length} claims publishable
          </strong>
        </div>
        {snapshot.publicClaimLedger.map((claim) => (
          <a key={claim.id} className={claim.status} href={claim.href} {...routeActionAttrs({ external: chainHrefIsExternal(claim.href) })}>
            <span>
              <RouteLockStatusIcon status={claim.status} />
              {claim.label}
            </span>
            <strong>{claim.claim}</strong>
            <small>{claim.proof}</small>
            <b>{claim.buyerQuestion}</b>
          </a>
        ))}
      </div>
      <div className="hero-publishability-proof" aria-label="Public proof summary">
        <span>Proof</span>
        <strong>{snapshot.proofSummary}</strong>
        {proofLink ? (
          <a href={proofLink.href} {...routeActionAttrs({ external: chainHrefIsExternal(proofLink.href) })}>
            {proofLink.status === "ready" ? "Inspect proof" : "Fix proof"}
          </a>
        ) : null}
      </div>
    </section>
  );
}
