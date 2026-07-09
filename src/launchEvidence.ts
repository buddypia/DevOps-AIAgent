import { summarizeAgentTrialEvidence, type AgentTrialEvidenceRecord } from "./agentTrialEvidence.js";
import type { ExternalEvidenceRun } from "./externalEvidence.js";
import type { LiveEvidenceRun } from "./liveEvidence.js";
import type { ReleaseDriftGuard } from "./releaseDrift.js";

export type LaunchEvidenceReadiness = "launch-ready" | "proof-watch" | "blocked";

export type LaunchEvidenceLane = {
  id: "live" | "external" | "release" | "proof" | "trial";
  label: string;
  readiness: string;
  score: number;
  summary: string;
};

export type LaunchEvidenceAction = {
  id: string;
  lane: "live" | "external" | "release" | "proof" | "trial";
  label: string;
  priority: "now" | "next";
  action: string;
  proof: string;
};

export type LaunchEvidenceProofArtifact = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type LaunchEvidenceProofVerification = {
  id: string;
  label: string;
  url: string;
  status: "pass" | "watch" | "block";
  httpStatus?: number;
  finalUrl?: string;
  contentType?: string;
  evidence: string;
  action: string;
};

export type LaunchEvidenceProofVerificationSummary = {
  checkedAt: string;
  verifiedCount: number;
  totalCount: number;
  score: number;
  results: LaunchEvidenceProofVerification[];
};

