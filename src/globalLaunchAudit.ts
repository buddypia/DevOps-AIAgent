import { summarizeAgentTrialEvidence } from "./agentTrialEvidence.js";
import { buildBuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun.js";
import type { BuyerValueScenario } from "./buyerValueScenario.js";
import type { BuyerWorkOrderInput } from "./buyerWorkOrder.js";
import type { LaunchRoom } from "./launchRoom.js";
import type { PilotRunReceiptInput } from "./pilotRunReceipt.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { CapabilityKey, Recommendation } from "./types.js";
import type { ValueBlueprint } from "./valueBlueprint.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type GlobalLaunchAuditReadiness = "global-ready" | "launchable-with-gaps" | "private-beta" | "not-ready";
export type GlobalLaunchAuditStatus = "pass" | "watch" | "block";
export type GlobalLaunchAuditDimensionId = "buyer-value" | "live-surface" | "proof-depth" | "measured-outcome" | "production-ops" | "trust-offer";

export type GlobalLaunchAuditDimension = {
  id: GlobalLaunchAuditDimensionId;
  label: string;
  status: GlobalLaunchAuditStatus;
  score: number;
  evidence: string;
  action: string;
  href: string;
};

export type GlobalLaunchAuditAction = {
  id: string;
  priority: "now" | "next";
  owner: string;
  label: string;
  action: string;
  href: string;
};

export type GlobalLaunchAuditLiftAction = {
  id: string;
  priority: "now" | "next";
  dimensionId: GlobalLaunchAuditDimensionId | "global-routing";
  label: string;
  currentScore: number;
  targetScore: number;
  scoreLift: number;
  projectedScore: number;
  proofRequired: string;
  decisionImpact: string;
  href: string;
};

export type GlobalLaunchAuditLiftPlan = {
  targetScore: number;
  scoreGap: number;
  projectedScoreAfterFirstFix: number;
  summary: string;
  actions: GlobalLaunchAuditLiftAction[];
};

export type GlobalLaunchAuditProofLink = {
  id: string;
  label: string;
  value: string;
  status: GlobalLaunchAuditStatus;
  href: string;
};

export type GlobalLaunchAudit = {
  readiness: GlobalLaunchAuditReadiness;
  score: number;
  headline: string;
  hardTruth: string;
  targetMarket: string;
  launchNarrative: string;
  monthlyValue: string;
  measuredValue: string;
  proofSummary: string;
  opsSummary: string;
  dimensions: GlobalLaunchAuditDimension[];
  actions: GlobalLaunchAuditAction[];
  liftPlan: GlobalLaunchAuditLiftPlan;
  proofLinks: GlobalLaunchAuditProofLink[];
  exportMarkdown: string;
};

export type BuildGlobalLaunchAuditInput = {
  projectBrief: string;
  recommendation: Recommendation;
  valueBlueprint: ValueBlueprint;
  buyerScenario: BuyerValueScenario;
  pilotRun: PilotRunReceiptInput;
  buyerWorkOrder: BuyerWorkOrderInput;
  workspace: Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl" | "agentTrialEvidence">;
  launchRoom: LaunchRoom;
};

const OPS_CAPABILITIES: CapabilityKey[] = ["cloudRun", "testing", "security", "observability"];
const GLOBAL_READY_SCORE = 86;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function round(value: number) {
  return Math.round(clamp(value));
}

function yen(value: number) {
  return `${value.toLocaleString("ja-JP")} yen`;
}

function statusFromScore(score: number): GlobalLaunchAuditStatus {
  if (score >= 80) return "pass";
  if (score >= 60) return "watch";
  return "block";
}

function readinessFrom(score: number, dimensions: GlobalLaunchAuditDimension[]): GlobalLaunchAuditReadiness {
  const blockers = dimensions.filter((dimension) => dimension.status === "block").length;
  const warnings = dimensions.filter((dimension) => dimension.status === "watch").length;
  if (score >= 86 && blockers === 0 && warnings <= 1) return "global-ready";
  if (score >= 74 && blockers <= 1) return "launchable-with-gaps";
  if (score >= 58) return "private-beta";
  return "not-ready";
}

function scoreFromDimensions(dimensions: GlobalLaunchAuditDimension[]) {
  const base = average(dimensions.map((dimension) => dimension.score));
  return round(dimensions.some((dimension) => dimension.status === "block") ? base * 0.92 : base);
}

function headlineFor(readiness: GlobalLaunchAuditReadiness) {
  if (readiness === "global-ready") return "This launch can stand in front of a global buyer";
  if (readiness === "launchable-with-gaps") return "Launchable, but close the visible proof gaps first";
  if (readiness === "private-beta") return "Keep this in private beta until proof gets stronger";
  return "Do not present this as globally launch-ready yet";
}

function hardTruthFor(readiness: GlobalLaunchAuditReadiness, openDimensions: GlobalLaunchAuditDimension[]) {
  if (readiness === "global-ready") {
    return "A new visitor can understand the buyer value, inspect public evidence, see measured outcomes, and trust the operating path without a private explanation.";
  }
  const first = openDimensions[0];
  if (!first) return "The launch has a plausible story, but the next proof gap is not explicit enough.";
  if (readiness === "launchable-with-gaps") return `${first.label} is the most visible gap. Close it before making the public page your primary buyer surface.`;
  if (readiness === "private-beta") return `${openDimensions.length} launch dimension${openDimensions.length === 1 ? "" : "s"} need stronger evidence before public acquisition traffic will convert.`;
  return `${first.label} blocks the global launch story: ${first.action}`;
}

function proofLinks(input: BuildGlobalLaunchAuditInput): GlobalLaunchAuditProofLink[] {
  const links = [
    { id: "targetUrl", label: "Live product", value: input.workspace.targetUrl, href: "#launch-evidence-console" },
    { id: "protopediaUrl", label: "ProtoPedia story", value: input.workspace.protopediaUrl, href: "#launch-evidence-console" },
    { id: "videoUrl", label: "Walkthrough video", value: input.workspace.videoUrl, href: "#launch-evidence-console" },
    { id: "pilotEvidenceUrl", label: "Measured receipt", value: input.pilotRun.evidenceUrl, href: "#pilot-run-receipt" },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: input.buyerWorkOrder.evidenceUrl, href: "#buyer-work-order-studio" }
  ];

  return links.map((link) => ({
    ...link,
    status: isBuyerFacingProofUrl(link.value) ? "pass" : "block"
  }));
}

