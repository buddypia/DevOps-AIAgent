import type { GlobalLaunchAudit, GlobalLaunchAuditDimension, GlobalLaunchAuditProofLink, GlobalLaunchAuditStatus } from "./globalLaunchAudit.js";
import type { GlobalProofDossierReceipt } from "./globalProofDossierReceipt.js";

export type GlobalProofDossierDecision = "share-with-buyer" | "sponsor-review" | "hold-public-launch";
export type GlobalProofDossierStatus = "pass" | "watch" | "block";
export type GlobalProofDossierClaimId = "buyer-value" | "measured-outcome" | "public-reachability" | "proof-depth" | "production-ops" | "trust-offer";

export type GlobalProofDossierLinkCheck = {
  id: string;
  label: string;
  url: string;
  status: GlobalProofDossierStatus;
  httpStatus?: number;
  finalUrl?: string;
  contentType?: string;
  evidence: string;
  action: string;
};

export type GlobalProofDossierLinkSummary = {
  checkedAt: string;
  verifiedCount: number;
  totalCount: number;
  score: number;
  results: GlobalProofDossierLinkCheck[];
};

export type GlobalProofDossierClaim = {
  id: GlobalProofDossierClaimId;
  label: string;
  status: GlobalProofDossierStatus;
  score: number;
  claim: string;
  evidence: string;
  buyerQuestion: string;
  decisionRule: string;
  sourceHref: string;
};

export type GlobalProofDossierRedLine = {
  id: string;
  status: GlobalProofDossierStatus;
  label: string;
  owner: string;
  action: string;
};

