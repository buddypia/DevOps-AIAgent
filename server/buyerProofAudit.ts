import { createHash } from "node:crypto";
import {
  verifyPublicProofLinks,
  type PublicProofLinkInput,
  type PublicProofLinkStatus,
  type PublicProofLinkVerification,
  type PublicProofLinkVerificationSummary
} from "./proofLinkVerifier.js";

export const BUYER_PROOF_AUDIT_SKILL_ID = "buyer.proof-audit";

export type BuyerProofAuditCategory = "product" | "agent-card" | "buyer-proof" | "pilot-proof";

export type BuyerProofAuditLinkSpec = PublicProofLinkInput & {
  category: BuyerProofAuditCategory;
  critical: boolean;
  href: string;
};

export type BuyerProofAuditLink = PublicProofLinkVerification & {
  category: BuyerProofAuditCategory;
  critical: boolean;
  href: string;
};

export type BuyerProofAuditWorkspaceInput = {
  targetUrl: string;
  protopediaUrl: string;
  videoUrl: string;
  pilotEvidenceUrl: string;
  workOrderEvidenceUrl: string;
  appUrl?: string;
};

export type BuyerProofAuditAction = {
  id: string;
  label: string;
  owner: string;
  href: string;
  action: string;
};

export type BuyerProofAuditRepairQueueItem = {
  id: string;
  priority: number;
  label: string;
  owner: string;
  category: BuyerProofAuditCategory;
  status: PublicProofLinkStatus;
  severity: "blocking" | "unstable";
  href: string;
  evidence: string;
  action: string;
  reviewerImpact: string;
  recheck: string;
};

export type BuyerProofAudit = {
  id: string;
  checkedAt: string;
  verdict: "ready-to-share" | "repair-before-share" | "blocked";
  score: number;
  headline: string;
  operatorLine: string;
  verifiedCount: number;
  totalCount: number;
  criticalPassed: number;
  criticalTotal: number;
  watchCount: number;
  blockCount: number;
  links: BuyerProofAuditLink[];
  actions: BuyerProofAuditAction[];
  repairQueue: BuyerProofAuditRepairQueueItem[];
  exportMarkdown: string;
};

type VerifyDeps = Parameters<typeof verifyPublicProofLinks>[1];

function cleanBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusLabel(status: PublicProofLinkStatus) {
  if (status === "pass") return "Live";
  if (status === "watch") return "Unstable";
  return "Blocked";
}

function verdictFor(input: { criticalPassed: number; criticalTotal: number; blockCount: number; watchCount: number }): BuyerProofAudit["verdict"] {
  if (input.criticalPassed === input.criticalTotal && input.blockCount === 0) return "ready-to-share";
  if (input.criticalPassed >= input.criticalTotal - 1 && input.blockCount <= 1) return "repair-before-share";
  return "blocked";
}

function headlineFor(verdict: BuyerProofAudit["verdict"]) {
  if (verdict === "ready-to-share") return "Public proof is live enough to share";
  if (verdict === "repair-before-share") return "Repair one proof lane before sharing";
  return "Public proof audit is blocked";
}

function operatorLineFor(audit: Pick<BuyerProofAudit, "verdict" | "criticalPassed" | "criticalTotal" | "blockCount" | "watchCount">) {
  if (audit.verdict === "ready-to-share") {
    return `${audit.criticalPassed}/${audit.criticalTotal} critical proof links are reachable for an external reviewer.`;
  }
  if (audit.verdict === "repair-before-share") {
    return `${audit.blockCount} blocked and ${audit.watchCount} unstable proof link should be fixed before buyer delivery.`;
  }
  return `${audit.criticalTotal - audit.criticalPassed} critical proof links are not externally reliable yet.`;
}

function actionFor(link: BuyerProofAuditLink): BuyerProofAuditAction {
  return {
    id: `repair-${link.id}`,
    label: `Repair ${link.label}`,
    owner: link.category === "agent-card" ? "Platform owner" : link.category === "pilot-proof" ? "Pilot owner" : "Proof owner",
    href: link.href,
    action: link.action
  };
}

