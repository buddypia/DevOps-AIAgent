import {
  BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
  verifyBuyerTrustManifestReceipt,
  type BuyerTrustManifestPayload,
  type BuyerTrustManifestPublicationDecision,
  type BuyerTrustManifestPublicationWindowStatus,
  type BuyerTrustManifestReadiness,
  type BuyerTrustManifestStatus
} from "./buyerTrustManifest.js";

export const BUYER_PROOF_VERIFIER_API_PATH = "/api/buyer-proof-verifier";

export type BuyerProofVerifierStatus = "verified" | "attention" | "blocked";
export type BuyerProofVerifierDecision = "share" | "repair" | "hold";
export type BuyerProofVerifierCheckId =
  | "manifest-digest"
  | "manifest-receipt"
  | "artifact-index"
  | "proof-packet-digest"
  | "upstream-receipts"
  | "publication-gate"
  | "review-window"
  | "public-artifact-hrefs";

export type BuyerProofVerifierManifestArtifact = {
  id: string;
  status: BuyerTrustManifestStatus;
  href: string;
  evidence?: string;
};

export type BuyerProofVerifierManifestReceipt = {
  id: string;
  status: BuyerTrustManifestStatus;
  algorithm: string;
  digest: string;
  evidence?: string;
  verifier?: string;
};

export type BuyerProofVerifierManifest = {
  id?: string;
  manifestVersion: BuyerTrustManifestPayload["manifestVersion"];
  generatedAt?: string;
  subject: string;
  readiness: BuyerTrustManifestReadiness;
  score: number;
  proofPacketDigest: string;
  artifacts: BuyerProofVerifierManifestArtifact[];
  receipts: BuyerProofVerifierManifestReceipt[];
  publicationGate: {
    decision: BuyerTrustManifestPublicationDecision;
    score: number;
    blockedCount: number;
    watchCount: number;
    firstAction: string;
    firstActionHref: string;
  };
  publicationWindow: {
    status: BuyerTrustManifestPublicationWindowStatus;
    proofExpiresAt: string;
    manifestExpiresAt: string;
    buyerReviewDueAt: string;
    firstRecheck?: string;
    firstRecheckHref?: string;
  };
  verification: {
    digest: string;
    payload: BuyerTrustManifestPayload;
  };
};

export type BuyerProofVerifierCheck = {
  id: BuyerProofVerifierCheckId;
  label: string;
  status: BuyerTrustManifestStatus;
  evidence: string;
  action: string;
};