function opsCapabilityScore(recommendation: Recommendation) {
  if (recommendation.selected.length === 0) return 0;
  return round(
    average(
      recommendation.selected.map((agent) =>
        average(OPS_CAPABILITIES.map((capability) => agent.capabilities[capability]))
      )
    )
  );
}

function artifactScore(room: LaunchRoom, ids: string[]) {
  const artifacts = ids.map((id) => room.artifacts.find((artifact) => artifact.id === id)).filter(Boolean);
  if (artifacts.length === 0) return 0;
  return round(
    average(
      artifacts.map((artifact) => {
        if (artifact?.status === "ready") return 100;
        if (artifact?.status === "attention") return 66;
        return 28;
      })
    )
  );
}

function buildDimensions(input: BuildGlobalLaunchAuditInput): GlobalLaunchAuditDimension[] {
  const measured = buildBuyerPilotMeasuredRunSummary(input.pilotRun, input.buyerScenario);
  const links = proofLinks(input);
  const publicLinks = links.filter((link) => link.status === "pass").length;
  const trialEvidence = summarizeAgentTrialEvidence(input.workspace.agentTrialEvidence);
  const liveProductScore = round(
    (isBuyerFacingProofUrl(input.workspace.targetUrl) ? 55 : 0) +
      (isBuyerFacingProofUrl(input.workspace.protopediaUrl) ? 20 : 0) +
      (isBuyerFacingProofUrl(input.workspace.videoUrl) ? 15 : 0) +
      (input.launchRoom.readiness === "buyer-ready" ? 10 : 0)
  );
  const proofScore = round((publicLinks / links.length) * 72 + Math.min(2, trialEvidence.acceptedCount) * 14);
  const measuredScore = round(
    measured.readiness === "measured"
      ? average([100, measured.acceptanceRatePercent, measured.actualMinutesSavedPerRun > 0 ? 100 : 0])
      : measured.readiness === "needs-reviewer"
        ? 68
        : measured.readiness === "needs-acceptance"
          ? 46
          : 32
  );
  const opsScore = opsCapabilityScore(input.recommendation);
  const trustOfferScore = round(
    average([
      artifactScore(input.launchRoom, ["trust-center", "commercial-offer"]),
      input.buyerWorkOrder.dataSensitivity === "restricted" ? 48 : input.buyerWorkOrder.dataSensitivity === "internal" ? 76 : 92,
      input.launchRoom.artifacts.find((artifact) => artifact.id === "commercial-offer")?.status === "ready" ? 100 : 58
    ])
  );
  const buyerValueScore = round(average([input.buyerScenario.scenarioScore, input.buyerScenario.confidenceScore, input.valueBlueprint.boardScore]));

  return [
    {
      id: "buyer-value",
      label: "Buyer value clarity",
      status: statusFromScore(buyerValueScore),
      score: buyerValueScore,
      evidence: `${yen(input.buyerScenario.monthlyGrossValueYen)} modeled monthly value, ${input.buyerScenario.paybackDays}-day payback, ${input.valueBlueprint.primaryUser} buyer.`,
      action: "Tighten the value assumptions until the base case and downside case can be defended without private narration.",
      href: "#buyer-value-simulator"
    },
    {
      id: "live-surface",
      label: "Public product surface",
      status: isBuyerFacingProofUrl(input.workspace.targetUrl) ? statusFromScore(liveProductScore) : "block",
      score: liveProductScore,
      evidence: `${publicLinks}/${links.length} core public links attached; launch room is ${input.launchRoom.readiness}.`,
      action: "Attach a public deployed URL, public story page, and walkthrough video so a global visitor can verify the product immediately.",
      href: "#launch-evidence-console"
    },
    {
      id: "proof-depth",
      label: "Proof depth",
      status: statusFromScore(proofScore),
      score: proofScore,
      evidence: `${trialEvidence.evidence} ${input.launchRoom.metrics.find((metric) => metric.id === "public-proof")?.value ?? "0/8"} launch-room artifacts sealed.`,
      action: "Add accepted A2A trial proof and close the first proof artifact that is still blocked.",
      href: "#agent-card-intake"
    },
    {
      id: "measured-outcome",
      label: "Measured buyer outcome",
      status: measured.readiness === "measured" ? statusFromScore(measuredScore) : measured.readiness === "needs-reviewer" ? "watch" : "block",
      score: measuredScore,
      evidence: `${measured.actualMinutesSavedPerRun}m saved/run, ${measured.acceptanceRatePercent}% accepted, ${yen(measured.measuredMonthlyValueYen)} measured monthly value.`,
      action: "Run one buyer-like task with a named reviewer, accepted task count, and public receipt URL.",
      href: "#pilot-run-receipt"
    },
    {
      id: "production-ops",
      label: "Production operations",
      status: statusFromScore(opsScore),
      score: opsScore,
      evidence: `${input.recommendation.selected.length} selected agents average ${opsScore}/100 across Cloud Run, testing, security, and observability.`,
      action: "Select or import agents with stronger deploy, test, security, and observability capability before claiming global production readiness.",
      href: "#marketplace-workbench"
    },
    {
      id: "trust-offer",
      label: "Trust and offer packaging",
      status: statusFromScore(trustOfferScore),
      score: trustOfferScore,
      evidence: `${input.buyerWorkOrder.dataSensitivity} data boundary; trust and commercial artifacts score ${artifactScore(input.launchRoom, ["trust-center", "commercial-offer"])}/100.`,
      action: "Make the data boundary, pilot cap, renewal gate, stop rule, and proof limits visible before procurement review.",
      href: "#buyer-trust-center"
    }
  ];
}

