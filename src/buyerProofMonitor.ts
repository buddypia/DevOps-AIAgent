import type { BuyerShareGateProofLink, BuyerShareGateProofVerificationSummary } from "./buyerShareGate.js";

export type BuyerProofMonitorReadiness = "not-armed" | "evidence-current" | "evidence-watch" | "evidence-blocked";
export type BuyerProofMonitorStatus = "pass" | "watch" | "block";

export type BuyerProofMonitorCheck = {
  id: string;
  label: string;
  status: BuyerProofMonitorStatus;
  evidence: string;
  owner: string;
  nextCheck: string;
};

export type BuyerProofMonitor = {
  readiness: BuyerProofMonitorReadiness;
  score: number;
  headline: string;
  hardTruth: string;
  checkedAt: string;
  freshnessHours: number | null;
  verifiedCount: number;
  totalCount: number;
  stopExternalSharing: boolean;
  checks: BuyerProofMonitorCheck[];
  runbook: string[];
  exportMarkdown: string;
};

const CURRENT_WINDOW_HOURS = 24;
const STALE_WINDOW_HOURS = 72;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hoursSince(checkedAt: string, now: Date) {
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) return null;
  return Math.max(0, Math.round(((now.getTime() - checked.getTime()) / 3_600_000) * 10) / 10);
}

function statusScore(status: BuyerProofMonitorStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 18;
}

function freshnessStatus(freshnessHours: number | null): BuyerProofMonitorStatus {
  if (freshnessHours === null) return "block";
  if (freshnessHours <= CURRENT_WINDOW_HOURS) return "pass";
  if (freshnessHours <= STALE_WINDOW_HOURS) return "watch";
  return "block";
}

function readinessFrom(checks: BuyerProofMonitorCheck[], verification?: BuyerShareGateProofVerificationSummary): BuyerProofMonitorReadiness {
  if (!verification) return "not-armed";
  if (checks.some((check) => check.status === "block")) return "evidence-blocked";
  if (checks.some((check) => check.status === "watch")) return "evidence-watch";
  return "evidence-current";
}

function headlineFor(readiness: BuyerProofMonitorReadiness) {
  if (readiness === "evidence-current") return "Buyer proof monitor is current";
  if (readiness === "evidence-watch") return "Buyer proof monitor needs a near-term recheck";
  if (readiness === "evidence-blocked") return "Buyer proof monitor stops external sharing";
  return "Buyer proof monitor is not armed yet";
}

function hardTruthFor(readiness: BuyerProofMonitorReadiness, openCount: number) {
  if (readiness === "evidence-current") {
    return "The buyer-facing proof links are freshly checked and can support the current launch room.";
  }
  if (readiness === "evidence-watch") {
    return `${openCount} proof monitor item${openCount === 1 ? "" : "s"} need a recheck before this can stay credible for external review.`;
  }
  if (readiness === "evidence-blocked") {
    return `${openCount} proof monitor blocker${openCount === 1 ? "" : "s"} should stop buyer sharing until the evidence is reachable again.`;
  }
  return "Run the live proof check before treating pasted URLs as buyer-facing evidence.";
}

