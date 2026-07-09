import { CheckCircle2, ClipboardCheck, Download, ExternalLink, FileText, Film, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProtoPediaPublisher, ProtoPediaPublisherLiveAudit } from "./publisher";
import { isBuyerFacingProofUrl, PUBLIC_PROOF_INPUT_PLACEHOLDERS } from "./publicProofUrl";
import { SUBMISSION_PROOF, validProtoPediaUrl, validVideoUrl } from "./submission";
import type { Recommendation } from "./types";

type SubmissionPublisherPanelProps = {
  recommendation: Recommendation;
  projectBrief: string;
  targetUrl?: string;
  protopediaUrl?: string;
  videoUrl?: string;
  onTargetUrlChange?: (value: string) => void;
  onProtopediaUrlChange?: (value: string) => void;
  onVideoUrlChange?: (value: string) => void;
};

type PublisherUrlFieldId = "targetUrl" | "protopediaUrl" | "videoUrl";

type PublisherUrlInput = Record<PublisherUrlFieldId, string>;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function publisherUrlStatus(id: PublisherUrlFieldId, value: string) {
  if (id === "targetUrl") return isBuyerFacingProofUrl(value) ? "ready" : "watch";
  if (id === "protopediaUrl") return validProtoPediaUrl(value) ? "ready" : "watch";
  return validVideoUrl(value) ? "ready" : "watch";
}

function samePublisherUrls(left: PublisherUrlInput, right: PublisherUrlInput) {
  return left.targetUrl === right.targetUrl && left.protopediaUrl === right.protopediaUrl && left.videoUrl === right.videoUrl;
}