function sendLaunchRoomAction(): GlobalLaunchAuditAction {
  return {
    id: "send-launch-room",
    priority: "now",
    owner: "Founder / PM",
    label: "Send the global launch room",
    action: "Use the launch room as the canonical buyer-facing link and ask for a pilot approval decision.",
    href: "#buyer-share-gate"
  };
}

function buildActions(dimensions: GlobalLaunchAuditDimension[], readiness: GlobalLaunchAuditReadiness): GlobalLaunchAuditAction[] {
  const open = [...dimensions]
    .filter((dimension) => dimension.status !== "pass")
    .sort((left, right) => left.score - right.score)
    .slice(0, 3);

  if (readiness === "global-ready") {
    return [sendLaunchRoomAction(), ...open.slice(0, 2).map((dimension) => ({
      id: `tighten-${dimension.id}`,
      priority: "next" as const,
      owner: dimension.id === "production-ops" ? "DevOps owner" : "Product owner",
      label: dimension.label,
      action: dimension.action,
      href: dimension.href
    }))];
  }

  if (open.length === 0) {
    return [sendLaunchRoomAction()];
  }

  return open.map((dimension, index) => ({
    id: `fix-${dimension.id}`,
    priority: index === 0 ? "now" : "next",
    owner: dimension.id === "production-ops" ? "DevOps owner" : dimension.id === "trust-offer" ? "Commercial owner" : "Product owner",
    label: dimension.label,
    action: dimension.action,
    href: dimension.href
  }));
}

