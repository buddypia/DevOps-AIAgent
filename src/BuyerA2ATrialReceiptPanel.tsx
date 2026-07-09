import { BadgeCheck, ExternalLink, Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import { buildBuyerA2ATrialEvidenceRecord } from "./buyerA2ATrialEvidence";
import { buyerFacingProofUrlProblem, PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { MarketAgent } from "./types";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type BuyerA2ATrialReceiptPanelProps = {
  selectedAgents: MarketAgent[];
  evidenceRecords: AgentTrialEvidenceRecord[];
  trialPlanHref: string;
  diligenceHref: string;
  onAttachEvidence: (record: AgentTrialEvidenceRecord) => void;
};

export default function BuyerA2ATrialReceiptPanel({
  selectedAgents,
  evidenceRecords,
  trialPlanHref,
  diligenceHref,
  onAttachEvidence
}: BuyerA2ATrialReceiptPanelProps) {
  const acceptedRecords = evidenceRecords.filter((record) => record.status === "accepted");
  const acceptedAgentIds = new Set(acceptedRecords.map((record) => record.agentId));
  const firstOpenAgent = selectedAgents.find((agent) => !acceptedAgentIds.has(agent.id));
  const [selectedAgentId, setSelectedAgentId] = useState(firstOpenAgent?.id ?? selectedAgents[0]?.id ?? "");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [score, setScore] = useState(92);
  const [attachStatus, setAttachStatus] = useState<"idle" | "attached" | "failed">("idle");
  const selectedAgent = selectedAgents.find((agent) => agent.id === selectedAgentId) ?? selectedAgents[0] ?? null;
  const selectedSkillId = selectedAgent?.a2aSkillIds[0] || selectedAgent?.skills[0]?.id || "buyer.trial";
  const selectedAcceptedCount = selectedAgents.filter((agent) => acceptedAgentIds.has(agent.id)).length;
  const panelStatus = selectedAgents.length === 0 || selectedAcceptedCount === 0 ? "blocked" : selectedAcceptedCount === selectedAgents.length ? "ready" : "attention";
  const artifactUrlProblem = buyerFacingProofUrlProblem(artifactUrl);
  const artifactIsPublic = !artifactUrlProblem;
  const artifactUrlLine = artifactIsPublic ? "Receipt URL is buyer-facing and can be attached." : artifactUrlProblem;
  const attachLabel = attachStatus === "attached" ? "Receipt attached" : attachStatus === "failed" ? "Check URL" : "Attach accepted receipt";

  useEffect(() => {
    if (selectedAgents.length === 0) {
      setSelectedAgentId("");
      return;
    }
    if (selectedAgentId && selectedAgents.some((agent) => agent.id === selectedAgentId)) return;
    setSelectedAgentId(firstOpenAgent?.id ?? selectedAgents[0].id);
  }, [firstOpenAgent?.id, selectedAgentId, selectedAgents]);

  function attachReceipt() {
    if (!selectedAgent) return;
    const record = buildBuyerA2ATrialEvidenceRecord({
      agent: selectedAgent,
      skillId: selectedSkillId,
      score,
      artifactUrl,
      evidenceSource: `Buyer-safe A2A trial response for ${selectedAgent.name}.`
    });
    if (!record) {
      setAttachStatus("failed");
      return;
    }
    onAttachEvidence(record);
    setArtifactUrl("");
    setAttachStatus("attached");
  }

  return (
    <section id="buyer-a2a-trial-intake" className={cx("buyer-a2a-trial-intake", panelStatus)} aria-label="Accepted A2A trial receipt">
      <div className="buyer-a2a-trial-head">
        <div>
          <span>A2A trial receipt</span>
          <strong>
            {selectedAcceptedCount}/{Math.max(1, selectedAgents.length)} selected agents accepted
          </strong>
          <p>{firstOpenAgent ? `${firstOpenAgent.name} still needs a buyer-safe accepted trial receipt.` : "Accepted A2A trial proof is attached for the selected squad."}</p>
        </div>
        <div>
          <a href={trialPlanHref} target="_blank" rel="noreferrer">
            <Play size={13} />
            Trial plan
          </a>
          <a href={diligenceHref} target="_blank" rel="noreferrer">
            <ExternalLink size={13} />
            Agent audit
          </a>
        </div>
      </div>
      <div className="buyer-a2a-trial-form">
        <label>
          <span>Agent</span>
          <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} disabled={selectedAgents.length === 0}>
            {selectedAgents.length === 0 ? (
              <option value="">Select an agent first</option>
            ) : (
              selectedAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {acceptedAgentIds.has(agent.id) ? "Accepted: " : ""}
                  {agent.name}
                </option>
              ))
            )}
          </select>
        </label>
        <label className={cx(artifactIsPublic && "is-confirmed", artifactUrl.trim() && artifactUrlProblem && "is-risk")}>
          <span>Receipt URL</span>
          <input
            type="url"
            value={artifactUrl}
            placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.agentTrialArtifactUrl}
            onChange={(event) => {
              setArtifactUrl(event.target.value);
              setAttachStatus("idle");
            }}
          />
          <small>{artifactUrlLine}</small>
        </label>
        <label>
          <span>Score</span>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(event) => {
              setScore(Number(event.target.value));
              setAttachStatus("idle");
            }}
          />
        </label>
        <button className={cx("icon-link", attachStatus === "attached" && "is-confirmed", attachStatus === "failed" && "is-risk")} type="button" onClick={attachReceipt} disabled={!selectedAgent || !artifactIsPublic}>
          <BadgeCheck size={14} />
          {attachLabel}
        </button>
      </div>
      <div className="buyer-a2a-trial-records" aria-label="Attached A2A trial receipts">
        {acceptedRecords.length > 0 ? (
          acceptedRecords.slice(0, 3).map((record) => (
            <a key={record.id} href={record.artifactUrl} target="_blank" rel="noreferrer">
              <span>{record.agentName}</span>
              <strong>{record.score}/100</strong>
              <small>{record.skillId}</small>
            </a>
          ))
        ) : (
          <article>
            <span>Missing</span>
            <strong>No accepted A2A receipt yet</strong>
            <small>Attach one public receipt before treating the squad as buyer-ready.</small>
          </article>
        )}
      </div>
    </section>
  );
}
