import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, FileText, Gauge, Rocket, ShieldCheck, Workflow } from "lucide-react";
import type { HomepageOutcomeArtifactAction, HomepageOutcomeArtifactSnapshot, HomepageOutcomeArtifactStatus } from "./App";
import { downloadHrefFile, downloadJsonFile, downloadTextFile } from "./downloadArtifact";
import "./HomepageOutcomeArtifactPanel.css";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function routeActionAttrs(action: HomepageOutcomeArtifactAction) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function outcomeStatusFromProof(status: HomepageOutcomeArtifactStatus) {
  if (status === "ready") return <BadgeCheck size={15} />;
  if (status === "attention") return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

function proofStatusClass(status: "pass" | "watch" | "block") {
  if (status === "pass") return "ready";
  if (status === "watch") return "attention";
  return "blocked";
}

export function HomepageOutcomeArtifactPanel({
  snapshot,
  onCopyText
}: {
  snapshot: HomepageOutcomeArtifactSnapshot;
  onCopyText: (text: string) => Promise<boolean>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [verifyMessage, setVerifyMessage] = useState("Packet receipt not checked in this browser yet.");

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  async function copyArtifact() {
    const copied = await onCopyText(snapshot.exportMarkdown);
    setCopyStatus(copied ? "copied" : "failed");
  }

  async function verifyPacketReceipt() {
    if (verifyStatus === "checking") return;
    setVerifyStatus("checking");
    setVerifyMessage("Checking packet receipt checksum...");
    try {
      const response = await fetch(snapshot.packet.receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: snapshot.packet.receipt.verificationRequestJson
      });
      const body = (await response.json()) as { verification?: { status?: string; instruction?: string }; error?: string };
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Packet receipt verification failed with HTTP ${response.status}.`);
      }
      setVerifyStatus("verified");
      setVerifyMessage(body.verification.instruction || "Packet receipt checksum verified.");
    } catch (error) {
      setVerifyStatus("failed");
      setVerifyMessage(error instanceof Error ? error.message : "Packet receipt verification failed.");
    }
  }

  return (
    <section className={cx("homepage-outcome-artifact", `is-${snapshot.status}`)} aria-labelledby="homepage-outcome-artifact-title">
      <div className="homepage-outcome-artifact-main">
        <span>Buyer-facing artifact</span>
        <h2 id="homepage-outcome-artifact-title">
          <FileText size={20} />
          {snapshot.headline}
        </h2>
        <p>{snapshot.valueClaim}</p>
        <div className="homepage-outcome-artifact-actions" aria-label="Buyer outcome artifact actions">
          <a className="homepage-outcome-artifact-primary" href={snapshot.primaryAction.href} {...routeActionAttrs(snapshot.primaryAction)}>
            {snapshot.status === "blocked" ? <Crosshair size={14} /> : <ExternalLink size={14} />}
            {snapshot.primaryAction.label}
          </a>
          <a className="homepage-outcome-artifact-link" href={snapshot.workflowAction.href} {...routeActionAttrs(snapshot.workflowAction)}>
            <Workflow size={14} />
            Paste workflow
          </a>
          <a className="homepage-outcome-artifact-link" href={snapshot.launchRoomAction.href} {...routeActionAttrs(snapshot.launchRoomAction)}>
            <Rocket size={14} />
            Launch room
          </a>
          <button className={cx("homepage-outcome-artifact-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyArtifact}>
            <ClipboardCheck size={14} />
            {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Failed" : "Copy brief"}
          </button>
          <button type="button" className="homepage-outcome-artifact-link" data-download-filename="buyer-outcome-artifact.md" onClick={() => downloadTextFile("buyer-outcome-artifact.md", snapshot.exportMarkdown)}>
            <Download size={14} />
            Export
          </button>
        </div>
      </div>
      <aside className="homepage-outcome-artifact-score" aria-label="Buyer artifact score">
        <span>{snapshot.decision}</span>
        <strong>{snapshot.score}</strong>
        <small>{snapshot.decisionAsk}</small>
      </aside>
      <div className={cx("homepage-outcome-artifact-packet", snapshot.packet.status)} aria-label="What the user gets">
        <div>
          <span>
            <ClipboardCheck size={14} />
            What the user gets
          </span>
          <strong>{snapshot.packet.headline}</strong>
          <p>{snapshot.packet.summary}</p>
        </div>
        <div className="homepage-outcome-artifact-packet-count" aria-label="Buyer packet readiness">
          <span>Packet readiness</span>
          <strong>
            {snapshot.packet.readyCount}/{snapshot.packet.itemCount}
          </strong>
          <small>{snapshot.packet.status === "ready" ? "sendable" : snapshot.packet.status === "attention" ? "review first" : "internal only"}</small>
          <button type="button" className="homepage-outcome-artifact-packet-receipt" data-download-filename={`${snapshot.packet.receipt.receiptId}.json`} onClick={() => downloadJsonFile(`${snapshot.packet.receipt.receiptId}.json`, snapshot.packet.receipt)}>
            <Download size={14} />
            Packet receipt
          </button>
          <button className="homepage-outcome-artifact-packet-verify" type="button" onClick={verifyPacketReceipt} disabled={verifyStatus === "checking"}>
            <ShieldCheck size={14} />
            {verifyStatus === "verified" ? "Verified" : verifyStatus === "checking" ? "Checking" : "Verify packet"}
          </button>
          <button
            type="button"
            className="homepage-outcome-artifact-packet-receipt"
            data-download-filename={`${snapshot.packet.receipt.receiptId}-verify.json`}
            onClick={() => downloadHrefFile(`${snapshot.packet.receipt.receiptId}-verify.json`, snapshot.packet.receipt.verificationRequestHref)}
          >
            <FileText size={14} />
            Verify JSON
          </button>
          <small className="homepage-outcome-artifact-packet-endpoint">POST {snapshot.packet.receipt.verificationApiPath}</small>
          <small className={cx("homepage-outcome-artifact-packet-status", verifyStatus === "verified" && "is-confirmed", verifyStatus === "failed" && "is-risk")}>
            {verifyMessage}
          </small>
        </div>
        <div className="homepage-outcome-artifact-packet-items" aria-label="Buyer packet contents">
          {snapshot.packet.items.map((item) => (
            <a key={item.id} className={item.status} href={item.href}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.proof}</p>
              <small>{item.actionLabel}</small>
            </a>
          ))}
        </div>
      </div>
      <div className="homepage-outcome-artifact-metrics" aria-label="Buyer outcome artifact metrics">
        {snapshot.metrics.map((metric) => (
          <article key={metric.id} className={metric.status}>
            <span>
              {outcomeStatusFromProof(metric.status)}
              {metric.label}
            </span>
            <strong>{metric.value}</strong>
            <p>{metric.evidence}</p>
          </article>
        ))}
      </div>
      <div className="homepage-outcome-artifact-redlines" aria-label="Buyer artifact red lines">
        <span>{snapshot.redLines.length ? "Buyer blockers" : "Buyer blockers clear"}</span>
        {snapshot.redLines.length ? (
          snapshot.redLines.map((line) => (
            <a key={line.id} className={proofStatusClass(line.status)} href={line.href}>
              <strong>{line.label}</strong>
              <p>{line.action}</p>
              <small>{line.owner}</small>
            </a>
          ))
        ) : (
          <div>
            <BadgeCheck size={16} />
            <strong>No blocked buyer proof checks.</strong>
            <p>The outcome brief can be used as the first external review artifact.</p>
          </div>
        )}
      </div>
    </section>
  );
}
