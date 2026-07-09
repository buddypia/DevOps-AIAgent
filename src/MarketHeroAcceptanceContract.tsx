import { ClipboardCheck, Download, ExternalLink, Scale, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildBuyerPilotAcceptanceContract, type BuyerPilotAcceptanceContract, type BuyerPilotAcceptanceGate } from "./buyerPilotAcceptanceContract";
import type { BuyerShareGateProofLink, BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import type { BuyerValueScenario } from "./buyerValueScenario";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder";
import { downloadTextFile } from "./downloadArtifact";
import type { PilotRunReceiptInput } from "./pilotRunReceipt";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

type ProofRepairField = {
  key: string;
  label: string;
  placeholder: string;
  href: string;
};

function decisionLabel(decision: BuyerPilotAcceptanceContract["decision"]) {
  if (decision === "ready-to-send") return "Ready to send";
  if (decision === "redline-first") return "Redline first";
  return "Hold";
}

function visibleGates(contract: BuyerPilotAcceptanceContract): BuyerPilotAcceptanceGate[] {
  const open = contract.gates.filter((gate) => gate.status !== "clear");
  return (open.length > 0 ? open : contract.gates).slice(0, 3);
}

export default function MarketHeroAcceptanceContract({
  workOrder,
  buyerScenario,
  pilotRun,
  proofLinks,
  proofVerification,
  workflowIntakeHref,
  valueReportHref,
  measuredRunHref,
  proofRoomHref,
  launchRoomHref,
  proofFields,
  proofIntake,
  proofRepairDraft,
  proofVerifyStatus,
  onProofRepairDraftChange,
  onApplyProofRepairDraft,
  onVerifyProofLinks,
  onCopyText
}: {
  workOrder: BuyerWorkOrderInput;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  proofLinks: BuyerShareGateProofLink[];
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  workflowIntakeHref: string;
  valueReportHref: string;
  measuredRunHref: string;
  proofRoomHref: string;
  launchRoomHref: string;
  proofFields?: ProofRepairField[];
  proofIntake?: Record<string, string>;
  proofRepairDraft?: Partial<Record<string, string>>;
  proofVerifyStatus?: ProofVerifyStatus;
  onProofRepairDraftChange?: (key: string, value: string) => void;
  onApplyProofRepairDraft?: (key: string) => void | Promise<void>;
  onVerifyProofLinks?: () => void | Promise<void>;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [repairCopyStatus, setRepairCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const contract = useMemo(
    () =>
      buildBuyerPilotAcceptanceContract({
        workOrder,
        buyerScenario,
        pilotRun,
        proofLinks,
        proofVerification,
        workflowIntakeHref,
        valueReportHref,
        measuredRunHref,
        proofRoomHref,
        launchRoomHref
      }),
    [buyerScenario, launchRoomHref, measuredRunHref, pilotRun, proofLinks, proofRoomHref, proofVerification, valueReportHref, workOrder, workflowIntakeHref]
  );
  const gates = useMemo(() => visibleGates(contract), [contract]);
  const repairCommand = contract.repairCommands[0];
  const proofTarget = repairCommand?.target?.type === "proof-link" ? repairCommand.target : undefined;
  const proofField = proofTarget ? proofFields?.find((field) => field.key === proofTarget.fieldId) : undefined;
  const proofCurrentValue = proofTarget ? (proofIntake?.[proofTarget.fieldId] ?? proofTarget.currentValue) : "";
  const proofRepairValue = proofTarget ? (proofRepairDraft?.[proofTarget.fieldId] ?? proofCurrentValue) : "";
  const proofRepairCanApply =
    Boolean(proofTarget && onProofRepairDraftChange && onApplyProofRepairDraft) && proofRepairValue.trim().length > 0 && proofRepairValue !== proofCurrentValue && proofVerifyStatus !== "checking";
  const canVerifyPublicProof = Boolean(repairCommand?.gateId === "public-proof" && !proofTarget && onVerifyProofLinks);
  const copyLabel = copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy terms";
  const repairCopyLabel = repairCopyStatus === "copied" ? "Copied" : repairCopyStatus === "failed" ? "Copy failed" : "Copy repair";

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (repairCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setRepairCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [repairCopyStatus]);

  async function copyContract() {
    const copied = await onCopyText(contract.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function copyRepairPacket() {
    const copied = await onCopyText(contract.repairPacketText);
    setRepairCopyStatus(copied ? "copied" : "failed");
  }

  async function applyProofRepair() {
    if (!proofTarget || !onApplyProofRepairDraft) return;
    await onApplyProofRepairDraft(proofTarget.fieldId);
  }

  async function verifyPublicProof() {
    if (!onVerifyProofLinks) return;
    await onVerifyProofLinks();
  }

  return (
    <section className={cx("market-hero-acceptance-contract", `is-${contract.status}`)} aria-label="Buyer pilot acceptance contract">
      <div className="market-hero-acceptance-main">
        <span>Acceptance contract</span>
        <strong>{contract.headline}</strong>
        <p>{contract.hardTruth}</p>
      </div>
      <aside className="market-hero-acceptance-score" aria-label="Acceptance contract score">
        <span>{decisionLabel(contract.decision)}</span>
        <strong>{contract.score}</strong>
        <small>
          {contract.openGateCount} blocked / {contract.watchGateCount} redline
        </small>
      </aside>
      <div className="market-hero-acceptance-actions" aria-label="Acceptance contract actions">
        <a className="market-hero-acceptance-primary" href={contract.primaryAction.href}>
          <Scale size={14} />
          {contract.primaryAction.label}
        </a>
        <button type="button" className={cx(copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} onClick={copyContract}>
          <ClipboardCheck size={14} />
          {copyLabel}
        </button>
        <button
          type="button"
          data-download-filename="buyer-pilot-acceptance-contract.md"
          onClick={() => downloadTextFile("buyer-pilot-acceptance-contract.md", contract.exportMarkdown)}
        >
          <Download size={14} />
          Export
        </button>
      </div>
      {repairCommand ? (
        <div className="market-hero-acceptance-repair" aria-label="Next repair packet">
          <div>
            <span>Next repair</span>
            <strong>{repairCommand.label}</strong>
            <p>{repairCommand.command}</p>
            <small>
              {repairCommand.owner} / {repairCommand.acceptance}
            </small>
          </div>
          <div className="market-hero-acceptance-repair-actions">
            <a href={repairCommand.href}>
              <Wrench size={14} />
              Open
            </a>
            <button
              type="button"
              className={cx(repairCopyStatus === "copied" && "is-confirmed", repairCopyStatus === "failed" && "is-risk")}
              onClick={copyRepairPacket}
            >
              <ClipboardCheck size={14} />
              {repairCopyLabel}
            </button>
            <button
              type="button"
              data-download-filename="buyer-pilot-acceptance-repair.md"
              onClick={() => downloadTextFile("buyer-pilot-acceptance-repair.md", contract.repairPacketText)}
            >
              <Download size={14} />
              Export repair
            </button>
          </div>
          {proofTarget && onProofRepairDraftChange && onApplyProofRepairDraft ? (
            <label className="market-hero-acceptance-repair-target">
              <span>Paste proof URL</span>
              <strong>{proofTarget.label}</strong>
              <input
                value={proofRepairValue}
                onChange={(event) => onProofRepairDraftChange(proofTarget.fieldId, event.target.value)}
                placeholder={proofField?.placeholder ?? PUBLIC_PROOF_INPUT_PLACEHOLDERS.genericProofUrl}
                aria-label={`Replacement URL for ${proofTarget.label}`}
              />
              <button type="button" onClick={applyProofRepair} disabled={!proofRepairCanApply}>
                {proofVerifyStatus === "checking" ? "Checking" : "Apply & verify"}
              </button>
            </label>
          ) : canVerifyPublicProof ? (
            <div className="market-hero-acceptance-repair-target is-verify-only">
              <span>Live verification</span>
              <strong>All proof URLs are attached</strong>
              <button type="button" onClick={verifyPublicProof} disabled={proofVerifyStatus === "checking"}>
                {proofVerifyStatus === "checking" ? "Checking" : "Verify now"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="market-hero-acceptance-gates" aria-label="Acceptance contract gates">
        {gates.map((gate) => (
          <a key={gate.id} className={gate.status} href={gate.href}>
            <span>
              {gate.status} / {gate.label}
            </span>
            <strong>{gate.value}</strong>
            <small>{gate.status === "clear" ? gate.acceptance : gate.fix}</small>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
