import { AlertTriangle, BadgeCheck, Bot, ClipboardCheck, Download, ExternalLink, FileText, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { buildAgentTrialEvidenceRecord, type AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import { buildAgentTrialReceipt, type AgentTrialReceipt } from "./agentTrialReceipt";
import { verifyAgentTrialResponse, type AgentTrialVerification } from "./agentTrialVerifier";
import { buildImportedAgentFromCard, MAX_CUSTOM_AGENTS, type AgentCardImportResult } from "./customAgent";
import { PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import type { MarketAgent } from "./types";
import type { WorkspaceDraft } from "./workspaceDraft";

type AgentCardIntakePanelProps = {
  customAgents: MarketAgent[];
  onImport: (agent: MarketAgent) => void;
  onRemove: (id: string) => void;
  onCopyText: (text: string) => Promise<boolean>;
  onAttachTrialEvidence: (record: AgentTrialEvidenceRecord) => void;
  attachedEvidenceIds: string[];
  workspace: WorkspaceDraft;
};

type AgentCardPanelResult = AgentCardImportResult & {
  sourceUrl?: string;
  discoveredUrl?: string;
};

type PublicTrialHandoff = {
  id: string;
  checkedAt: string;
  status: "workspace-ready" | "needs-evidence" | "blocked";
  score: number;
  headline: string;
  buyerLine: string;
  evidenceRecord: AgentTrialEvidenceRecord | null;
  links: Array<{ id: string; label: string; url: string; purpose: string }>;
  nextActions: string[];
  exportMarkdown: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const AGENT_TRIAL_RESPONSE_ARTIFACT_PLACEHOLDER = "<public HTTPS A2A trial receipt artifact URL reviewers can open>";

export function buildAgentTrialResponsePlaceholder(trialReceipt: AgentTrialReceipt) {
  return JSON.stringify(
    {
      receiptId: trialReceipt.id,
      skillId: trialReceipt.jsonRpcPayload.params.skillId,
      status: "completed",
      artifactUrl: AGENT_TRIAL_RESPONSE_ARTIFACT_PLACEHOLDER,
      evidenceSource: "Buyer-visible Cloud Run logs and A2A receipt",
      acceptance: ["All receipt acceptance criteria are met and linked to the artifact."]
    },
    null,
    2
  );
}

export default function AgentCardIntakePanel({ customAgents, onImport, onRemove, onCopyText, onAttachTrialEvidence, attachedEvidenceIds, workspace }: AgentCardIntakePanelProps) {
  const [rawCard, setRawCard] = useState("");
  const [discoveryUrl, setDiscoveryUrl] = useState("");
  const [result, setResult] = useState<AgentCardPanelResult | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [trialResponse, setTrialResponse] = useState("");
  const [verification, setVerification] = useState<AgentTrialVerification | null>(null);
  const [verificationCopyStatus, setVerificationCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [attachStatus, setAttachStatus] = useState<"idle" | "attached">("idle");
  const [publicHandoff, setPublicHandoff] = useState<PublicTrialHandoff | null>(null);
  const [publicHandoffStatus, setPublicHandoffStatus] = useState<"idle" | "checking" | "ready" | "failed">("idle");
  const [publicHandoffError, setPublicHandoffError] = useState("");
  const [publicHandoffCopyStatus, setPublicHandoffCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const trialReceipt = useMemo(() => (result?.status === "accepted" ? buildAgentTrialReceipt({ agent: result.agent, assessment: result.assessment }) : null), [result]);
  const copyLabel = copyStatus === "copied" ? "Copied receipt" : copyStatus === "failed" ? "Copy failed" : "Copy trial receipt";
  const verificationCopyLabel = verificationCopyStatus === "copied" ? "Copied verification" : verificationCopyStatus === "failed" ? "Copy failed" : "Copy verification";
  const trialEvidenceId = trialReceipt ? `trial-proof-${trialReceipt.id}` : "";
  const proofAttached = Boolean(trialEvidenceId && attachedEvidenceIds.includes(trialEvidenceId));
  const currentDiligenceUrl = (result?.sourceUrl || result?.discoveredUrl || discoveryUrl).trim();
  const diligenceHref = currentDiligenceUrl ? `/agent-card-diligence?url=${encodeURIComponent(currentDiligenceUrl)}` : "";
  const publicTrialPlanHref = currentDiligenceUrl ? `/agent-card-trial-plan?url=${encodeURIComponent(currentDiligenceUrl)}` : "";
  const publicHandoffAttached = Boolean(publicHandoff?.evidenceRecord?.id && attachedEvidenceIds.includes(publicHandoff.evidenceRecord.id));
  const publicHandoffExportHref = publicHandoff?.exportMarkdown ? `data:text/markdown;charset=utf-8,${encodeURIComponent(publicHandoff.exportMarkdown)}` : "";
  const publicHandoffCopyLabel = publicHandoffCopyStatus === "copied" ? "Copied handoff" : publicHandoffCopyStatus === "failed" ? "Copy failed" : "Copy handoff";

  function resetTrialReview() {
    setCopyStatus("idle");
    setTrialResponse("");
    setVerification(null);
    setVerificationCopyStatus("idle");
    setAttachStatus("idle");
    setPublicHandoff(null);
    setPublicHandoffStatus("idle");
    setPublicHandoffError("");
    setPublicHandoffCopyStatus("idle");
  }

  function importAgentCard() {
    const next = buildImportedAgentFromCard(rawCard, discoveryUrl.trim() || undefined);
    resetTrialReview();
    setResult(next);
    if (next.status === "accepted") {
      onImport(next.agent);
      setRawCard("");
    }
  }

  async function discoverAgentCard() {
    setDiscovering(true);
    resetTrialReview();
    setResult(null);
    try {
      const response = await fetch("/api/agent-card/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: discoveryUrl })
      });
      const next = (await response.json()) as AgentCardImportResult;
      setResult(next);
      if (response.ok && next.status === "accepted") {
        onImport(next.agent);
        setDiscoveryUrl("");
      }
    } catch {
      setResult({
        status: "rejected",
        error: "Agent Card discovery failed.",
        warnings: [],
        signals: []
      });
    } finally {
      setDiscovering(false);
    }
  }

  async function copyTrialReceipt() {
    if (!trialReceipt) return;
    const copied = await onCopyText(trialReceipt.copyText);
    setCopyStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  }

  function verifyTrialResponse() {
    if (!trialReceipt) return;
    setVerification(verifyAgentTrialResponse({ receipt: trialReceipt, rawResponse: trialResponse }));
    setPublicHandoff(null);
    setPublicHandoffStatus("idle");
    setPublicHandoffError("");
    setPublicHandoffCopyStatus("idle");
    setAttachStatus("idle");
  }

  async function createPublicHandoff() {
    if (!currentDiligenceUrl || !trialResponse.trim()) return;
    setPublicHandoffStatus("checking");
    setPublicHandoffError("");
    setPublicHandoffCopyStatus("idle");
    setPublicHandoff(null);
    try {
      const response = await fetch("/api/agent-card/trial-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentDiligenceUrl,
          response: trialResponse,
          workspaceAgentId: result?.status === "accepted" ? result.agent.id : undefined,
          workspace
        })
      });
      const data = (await response.json()) as PublicTrialHandoff | { error?: string };
      if (!response.ok || !("status" in data)) {
        throw new Error("Public handoff failed.");
      }
      setPublicHandoff(data);
      setPublicHandoffStatus("ready");
      if (data.evidenceRecord) {
        onAttachTrialEvidence(data.evidenceRecord);
        setAttachStatus("attached");
      }
    } catch (error) {
      setPublicHandoffStatus("failed");
      setPublicHandoffError(error instanceof Error ? error.message : "Public handoff failed.");
    }
  }

  async function copyVerification() {
    if (!verification) return;
    const copied = await onCopyText(verification.copyText);
    setVerificationCopyStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setVerificationCopyStatus("idle"), 2200);
  }

  async function copyPublicHandoff() {
    if (!publicHandoff?.exportMarkdown) return;
    const copied = await onCopyText(publicHandoff.exportMarkdown);
    setPublicHandoffCopyStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setPublicHandoffCopyStatus("idle"), 2200);
  }

  function attachVerifiedTrialEvidence() {
    if (!trialReceipt || !verification || result?.status !== "accepted" || verification.status !== "accepted") return;
    onAttachTrialEvidence(buildAgentTrialEvidenceRecord({ agent: result.agent, receipt: trialReceipt, verification }));
    setAttachStatus("attached");
  }

  const intakeFull = customAgents.length >= MAX_CUSTOM_AGENTS;

  return (
    <section id="agent-card-intake" className="panel agent-card-intake" aria-labelledby="agent-card-intake-title">
      <div className="panel-heading">
        <h2 id="agent-card-intake-title">
          <FileText size={18} />
          Agent Card Trial Intake
        </h2>
        <span className="chip">{customAgents.length}/{MAX_CUSTOM_AGENTS}</span>
      </div>
      <div className="agent-card-intake-body">
        <div className="agent-card-discovery">
          <label htmlFor="agent-card-url">Public Agent Card URL</label>
          <div className="agent-card-discovery-actions">
            <input
              id="agent-card-url"
              value={discoveryUrl}
              onChange={(event) => setDiscoveryUrl(event.target.value)}
              placeholder={PUBLIC_PROOF_INPUT_PLACEHOLDERS.agentCardUrl}
            />
            <button className="icon-button" type="button" onClick={discoverAgentCard} disabled={!discoveryUrl.trim() || intakeFull || discovering}>
              <Search size={17} />
              {discovering ? "Discovering" : "Discover URL"}
            </button>
            {diligenceHref && (
              <a className="icon-link" href={diligenceHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Diligence
              </a>
            )}
            {publicTrialPlanHref && (
              <a className="icon-link" href={publicTrialPlanHref} target="_blank" rel="noreferrer">
                <ClipboardCheck size={15} />
                Trial plan
              </a>
            )}
          </div>
        </div>
        <textarea
          value={rawCard}
          onChange={(event) => setRawCard(event.target.value)}
          aria-label="Agent Card JSON"
          placeholder='{"name":"Cloud Run Release Agent","description":"Deploys Cloud Run services and reports A2A handoff evidence","skills":[{"id":"cloudrun.deploy","name":"Cloud Run deploy"}]}'
        />
        <button className="icon-button" type="button" onClick={importAgentCard} disabled={!rawCard.trim() || intakeFull}>
          <Bot size={17} />
          Import for trial
        </button>
        {intakeFull && <p className="agent-card-intake-note">Remove one imported agent before adding another.</p>}
        {result && (
          <div className={cx("agent-card-intake-result", result.status)}>
            <strong>
              {result.status === "accepted" ? <BadgeCheck size={15} /> : <AlertTriangle size={15} />}
              {result.status === "accepted" ? `Imported ${result.agent.name}` : result.error}
            </strong>
            <p>{result.signals.slice(0, 4).join(" / ") || "No capability signals yet."}</p>
            {result.warnings.length > 0 && <small>{result.warnings.join(" / ")}</small>}
            {diligenceHref && (
              <a className="icon-link agent-card-diligence-link" href={diligenceHref} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                Open buyer diligence report
              </a>
            )}
          </div>
        )}
        {result?.status === "accepted" && (
          <section className={cx("agent-trust-passport", result.assessment.riskLevel)} aria-label="Agent trust passport">
            <div>
              <span className="eyebrow">Trust passport</span>
              <strong>
                <ShieldCheck size={15} />
                {result.assessment.headline}
              </strong>
            </div>
            <div className="agent-trust-score">
              <span>{result.assessment.readiness}</span>
              <strong>{result.assessment.score}</strong>
              <small>{result.assessment.riskLevel} risk</small>
            </div>
            <div className="agent-trust-checks">
              {result.assessment.checks.slice(0, 5).map((check) => (
                <article key={check.id} className={check.status}>
                  <span>{check.status}</span>
                  <strong>{check.label}</strong>
                  <small>{check.evidence}</small>
                </article>
              ))}
            </div>
            <div className="agent-trial-task">
              <ClipboardCheck size={15} />
              <div>
                <span>{result.assessment.trialTask.method} / {result.assessment.trialTask.skillId}</span>
                <p>{result.assessment.trialTask.objective}</p>
              </div>
            </div>
            {trialReceipt && (
              <>
                <div className="agent-trial-receipt">
                  <div>
                    <span>Receipt</span>
                    <strong>{trialReceipt.id}</strong>
                    <small>digest {trialReceipt.digest}</small>
                  </div>
                  <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyTrialReceipt}>
                    <ClipboardCheck size={15} />
                    {copyLabel}
                  </button>
                  {publicTrialPlanHref && (
                    <a className="icon-link" href={publicTrialPlanHref} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} />
                      Public trial plan
                    </a>
                  )}
                </div>
                <div className="agent-trial-verifier">
                  <div className="agent-trial-verifier-heading">
                    <div>
                      <span className="eyebrow">Response verifier</span>
                      <strong>Verify returned trial evidence</strong>
                    </div>
                    <div className="agent-trial-verifier-actions">
                      <button className="icon-link" type="button" onClick={verifyTrialResponse} disabled={!trialResponse.trim()}>
                        <ShieldCheck size={15} />
                        Verify response
                      </button>
                      <button className={cx("icon-link", publicHandoffStatus === "ready" && "is-confirmed", publicHandoffStatus === "failed" && "is-risk")} type="button" onClick={createPublicHandoff} disabled={!currentDiligenceUrl || !trialResponse.trim() || publicHandoffStatus === "checking"}>
                        <ExternalLink size={15} />
                        {publicHandoffStatus === "checking" ? "Creating handoff" : publicHandoffAttached ? "Handoff attached" : "Create handoff"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={trialResponse}
                    onChange={(event) => {
                      setTrialResponse(event.target.value);
                      setVerification(null);
                      setPublicHandoff(null);
                      setPublicHandoffStatus("idle");
                      setPublicHandoffError("");
                      setPublicHandoffCopyStatus("idle");
                    }}
                    aria-label="Trial response JSON"
                    placeholder={buildAgentTrialResponsePlaceholder(trialReceipt)}
                  />
                  <div className="agent-trial-artifact-gate" aria-label="A2A trial artifact URL requirement">
                    <ShieldCheck size={14} />
                    <small>Use a public https:// receipt URL reviewers can open. Placeholder, localhost, and private hosts fail before handoff.</small>
                  </div>
                  {publicHandoffError && <small className="agent-trial-verification-missing">{publicHandoffError}</small>}
                  {verification && (
                    <div className={cx("agent-trial-verification", verification.status)}>
                      <div className="agent-trial-verification-score">
                        <div>
                          <span>{verification.status}</span>
                          <strong>{verification.score}</strong>
                          <small>{verification.headline}</small>
                        </div>
                        <button className={cx("icon-link", verificationCopyStatus === "copied" && "is-confirmed", verificationCopyStatus === "failed" && "is-risk")} type="button" onClick={copyVerification}>
                          <ClipboardCheck size={15} />
                          {verificationCopyLabel}
                        </button>
                        {verification.status === "accepted" && (
                          <button className={cx("icon-link", (proofAttached || attachStatus === "attached") && "is-confirmed")} type="button" onClick={attachVerifiedTrialEvidence} disabled={proofAttached || attachStatus === "attached"}>
                            <ShieldCheck size={15} />
                            {proofAttached || attachStatus === "attached" ? "Proof attached" : "Attach proof"}
                          </button>
                        )}
                      </div>
                      <p>{verification.hardTruth}</p>
                      <div className="agent-trial-verification-checks">
                        {verification.checks.map((check) => (
                          <article key={check.id} className={check.status}>
                            <span>{check.status}</span>
                            <strong>{check.label}</strong>
                            <small>{check.evidence}</small>
                          </article>
                        ))}
                      </div>
                      {verification.missingEvidence.length > 0 && <small className="agent-trial-verification-missing">Missing: {verification.missingEvidence.join(" / ")}</small>}
                    </div>
                  )}
                  {publicHandoff && (
                    <div className={cx("agent-trial-handoff", publicHandoff.status)}>
                      <div className="agent-trial-handoff-head">
                        <div>
                          <span>{publicHandoff.status}</span>
                          <strong>{publicHandoff.score}</strong>
                          <small>{publicHandoff.headline}</small>
                        </div>
                        {publicHandoff.evidenceRecord && (
                          <span className={cx("agent-trial-handoff-proof", (publicHandoffAttached || attachStatus === "attached") && "is-confirmed")}>
                            {publicHandoffAttached || attachStatus === "attached" ? "workspace proof attached" : "workspace proof ready"}
                          </span>
                        )}
                      </div>
                      <p>{publicHandoff.buyerLine}</p>
                      <div className="agent-trial-handoff-actions">
                        <button className={cx("icon-link", publicHandoffCopyStatus === "copied" && "is-confirmed", publicHandoffCopyStatus === "failed" && "is-risk")} type="button" onClick={copyPublicHandoff}>
                          <ClipboardCheck size={13} />
                          {publicHandoffCopyLabel}
                        </button>
                        {publicHandoffExportHref && (
                          <a className="icon-link" href={publicHandoffExportHref} download="agent-card-trial-handoff.md">
                            <Download size={13} />
                            Download handoff
                          </a>
                        )}
                      </div>
                      <div className="agent-trial-handoff-links">
                        {publicHandoff.links.map((link) => (
                          <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                            <ExternalLink size={13} />
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
        {customAgents.length > 0 && (
          <div className="imported-agent-list" aria-label="Imported agents">
            {customAgents.map((agent) => (
              <article key={agent.id}>
                <div>
                  <strong>{agent.name}</strong>
                  <span>{agent.stage} / {agent.price} credits</span>
                </div>
                <button type="button" onClick={() => onRemove(agent.id)} aria-label={`Remove ${agent.name}`}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
