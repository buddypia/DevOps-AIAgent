import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, FileCheck2, FileJson, Gauge, Globe2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import type { BuyerValueScenario } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import { buildGlobalLaunchAudit } from "./globalLaunchAudit";
import { buildGlobalProofDossier, type GlobalProofDossierLinkSummary } from "./globalProofDossier";
import { buildGlobalProofDossierReceipt } from "./globalProofDossierReceipt";
import type { LaunchRoom } from "./launchRoom";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import type { Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type GlobalLaunchAuditPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  launchRoom: LaunchRoom;
  publicAuditHref: string;
  publicDossierHref: string;
  publicPublishabilityHref: string;
  onCopyText: (text: string) => Promise<boolean>;
  onProofVerification: (result: BuyerShareGateProofVerificationSummary) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: string) {
  if (status === "pass") return <BadgeCheck size={15} />;
  if (status === "watch") return <AlertTriangle size={15} />;
  return <Crosshair size={15} />;
}

export default function GlobalLaunchAuditPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  buyerWorkOrder,
  workspace,
  launchRoom,
  publicAuditHref,
  publicDossierHref,
  publicPublishabilityHref,
  onCopyText,
  onProofVerification
}: GlobalLaunchAuditPanelProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "checked" | "failed">("idle");
  const [liveProof, setLiveProof] = useState<BuyerShareGateProofVerificationSummary | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const audit = useMemo(
    () =>
      buildGlobalLaunchAudit({
        projectBrief,
        recommendation,
        valueBlueprint,
        buyerScenario,
        pilotRun,
        buyerWorkOrder,
        workspace,
        launchRoom
      }),
    [buyerScenario, buyerWorkOrder, launchRoom, pilotRun, projectBrief, recommendation, valueBlueprint, workspace]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(audit.exportMarkdown)}`;
  const primaryAction = audit.actions[0];
  const proofKey = useMemo(() => JSON.stringify(audit.proofLinks.map((link) => [link.id, link.value])), [audit.proofLinks]);
  const dossierLiveProof = useMemo<GlobalProofDossierLinkSummary | undefined>(() => {
    if (!liveProof) return undefined;
    const urlById = new Map(audit.proofLinks.map((link) => [link.id, link.value]));
    return {
      ...liveProof,
      results: liveProof.results.map((result) => ({
        ...result,
        url: urlById.get(result.id) ?? "",
        finalUrl: urlById.get(result.id)
      }))
    };
  }, [audit.proofLinks, liveProof]);
  const dossier = useMemo(() => buildGlobalProofDossier({ audit, liveProof: dossierLiveProof }), [audit, dossierLiveProof]);
  const dossierReceipt = useMemo(() => buildGlobalProofDossierReceipt(dossier), [dossier]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    setLiveProof(null);
    setVerifyStatus("idle");
    setVerifyError("");
  }, [proofKey]);

  async function copyAudit() {
    const copied = await onCopyText(audit.exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function verifyLiveProof() {
    setVerifyStatus("checking");
    setVerifyError("");
    try {
      const response = await fetch("/api/proof-links/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          links: audit.proofLinks.map((link) => ({
            id: link.id,
            label: link.label,
            value: link.value
          }))
        })
      });
      if (!response.ok) throw new Error(`Proof verification failed with HTTP ${response.status}.`);
      const result = (await response.json()) as BuyerShareGateProofVerificationSummary;
      setLiveProof(result);
      onProofVerification(result);
      setVerifyStatus("checked");
    } catch (error) {
      setVerifyStatus("failed");
      setVerifyError(error instanceof Error ? error.message : "Proof verification failed.");
    }
  }

  const liveStatusById = new Map(liveProof?.results.map((result) => [result.id, result]));

  return (
    <section id="global-launch-audit" className={cx("global-launch-audit", audit.readiness)} aria-labelledby="global-launch-audit-title">
      <div className="global-launch-head">
        <div>
          <span className="eyebrow">Global launch audit</span>
          <h2 id="global-launch-audit-title">
            <Globe2 size={20} />
            {audit.headline}
          </h2>
          <p>{audit.hardTruth}</p>
          <div className="global-launch-actions" aria-label="Global launch audit actions">
            <a className="icon-link" href={primaryAction?.href ?? "#marketplace-workbench"}>
              <Crosshair size={14} />
              {primaryAction?.label ?? "Open workspace"}
            </a>
            <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyAudit}>
              <ClipboardCheck size={14} />
              {copyStatus === "copied" ? "Copied audit" : copyStatus === "failed" ? "Copy failed" : "Copy audit"}
            </button>
            <button className={cx("icon-link", verifyStatus === "checked" && "is-confirmed", verifyStatus === "failed" && "is-risk")} type="button" onClick={verifyLiveProof} disabled={verifyStatus === "checking"}>
              <Gauge size={14} />
              {verifyStatus === "checking" ? "Checking links" : verifyStatus === "checked" ? "Links checked" : "Verify live links"}
            </button>
            <a className="icon-link" href={publicAuditHref} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              Open public audit
            </a>
            <a className="icon-link" href={publicDossierHref} target="_blank" rel="noreferrer">
              <FileCheck2 size={14} />
              Open proof dossier
            </a>
            <a className="icon-link" href={publicPublishabilityHref} target="_blank" rel="noreferrer">
              <BadgeCheck size={14} />
              Publishability report
            </a>
            <a className="icon-link" href={exportHref} download="global-launch-audit.md">
              <Download size={14} />
              Download audit
            </a>
            <a className="icon-link" href={dossierReceipt.href} download="global-proof-dossier-receipt.md">
              <FileCheck2 size={14} />
              Dossier receipt
            </a>
            <a className="icon-link" href={dossierReceipt.verificationRequestHref} download="global-proof-dossier-verify-request.json">
              <FileJson size={14} />
              Verify request
            </a>
          </div>
        </div>
        <div className="global-launch-score" aria-label="Global launch score">
          <span>{audit.readiness}</span>
          <strong>{audit.score}</strong>
          <small>{audit.targetMarket}</small>
        </div>
      </div>

      <div className="global-launch-metrics" aria-label="Global launch metrics">
        <article>
          <span>Modeled value</span>
          <strong>{audit.monthlyValue}</strong>
        </article>
        <article>
          <span>Measured value</span>
          <strong>{audit.measuredValue}</strong>
        </article>
        <article>
          <span>Public proof</span>
          <strong>{audit.proofSummary}</strong>
        </article>
        <article>
          <span>Ops depth</span>
          <strong>{audit.opsSummary}</strong>
        </article>
      </div>

      <section className="global-launch-narrative" aria-label="Launch narrative">
        <div>
          <span>Public narrative</span>
          <strong>{audit.launchNarrative}</strong>
        </div>
        <ol>
          {audit.actions.map((action) => (
            <li key={action.id} className={action.priority}>
              <span>{action.priority}</span>
              <div>
                <strong>{action.owner}</strong>
                <p>{action.action}</p>
              </div>
              <a href={action.href}>
                <Crosshair size={13} />
                Fix
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section className="global-launch-lift-plan" aria-label="Release lift plan">
        <div className="global-launch-lift-copy">
          <span>Release lift plan</span>
          <strong>{audit.liftPlan.summary}</strong>
          <div className="global-launch-lift-stats" aria-label="Projected release lift">
            <article>
              <span>Target</span>
              <b>{audit.liftPlan.targetScore}</b>
            </article>
            <article>
              <span>Gap</span>
              <b>{audit.liftPlan.scoreGap}</b>
            </article>
            <article>
              <span>First fix</span>
              <b>{audit.liftPlan.projectedScoreAfterFirstFix}</b>
            </article>
          </div>
        </div>
        <ol className="global-launch-lift-actions">
          {audit.liftPlan.actions.map((action) => (
            <li key={action.id} className={action.priority}>
              <div>
                <span>{action.priority}</span>
                <b>+{action.scoreLift}</b>
              </div>
              <strong>{action.label}</strong>
              <p>{action.proofRequired}</p>
              <small>{action.decisionImpact}</small>
              <a href={action.href}>
                <Crosshair size={13} />
                {action.projectedScore}/100
              </a>
            </li>
          ))}
        </ol>
      </section>

      <div className="global-launch-dimensions" aria-label="Global launch dimensions">
        {audit.dimensions.map((dimension) => (
          <article key={dimension.id} className={dimension.status}>
            <div>
              <span>
                {statusIcon(dimension.status)}
                {dimension.status}
              </span>
              <b>{dimension.score}</b>
            </div>
            <strong>{dimension.label}</strong>
            <p>{dimension.evidence}</p>
            <a href={dimension.href}>
              <Crosshair size={13} />
              {dimension.status === "pass" ? "Review" : "Improve"}
            </a>
          </article>
        ))}
      </div>

      <section className="global-launch-proof-strip" aria-label="Global launch proof links">
        <div>
          <span>Proof trail</span>
          <strong>{liveProof ? `${liveProof.verifiedCount}/${liveProof.totalCount} live links verified` : `${audit.proofLinks.filter((link) => link.status === "pass").length} public links attached`}</strong>
        </div>
        <div>
          {audit.proofLinks.map((link) => {
            const live = liveStatusById.get(link.id);
            const status = live?.status ?? link.status;
            return (
            <a key={link.id} className={status} href={link.value || link.href} target={link.value ? "_blank" : undefined} rel={link.value ? "noreferrer" : undefined}>
              {status === "pass" ? <ExternalLink size={13} /> : <Crosshair size={13} />}
              {link.label}
            </a>
            );
          })}
        </div>
      </section>

      {(liveProof || verifyError) && (
        <section className={cx("global-launch-live-check", verifyStatus)} aria-label="Live proof link verification">
          <div className="global-launch-live-head">
            <div>
              <span>Live proof check</span>
              <strong>{liveProof ? `${liveProof.score}/100 public reachability` : "Live proof check failed"}</strong>
              <p>{liveProof ? `Checked ${liveProof.totalCount} links at ${new Date(liveProof.checkedAt).toLocaleString()}.` : verifyError}</p>
            </div>
            {liveProof && (
              <div>
                <span>Verified</span>
                <strong>
                  {liveProof.verifiedCount}/{liveProof.totalCount}
                </strong>
              </div>
            )}
          </div>
          {liveProof && (
            <div className="global-launch-live-results">
              {liveProof.results.map((result) => (
                <article key={result.id} className={result.status}>
                  <div>
                    <span>
                      {statusIcon(result.status)}
                      {result.status}
                    </span>
                    <b>{result.httpStatus ?? "URL"}</b>
                  </div>
                  <strong>{result.label}</strong>
                  <p>{result.evidence}</p>
                  <small>{result.action}</small>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
