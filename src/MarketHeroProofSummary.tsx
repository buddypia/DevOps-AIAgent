import { Activity, ClipboardCheck, ExternalLink, ShieldCheck } from "lucide-react";
import type { BuyerShareGateCheckStatus, BuyerShareGateProofVerificationSummary, BuyerShareGateReadiness, BuyerShareGateRepairStatus, BuyerShareGateSendPacketMode } from "./buyerShareGate";
import type { HomepageRouteLock } from "./homepageRouteLock";

type ProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

type ProofField = {
  key: string;
  label: string;
  placeholder: string;
  href: string;
};

type HomepageProofSummary = {
  status: HomepageRouteLock["status"];
  proofScore: number;
  readyCount: number;
  itemCount: number;
  headline: string;
};

type PacketSummary = {
  status: HomepageRouteLock["status"];
  readyCount: number;
  itemCount: number;
  checksumAlgorithm: string;
  checksum: string;
};

type RouteSummary = {
  status: HomepageRouteLock["status"];
  score: number;
  headline: string;
  operatorLine: string;
  primaryAction: HomepageRouteLock["primaryAction"];
};

type ShareGateSummary = {
  readiness: BuyerShareGateReadiness;
  mode: BuyerShareGateSendPacketMode;
  score: number;
  decision: string;
  blockerCount: number;
  watchCount: number;
  primaryActionLabel: string;
  primaryActionHref: string;
  primaryActionExternal: boolean;
  checks: Array<{
    id: string;
    label: string;
    status: BuyerShareGateCheckStatus;
    score: number;
    evidence: string;
    action: string;
    href: string;
    external: boolean;
  }>;
  repairPlan: {
    status: BuyerShareGateRepairStatus;
    headline: string;
    summary: string;
    exportHref: string;
    items: Array<{
      id: string;
      sequence: number;
      label: string;
      status: BuyerShareGateCheckStatus;
      owner: string;
      action: string;
      evidence: string;
      href: string;
      unlock: string;
      external: boolean;
    }>;
  };
};

type PublicDecisionRouteSummary = {
  status: HomepageRouteLock["status"];
  launchEvidenceHref: string;
  buyerEvidencePackHref: string;
  buyerEvidenceBoardHref: string;
};