function targetScoreForDimension(id: GlobalLaunchAuditDimensionId) {
  const targets: Record<GlobalLaunchAuditDimensionId, number> = {
    "buyer-value": 90,
    "live-surface": 92,
    "proof-depth": 88,
    "measured-outcome": 92,
    "production-ops": 86,
    "trust-offer": 88
  };
  return targets[id];
}

function proofRequiredForDimension(id: GlobalLaunchAuditDimensionId) {
  const proof: Record<GlobalLaunchAuditDimensionId, string> = {
    "buyer-value": "Base and downside value assumptions with payback, adoption, and owner sign-off.",
    "live-surface": "HTTPS product URL, public story page, walkthrough video, and a buyer-facing launch room.",
    "proof-depth": "Accepted A2A trial receipts plus the first blocked launch-room artifact closed.",
    "measured-outcome": "Named reviewer, accepted task count, minutes saved, and a public measured-run receipt.",
    "production-ops": "Cloud Run deploy path, tests, observability, security, and recovery evidence above the production bar.",
    "trust-offer": "Data boundary, pilot cap, renewal gate, stop rule, proof limits, and commercial owner approval."
  };
  return proof[id];
}

function decisionImpactForDimension(id: GlobalLaunchAuditDimensionId) {
  const impact: Record<GlobalLaunchAuditDimensionId, string> = {
    "buyer-value": "Lets a new buyer judge whether the product is worth a pilot without private explanation.",
    "live-surface": "Turns the page from an internal workspace into something a global visitor can verify immediately.",
    "proof-depth": "Replaces broad claims with inspectable agent and artifact receipts.",
    "measured-outcome": "Makes the ROI claim defensible in procurement and sponsor review.",
    "production-ops": "Reduces the gap between a hackathon demo and a service buyers can trust in production.",
    "trust-offer": "Makes legal, security, and procurement objections answerable before the first sales call."
  };
  return impact[id];
}

function projectedScoreAfterFix(dimensions: GlobalLaunchAuditDimension[], id: GlobalLaunchAuditDimensionId) {
  const targetScore = targetScoreForDimension(id);
  const projectedDimensions = dimensions.map((dimension) =>
    dimension.id === id
      ? {
          ...dimension,
          score: Math.max(dimension.score, targetScore),
          status: statusFromScore(Math.max(dimension.score, targetScore))
        }
      : dimension
  );
  return scoreFromDimensions(projectedDimensions);
}

