import { BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, GitBranch, Mail, Rocket, Scale, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeBuyerValueScenarioInput, type BuyerValueScenario, type BuyerValueScenarioInput } from "./buyerValueScenario";
import { normalizeBuyerWorkOrderInput, type BuyerWorkOrderInput } from "./buyerWorkOrder";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import { normalizePilotRunReceiptInput, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buyerFacingProofUrlProblem, isBuyerFacingProofUrl, PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import { buildWorkflowDeliveryMemo } from "./workflowDeliveryMemo";
import { buildWorkflowIntakeBrief, buildWorkflowIntakeReadiness } from "./workflowIntake";
import { emptyWorkflowIntakeDraft, type WorkflowIntakeDraft } from "./workflowIntakeDraft";
import { WORKFLOW_INTAKE_STARTERS, buildWorkflowIntakePreviewRows, type WorkflowIntakePreviewRow, type WorkflowIntakeStarter } from "./workflowIntakePreview";
import { buildWorkflowLiveProofAudit } from "./workflowLiveProofAudit";
import type { WorkflowIntakeProofSlot, WorkflowIntakeShareGate } from "./workflowIntakeShareGate";

const EMPTY_WORKFLOW_INTAKE_DRAFT: WorkflowIntakeDraft = emptyWorkflowIntakeDraft();

type WorkflowIntakeExtractStatus = "idle" | "extracting" | "previewed" | "applied" | "failed";

export { WORKFLOW_INTAKE_STARTERS, buildWorkflowIntakePreviewRows };
export type { WorkflowIntakePreviewRow, WorkflowIntakeStarter };

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function yen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

type BuyerProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

function proofVerificationButtonLabel(status: BuyerProofVerifyStatus) {
  if (status === "checking") return "Checking live links";
  if (status === "checked") return "Links checked";
  if (status === "failed") return "Check failed";
  return "Verify live links";
}

type BuyerWorkflowIntakePanelProps = {
  projectBrief: string;
  workOrder: BuyerWorkOrderInput;
  buyerScenario: BuyerValueScenario;
  buyerScenarioInput: BuyerValueScenarioInput;
  pilotRun: PilotRunReceiptInput;
  proofLinks: WorkflowIntakeProofSlot[];
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  proofVerifyStatus: BuyerProofVerifyStatus;
  proofVerifyError: string;
  launchRoomHref: string;
  buyerProofAuditHref: string;
  buyerDeliveryMemoHref: string;
  buyerTrustManifestHref: string;
  buyerDecisionReceiptHref: string;
  onApplyBrief: (brief: string) => void;
  onProofLinkChange: (id: string, value: string) => void;
  onVerifyProofLinks: () => void;
  onCopyText: (text: string) => Promise<boolean>;
  onWorkOrderChange: (patch: Partial<BuyerWorkOrderInput>) => void;
  onBuyerScenarioChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  onPilotRunChange: (patch: Partial<PilotRunReceiptInput>) => void;
};

export default function BuyerWorkflowIntakePanel({
  projectBrief,
  workOrder,
  buyerScenario,
  buyerScenarioInput,
  pilotRun,
  proofLinks,
  proofVerification,
  proofVerifyStatus,
  proofVerifyError,
  launchRoomHref,
  buyerProofAuditHref,
  buyerDeliveryMemoHref,
  buyerTrustManifestHref,
  buyerDecisionReceiptHref,
  onApplyBrief,
  onProofLinkChange,
  onVerifyProofLinks,
  onCopyText,
  onWorkOrderChange,
  onBuyerScenarioChange,
  onPilotRunChange
}: BuyerWorkflowIntakePanelProps) {
  const [rawIntake, setRawIntake] = useState("");
  const [extractedDraft, setExtractedDraft] = useState<WorkflowIntakeDraft>(EMPTY_WORKFLOW_INTAKE_DRAFT);
  const [selectedStarterId, setSelectedStarterId] = useState("");
  const [extractStatus, setExtractStatus] = useState<WorkflowIntakeExtractStatus>("idle");
  const [memoCopyStatus, setMemoCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [proofAuditCopyStatus, setProofAuditCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [shareGate, setShareGate] = useState<WorkflowIntakeShareGate | null>(null);
  const generatedBrief = buildWorkflowIntakeBrief({ workOrder, buyerScenario: buyerScenarioInput, pilotRun });
  const readiness = buildWorkflowIntakeReadiness({ workOrder, buyerScenario: buyerScenarioInput, pilotRun });
  const isApplied = projectBrief.trim() === generatedBrief.trim();
  const minutesSaved = Math.max(0, pilotRun.observedManualMinutes - pilotRun.observedAssistedMinutes);
  const evidenceUrl = workOrder.evidenceUrl || pilotRun.evidenceUrl;
  const evidenceUrlProblem = buyerFacingProofUrlProblem(evidenceUrl);
  const evidenceUrlLine = evidenceUrlProblem || "Evidence URL is buyer-facing and can support the buyer room.";
  const proofState = evidenceUrl ? "Evidence linked" : "Proof pending";
  const canPreviewExtraction = rawIntake.trim().length > 0 && extractStatus !== "extracting";
  const canApplyPreview = extractedDraft.detectedSignals.length > 0 && extractStatus !== "extracting";
  const extractionPreviewRows = buildWorkflowIntakePreviewRows(extractedDraft);
  const proofVerificationLabel = proofVerificationButtonLabel(proofVerifyStatus);
  const proofVerificationStatusLine = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} live links verified`
    : proofVerifyStatus === "failed"
      ? proofVerifyError || "Live proof verification failed."
      : "Live verification has not run for these URLs.";
  const liveProofAudit = buildWorkflowLiveProofAudit({ proofLinks, proofVerification, proofVerifyError: proofVerifyStatus === "failed" ? proofVerifyError : "" });
  const deliveryMemo = shareGate
    ? buildWorkflowDeliveryMemo({
        workOrder,
        buyerScenario: buyerScenarioInput,
        pilotRun,
        proofLinks,
        proofVerification,
        shareGate,
        launchRoomHref,
        proofAuditHref: buyerProofAuditHref,
        trustManifestHref: buyerTrustManifestHref,
        value: {
          monthlyGrossValueYen: buyerScenario.monthlyGrossValueYen,
          paybackDays: buyerScenario.paybackDays,
          confidenceScore: buyerScenario.confidenceScore
        }
      })
    : null;
  const deliveryExportHref = deliveryMemo ? `data:text/markdown;charset=utf-8,${encodeURIComponent(deliveryMemo.exportMarkdown)}` : "#";

  useEffect(() => {
    let active = true;
    void import("./workflowIntakeShareGate").then(({ buildWorkflowIntakeShareGate }) => {
      if (!active) return;
      setShareGate(
        buildWorkflowIntakeShareGate({
          workOrder,
          buyerScenario: buyerScenarioInput,
          pilotRun,
          proofLinks,
          proofVerification,
          launchRoomHref,
          proofAuditHref: buyerProofAuditHref,
          trustManifestHref: buyerTrustManifestHref
        })
      );
    });
    return () => {
      active = false;
    };
  }, [buyerProofAuditHref, buyerTrustManifestHref, buyerScenarioInput, launchRoomHref, pilotRun, proofLinks, proofVerification, workOrder]);

  useEffect(() => {
    if (extractStatus !== "applied" && extractStatus !== "failed") return;
    const timeout = window.setTimeout(() => setExtractStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [extractStatus]);

  useEffect(() => {
    if (memoCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setMemoCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [memoCopyStatus]);

  useEffect(() => {
    if (proofAuditCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setProofAuditCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [proofAuditCopyStatus]);

  function applyDraftToWorkspace(draft: WorkflowIntakeDraft) {
    const nextWorkOrder = normalizeBuyerWorkOrderInput({ ...workOrder, ...draft.workOrder }, workOrder);
    const nextBuyerScenario = normalizeBuyerValueScenarioInput({ ...buyerScenarioInput, ...draft.buyerScenario }, buyerScenarioInput);
    const nextPilotRun = normalizePilotRunReceiptInput({ ...pilotRun, ...draft.pilotRun }, pilotRun);
    onWorkOrderChange(nextWorkOrder);
    onBuyerScenarioChange(nextBuyerScenario);
    onPilotRunChange(nextPilotRun);
    onApplyBrief(buildWorkflowIntakeBrief({ workOrder: nextWorkOrder, buyerScenario: nextBuyerScenario, pilotRun: nextPilotRun }));
  }

  async function previewExtractedDraft() {
    if (!canPreviewExtraction) return;
    setExtractStatus("extracting");
    try {
      const { buildWorkflowIntakeDraftFromText } = await import("./workflowIntakeDraft");
      const draft = buildWorkflowIntakeDraftFromText(rawIntake);
      setExtractedDraft(draft);
      if (draft.detectedSignals.length === 0) {
        setExtractStatus("failed");
        return;
      }
      setExtractStatus("previewed");
    } catch {
      setExtractStatus("failed");
    }
  }

  function applyPreviewedDraft() {
    if (!canApplyPreview) return;
    applyDraftToWorkspace(extractedDraft);
    setExtractStatus("applied");
  }

  async function copyDeliveryMemo() {
    if (!deliveryMemo) return;
    const copied = await onCopyText(deliveryMemo.copyText);
    setMemoCopyStatus(copied ? "copied" : "failed");
  }

  async function copyLiveProofAudit() {
    const copied = await onCopyText(liveProofAudit.copyText);
    setProofAuditCopyStatus(copied ? "copied" : "failed");
  }

  function loadStarter(starter: WorkflowIntakeStarter) {
    setRawIntake(starter.note);
    setSelectedStarterId(starter.id);
    setExtractedDraft({
      ...EMPTY_WORKFLOW_INTAKE_DRAFT,
      summary: `${starter.buyer}: ${starter.outcome}`,
      warnings: []
    });
    setExtractStatus("idle");
  }

  return (
    <section className="workflow-intake" aria-labelledby="workflow-intake-title">
      <div className="workflow-intake-head">
        <div>
          <span className="eyebrow">Workflow intake</span>
          <h2 id="workflow-intake-title">
            <Workflow size={19} />
            Make the first pilot concrete
          </h2>
        </div>
        <button className="workflow-intake-primary" type="button" onClick={() => onApplyBrief(generatedBrief)} disabled={isApplied}>
          {isApplied ? <BadgeCheck size={16} /> : <GitBranch size={16} />}
          {isApplied ? "Brief applied" : "Apply to brief and squad"}
        </button>
      </div>

      <section className="workflow-intake-starters" aria-label="Workflow intake starters">
        <div>
          <span>Start from a real buyer workflow</span>
          <strong>Pick one, preview extraction, then apply the packet</strong>
        </div>
        <div className="workflow-intake-starter-grid">
          {WORKFLOW_INTAKE_STARTERS.map((starter) => (
            <button key={starter.id} className={cx(selectedStarterId === starter.id && "is-selected")} type="button" onClick={() => loadStarter(starter)}>
              <span>{starter.buyer}</span>
              <strong>{starter.title}</strong>
              <p>{starter.outcome}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="workflow-intake-paste" aria-label="Paste workflow note">
        <label className="workflow-intake-raw">
          <span>Paste a real workflow note</span>
          <textarea
            value={rawIntake}
            onChange={(event) => {
              setRawIntake(event.target.value);
              setExtractedDraft(EMPTY_WORKFLOW_INTAKE_DRAFT);
              setExtractStatus("idle");
            }}
            placeholder={`Example: Buyer: Platform security lead\nWorkflow: weekly release sign-off is copied from tickets, CI logs, and chat by hand.\nSuccess: save 6 hours per sign-off and close 4 proof gaps. Team 7, 5 reviews/month, manual 12h/review, 72% adoption. Pilot: manual 360 min, assisted 115 min, 3 participants, 4/5 accepted. Evidence: ${PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl}`}
          />
        </label>
        <div className="workflow-intake-extract">
          <div>
            <span>Extraction</span>
            <strong>
              {extractStatus === "extracting"
                ? "Reading workflow note"
                : extractStatus === "applied"
                  ? "Workspace packet applied"
                  : extractedDraft.confidence
                    ? `${extractedDraft.confidence}/100 signal confidence`
                    : "No note extracted yet"}
            </strong>
            <p>{extractedDraft.summary}</p>
          </div>
          <div className="workflow-intake-extract-actions">
            <button className="workflow-intake-secondary" type="button" onClick={previewExtractedDraft} disabled={!canPreviewExtraction}>
              <Sparkles size={15} />
              {extractStatus === "extracting" ? "Extracting" : extractStatus === "failed" ? "Retry preview" : extractedDraft.detectedSignals.length > 0 ? "Refresh preview" : "Preview"}
            </button>
            <button className={cx("workflow-intake-secondary", extractStatus === "applied" && "is-confirmed")} type="button" onClick={applyPreviewedDraft} disabled={!canApplyPreview}>
              <BadgeCheck size={15} />
              {extractStatus === "applied" ? "Packet applied" : "Apply preview"}
            </button>
          </div>
          {(extractedDraft.detectedSignals.length > 0 || extractStatus === "failed") && (
            <div className="workflow-intake-extraction-preview" aria-label="Extraction preview">
              {extractionPreviewRows.map((row) => (
                <article key={row.id} className={row.status}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </article>
              ))}
            </div>
          )}
          <div className="workflow-intake-signals" aria-label="Detected workflow signals">
            {extractedDraft.detectedSignals.length > 0 ? extractedDraft.detectedSignals.map((signal) => <span key={signal}>{signal}</span>) : <span>waiting for signal</span>}
          </div>
          {extractedDraft.warnings.length > 0 && rawIntake.trim() && (extractedDraft.confidence > 0 || extractStatus === "failed") && (
            <ul className="workflow-intake-warnings">
              {extractedDraft.warnings.slice(0, 3).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="workflow-intake-readiness" aria-label="Workflow intake decision">
        <div>
          <span>Buyer decision</span>
          <strong>{readiness.headline}</strong>
          <p>{readiness.nextAction}</p>
        </div>
        <div className="workflow-intake-score">
          <span>{readiness.decision}</span>
          <strong>{readiness.score}</strong>
        </div>
      </div>

      {shareGate ? (
        <section className={cx("workflow-share-gate", `is-${shareGate.decision}`)} aria-label="External share gate">
          <div className="workflow-share-gate-top">
            <div>
              <span>External share gate</span>
              <strong>{shareGate.headline}</strong>
              <p>{shareGate.nextAction}</p>
            </div>
            <div className="workflow-share-score" aria-label="External share score">
              <span>{shareGate.decision}</span>
              <strong>{shareGate.score}</strong>
              <small>
                {shareGate.sealedProofCount}/{shareGate.proofSlotCount} proof slots
              </small>
            </div>
            <a className="workflow-share-primary" href={shareGate.primaryActionHref} target={shareGate.primaryActionExternal ? "_blank" : undefined} rel={shareGate.primaryActionExternal ? "noreferrer" : undefined}>
              {shareGate.decision === "share-ready" ? <ExternalLink size={14} /> : <Crosshair size={14} />}
              {shareGate.primaryActionLabel}
            </a>
          </div>
          <div className="workflow-share-links" aria-label="Current buyer artifacts">
            <a href={launchRoomHref} target="_blank" rel="noreferrer">
              <Rocket size={13} />
              Launch room
            </a>
            <a href={buyerProofAuditHref} target="_blank" rel="noreferrer">
              <Gauge size={13} />
              Proof audit
            </a>
            <a href={buyerDeliveryMemoHref} target="_blank" rel="noreferrer">
              <Mail size={13} />
              Delivery memo
            </a>
            <a href={buyerTrustManifestHref} target="_blank" rel="noreferrer">
              <ShieldCheck size={13} />
              Trust manifest
            </a>
            <a href={buyerDecisionReceiptHref} target="_blank" rel="noreferrer">
              <Scale size={13} />
              Decision receipt
            </a>
          </div>
          <div className="workflow-proof-slots" aria-label="Proof slot editor">
            <div className="workflow-proof-slots-head">
              <div>
                <span>Proof slots</span>
                <strong>Close the buyer packet without leaving this workspace</strong>
              </div>
              <div className="workflow-proof-verify-panel">
                <button
                  className={cx("workflow-proof-verify", proofVerifyStatus === "checked" && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")}
                  type="button"
                  onClick={onVerifyProofLinks}
                  disabled={proofVerifyStatus === "checking"}
                >
                  {proofVerifyStatus === "checked" ? <BadgeCheck size={14} /> : <Gauge size={14} />}
                  {proofVerificationLabel}
                </button>
                <small className={cx(Boolean(proofVerification) && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")}>{proofVerificationStatusLine}</small>
              </div>
            </div>
            <div className="workflow-proof-slot-grid">
              {proofLinks.map((link) => {
                const sealed = isBuyerFacingProofUrl(link.value);
                return (
                  <label key={link.id} className={cx("workflow-proof-slot", sealed ? "clear" : "watch")}>
                    <span>{link.label}</span>
                    <input type="url" value={link.value} onChange={(event) => onProofLinkChange(link.id, event.target.value)} placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl} />
                    <small>{sealed ? "Public URL sealed" : "Paste a public HTTPS URL"}</small>
                  </label>
                );
              })}
            </div>
          </div>
          {(proofVerification || proofVerifyStatus === "failed") && (
            <section className={cx("workflow-live-proof-audit", `is-${liveProofAudit.status}`)} aria-label="Live proof audit receipt">
              <div className="workflow-live-proof-audit-head">
                <div>
                  <span>Live proof audit</span>
                  <strong>{liveProofAudit.headline}</strong>
                  <p>{liveProofAudit.summary}</p>
                </div>
                <div className="workflow-live-proof-audit-score">
                  <span>{liveProofAudit.verifiedCount}/{liveProofAudit.totalCount}</span>
                  <strong>{liveProofAudit.score}</strong>
                  <small>{liveProofAudit.checkedAt || "not checked"}</small>
                </div>
                <button className={cx("workflow-delivery-action", proofAuditCopyStatus === "copied" && "is-confirmed", proofAuditCopyStatus === "failed" && "is-risk")} type="button" onClick={copyLiveProofAudit}>
                  <ClipboardCheck size={14} />
                  {proofAuditCopyStatus === "copied" ? "Audit copied" : proofAuditCopyStatus === "failed" ? "Copy failed" : "Copy audit"}
                </button>
              </div>
              <div className="workflow-live-proof-audit-rows">
                {liveProofAudit.rows.map((row) => (
                  <article key={row.id} className={row.status}>
                    <span>{row.status}</span>
                    <strong>{row.label}</strong>
                    <p>{row.evidence}</p>
                    <small>{row.action}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
          <div className="workflow-share-checks">
            {shareGate.checks.map((check) => (
              <a key={check.id} className={check.status} href={check.href}>
                <span>{check.status}</span>
                <strong>{check.label}</strong>
                <p>{check.evidence}</p>
                <small>{check.fix}</small>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <section className="workflow-share-gate is-internal-review" aria-label="External share gate" aria-busy="true">
          <div className="workflow-share-gate-top">
            <div>
              <span>External share gate</span>
              <strong>Checking buyer-share readiness</strong>
              <p>Reading current proof links, launch room, proof audit, and trust manifest.</p>
            </div>
            <div className="workflow-share-score" aria-label="External share score">
              <span>checking</span>
              <strong>--</strong>
              <small>proof slots</small>
            </div>
            <a className="workflow-share-primary" href={buyerProofAuditHref} target="_blank" rel="noreferrer">
              <Gauge size={14} />
              Review proof audit
            </a>
          </div>
        </section>
      )}

      {deliveryMemo && (
        <section className={cx("workflow-delivery-memo", `is-${deliveryMemo.decision}`)} aria-label="Buyer delivery memo">
          <div className="workflow-delivery-head">
            <div>
              <span>Buyer delivery memo</span>
              <strong>{deliveryMemo.headline}</strong>
              <p>{deliveryMemo.primaryAsk}</p>
            </div>
            <div className="workflow-delivery-actions">
              <button className={cx("workflow-delivery-action", memoCopyStatus === "copied" && "is-confirmed", memoCopyStatus === "failed" && "is-risk")} type="button" onClick={copyDeliveryMemo}>
                <ClipboardCheck size={14} />
                {memoCopyStatus === "copied" ? "Memo copied" : memoCopyStatus === "failed" ? "Copy failed" : "Copy memo"}
              </button>
              <a className="workflow-delivery-action" href={deliveryExportHref} download="buyer-delivery-memo.md">
                <Download size={14} />
                Download
              </a>
              <a className="workflow-delivery-action" href={buyerDeliveryMemoHref} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Public memo
              </a>
              <a className="workflow-delivery-action" href={buyerDecisionReceiptHref} target="_blank" rel="noreferrer">
                <Scale size={14} />
                Record decision
              </a>
            </div>
          </div>
          <div className="workflow-delivery-message">
            <div>
              <span>Subject</span>
              <strong>{deliveryMemo.subject}</strong>
            </div>
            <p>
              <Mail size={14} />
              {deliveryMemo.body}
            </p>
          </div>
          <div className="workflow-delivery-bridge" aria-label="Buyer decision bridge">
            <div>
              <span>Decision bridge</span>
              <strong>{deliveryMemo.decisionBridge.headline}</strong>
              <p>{deliveryMemo.decisionBridge.buyerCondition}</p>
              <small>{deliveryMemo.decisionBridge.measuredSupport}</small>
            </div>
            <div className="workflow-delivery-bridge-metrics">
              {deliveryMemo.decisionBridge.metrics.map((metric) => (
                <article key={metric.id} className={metric.status}>
                  <span>{metric.status}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.label}</p>
                  <small>{metric.evidence}</small>
                </article>
              ))}
            </div>
          </div>
          <div className="workflow-delivery-proof" aria-label="Delivery memo proof rows">
            {deliveryMemo.proofRows.map((row) => (
              <a key={row.id} className={row.status} href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel={row.href.startsWith("http") ? "noreferrer" : undefined}>
                <span>{row.status}</span>
                <strong>{row.label}</strong>
                <small>{row.evidence}</small>
              </a>
            ))}
          </div>
          <div className="workflow-delivery-next">
            <div>
              <span>Open risk</span>
              <strong>{deliveryMemo.riskSummary}</strong>
            </div>
            <ol>
              {deliveryMemo.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <div className="workflow-intake-metrics" aria-label="Workflow intake summary">
        <article>
          <span>Buyer</span>
          <strong>{workOrder.targetUser || "Target user missing"}</strong>
        </article>
        <article>
          <span>Monthly value</span>
          <strong>{yen(buyerScenario.monthlyGrossValueYen)}</strong>
        </article>
        <article>
          <span>Saved per run</span>
          <strong>{minutesSaved}m</strong>
        </article>
        <article>
          <span>Proof</span>
          <strong>{proofState}</strong>
        </article>
      </div>

      <div className="workflow-intake-checks" aria-label="Workflow readiness checks">
        {readiness.checks.map((check) => (
          <article key={check.id} className={check.status}>
            <span>{check.label}</span>
            <strong>{check.status}</strong>
            <p>{check.evidence}</p>
            <small>{check.fix}</small>
          </article>
        ))}
      </div>

      <div className="workflow-intake-grid">
        <label className="workflow-intake-request">
          <span>Workflow request</span>
          <textarea value={workOrder.request} onChange={(event) => onWorkOrderChange({ request: event.target.value })} />
        </label>
        <label>
          <span>Target user</span>
          <input value={workOrder.targetUser} onChange={(event) => onWorkOrderChange({ targetUser: event.target.value })} placeholder="Platform / DevOps Lead" />
        </label>
        <label>
          <span>Success metric</span>
          <input value={workOrder.successMetric} onChange={(event) => onWorkOrderChange({ successMetric: event.target.value })} />
        </label>
        <label>
          <span>Current baseline</span>
          <textarea value={workOrder.currentBaseline} onChange={(event) => onWorkOrderChange({ currentBaseline: event.target.value })} />
        </label>
        <label>
          <span>Team size</span>
          <input type="number" min={1} max={200} value={buyerScenarioInput.teamSize} onChange={(event) => onBuyerScenarioChange({ teamSize: Number(event.target.value) })} />
        </label>
        <label>
          <span>Cycles / month</span>
          <input type="number" min={1} max={40} value={buyerScenarioInput.cyclesPerMonth} onChange={(event) => onBuyerScenarioChange({ cyclesPerMonth: Number(event.target.value) })} />
        </label>
        <label>
          <span>Manual hours / cycle</span>
          <input type="number" min={1} max={120} step={0.5} value={buyerScenarioInput.manualHoursPerCycle} onChange={(event) => onBuyerScenarioChange({ manualHoursPerCycle: Number(event.target.value) })} />
        </label>
        <label>
          <span>Data boundary</span>
          <select value={workOrder.dataSensitivity} onChange={(event) => onWorkOrderChange({ dataSensitivity: event.target.value as BuyerWorkOrderInput["dataSensitivity"] })}>
            <option value="public">Public-safe</option>
            <option value="internal">Internal</option>
            <option value="restricted">Restricted</option>
          </select>
        </label>
        <label>
          <span>Manual minutes</span>
          <input type="number" min={1} max={7200} value={pilotRun.observedManualMinutes} onChange={(event) => onPilotRunChange({ observedManualMinutes: Number(event.target.value) })} />
        </label>
        <label>
          <span>Assisted minutes</span>
          <input type="number" min={1} max={7200} value={pilotRun.observedAssistedMinutes} onChange={(event) => onPilotRunChange({ observedAssistedMinutes: Number(event.target.value) })} />
        </label>
        <label
          className={cx(
            "workflow-intake-evidence",
            !evidenceUrlProblem && "is-confirmed",
            evidenceUrl.trim() && evidenceUrlProblem && "is-risk"
          )}
        >
          <span>Evidence URL</span>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(event) => {
              onWorkOrderChange({ evidenceUrl: event.target.value });
              onPilotRunChange({ evidenceUrl: event.target.value });
            }}
            placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.pilotEvidenceUrl}
          />
          <small>{evidenceUrlLine}</small>
        </label>
      </div>

      <section className="workflow-intake-preview" aria-label="Generated workspace brief">
        <div>
          <span>Generated workspace brief</span>
          <strong>{buyerScenario.paybackDays} day payback / {buyerScenario.confidenceScore}/100 confidence</strong>
        </div>
        <pre>{generatedBrief}</pre>
      </section>
    </section>
  );
}
