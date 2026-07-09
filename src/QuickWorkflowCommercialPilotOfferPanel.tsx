import { Download, FileText, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { QuickWorkflowCommercialPilotOffer, QuickWorkflowInputReadiness, QuickWorkflowValueDiagnosis } from "./QuickWorkflowIntakePanel";
import QuickWorkflowBuyerExpansionPacketPanel from "./QuickWorkflowBuyerExpansionPacketPanel";
import QuickWorkflowPilotKickoffPackPanel from "./QuickWorkflowPilotKickoffPackPanel";
import QuickWorkflowPilotRunLogPanel from "./QuickWorkflowPilotRunLogPanel";
import QuickWorkflowValueAcceptanceContractPanel from "./QuickWorkflowValueAcceptanceContractPanel";
import { buildQuickWorkflowBuyerExpansionPacket } from "./quickWorkflowBuyerExpansionPacket";
import { buildQuickWorkflowCommercialResponseRecord } from "./quickWorkflowCommercialResponse";
import {
  defaultQuickWorkflowPilotDraftState,
  normalizeQuickWorkflowPilotDraftState,
  parseQuickWorkflowPilotDraft,
  quickWorkflowPilotDraftCompletion,
  quickWorkflowPilotDraftHasContent,
  quickWorkflowPilotDraftStorageKey,
  serializeQuickWorkflowPilotDraft,
  type QuickWorkflowPilotDraftState
} from "./quickWorkflowPilotDraft";
import type { QuickWorkflowPilotDecisionBrief } from "./quickWorkflowPilotDecisionBrief";
import type { QuickWorkflowPilotExpansionGuardrail } from "./quickWorkflowPilotExpansionGuardrail";
import { buildQuickWorkflowPilotKickoffPack } from "./quickWorkflowPilotKickoffPack";
import type { QuickWorkflowPilotRunLog } from "./quickWorkflowPilotRunLog";
import { buildQuickWorkflowValueAcceptanceContract } from "./quickWorkflowValueAcceptanceContract";
import type { WorkflowIntakeDraft } from "./workflowIntakeDraft";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type PilotDraftStorageStatus = "idle" | "restored" | "saved" | "failed";

function readStoredPilotDraftState(storageKey: string) {
  if (typeof window === "undefined") return null;
  try {
    return parseQuickWorkflowPilotDraft(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

type QuickWorkflowCommercialPilotOfferPanelProps = {
  commercialPilotOffer: QuickWorkflowCommercialPilotOffer;
  draft: WorkflowIntakeDraft;
  readiness: QuickWorkflowInputReadiness;
  valueDiagnosis: QuickWorkflowValueDiagnosis;
};

export default function QuickWorkflowCommercialPilotOfferPanel({ commercialPilotOffer, draft, readiness, valueDiagnosis }: QuickWorkflowCommercialPilotOfferPanelProps) {
  const pilotDraftStorageKey = useMemo(
    () =>
      quickWorkflowPilotDraftStorageKey({
        buyer: draft.workOrder.targetUser ?? "",
        workflow: draft.workOrder.request ?? ""
      }),
    [draft.workOrder.request, draft.workOrder.targetUser]
  );
  const restoredPilotDraft = useMemo(() => readStoredPilotDraftState(pilotDraftStorageKey), [pilotDraftStorageKey]);
  const [pilotDraftBundle, setPilotDraftBundle] = useState(() => ({
    storageKey: pilotDraftStorageKey,
    state: restoredPilotDraft ?? defaultQuickWorkflowPilotDraftState()
  }));
  const [pilotDraftStorageStatus, setPilotDraftStorageStatus] = useState<PilotDraftStorageStatus>(restoredPilotDraft ? "restored" : "idle");
  const [pilotRunLog, setPilotRunLog] = useState<QuickWorkflowPilotRunLog | null>(null);
  const [pilotDecisionBrief, setPilotDecisionBrief] = useState<QuickWorkflowPilotDecisionBrief | null>(null);
  const [pilotExpansionGuardrail, setPilotExpansionGuardrail] = useState<QuickWorkflowPilotExpansionGuardrail | null>(null);
  const pilotDraftState = pilotDraftBundle.state;
  const pilotDraftCompletion = useMemo(() => quickWorkflowPilotDraftCompletion(pilotDraftState), [pilotDraftState]);

  useEffect(() => {
    setPilotDraftBundle({
      storageKey: pilotDraftStorageKey,
      state: restoredPilotDraft ?? defaultQuickWorkflowPilotDraftState()
    });
    setPilotDraftStorageStatus(restoredPilotDraft ? "restored" : "idle");
  }, [pilotDraftStorageKey, restoredPilotDraft]);

  useEffect(() => {
    if (pilotDraftBundle.storageKey !== pilotDraftStorageKey || typeof window === "undefined") return;
    try {
      if (quickWorkflowPilotDraftHasContent(pilotDraftState)) {
        window.localStorage.setItem(pilotDraftStorageKey, serializeQuickWorkflowPilotDraft(pilotDraftState));
        setPilotDraftStorageStatus("saved");
      } else {
        window.localStorage.removeItem(pilotDraftStorageKey);
        setPilotDraftStorageStatus("idle");
      }
    } catch {
      setPilotDraftStorageStatus("failed");
    }
  }, [pilotDraftBundle.storageKey, pilotDraftState, pilotDraftStorageKey]);

  function updatePilotDraftState(patch: Partial<QuickWorkflowPilotDraftState>) {
    setPilotDraftBundle((current) => ({
      ...current,
      state: normalizeQuickWorkflowPilotDraftState({
        ...current.state,
        ...patch,
        expansion: patch.expansion ?? current.state.expansion
      })
    }));
  }

  function clearPilotDraftState() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(pilotDraftStorageKey);
      } catch {
        setPilotDraftStorageStatus("failed");
      }
    }
    setPilotDraftBundle({ storageKey: pilotDraftStorageKey, state: defaultQuickWorkflowPilotDraftState() });
  }

  const pilotDraftStatusDetail =
    pilotDraftStorageStatus === "failed"
      ? "Browser storage is unavailable; exports still work."
      : pilotDraftStorageStatus === "restored"
        ? "Restored from this browser."
        : pilotDraftStorageStatus === "saved"
          ? pilotDraftCompletion.detail
          : "No saved pilot packet fields for this workflow yet.";
  const responseRecord = useMemo(
    () => buildQuickWorkflowCommercialResponseRecord(commercialPilotOffer, pilotDraftState.buyerResponseText),
    [commercialPilotOffer, pilotDraftState.buyerResponseText]
  );
  const valueAcceptanceContract = useMemo(
    () =>
      buildQuickWorkflowValueAcceptanceContract({
        draft,
        readiness,
        valueDiagnosis,
        commercialPilotOffer
      }),
    [draft, readiness, valueDiagnosis, commercialPilotOffer]
  );
  const kickoffPack = useMemo(
    () =>
      buildQuickWorkflowPilotKickoffPack({
        contract: valueAcceptanceContract,
        responseRecord,
        kickoffStartDate: pilotDraftState.kickoffStartDate
      }),
    [valueAcceptanceContract, responseRecord, pilotDraftState.kickoffStartDate]
  );
  const buyerExpansionPacket = useMemo(
    () =>
      buildQuickWorkflowBuyerExpansionPacket({
        commercialPilotOffer,
        contract: valueAcceptanceContract,
        kickoffPack,
        runLog: pilotRunLog,
        decisionBrief: pilotDecisionBrief,
        expansionGuardrail: pilotExpansionGuardrail
      }),
    [commercialPilotOffer, kickoffPack, pilotDecisionBrief, pilotExpansionGuardrail, pilotRunLog, valueAcceptanceContract]
  );

  return (
    <div className={cx("quick-workflow-commercial-offer", commercialPilotOffer.status)} aria-label="Commercial pilot offer">
      <div className="quick-workflow-commercial-offer-main">
        <span>
          <FileText size={13} />
          Commercial pilot offer
        </span>
        <strong>{commercialPilotOffer.headline}</strong>
        <p>{commercialPilotOffer.summary}</p>
        <a href={commercialPilotOffer.exportHref} download="quick-workflow-commercial-pilot-offer.md">
          <Download size={14} />
          Export offer
        </a>
      </div>
      <div className="quick-workflow-commercial-offer-price">
        <span>{commercialPilotOffer.decision}</span>
        <strong>{commercialPilotOffer.priceLine}</strong>
        <small>{commercialPilotOffer.guardrail}</small>
      </div>
      <details className="quick-workflow-detail-disclosure">
        <summary>
          <strong>商談条件・承認・パイロット運用の詳細</strong>
          <small>条件、承認メモ、決定/拡張パケット、価値契約、買い手応答、キックオフ、実行ログ、ストレス/反論ケース</small>
        </summary>
        <div>
      <div className="quick-workflow-commercial-offer-terms" aria-label="Commercial pilot offer terms">
        {commercialPilotOffer.terms.map((term) => (
          <article key={term.id} className={term.status}>
            <span>{term.label}</span>
            <strong>{term.value}</strong>
            <small>{term.detail}</small>
          </article>
        ))}
      </div>
      <div className={cx("quick-workflow-commercial-approval", commercialPilotOffer.approvalMemo.status)} aria-label="Commercial pilot approval memo">
        <div>
          <span>Approval memo</span>
          <strong>{commercialPilotOffer.approvalMemo.decision}</strong>
          <small>{commercialPilotOffer.approvalMemo.summary}</small>
        </div>
        <div>
          <span>Approval score</span>
          <strong>{commercialPilotOffer.approvalMemo.score}/100</strong>
          <small>{commercialPilotOffer.approvalMemo.sendLine}</small>
        </div>
        <ul>
          {commercialPilotOffer.approvalMemo.redlines.map((redline) => (
            <li key={redline}>{redline}</li>
          ))}
        </ul>
      </div>
      <div className={cx("quick-workflow-commercial-decision-packet", commercialPilotOffer.decisionPacket.status)} aria-label="Commercial pilot decision packet">
        <div className="quick-workflow-commercial-decision-head">
          <div>
            <span>Decision packet</span>
            <strong>{commercialPilotOffer.decisionPacket.headline}</strong>
            <small>{commercialPilotOffer.decisionPacket.sendRule}</small>
          </div>
          <a href={commercialPilotOffer.decisionPacket.exportHref} download="quick-workflow-buyer-decision-packet.md">
            <Download size={14} />
            Export packet
          </a>
        </div>
        <div className="quick-workflow-commercial-decision-copy">
          <span>{commercialPilotOffer.decisionPacket.mode}</span>
          <strong>{commercialPilotOffer.decisionPacket.subject}</strong>
          <small>{commercialPilotOffer.decisionPacket.decisionAsk}</small>
        </div>
        <div className="quick-workflow-commercial-decision-attachments" aria-label="Commercial pilot decision packet attachments">
          {commercialPilotOffer.decisionPacket.attachments.map((attachment) => (
            <article key={attachment.id} className={attachment.status}>
              <span>{attachment.label}</span>
              <strong>{attachment.value}</strong>
              <small>{attachment.action}</small>
            </article>
          ))}
        </div>
      </div>
      <QuickWorkflowBuyerExpansionPacketPanel packet={buyerExpansionPacket} />
      <div className={cx("quick-workflow-pilot-draft-strip", pilotDraftStorageStatus === "failed" && "is-risk")} aria-label="Pilot packet browser draft">
        <div>
          <span>
            <Save size={13} />
            Pilot packet draft
          </span>
          <strong>{pilotDraftCompletion.label}</strong>
          <small>{pilotDraftStatusDetail}</small>
        </div>
        <button type="button" onClick={clearPilotDraftState} disabled={!quickWorkflowPilotDraftHasContent(pilotDraftState)}>
          <Trash2 size={14} />
          Clear draft
        </button>
      </div>
      <QuickWorkflowValueAcceptanceContractPanel
        draft={draft}
        readiness={readiness}
        valueDiagnosis={valueDiagnosis}
        commercialPilotOffer={commercialPilotOffer}
        contract={valueAcceptanceContract}
      />
      <div className={cx("quick-workflow-commercial-response", responseRecord.status)} aria-label="Commercial pilot buyer response recorder">
        <div className="quick-workflow-commercial-response-head">
          <div>
            <span>Buyer response recorder</span>
            <strong>{responseRecord.headline}</strong>
            <small>{responseRecord.summary}</small>
          </div>
          <a href={responseRecord.exportHref} download="quick-workflow-commercial-response-record.md">
            <Download size={14} />
            Export response
          </a>
        </div>
        <label>
          <span>Paste buyer reply</span>
          <textarea
            value={pilotDraftState.buyerResponseText}
            onChange={(event) => updatePilotDraftState({ buyerResponseText: event.currentTarget.value })}
            placeholder="Example: Approved for the 14-day pilot. Please attach the live proof receipt before kickoff and send the pilot calendar invite."
            rows={4}
          />
        </label>
        <div className="quick-workflow-commercial-response-verdict">
          <span>{responseRecord.decision}</span>
          <strong>{responseRecord.nextAction}</strong>
          <small>{responseRecord.meetingUpdate}</small>
        </div>
        <div className="quick-workflow-commercial-response-followups" aria-label="Commercial pilot buyer response follow-ups">
          {responseRecord.followUps.map((followUp) => (
            <article key={followUp.id} className={followUp.status}>
              <span>{followUp.label}</span>
              <strong>{followUp.action}</strong>
              <small>
                {followUp.owner} / {followUp.evidence}
              </small>
            </article>
          ))}
        </div>
      </div>
      <QuickWorkflowPilotKickoffPackPanel
        contract={valueAcceptanceContract}
        responseRecord={responseRecord}
        kickoffStartDate={pilotDraftState.kickoffStartDate}
        onKickoffStartDateChange={(kickoffStartDate) => updatePilotDraftState({ kickoffStartDate })}
        pack={kickoffPack}
      />
      <QuickWorkflowPilotRunLogPanel
        pack={kickoffPack}
        contract={valueAcceptanceContract}
        evidenceText={pilotDraftState.runEvidenceText}
        onEvidenceTextChange={(runEvidenceText) => updatePilotDraftState({ runEvidenceText })}
        expansionDraft={pilotDraftState.expansion}
        onExpansionDraftChange={(expansion) => updatePilotDraftState({ expansion })}
        onLogChange={setPilotRunLog}
        onDecisionBriefChange={setPilotDecisionBrief}
        onExpansionGuardrailChange={setPilotExpansionGuardrail}
      />
      <div className="quick-workflow-commercial-stress" aria-label="Commercial pilot stress cases">
        <span>Stress cases</span>
        {commercialPilotOffer.stressCases.map((stressCase) => (
          <article key={stressCase.id} className={stressCase.status}>
            <b>{stressCase.label}</b>
            <strong>{stressCase.value}</strong>
            <small>{stressCase.detail}</small>
            <em>{stressCase.buyerDecision}</em>
          </article>
        ))}
      </div>
      <div className="quick-workflow-commercial-objections" aria-label="Commercial pilot buyer objections">
        <span>Buyer objections</span>
        {commercialPilotOffer.objections.map((objection) => (
          <article key={objection.id} className={objection.status}>
            <b>{objection.question}</b>
            <strong>{objection.answer}</strong>
            <small>{objection.evidence}</small>
          </article>
        ))}
      </div>
        </div>
      </details>
    </div>
  );
}
