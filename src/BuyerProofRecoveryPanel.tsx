import { ClipboardCheck, Crosshair, Download, ExternalLink, FileJson, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BuyerProofRecoveryPlan } from "./buyerProofRecoveryPlan";
import { buildBuyerProofRecoveryReceipt } from "./buyerProofRecoveryReceipt";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BuyerProofRecoveryPanel({
  plan,
  recoveryHref,
  recoveryExportHref,
  onCopyText
}: {
  plan: BuyerProofRecoveryPlan;
  recoveryHref: string;
  recoveryExportHref: string;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copyLabel = copyStatus === "copied" ? "Copied packet" : copyStatus === "failed" ? "Copy failed" : "Copy packet";
  const receipt = useMemo(() => buildBuyerProofRecoveryReceipt(plan), [plan]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyRepairPacket = async () => {
    const copied = await onCopyText(plan.repairPacket.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  return (
    <section className={cx("buyer-proof-recovery", plan.severity)} aria-label="Buyer proof recovery desk">
      <div className="buyer-proof-recovery-head">
        <div>
          <span>Recovery desk</span>
          <strong>{plan.headline}</strong>
          <p>{plan.decision}</p>
        </div>
        <div className="buyer-proof-recovery-state">
          <span>{plan.shareInstruction}</span>
          <strong>{plan.openTaskCount}</strong>
          <small>
            {plan.blockedTaskCount} block / {plan.watchTaskCount} watch
          </small>
        </div>
        <div className="buyer-proof-recovery-actions" aria-label="Buyer proof recovery actions">
          <a className="icon-link" href={recoveryHref} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Open recovery
          </a>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyRepairPacket}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <a className="icon-link" href={recoveryExportHref} download="buyer-proof-recovery-desk.md">
            <Download size={14} />
            Download recovery
          </a>
          <a className="icon-link" href={plan.taskLedger.href} download={plan.taskLedger.filename}>
            <Download size={14} />
            Download tasks
          </a>
          <a className="icon-link" href={receipt.href} download="buyer-proof-recovery-receipt.md">
            <ShieldCheck size={14} />
            Download receipt
          </a>
          <a className="icon-link" href={receipt.payloadHref} download="buyer-proof-recovery-replay-payload.json">
            <FileJson size={14} />
            Replay payload
          </a>
          <a className="icon-link" href={receipt.verificationRequestHref} download="buyer-proof-recovery-verify-request.json">
            <FileJson size={14} />
            Verify request
          </a>
        </div>
      </div>
      <div className="buyer-proof-recovery-first">
        <span>First action</span>
        <strong>{plan.firstAction}</strong>
      </div>
      <div className="buyer-proof-recovery-steps">
        {plan.steps.map((step) => (
          <article key={step.id} className={step.status}>
            <div>
              <span>{step.status}</span>
              <strong>{step.label}</strong>
            </div>
            <p>{step.action}</p>
            <small>
              {step.owner} - {step.due} - {step.source}
            </small>
            <b>{step.acceptance}</b>
            {step.href && (
              <a href={step.href}>
                <Crosshair size={13} />
                Open proof
              </a>
            )}
          </article>
        ))}
      </div>
      <div className="buyer-proof-recovery-resume">
        <span>Resume criteria</span>
        <ul>
          {plan.resumeCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
