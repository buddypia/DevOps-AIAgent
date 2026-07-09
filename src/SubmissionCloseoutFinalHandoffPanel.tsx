import { AlertTriangle, BadgeCheck, ClipboardCheck, Crosshair, Download, ExternalLink, Gauge, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { BuyerShareGateProofVerificationSummary } from "./buyerShareGate";
import type { CloseoutFinalSubmitHandoff } from "./submissionCloseout";
import { buildSubmissionFinalSubmitReceipt } from "./submissionFinalSubmitReceipt";

type SubmissionCloseoutFinalHandoffPanelProps = {
  handoff: CloseoutFinalSubmitHandoff;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function copyFinalHandoff(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

function liveStatusIcon(status: string) {
  if (status === "pass") return <BadgeCheck size={14} />;
  if (status === "watch") return <AlertTriangle size={14} />;
  return <Crosshair size={14} />;
}

export default function SubmissionCloseoutFinalHandoffPanel({ handoff }: SubmissionCloseoutFinalHandoffPanelProps) {
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "checked" | "failed">("idle");
  const [liveProof, setLiveProof] = useState<BuyerShareGateProofVerificationSummary | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [receiptVerifyStatus, setReceiptVerifyStatus] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [receiptVerifyMessage, setReceiptVerifyMessage] = useState("");
  const resultById = useMemo(() => new Map(liveProof?.results.map((result) => [result.id, result]) ?? []), [liveProof]);
  const finalSubmitReceipt = useMemo(() => (liveProof ? buildSubmissionFinalSubmitReceipt({ handoff, liveProof }) : null), [handoff, liveProof]);
  const liveSummary = liveProof
    ? `${liveProof.verifiedCount}/${liveProof.totalCount} public URLs reachable`
    : verifyStatus === "failed"
      ? verifyError || "Live URL check failed."
      : "Run the server-side reachability check before final submit.";
  const receiptVerifyLine =
    receiptVerifyStatus === "verified"
      ? receiptVerifyMessage || "Receipt checksum verified by the server."
      : receiptVerifyStatus === "failed"
        ? receiptVerifyMessage || "Receipt verification failed."
        : "Download or verify this receipt before final submission.";

  async function verifyFinalSubmitLinks() {
    if (verifyStatus === "checking") return;
    setVerifyStatus("checking");
    setVerifyError("");
    setReceiptVerifyStatus("idle");
    setReceiptVerifyMessage("");
    try {
      const response = await fetch(handoff.verifyApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: handoff.liveProofLinks })
      });
      const body = (await response.json()) as BuyerShareGateProofVerificationSummary | { error?: string };
      if (!response.ok) throw new Error("error" in body && body.error ? body.error : `Live URL check failed with HTTP ${response.status}.`);
      setLiveProof(body as BuyerShareGateProofVerificationSummary);
      setVerifyStatus("checked");
    } catch (error) {
      setLiveProof(null);
      setVerifyStatus("failed");
      setVerifyError(error instanceof Error ? error.message : "Live URL check failed.");
    }
  }

  async function verifyFinalSubmitReceipt() {
    if (!finalSubmitReceipt || receiptVerifyStatus === "checking") return;
    setReceiptVerifyStatus("checking");
    setReceiptVerifyMessage("Checking receipt checksum...");
    try {
      const response = await fetch(finalSubmitReceipt.verificationApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: finalSubmitReceipt.verificationRequestJson
      });
      const body = (await response.json()) as { verification?: { status?: string; instruction?: string }; error?: string };
      if (!response.ok || body.verification?.status !== "verified") {
        throw new Error(body.verification?.instruction || body.error || `Receipt verification failed with HTTP ${response.status}.`);
      }
      setReceiptVerifyStatus("verified");
      setReceiptVerifyMessage(body.verification.instruction || "Receipt checksum verified by the server.");
    } catch (error) {
      setReceiptVerifyStatus("failed");
      setReceiptVerifyMessage(error instanceof Error ? error.message : "Receipt verification failed.");
    }
  }

  return (
    <div className={cx("closeout-final-handoff", handoff.status)} aria-label="Findy final submission handoff">
      <section>
        <div>
          <span className={cx("risk-chip", handoff.status === "ready" ? "low" : handoff.status === "watch" ? "medium" : "high")}>
            {handoff.readiness}
          </span>
          <strong>{handoff.lockScore}</strong>
        </div>
        <h3>{handoff.headline}</h3>
        <p>{handoff.summary}</p>
        <small>
          {handoff.readyCount}/{handoff.fields.length} fields ready / deadline {handoff.deadline}
        </small>
        <div className="closeout-final-handoff-actions">
          <button type="button" onClick={() => copyFinalHandoff(handoff.exportMarkdown)}>
            <ClipboardCheck size={14} />
            Copy handoff
          </button>
          <a href={handoff.exportHref} download="findy-final-submission-handoff.md">
            <Download size={14} />
            Handoff
          </a>
        </div>
      </section>
      <div className="closeout-final-handoff-fields">
        {handoff.fields.map((field) => (
          <article key={field.id} className={field.status}>
            <div>
              <strong>{field.label}</strong>
              <span>{field.status}</span>
            </div>
            <small>{field.target}</small>
            <p>{field.value || "Pending external URL"}</p>
            <em>{field.acceptance}</em>
            {resultById.has(field.id) && (
              <small className={cx("closeout-final-handoff-live-evidence", resultById.get(field.id)?.status)}>
                {resultById.get(field.id)?.evidence}
              </small>
            )}
          </article>
        ))}
      </div>
      <div className="closeout-final-handoff-order" aria-label="Findy final paste order">
        <section className={cx("closeout-final-handoff-live", verifyStatus, Boolean(liveProof && liveProof.score >= 90) && "strong")}>
          <div>
            <span>
              <Gauge size={14} />
              Judge reachability
            </span>
            <strong>{liveProof ? `${liveProof.score}/100` : verifyStatus === "checking" ? "Checking" : "Not checked"}</strong>
          </div>
          <p>{liveSummary}</p>
          <button type="button" onClick={verifyFinalSubmitLinks} disabled={verifyStatus === "checking"}>
            <Gauge size={14} />
            {verifyStatus === "checking" ? "Checking URLs" : "Run live check"}
          </button>
          {liveProof && (
            <div className="closeout-final-handoff-live-results">
              {liveProof.results.map((result) => (
                <article key={result.id} className={result.status}>
                  <div>
                    <span>
                      {liveStatusIcon(result.status)}
                      {result.status}
                    </span>
                    <b>{result.httpStatus ?? "URL"}</b>
                  </div>
                  <strong>{result.label}</strong>
                  <p>{result.evidence}</p>
                  <small>{result.action}</small>
                </article>
              ))}
            </div>
          )}
          {finalSubmitReceipt && (
            <div className={cx("closeout-final-handoff-receipt", finalSubmitReceipt.status, receiptVerifyStatus === "verified" && "verified", receiptVerifyStatus === "failed" && "failed")}>
              <div>
                <span>
                  <ShieldCheck size={14} />
                  Submit receipt
                </span>
                <strong>{finalSubmitReceipt.status}</strong>
              </div>
              <p>{finalSubmitReceipt.summary}</p>
              <small>
                {finalSubmitReceipt.receiptId} / {finalSubmitReceipt.checksumAlgorithm}:{finalSubmitReceipt.checksum}
              </small>
              <div className="closeout-final-handoff-receipt-actions">
                <a href={finalSubmitReceipt.verificationRequestHref} download="findy-final-submit-live-receipt.json">
                  <Download size={14} />
                  Receipt JSON
                </a>
                <button type="button" onClick={verifyFinalSubmitReceipt} disabled={receiptVerifyStatus === "checking"}>
                  <ShieldCheck size={14} />
                  {receiptVerifyStatus === "checking" ? "Verifying" : "Verify receipt"}
                </button>
              </div>
              <em>{receiptVerifyLine}</em>
            </div>
          )}
        </section>
        {handoff.pasteOrder.map((step, index) => (
          <article key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </article>
        ))}
        <a href={handoff.exportHref} download="findy-final-submission-handoff.md">
          <ExternalLink size={14} />
          Download packet
        </a>
      </div>
    </div>
  );
}
