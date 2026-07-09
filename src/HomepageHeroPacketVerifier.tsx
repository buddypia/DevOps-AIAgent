import { useState, type MouseEvent } from "react";
import { AlertTriangle, BadgeCheck, ClipboardCheck, Download, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import type { HomepageOutcomeArtifactSnapshot, HomepageProofEntrySnapshot } from "./App";
import { downloadHrefFile, downloadJsonFile } from "./downloadArtifact";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusIcon(status: HomepageOutcomeArtifactSnapshot["packet"]["status"]) {
  if (status === "ready") return <BadgeCheck size={14} />;
  if (status === "attention") return <ShieldCheck size={14} />;
  return <AlertTriangle size={14} />;
}

function verifierHeadline(status: HomepageOutcomeArtifactSnapshot["packet"]["status"]) {
  if (status === "ready") return "Buyer packet is ready to verify before review";
  if (status === "attention") return "Verify the packet, then confirm the watch item";
  return "Verify the packet, but keep external review on hold";
}

function longReceiptDeskHref(requestJson: string) {
  const params = new URLSearchParams({
    request: requestJson,
    verify: "1"
  });
  return `/receipt-verifier?${params.toString()}`;
}

export function HomepageHeroPacketVerifier({
  artifact,
  proofEntry
}: {
  artifact: HomepageOutcomeArtifactSnapshot;
  proofEntry: HomepageProofEntrySnapshot;
}) {
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [verifyMessage, setVerifyMessage] = useState("Packet receipt not checked in this browser yet.");
  const verifierWorkbenchRequestKey = artifact.packet.receipt.receiptId;
  const verifierWorkbenchHref = longReceiptDeskHref(artifact.packet.receipt.verificationRequestJson);
  const sendRule =
    proofEntry.status === "ready"
      ? `Send: ${proofEntry.buyer} can inspect value, proof, and decision handoff.`
      : `Hold: ${proofEntry.nextMove.action.label} before the packet goes to an external reviewer.`;

  function openReceiptDesk(event: MouseEvent<HTMLAnchorElement>) {
    if (typeof window === "undefined") return;
    event.preventDefault();
    try {
      const storageKey = `receipt-verifier-request:${verifierWorkbenchRequestKey}`;
      window.sessionStorage.setItem(storageKey, artifact.packet.receipt.verificationRequestJson);
      window.localStorage.setItem(storageKey, artifact.packet.receipt.verificationRequestJson);
      window.location.assign(verifierWorkbenchHref);
    } catch {
      window.location.assign(verifierWorkbenchHref);
    }
  }

  async function verifyPacketReceipt() {
    if (verifyStatus === "checking") return;
    setVerifyStatus("checking");
    setVerifyMessage("Checking packet receipt checksum...");
    try {
      const response = await fetch(artifact.packet.receipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: artifact.packet.receipt.verificationRequestJson
      });
      const body = (await response.json()) as { verification?: { status?: string; instruction?: string; actualChecksum?: string }; error?: string };
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Packet receipt verification failed with HTTP ${response.status}.`);
      }
      setVerifyStatus("verified");
      setVerifyMessage(body.verification.instruction || `Checksum ${artifact.packet.receipt.checksum} matches the buyer packet replay payload.`);
    } catch (error) {
      setVerifyStatus("failed");
      setVerifyMessage(error instanceof Error ? error.message : "Packet receipt verification failed.");
    }
  }

  return (
    <section className={cx("homepage-hero-packet-verifier", `is-${artifact.packet.status}`, verifyStatus === "verified" && "has-verified")} aria-label="Live buyer packet verifier">
      <div className="homepage-hero-packet-verifier-main">
        <span>
          {statusIcon(artifact.packet.status)}
          Live packet verifier
        </span>
        <strong>{verifierHeadline(artifact.packet.status)}</strong>
        <p>
          {artifact.buyer} packet: {artifact.packet.readyCount}/{artifact.packet.itemCount} artifacts ready. Receipt {artifact.packet.receipt.receiptId} verifies through{" "}
          {artifact.packet.receipt.verificationApiPath}.
        </p>
      </div>
      <div className="homepage-hero-packet-verifier-actions" aria-label="Buyer packet verification actions">
        <button type="button" onClick={verifyPacketReceipt} disabled={verifyStatus === "checking"}>
          <ShieldCheck size={14} />
          {verifyStatus === "verified" ? "Verified" : verifyStatus === "checking" ? "Checking" : "Verify now"}
        </button>
        <button type="button" data-download={`${artifact.packet.receipt.receiptId}-verify.json`} data-download-filename={`${artifact.packet.receipt.receiptId}-verify.json`} onClick={() => downloadHrefFile(`${artifact.packet.receipt.receiptId}-verify.json`, artifact.packet.receipt.verificationRequestHref)}>
          <FileText size={14} />
          Request JSON
        </button>
        <button type="button" data-download={`${artifact.packet.receipt.receiptId}.json`} data-download-filename={`${artifact.packet.receipt.receiptId}.json`} onClick={() => downloadJsonFile(`${artifact.packet.receipt.receiptId}.json`, artifact.packet.receipt)}>
          <Download size={14} />
          Receipt
        </button>
        <a href={verifierWorkbenchHref} onClick={openReceiptDesk}>
          <ExternalLink size={14} />
          Receipt desk
        </a>
      </div>
      <div className={cx("homepage-hero-packet-verifier-result", verifyStatus === "verified" && "is-confirmed", verifyStatus === "failed" && "is-risk")} aria-live="polite">
        <span>{verifyStatus === "idle" ? artifact.packet.status : verifyStatus}</span>
        <strong>{verifyStatus === "verified" ? `Checksum ${artifact.packet.receipt.checksum} verified` : sendRule}</strong>
        <small>{verifyMessage}</small>
      </div>
      <div className="homepage-hero-packet-verifier-proof" aria-label="Packet proof facts">
        <span>
          <ClipboardCheck size={13} />
          {artifact.packet.itemCount} packet artifacts
        </span>
        <span>{artifact.packet.receipt.checksumAlgorithm}:{artifact.packet.receipt.checksum}</span>
        <span>{proofEntry.decisionHandoff.recommendedDecision} decision handoff</span>
      </div>
    </section>
  );
}

export default HomepageHeroPacketVerifier;
