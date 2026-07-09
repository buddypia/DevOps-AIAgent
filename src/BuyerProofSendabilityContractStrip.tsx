import { ExternalLink } from "lucide-react";
import { buildBuyerProofSendabilityContract, type BuyerProofSendabilityChecklist } from "./buyerProofSendabilityContract";

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function BuyerProofSendabilityContractStrip({
  checklist,
  readyActionHref,
  liveVerifiedCount,
  liveTotalCount
}: {
  checklist: BuyerProofSendabilityChecklist;
  readyActionHref: string;
  liveVerifiedCount?: number;
  liveTotalCount?: number;
}) {
  const contract = buildBuyerProofSendabilityContract(checklist, { readyActionHref, liveVerifiedCount, liveTotalCount });
  const external = isExternalHref(contract.primaryActionHref);

  return (
    <div className={`buyer-proof-sendability-contract ${contract.status}`} aria-label="Buyer proof sendability contract">
      <div>
        <span>Sendability contract</span>
        <strong>{contract.headline}</strong>
      </div>
      <dl>
        <div>
          <dt>Proof closure</dt>
          <dd>{contract.proofLine}</dd>
        </div>
        <div>
          <dt>First blocker</dt>
          <dd>{contract.firstBlockerLabel}</dd>
        </div>
        <div>
          <dt>Packet artifacts</dt>
          <dd>{contract.artifactLine}</dd>
        </div>
        <div>
          <dt>Verifier rule</dt>
          <dd>{contract.verifierLine}</dd>
        </div>
      </dl>
      <p className="buyer-proof-sendability-contract-reconciliation">{contract.ownershipLine}</p>
      <small>{contract.sendRule}</small>
      <a href={contract.primaryActionHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        {contract.primaryAction}
        <ExternalLink size={13} />
      </a>
    </div>
  );
}