function proofTone(status: HomepageRouteLock["status"]) {
  if (status === "ready") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function shareGateTone(mode: BuyerShareGateSendPacketMode) {
  if (mode === "send") return "pass";
  if (mode === "review") return "watch";
  return "block";
}

function shareGateHeadline(mode: BuyerShareGateSendPacketMode) {
  if (mode === "send") return "Buyer send can proceed";
  if (mode === "review") return "Sponsor review before buyer send";
  return "Buyer send is on hold";
}

function liveProofTone(status: string) {
  if (status === "pass") return "pass";
  if (status === "watch") return "watch";
  return "block";
}

function shareGateCheckCopy(status: BuyerShareGateCheckStatus, evidence: string, action: string) {
  return status === "pass" ? evidence : action;
}

function proofButtonLabel(status: ProofVerifyStatus) {
  if (status === "checking") return "Checking links";
  if (status === "checked") return "Links checked";
  if (status === "failed") return "Check failed";
  return "Verify live links";
}

function linkActionAttrs(external: boolean) {
  return external ? { target: "_blank", rel: "noreferrer" } : {};
}

function publicRouteAttrs(href: string) {
  return linkActionAttrs(/^https?:\/\//i.test(href));
}

function routeActionAttrs(action: HomepageRouteLock["primaryAction"]) {
  return linkActionAttrs(action.external);
}

function plural(value: number, singular: string, pluralLabel: string) {
  return value === 1 ? singular : pluralLabel;
}

export default function MarketHeroProofSummary({
  proofVerification,
  proofVerifyStatus,
  proofVerifyError,
  proofFields,
  proofIntake,
  proofRepairDraft,
  proofEntry,
  packet,
  route,
  publicDecisionRoute,
  shareGate,
  onVerifyProofLinks,
  onProofRepairDraftChange,
  onApplyProofRepairDraft
}: {
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  proofVerifyStatus: ProofVerifyStatus;
  proofVerifyError: string;
  proofFields: ProofField[];
  proofIntake: Record<string, string>;
  proofRepairDraft: Partial<Record<string, string>>;
  proofEntry: HomepageProofSummary;
  packet: PacketSummary;
  route: RouteSummary;
  publicDecisionRoute: PublicDecisionRouteSummary;
  shareGate: ShareGateSummary;
  onVerifyProofLinks: () => void;
  onProofRepairDraftChange: (key: string, value: string) => void;
  onApplyProofRepairDraft: (key: string) => void | Promise<void>;
}) {
  const liveProofLine = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} public proof links verified live.`
    : proofVerifyStatus === "checking"
      ? "Checking Cloud Run, story, video, pilot, and work-order links now."
      : proofVerifyStatus === "failed"
        ? proofVerifyError || "Live proof check failed. Re-run after the public links are reachable."
        : "Run a live check across the public proof links before anyone accepts the claim.";
  const openResults = proofVerification?.results.filter((result) => result.status !== "pass") ?? [];
  const triageRows = proofVerification ? (openResults.length > 0 ? openResults : proofVerification.results).slice(0, 3) : [];
  const triageHeadline = openResults.length > 0 ? "Repair public proof blockers" : "Public proof links are live";
  const triageSummary = proofVerification
    ? openResults.length > 0
      ? `${openResults.length} open ${plural(openResults.length, "proof link", "proof links")}`
      : `${proofVerification.verifiedCount}/${proofVerification.totalCount} verified`
    : "Run live check";
  const passGateCount = shareGate.checks.filter((check) => check.status === "pass").length;

  return (
    <div className="market-hero-output-strip" aria-label="Buyer-visible proof summary">
      <div className={`market-hero-output-strip-head ${proofVerifyStatus === "checked" ? "is-confirmed" : proofVerifyStatus === "failed" ? "is-risk" : ""}`}>
        <div>
          <span>Buyer-visible proof</span>
          <em aria-live="polite">{liveProofLine}</em>
        </div>
        <button type="button" className="market-hero-live-check" onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"}>
          <Activity size={14} />
          {proofButtonLabel(proofVerifyStatus)}
        </button>
      </div>
      <div className={`market-hero-public-route ${proofTone(publicDecisionRoute.status)}`} aria-label="Public proof-to-decision route">
        <div className="market-hero-public-route-copy">
          <span>Public proof-to-decision route</span>
          <strong>Evidence opens where the buyer makes the call</strong>
          <small>Use the same workspace proof in the launch report, buyer pack, and decision board.</small>
        </div>
        <a href={publicDecisionRoute.launchEvidenceHref} {...publicRouteAttrs(publicDecisionRoute.launchEvidenceHref)}>
          <ExternalLink size={14} />
          <strong>Launch evidence report</strong>
          <small>Public artifacts, live verification, and buyer proof links in one report.</small>
        </a>
        <a href={publicDecisionRoute.buyerEvidencePackHref}>
          <ClipboardCheck size={14} />
          <strong>Open buyer decision cockpit</strong>
          <small>Review required artifacts, recommendation, response receipt, and repair handoff.</small>
        </a>
        <a href={publicDecisionRoute.buyerEvidenceBoardHref} {...publicRouteAttrs(publicDecisionRoute.buyerEvidenceBoardHref)}>
          <ShieldCheck size={14} />
          <strong>Buyer evidence board</strong>
          <small>Open the buyer-facing board for scope, value, proof, trust, and next decision.</small>
        </a>
      </div>
      {triageRows.length > 0 && (
        <details className="market-hero-live-results" aria-label="Live proof triage">
          <summary>
            <span>{triageHeadline}</span>
            <strong>{triageSummary}</strong>
          </summary>
          <div className="market-hero-live-results-grid">
            {triageRows.map((result) => {
              const field = proofFields.find((item) => item.key === result.id);
              const repairValue = field ? (proofRepairDraft[field.key] ?? proofIntake[field.key] ?? "") : "";
              const isRepairable = Boolean(field && result.status !== "pass");
              return (
                <article key={result.id} className={liveProofTone(result.status)}>
                  <div>
                    <strong>
                      {result.status} / {result.label}
                    </strong>
                    <a className="market-hero-live-row-link" href={field?.href ?? "#launch-evidence-console"}>
                      Open repair target
                    </a>
                  </div>
                  <small>{result.status === "pass" ? result.evidence : result.action}</small>
                  {isRepairable && field && (
                    <label className="market-hero-live-repair">
                      <span>Paste replacement URL</span>
                      <input
                        value={repairValue}
                        onChange={(event) => onProofRepairDraftChange(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        aria-label={`Replacement URL for ${result.label}`}
                      />
                      <button type="button" onClick={() => onApplyProofRepairDraft(field.key)} disabled={proofVerifyStatus === "checking" || !repairValue.trim() || repairValue === proofIntake[field.key]}>
                        {proofVerifyStatus === "checking" ? "Rechecking" : "Save & recheck"}
                      </button>
                    </label>
                  )}
                </article>
              );
            })}
          </div>
        </details>
      )}
      <a className={`market-hero-share-gate ${shareGateTone(shareGate.mode)}`} data-readiness={shareGate.readiness} href={shareGate.primaryActionHref} {...linkActionAttrs(shareGate.primaryActionExternal)}>
        <span>Buyer send decision</span>
        <strong>{shareGateHeadline(shareGate.mode)}</strong>
        <small>
          {shareGate.score}/100 share gate. {shareGate.decision}
        </small>
        <em>
          {shareGate.primaryActionLabel}: {shareGate.blockerCount} {plural(shareGate.blockerCount, "blocker", "blockers")} / {shareGate.watchCount} {plural(shareGate.watchCount, "warning", "warnings")}
        </em>
      </a>
      {shareGate.repairPlan.items.length > 0 && (
        <details className={`market-hero-share-gate-repair-plan ${shareGate.repairPlan.status}`} aria-label="Buyer send repair plan">
          <summary className="market-hero-share-gate-repair-head">
            <div>
              <span>Repair path</span>
              <strong>{shareGate.repairPlan.headline}</strong>
              <small>{shareGate.repairPlan.summary}</small>
            </div>
          </summary>
          <div className="market-hero-share-gate-repair-body">
            <a className="market-hero-share-gate-repair-export" href={shareGate.repairPlan.exportHref} download="buyer-send-repair-plan.md">
              Export plan
            </a>
            <ol>
              {shareGate.repairPlan.items.map((item) => (
                <li key={item.id} className={item.status}>
                  <a className="market-hero-share-gate-repair-item" href={item.href} {...linkActionAttrs(item.external)}>
                    <span>
                      {item.sequence}. {item.owner}
                    </span>
                    <strong>
                      {item.status} / {item.label}
                    </strong>
                    <small>{item.action}</small>
                    <em>{item.unlock}</em>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </details>
      )}
      <details className="market-hero-share-gate-checks" aria-label="Buyer share gate checks">
        <summary>
          <span>Gate checks</span>
          <strong>
            {passGateCount}/{shareGate.checks.length} pass
          </strong>
        </summary>
        <div className="market-hero-share-gate-check-grid">
          {shareGate.checks.map((check) => (
            <a key={check.id} className={check.status} href={check.href} {...linkActionAttrs(check.external)}>
              <strong>
                {check.status} / {check.label}
              </strong>
              <small>
                {check.score}/100. {shareGateCheckCopy(check.status, check.evidence, check.action)}
              </small>
            </a>
          ))}
        </div>
      </details>
      <a className={proofTone(proofEntry.status)} href="#homepage-proof-entry">
        <strong>{proofEntry.proofScore}/100 proof score</strong>
        <small>
          {proofEntry.readyCount}/{proofEntry.itemCount} proof rails ready. {proofEntry.headline}
        </small>
      </a>
      <a className={proofTone(packet.status)} href="/receipt-verifier">
        <strong>
          {packet.readyCount}/{packet.itemCount} packet artifacts
        </strong>
        <small>
          Receipt {packet.checksumAlgorithm}:{packet.checksum} can be verified before a reviewer accepts the claim.
        </small>
      </a>
      <a className={proofTone(route.status)} href={route.primaryAction.href} {...routeActionAttrs(route.primaryAction)}>
        <strong>{route.score}/100 route lock</strong>
        <small>
          {route.headline}. {route.operatorLine}
        </small>
      </a>
    </div>
  );
}