export type LaunchEvidenceDecision = {
  id: string;
  generatedAt: string;
  readiness: LaunchEvidenceReadiness;
  evidenceScore: number;
  headline: string;
  hardTruth: string;
  passedProbes: number;
  totalProbes: number;
  openGaps: number;
  lanes: LaunchEvidenceLane[];
  nextActions: LaunchEvidenceAction[];
  proofArtifacts: LaunchEvidenceProofArtifact[];
  proofVerification?: LaunchEvidenceProofVerificationSummary;
  exportMarkdown: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function proofReadiness(proofVerification: LaunchEvidenceProofVerificationSummary | undefined) {
  if (!proofVerification) return "not-checked";
  if (proofVerification.results.some((result) => result.status === "block")) return "blocked";
  if (proofVerification.results.some((result) => result.status === "watch")) return "proof-watch";
  return "proof-ready";
}

function readinessFrom(
  live: LiveEvidenceRun,
  external: ExternalEvidenceRun,
  release: ReleaseDriftGuard | undefined,
  trial: ReturnType<typeof summarizeAgentTrialEvidence>,
  proofVerification: LaunchEvidenceProofVerificationSummary | undefined
): LaunchEvidenceReadiness {
  if (live.readiness === "blocked" || external.readiness === "blocked") return "blocked";
  if (release?.verdict === "release-blocked") return "blocked";
  const proofStatus = proofReadiness(proofVerification);
  if (proofStatus === "blocked") return "blocked";
  if (release?.verdict === "deploy-drift") return "proof-watch";
  if (proofStatus === "proof-watch") return "proof-watch";
  if (
    live.readiness === "live-ready" &&
    external.readiness === "external-ready" &&
    (!release || release.verdict === "release-current") &&
    (!proofVerification || proofStatus === "proof-ready") &&
    trial.status === "ready"
  ) {
    return "launch-ready";
  }
  return "proof-watch";
}

function headlineFor(readiness: LaunchEvidenceReadiness) {
  if (readiness === "launch-ready") return "Launch evidence is ready to show";
  if (readiness === "blocked") return "A required public proof is blocked";
  return "Public proof is running, but final evidence is not sealed";
}

function hardTruthFor(readiness: LaunchEvidenceReadiness, openGaps: number) {
  if (readiness === "launch-ready") {
    return "The product has live operational proof and externally reachable submission assets in the same evidence run.";
  }
  if (readiness === "blocked") {
    return "Do not call this production-ready yet. A required public proof must be restored before a buyer or judge can trust the launch.";
  }
  return `${openGaps} proof gap${openGaps === 1 ? "" : "s"} remain. The product is useful, but the final public evidence still needs closure.`;
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
  if (["launch-ready", "live-ready", "external-ready", "release-current", "proof-ready", "ready", "passed", "pass"].includes(status)) return "good";
  if (["blocked", "release-blocked", "missing"].includes(status) || status.includes("blocked")) return "bad";
  return "watch";
}

function exportMarkdown(input: {
  readiness: LaunchEvidenceReadiness;
  evidenceScore: number;
  headline: string;
  hardTruth: string;
  live: LiveEvidenceRun;
  external: ExternalEvidenceRun;
  release?: ReleaseDriftGuard;
  proofArtifacts: LaunchEvidenceProofArtifact[];
  proofVerification?: LaunchEvidenceProofVerificationSummary;
  trial: ReturnType<typeof summarizeAgentTrialEvidence>;
  actions: LaunchEvidenceAction[];
}) {
  const actions =
    input.actions.length === 0
      ? "- No open actions"
      : input.actions.map((action) => `- [${action.priority}] ${action.label}: ${action.action}`).join("\n");
  const proofArtifacts =
    input.proofArtifacts.length === 0
      ? ["- No buyer proof artifacts attached"]
      : input.proofArtifacts.map((artifact) => {
          const result = input.proofVerification?.results.find((item) => item.id === artifact.id);
          const status = result ? `${result.status}${result.httpStatus ? ` ${result.httpStatus}` : ""}` : "not checked";
          const value = artifact.value.trim() || "missing";
          return `- [${status}] ${artifact.label}: ${value}${result ? ` — ${result.action}` : ""}`;
        });

  return [
    `# ${input.headline}`,
    "",
    `Readiness: ${input.readiness}`,
    `Evidence score: ${input.evidenceScore}/100`,
    "",
    input.hardTruth,
    "",
    "## Evidence lanes",
    `- Live evidence: ${input.live.readiness} (${input.live.evidenceScore}/100)`,
    `- External evidence: ${input.external.readiness} (${input.external.evidenceScore}/100)`,
    ...(input.release ? [`- Release drift: ${input.release.verdict} (${input.release.driftScore}/100)`] : []),
    ...(input.proofVerification ? [`- Buyer proof artifacts: ${proofReadiness(input.proofVerification)} (${input.proofVerification.score}/100)`] : []),
    `- A2A trial proof: ${input.trial.status} (${input.trial.bestScore}/100)`,
    "",
    "## Buyer proof artifacts",
    ...proofArtifacts,
    "",
    "## Next actions",
    actions
  ].join("\n");
}

export function buildLaunchEvidenceDecision(input: {
  liveEvidence: LiveEvidenceRun;
  externalEvidence: ExternalEvidenceRun;
  releaseDrift?: ReleaseDriftGuard;
  proofArtifacts?: LaunchEvidenceProofArtifact[];
  proofVerification?: LaunchEvidenceProofVerificationSummary;
  agentTrialEvidence?: AgentTrialEvidenceRecord[];
  generatedAt?: string;
}): LaunchEvidenceDecision {
  const { liveEvidence, externalEvidence, releaseDrift, proofVerification } = input;
  const proofArtifacts = input.proofArtifacts ?? [];
  const trial = summarizeAgentTrialEvidence(input.agentTrialEvidence ?? []);
  const readiness = readinessFrom(liveEvidence, externalEvidence, releaseDrift, trial, proofVerification);
  const evidenceScore = releaseDrift
    ? proofVerification
      ? Math.round(clamp(liveEvidence.evidenceScore * 0.3 + externalEvidence.evidenceScore * 0.22 + releaseDrift.driftScore * 0.2 + proofVerification.score * 0.18 + trial.bestScore * 0.1))
      : Math.round(clamp(liveEvidence.evidenceScore * 0.4 + externalEvidence.evidenceScore * 0.27 + releaseDrift.driftScore * 0.23 + trial.bestScore * 0.1))
    : proofVerification
      ? Math.round(clamp(liveEvidence.evidenceScore * 0.42 + externalEvidence.evidenceScore * 0.27 + proofVerification.score * 0.21 + trial.bestScore * 0.1))
      : Math.round(clamp(liveEvidence.evidenceScore * 0.55 + externalEvidence.evidenceScore * 0.35 + trial.bestScore * 0.1));
  const allProbes = [...liveEvidence.probes, ...externalEvidence.probes, ...(releaseDrift?.probes ?? [])];
  const trialProbePassed = trial.status === "ready" ? 1 : 0;
  const proofPassed = proofVerification?.verifiedCount ?? 0;
  const proofTotal = proofVerification?.totalCount ?? 0;
  const passedProbes = allProbes.filter((probe) => probe.status === "passed").length + trialProbePassed + proofPassed;
  const totalProbes = allProbes.length + 1 + proofTotal;
  const openGaps = totalProbes - passedProbes;
  const headline = headlineFor(readiness);
  const hardTruth = hardTruthFor(readiness, openGaps);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const nextActions: LaunchEvidenceAction[] = [
    ...liveEvidence.nextActions.map((action) => ({
      ...action,
      id: `live-${action.id}`,
      lane: "live" as const
    })),
    ...externalEvidence.nextActions.map((action) => ({
      ...action,
      id: `external-${action.id}`,
      lane: "external" as const
    })),
    ...(releaseDrift?.nextActions.map((action) => ({
      id: `release-${action.id}`,
      lane: "release" as const,
      label: action.owner,
      priority: action.priority,
      action: action.action,
      proof: action.proof
    })) ?? []),
    ...(proofVerification?.results
      .filter((result) => result.status !== "pass")
      .map((result) => ({
        id: `proof-${result.id}`,
        lane: "proof" as const,
        label: result.label,
        priority: result.status === "block" ? ("now" as const) : ("next" as const),
        action: result.action,
        proof: result.evidence
      })) ?? []),
    ...(trial.status === "ready"
      ? []
      : [
          {
            id: "trial-attach-a2a-proof",
            lane: "trial" as const,
            label: "A2A trial proof",
            priority: "now" as const,
            action: "Attach an accepted Agent Card trial verification before calling launch evidence sealed.",
            proof: trial.evidence
          }
        ])
  ].sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "now" ? -1 : 1));

  const lanes: LaunchEvidenceLane[] = [
    {
      id: "live",
      label: "Live product proof",
      readiness: liveEvidence.readiness,
      score: liveEvidence.evidenceScore,
      summary: liveEvidence.summary
    },
    {
      id: "external",
      label: "Submission URL proof",
      readiness: externalEvidence.readiness,
      score: externalEvidence.evidenceScore,
      summary: externalEvidence.summary
    },
    ...(releaseDrift
      ? [
          {
            id: "release" as const,
            label: "Release drift proof",
            readiness: releaseDrift.verdict,
            score: releaseDrift.driftScore,
            summary: releaseDrift.summary
          }
        ]
      : []),
    ...(proofVerification
      ? [
          {
            id: "proof" as const,
            label: "Buyer proof artifacts",
            readiness: proofReadiness(proofVerification),
            score: proofVerification.score,
            summary: `${proofVerification.verifiedCount}/${proofVerification.totalCount} public proof artifacts verified live.`
          }
        ]
      : []),
    {
      id: "trial",
      label: "A2A trial proof",
      readiness: trial.status,
      score: trial.bestScore,
      summary: trial.evidence
    }
  ];

  return {
    id: `launch-evidence-${evidenceScore}-${readiness}`,
    generatedAt,
    readiness,
    evidenceScore,
    headline,
    hardTruth,
    passedProbes,
    totalProbes,
    openGaps,
    lanes,
    nextActions,
    proofArtifacts,
    proofVerification,
    exportMarkdown: exportMarkdown({
      readiness,
      evidenceScore,
      headline,
      hardTruth,
      live: liveEvidence,
      external: externalEvidence,
      release: releaseDrift,
      proofArtifacts,
      proofVerification,
      trial,
      actions: nextActions
    })
  };
}

