import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, Scale, ShieldCheck } from "lucide-react";
import type { HomepageHeroProofRouteSnapshot, HomepageProofEntrySnapshot, HomepageProofEntryStatus } from "./App";
import { downloadHrefFile, downloadTextFile } from "./downloadArtifact";

function homepageProofEntryStatusIcon(status: HomepageProofEntryStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

export function HomepageProofEntryRail({ snapshot }: { snapshot: HomepageProofEntrySnapshot }) {
  const ownerPacketVerifierExternal = /^https?:\/\//i.test(snapshot.nextMove.ownerPacket.verificationHref);
  const sendControlRule =
    snapshot.status === "ready"
      ? `Send: all rails for ${snapshot.buyer}.`
      : `Hold: ${snapshot.nextMove.action.label.toLowerCase()} for ${snapshot.buyer}.`;

  return (
    <section id="homepage-proof-entry" className={`homepage-proof-entry is-${snapshot.status}`} aria-label="Homepage proof entry">
      <div className="homepage-proof-entry-main">
        <span>
          {homepageProofEntryStatusIcon(snapshot.status)}
          Proof-first entry
        </span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
      </div>
      <div className="homepage-proof-entry-score" aria-label="Homepage proof score">
        <span>{snapshot.status}</span>
        <strong>{snapshot.proofScore}/100</strong>
        <small>
          {snapshot.readyCount}/{snapshot.items.length} ready
        </small>
      </div>
      <div className="homepage-proof-entry-actions" aria-label="Homepage proof entry actions">
        <a className="homepage-proof-entry-primary" href={snapshot.primaryAction.href} target={snapshot.primaryAction.external ? "_blank" : undefined} rel={snapshot.primaryAction.external ? "noreferrer" : undefined}>
          <ExternalLink size={14} />
          {snapshot.primaryAction.label}
        </a>
        <a className="homepage-proof-entry-link" href={snapshot.secondaryAction.href} target={snapshot.secondaryAction.external ? "_blank" : undefined} rel={snapshot.secondaryAction.external ? "noreferrer" : undefined}>
          <ShieldCheck size={14} />
          Publishability
        </a>
        <a
          className="homepage-proof-entry-link"
          href={snapshot.decisionHandoff.reviewKit.href}
          target={snapshot.decisionHandoff.reviewKit.external ? "_blank" : undefined}
          rel={snapshot.decisionHandoff.reviewKit.external ? "noreferrer" : undefined}
        >
          <ClipboardCheck size={14} />
          {snapshot.decisionHandoff.reviewKit.label}
        </a>
        <a
          className="homepage-proof-entry-link"
          href={snapshot.decisionHandoff.decisionReceipt.href}
          target={snapshot.decisionHandoff.decisionReceipt.external ? "_blank" : undefined}
          rel={snapshot.decisionHandoff.decisionReceipt.external ? "noreferrer" : undefined}
        >
          <Scale size={14} />
          {snapshot.decisionHandoff.decisionReceipt.label}
        </a>
        <button type="button" className="homepage-proof-entry-link" data-download-filename="homepage-proof-entry.md" onClick={() => downloadTextFile("homepage-proof-entry.md", snapshot.exportMarkdown)} aria-label="Download homepage proof entry">
          <Download size={14} />
          Export
        </button>
      </div>
      <div className={`homepage-proof-entry-next is-${snapshot.nextMove.status}`} aria-label="Next proof move">
        <div>
          <span>{snapshot.nextMove.label}</span>
          <strong>{snapshot.nextMove.headline}</strong>
          <p>{snapshot.nextMove.command}</p>
          <small>
            {snapshot.nextMove.buyerImpact} {sendControlRule}
          </small>
        </div>
        <div className="homepage-proof-entry-next-impact" aria-label="Next move impact">
          <span>Estimated lift</span>
          <strong>
            {snapshot.nextMove.impact.currentScore} {"->"} {snapshot.nextMove.impact.projectedScore}
          </strong>
          <small>{snapshot.nextMove.impact.label}</small>
          <em>
            {snapshot.nextMove.impact.currentReadyCount}/{snapshot.items.length} {"->"} {snapshot.nextMove.impact.projectedReadyCount}/{snapshot.items.length} rails
          </em>
        </div>
        <div className="homepage-proof-owner-packet" aria-label="Owner packet">
          <span>Owner packet</span>
          <strong>{snapshot.nextMove.ownerPacket.owner}</strong>
          <p>{snapshot.nextMove.ownerPacket.proofToAttach}</p>
          <small>
            {snapshot.nextMove.ownerPacket.due}. {snapshot.nextMove.ownerPacket.shareRule}
          </small>
          <div className="homepage-proof-owner-packet-actions">
            <button type="button" data-download-filename="homepage-proof-owner-packet.md" onClick={() => downloadHrefFile("homepage-proof-owner-packet.md", snapshot.nextMove.ownerPacket.href)}>
              <Download size={14} />
              Owner packet
            </button>
            <a href={snapshot.nextMove.ownerPacket.verificationHref} target={ownerPacketVerifierExternal ? "_blank" : undefined} rel={ownerPacketVerifierExternal ? "noreferrer" : undefined}>
              <ClipboardCheck size={14} />
              {snapshot.nextMove.ownerPacket.verificationLabel}
            </a>
          </div>
        </div>
        <ul>
          {snapshot.nextMove.acceptanceCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
        <div className="homepage-proof-entry-next-actions">
          <a href={snapshot.nextMove.action.href} target={snapshot.nextMove.action.external ? "_blank" : undefined} rel={snapshot.nextMove.action.external ? "noreferrer" : undefined}>
            <Crosshair size={14} />
            {snapshot.nextMove.action.label}
          </a>
          <button type="button" data-download-filename="homepage-next-proof-move.md" onClick={() => downloadTextFile("homepage-next-proof-move.md", snapshot.nextMove.exportMarkdown)}>
            <Download size={14} />
            Move brief
          </button>
        </div>
      </div>
      <div className="homepage-proof-entry-items" aria-label="Homepage proof rails">
        {snapshot.items.map((item) => (
          <a key={item.id} className={`homepage-proof-entry-item is-${item.status}`} href={item.href}>
            <span>
              {homepageProofEntryStatusIcon(item.status)}
              {item.label}
            </span>
            <strong>{item.title}</strong>
            <small>{item.evidence}</small>
          </a>
        ))}
      </div>
    </section>
  );
}

export function HomepageHeroProofRoute({ snapshot }: { snapshot: HomepageHeroProofRouteSnapshot }) {
  return (
    <section className={`homepage-hero-proof-route is-${snapshot.status}`} aria-label="First buyer route">
      <div className="homepage-hero-proof-route-main">
        <span>
          {homepageProofEntryStatusIcon(snapshot.status)}
          Buyer approval loop
        </span>
        <strong>{snapshot.headline}</strong>
        <p>{snapshot.summary}</p>
      </div>
      <div className="homepage-hero-proof-route-actions" aria-label="First buyer route actions">
        <a className="homepage-hero-proof-route-primary" href={snapshot.primaryAction.href} target={snapshot.primaryAction.external ? "_blank" : undefined} rel={snapshot.primaryAction.external ? "noreferrer" : undefined}>
          <Crosshair size={14} />
          {snapshot.primaryAction.label}
        </a>
        <button type="button" className="homepage-hero-proof-route-link" data-download-filename="first-buyer-route.md" onClick={() => downloadTextFile("first-buyer-route.md", snapshot.exportMarkdown)}>
          <Download size={14} />
          Export route
        </button>
        <a
          className="homepage-hero-proof-route-link"
          href={snapshot.decisionHandoff.decisionReceipt.href}
          target={snapshot.decisionHandoff.decisionReceipt.external ? "_blank" : undefined}
          rel={snapshot.decisionHandoff.decisionReceipt.external ? "noreferrer" : undefined}
        >
          <Scale size={14} />
          {snapshot.decisionHandoff.decisionReceipt.label}
        </a>
        <a
          className="homepage-hero-proof-route-link"
          href={snapshot.decisionHandoff.reviewKit.href}
          target={snapshot.decisionHandoff.reviewKit.external ? "_blank" : undefined}
          rel={snapshot.decisionHandoff.reviewKit.external ? "noreferrer" : undefined}
        >
          <ClipboardCheck size={14} />
          {snapshot.decisionHandoff.reviewKit.label}
        </a>
        <a className="homepage-hero-proof-route-link" href="/receipt-verifier">
          <ClipboardCheck size={14} />
          Verify receipts
        </a>
      </div>
      <div className="homepage-hero-proof-route-score" aria-label="First buyer route score">
        <span>{snapshot.status}</span>
        <strong>{snapshot.scoreLine}</strong>
      </div>
      <div className="homepage-hero-proof-route-items" aria-label="First buyer route checks">
        {snapshot.items.map((item) => (
          <a key={item.id} className={`homepage-hero-proof-route-item is-${item.status}`} href={item.href}>
            <span>
              {homepageProofEntryStatusIcon(item.status)}
              {item.label}
            </span>
            <strong>{item.title}</strong>
            <small>{item.evidence}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