function buildLiftPlan(dimensions: GlobalLaunchAuditDimension[], readiness: GlobalLaunchAuditReadiness, score: number): GlobalLaunchAuditLiftPlan {
  if (readiness === "global-ready") {
    const action: GlobalLaunchAuditLiftAction = {
      id: "route-global-traffic",
      priority: "now",
      dimensionId: "global-routing",
      label: "Route global traffic to the launch room",
      currentScore: score,
      targetScore: score,
      scoreLift: 0,
      projectedScore: score,
      proofRequired: "Keep live product, story, video, measured receipt, and work-order proof links reachable.",
      decisionImpact: "The public threshold is met; the next decision is traffic allocation and proof freshness.",
      href: "#buyer-share-gate"
    };
    return {
      targetScore: GLOBAL_READY_SCORE,
      scoreGap: 0,
      projectedScoreAfterFirstFix: score,
      summary: "The audit is above the global-ready threshold. Keep proof fresh and move acquisition traffic to the launch room.",
      actions: [action]
    };
  }

  const sorted = dimensions
    .filter((dimension) => dimension.status !== "pass")
    .map((dimension) => {
      const targetScore = Math.max(dimension.score, targetScoreForDimension(dimension.id));
      const projectedScore = projectedScoreAfterFix(dimensions, dimension.id);
      return {
        dimension,
        targetScore,
        projectedScore,
        scoreLift: Math.max(0, projectedScore - score)
      };
    })
    .sort((left, right) => {
      if (left.dimension.status !== right.dimension.status) return left.dimension.status === "block" ? -1 : 1;
      if (left.scoreLift !== right.scoreLift) return right.scoreLift - left.scoreLift;
      return left.dimension.score - right.dimension.score;
    });

  const actions = sorted.slice(0, 4).map<GlobalLaunchAuditLiftAction>((item, index) => ({
    id: `lift-${item.dimension.id}`,
    priority: index === 0 ? "now" : "next",
    dimensionId: item.dimension.id,
    label: item.dimension.label,
    currentScore: item.dimension.score,
    targetScore: item.targetScore,
    scoreLift: item.scoreLift,
    projectedScore: item.projectedScore,
    proofRequired: proofRequiredForDimension(item.dimension.id),
    decisionImpact: decisionImpactForDimension(item.dimension.id),
    href: item.dimension.href
  }));
  const firstAction = actions[0];
  const projectedScoreAfterFirstFix = firstAction?.projectedScore ?? score;
  const remainingGap = Math.max(0, GLOBAL_READY_SCORE - projectedScoreAfterFirstFix);
  const summary = firstAction
    ? remainingGap === 0
      ? `${firstAction.label} is the release unlock: closing it projects the audit from ${score} to ${projectedScoreAfterFirstFix}.`
      : `${firstAction.label} is the first lift: closing it projects the audit from ${score} to ${projectedScoreAfterFirstFix}, leaving ${remainingGap} points before global-ready.`
    : "No open launch dimensions were found, but the score is still below the global-ready threshold.";

  return {
    targetScore: GLOBAL_READY_SCORE,
    scoreGap: Math.max(0, GLOBAL_READY_SCORE - score),
    projectedScoreAfterFirstFix,
    summary,
    actions
  };
}

function narrativeFor(input: BuildGlobalLaunchAuditInput, readiness: GlobalLaunchAuditReadiness) {
  const measured = buildBuyerPilotMeasuredRunSummary(input.pilotRun, input.buyerScenario);
  const agents = input.recommendation.selected.slice(0, 3).map((agent) => agent.name).join(", ");
  const firstSentence = `${input.valueBlueprint.primaryUser} gets ${yen(input.buyerScenario.monthlyGrossValueYen)} modeled monthly value from ${agents || "the selected AI squad"}.`;
  const proofSentence =
    measured.readiness === "measured"
      ? `The public story can cite ${measured.actualMinutesSavedPerRun} minutes saved per run and ${measured.acceptanceRatePercent}% accepted tasks.`
      : `The public story still needs a measured run with accepted tasks and a named reviewer.`;
  const launchSentence =
    readiness === "global-ready"
      ? "The next move is to route global traffic to the launch room and ask for a pilot decision."
      : "The next move is to close the first visible gap before spending global acquisition effort.";
  return `${firstSentence} ${proofSentence} ${launchSentence}`;
}

