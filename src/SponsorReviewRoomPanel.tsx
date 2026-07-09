import { ClipboardList, Download, ExternalLink, FileCheck2, HelpCircle, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { encodeAgentTrialEvidenceParam } from "./agentTrialEvidence";
import { buildBuyerDecisionMatrix } from "./buyerDecisionMatrix";
import { buildBuyerDiligenceRoom } from "./buyerDiligence";
import { buildBuyerProofPacket } from "./buyerProofPacket";
import type { BuyerValueScenario } from "./buyerValueScenario";
import { encodeCustomAgentsParam } from "./customAgent";
import { buildPilotAgreement } from "./pilotAgreement";
import { buildPilotEvidenceLedger } from "./pilotEvidenceLedger";
import { buildPilotExecutionHandoff } from "./pilotExecution";
import { buildPilotProposal } from "./pilotProposal";
import { buildPilotRunReceipt, type PilotRunReceiptInput } from "./pilotRunReceipt";
import { buildPilotWorkflowPlan } from "./pilotWorkflow";
import { buildSponsorDecisionReceipt, buildSponsorReviewRoom, recommendedSponsorDecision, type SponsorDecisionChoice } from "./sponsorReviewRoom";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type SponsorReviewRoomPanelProps = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  customAgents?: MarketAgent[];
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function readinessTone(readiness: string) {
  if (readiness === "approve-review") return "low";
  if (readiness === "close-evidence") return "medium";
  return "high";
}

function receiptTone(status: string) {
  if (status === "signed") return "low";
  if (status === "stopped") return "high";
  return "medium";
}

function decisionLabel(decision: SponsorDecisionChoice) {
  if (decision === "continue") return "Continue";
  if (decision === "revise") return "Revise";
  return "Stop";
}

export default function SponsorReviewRoomPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  workspace,
  customAgents = []
}: SponsorReviewRoomPanelProps) {
  const proposal = useMemo(() => buildPilotProposal({ recommendation, valueBlueprint, buyerScenario, workspace }), [buyerScenario, recommendation, valueBlueprint, workspace]);
  const workflow = useMemo(() => buildPilotWorkflowPlan({ recommendation, valueBlueprint, buyerScenario }), [buyerScenario, recommendation, valueBlueprint]);
  const receipt = useMemo(
    () => buildPilotRunReceipt({ recommendation, valueBlueprint, buyerScenario, workflow, pilotRun }),
    [buyerScenario, pilotRun, recommendation, valueBlueprint, workflow]
  );
  const matrix = useMemo(
    () => buildBuyerDecisionMatrix({ recommendation, valueBlueprint, buyerScenario, pilotReceipt: receipt }),
    [buyerScenario, receipt, recommendation, valueBlueprint]
  );
  const agreement = useMemo(
    () => buildPilotAgreement({ recommendation, valueBlueprint, buyerScenario, proposal, workflow, decisionMatrix: matrix, pilotReceipt: receipt }),
    [buyerScenario, matrix, proposal, receipt, recommendation, valueBlueprint, workflow]
  );
  const execution = useMemo(() => buildPilotExecutionHandoff({ proposal, recommendation }), [proposal, recommendation]);
  const diligence = useMemo(
    () =>
      buildBuyerDiligenceRoom({
        proposal,
        handoff: execution,
        buyerScenario,
        valueBlueprint,
        recommendation
      }),
    [buyerScenario, execution, proposal, recommendation, valueBlueprint]
  );
  const ledger = useMemo(
    () =>
      buildPilotEvidenceLedger({
        recommendation,
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        execution
      }),
    [agreement, buyerScenario, execution, matrix, proposal, receipt, recommendation, valueBlueprint, workflow]
  );
  const room = useMemo(
    () =>
      buildSponsorReviewRoom({
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        ledger,
        diligence,
        execution
      }),
    [agreement, buyerScenario, diligence, execution, ledger, matrix, proposal, receipt, valueBlueprint, workflow]
  );
  const proofPacket = useMemo(
    () =>
      buildBuyerProofPacket({
        recommendation,
        valueBlueprint,
        buyerScenario,
        proposal,
        workflow,
        pilotReceipt: receipt,
        decisionMatrix: matrix,
        agreement,
        ledger,
        diligence,
        execution,
        sponsorReview: room
      }),
    [agreement, buyerScenario, diligence, execution, ledger, matrix, proposal, receipt, recommendation, room, valueBlueprint, workflow]
  );
  const recommendedDecision = recommendedSponsorDecision(room);
  const [decision, setDecision] = useState<SponsorDecisionChoice>(recommendedDecision);
  const [signerName, setSignerName] = useState(room.nextQuestion.owner);
  const [decisionDate, setDecisionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sponsorNote, setSponsorNote] = useState(room.decisionAsk);
  const [conditionNote, setConditionNote] = useState("");

  useEffect(() => {
    setDecision(recommendedDecision);
    setSignerName(room.nextQuestion.owner);
    setSponsorNote(room.decisionAsk);
    setConditionNote("");
  }, [recommendedDecision, room.decisionAsk, room.id, room.nextQuestion.owner]);

  const decisionReceipt = useMemo(
    () =>
      buildSponsorDecisionReceipt(room, {
        decision,
        signerName,
        sponsorNote,
        conditionNote,
        decidedAt: decisionDate
      }),
    [conditionNote, decision, decisionDate, room, signerName, sponsorNote]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(room.exportMarkdown)}`;
  const receiptHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(decisionReceipt.exportMarkdown)}`;
  const reviewSearchParams = useMemo(() => {
    const params = new URLSearchParams({
      brief: projectBrief.slice(0, 4000),
      agents: recommendation.selected.map((agent) => agent.id).join(","),
      teamSize: String(buyerScenario.assumptions.teamSize),
      hourlyCostYen: String(buyerScenario.assumptions.hourlyCostYen),
      cyclesPerMonth: String(buyerScenario.assumptions.cyclesPerMonth),
      manualHoursPerCycle: String(buyerScenario.assumptions.manualHoursPerCycle),
      adoptionRatePercent: String(buyerScenario.assumptions.adoptionRatePercent),
      incidentRiskYenPerMonth: String(buyerScenario.assumptions.incidentRiskYenPerMonth),
      pilotManualMinutes: String(pilotRun.observedManualMinutes),
      pilotAssistedMinutes: String(pilotRun.observedAssistedMinutes),
      pilotParticipants: String(pilotRun.participants),
      pilotAcceptedTasks: String(pilotRun.acceptedTasks),
      pilotTotalTasks: String(pilotRun.totalTasks)
    });
    if (pilotRun.evidenceUrl) params.set("pilotEvidenceUrl", pilotRun.evidenceUrl);
    if (pilotRun.reviewerName) params.set("pilotReviewer", pilotRun.reviewerName);
    if (pilotRun.notes) params.set("pilotNotes", pilotRun.notes);
    if (workspace.targetUrl) params.set("targetUrl", workspace.targetUrl);
    if (workspace.protopediaUrl) params.set("protopediaUrl", workspace.protopediaUrl);
    if (workspace.videoUrl) params.set("videoUrl", workspace.videoUrl);
    if (workspace.agentTrialEvidence.length) params.set("trialEvidence", encodeAgentTrialEvidenceParam(workspace.agentTrialEvidence));
    if (customAgents.length) params.set("customAgents", encodeCustomAgentsParam(customAgents));
    return params.toString();
  }, [buyerScenario.assumptions, customAgents, pilotRun, projectBrief, recommendation.selected, workspace]);
  const publicReviewHref = `/sponsor-review?${reviewSearchParams}`;

  return (
    <section id="sponsor-review-room" className={cx("sponsor-review-room", room.readiness)} aria-labelledby="sponsor-review-room-title">
      <div className="sponsor-review-heading">
        <div>
          <span className="eyebrow">Sponsor Review Room</span>
          <h2 id="sponsor-review-room-title">
            <ClipboardList size={20} />
            {room.headline}
          </h2>
          <p>{room.hardTruth}</p>
        </div>
        <div className="sponsor-review-score">
          <span className={cx("risk-chip", readinessTone(room.readiness))}>{room.readiness}</span>
          <strong>{room.reviewScore}</strong>
          <small>{room.decisionAsk}</small>
        </div>
      </div>

      <div className="sponsor-review-metrics">
        <article>
          <span>Questions</span>
          <strong>{room.questions.length}</strong>
        </article>
        <article>
          <span>Clear answers</span>
          <strong>{room.questions.filter((question) => question.status === "clear").length}</strong>
        </article>
        <article>
          <span>Next owner</span>
          <strong>{room.nextQuestion.owner}</strong>
        </article>
        <article>
          <span>Packet receipt</span>
          <strong>{proofPacket.receipt.digest}</strong>
        </article>
        <a className="icon-link sponsor-review-export" href={exportHref} download="sponsor-review-room.md">
          <Download size={16} />
          Export review
        </a>
        <a className="icon-link sponsor-review-export" href={publicReviewHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public review
        </a>
      </div>

      <section className={cx("sponsor-decision-receipt", decisionReceipt.status)} aria-label="Sponsor decision receipt">
        <div className="sponsor-decision-head">
          <div>
            <span className={cx("risk-chip", receiptTone(decisionReceipt.status))}>{decisionReceipt.status}</span>
            <h3>
              <FileCheck2 size={17} />
              Decision receipt
            </h3>
            <p>{decisionReceipt.summary}</p>
          </div>
          <div className="sponsor-decision-stamp">
            <span>{decisionLabel(decisionReceipt.decision)}</span>
            <strong>{decisionReceipt.conditions.filter((condition) => condition.status === "clear").length}/{decisionReceipt.conditions.length}</strong>
            <small>conditions clear</small>
          </div>
        </div>

        <div className="sponsor-decision-controls">
          <fieldset>
            <legend>Decision</legend>
            <div className="sponsor-decision-options" role="group" aria-label="Sponsor decision">
              {(["continue", "revise", "stop"] as SponsorDecisionChoice[]).map((option) => (
                <button key={option} className={cx(decision === option && "active")} type="button" onClick={() => setDecision(option)}>
                  {decisionLabel(option)}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            <span>Signer</span>
            <input value={signerName} onChange={(event) => setSignerName(event.target.value)} />
          </label>
          <label>
            <span>Decision date</span>
            <input type="date" value={decisionDate} onChange={(event) => setDecisionDate(event.target.value)} />
          </label>
          <label className="sponsor-decision-wide">
            <span>Sponsor note</span>
            <textarea value={sponsorNote} onChange={(event) => setSponsorNote(event.target.value)} />
          </label>
          <label className="sponsor-decision-wide">
            <span>Condition override</span>
            <textarea
              value={conditionNote}
              onChange={(event) => setConditionNote(event.target.value)}
              placeholder="Optional: replace each open condition with the sponsor's exact required action."
            />
          </label>
        </div>

        <div className="sponsor-decision-output">
          <article>
            <span>Next step</span>
            <strong>{decisionReceipt.nextStep}</strong>
          </article>
          <div className="sponsor-decision-conditions">
            {decisionReceipt.conditions.map((condition) => (
              <article key={condition.id} className={condition.status}>
                <div>
                  <span>{condition.status}</span>
                  <strong>{condition.label}</strong>
                </div>
                <p>{condition.requiredAction}</p>
                <small>{condition.owner} / {condition.evidence}</small>
              </article>
            ))}
          </div>
          <a className="icon-link sponsor-review-export" href={receiptHref} download="sponsor-decision-receipt.md">
            <Download size={16} />
            Export receipt
          </a>
        </div>
      </section>

      <section className="sponsor-proof-receipt" aria-label="Proof packet receipt">
        <div>
          <span>{proofPacket.receipt.algorithm}</span>
          <h3>
            <ShieldCheck size={17} />
            Proof packet receipt
          </h3>
          <p>{proofPacket.receipt.verification}</p>
        </div>
        <code>{proofPacket.receipt.digest}</code>
        <small>{proofPacket.receipt.coveredArtifacts.join(", ")}</small>
      </section>

      <section className="sponsor-objection-brief" aria-label="Approval objection brief">
        <div className="sponsor-objection-head">
          <div>
            <span className={cx("risk-chip", readinessTone(room.approvalMeetingMode === "ready-to-run" ? "approve-review" : room.approvalMeetingMode === "needs-prep" ? "close-evidence" : "blocked"))}>
              {room.approvalMeetingMode}
            </span>
            <h3>
              <HelpCircle size={17} />
              Approval objection brief
            </h3>
            <p>Pressure-test the sponsor meeting before it happens. Each answer is tied to an owner, artifact, and fallback move.</p>
          </div>
          <div className="sponsor-objection-score">
            <span>Pressure test</span>
            <strong>{room.pressureTestScore}</strong>
            <small>{room.objectionBriefs.filter((brief) => brief.status === "clear").length}/{room.objectionBriefs.length} objections answered</small>
          </div>
        </div>

        <div className="sponsor-approval-agenda" aria-label="Approval meeting agenda">
          {room.approvalAgenda.map((item) => (
            <article key={item.id} className={item.status}>
              <span>{item.minutes}m</span>
              <strong>{item.label}</strong>
              <p>{item.question}</p>
              <small>{item.owner} / {item.artifactId}</small>
            </article>
          ))}
        </div>

        <div className="sponsor-objection-grid">
          {room.objectionBriefs.map((brief) => (
            <article key={brief.id} className={brief.status}>
              <div>
                <span>{brief.status}</span>
                <strong>{brief.stakeholder}</strong>
              </div>
              <h4>{brief.objection}</h4>
              <p>{brief.answer}</p>
              <small>{brief.evidence}</small>
              <footer>
                <em>{brief.owner}</em>
                <b>{brief.artifactId}</b>
              </footer>
              <aside>{brief.ifChallenged}</aside>
            </article>
          ))}
        </div>
      </section>

      <div className="sponsor-review-body">
        <section className="sponsor-review-next">
          <h3>
            <Send size={16} />
            Next question
          </h3>
          <strong>{room.nextQuestion.label}</strong>
          <p>{room.nextQuestion.nextAction}</p>
        </section>

        <section className="sponsor-review-questions">
          <h3>
            <HelpCircle size={16} />
            Sponsor questions
          </h3>
          <div>
            {room.questions.map((question) => (
              <article key={question.id} className={question.status}>
                <div>
                  <span>{question.status}</span>
                  <strong>{question.label}</strong>
                </div>
                <h4>{question.question}</h4>
                <p>{question.answer}</p>
                <small>{question.evidence}</small>
                <footer>
                  <em>{question.owner}</em>
                  <b>{question.artifactId}</b>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <aside className="sponsor-review-ask">
          <h3>
            <MessageSquare size={16} />
            Decision ask
          </h3>
          <strong>{room.decisionAsk}</strong>
          <p>{room.hardTruth}</p>
          <small>{room.id}</small>
        </aside>
      </div>
    </section>
  );
}