export type GlobalProofDossier = {
  id: string;
  generatedAt: string;
  decision: GlobalProofDossierDecision;
  dossierScore: number;
  headline: string;
  hardTruth: string;
  decisionAsk: string;
  targetBuyer: string;
  verifiedSummary: string;
  proofWindow: string;
  claims: GlobalProofDossierClaim[];
  proofLinks: GlobalProofDossierLinkCheck[];
  redLines: GlobalProofDossierRedLine[];
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function statusScore(status: GlobalProofDossierStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 18;
}

function mergeStatus(...statuses: GlobalProofDossierStatus[]): GlobalProofDossierStatus {
  if (statuses.includes("block")) return "block";
  if (statuses.includes("watch")) return "watch";
  return "pass";
}

function statusFromScore(score: number): GlobalProofDossierStatus {
  if (score >= 82) return "pass";
  if (score >= 58) return "watch";
  return "block";
}

function claimCopy(id: GlobalProofDossierClaimId) {
  switch (id) {
    case "buyer-value":
      return {
        buyerQuestion: "Can the buyer understand the business value without a walkthrough?",
        decisionRule: "Share only when modeled value, payback, and downside case are visible."
      };
    case "measured-outcome":
      return {
        buyerQuestion: "Is at least one buyer-like run measured and accepted?",
        decisionRule: "Share externally only with saved time, acceptance rate, reviewer, and receipt."
      };
    case "public-reachability":
      return {
        buyerQuestion: "Can a global visitor open the product and proof URLs right now?",
        decisionRule: "Hold if the deployed product, story, demo, or receipt cannot be reached publicly."
      };
    case "proof-depth":
      return {
        buyerQuestion: "Does the evidence trail prove more than a polished demo?",
        decisionRule: "Require accepted A2A trial proof and public launch-room artifacts before acquisition traffic."
      };
    case "production-ops":
      return {
        buyerQuestion: "Does the squad cover deploy, test, security, and observability work?",
        decisionRule: "Do not claim global production readiness if the selected agents cannot operate the release."
      };
    case "trust-offer":
      return {
        buyerQuestion: "Can procurement see the data boundary, price cap, renewal gate, and stop rule?",
        decisionRule: "Share only when trust and offer terms are explicit enough for sponsor review."
      };
  }
}

function linkCheckFromAudit(link: GlobalLaunchAuditProofLink): GlobalProofDossierLinkCheck {
  return {
    id: link.id,
    label: link.label,
    url: link.value,
    status: link.status,
    evidence: link.status === "pass" ? "Public URL is attached; live reachability has not been rechecked in this dossier." : "No public URL is attached.",
    action: link.status === "pass" ? "Run live verification before sending to a buyer." : `Attach a public URL for ${link.label}.`
  };
}

function linkChecks(audit: GlobalLaunchAudit, liveProof?: GlobalProofDossierLinkSummary): GlobalProofDossierLinkCheck[] {
  const liveById = new Map(liveProof?.results.map((result) => [result.id, result]));
  return audit.proofLinks.map((link) => liveById.get(link.id) ?? linkCheckFromAudit(link));
}

function dimensionById(audit: GlobalLaunchAudit, id: GlobalLaunchAuditDimension["id"]) {
  return audit.dimensions.find((dimension) => dimension.id === id);
}

function buildClaims(audit: GlobalLaunchAudit, links: GlobalProofDossierLinkCheck[]): GlobalProofDossierClaim[] {
  const liveSurface = dimensionById(audit, "live-surface");
  const reachabilityStatus = mergeStatus(statusFromScore(liveSurface?.score ?? 0), ...links.map((link) => link.status));
  const reachabilityScore = Math.round(
    clamp(
      average([
        liveSurface?.score ?? 0,
        links.length ? average(links.map((link) => statusScore(link.status))) : 0
      ])
    )
  );
  const claimDimensions: Array<{ id: GlobalProofDossierClaimId; dimension?: GlobalLaunchAuditDimension; status?: GlobalProofDossierStatus; score?: number; evidence?: string }> = [
    { id: "buyer-value", dimension: dimensionById(audit, "buyer-value") },
    { id: "measured-outcome", dimension: dimensionById(audit, "measured-outcome") },
    {
      id: "public-reachability",
      dimension: liveSurface,
      status: reachabilityStatus,
      score: reachabilityScore,
      evidence: `${links.filter((link) => link.status === "pass").length}/${links.length} public proof links currently verify.`
    },
    { id: "proof-depth", dimension: dimensionById(audit, "proof-depth") },
    { id: "production-ops", dimension: dimensionById(audit, "production-ops") },
    { id: "trust-offer", dimension: dimensionById(audit, "trust-offer") }
  ];

  return claimDimensions.map((item) => {
    const copy = claimCopy(item.id);
    const dimension = item.dimension;
    const status = item.status ?? dimension?.status ?? "block";
    const score = item.score ?? dimension?.score ?? 0;
    return {
      id: item.id,
      label: dimension?.label ?? item.id,
      status,
      score,
      claim: dimension?.evidence ?? "This proof claim is missing from the launch audit.",
      evidence: item.evidence ?? dimension?.action ?? "Rebuild the launch audit before sharing this dossier.",
      buyerQuestion: copy.buyerQuestion,
      decisionRule: copy.decisionRule,
      sourceHref: dimension?.href ?? "#global-launch-audit"
    };
  });
}

function decisionFor(input: { audit: GlobalLaunchAudit; claims: GlobalProofDossierClaim[]; links: GlobalProofDossierLinkCheck[]; score: number }): GlobalProofDossierDecision {
  const blockedClaims = input.claims.filter((claim) => claim.status === "block").length;
  const blockedLinks = input.links.filter((link) => link.status === "block").length;
  const reachabilityBlocked = input.claims.some((claim) => claim.id === "public-reachability" && claim.status === "block");
  if (blockedLinks > 0 || reachabilityBlocked) return "hold-public-launch";
  if (input.audit.readiness === "global-ready" && input.score >= 84 && blockedClaims === 0 && blockedLinks === 0) return "share-with-buyer";
  if (input.score >= 68 && blockedClaims <= 1 && blockedLinks <= 1) return "sponsor-review";
  return "hold-public-launch";
}

function headlineFor(decision: GlobalProofDossierDecision) {
  if (decision === "share-with-buyer") return "This proof dossier can face a global buyer";
  if (decision === "sponsor-review") return "This proof dossier needs sponsor review before buyer sharing";
  return "Hold the public launch until the proof dossier is repaired";
}

function hardTruthFor(decision: GlobalProofDossierDecision, redLines: GlobalProofDossierRedLine[]) {
  if (decision === "share-with-buyer") {
    return "The buyer can inspect modeled value, measured outcome, live proof, operations depth, and trust boundaries from one public dossier.";
  }
  const first = redLines[0];
  if (decision === "sponsor-review") return first ? `${first.label} needs owner confirmation before this becomes buyer-safe.` : "The dossier is close, but sponsor confirmation is still needed before external sharing.";
  return first ? `${first.label} blocks global sharing: ${first.action}` : "The dossier has unresolved launch evidence that would make the product feel unfinished to a global visitor.";
}

function decisionAskFor(decision: GlobalProofDossierDecision, redLines: GlobalProofDossierRedLine[]) {
  if (decision === "share-with-buyer") return "Share this dossier and ask the sponsor to approve a bounded buyer pilot.";
  if (decision === "sponsor-review") return `Send to sponsor review and close ${redLines[0]?.label ?? "the first warning"} before buyer delivery.`;
  return `Keep the launch internal until ${redLines[0]?.label ?? "blocked public proof"} is fixed and rechecked.`;
}

function buildRedLines(claims: GlobalProofDossierClaim[], links: GlobalProofDossierLinkCheck[]): GlobalProofDossierRedLine[] {
  const claimLines = claims
    .filter((claim) => claim.status !== "pass")
    .map((claim) => ({
      id: `claim-${claim.id}`,
      status: claim.status,
      label: claim.label,
      owner: claim.id === "production-ops" ? "DevOps owner" : claim.id === "trust-offer" ? "Commercial owner" : "Product owner",
      action: claim.decisionRule
    }));
  const linkLines = links
    .filter((link) => link.status !== "pass")
    .map((link) => ({
      id: `link-${link.id}`,
      status: link.status,
      label: link.label,
      owner: "Proof owner",
      action: link.action
    }));
  return [...claimLines, ...linkLines].sort((left, right) => statusScore(left.status) - statusScore(right.status)).slice(0, 8);
}

function buildMarkdown(dossier: Omit<GlobalProofDossier, "exportMarkdown">) {
  return [
    `# ${dossier.headline}`,
    "",
    "Global Proof Dossier",
    "",
    `Buyer decision: ${dossier.decision}`,
    `Dossier score: ${dossier.dossierScore}/100`,
    `Target buyer: ${dossier.targetBuyer}`,
    `Decision ask: ${dossier.decisionAsk}`,
    `Proof window: ${dossier.proofWindow}`,
    "",
    dossier.hardTruth,
    "",
    "## Claims",
    ...dossier.claims.flatMap((claim) => [
      `- [${claim.status}] ${claim.label} (${claim.score}/100): ${claim.claim}`,
      `  - Buyer question: ${claim.buyerQuestion}`,
      `  - Rule: ${claim.decisionRule}`,
      `  - Evidence: ${claim.evidence}`
    ]),
    "",
    "## Live proof links",
    ...dossier.proofLinks.map((link) => `- [${link.status}] ${link.label}: ${link.url || "missing"} ${link.httpStatus ? `(HTTP ${link.httpStatus})` : ""} - ${link.evidence}`),
    "",
    "## Red lines",
    ...(dossier.redLines.length ? dossier.redLines.map((line) => `- [${line.status}] ${line.label}: ${line.action} Owner: ${line.owner}`) : ["- None"])
  ].join("\n");
}

export function buildGlobalProofDossier(input: { audit: GlobalLaunchAudit; liveProof?: GlobalProofDossierLinkSummary; generatedAt?: string }): GlobalProofDossier {
  const proofLinks = linkChecks(input.audit, input.liveProof);
  const claims = buildClaims(input.audit, proofLinks);
  const linkScore = input.liveProof?.score ?? Math.round(average(proofLinks.map((link) => statusScore(link.status))));
  const dossierScore = Math.round(clamp(average([input.audit.score, linkScore, average(claims.map((claim) => statusScore(claim.status)))])));
  const decision = decisionFor({ audit: input.audit, claims, links: proofLinks, score: dossierScore });
  const redLines = buildRedLines(claims, proofLinks);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const partial: Omit<GlobalProofDossier, "exportMarkdown"> = {
    id: `global-proof-dossier-${decision}-${dossierScore}`,
    generatedAt,
    decision,
    dossierScore,
    headline: headlineFor(decision),
    hardTruth: hardTruthFor(decision, redLines),
    decisionAsk: decisionAskFor(decision, redLines),
    targetBuyer: input.audit.targetMarket,
    verifiedSummary: `${proofLinks.filter((link) => link.status === "pass").length}/${proofLinks.length} proof links verified; ${claims.filter((claim) => claim.status === "pass").length}/${claims.length} claims pass.`,
    proofWindow: input.liveProof ? `Live links checked ${input.liveProof.checkedAt}` : "Live links not checked in this dossier.",
    claims,
    proofLinks,
    redLines
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: string) {
  if (["share-with-buyer", "pass"].includes(status)) return "good";
  if (["hold-public-launch", "block"].includes(status)) return "bad";
  return "watch";
}

function linkedHref(href: string, appUrl?: string) {
  if (!href.startsWith("#")) return href;
  return appUrl ? `${appUrl.replace(/#.*$/, "")}${href}` : href;
}

export function renderGlobalProofDossierHtml(
  dossier: GlobalProofDossier,
  links: { appUrl?: string; launchRoomUrl?: string; globalAuditUrl?: string; publishabilityUrl?: string; launchEvidenceUrl?: string; jsonUrl?: string; markdownUrl?: string } = {},
  receipt?: Pick<GlobalProofDossierReceipt, "href" | "payloadHref" | "verificationRequestHref" | "verificationApiPath">
) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.globalAuditUrl ? `<a href="${escapeHtml(links.globalAuditUrl)}">Audit</a>` : "",
    links.publishabilityUrl ? `<a href="${escapeHtml(links.publishabilityUrl)}">Publishability</a>` : "",
    links.launchEvidenceUrl ? `<a href="${escapeHtml(links.launchEvidenceUrl)}">Evidence run</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : "",
    receipt ? `<a href="${escapeHtml(receipt.href)}" download="global-proof-dossier-receipt.md">Receipt</a>` : "",
    receipt ? `<a href="${escapeHtml(receipt.payloadHref)}" download="global-proof-dossier-replay-payload.json">Replay payload</a>` : "",
    receipt ? `<a href="${escapeHtml(receipt.verificationRequestHref)}" download="global-proof-dossier-verify-request.json">Verify request</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = [
    { label: "Buyer decision", value: dossier.decision, status: dossier.decision },
    { label: "Dossier score", value: `${dossier.dossierScore}/100`, status: dossier.decision },
    { label: "Verified proof", value: dossier.verifiedSummary, status: dossier.redLines.some((line) => line.status === "block") ? "block" : dossier.redLines.length ? "watch" : "pass" },
    { label: "Proof window", value: dossier.proofWindow, status: "pass" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const claims = dossier.claims
    .map(
      (claim) => `
        <article class="claim ${tone(claim.status)}">
          <div><span>${escapeHtml(claim.status)}</span><b>${escapeHtml(claim.score)}</b></div>
          <strong>${escapeHtml(claim.label)}</strong>
          <p>${escapeHtml(claim.claim)}</p>
          <small>${escapeHtml(claim.buyerQuestion)}</small>
          <a href="${escapeHtml(linkedHref(claim.sourceHref, links.appUrl))}">${claim.status === "pass" ? "Inspect" : "Repair"}</a>
        </article>`
    )
    .join("");
  const proofLinks = dossier.proofLinks
    .map(
      (link) => `
        <article class="proof ${tone(link.status)}">
          <div><span>${escapeHtml(link.status)}</span><b>${escapeHtml(link.httpStatus ?? "URL")}</b></div>
          <strong>${escapeHtml(link.label)}</strong>
          <p>${escapeHtml(link.evidence)}</p>
          <small>${escapeHtml(link.action)}</small>
          ${link.url ? `<a href="${escapeHtml(link.url)}">${escapeHtml(link.finalUrl ?? link.url)}</a>` : `<em>missing</em>`}
        </article>`
    )
    .join("");
  const redLines = dossier.redLines.length
    ? dossier.redLines
        .map(
          (line) => `
            <li class="${tone(line.status)}">
              <span>${escapeHtml(line.status)}</span>
              <strong>${escapeHtml(line.label)}</strong>
              <p>${escapeHtml(line.action)}</p>
              <small>${escapeHtml(line.owner)}</small>
            </li>`
        )
        .join("")
    : `<li class="good"><span>pass</span><strong>No red lines</strong><p>The dossier has no blocked buyer-facing proof checks.</p><small>${escapeHtml(dossier.targetBuyer)}</small></li>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(dossier.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #182220; --muted: #53645f; --paper: #f4f7f3; --panel: #fffdf7; --line: #cbd9d2; --teal: #0f766e; --blue: #2457a6; --rose: #b1344f; --amber: #9a6a12; --green-bg: #edf9f3; --blue-bg: #f0f6ff; --rose-bg: #fff1f2; --amber-bg: #fff8df; --shadow: 0 18px 44px rgba(24, 34, 32, .08); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: linear-gradient(180deg, #eef5f1 0, var(--paper) 260px); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 22px; align-items: end; padding: 42px 0 18px; }
      .eyebrow, .metric span, .claim span, .proof span, .red-lines span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 900px; margin: 8px 0 10px; font-size: clamp(2.15rem, 5vw, 4.55rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 8px; }
      p, small, em { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a, .claim a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-weight: 900; text-decoration: none; }
      .passport { min-height: 220px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid #182220; border-radius: 8px; color: #fffdf7; background: repeating-linear-gradient(135deg, #172523 0 16px, #123f3b 16px 32px); box-shadow: var(--shadow); text-align: center; }
      .passport span, .passport small { color: rgba(255, 253, 247, .78); font-size: .76rem; font-weight: 950; text-transform: uppercase; }
      .passport strong { padding: 0 18px; font-size: 1.55rem; line-height: 1.05; overflow-wrap: anywhere; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .claims, .proof-grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .claims { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .proof-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric, .claim, .proof, .decision, .red-lines { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 10px 26px rgba(24, 34, 32, .05); }
      .metric, .claim, .proof, .decision, .red-lines { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.12rem; line-height: 1.12; overflow-wrap: anywhere; }
      .decision { display: grid; grid-template-columns: minmax(0, .9fr) minmax(280px, .45fr); gap: 12px; align-items: start; }
      .decision strong { display: block; margin-top: 6px; font-size: 1.22rem; line-height: 1.24; overflow-wrap: anywhere; }
      .red-lines ul { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
      .red-lines li { display: grid; gap: 5px; border: 1px solid var(--line); border-left: 5px solid var(--blue); border-radius: 8px; padding: 10px; }
      .claim, .proof { display: grid; grid-template-rows: auto auto 1fr auto auto; gap: 8px; border-top: 5px solid var(--blue); }
      .claim.good, .proof.good, .metric.good, .red-lines li.good { border-color: #add6bd; border-top-color: var(--teal); background: var(--green-bg); }
      .claim.watch, .proof.watch, .metric.watch, .red-lines li.watch { border-color: #e2ca86; border-top-color: var(--amber); background: var(--amber-bg); }
      .claim.bad, .proof.bad, .metric.bad, .red-lines li.bad { border-color: #e6a9b5; border-top-color: var(--rose); background: var(--rose-bg); }
      .red-lines li.good { border-left-color: var(--teal); }
      .red-lines li.watch { border-left-color: var(--amber); }
      .red-lines li.bad { border-left-color: var(--rose); }
      .claim div, .proof div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .claim b, .proof b { font-size: 1.55rem; line-height: 1; }
      .claim strong, .claim p, .claim small, .proof strong, .proof p, .proof small, .red-lines strong, .red-lines p { overflow-wrap: anywhere; }
      .proof a { font-size: .86rem; font-weight: 850; }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) { header, .decision, .metrics, .claims, .proof-grid { grid-template-columns: 1fr; } .passport { min-height: 148px; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Global Proof Dossier</span>
        <h1>${escapeHtml(dossier.headline)}</h1>
        <p>${escapeHtml(dossier.hardTruth)}</p>
        <nav>${nav}</nav>
      </div>
      <div class="passport">
        <span>${escapeHtml(dossier.decision)}</span>
        <strong>${escapeHtml(dossier.decisionAsk)}</strong>
        <small>${escapeHtml(dossier.targetBuyer)}</small>
      </div>
    </header>
    <main>
      <section class="metrics" aria-label="Global proof metrics">${metrics}</section>
      <section class="decision" aria-label="Buyer decision">
        <div>
          <h2>Buyer decision</h2>
          <strong>${escapeHtml(dossier.decisionAsk)}</strong>
          <p>${escapeHtml(dossier.verifiedSummary)}</p>
          ${receipt ? `<p><strong>Receipt API:</strong> <code>POST ${escapeHtml(receipt.verificationApiPath)}</code></p>` : ""}
        </div>
        <aside class="red-lines">
          <h2>Red lines</h2>
          <ul>${redLines}</ul>
        </aside>
      </section>
      <section class="claims" aria-label="Proof claims">${claims}</section>
      <section class="proof-grid" aria-label="Live proof links">${proofLinks}</section>
    </main>
    <footer>Generated by A2A Agent Marketplace. This dossier records public launch evidence and open proof limits; verify legal, security, and procurement obligations separately.</footer>
  </body>
</html>`;
}