function buildMarkdown(audit: Omit<GlobalLaunchAudit, "exportMarkdown">) {
  return [
    `# ${audit.headline}`,
    "",
    `Readiness: ${audit.readiness}`,
    `Global launch score: ${audit.score}/100`,
    `Target market: ${audit.targetMarket}`,
    "",
    audit.hardTruth,
    "",
    "## Launch narrative",
    audit.launchNarrative,
    "",
    "## Metrics",
    `- Monthly value: ${audit.monthlyValue}`,
    `- Measured value: ${audit.measuredValue}`,
    `- Proof: ${audit.proofSummary}`,
    `- Ops: ${audit.opsSummary}`,
    "",
    "## Dimensions",
    ...audit.dimensions.map((dimension) => `- [${dimension.status}] ${dimension.label} (${dimension.score}/100): ${dimension.evidence} Action: ${dimension.action}`),
    "",
    "## Release lift plan",
    `Target score: ${audit.liftPlan.targetScore}/100`,
    `Current score gap: ${audit.liftPlan.scoreGap}`,
    `Projected after first fix: ${audit.liftPlan.projectedScoreAfterFirstFix}/100`,
    audit.liftPlan.summary,
    ...audit.liftPlan.actions.map(
      (action) =>
        `- [${action.priority}] ${action.label}: +${action.scoreLift} points to ${action.projectedScore}/100. Proof: ${action.proofRequired} Decision impact: ${action.decisionImpact}`
    ),
    "",
    "## Next actions",
    ...audit.actions.map((action) => `- [${action.priority}] ${action.owner}: ${action.action} (${action.href})`),
    "",
    "## Proof links",
    ...audit.proofLinks.map((link) => `- [${link.status}] ${link.label}: ${link.value || "missing"}`)
  ].join("\n");
}

export function buildGlobalLaunchAudit(input: BuildGlobalLaunchAuditInput): GlobalLaunchAudit {
  const dimensions = buildDimensions(input);
  const score = scoreFromDimensions(dimensions);
  const readiness = readinessFrom(score, dimensions);
  const openDimensions = dimensions.filter((dimension) => dimension.status !== "pass").sort((left, right) => left.score - right.score);
  const actions = buildActions(dimensions, readiness);
  const links = proofLinks(input);
  const measured = buildBuyerPilotMeasuredRunSummary(input.pilotRun, input.buyerScenario);
  const opsScore = dimensions.find((dimension) => dimension.id === "production-ops")?.score ?? 0;
  const liftPlan = buildLiftPlan(dimensions, readiness, score);
  const partial: Omit<GlobalLaunchAudit, "exportMarkdown"> = {
    readiness,
    score,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, openDimensions),
    targetMarket: input.valueBlueprint.primaryUser,
    launchNarrative: narrativeFor(input, readiness),
    monthlyValue: yen(input.buyerScenario.monthlyGrossValueYen),
    measuredValue: yen(measured.measuredMonthlyValueYen),
    proofSummary: `${links.filter((link) => link.status === "pass").length}/${links.length} public links, ${summarizeAgentTrialEvidence(input.workspace.agentTrialEvidence).acceptedCount} accepted A2A trials`,
    opsSummary: `${opsScore}/100 production capability`,
    dimensions,
    actions,
    liftPlan,
    proofLinks: links
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
  if (["global-ready", "pass"].includes(status)) return "good";
  if (["not-ready", "block"].includes(status)) return "bad";
  return "watch";
}

function linkedHref(href: string, appUrl?: string) {
  if (!href.startsWith("#")) return href;
  return appUrl ? `${appUrl.replace(/#.*$/, "")}${href}` : href;
}