export default function SubmissionPublisherPanel({
  recommendation,
  projectBrief,
  targetUrl = "",
  protopediaUrl = "",
  videoUrl = "",
  onTargetUrlChange,
  onProtopediaUrlChange,
  onVideoUrlChange
}: SubmissionPublisherPanelProps) {
  const [publisherUrls, setPublisherUrls] = useState<PublisherUrlInput>({ targetUrl, protopediaUrl, videoUrl });
  const [publisher, setPublisher] = useState<ProtoPediaPublisher | null>(null);
  const [liveAudit, setLiveAudit] = useState<ProtoPediaPublisherLiveAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState("");
  const [auditError, setAuditError] = useState("");
  const [copiedPublisherItemId, setCopiedPublisherItemId] = useState("");
  const selectedAgentIds = useMemo(() => recommendation.selected.map((agent) => agent.id), [recommendation]);
  const publisherUrlPayload = useMemo(
    () => ({
      targetUrl: publisherUrls.targetUrl.trim(),
      protopediaUrl: publisherUrls.protopediaUrl.trim(),
      videoUrl: publisherUrls.videoUrl.trim()
    }),
    [publisherUrls.protopediaUrl, publisherUrls.targetUrl, publisherUrls.videoUrl]
  );
  const publisherUrlFields = useMemo(
    () =>
      [
        {
          id: "targetUrl",
          label: "Deployed URL",
          placeholder: SUBMISSION_PROOF.deployedUrl,
          value: publisherUrls.targetUrl,
          status: publisherUrlStatus("targetUrl", publisherUrls.targetUrl)
        },
        {
          id: "protopediaUrl",
          label: "ProtoPedia URL",
          placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.protopediaUrl,
          value: publisherUrls.protopediaUrl,
          status: publisherUrlStatus("protopediaUrl", publisherUrls.protopediaUrl)
        },
        {
          id: "videoUrl",
          label: "Walkthrough video URL",
          placeholder: PUBLIC_PROOF_INPUT_PLACEHOLDERS.videoUrl,
          value: publisherUrls.videoUrl,
          status: publisherUrlStatus("videoUrl", publisherUrls.videoUrl)
        }
      ] as const,
    [publisherUrls.protopediaUrl, publisherUrls.targetUrl, publisherUrls.videoUrl]
  );
  const readyPublisherUrlCount = publisherUrlFields.filter((field) => field.status === "ready").length;

  function clearPublisherOutputs() {
    setPublisher(null);
    setLiveAudit(null);
    setError("");
    setAuditError("");
    setCopiedPublisherItemId("");
  }

  useEffect(() => {
    const nextUrls = { targetUrl, protopediaUrl, videoUrl };
    setPublisherUrls((current) => (samePublisherUrls(current, nextUrls) ? current : nextUrls));
    setPublisher(null);
    setLiveAudit(null);
    setError("");
    setAuditError("");
  }, [protopediaUrl, targetUrl, videoUrl]);

  function updatePublisherUrl(id: PublisherUrlFieldId, value: string) {
    clearPublisherOutputs();
    setPublisherUrls((current) => ({ ...current, [id]: value }));
    if (id === "targetUrl") onTargetUrlChange?.(value);
    if (id === "protopediaUrl") onProtopediaUrlChange?.(value);
    if (id === "videoUrl") onVideoUrlChange?.(value);
  }

  async function buildPublisher() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/publisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds,
          ...publisherUrlPayload
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPublisher((await response.json()) as ProtoPediaPublisher);
      setLiveAudit(null);
      setAuditError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function runLiveAudit() {
    if (!publisher) return;
    setAuditing(true);
    setAuditError("");
    try {
      const response = await fetch("/api/publisher/live-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief,
          selectedAgentIds,
          ...publisherUrlPayload
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLiveAudit((await response.json()) as ProtoPediaPublisherLiveAudit);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setAuditing(false);
    }
  }

  async function copyPublisherItem(id: string, value: string) {
    if (!value.trim()) return;
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedPublisherItemId(id);
    } catch {
      setCopiedPublisherItemId(`failed:${id}`);
    }
  }

  return (
    <section className="submission-publisher">
      <div className="publisher-heading">
        <div>
          <span className="eyebrow">Submission publisher</span>
          <h2>
            <FileText size={20} />
            ProtoPedia paste kit
          </h2>
        </div>
        <button className="icon-button" onClick={buildPublisher} disabled={loading} title="提出本文を生成">
          <ClipboardCheck size={17} />
          {loading ? "Building" : "Build publisher"}
        </button>
      </div>

      <section className="publisher-url-desk" aria-label="Submission URLs">
        <div>
          <span className="eyebrow">Public URL intake</span>
          <strong>Submission URLs</strong>
          <span className={cx("risk-chip", readyPublisherUrlCount === publisherUrlFields.length ? "low" : "medium")}>
            {readyPublisherUrlCount}/{publisherUrlFields.length} ready
          </span>
        </div>
        <div className="publisher-url-fields">
          {publisherUrlFields.map((field) => (
            <label key={field.id}>
              <span>
                {field.label}
                <em className={cx("risk-chip", field.status === "ready" ? "low" : "medium")}>{field.status}</em>
              </span>
              <input
                value={field.value}
                onChange={(event) => updatePublisherUrl(field.id, event.target.value)}
                placeholder={field.placeholder}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
          ))}
        </div>
      </section>

      {error && <p className="error-text">Publisher request failed: {error}</p>}

      {publisher ? (
        <div className="publisher-body">
          <div className="publisher-summary">
            <div>
              <span className={cx("risk-chip", publisher.readiness === "ready-to-register" ? "low" : "medium")}>{publisher.readiness}</span>
              <h3>{publisher.summary}</h3>
              <p>ProtoPediaに貼る本文、タグ、URL、動画台本、残ギャップを1つの提出パッケージにします。</p>
              <div className="publisher-live-actions" aria-label="Publisher live audit controls">
                <button type="button" className="icon-link publisher-copy-button" onClick={runLiveAudit} disabled={auditing}>
                  <ShieldCheck size={14} />
                  {auditing ? "Auditing URLs" : "Run live audit"}
                </button>
                {liveAudit && (
                  <a className="icon-link" href={liveAudit.verificationRequestHref} download={`${liveAudit.receiptId}.json`}>
                    <Download size={14} />
                    Audit receipt
                  </a>
                )}
                {liveAudit && (
                  <a className="icon-link" href={liveAudit.verificationDeskHref} target="_blank" rel="noreferrer">
                    <ShieldCheck size={14} />
                    Verify audit
                  </a>
                )}
              </div>
              {auditError && <p className="error-text">Live audit failed: {auditError}</p>}
            </div>
            <div className="publisher-score">
              <strong>{publisher.publishScore}</strong>
              <span>publish score</span>
            </div>
          </div>

          {liveAudit && (
            <section className={cx("publisher-live-audit", liveAudit.liveReadiness)} aria-label="Publisher live URL audit">
              <div className="publisher-live-audit-main">
                <span className={cx("risk-chip", liveAudit.liveReadiness === "live-ready" ? "low" : "high")}>{liveAudit.liveReadiness}</span>
                <strong>{liveAudit.headline}</strong>
                <p>{liveAudit.summary}</p>
                <small>
                  {liveAudit.receiptId} / {liveAudit.checksumAlgorithm}:{liveAudit.checksum}
                </small>
              </div>
              <div className="publisher-live-audit-score" aria-label="Publisher live audit score">
                <strong>{liveAudit.score}</strong>
                <span>live score</span>
                <small>
                  {liveAudit.verifiedCount}/{liveAudit.totalCount} URLs verified
                </small>
                <small>{liveAudit.checkedAt || "not checked"}</small>
              </div>
              <div className="publisher-live-audit-rows" aria-label="Publisher live audit rows">
                {liveAudit.rows.map((row) => (
                  <article key={row.id} className={row.status}>
                    <div>
                      <strong>{row.label}</strong>
                      <span>{row.status}</span>
                    </div>
                    <p>{row.evidence}</p>
                    <small>{row.url || "Missing public URL"}</small>
                    <em>{row.action}</em>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className={cx("publisher-copy-tray", publisher.copyTray.readiness)} aria-label="Submission copy tray">
            <header>
              <div>
                <span className={cx("risk-chip", publisher.copyTray.readiness === "ready-to-submit" ? "low" : publisher.copyTray.readiness === "copy-ready-needs-external-urls" ? "medium" : "high")}>
                  {publisher.copyTray.readiness}
                </span>
                <h3>
                  <ClipboardCheck size={16} />
                  Submission copy tray
                </h3>
                <p>
                  {publisher.copyTray.requiredReadyCount}/{publisher.copyTray.requiredTotalCount} required items ready. Missing: {publisher.copyTray.requiredGaps.join(", ") || "none"}.
                </p>
              </div>
              <a className="icon-link" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(publisher.copyTray.exportMarkdown)}`} download="protopedia-submission-copy-tray.md">
                <Download size={15} />
                Export tray
              </a>
            </header>
            <div className="publisher-copy-items">
              {publisher.copyTray.items
                .slice()
                .sort((left, right) => left.order - right.order)
                .map((item) => {
                  const copied = copiedPublisherItemId === item.id;
                  const failed = copiedPublisherItemId === `failed:${item.id}`;
                  return (
                    <article key={item.id} className={item.status}>
                      <div>
                        <span>{item.order}</span>
                        <strong>{item.label}</strong>
                        <small>{item.required ? "required" : "supporting"}</small>
                      </div>
                      <p>{item.copyHint}</p>
                      <pre>{item.value || "Pending external URL"}</pre>
                      <button type="button" className="icon-link publisher-copy-button" disabled={!item.value.trim()} onClick={() => copyPublisherItem(item.id, item.value)}>
                        {copied ? <CheckCircle2 size={14} /> : <ClipboardCheck size={14} />}
                        {copied ? "Copied" : failed ? "Copy failed" : "Copy"}
                      </button>
                    </article>
                  );
                })}
            </div>
          </section>

          <div className="publisher-quality-lock">
            <section>
              <div>
                <span className={cx("risk-chip", publisher.qualityLock.readiness === "submit-page-ready" ? "low" : publisher.qualityLock.readiness === "copy-locked" ? "medium" : "high")}>
                  {publisher.qualityLock.readiness}
                </span>
                <strong>{publisher.qualityLock.qualityScore}</strong>
              </div>
              <h3>ProtoPedia Quality Lock</h3>
              <p>{publisher.qualityLock.headline}</p>
              <small>{publisher.qualityLock.pasteOrder.join(" -> ")}</small>
            </section>
            <div>
              {publisher.qualityLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="publisher-quality-lock">
            <section>
              <div>
                <span
                  className={cx(
                    "risk-chip",
                    publisher.policyLock.readiness === "publication-ready"
                      ? "low"
                      : publisher.policyLock.readiness === "prototype-copy-locked"
                        ? "medium"
                        : "high"
                  )}
                >
                  {publisher.policyLock.readiness}
                </span>
                <strong>{publisher.policyLock.policyScore}</strong>
              </div>
              <h3>ProtoPedia Policy Lock</h3>
              <p>{publisher.policyLock.headline}</p>
              <small>{publisher.policyLock.sourceUrls.join(" -> ")}</small>
            </section>
            <div>
              {publisher.policyLock.checks.map((check) => (
                <article key={check.id} className={check.status}>
                  <div>
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.acceptance}</p>
                  <small>{check.proof}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="publisher-fields">
            {publisher.pasteFields.map((field) => (
              <article key={field.id} className={field.status}>
                <div>
                  <strong>{field.label}</strong>
                  <span>{field.status}</span>
                </div>
                <small>{field.copyHint}</small>
                <pre>{field.value}</pre>
              </article>
            ))}
          </div>

          <div className="publisher-grid">
            <section>
              <h3>
                <ExternalLink size={15} />
                Assets
              </h3>
              <div className="publisher-assets">
                {publisher.assets.map((asset) => (
                  <article key={asset.id} className={asset.status}>
                    <div>
                      <strong>{asset.label}</strong>
                      <span>{asset.status}</span>
                    </div>
                    <p>{asset.proof}</p>
                    {asset.url && (
                      <a href={asset.url} target="_blank" rel="noreferrer">
                        Open <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <ClipboardCheck size={15} />
                Final checklist
              </h3>
              <div className="publisher-checklist">
                {publisher.finalChecklist.map((item) => (
                  <article key={item.id} className={item.status}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.status}</span>
                    </div>
                    <p>{item.action}</p>
                    <small>{item.proof}</small>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <h3>
                <Film size={15} />
                Recording script
              </h3>
              <pre>{publisher.recordingScript}</pre>
              <h3>
                <ShieldCheck size={15} />
                A2A payload
              </h3>
              <pre>{JSON.stringify(publisher.a2aPayload, null, 2)}</pre>
            </section>
          </div>
        </div>
      ) : (
        <div className="publisher-empty">
          <FileText size={28} />
          <strong>Build publisherで、ProtoPediaに貼る本文、タグ、URL、動画台本、未完了項目を生成します。</strong>
          <p>外部登録作業を、提出直前のチェックリストまで落とします。</p>
        </div>
      )}
    </section>
  );
}
