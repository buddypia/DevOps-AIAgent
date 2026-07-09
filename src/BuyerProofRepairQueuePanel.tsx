import { AlertTriangle, BadgeCheck, Crosshair, Download, ExternalLink, FileText, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import {
  buildBuyerProofRepairQueue,
  buildBuyerProofRepairProjection,
  hasBuyerProofRepairPatch,
  mergeBuyerProofRepairPatches,
  type BuyerProofRepairPatch,
  type BuyerProofRepairProofKey,
  type BuyerProofRepairQueueItem,
  type BuyerProofRepairStatus
} from "./buyerProofRepairQueue";
import type { BuyerValueScenarioInput } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import type { WorkspaceDraft } from "./workspaceDraft";
import "./BuyerProofRepairQueuePanel.css";

type ProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

type BuyerProofRepairQueuePanelProps = {
  workspace: WorkspaceDraft;
  proofSampleWorkspace: WorkspaceDraft;
  proofVerifyStatus: ProofVerifyStatus;
  onBuyerScenarioChange: (patch: Partial<BuyerValueScenarioInput>) => void;
  onBuyerWorkOrderChange: (patch: Partial<BuyerWorkOrderInput>) => void;
  onMeasuredRunChange: (patch: Partial<PilotRunReceiptInput>) => void;
  onProofIntakeChange: (patch: Partial<Record<BuyerProofRepairProofKey, string>>) => void;
  onApplyProofReplacement: (patch: Partial<Record<BuyerProofRepairProofKey, string>>) => void | Promise<void>;
  onAttachTrialEvidence: (record: AgentTrialEvidenceRecord) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: BuyerProofRepairStatus) {
  if (status === "ready") return <BadgeCheck size={16} />;
  if (status === "attention") return <AlertTriangle size={16} />;
  return <Crosshair size={16} />;
}

function proofKeyForWorkOrder(id: BuyerProofRepairQueueItem["id"]): BuyerProofRepairProofKey | null {
  if (id === "public-product") return "targetUrl";
  if (id === "work-order") return "workOrderEvidenceUrl";
  if (id === "measured-run") return "pilotEvidenceUrl";
  if (id === "walkthrough") return "videoUrl";
  if (id === "protopedia") return "protopediaUrl";
  return null;
}

function proofInputLabelFor(key: BuyerProofRepairProofKey) {
  if (key === "targetUrl") return "Live product URL";
  if (key === "workOrderEvidenceUrl") return "Work-order proof URL";
  if (key === "pilotEvidenceUrl") return "Pilot receipt URL";
  if (key === "videoUrl") return "Walkthrough URL";
  return "ProtoPedia URL";
}

export default function BuyerProofRepairQueuePanel({
  workspace,
  proofSampleWorkspace,
  proofVerifyStatus,
  onBuyerScenarioChange,
  onBuyerWorkOrderChange,
  onMeasuredRunChange,
  onProofIntakeChange,
  onApplyProofReplacement,
  onAttachTrialEvidence
}: BuyerProofRepairQueuePanelProps) {
  const [appliedRepairId, setAppliedRepairId] = useState("");
  const [proofReplacementDrafts, setProofReplacementDrafts] = useState<Partial<Record<BuyerProofRepairProofKey, string>>>({});
  const repairQueue = useMemo(() => buildBuyerProofRepairQueue({ current: workspace, sample: proofSampleWorkspace }), [proofSampleWorkspace, workspace]);
  const repairProjection = useMemo(
    () => buildBuyerProofRepairProjection({ current: workspace, sample: proofSampleWorkspace, queue: repairQueue }),
    [proofSampleWorkspace, repairQueue, workspace]
  );
  const availablePatch = useMemo(() => mergeBuyerProofRepairPatches(repairQueue.items), [repairQueue.items]);
  const availablePatchCount = repairQueue.items.filter((item) => item.status !== "ready" && hasBuyerProofRepairPatch(item.patch)).length;

  useEffect(() => {
    if (!appliedRepairId) return;
    const timeout = window.setTimeout(() => setAppliedRepairId(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [appliedRepairId]);

  function applyPatch(patch: BuyerProofRepairPatch | undefined) {
    if (!hasBuyerProofRepairPatch(patch)) return false;
    if (patch.buyerScenario) onBuyerScenarioChange(patch.buyerScenario);
    if (patch.buyerWorkOrder) onBuyerWorkOrderChange(patch.buyerWorkOrder);
    if (patch.pilotRun) onMeasuredRunChange(patch.pilotRun);
    if (patch.proofIntake) onProofIntakeChange(patch.proofIntake);
    patch.agentTrialEvidence?.forEach((record) => onAttachTrialEvidence(record));
    return true;
  }

  function applyProofRepair(item: BuyerProofRepairQueueItem) {
    if (!applyPatch(item.patch)) return;
    setAppliedRepairId(item.id);
  }

  function applyAvailableRepairs() {
    if (!applyPatch(availablePatch)) return;
    setAppliedRepairId("all");
  }

  function currentProofValue(key: BuyerProofRepairProofKey) {
    if (key === "targetUrl") return workspace.targetUrl;
    if (key === "protopediaUrl") return workspace.protopediaUrl;
    if (key === "videoUrl") return workspace.videoUrl;
    if (key === "pilotEvidenceUrl") return workspace.pilotRun.evidenceUrl;
    return workspace.buyerWorkOrder.evidenceUrl;
  }

  async function applyProofReplacement(key: BuyerProofRepairProofKey) {
    const value = proofReplacementDrafts[key] ?? currentProofValue(key);
    if (!value.trim() || value === currentProofValue(key)) return;
    await onApplyProofReplacement({ [key]: value });
    setProofReplacementDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setAppliedRepairId(key);
  }

  return (
    <section className={cx("buyer-proof-repair-queue", repairQueue.status)} aria-label="Buyer proof repair queue">
      <div className="buyer-proof-repair-main">
        <span>Proof repair queue</span>
        <strong>{repairQueue.headline}</strong>
        <p>{repairQueue.summary}</p>
        <small>
          {repairQueue.readyCount}/{repairQueue.totalCount} closed, {repairQueue.openCount} open
          {repairQueue.referenceCount > 0 ? `, ${repairQueue.referenceCount} reference` : ""}
        </small>
        {repairQueue.highestImpactItem && (
          <div className="buyer-proof-repair-top-impact" aria-label="Highest impact proof repair">
            <span>Highest decision lift</span>
            <strong>+{repairQueue.highestImpactItem.decisionLift} {repairQueue.highestImpactItem.label}</strong>
            <p>{repairQueue.highestImpactItem.riskIfIgnored}</p>
          </div>
        )}
        <div className={cx("buyer-proof-repair-projection", repairProjection.status)} aria-label="Available repair projection">
          <span>After available fixes</span>
          <strong>{repairProjection.headline}</strong>
          <p>{repairProjection.summary}</p>
          <div className="buyer-proof-repair-projection-stats" aria-label="Projected proof repair outcome">
            <b>{`${repairProjection.currentBlockedCount} -> ${repairProjection.projectedBlockedCount}`}</b>
            <small>blockers</small>
            <b>{repairProjection.decisionLiftRecovered}</b>
            <small>lift recovered</small>
            <b>{repairProjection.projectedReferenceCount}</b>
            <small>reference left</small>
          </div>
          <div className={cx("buyer-proof-share-lock", repairProjection.publicShareLock.status)} aria-label="Public sharing lock">
            <div>
              <span>{repairProjection.publicShareLock.status === "ready" ? "Public sharing" : "No-send lock"}</span>
              <strong>{repairProjection.publicShareLock.headline}</strong>
              <p>{repairProjection.publicShareLock.summary}</p>
            </div>
            <b>{repairProjection.publicShareLock.buyerOwnedCount}/{repairProjection.publicShareLock.totalCount}</b>
            <em>{repairProjection.publicShareLock.instruction}</em>
            {repairProjection.publicShareLock.nextTask && (
              <small>
                Next: {repairProjection.publicShareLock.nextTask.label} / {repairProjection.publicShareLock.nextTask.replacementTarget}
              </small>
            )}
            {repairProjection.publicShareLock.blockingGates.length > 0 && (
              <ol className="buyer-proof-share-lock-gates" aria-label="Blocking proof gates">
                {repairProjection.publicShareLock.blockingGates.map((gate) => (
                  <li key={gate.id} className={gate.proofState}>
                    <span>{gate.proofState}</span>
                    <strong>{gate.label} / +{gate.decisionLiftAtStake}</strong>
                    <small>
                      {gate.reason} {gate.replacementTarget}
                    </small>
                    <a href={gate.inputHref}>
                      <ExternalLink size={12} />
                      {gate.inputLabel}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className={cx("buyer-proof-operator-brief", repairProjection.operatorBrief.status)} aria-label="Buyer proof operator brief">
            <div className="buyer-proof-operator-brief-head">
              <span>Operator brief</span>
              <strong>{repairProjection.operatorBrief.headline}</strong>
              <p>{repairProjection.operatorBrief.summary}</p>
            </div>
            <div className="buyer-proof-operator-brief-rule">
              <b>{repairProjection.operatorBrief.firstOwner}</b>
              <p>{repairProjection.operatorBrief.firstAction}</p>
              <em>{repairProjection.operatorBrief.shareRule}</em>
            </div>
            {repairProjection.operatorBrief.topTasks.length > 0 && (
              <ol className="buyer-proof-operator-brief-tasks" aria-label="Operator brief top tasks">
                {repairProjection.operatorBrief.topTasks.map((task) => (
                  <li key={task.id} className={task.priority}>
                    <span>{task.priority}</span>
                    <strong>{task.label}</strong>
                    <small>
                      {task.owner} / +{task.decisionLiftAtStake}
                    </small>
                  </li>
                ))}
              </ol>
            )}
            <code>{repairProjection.operatorBrief.message}</code>
            <div className="buyer-proof-operator-brief-actions">
              <a href={repairProjection.operatorBrief.firstInputHref}>
                <ExternalLink size={13} />
                {repairProjection.operatorBrief.firstInputLabel}
              </a>
              <a href={repairProjection.operatorBrief.href} download={repairProjection.operatorBrief.filename}>
                <FileText size={13} />
                Export operator brief
              </a>
            </div>
          </div>
          <em>{repairProjection.shareInstruction}</em>
          {repairProjection.workOrderPacket.workOrders.length > 0 && (
            <div className="buyer-proof-repair-projection-actions" aria-label="Replacement handoff exports">
              <a href={repairProjection.workOrderPacket.href} download={repairProjection.workOrderPacket.filename}>
                <FileText size={14} />
                Export work orders
              </a>
              <a href={repairProjection.workOrderPacket.csvHref} download={repairProjection.workOrderPacket.csvFilename}>
                <Download size={14} />
                Export CSV
              </a>
            </div>
          )}
          {repairProjection.workOrderPacket.workOrders.length > 0 && (
            <div className="buyer-proof-repair-execution" aria-label="Buyer-owned proof execution queue">
              <div className="buyer-proof-repair-execution-head">
                <span>Execution queue</span>
                <strong>{repairProjection.workOrderPacket.nowCount} now / {repairProjection.workOrderPacket.nextCount} next</strong>
              </div>
              <ol>
                {repairProjection.workOrderPacket.workOrders.slice(0, 4).map((order) => {
                  const proofKey = proofKeyForWorkOrder(order.id);
                  const currentValue = proofKey ? currentProofValue(proofKey) : "";
                  const draftValue = proofKey ? (proofReplacementDrafts[proofKey] ?? currentValue) : "";
                  const canApplyReplacement = Boolean(proofKey && draftValue.trim() && draftValue !== currentValue && proofVerifyStatus !== "checking");
                  const applied = proofKey ? appliedRepairId === proofKey : false;
                  return (
                    <li key={order.id} className={cx(order.priority, order.proofState)}>
                      <div>
                        <span>{order.priority}</span>
                        <strong>{order.label}</strong>
                        <small>{order.owner} / +{order.decisionLiftAtStake}</small>
                      </div>
                      <b>{order.proofState}</b>
                      <p>{order.proofSlot}</p>
                      <em>{order.shareGate}</em>
                      {proofKey ? (
                        <label className="buyer-proof-repair-inline-input">
                          <span>{proofInputLabelFor(proofKey)}</span>
                          <input
                            type="url"
                            value={draftValue}
                            placeholder={order.target.replace(/^Paste /, "")}
                            aria-label={`${proofInputLabelFor(proofKey)} replacement`}
                            onChange={(event) => setProofReplacementDrafts((current) => ({ ...current, [proofKey]: event.target.value }))}
                          />
                          <button type="button" disabled={!canApplyReplacement} onClick={() => applyProofReplacement(proofKey)}>
                            {applied ? <BadgeCheck size={13} /> : <Crosshair size={13} />}
                            {proofVerifyStatus === "checking" ? "Checking" : applied ? "Applied" : "Apply & verify"}
                          </button>
                        </label>
                      ) : (
                        <a href={order.inputHref}>
                          <ExternalLink size={13} />
                          {order.inputLabel}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {repairProjection.requiredReplacements.length > 0 && (
            <div className="buyer-proof-repair-replacements" aria-label="Remaining buyer-owned replacements">
              <span>Replace next</span>
              {repairProjection.requiredReplacements.slice(0, 3).map((item) => (
                <article key={item.id} className={item.afterStatus}>
                  <strong>{item.label}</strong>
                  <b>{item.replacementTarget}</b>
                  <p>{item.actionAfterApply}</p>
                  <small>{item.remainingRisk}</small>
                  <small>{item.acceptanceCriteria}</small>
                </article>
              ))}
            </div>
          )}
        </div>
        <button type="button" disabled={availablePatchCount === 0} onClick={applyAvailableRepairs}>
          {appliedRepairId === "all" ? <BadgeCheck size={14} /> : <Wand2 size={14} />}
          {appliedRepairId === "all" ? "Applied available fixes" : `Apply ${availablePatchCount} available fix${availablePatchCount === 1 ? "" : "es"}`}
        </button>
      </div>
      <div className="buyer-proof-repair-items">
        {repairQueue.items.map((item) => {
          const applied = appliedRepairId === item.id;
          return (
            <article key={item.id} className={cx(item.status, item.ownership === "reference" && "reference-proof")}>
              <div>
                <span>
                  {statusIcon(item.status)}
                  {item.ownership === "reference" ? "reference" : item.priority}
                </span>
                <strong>{item.label}</strong>
              </div>
              <p>{item.problem}</p>
              <div className="buyer-proof-repair-impact">
                <b>+{item.decisionLift}</b>
                <span>{item.buyerGate}</span>
              </div>
              <small>{item.valueAtStake}</small>
              <small>{item.ownership === "reference" ? item.riskIfIgnored : item.impact}</small>
              <button type="button" disabled={!item.patch || item.status === "ready"} onClick={() => applyProofRepair(item)}>
                {applied ? <BadgeCheck size={14} /> : item.status === "ready" ? <BadgeCheck size={14} /> : <Crosshair size={14} />}
                {applied ? "Applied" : item.buttonLabel}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