export function renderGlobalLaunchAuditHtml(
  audit: GlobalLaunchAudit,
  links: { launchRoomUrl?: string; proofDossierUrl?: string; publishabilityUrl?: string; jsonUrl?: string; markdownUrl?: string; appUrl?: string } = {}
) {
  const nav = [
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.proofDossierUrl ? `<a href="${escapeHtml(links.proofDossierUrl)}">Proof dossier</a>` : "",
    links.publishabilityUrl ? `<a href="${escapeHtml(links.publishabilityUrl)}">Publishability</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = [
    { label: "Modeled value", value: audit.monthlyValue },
    { label: "Measured value", value: audit.measuredValue },
    { label: "Proof", value: audit.proofSummary },
    { label: "Ops", value: audit.opsSummary }
  ]
    .map(
      (metric) => `
        <article class="metric">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const actions = audit.actions
    .map(
      (action) => `
        <li class="${escapeHtml(action.priority)}">
          <span>${escapeHtml(action.priority)}</span>
          <div>
            <strong>${escapeHtml(action.owner)}</strong>
            <p>${escapeHtml(action.action)}</p>
          </div>
          <a href="${escapeHtml(linkedHref(action.href, links.appUrl))}">${escapeHtml(action.label)}</a>
        </li>`
    )
    .join("");
  const liftActions = audit.liftPlan.actions
    .map(
      (action) => `
        <li class="${escapeHtml(action.priority)}">
          <div>
            <span>${escapeHtml(action.priority)}</span>
            <b>+${escapeHtml(action.scoreLift)}</b>
          </div>
          <strong>${escapeHtml(action.label)}</strong>
          <p>${escapeHtml(action.proofRequired)}</p>
          <small>${escapeHtml(action.decisionImpact)}</small>
          <a href="${escapeHtml(linkedHref(action.href, links.appUrl))}">${escapeHtml(action.projectedScore)}/100 projected</a>
        </li>`
    )
    .join("");
  const dimensions = audit.dimensions
    .map(
      (dimension) => `
        <article class="dimension ${tone(dimension.status)}">
          <div><span>${escapeHtml(dimension.status)}</span><b>${escapeHtml(dimension.score)}</b></div>
          <strong>${escapeHtml(dimension.label)}</strong>
          <p>${escapeHtml(dimension.evidence)}</p>
          <small>${escapeHtml(dimension.action)}</small>
          <a href="${escapeHtml(linkedHref(dimension.href, links.appUrl))}">${dimension.status === "pass" ? "Review" : "Improve"}</a>
        </article>`
    )
    .join("");
  const proofLinks = audit.proofLinks
    .map(
      (link) => `
        <a class="${tone(link.status)}" href="${escapeHtml(link.value || linkedHref(link.href, links.appUrl))}">
          <span>${escapeHtml(link.status)}</span>
          ${escapeHtml(link.label)}
        </a>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(audit.headline)}</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #53645e; --paper: #f6f8f4; --panel: #fffdf7; --line: #cbd7d2; --teal: #0f766e; --blue: #2457a6; --rose: #b1344f; --amber: #a66a00; --green-bg: #eefaf4; --blue-bg: #f1f6ff; --rose-bg: #fff1f2; --shadow: 0 18px 48px rgba(23, 33, 38, .09); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 22px; align-items: end; padding: 42px 0 18px; }
      .eyebrow, .metric span, .dimension span, .proof-strip span, h2 { color: var(--teal); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      h1 { max-width: 960px; margin: 8px 0 10px; font-size: clamp(2.2rem, 5vw, 4.7rem); line-height: .98; letter-spacing: 0; }
      p { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a, .actions a, .dimension a, .proof-strip a { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-weight: 900; text-decoration: none; }
      .score { min-height: 210px; display: grid; place-items: center; align-content: center; gap: 8px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: #172126; box-shadow: var(--shadow); text-align: center; }
      .score span { color: rgba(255, 253, 247, .72); font-size: .76rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 4.8rem; line-height: .88; }
      .score small { max-width: 210px; color: rgba(255, 253, 247, .78); font-weight: 900; }
      main { display: grid; gap: 12px; padding-bottom: 34px; }
      .metrics, .dimensions { display: grid; gap: 10px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .metric, .narrative, .dimension, .proof-strip { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: 0 10px 26px rgba(23, 33, 38, .05); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.1rem; line-height: 1.12; overflow-wrap: anywhere; }
      .narrative { display: grid; grid-template-columns: minmax(0, .86fr) minmax(340px, .58fr); gap: 12px; padding: 14px; }
      .narrative strong { display: block; margin-top: 6px; line-height: 1.28; overflow-wrap: anywhere; }
      .actions { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
      .actions li { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; gap: 9px; align-items: center; padding: 10px; border: 1px solid rgba(23,33,38,.12); border-left: 5px solid var(--blue); border-radius: 8px; background: #fffdf7; }
      .actions li.now { border-left-color: var(--rose); }
      .actions li > span { color: var(--ink); font-size: .75rem; font-weight: 950; text-transform: uppercase; }
      .actions p { margin-top: 2px; font-size: .9rem; }
      .lift-plan { display: grid; grid-template-columns: minmax(0, .42fr) minmax(0, 1fr); gap: 10px; border: 1px solid #172126; border-radius: 8px; background: #f8fbff; box-shadow: var(--shadow); padding: 14px; }
      .lift-plan h2 { margin: 0; }
      .lift-plan p, .lift-plan small { overflow-wrap: anywhere; }
      .lift-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
      .lift-stats div, .lift-actions li { border: 1px solid rgba(23,33,38,.13); border-radius: 8px; background: var(--panel); padding: 10px; }
      .lift-stats span, .lift-actions span { color: var(--teal); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .lift-stats strong { display: block; font-size: 1.45rem; line-height: 1; }
      .lift-actions { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; }
      .lift-actions li { display: grid; grid-template-columns: 72px minmax(0, .72fr) minmax(0, 1fr) minmax(0, .92fr) auto; gap: 10px; align-items: center; border-left: 5px solid var(--blue); }
      .lift-actions li.now { border-left-color: var(--rose); }
      .lift-actions b { display: block; margin-top: 4px; font-size: 1.35rem; line-height: 1; }
      .lift-actions strong, .lift-actions p, .lift-actions small { overflow-wrap: anywhere; }
      .lift-actions p, .lift-actions small { color: var(--muted); font-size: .88rem; }
      .lift-actions a { color: var(--blue); font-weight: 950; }
      .dimensions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .dimension { min-height: 210px; display: grid; grid-template-rows: auto auto 1fr auto auto; gap: 8px; padding: 12px; border-top: 5px solid var(--blue); }
      .dimension.good { border-top-color: var(--teal); background: var(--green-bg); }
      .dimension.watch { border-top-color: var(--blue); background: var(--blue-bg); }
      .dimension.bad { border-top-color: var(--rose); background: var(--rose-bg); }
      .dimension div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .dimension b { font-size: 1.65rem; line-height: 1; }
      .dimension strong, .dimension p, .dimension small { overflow-wrap: anywhere; }
      .dimension p, .dimension small { color: var(--muted); font-size: .9rem; }
      .dimension small { font-weight: 820; }
      .proof-strip { display: grid; grid-template-columns: minmax(180px, .28fr) minmax(0, 1fr); gap: 12px; align-items: center; padding: 14px; }
      .proof-strip strong { display: block; margin-top: 4px; }
      .proof-strip div:last-child { display: flex; flex-wrap: wrap; gap: 8px; }
      .proof-strip a.good { color: var(--teal); background: var(--green-bg); }
      .proof-strip a.bad { color: var(--rose); background: var(--rose-bg); }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 820px) { header, .narrative, .proof-strip, .lift-plan { grid-template-columns: 1fr; } .metrics, .dimensions, .lift-stats { grid-template-columns: 1fr; } .score { min-height: 148px; } .actions li, .lift-actions li { grid-template-columns: 1fr; align-items: start; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Global Launch Audit</span>
        <h1>${escapeHtml(audit.headline)}</h1>
        <p>${escapeHtml(audit.hardTruth)}</p>
        <nav>${nav}</nav>
      </div>
      <div class="score">
        <span>${escapeHtml(audit.readiness)}</span>
        <strong>${escapeHtml(audit.score)}</strong>
        <small>${escapeHtml(audit.targetMarket)}</small>
      </div>
    </header>
    <main>
      <section class="metrics" aria-label="Launch metrics">${metrics}</section>
      <section class="narrative" aria-label="Launch narrative">
        <div>
          <h2>Public narrative</h2>
          <strong>${escapeHtml(audit.launchNarrative)}</strong>
        </div>
        <ol class="actions">${actions}</ol>
      </section>
      <section class="lift-plan" aria-label="Release lift plan">
        <div>
          <h2>Release lift plan</h2>
          <p>${escapeHtml(audit.liftPlan.summary)}</p>
          <div class="lift-stats">
            <div><span>Target</span><strong>${escapeHtml(audit.liftPlan.targetScore)}</strong></div>
            <div><span>Gap</span><strong>${escapeHtml(audit.liftPlan.scoreGap)}</strong></div>
            <div><span>First fix</span><strong>${escapeHtml(audit.liftPlan.projectedScoreAfterFirstFix)}</strong></div>
          </div>
        </div>
        <ol class="lift-actions">${liftActions}</ol>
      </section>
      <section class="dimensions" aria-label="Audit dimensions">${dimensions}</section>
      <section class="proof-strip" aria-label="Proof links">
        <div>
          <span>Proof trail</span>
          <strong>${escapeHtml(audit.proofSummary)}</strong>
        </div>
        <div>${proofLinks}</div>
      </section>
    </main>
    <footer>Generated by AI Agent Value Blueprint. Treat this as a launch-readiness audit, not a substitute for legal, security, or procurement review.</footer>
  </body>
</html>`;
}