function ownerFor(category: BuyerProofAuditCategory) {
  if (category === "agent-card") return "Platform owner";
  if (category === "pilot-proof") return "Pilot owner";
  if (category === "product") return "Release owner";
  return "Proof owner";
}

function repairRank(link: BuyerProofAuditLink) {
  if (link.critical && link.status === "block") return 0;
  if (link.critical && link.status === "watch") return 1;
  if (link.status === "block") return 2;
  return 3;
}

function reviewerImpactFor(link: BuyerProofAuditLink) {
  if (link.status === "block") {
    return link.critical
      ? "External reviewers cannot complete the critical proof chain until this artifact opens publicly."
      : "External reviewers may treat this supporting artifact as missing until it opens publicly.";
  }
  return link.critical
    ? "External reviewers can see the artifact, but the proof chain is not stable enough for buyer delivery."
    : "The artifact is reachable with risk; keep a backup proof ready before sending it externally.";
}

function recheckFor(link: BuyerProofAuditLink) {
  if (link.status === "block") {
    return `After repair, rerun the buyer proof audit and confirm ${link.label} returns pass.`;
  }
  return `Rerun the buyer proof audit and confirm ${link.label} stays pass for the next buyer check.`;
}

function buildRepairQueue(links: BuyerProofAuditLink[]): BuyerProofAuditRepairQueueItem[] {
  return links
    .filter((link) => link.status !== "pass")
    .sort((left, right) => repairRank(left) - repairRank(right))
    .map((link, index) => ({
      id: `queue-${link.id}`,
      priority: index + 1,
      label: link.label,
      owner: ownerFor(link.category),
      category: link.category,
      status: link.status,
      severity: link.status === "block" ? "blocking" : "unstable",
      href: link.href,
      evidence: link.evidence,
      action: link.action,
      reviewerImpact: reviewerImpactFor(link),
      recheck: recheckFor(link)
    }));
}

function buildMarkdown(audit: Omit<BuyerProofAudit, "exportMarkdown">) {
  const lines = [
    `# ${audit.headline}`,
    "",
    `- Verdict: ${audit.verdict}`,
    `- Score: ${audit.score}/100`,
    `- Checked: ${audit.checkedAt}`,
    `- Critical proof: ${audit.criticalPassed}/${audit.criticalTotal}`,
    `- Live links: ${audit.verifiedCount}/${audit.totalCount}`,
    "",
    "## Links",
    ...audit.links.map((link) => `- ${link.label}: ${link.status}${link.httpStatus ? ` HTTP ${link.httpStatus}` : ""} - ${link.url}`),
    "",
    "## Repair queue",
    ...(audit.repairQueue.length
      ? audit.repairQueue.flatMap((item) => [
          `- ${item.priority}. ${item.owner}: ${item.label} (${item.severity})`,
          `  - Impact: ${item.reviewerImpact}`,
          `  - Action: ${item.action}`,
          `  - Recheck: ${item.recheck}`
        ])
      : ["- No repair queue open. Re-run this audit after publishing new proof URLs."]),
    "",
    "## Actions",
    ...(audit.actions.length ? audit.actions.map((action) => `- ${action.owner}: ${action.action}`) : ["- No repair action required."])
  ];
  return lines.join("\n");
}