function buildChecks(input: {
  proofLinks: BuyerShareGateProofLink[];
  verification?: BuyerShareGateProofVerificationSummary;
  freshnessHours: number | null;
}): BuyerProofMonitorCheck[] {
  if (!input.verification) {
    const attached = input.proofLinks.filter((link) => /^https?:\/\//i.test(link.value.trim())).length;
    return [
      {
        id: "verification-run",
        label: "Live verification",
        status: "block",
        evidence: `${attached}/${input.proofLinks.length} links have URL-shaped proof, but none have been checked live in this session.`,
        owner: "Launch operator",
        nextCheck: "Run Verify live links before external sharing."
      },
      {
        id: "freshness",
        label: "Freshness window",
        status: "block",
        evidence: "No checkedAt timestamp exists yet.",
        owner: "Launch operator",
        nextCheck: "Create the first reachability timestamp."
      }
    ];
  }

  const blocked = input.verification.results.filter((result) => result.status === "block").length;
  const watch = input.verification.results.filter((result) => result.status === "watch").length;
  const pass = input.verification.results.filter((result) => result.status === "pass").length;
  const firstOpen = input.verification.results.find((result) => result.status === "block") ?? input.verification.results.find((result) => result.status === "watch");
  const freshStatus = freshnessStatus(input.freshnessHours);
  return [
    {
      id: "reachability",
      label: "Public reachability",
      status: blocked > 0 ? "block" : watch > 0 ? "watch" : "pass",
      evidence: `${pass}/${input.verification.totalCount} links pass, ${watch} watch, ${blocked} blocked.`,
      owner: "Launch operator",
      nextCheck: firstOpen ? firstOpen.action : "Recheck before buyer share and every 24 hours during review."
    },
    {
      id: "freshness",
      label: "Freshness window",
      status: freshStatus,
      evidence: input.freshnessHours === null ? "The verification timestamp is invalid." : `Last live check was ${input.freshnessHours} hours ago.`,
      owner: "Launch operator",
      nextCheck:
        freshStatus === "pass"
          ? "Next routine check is due within 24 hours."
          : freshStatus === "watch"
            ? "Recheck before the next sponsor or buyer review."
            : "Run a new live check before external sharing."
    },
    {
      id: "share-stop-rule",
      label: "Share stop rule",
      status: blocked > 0 || freshStatus === "block" ? "block" : watch > 0 || freshStatus === "watch" ? "watch" : "pass",
      evidence: blocked > 0 ? "At least one buyer-facing proof link is blocked." : watch > 0 ? "At least one buyer-facing proof link is unstable." : "No live proof blockers are open.",
      owner: "Buyer sponsor",
      nextCheck: blocked > 0 ? "Stop external sharing until every blocked link is replaced or fixed." : "Keep the launch room open with daily proof checks."
    }
  ];
}

function buildRunbook(input: {
  monitor: Omit<BuyerProofMonitor, "exportMarkdown" | "runbook">;
  verification?: BuyerShareGateProofVerificationSummary;
}) {
  if (!input.verification) {
    return [
      "Run Verify live links from Buyer proof intake.",
      "Do not send the launch room until the monitor has a checkedAt timestamp.",
      "Attach replacement URLs for any proof artifact that cannot be verified live."
    ];
  }

  const open = input.verification.results.filter((result) => result.status !== "pass");
  if (input.monitor.readiness === "evidence-current") {
    return [
      "Recheck all buyer proof links every 24 hours while the launch room is under review.",
      "If any link returns watch or block, freeze external sharing and rerun the Buyer Share Gate.",
      "Keep the latest proof monitor export with the launch room handoff."
    ];
  }
  return [
    `Fix or replace ${open[0]?.label ?? "the first open proof link"} before sending the launch room.`,
    "Rerun Verify live links after every proof URL change.",
    "Resume external sharing only after the monitor has no blocked checks."
  ];
}

function buildMarkdown(input: Omit<BuyerProofMonitor, "exportMarkdown">) {
  return [
    `# ${input.headline}`,
    "",
    "Buyer Proof Monitor",
    "",
    `Readiness: ${input.readiness}`,
    `Monitor score: ${input.score}/100`,
    `Checked at: ${input.checkedAt || "not checked"}`,
    `Freshness: ${input.freshnessHours === null ? "not available" : `${input.freshnessHours} hours`}`,
    `Verified links: ${input.verifiedCount}/${input.totalCount}`,
    `Stop external sharing: ${input.stopExternalSharing ? "yes" : "no"}`,
    "",
    input.hardTruth,
    "",
    "## Checks",
    ...input.checks.map((check) => `- [${check.status}] ${check.label} (${check.owner}): ${check.evidence} Next: ${check.nextCheck}`),
    "",
    "## Runbook",
    ...input.runbook.map((step) => `- ${step}`)
  ].join("\n");
}

export function buildBuyerProofMonitor(input: {
  proofLinks: BuyerShareGateProofLink[];
  verification?: BuyerShareGateProofVerificationSummary | null;
  now?: Date;
}): BuyerProofMonitor {
  const verification = input.verification ?? undefined;
  const now = input.now ?? new Date();
  const freshnessHours = verification ? hoursSince(verification.checkedAt, now) : null;
  const checks = buildChecks({ proofLinks: input.proofLinks, verification, freshnessHours });
  const readiness = readinessFrom(checks, verification);
  const openCount = checks.filter((check) => check.status !== "pass").length;
  const score = verification ? Math.round(clamp(average([verification.score, ...checks.map((check) => statusScore(check.status))]))) : Math.round(clamp((input.proofLinks.filter((link) => /^https?:\/\//i.test(link.value.trim())).length / Math.max(1, input.proofLinks.length)) * 40));
  const partial: Omit<BuyerProofMonitor, "exportMarkdown" | "runbook"> = {
    readiness,
    score,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, openCount),
    checkedAt: verification?.checkedAt ?? "",
    freshnessHours,
    verifiedCount: verification?.verifiedCount ?? 0,
    totalCount: verification?.totalCount ?? input.proofLinks.length,
    stopExternalSharing: readiness === "not-armed" || readiness === "evidence-blocked",
    checks
  };
  const runbook = buildRunbook({ monitor: partial, verification });
  const monitor = {
    ...partial,
    runbook
  };
  return {
    ...monitor,
    exportMarkdown: buildMarkdown(monitor)
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

function tone(status: BuyerProofMonitorStatus | BuyerProofMonitorReadiness) {
  if (status === "pass" || status === "evidence-current") return "pass";
  if (status === "watch" || status === "evidence-watch") return "watch";
  return "block";
}

export function renderBuyerProofMonitorHtml(
  monitor: BuyerProofMonitor,
  links: { appUrl?: string; launchRoomUrl?: string; recoveryUrl?: string; jsonUrl?: string; markdownUrl?: string } = {}
) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.recoveryUrl ? `<a href="${escapeHtml(links.recoveryUrl)}">Recovery desk</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const checks = monitor.checks
    .map(
      (check) => `
        <article class="${tone(check.status)}">
          <div><span>${escapeHtml(check.status)}</span><strong>${escapeHtml(check.label)}</strong></div>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.owner)} - ${escapeHtml(check.nextCheck)}</small>
        </article>`
    )
    .join("");
  const runbook = monitor.runbook.map((step) => `<li>${escapeHtml(step)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(monitor.headline)}</title>
    <style>
      :root { color: #172126; background: #eef2ed; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      header, main, footer { width: min(1160px, calc(100% - 28px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: end; padding: 30px 0 14px; }
      h1, h2, p { margin: 0; }
      h1 { max-width: 860px; font-size: clamp(2.1rem, 5vw, 4.4rem); line-height: .96; letter-spacing: 0; }
      nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
      nav a, .export { border: 1px solid #c8d4ce; border-radius: 999px; padding: 8px 11px; color: #172126; background: #fffdf7; font-size: .84rem; font-weight: 850; text-decoration: none; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 14px; padding: 18px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(135deg, #172126, #0f766e); }
      .hero p { max-width: 760px; margin-top: 10px; color: rgba(255,253,247,.78); line-height: 1.55; }
      .score { display: grid; align-content: center; justify-items: center; min-height: 160px; border: 1px solid rgba(255,253,247,.24); border-radius: 8px; background: rgba(255,253,247,.09); text-align: center; }
      .score span, .metric span, article span, h2 { color: #0f766e; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .hero .score span { color: #d8fff5; }
      .score strong { font-size: 4rem; line-height: .9; }
      .metrics, .checks { display: grid; gap: 10px; margin-top: 14px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .checks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric, article, .runbook { min-width: 0; border: 1px solid #d5ded8; border-radius: 8px; background: #fffdf7; padding: 14px; }
      .metric strong { display: block; margin-top: 5px; font-size: 1.25rem; overflow-wrap: anywhere; }
      article { display: grid; gap: 8px; border-left: 5px solid #0f766e; }
      article.watch { border-left-color: #f2b84b; background: #fff8e6; }
      article.block { border-left-color: #b56576; background: #fff1f2; }
      article div { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
      article.watch span { color: #806000; }
      article.block span { color: #8d2d42; }
      strong, p, small, li { overflow-wrap: anywhere; }
      p, small, li { color: #44514d; line-height: 1.45; }
      .runbook { margin-top: 14px; }
      ol { display: grid; gap: 8px; margin: 8px 0 0; padding-left: 22px; }
      footer { padding: 18px 0 32px; color: #64706b; font-size: .86rem; }
      @media (max-width: 820px) { header, .hero, .metrics, .checks { grid-template-columns: 1fr; } nav { justify-content: flex-start; } .score { min-height: 120px; } }
    </style>
  </head>
  <body>
    <header>
      <div><h1>${escapeHtml(monitor.headline)}</h1></div>
      <nav>${nav}</nav>
    </header>
    <main>
      <section class="hero">
        <div>
          <span>${escapeHtml(monitor.readiness)}</span>
          <p>${escapeHtml(monitor.hardTruth)}</p>
          <p>${escapeHtml(monitor.stopExternalSharing ? "External sharing is stopped until proof is current." : "External sharing can stay open with routine checks.")}</p>
        </div>
        <div class="score"><span>Monitor score</span><strong>${escapeHtml(monitor.score)}</strong><small>${escapeHtml(monitor.verifiedCount)}/${escapeHtml(monitor.totalCount)} verified</small></div>
      </section>
      <section class="metrics">
        <article class="metric"><span>Checked at</span><strong>${escapeHtml(monitor.checkedAt || "not checked")}</strong></article>
        <article class="metric"><span>Freshness</span><strong>${escapeHtml(monitor.freshnessHours === null ? "n/a" : `${monitor.freshnessHours}h`)}</strong></article>
        <article class="metric"><span>Share stop</span><strong>${escapeHtml(monitor.stopExternalSharing ? "yes" : "no")}</strong></article>
        <article class="metric"><span>Links</span><strong>${escapeHtml(`${monitor.verifiedCount}/${monitor.totalCount}`)}</strong></article>
      </section>
      <h2>Checks</h2>
      <section class="checks">${checks}</section>
      <section class="runbook"><h2>Runbook</h2><ol>${runbook}</ol></section>
    </main>
    <footer>Generated by A2A Agent Marketplace as a buyer-facing proof monitor.</footer>
  </body>
</html>`;
}
