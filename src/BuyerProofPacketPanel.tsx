import { AlertTriangle, Download, ExternalLink, FileCheck2, Gauge, ListChecks, PackageCheck, ShieldCheck } from "lucide-react";
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
import { buildSponsorReviewRoom } from "./sponsorReviewRoom";
import type { MarketAgent, Recommendation } from "./types";
import type { ValueBlueprint } from "./valueBlueprint";
import type { WorkspaceDraft } from "./workspaceDraft";

type BuyerProofPacketPanelProps = {
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
  if (readiness === "share-ready") return "low";
  if (readiness === "needs-evidence") return "medium";
  return "high";
}

type ReceiptVerifyStatus = "idle" | "checking" | "verified" | "failed";

export default function BuyerProofPacketPanel({
  projectBrief,
  recommendation,
  valueBlueprint,
  buyerScenario,
  pilotRun,
  workspace,
  customAgents = []
}: BuyerProofPacketPanelProps) {
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
  const sponsorReview = useMemo(
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
  const packet = useMemo(
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
        sponsorReview
      }),
    [agreement, buyerScenario, diligence, execution, ledger, matrix, proposal, receipt, recommendation, sponsorReview, valueBlueprint, workflow]
  );
  const exportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(packet.exportMarkdown)}`;
  const receiptPayloadHref = packet.receipt.payloadHref;
  const receiptVerificationHref = packet.receipt.verificationRequestHref;
  const [receiptVerifyStatus, setReceiptVerifyStatus] = useState<ReceiptVerifyStatus>("idle");
  const [receiptVerifyMessage, setReceiptVerifyMessage] = useState("");
  const receiptVerifyLabel =
    receiptVerifyStatus === "checking" ? "Checking receipt" : receiptVerifyStatus === "verified" ? "Receipt verified" : receiptVerifyStatus === "failed" ? "Verification failed" : "Verify receipt";
  const proofPacketSearchParams = useMemo(() => {
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
  const publicPacketHref = `/buyer-proof-packet?${proofPacketSearchParams}`;

  useEffect(() => {
    setReceiptVerifyStatus("idle");
    setReceiptVerifyMessage("");
  }, [packet.receipt.digest]);

  async function verifyReceipt() {
    setReceiptVerifyStatus("checking");
    setReceiptVerifyMessage("");
    try {
      const response = await fetch(packet.receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: packet.receipt.verificationRequestJson
      });
      const result = await response.json();
      if (response.ok && result?.verification?.status === "verified") {
        setReceiptVerifyStatus("verified");
        setReceiptVerifyMessage(`Digest ${result.verification.actualDigest} matches this packet.`);
        return;
      }
      setReceiptVerifyStatus("failed");
      setReceiptVerifyMessage(result?.verification?.instruction ?? result?.error ?? "Receipt verification failed.");
    } catch {
      setReceiptVerifyStatus("failed");
      setReceiptVerifyMessage("Receipt verification could not reach the local verification API.");
    }
  }

  return (
    <section id="buyer-proof-packet" className={cx("buyer-proof-packet", packet.readiness)} aria-labelledby="buyer-proof-packet-title">
      <div className="buyer-proof-heading">
        <div>
          <span className="eyebrow">Buyer Proof Packet</span>
          <h2 id="buyer-proof-packet-title">
            <PackageCheck size={20} />
            {packet.headline}
          </h2>
          <p>{packet.hardTruth}</p>
        </div>
        <div className="buyer-proof-score">
          <span className={cx("risk-chip", readinessTone(packet.readiness))}>{packet.readiness}</span>
          <strong>{packet.packetScore}</strong>
          <small>{packet.decisionAsk}</small>
        </div>
      </div>

      <div className="buyer-proof-metrics">
        <article>
          <span>Evidence rows</span>
          <strong>{packet.rows.length}</strong>
        </article>
        <article>
          <span>Reality checks</span>
          <strong>{packet.realityChecks.length}</strong>
        </article>
        <article>
          <span>Receipt digest</span>
          <strong>{packet.receipt.digest}</strong>
        </article>
        <article>
          <span>Open gaps</span>
          <strong>{packet.gaps.length}</strong>
        </article>
        <a className="icon-link buyer-proof-export" href={exportHref} download="buyer-proof-packet.md">
          <Download size={16} />
          Export packet
        </a>
        <a className="icon-link buyer-proof-export" href={publicPacketHref} target="_blank" rel="noreferrer">
          <ExternalLink size={16} />
          Open public packet
        </a>
      </div>

      <div className="buyer-proof-body">
        <section className="buyer-proof-rows">
          <h3>
            <FileCheck2 size={16} />
            Evidence rows
          </h3>
          <div>
            {packet.rows.map((row) => (
              <article key={row.id} className={row.status}>
                <div>
                  <span>{row.status}</span>
                  <strong>{row.label}</strong>
                </div>
                <h4>{row.claim}</h4>
                <p>{row.evidence}</p>
                <footer>
                  <em>{row.owner}</em>
                  <b>{row.artifactId}</b>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <aside className="buyer-proof-sidebar">
          <section>
            <h3>
              <Gauge size={16} />
              Reality checks
            </h3>
            <div className="buyer-proof-checks">
              {packet.realityChecks.map((check) => (
                <article key={check.label}>
                  <span>{check.label}</span>
                  <strong>{check.value}</strong>
                  <small>{check.source}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>
              <ShieldCheck size={16} />
              Manifest receipt
            </h3>
            <div className="buyer-proof-receipt">
              <article className="sealed">
                <span>{packet.receipt.algorithm}</span>
                <strong>{packet.receipt.digest}</strong>
                <small>{packet.receipt.coveredArtifacts.length} artifacts sealed</small>
                <small className="buyer-proof-receipt-api">POST {packet.receipt.verificationApiPath}</small>
                <button
                  className={cx("icon-link buyer-proof-receipt-download", receiptVerifyStatus === "verified" && "is-confirmed", receiptVerifyStatus === "failed" && "is-risk")}
                  type="button"
                  aria-label="Verify buyer proof packet receipt"
                  onClick={verifyReceipt}
                  disabled={receiptVerifyStatus === "checking"}
                >
                  {receiptVerifyStatus === "failed" ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                  {receiptVerifyLabel}
                </button>
                {receiptVerifyMessage && (
                  <small className={cx("buyer-proof-receipt-status", receiptVerifyStatus === "verified" && "is-confirmed", receiptVerifyStatus === "failed" && "is-risk")}>{receiptVerifyMessage}</small>
                )}
                <a className="icon-link buyer-proof-receipt-download" href={receiptPayloadHref} download="buyer-proof-packet-receipt-payload.json">
                  <Download size={14} />
                  Download receipt payload
                </a>
                <a className="icon-link buyer-proof-receipt-download" href={receiptVerificationHref} download="buyer-proof-packet-receipt-verify-request.json">
                  <Download size={14} />
                  Download verify request
                </a>
              </article>
              {packet.receipt.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <span>{check.status}</span>
                  <strong>{check.label}</strong>
                  <p>{check.evidence}</p>
                  <small>{check.verifier}</small>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h3>
              {packet.gaps.length ? <AlertTriangle size={16} /> : <ListChecks size={16} />}
              Open gaps
            </h3>
            <div className="buyer-proof-gaps">
              {packet.gaps.length ? (
                packet.gaps.map((gap) => (
                  <article key={gap.id} className={gap.severity}>
                    <span>{gap.severity}</span>
                    <strong>{gap.label}</strong>
                    <p>{gap.fix}</p>
                    <small>{gap.owner}</small>
                  </article>
                ))
              ) : (
                <article className="clear">
                  <span>clear</span>
                  <strong>No open gaps</strong>
                  <p>The packet can be shared as a buyer-facing approval artifact.</p>
                  <small>{packet.targetBuyer}</small>
                </article>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