export function renderLaunchEvidenceHtml(
  decision: LaunchEvidenceDecision,
  links: { appUrl?: string; launchRoomUrl?: string; globalAuditUrl?: string; jsonUrl?: string; markdownUrl?: string } = {}
) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.globalAuditUrl ? `<a href="${escapeHtml(links.globalAuditUrl)}">Global audit</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = [
    { label: "Evidence score", value: `${decision.evidenceScore}/100`, status: decision.readiness },
    { label: "Probe closure", value: `${decision.passedProbes}/${decision.totalProbes}`, status: decision.openGaps === 0 ? "passed" : "watch" },
    { label: "Open gaps", value: decision.openGaps, status: decision.openGaps === 0 ? "passed" : "missing" },
    { label: "Generated", value: new Date(decision.generatedAt).toISOString().slice(0, 16).replace("T", " "), status: "passed" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(String(metric.status))}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const lanes = decision.lanes
    .map(
      (lane) => `
        <article class="lane ${tone(lane.readiness)}">
          <div>
            <span>${escapeHtml(lane.readiness)}</span>
            <b>${escapeHtml(lane.score)}</b>
          </div>
          <strong>${escapeHtml(lane.label)}</strong>
          <p>${escapeHtml(lane.summary)}</p>
        </article>`
    )
    .join("");
  const proofResultById = new Map((decision.proofVerification?.results ?? []).map((result) => [result.id, result]));
  const proofArtifacts =
    decision.proofArtifacts.length === 0
      ? `<article class="proof-card watch"><span>not attached</span><strong>No buyer proof artifacts</strong><p>The workspace did not provide public proof artifact URLs for this report.</p></article>`
      : decision.proofArtifacts
          .map((artifact) => {
            const result = proofResultById.get(artifact.id);
            const status = result?.status ?? (artifact.value.trim() ? "watch" : "block");
            const url = result?.url || artifact.value.trim();
            const statusLine = result ? `${result.status}${result.httpStatus ? ` / HTTP ${result.httpStatus}` : ""}` : artifact.value.trim() ? "attached / not checked" : "missing";
            const evidence = result?.evidence ?? (artifact.value.trim() ? "Attached but not live-checked in this report." : "No public URL is attached.");
            const action = result?.action ?? (artifact.value.trim() ? "Run the live proof check before sharing." : `Attach a public URL for ${artifact.label}.`);
            const href = url || artifact.href || "#";
            return `
              <article class="proof-card ${tone(status)}">
                <span>${escapeHtml(statusLine)}</span>
                <strong>${escapeHtml(artifact.label)}</strong>
                <p>${escapeHtml(evidence)}</p>
                <small>${escapeHtml(action)}</small>
                ${href && href !== "#" ? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">Open proof</a>` : ""}
              </article>`;
          })
          .join("");
  const actions =
    decision.nextActions.length === 0
      ? `<article class="action good"><strong>All launch evidence is sealed</strong><p>The report has no open public proof actions.</p></article>`
      : decision.nextActions
          .map(
            (action) => `
              <article class="action ${action.priority === "now" ? "bad" : "watch"}">
                <span>${escapeHtml(action.priority)} / ${escapeHtml(action.lane)}</span>
                <strong>${escapeHtml(action.label)}</strong>
                <p>${escapeHtml(action.action)}</p>
                <small>${escapeHtml(action.proof)}</small>
              </article>`
          )
          .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(decision.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #18211f; --muted: #5c6864; --paper: #f5f7f2; --panel: #fffdf7; --line: #cbd8d0; --green: #0f766e; --blue: #2457a6; --rose: #b1344f; --amber: #8a620d; --green-bg: #edf9f3; --blue-bg: #f0f6ff; --rose-bg: #fff1f2; --shadow: 0 18px 46px rgba(24, 33, 31, .08); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 22px; align-items: end; padding: 42px 0 18px; }
      .eyebrow, .metric span, .lane span, .action span, h2 { color: var(--green); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 900px; margin: 8px 0 10px; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 6px 0 8px; }
      p { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-weight: 900; text-decoration: none; }
      .score { min-height: 190px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid #18211f; border-radius: 8px; color: #fffdf7; background: #18211f; box-shadow: var(--shadow); text-align: center; }
      .score span { color: rgba(255, 253, 247, .72); font-size: .76rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 4.4rem; line-height: .88; }
      .score small { max-width: 190px; color: rgba(255, 253, 247, .78); font-weight: 900; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .lanes, .actions, .proof-grid { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .lanes { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .proof-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .metric, .lane, .action, .narrative, .proof-card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 10px 26px rgba(24, 33, 31, .05); }
      .metric, .lane, .action, .narrative, .proof-card { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.12rem; line-height: 1.12; overflow-wrap: anywhere; }
      .narrative strong { display: block; margin-top: 6px; font-size: 1.2rem; line-height: 1.24; overflow-wrap: anywhere; }
      .lane { display: grid; gap: 8px; border-top: 5px solid var(--blue); }
      .lane.good, .metric.good, .action.good, .proof-card.good { border-top-color: var(--green); background: var(--green-bg); }
      .lane.watch, .metric.watch, .action.watch, .proof-card.watch { border-top-color: var(--blue); background: var(--blue-bg); }
      .lane.bad, .metric.bad, .action.bad, .proof-card.bad { border-top-color: var(--rose); background: var(--rose-bg); }
      .lane div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .lane b { font-size: 1.65rem; line-height: 1; }
      .lane strong, .lane p, .action strong, .action p, .action small { overflow-wrap: anywhere; }
      .action { display: grid; gap: 7px; border-left: 5px solid var(--blue); }
      .action.bad { border-left-color: var(--rose); }
      .action.good { border-left-color: var(--green); }
      .action small { color: var(--muted); font-weight: 820; }
      .proof-card { display: grid; gap: 7px; border-top: 5px solid var(--blue); }
      .proof-card span { color: var(--green); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .proof-card strong, .proof-card p, .proof-card small, .proof-card a { overflow-wrap: anywhere; }
      .proof-card small { color: var(--muted); font-weight: 820; }
      .proof-card a { width: fit-content; border: 1px solid var(--line); border-radius: 999px; padding: 6px 9px; background: rgba(255, 253, 247, .7); font-size: .8rem; font-weight: 950; text-decoration: none; }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 1040px) { .proof-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 880px) { header, .metrics, .lanes, .actions, .proof-grid { grid-template-columns: 1fr; } .score { min-height: 138px; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Launch Evidence Report</span>
        <h1>${escapeHtml(decision.headline)}</h1>
        <p>${escapeHtml(decision.hardTruth)}</p>
        <nav>${nav}</nav>
      </div>
      <div class="score">
        <span>${escapeHtml(decision.readiness)}</span>
        <strong>${escapeHtml(decision.evidenceScore)}</strong>
        <small>${escapeHtml(`${decision.openGaps} open proof gaps`)}</small>
      </div>
    </header>
    <main>
      <section class="metrics" aria-label="Launch evidence metrics">${metrics}</section>
      <section class="narrative" aria-label="Launch evidence narrative">
        <h2>What this proves</h2>
        <strong>${escapeHtml(`${decision.passedProbes}/${decision.totalProbes} public probes are sealed across live product, final submission URLs, buyer proof artifacts, release drift, and A2A trial evidence.`)}</strong>
      </section>
      <section class="proof-grid" aria-label="Buyer proof artifacts">${proofArtifacts}</section>
      <section class="lanes" aria-label="Evidence lanes">${lanes}</section>
      <section class="actions" aria-label="Evidence actions">${actions}</section>
    </main>
    <footer>Generated by AI Agent Value Blueprint. This report is a public launch evidence receipt, not a substitute for legal, security, or procurement review.</footer>
  </body>
</html>`;
}
