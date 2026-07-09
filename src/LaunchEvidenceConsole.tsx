import { Activity, ClipboardCheck, Cloud, Download, ExternalLink, Radar, ShieldCheck, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentTrialEvidenceRecord } from "./agentTrialEvidence";
import type { BuyerPilotProofIntake } from "./buyerPilotProofIntake";
import type { BuyerShareGateProofVerification, BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import type { ExternalEvidenceRun } from "./externalEvidence";
import { buildLaunchEvidenceDecision } from "./launchEvidence";
import type { LiveEvidenceRun } from "./liveEvidence";
import type { ReleaseDriftGuard } from "./releaseDrift";
import { SUBMISSION_PROOF } from "./submission";
import type { Recommendation } from "./types";

type LaunchEvidenceProofField = {
  key: keyof BuyerPilotProofIntake;
  label: string;
  target: string;
  placeholder: string;
  href: string;
};

type ProofVerifyStatus = "idle" | "checking" | "checked" | "failed";

type LaunchEvidenceConsoleProps = {
  recommendation: Recommendation;
  projectBrief: string;
  proofFields: LaunchEvidenceProofField[];
  proofIntake: BuyerPilotProofIntake;
  proofVerification: BuyerShareGateProofVerificationSummary | null;
  proofVerifyStatus: ProofVerifyStatus;
  proofVerifyError: string;
  agentTrialEvidence: AgentTrialEvidenceRecord[];
  onProofIntakeChange: (patch: Partial<BuyerPilotProofIntake>) => void;
  onVerifyProofLinks: () => void;
  publicReportHref: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function proofResultTone(result: BuyerShareGateProofVerification | undefined, value: string) {
  if (result) return result.status;
  return value.trim() ? "watch" : "missing";
}

function proofResultLine(result: BuyerShareGateProofVerification | undefined, target: string, value: string) {
  if (result) return `${result.status}${result.httpStatus ? ` ${result.httpStatus}` : ""}`;
  return value.trim() ? "Attached, not live-checked" : target;
}

export default function LaunchEvidenceConsole({
  recommendation,
  projectBrief,
  proofFields,
  proofIntake,
  proofVerification,
  proofVerifyStatus,
  proofVerifyError,
  agentTrialEvidence,
  onProofIntakeChange,
  onVerifyProofLinks,
  publicReportHref
}: LaunchEvidenceConsoleProps) {
  const [liveEvidence, setLiveEvidence] = useState<LiveEvidenceRun | null>(null);
  const [externalEvidence, setExternalEvidence] = useState<ExternalEvidenceRun | null>(null);
  const [releaseDrift, setReleaseDrift] = useState<ReleaseDriftGuard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const targetUrl = proofIntake.targetUrl;
  const protopediaUrl = proofIntake.protopediaUrl;
  const videoUrl = proofIntake.videoUrl;
  const selectedAgentIds = useMemo(() => recommendation.selected.map((agent) => agent.id), [recommendation]);
  const proofResultsById = useMemo(() => new Map((proofVerification?.results ?? []).map((result) => [result.id, result])), [proofVerification]);
  const launchProofVerification = useMemo(
    () =>
      proofVerification
        ? {
            ...proofVerification,
            results: proofVerification.results.map((result) => ({
              ...result,
              url: proofIntake[result.id as keyof BuyerPilotProofIntake] ?? ""
            }))
          }
        : undefined,
    [proofIntake, proofVerification]
  );
  const attachedProofCount = proofFields.filter((field) => proofIntake[field.key].trim()).length;
  const proofHealthLabel = proofVerification
    ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} live links verified`
    : `${attachedProofCount}/${proofFields.length} proof links attached`;
  const proofHealthDetail = proofVerification
    ? `${proofVerification.score}/100 reachability checked ${new Date(proofVerification.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : proofVerifyStatus === "failed"
      ? proofVerifyError || "Live proof verification failed."
      : "Run a live check before opening the external evidence report.";
  const evidenceInputKey = useMemo(
    () =>
      JSON.stringify({
        projectBrief,
        selectedAgentIds,
        proofIntake,
        agentTrialEvidence
      }),
    [agentTrialEvidence, projectBrief, proofIntake, selectedAgentIds]
  );
  const evidenceInputKeyRef = useRef(evidenceInputKey);
  const decision = useMemo(
    () =>
      liveEvidence && externalEvidence
        ? buildLaunchEvidenceDecision({
            liveEvidence,
            externalEvidence,
            releaseDrift: releaseDrift ?? undefined,
            agentTrialEvidence,
            proofArtifacts: proofFields.map((field) => ({
              id: field.key,
              label: field.label,
              value: proofIntake[field.key],
              href: field.href
            })),
            proofVerification: launchProofVerification
          })
        : null,
    [agentTrialEvidence, externalEvidence, launchProofVerification, liveEvidence, proofFields, proofIntake, releaseDrift]
  );
  const exportHref = decision ? `data:text/markdown;charset=utf-8,${encodeURIComponent(decision.exportMarkdown)}` : "";
  const externalPageParams = new URLSearchParams({
    ...(protopediaUrl ? { protopediaUrl } : {}),
    ...(videoUrl ? { videoUrl } : {})
  }).toString();
  const externalPageHref = externalPageParams ? `/external-evidence?${externalPageParams}` : "/external-evidence";
  const deployRecoveryParams = new URLSearchParams({
    ...(targetUrl ? { targetUrl } : {})
  }).toString();
  const deployRecoveryHref = deployRecoveryParams ? `/deploy-recovery?${deployRecoveryParams}` : "/deploy-recovery";

  function clearLaunchEvidenceResult() {
    setLiveEvidence(null);
    setExternalEvidence(null);
    setReleaseDrift(null);
    setError("");
  }

  useEffect(() => {
    if (evidenceInputKeyRef.current === evidenceInputKey) return;
    evidenceInputKeyRef.current = evidenceInputKey;
    clearLaunchEvidenceResult();
  }, [evidenceInputKey]);

  function updateProofField(key: keyof BuyerPilotProofIntake, value: string) {
    clearLaunchEvidenceResult();
    onProofIntakeChange({ [key]: value } as Partial<BuyerPilotProofIntake>);
  }

  async function runLaunchEvidence() {
    setLoading(true);
    setError("");
    const requestInputKey = evidenceInputKey;
    try {
      const sharedPayload = {
        projectBrief,
        selectedAgentIds
      };
      const releasePayload = {
        ...sharedPayload,
        ...(targetUrl.trim() ? { targetUrl: targetUrl.trim() } : {})
      };
      const [liveResponse, externalResponse, releaseResponse] = await Promise.all([
        fetch("/api/live-evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sharedPayload,
            ...(targetUrl.trim() ? { targetUrl: targetUrl.trim() } : {}),
            budget: 140,
            maxSquadSize: 4
          })
        }),
        fetch("/api/external-evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sharedPayload,
            protopediaUrl,
            videoUrl
          })
        }),
        fetch("/api/release-drift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(releasePayload)
        })
      ]);
      if (!liveResponse.ok) throw new Error(`live evidence HTTP ${liveResponse.status}`);
      if (!externalResponse.ok) throw new Error(`external evidence HTTP ${externalResponse.status}`);
      if (!releaseResponse.ok) throw new Error(`release drift HTTP ${releaseResponse.status}`);
      if (evidenceInputKeyRef.current !== requestInputKey) return;
      setLiveEvidence((await liveResponse.json()) as LiveEvidenceRun);
      setExternalEvidence((await externalResponse.json()) as ExternalEvidenceRun);
      setReleaseDrift((await releaseResponse.json()) as ReleaseDriftGuard);
    } catch (err) {
      if (evidenceInputKeyRef.current !== requestInputKey) return;
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  const readinessTone = decision?.readiness === "launch-ready" ? "low" : decision?.readiness === "blocked" ? "high" : "medium";
  const visibleActions = decision?.nextActions.slice(0, 5) ?? [];

  return (
    <section id="launch-evidence-console" className="launch-evidence-console" aria-labelledby="launch-evidence-title">
      <div className="launch-evidence-heading">
        <div>
          <span className="eyebrow">Public launch desk</span>
          <h2 id="launch-evidence-title">
            <Radar size={20} />
            Launch Evidence Console
          </h2>
          <p>公開URL、Agent Card、A2A、CI、ProtoPedia、動画URLを同じ判定で束ねる。</p>
        </div>
        <div className="launch-evidence-heading-actions">
          <button className={cx("icon-button launch-evidence-proof-check", proofVerifyStatus === "checked" && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")} onClick={onVerifyProofLinks} disabled={proofVerifyStatus === "checking"} title="公開証跡URLをライブ検査">
            <ShieldCheck size={17} />
            {proofVerifyStatus === "checking" ? "Checking proof" : proofVerification ? "Proof checked" : "Verify proof links"}
          </button>
          <button className="icon-button launch-evidence-run" onClick={runLaunchEvidence} disabled={loading} title="公開準備の証拠を検査">
            <Activity size={17} />
            {loading ? "Checking" : "Run launch check"}
          </button>
          <a className="icon-link launch-evidence-report-link" href={publicReportHref} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Open evidence report
          </a>
        </div>
      </div>

      <div className="launch-evidence-proof-health" aria-label="Public proof health">
        <div>
          <span>Buyer proof health</span>
          <strong>{proofHealthLabel}</strong>
          <p className={proofVerifyStatus === "failed" ? "is-risk" : undefined}>{proofHealthDetail}</p>
        </div>
        <div className="launch-evidence-proof-stats" aria-label="Proof artifact counts">
          <span>Attached</span>
          <strong>
            {attachedProofCount}/{proofFields.length}
          </strong>
          <small>{proofVerification ? `${proofVerification.totalCount - proofVerification.verifiedCount} live gaps` : `${proofFields.length - attachedProofCount} missing`}</small>
        </div>
      </div>

      <div className="launch-evidence-inputs" aria-label="Launch evidence proof inputs">
        {proofFields.map((field) => {
          const value = proofIntake[field.key];
          const result = proofResultsById.get(field.key);
          const tone = proofResultTone(result, value);
          return (
            <label key={field.key} className={cx("launch-evidence-proof-field", tone)}>
              <span>{field.label}</span>
              <small>{proofResultLine(result, field.target, value)}</small>
              <input
                name={field.key}
                type="url"
                value={value}
                onChange={(event) => updateProofField(field.key, event.target.value)}
                placeholder={field.key === "targetUrl" ? SUBMISSION_PROOF.deployedUrl : field.placeholder}
              />
              {result ? <em>{result.action}</em> : null}
            </label>
          );
        })}
      </div>

      {error && <p className="error-text">Launch evidence request failed: {error}</p>}

      {decision && liveEvidence && externalEvidence ? (
        <div className="launch-evidence-body">
          <div className="launch-evidence-verdict">
            <div>
              <span className={cx("risk-chip", readinessTone)}>{decision.readiness}</span>
              <h3>{decision.headline}</h3>
              <p>{decision.hardTruth}</p>
              <small>
                {decision.passedProbes}/{decision.totalProbes} probes passed - generated {new Date(decision.generatedAt).toLocaleString()}
              </small>
            </div>
            <div className="launch-evidence-score">
              <strong>{decision.evidenceScore}</strong>
              <span>launch proof</span>
            </div>
          </div>

          <div className="launch-evidence-lanes">
            {decision.lanes.map((lane) => (
              <article key={lane.id}>
                <span>{lane.label}</span>
                <strong>{lane.score}</strong>
                <p>{lane.readiness}</p>
                <small>{lane.summary}</small>
              </article>
            ))}
          </div>

          <div className="launch-probe-columns">
            <section>
              <h3>
                <Radar size={15} />
                Live product proof
              </h3>
              <div>
                {liveEvidence.probes.map((probe) => (
                  <article key={probe.id} className={probe.status}>
                    <strong>{probe.label}</strong>
                    <span>
                      {probe.status} - {probe.score}
                    </span>
                    <p>{probe.evidence}</p>
                    <a href={probe.url} target="_blank" rel="noreferrer">
                      Evidence <ExternalLink size={13} />
                    </a>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ExternalLink size={15} />
                Submission URL proof
              </h3>
              <div>
                {externalEvidence.probes.map((probe) => (
                  <article key={probe.id} className={probe.status}>
                    <strong>{probe.label}</strong>
                    <span>
                      {probe.status} - {probe.score}
                    </span>
                    <p>{probe.evidence}</p>
                    {probe.url ? (
                      <a href={probe.url} target="_blank" rel="noreferrer">
                        Evidence <ExternalLink size={13} />
                      </a>
                    ) : (
                      <small>URL pending</small>
                    )}
                  </article>
                ))}
              </div>
            </section>
            {releaseDrift && (
              <section>
                <h3>
                  <Cloud size={15} />
                  Release drift proof
                </h3>
                <div>
                  {releaseDrift.probes.slice(0, 8).map((probe) => (
                    <article key={probe.id} className={probe.status}>
                      <strong>{probe.label}</strong>
                      <span>
                        {probe.status} - {probe.score}
                      </span>
                      <p>{probe.evidence}</p>
                      <a href={probe.url} target="_blank" rel="noreferrer">
                        Evidence <ExternalLink size={13} />
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="launch-action-board">
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Next actions
              </h3>
              <div className="launch-actions">
                {visibleActions.length > 0 ? (
                  visibleActions.map((action) => (
                    <article key={action.id} className={action.priority}>
                      <div>
                        <strong>{action.label}</strong>
                        <span>
                          {action.lane} - {action.priority}
                        </span>
                      </div>
                      <p>{action.action}</p>
                      <small>{action.proof}</small>
                    </article>
                  ))
                ) : (
                  <article className="clear">
                    <strong>All launch evidence is sealed</strong>
                    <p>Live product proof and final submission URLs are ready in the same receipt.</p>
                  </article>
                )}
              </div>
            </section>
            <section>
              <h3>
                <Terminal size={15} />
                Operator receipts
              </h3>
              <div className="launch-receipt-links">
                <a href="/api/healthz" target="_blank" rel="noreferrer">
                  Health API <ExternalLink size={13} />
                </a>
                <a href={externalPageHref} target="_blank" rel="noreferrer">
                  External page <ExternalLink size={13} />
                </a>
                <a href={deployRecoveryHref} target="_blank" rel="noreferrer">
                  Recovery page <ExternalLink size={13} />
                </a>
                <a href={exportHref} download="launch-evidence.md">
                  Export receipt <Download size={13} />
                </a>
              </div>
              <pre>{JSON.stringify({ readiness: decision.readiness, score: decision.evidenceScore, openGaps: decision.openGaps }, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="launch-evidence-empty">
          <div>
            <ShieldCheck size={30} />
            <strong>公開できるかを、同じ画面で再実行できる証拠にする。</strong>
            <p>{recommendation.selected.map((agent) => agent.name).join(" / ") || "Selected agents"} の出力を、買い手が確認できる公開証拠へ接続します。</p>
          </div>
          <div>
            <span>Checks</span>
            <strong>Live + release</strong>
            <p>Health, Agent Card, A2A artifact, CI, deployed revision, acceptance routes, ProtoPedia, and video.</p>
          </div>
        </div>
      )}
    </section>
  );
}