function auditId(audit: Pick<BuyerProofAudit, "checkedAt" | "links" | "score">) {
  const payload = JSON.stringify({
    checkedAt: audit.checkedAt,
    score: audit.score,
    links: audit.links.map((link) => [link.id, link.status, link.httpStatus, link.finalUrl])
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function repairHref(value: string, fallback: string) {
  return /^https?:\/\//i.test(value.trim()) ? value.trim() : fallback;
}

export function sampleBuyerProofAuditLinks(baseUrl: string): BuyerProofAuditLinkSpec[] {
  const cleanBase = cleanBaseUrl(baseUrl);
  return [
    {
      id: "product-surface",
      label: "Product surface",
      value: cleanBase,
      href: cleanBase,
      category: "product",
      critical: true
    },
    {
      id: "healthz",
      label: "Cloud Run health",
      value: `${cleanBase}/api/healthz`,
      href: `${cleanBase}/api/healthz`,
      category: "product",
      critical: true
    },
    {
      id: "agent-card",
      label: "Agent Card",
      value: `${cleanBase}/.well-known/agent-card.json`,
      href: `${cleanBase}/.well-known/agent-card.json`,
      category: "agent-card",
      critical: true
    },
    {
      id: "buyer-brief",
      label: "Buyer brief",
      value: `${cleanBase}/sample/buyer-outcome-brief`,
      href: `${cleanBase}/sample/buyer-outcome-brief`,
      category: "buyer-proof",
      critical: true
    },
    {
      id: "work-order",
      label: "Work order proof",
      value: `${cleanBase}/sample/work-order-brief`,
      href: `${cleanBase}/sample/work-order-brief`,
      category: "buyer-proof",
      critical: true
    },
    {
      id: "pilot-receipt",
      label: "Pilot receipt",
      value: `${cleanBase}/sample/pilot-run-receipt`,
      href: `${cleanBase}/sample/pilot-run-receipt`,
      category: "pilot-proof",
      critical: true
    },
    {
      id: "procurement-decision",
      label: "Procurement decision",
      value: `${cleanBase}/sample/procurement-decision`,
      href: `${cleanBase}/sample/procurement-decision`,
      category: "buyer-proof",
      critical: true
    }
  ];
}

export function buyerWorkspaceProofAuditLinks(input: BuyerProofAuditWorkspaceInput): BuyerProofAuditLinkSpec[] {
  const appUrl = cleanBaseUrl(input.appUrl || "#");
  const proofFallback = `${appUrl}#launch-evidence-console`;
  return [
    {
      id: "targetUrl",
      label: "Deployed URL",
      value: input.targetUrl,
      href: repairHref(input.targetUrl, proofFallback),
      category: "product",
      critical: true
    },
    {
      id: "protopediaUrl",
      label: "ProtoPedia URL",
      value: input.protopediaUrl,
      href: repairHref(input.protopediaUrl, proofFallback),
      category: "buyer-proof",
      critical: true
    },
    {
      id: "videoUrl",
      label: "Demo video",
      value: input.videoUrl,
      href: repairHref(input.videoUrl, proofFallback),
      category: "buyer-proof",
      critical: true
    },
    {
      id: "pilotEvidenceUrl",
      label: "Pilot receipt",
      value: input.pilotEvidenceUrl,
      href: repairHref(input.pilotEvidenceUrl, `${appUrl}#pilot-run-receipt`),
      category: "pilot-proof",
      critical: true
    },
    {
      id: "workOrderEvidenceUrl",
      label: "Work order proof",
      value: input.workOrderEvidenceUrl,
      href: repairHref(input.workOrderEvidenceUrl, `${appUrl}#buyer-work-order-studio`),
      category: "buyer-proof",
      critical: true
    }
  ];
}

export function buildBuyerProofAudit(specs: BuyerProofAuditLinkSpec[], summary: PublicProofLinkVerificationSummary): BuyerProofAudit {
  const specById = new Map(specs.map((spec) => [spec.id, spec]));
  const links = summary.results.map((result): BuyerProofAuditLink => {
    const spec = specById.get(result.id);
    return {
      ...result,
      category: spec?.category ?? "buyer-proof",
      critical: spec?.critical ?? false,
      href: spec?.href ?? result.url
    };
  });
  const criticalLinks = links.filter((link) => link.critical);
  const criticalPassed = criticalLinks.filter((link) => link.status === "pass").length;
  const criticalTotal = criticalLinks.length;
  const watchCount = links.filter((link) => link.status === "watch").length;
  const blockCount = links.filter((link) => link.status === "block").length;
  const criticalScore = Math.round((criticalPassed / Math.max(1, criticalTotal)) * 100);
  const score = Math.round(clamp(summary.score * 0.72 + criticalScore * 0.28 - blockCount * 4));
  const verdict = verdictFor({ criticalPassed, criticalTotal, blockCount, watchCount });
  const repairQueue = buildRepairQueue(links);
  const actions = repairQueue
    .slice(0, 3)
    .map((item): BuyerProofAuditAction => ({
      id: `repair-${item.id.replace(/^queue-/, "")}`,
      label: `Repair ${item.label}`,
      owner: item.owner,
      href: item.href,
      action: item.action
    }));
  const auditWithoutMarkdown = {
    id: "",
    checkedAt: summary.checkedAt,
    verdict,
    score,
    headline: headlineFor(verdict),
    operatorLine: "",
    verifiedCount: summary.verifiedCount,
    totalCount: summary.totalCount,
    criticalPassed,
    criticalTotal,
    watchCount,
    blockCount,
    links,
    actions,
    repairQueue
  };
  const audit = {
    ...auditWithoutMarkdown,
    id: auditId({ ...auditWithoutMarkdown, links, score }),
    operatorLine: operatorLineFor(auditWithoutMarkdown)
  };
  return {
    ...audit,
    exportMarkdown: buildMarkdown(audit)
  };
}

export async function runBuyerProofAudit(specs: BuyerProofAuditLinkSpec[], deps: VerifyDeps = {}) {
  const summary = await verifyPublicProofLinks(
    specs.map((spec) => ({ id: spec.id, label: spec.label, value: spec.value })),
    deps
  );
  return buildBuyerProofAudit(specs, summary);
}

export function renderBuyerProofAuditHtml(audit: BuyerProofAudit, links: { jsonUrl: string; markdownUrl: string; appUrl: string; manifestUrl?: string }) {
  const statusCards = audit.links
    .map(
      (link) => `
        <article class="${escapeHtml(link.status)}">
          <div><span>${escapeHtml(link.category)}</span> <strong>${escapeHtml(statusLabel(link.status))}</strong></div>
          <h2>${escapeHtml(link.label)}</h2>
          <p>${escapeHtml(link.evidence)}</p>
          <a href="${escapeHtml(link.href)}">${escapeHtml(link.httpStatus ? `HTTP ${link.httpStatus}` : "Open proof")}</a>
        </article>`
    )
    .join("");
  const actionCards = audit.actions.length
    ? audit.actions
        .map(
          (action) => `
            <article>
              <span>${escapeHtml(action.owner)}</span>
              <strong>${escapeHtml(action.label)}</strong>
              <p>${escapeHtml(action.action)}</p>
              <a href="${escapeHtml(action.href)}">Open repair target</a>
            </article>`
        )
        .join("")
    : `<article class="clear"><span>Ready</span><strong>No repair action required</strong><p>All audited public proof links are reachable right now.</p></article>`;
  const repairRows = audit.repairQueue.length
    ? audit.repairQueue
        .map(
          (item) => `
            <article class="${escapeHtml(item.severity)}">
              <div><span>Priority ${escapeHtml(item.priority)}</span> <strong>${escapeHtml(item.owner)}</strong></div>
              <h2>${escapeHtml(item.label)}</h2>
              <p>${escapeHtml(item.reviewerImpact)}</p>
              <dl>
                <dt>Evidence</dt><dd>${escapeHtml(item.evidence)}</dd>
                <dt>Action</dt><dd>${escapeHtml(item.action)}</dd>
                <dt>Recheck</dt><dd>${escapeHtml(item.recheck)}</dd>
              </dl>
              <nav><a href="${escapeHtml(item.href)}">Open target</a><a href="${escapeHtml(links.jsonUrl)}">Rerun JSON audit</a></nav>
            </article>`
        )
        .join("")
    : `<article class="clear"><span>Ready</span><strong>No repair queue open</strong><p>Every checked artifact can be opened by a buyer. Re-run this audit after publishing new URLs.</p></article>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(audit.headline)}</title>
    <style>
      :root { color: #172126; background: #eef2ed; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      a { color: inherit; }
      header, main, footer { width: min(1180px, calc(100vw - 28px)); margin: 0 auto; }
      header { margin-top: 14px; padding: 24px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(120deg, #102226, #0f766e 58%, #2457a6); }
      .eyebrow, article span { color: #b8efd4; font-size: 0.72rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 780px; margin: 7px 0 0; font-size: clamp(2.2rem, 5vw, 4.7rem); line-height: 0.92; letter-spacing: 0; }
      header p { max-width: 820px; color: rgba(255,253,247,.82); line-height: 1.55; }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      nav a, article a { min-height: 34px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 8px 11px; font-size: .82rem; font-weight: 950; text-decoration: none; }
      nav a { color: #102226; background: #fffdf7; }
      .metrics { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin: 14px 0; }
      .metrics article, .grid article, .queue article, .actions article { min-width: 0; padding: 14px; border: 1px solid #c9d4ce; border-radius: 8px; background: #fffdf7; }
      .metrics strong { display: block; margin-top: 6px; font-size: 1.8rem; line-height: 1; }
      .grid, .actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
      .queue { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
      .grid article { border-top: 5px solid #b56576; }
      .grid article.pass { border-top-color: #0f766e; background: #eefaf4; }
      .grid article.watch { border-top-color: #f2b84b; background: #fff8e6; }
      .grid article.block { border-top-color: #b56576; background: #fff1f2; }
      .queue article { border-left: 5px solid #f2b84b; }
      .queue article.blocking { border-left-color: #b56576; background: #fff1f2; }
      .queue article.unstable { border-left-color: #f2b84b; background: #fff8e6; }
      article div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      article h2, article strong { overflow-wrap: anywhere; }
      article h2 { margin: 10px 0 0; font-size: 1.06rem; line-height: 1.1; }
      article p { color: #52645f; line-height: 1.38; overflow-wrap: anywhere; }
      article a { width: fit-content; border: 1px solid rgba(23,33,38,.14); background: #edf3ef; }
      article dl { display: grid; grid-template-columns: minmax(72px, .28fr) minmax(0, 1fr); gap: 7px 10px; margin: 12px 0 0; color: #52645f; font-size: .86rem; line-height: 1.34; }
      article dt { color: #172126; font-weight: 900; }
      article dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
      .actions article.clear { grid-column: 1 / -1; border-color: #add6bd; background: #edf8f1; }
      .queue article.clear { grid-column: 1 / -1; border-color: #add6bd; background: #edf8f1; }
      footer { margin-bottom: 24px; color: #64706b; font-size: .8rem; }
      @media (max-width: 900px) { .metrics, .grid, .queue, .actions { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 560px) { header { padding: 16px; } .metrics, .grid, .queue, .actions { grid-template-columns: 1fr; } nav a, article a { width: 100%; } article dl { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <span class="eyebrow">Buyer Proof Audit</span>
      <h1>${escapeHtml(audit.headline)}</h1>
      <p>${escapeHtml(audit.operatorLine)}</p>
      <nav><a href="${escapeHtml(links.jsonUrl)}">JSON</a><a href="${escapeHtml(links.markdownUrl)}">Markdown</a>${links.manifestUrl ? `<a href="${escapeHtml(links.manifestUrl)}">Trust manifest</a>` : ""}<a href="${escapeHtml(links.appUrl)}">Open app</a></nav>
    </header>
    <main>
      <section class="metrics" aria-label="Audit metrics">
        <article><span>Score</span><strong>${escapeHtml(audit.score)}</strong></article>
        <article><span>Verdict</span><strong>${escapeHtml(audit.verdict)}</strong></article>
        <article><span>Critical proof</span><strong>${escapeHtml(`${audit.criticalPassed}/${audit.criticalTotal}`)}</strong></article>
        <article><span>Live links</span><strong>${escapeHtml(`${audit.verifiedCount}/${audit.totalCount}`)}</strong></article>
        <article><span>Repairs</span><strong>${escapeHtml(audit.blockCount + audit.watchCount)}</strong></article>
      </section>
      <section class="grid" aria-label="Audited proof links">${statusCards}</section>
      <section class="queue" aria-label="Repair queue">${repairRows}</section>
      <section class="actions" aria-label="Audit actions">${actionCards}</section>
    </main>
    <footer>Audit id ${escapeHtml(audit.id)} checked at ${escapeHtml(audit.checkedAt)}</footer>
  </body>
</html>`;
}
