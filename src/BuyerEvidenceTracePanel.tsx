import { useMemo } from "react";
import { Crosshair, ExternalLink } from "lucide-react";
import { buildBuyerEvidenceTrace } from "./buyerEvidenceTrace";
import type { BuyerProofPacketReceipt } from "./buyerProofPacket";
import type { BuyerShareGate } from "./buyerShareGate";
import type { LaunchRoom } from "./launchRoom";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BuyerEvidenceTracePanel({
  launchRoom,
  shareGate,
  evidenceTraceHref,
  proofPacketReceipt
}: {
  launchRoom: LaunchRoom;
  shareGate: BuyerShareGate;
  evidenceTraceHref: string;
  proofPacketReceipt?: BuyerProofPacketReceipt;
}) {
  const evidenceTrace = useMemo(() => buildBuyerEvidenceTrace({ room: launchRoom, shareGate, proofPacketReceipt }), [launchRoom, proofPacketReceipt, shareGate]);

  return (
    <section id="buyer-evidence-trace" className={cx("buyer-evidence-trace", evidenceTrace.readiness)} aria-label="Buyer evidence trace">
      <div className="buyer-evidence-trace-head">
        <div>
          <span>Claim trace matrix</span>
          <strong>{evidenceTrace.headline}</strong>
          <p>{evidenceTrace.hardTruth}</p>
        </div>
        <div className="buyer-evidence-trace-score">
          <span>{evidenceTrace.readiness}</span>
          <strong>{evidenceTrace.score}</strong>
          <small>
            {evidenceTrace.blockers.length} open blocker{evidenceTrace.blockers.length === 1 ? "" : "s"}
          </small>
        </div>
        <a className="icon-link" href={evidenceTraceHref} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          Public trace
        </a>
      </div>
      <div className="buyer-evidence-trace-grid">
        {evidenceTrace.claims.map((claim) => {
          const isExternalArtifact = /^https?:\/\//i.test(claim.artifact.href);
          return (
            <article key={claim.id} className={claim.status}>
              <div>
                <span>{claim.status}</span>
                <strong>{claim.label}</strong>
                <b>{claim.score}</b>
              </div>
              <p>{claim.buyerQuestion}</p>
              <small>
                Source: {claim.source.label}. Artifact: {claim.artifact.label}.
              </small>
              <small>
                Audit: {claim.auditChecks.filter((check) => check.status === "pass").length}/{claim.auditChecks.length} checks pass.
              </small>
              <a href={claim.artifact.href} target={isExternalArtifact ? "_blank" : undefined} rel={isExternalArtifact ? "noreferrer" : undefined}>
                {claim.status === "pass" ? <ExternalLink size={13} /> : <Crosshair size={13} />}
                {claim.status === "pass" ? "Inspect" : "Fix"}
              </a>
            </article>
          );
        })}
      </div>
      <section className="buyer-evidence-audit" aria-label="Buyer evidence verification checklist">
        <div className="buyer-evidence-audit-head">
          <div>
            <span>{evidenceTrace.auditSummary.readiness}</span>
            <strong>Verification checklist</strong>
            <p>
              {evidenceTrace.auditSummary.passCount}/{evidenceTrace.auditSummary.totalCount} checks pass.{" "}
              {evidenceTrace.auditSummary.primaryFailure
                ? `${evidenceTrace.auditSummary.primaryFailure.label}: ${evidenceTrace.auditSummary.primaryFailure.repairAction}`
                : "Every claim has source, artifact, and claim-match evidence ready."}
            </p>
          </div>
          <div>
            <span>Primary claim</span>
            <strong>{evidenceTrace.primaryClaim.label}</strong>
            <p>{evidenceTrace.primaryClaim.nextAction}</p>
          </div>
        </div>
        <div className="buyer-evidence-audit-grid">
          {evidenceTrace.claims.map((claim) => (
            <article key={claim.id} className={claim.status}>
              <div>
                <span>{claim.status}</span>
                <strong>{claim.label}</strong>
                <b>{claim.auditChecks.filter((check) => check.status === "pass").length}/{claim.auditChecks.length}</b>
              </div>
              <ul>
                {claim.auditChecks.map((check) => {
                  const isExternal = /^https?:\/\//i.test(check.href);
                  return (
                    <li key={check.id} className={check.status}>
                      <span>{check.label}</span>
                      <strong>{check.method}</strong>
                      <small>{check.evidence}</small>
                      <a href={check.href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined}>
                        {check.status === "pass" ? "Verify" : "Repair"}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="buyer-evidence-approval-trail" aria-label="Buyer approval trail">
        <div className="buyer-evidence-audit-head">
          <div>
            <span>{evidenceTrace.approvalTrail.readiness}</span>
            <strong>Approval trail</strong>
            <p>
              {evidenceTrace.approvalTrail.receiptDigest
                ? `Proof packet receipt ${evidenceTrace.approvalTrail.receiptDigest} is attached to the trace.`
                : "Attach the proof packet receipt before treating this trace as final."}
            </p>
          </div>
          <div>
            <span>Trail checks</span>
            <strong>
              {evidenceTrace.approvalTrail.items.filter((item) => item.status === "pass").length}/{evidenceTrace.approvalTrail.items.length}
            </strong>
            <p>Claim trace, share gate, packet receipt, and sponsor decision path.</p>
          </div>
        </div>
        <div className="buyer-evidence-approval-grid">
          {evidenceTrace.approvalTrail.items.map((item) => (
            <article key={item.id} className={item.status}>
              <div>
                <span>{item.status}</span>
                <strong>{item.label}</strong>
              </div>
              <p>{item.evidence}</p>
              <small>{item.verifier}</small>
              <a href={item.href}>{item.status === "pass" ? "Open" : "Repair"}</a>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
