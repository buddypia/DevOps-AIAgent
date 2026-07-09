import { Download, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import type { QuickProofRepairItem, QuickProofRepairPlan } from "./QuickWorkflowIntakePanel";
import type { WorkflowLiveProofAudit } from "./workflowLiveProofAudit";

type QuickLiveProofStatus = "idle" | "checking" | "checked" | "failed";

type QuickProofPreflightPanelProps = {
  liveProofAudit: WorkflowLiveProofAudit;
  proofRepairPlan: QuickProofRepairPlan;
  repairItems: QuickProofRepairItem[];
  verifyStatus: QuickLiveProofStatus;
  liveProofAuditVerifierHref: string;
  liveProofAuditId: string;
  onVerifyProofLinks: () => void;
  onProofLinkChange: (id: QuickProofRepairItem["id"], value: string) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickProofPreflightPanel({
  liveProofAudit,
  proofRepairPlan,
  repairItems,
  verifyStatus,
  liveProofAuditVerifierHref,
  liveProofAuditId,
  onVerifyProofLinks,
  onProofLinkChange
}: QuickProofPreflightPanelProps) {
  const nextRepair = repairItems[0];

  return (
    <div className={cx("quick-proof-preflight", liveProofAudit.status, verifyStatus === "failed" && "is-failed")} aria-label="External proof preflight">
      <div className="quick-proof-preflight-head">
        <div>
          <span>
            <Gauge size={13} />
            External proof preflight
          </span>
          <strong>{liveProofAudit.headline}</strong>
          <p>{liveProofAudit.summary}</p>
        </div>
        <div className="quick-proof-preflight-actions">
          <button type="button" onClick={onVerifyProofLinks} disabled={verifyStatus === "checking"}>
            <Gauge size={14} />
            {verifyStatus === "checking" ? "Checking proof" : "Run preflight"}
          </button>
          {verifyStatus === "checked" && (
            <a href={liveProofAudit.verificationRequestHref} download="workflow-live-proof-audit-receipt.json">
              <Download size={14} />
              Receipt
            </a>
          )}
          {verifyStatus === "checked" && (
            <a href={liveProofAuditVerifierHref}>
              <ShieldCheck size={14} />
              Verify
            </a>
          )}
          <a href={`#${liveProofAuditId}`}>
            <ExternalLink size={14} />
            Audit
          </a>
        </div>
      </div>
      <div className="quick-proof-preflight-stats" aria-label="External proof preflight status">
        <article>
          <span>Live verified</span>
          <strong>
            {liveProofAudit.verifiedCount}/{liveProofAudit.totalCount}
          </strong>
          <small>Score {liveProofAudit.score}/100</small>
        </article>
        <article>
          <span>Proof slots</span>
          <strong>
            {proofRepairPlan.readyCount}/{proofRepairPlan.items.length}
          </strong>
          <small>{proofRepairPlan.repairCount} repair open</small>
        </article>
        <article>
          <span>{nextRepair ? "Next repair" : "Next step"}</span>
          <strong>{nextRepair?.label ?? (liveProofAudit.status === "verified" ? "Audit receipt" : "Live check")}</strong>
          <small>{nextRepair?.action ?? liveProofAudit.nextAction}</small>
        </article>
      </div>
      {repairItems.length > 0 && (
        <div className="quick-proof-preflight-repair">
          {repairItems.map((item) => (
            <label key={item.id} className={item.status}>
              <span>{item.label}</span>
              <input value={item.value === "Missing public URL" ? "" : item.value} onChange={(event) => onProofLinkChange(item.id, event.target.value)} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