export type BuyerProofVerifierReport = {
  id: string;
  checkedAt: string;
  status: BuyerProofVerifierStatus;
  decision: BuyerProofVerifierDecision;
  score: number;
  headline: string;
  operatorLine: string;
  subject: string;
  manifestId: string;
  expectedDigest: string;
  actualDigest: string;
  trustManifestVerifyApiPath: typeof BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH;
  checks: BuyerProofVerifierCheck[];
  nextActions: string[];
  copyText: string;
  exportMarkdown: string;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

function stableDigest(value: unknown) {
  const payload = JSON.stringify(canonicalize(value));
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= BigInt(payload.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptJson(value: string) {
  return value
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function scoreFor(status: BuyerTrustManifestStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 18;
}

function statusFor(checks: BuyerProofVerifierCheck[]): BuyerProofVerifierStatus {
  if (checks.some((check) => check.status === "block")) return "blocked";
  if (checks.some((check) => check.status === "watch")) return "attention";
  return "verified";
}

function decisionFor(status: BuyerProofVerifierStatus): BuyerProofVerifierDecision {
  if (status === "verified") return "share";
  if (status === "attention") return "repair";
  return "hold";
}

function headlineFor(status: BuyerProofVerifierStatus) {
  if (status === "verified") return "Buyer proof can be trusted by an external reviewer";
  if (status === "attention") return "Buyer proof is authentic but still needs review";
  return "Buyer proof should not be trusted yet";
}

function operatorLineFor(input: { reportStatus: BuyerProofVerifierStatus; passed: number; total: number; subject: string }) {
  if (input.reportStatus === "verified") {
    return `${input.subject} has a digest-matched proof index with ${input.passed}/${input.total} verifier checks passing.`;
  }
  if (input.reportStatus === "attention") {
    return `${input.subject} has an authentic manifest, but open watch checks must be closed before public buyer delivery.`;
  }
  return `${input.subject} has a proof integrity blocker. Hold external sharing until the manifest is regenerated or repaired.`;
}

function parseTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function publicHrefStatus(hrefs: string[]) {
  const invalid: string[] = [];
  const localOrInsecure: string[] = [];

  for (const href of hrefs) {
    try {
      const parsed = new URL(href);
      const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
      const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (parsed.protocol !== "https:" && !local) {
        localOrInsecure.push(href);
      }
      if (local) {
        localOrInsecure.push(href);
      }
    } catch {
      invalid.push(href);
    }
  }

  if (invalid.length > 0) {
    return {
      status: "block" as const,
      evidence: `${invalid.length} artifact link is not an absolute URL.`,
      action: "Replace every artifact href with an externally reachable https URL before buyer review."
    };
  }
  if (localOrInsecure.length > 0) {
    return {
      status: "watch" as const,
      evidence: `${localOrInsecure.length} artifact link uses localhost, plain HTTP, or another non-production URL.`,
      action: "Publish the same proof chain on production HTTPS URLs and regenerate the manifest."
    };
  }
  return {
    status: "pass" as const,
    evidence: "Every artifact href is an absolute production HTTPS URL.",
    action: "Keep these links attached to the buyer room."
  };
}

function artifactAlignmentCheck(manifest: BuyerProofVerifierManifest): BuyerProofVerifierCheck {
  const artifactById = new Map(manifest.artifacts.map((artifact) => [artifact.id, artifact]));
  const missing = manifest.verification.payload.artifacts.filter((artifact) => !artifactById.has(artifact.id));
  const changed = manifest.verification.payload.artifacts.filter((artifact) => {
    const indexed = artifactById.get(artifact.id);
    return indexed && (indexed.href !== artifact.href || indexed.status !== artifact.status);
  });

  if (missing.length > 0 || changed.length > 0) {
    return {
      id: "artifact-index",
      label: "Artifact index alignment",
      status: "block",
      evidence: `${missing.length} payload artifact is missing and ${changed.length} artifact changed after digest export.`,
      action: "Regenerate the buyer trust manifest so the visible artifact index and verification payload match."
    };
  }

  return {
    id: "artifact-index",
    label: "Artifact index alignment",
    status: "pass",
    evidence: `${manifest.verification.payload.artifacts.length} payload artifacts match the visible manifest index.`,
    action: "Keep the visible manifest and verification payload together when sharing."
  };
}

function publicationGateCheck(manifest: BuyerProofVerifierManifest): BuyerProofVerifierCheck {
  if (manifest.publicationGate.decision === "publish" && manifest.publicationGate.blockedCount === 0 && manifest.publicationGate.watchCount === 0) {
    return {
      id: "publication-gate",
      label: "Publication gate",
      status: "pass",
      evidence: "The manifest publication gate says publish with no open block or watch checks.",
      action: "Share the buyer proof room with the manifest digest attached."
    };
  }
  if (manifest.publicationGate.decision === "hold" || manifest.publicationGate.blockedCount > 0) {
    return {
      id: "publication-gate",
      label: "Publication gate",
      status: "block",
      evidence: `${manifest.publicationGate.blockedCount} blocking publication check remains open.`,
      action: manifest.publicationGate.firstAction || "Repair the blocking publication gate and regenerate the manifest."
    };
  }
  return {
    id: "publication-gate",
    label: "Publication gate",
    status: "watch",
    evidence: `${manifest.publicationGate.watchCount} watch check remains open before buyer delivery.`,
    action: manifest.publicationGate.firstAction || "Close the watch item, rerun proof audit, and regenerate the manifest."
  };
}

function upstreamReceiptAlignmentCheck(manifest: BuyerProofVerifierManifest): BuyerProofVerifierCheck {
  const expectedReceipts = [
    {
      id: "buyer-evidence-board",
      digest: manifest.verification.payload.buyerEvidenceBoardReceiptChecksum
    },
    {
      id: "commercial-offer",
      digest: manifest.verification.payload.commercialOfferReceiptChecksum
    },
    {
      id: "buyer-pilot-contract",
      digest: manifest.verification.payload.buyerPilotContractReceiptChecksum
    }
  ].filter((receipt): receipt is { id: string; digest: string } => Boolean(receipt.digest));
  const missing = expectedReceipts.filter((expected) => !manifest.receipts.some((receipt) => receipt.id === expected.id));
  const changed = expectedReceipts.filter((expected) => {
    const visibleReceipt = manifest.receipts.find((receipt) => receipt.id === expected.id);
    return visibleReceipt && visibleReceipt.digest.toLowerCase() !== expected.digest.toLowerCase();
  });

  if (missing.length > 0 || changed.length > 0) {
    return {
      id: "upstream-receipts",
      label: "Upstream receipt alignment",
      status: "block",
      evidence: `${missing.length} upstream receipt is missing and ${changed.length} receipt digest changed after manifest export.`,
      action: "Regenerate the buyer trust manifest so visible upstream receipts match verification.payload."
    };
  }

  return {
    id: "upstream-receipts",
    label: "Upstream receipt alignment",
    status: "pass",
    evidence: `${expectedReceipts.length} upstream receipt checksum${expectedReceipts.length === 1 ? "" : "s"} match verification.payload.`,
    action: "Verify each upstream receipt API if the reviewer asks for deeper provenance."
  };
}

function reviewWindowCheck(manifest: BuyerProofVerifierManifest, checkedAt: string): BuyerProofVerifierCheck {
  const now = parseTime(checkedAt);
  const proofExpires = parseTime(manifest.publicationWindow.proofExpiresAt);
  const manifestExpires = parseTime(manifest.publicationWindow.manifestExpiresAt);
  if (now === null || proofExpires === null || manifestExpires === null) {
    return {
      id: "review-window",
      label: "Review window",
      status: "watch",
      evidence: "One or more review-window timestamps could not be parsed.",
      action: "Regenerate the manifest with ISO timestamps before relying on the publication window."
    };
  }
  if (now > manifestExpires) {
    return {
      id: "review-window",
      label: "Review window",
      status: "block",
      evidence: `The manifest expired at ${manifest.publicationWindow.manifestExpiresAt}.`,
      action: "Regenerate the manifest from the current workspace before buyer review."
    };
  }
  if (now > proofExpires || manifest.publicationWindow.status !== "current") {
    return {
      id: "review-window",
      label: "Review window",
      status: "watch",
      evidence: `The live proof window is ${manifest.publicationWindow.status}; proof expires at ${manifest.publicationWindow.proofExpiresAt}.`,
      action: manifest.publicationWindow.firstRecheck || "Rerun the live proof audit before external sharing."
    };
  }
  return {
    id: "review-window",
    label: "Review window",
    status: "pass",
    evidence: `Manifest and live proof windows are current through ${manifest.publicationWindow.proofExpiresAt}.`,
    action: "Reverify after any public URL, receipt, or commercial term changes."
  };
}

function buildMarkdown(report: Omit<BuyerProofVerifierReport, "copyText" | "exportMarkdown">) {
  return [
    `# ${report.headline}`,
    "",
    `- Status: ${report.status}`,
    `- Decision: ${report.decision}`,
    `- Score: ${report.score}/100`,
    `- Subject: ${report.subject}`,
    `- Manifest: ${report.manifestId}`,
    `- Expected digest: ${report.expectedDigest}`,
    `- Actual digest: ${report.actualDigest}`,
    `- Checked: ${report.checkedAt}`,
    "",
    "## Checks",
    ...report.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence} Action: ${check.action}`),
    "",
    "## Next actions",
    ...report.nextActions.map((action) => `- ${action}`)
  ].join("\n");
}

export function buildBuyerProofVerifierReport(input: {
  manifest: BuyerProofVerifierManifest;
  expectedDigest?: string;
  checkedAt?: string;
}): BuyerProofVerifierReport {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const expectedDigest = (input.expectedDigest || input.manifest.verification.digest).toLowerCase();
  const digestVerification = verifyBuyerTrustManifestReceipt({
    digest: expectedDigest,
    payload: input.manifest.verification.payload
  });
  const trustManifestReceipt = input.manifest.receipts.find((receipt) => receipt.id === "buyer-trust-manifest");
  const proofPacketReceipt = input.manifest.receipts.find((receipt) => receipt.id === "buyer-proof-packet");
  const proofPacketPayloadDigest = input.manifest.verification.payload.proofPacketReceiptDigest.toLowerCase();
  const hrefCheck = publicHrefStatus([
    ...input.manifest.artifacts.map((artifact) => artifact.href),
    input.manifest.publicationGate.firstActionHref,
    input.manifest.publicationWindow.firstRecheckHref || ""
  ].filter(Boolean));

  const checks: BuyerProofVerifierCheck[] = [
    {
      id: "manifest-digest",
      label: "Manifest digest",
      status: digestVerification.status === "verified" ? "pass" : "block",
      evidence:
        digestVerification.status === "verified"
          ? `Digest ${digestVerification.actualDigest} matches verification.payload.`
          : `Expected ${digestVerification.expectedDigest}, but payload produced ${digestVerification.actualDigest}.`,
      action:
        digestVerification.status === "verified"
          ? "Keep the verification payload attached to the manifest."
          : "Reject this manifest and ask the operator to regenerate it from the source workspace."
    },
    {
      id: "manifest-receipt",
      label: "Manifest receipt",
      status: trustManifestReceipt?.digest.toLowerCase() === input.manifest.verification.digest.toLowerCase() ? "pass" : "block",
      evidence: trustManifestReceipt
        ? `Buyer-trust-manifest receipt digest is ${trustManifestReceipt.digest}.`
        : "Buyer-trust-manifest receipt is missing.",
      action:
        trustManifestReceipt?.digest.toLowerCase() === input.manifest.verification.digest.toLowerCase()
          ? "Keep the manifest receipt in the public proof bundle."
          : "Regenerate the manifest so its visible receipt and verification digest match."
    },
    artifactAlignmentCheck(input.manifest),
    {
      id: "proof-packet-digest",
      label: "Proof packet digest",
      status:
        input.manifest.proofPacketDigest.toLowerCase() === proofPacketPayloadDigest && proofPacketReceipt?.digest.toLowerCase() === proofPacketPayloadDigest
          ? "pass"
          : "block",
      evidence: `Manifest payload references proof packet digest ${proofPacketPayloadDigest}.`,
      action:
        input.manifest.proofPacketDigest.toLowerCase() === proofPacketPayloadDigest && proofPacketReceipt?.digest.toLowerCase() === proofPacketPayloadDigest
          ? "Verify the buyer proof packet receipt if the reviewer asks for deeper provenance."
          : "Regenerate the proof packet and trust manifest from the same workspace."
    },
    upstreamReceiptAlignmentCheck(input.manifest),
    publicationGateCheck(input.manifest),
    reviewWindowCheck(input.manifest, checkedAt),
    {
      id: "public-artifact-hrefs",
      label: "Public artifact hrefs",
      status: hrefCheck.status,
      evidence: hrefCheck.evidence,
      action: hrefCheck.action
    }
  ];
  const reportStatus = statusFor(checks);
  const decision = decisionFor(reportStatus);
  const passed = checks.filter((check) => check.status === "pass").length;
  const score = Math.round(checks.reduce((sum, check) => sum + scoreFor(check.status), 0) / checks.length);
  const nextActions = checks.filter((check) => check.status !== "pass").map((check) => check.action);
  const reportBase = {
    id: `buyer-proof-verifier-${stableDigest({ checkedAt, expectedDigest, statuses: checks.map((check) => [check.id, check.status]) }).slice(0, 10)}`,
    checkedAt,
    status: reportStatus,
    decision,
    score,
    headline: headlineFor(reportStatus),
    operatorLine: operatorLineFor({ reportStatus, passed, total: checks.length, subject: input.manifest.subject }),
    subject: input.manifest.subject,
    manifestId: input.manifest.id || `${input.manifest.manifestVersion}:${input.manifest.subject}`,
    expectedDigest,
    actualDigest: digestVerification.actualDigest,
    trustManifestVerifyApiPath: BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH as typeof BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH,
    checks,
    nextActions: nextActions.length ? nextActions : ["Attach this verifier report to the buyer room and re-run it after any proof URL changes."]
  };
  const exportMarkdown = buildMarkdown(reportBase);

  return {
    ...reportBase,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

function checkTone(status: BuyerTrustManifestStatus | BuyerProofVerifierStatus) {
  if (status === "pass" || status === "verified") return "good";
  if (status === "block" || status === "blocked") return "bad";
  return "watch";
}

function renderReport(report: BuyerProofVerifierReport) {
  const checks = report.checks
    .map(
      (check) => `
        <article class="verifier-check ${checkTone(check.status)}">
          <div><span>${escapeHtml(check.id)}</span><strong>${escapeHtml(check.status)}</strong></div>
          <h2>${escapeHtml(check.label)}</h2>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.action)}</small>
        </article>`
    )
    .join("");
  const actions = report.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");

  return `
    <section class="verifier-result ${checkTone(report.status)}" aria-label="Verifier result">
      <div class="verifier-verdict">
        <span class="eyebrow">Verifier report</span>
        <h2>${escapeHtml(report.headline)}</h2>
        <p>${escapeHtml(report.operatorLine)}</p>
        <div class="verifier-metrics">
          <span><b>${escapeHtml(report.score)}</b> score</span>
          <span><b>${escapeHtml(report.decision)}</b> decision</span>
          <span><b>${escapeHtml(report.status)}</b> status</span>
        </div>
      </div>
      <aside class="digest-plate">
        <span>Digest match</span>
        <code>${escapeHtml(report.actualDigest)}</code>
        <small>${escapeHtml(report.manifestId)}</small>
      </aside>
    </section>
    <section class="verifier-grid" aria-label="Verifier checks">${checks}</section>
    <section class="verifier-actions" aria-label="Verifier next actions">
      <h2>Next actions</h2>
      <ol>${actions}</ol>
    </section>`;
}

export function renderBuyerProofVerifierHtml(input: {
  report: BuyerProofVerifierReport;
  manifestJson: string;
  links: {
    apiUrl: string;
    currentManifestUrl: string;
    trustManifestUrl: string;
    wellKnownUrl: string;
    decisionReceiptUrl?: string;
    appUrl: string;
  };
}) {
  const initialReportJson = JSON.stringify(input.report);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.report.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #5b6965; --paper: #eef2ed; --panel: #fffdf7; --line: #c9d6cf; --teal: #0f766e; --blue: #2457a6; --ruby: #a82135; --gold: #b98112; }
      * { box-sizing: border-box; }
      body { min-width: 320px; margin: 0; color: var(--ink); background: radial-gradient(circle at 12% 0%, rgba(15,118,110,.08), transparent 34%), var(--paper); font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { padding: 30px 0 14px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); gap: 14px; align-items: stretch; }
      .hero-copy, .verifier-workbench, .verifier-result, .verifier-check, .verifier-actions { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 16px 34px rgba(23,33,38,.07); }
      .hero-copy { padding: 24px; }
      .eyebrow, .digest-rail span, .verifier-check span, .digest-plate span { color: var(--teal); font-size: .72rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 820px; margin: 8px 0 10px; font-size: clamp(2.2rem, 5vw, 4.7rem); line-height: .96; letter-spacing: 0; }
      h2 { margin: 0; line-height: 1.08; letter-spacing: 0; }
      p, small, li { color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      nav a, button, .download-link { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; color: var(--ink); background: #fff; font: inherit; font-size: .86rem; font-weight: 900; text-decoration: none; cursor: pointer; }
      button.primary { color: #fffdf7; border-color: #14201d; background: #14201d; }
      button:disabled { cursor: default; opacity: .7; }
      .digest-rail { min-width: 0; display: grid; gap: 8px; padding: 20px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #14201d, #0f766e 56%, #2457a6); align-content: end; }
      .digest-rail code, .digest-plate code { display: block; padding: 10px; border-radius: 8px; overflow-wrap: anywhere; }
      .digest-rail code { background: rgba(255,255,255,.14); color: #fffdf7; }
      .digest-rail small { color: rgba(255,253,247,.76); font-weight: 850; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .verifier-workbench { display: grid; grid-template-columns: minmax(0, .92fr) minmax(280px, .48fr); gap: 12px; padding: 14px; }
      textarea { width: 100%; min-height: 360px; resize: vertical; border: 1px solid var(--line); border-radius: 8px; padding: 12px; color: var(--ink); background: #f9fbf8; font: 500 .84rem/1.48 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: normal; }
      .workbench-side { display: grid; align-content: start; gap: 10px; }
      .workbench-side strong { font-size: 1.1rem; line-height: 1.12; }
      .workbench-status { min-height: 24px; color: var(--muted); font-weight: 850; overflow-wrap: anywhere; }
      .verifier-result { display: grid; grid-template-columns: minmax(0, 1fr) minmax(250px, 330px); gap: 12px; padding: 14px; border-left: 6px solid var(--gold); }
      .verifier-result.good { border-left-color: var(--teal); background: #edf8f1; }
      .verifier-result.bad { border-left-color: var(--ruby); background: #fff1f2; }
      .verifier-verdict { min-width: 0; display: grid; gap: 8px; align-content: start; }
      .verifier-verdict h2 { font-size: clamp(1.5rem, 3vw, 2.4rem); }
      .verifier-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .verifier-metrics span { display: grid; gap: 2px; min-width: 0; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,253,247,.72); color: var(--muted); font-size: .8rem; font-weight: 850; overflow-wrap: anywhere; }
      .verifier-metrics b { color: var(--ink); font-size: 1.15rem; }
      .digest-plate { min-width: 0; display: grid; gap: 8px; align-content: center; border-radius: 8px; padding: 14px; color: #fffdf7; background: #14201d; }
      .digest-plate span { color: #b8efd4; }
      .digest-plate code { color: #fffdf7; background: rgba(255,255,255,.1); }
      .digest-plate small { color: rgba(255,253,247,.72); }
      .verifier-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .verifier-check { min-width: 0; display: grid; gap: 8px; padding: 14px; border-top: 5px solid var(--gold); }
      .verifier-check.good { border-top-color: var(--teal); background: #edf8f1; }
      .verifier-check.bad { border-top-color: var(--ruby); background: #fff1f2; }
      .verifier-check div { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .verifier-check h2 { font-size: 1.02rem; overflow-wrap: anywhere; }
      .verifier-check p, .verifier-check small { margin: 0; overflow-wrap: anywhere; }
      .verifier-actions { padding: 14px; }
      .verifier-actions ol { margin: 10px 0 0; padding-left: 20px; }
      .verifier-actions li + li { margin-top: 6px; }
      footer { padding-bottom: 26px; color: var(--muted); font-size: .82rem; }
      @media (max-width: 900px) { .hero, .verifier-workbench, .verifier-result, .verifier-grid { grid-template-columns: 1fr; } .digest-rail { min-height: 160px; } }
      @media (max-width: 560px) { header, main, footer { width: min(100% - 22px, 520px); } .hero-copy, .verifier-workbench, .verifier-result, .verifier-check, .verifier-actions { padding: 12px; } nav a, button, .download-link { width: 100%; } .verifier-metrics { grid-template-columns: 1fr; } textarea { min-height: 300px; } }
    </style>
  </head>
  <body>
    <header>
      <div class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Buyer Proof Verifier</span>
          <h1>Verify the proof before the buyer trusts it.</h1>
          <p>Paste a buyer trust manifest or load the current public manifest. The verifier checks digest integrity, receipt alignment, publication gate state, review windows, and production-ready artifact links.</p>
          <nav>
            <a href="${escapeHtml(input.links.currentManifestUrl)}">Current JSON</a>
            <a href="${escapeHtml(input.links.trustManifestUrl)}">Trust manifest</a>
            <a href="${escapeHtml(input.links.wellKnownUrl)}">Well-known JSON</a>
            ${input.links.decisionReceiptUrl ? `<a href="${escapeHtml(input.links.decisionReceiptUrl)}">Decision receipt</a>` : ""}
            <a href="${escapeHtml(input.links.appUrl)}">Open workbench</a>
          </nav>
        </div>
        <aside class="digest-rail">
          <span>Current digest</span>
          <code>${escapeHtml(input.report.actualDigest)}</code>
          <small>${escapeHtml(input.report.operatorLine)}</small>
        </aside>
      </div>
    </header>
    <main>
      <section class="verifier-workbench" aria-label="Manifest verifier workbench">
        <div>
          <textarea data-manifest-input spellcheck="false" aria-label="Buyer trust manifest JSON">${escapeHtml(input.manifestJson)}</textarea>
        </div>
        <aside class="workbench-side">
          <span class="eyebrow">Verification input</span>
          <strong>Use this when a reviewer receives a manifest outside the app.</strong>
          <p>Loading the current manifest proves the public route is verifiable. Pasting a received manifest proves the artifact bundle has not drifted from its digest.</p>
          <button class="primary" type="button" data-verify-proof>Verify manifest</button>
          <button type="button" data-load-current>Load current manifest</button>
          <a class="download-link" href="data:text/markdown;charset=utf-8,${encodeURIComponent(input.report.exportMarkdown)}" download="buyer-proof-verifier-report.md">Download report</a>
          <small class="workbench-status" data-verifier-status>Initial report generated from the current manifest.</small>
        </aside>
      </section>
      <div data-verifier-output>${renderReport(input.report)}</div>
    </main>
    <footer>Verifier API: ${escapeHtml(input.links.apiUrl)}. Trust manifest digest API: ${escapeHtml(BUYER_TRUST_MANIFEST_RECEIPT_VERIFY_PATH)}.</footer>
    <script type="application/json" id="buyer-proof-verifier-initial-report">${escapeScriptJson(initialReportJson)}</script>
    <script>
      (() => {
        const apiUrl = ${JSON.stringify(input.links.apiUrl)};
        const currentManifestUrl = ${JSON.stringify(input.links.currentManifestUrl)};
        const textarea = document.querySelector("[data-manifest-input]");
        const verifyButton = document.querySelector("[data-verify-proof]");
        const loadButton = document.querySelector("[data-load-current]");
        const output = document.querySelector("[data-verifier-output]");
        const status = document.querySelector("[data-verifier-status]");
        if (!textarea || !verifyButton || !loadButton || !output || !status) return;

        function tone(value) {
          if (value === "pass" || value === "verified") return "good";
          if (value === "block" || value === "blocked") return "bad";
          return "watch";
        }

        function textNode(tag, text, className) {
          const node = document.createElement(tag);
          if (className) node.className = className;
          node.textContent = text;
          return node;
        }

        function renderReport(report) {
          output.textContent = "";
          const result = document.createElement("section");
          result.className = "verifier-result " + tone(report.status);
          const verdict = document.createElement("div");
          verdict.className = "verifier-verdict";
          verdict.append(textNode("span", "Verifier report", "eyebrow"), textNode("h2", report.headline), textNode("p", report.operatorLine));
          const metrics = document.createElement("div");
          metrics.className = "verifier-metrics";
          for (const item of [[report.score, "score"], [report.decision, "decision"], [report.status, "status"]]) {
            const metric = document.createElement("span");
            metric.append(textNode("b", String(item[0])), document.createTextNode(" " + item[1]));
            metrics.append(metric);
          }
          verdict.append(metrics);
          const plate = document.createElement("aside");
          plate.className = "digest-plate";
          plate.append(textNode("span", "Digest match"), textNode("code", report.actualDigest), textNode("small", report.manifestId));
          result.append(verdict, plate);
          const grid = document.createElement("section");
          grid.className = "verifier-grid";
          for (const check of report.checks) {
            const card = document.createElement("article");
            card.className = "verifier-check " + tone(check.status);
            const top = document.createElement("div");
            top.append(textNode("span", check.id), textNode("strong", check.status));
            card.append(top, textNode("h2", check.label), textNode("p", check.evidence), textNode("small", check.action));
            grid.append(card);
          }
          const actions = document.createElement("section");
          actions.className = "verifier-actions";
          actions.append(textNode("h2", "Next actions"));
          const list = document.createElement("ol");
          for (const action of report.nextActions) list.append(textNode("li", action));
          actions.append(list);
          output.append(result, grid, actions);
        }

        async function verifyCurrentInput() {
          verifyButton.disabled = true;
          status.textContent = "Verifying manifest...";
          try {
            const manifest = JSON.parse(textarea.value);
            const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ manifest })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result && result.error ? result.error : "verification failed");
            renderReport(result.report);
            status.textContent = "Verified " + result.report.actualDigest + " with status " + result.report.status + ".";
          } catch (error) {
            status.textContent = error instanceof Error ? error.message : "Could not verify manifest.";
          } finally {
            verifyButton.disabled = false;
          }
        }

        loadButton.addEventListener("click", async () => {
          loadButton.disabled = true;
          status.textContent = "Loading current public manifest...";
          try {
            const response = await fetch(currentManifestUrl);
            const manifest = await response.json();
            textarea.value = JSON.stringify(manifest, null, 2);
            await verifyCurrentInput();
          } catch {
            status.textContent = "Could not load the current manifest.";
          } finally {
            loadButton.disabled = false;
          }
        });
        verifyButton.addEventListener("click", verifyCurrentInput);
      })();
    </script>
  </body>
</html>`;
}
