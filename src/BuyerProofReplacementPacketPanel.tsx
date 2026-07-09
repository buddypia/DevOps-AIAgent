import { AlertTriangle, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildBuyerProofReplacementPacket, type BuyerProofReplacementPacketInput, type BuyerProofReplacementStatus } from "./buyerProofReplacementPacket.js";
import { downloadHrefFile, downloadTextFile } from "./downloadArtifact";

type BuyerProofReplacementLiveVerifyStatus = "idle" | "checking" | "checked" | "failed";

type BuyerProofReplacementPacketPanelProps = BuyerProofReplacementPacketInput & {
  proofVerifyStatus: BuyerProofReplacementLiveVerifyStatus;
  proofVerifyError: string;
  onVerifyProofLinks: () => void;
  onCopyText: (text: string) => Promise<boolean>;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function iconFor(status: BuyerProofReplacementStatus) {
  if (status === "ready") return <ShieldCheck size={14} />;
  if (status === "attention") return <Wrench size={14} />;
  return <Crosshair size={14} />;
}

function routeActionAttrs(action: { external: boolean }) {
  return action.external ? { target: "_blank", rel: "noreferrer" } : {};
}

function liveVerifyLabel(status: BuyerProofReplacementLiveVerifyStatus, mode: "send" | "verify" | "replace") {
  if (status === "checking") return "Checking links";
  if (status === "failed") return "Check failed";
  if (mode === "send") return "Recheck live links";
  return "Verify live links";
}

export default function BuyerProofReplacementPacketPanel({
  workspace,
  referenceWorkspace,
  proofVerification,
  workflowIntakeHref,
  currentAuditHref,
  launchRoomHref,
  proofVerifyStatus,
  proofVerifyError,
  onVerifyProofLinks,
  onCopyText
}: BuyerProofReplacementPacketPanelProps) {
  const packet = useMemo(
    () =>
      buildBuyerProofReplacementPacket({
        workspace,
        referenceWorkspace,
        proofVerification,
        workflowIntakeHref,
        currentAuditHref,
        launchRoomHref
      }),
    [currentAuditHref, launchRoomHref, proofVerification, referenceWorkspace, workflowIntakeHref, workspace]
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [messageCopyStatus, setMessageCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [handoffCopyStatus, setHandoffCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [receiptVerifyStatus, setReceiptVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [receiptVerifyMessage, setReceiptVerifyMessage] = useState("");
  const copyLabel = copyStatus === "copied" ? "Copied packet" : copyStatus === "failed" ? "Copy failed" : "Copy packet";
  const messageCopyLabel = messageCopyStatus === "copied" ? "Copied message" : messageCopyStatus === "failed" ? "Copy failed" : "Copy message";
  const handoffCopyLabel =
    handoffCopyStatus === "copied" ? "Copied handoff" : handoffCopyStatus === "failed" ? "Copy failed" : packet.mode === "send" ? "Copy handoff" : "Copy hold note";
  const receiptVerifyLabel = receiptVerifyStatus === "checking" ? "Checking receipt" : receiptVerifyStatus === "verified" ? "Receipt verified" : receiptVerifyStatus === "failed" ? "Verify failed" : "Verify receipt";
  const liveVerificationBlocked = packet.mode === "replace";
  const liveVerificationLabel = liveVerifyLabel(proofVerifyStatus, packet.mode);
  const liveVerificationLine = liveVerificationBlocked
    ? "Replace blocked proof rows before live verification."
    : proofVerifyStatus === "failed"
      ? proofVerifyError || "Live verification failed."
      : proofVerification
        ? `${proofVerification.verifiedCount}/${proofVerification.totalCount} live links verified.`
        : "Run live verification from this packet before sending.";
  useEffect(() => {
    setReceiptVerifyStatus("idle");
    setReceiptVerifyMessage("");
  }, [packet.receipt.checksum]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (messageCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setMessageCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [messageCopyStatus]);

  useEffect(() => {
    if (handoffCopyStatus === "idle") return;
    const timeout = window.setTimeout(() => setHandoffCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [handoffCopyStatus]);

  const copyPacket = async () => {
    const copied = await onCopyText(packet.copyText);
    setCopyStatus(copied ? "copied" : "failed");
  };

  const copyMessage = async () => {
    const copied = await onCopyText(packet.reviewMessage.copyText);
    setMessageCopyStatus(copied ? "copied" : "failed");
  };

  const copyHandoff = async () => {
    const copied = await onCopyText(packet.buyerHandoff.copyText);
    setHandoffCopyStatus(copied ? "copied" : "failed");
  };

  const verifyReceipt = async () => {
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
        setReceiptVerifyMessage(`Checksum ${result.verification.actualChecksum} matches this replacement packet.`);
        return;
      }
      setReceiptVerifyStatus("failed");
      setReceiptVerifyMessage(result?.verification?.instruction ?? result?.error ?? "Receipt verification failed.");
    } catch {
      setReceiptVerifyStatus("failed");
      setReceiptVerifyMessage("Receipt verification could not reach the local verification API.");
    }
  };

  return (
    <section className={cx("buyer-proof-replacement-packet", `is-${packet.status}`)} aria-label="Buyer proof replacement packet">
      <div className="buyer-proof-replacement-main">
        <span>Replacement packet</span>
        <strong>{packet.headline}</strong>
        <p>{packet.summary}</p>
        <div className="buyer-proof-replacement-actions" aria-label="Buyer proof replacement actions">
          <a className="buyer-proof-replacement-primary" href={packet.primaryAction.href} {...routeActionAttrs(packet.primaryAction)}>
            {iconFor(packet.status)}
            {packet.primaryAction.label}
          </a>
          <button
            className={cx("icon-link", Boolean(proofVerification) && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")}
            type="button"
            onClick={onVerifyProofLinks}
            disabled={liveVerificationBlocked || proofVerifyStatus === "checking"}
          >
            <Gauge size={14} />
            {liveVerificationLabel}
          </button>
          <button className={cx("icon-link", copyStatus === "copied" && "is-confirmed", copyStatus === "failed" && "is-risk")} type="button" onClick={copyPacket}>
            <ClipboardCheck size={14} />
            {copyLabel}
          </button>
          <button className="icon-link" type="button" data-download="buyer-proof-replacement-packet.md" data-download-filename="buyer-proof-replacement-packet.md" onClick={() => downloadTextFile("buyer-proof-replacement-packet.md", packet.exportMarkdown)}>
            <Download size={14} />
            Export packet
          </button>
          <button className="icon-link" type="button" data-download="buyer-proof-replacement-ledger.csv" data-download-filename="buyer-proof-replacement-ledger.csv" onClick={() => downloadTextFile("buyer-proof-replacement-ledger.csv", packet.csv, "text/csv;charset=utf-8")}>
            <Download size={14} />
            Export CSV
          </button>
          <em className={cx("buyer-proof-replacement-live-status", Boolean(proofVerification) && "is-confirmed", proofVerifyStatus === "failed" && "is-risk")}>{liveVerificationLine}</em>
        </div>
      </div>
      <aside className="buyer-proof-replacement-score" aria-label="Buyer proof replacement score">
        <span>{packet.mode}</span>
        <strong>{packet.readyCount}/{packet.totalCount}</strong>
        <small>{packet.packetId}</small>
      </aside>
      <div className="buyer-proof-replacement-message" aria-label="Buyer review message">
        <div>
          <span>Buyer review message</span>
          <strong>{packet.reviewMessage.subject}</strong>
          <p>{packet.reviewMessage.lines[1]}</p>
        </div>
        <button className={cx("icon-link", messageCopyStatus === "copied" && "is-confirmed", messageCopyStatus === "failed" && "is-risk")} type="button" onClick={copyMessage}>
          <ClipboardCheck size={14} />
          {messageCopyLabel}
        </button>
      </div>
      <div className="buyer-proof-replacement-send-packet" aria-label="Buyer send packet">
        <div>
          <span>Buyer send packet</span>
          <strong>{packet.sendPacket.headline}</strong>
          <p>{packet.sendPacket.detail}</p>
          <small>Next: {packet.sendPacket.nextAction}</small>
          <button className={cx("icon-link", handoffCopyStatus === "copied" && "is-confirmed", handoffCopyStatus === "failed" && "is-risk")} type="button" onClick={copyHandoff}>
            <ClipboardCheck size={14} />
            {handoffCopyLabel}
          </button>
        </div>
        <ol>
          {packet.sendPacket.steps.map((step) => (
            <li key={step.id} className={step.status}>
              <span>
                {iconFor(step.status)}
                {step.label}
              </span>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="buyer-proof-replacement-delivery-assets" aria-label="Buyer delivery assets">
          <span>Delivery assets</span>
          <strong>{packet.buyerHandoff.subject}</strong>
          <p>{packet.buyerHandoff.preview}</p>
          <ul>
            {packet.buyerHandoff.assets.map((asset) => (
              <li key={asset.id} className={asset.status}>
                <span>
                  {iconFor(asset.status)}
                  {asset.label}
                </span>
                <p>{asset.detail}</p>
                {asset.id === "review-message" ? (
                  <button type="button" onClick={copyHandoff}>
                    {asset.action}
                    <ClipboardCheck size={12} />
                  </button>
                ) : (
                  <a href={asset.href} {...routeActionAttrs({ external: asset.external })}>
                    {asset.action}
                    <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="buyer-proof-replacement-receipt" aria-label="Replacement packet receipt">
        <div>
          <span>Replay receipt</span>
          <strong>{packet.receipt.checksum}</strong>
          <small>POST {packet.receipt.verificationApiPath}</small>
          {receiptVerifyMessage && <small className={cx("receipt-status", receiptVerifyStatus === "verified" && "is-confirmed", receiptVerifyStatus === "failed" && "is-risk")}>{receiptVerifyMessage}</small>}
        </div>
        <button className={cx("icon-link", receiptVerifyStatus === "verified" && "is-confirmed", receiptVerifyStatus === "failed" && "is-risk")} type="button" onClick={verifyReceipt} disabled={receiptVerifyStatus === "checking"}>
          {receiptVerifyStatus === "failed" ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
          {receiptVerifyLabel}
        </button>
        <button className="icon-link" type="button" data-download="buyer-proof-replacement-receipt.md" data-download-filename="buyer-proof-replacement-receipt.md" onClick={() => downloadHrefFile("buyer-proof-replacement-receipt.md", packet.receipt.href)}>
          <Download size={14} />
          Receipt
        </button>
        <button className="icon-link" type="button" data-download="buyer-proof-replacement-receipt-payload.json" data-download-filename="buyer-proof-replacement-receipt-payload.json" onClick={() => downloadHrefFile("buyer-proof-replacement-receipt-payload.json", packet.receipt.payloadHref)}>
          <Download size={14} />
          Payload
        </button>
        <button className="icon-link" type="button" data-download="buyer-proof-replacement-receipt-verify-request.json" data-download-filename="buyer-proof-replacement-receipt-verify-request.json" onClick={() => downloadHrefFile("buyer-proof-replacement-receipt-verify-request.json", packet.receipt.verificationRequestHref)}>
          <Download size={14} />
          Verify JSON
        </button>
      </div>
      <div className="buyer-proof-replacement-items" aria-label="Replacement proof rows">
        {packet.items.map((item) => (
          <a key={item.id} className={item.status} href={item.href} {...routeActionAttrs({ external: /^https?:\/\//i.test(item.href) })}>
            <span>
              {iconFor(item.status)}
              {item.label}
            </span>
            <strong>{item.displayValue}</strong>
            <p>{item.evidence}</p>
            <small>
              {item.owner}: {item.action}
            </small>
            <em>
              Open detail <ExternalLink size={12} />
            </em>
          </a>
        ))}
      </div>
    </section>
  );
}
