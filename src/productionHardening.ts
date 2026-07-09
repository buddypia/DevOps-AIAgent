import { isBuyerFacingProofUrl } from "./publicProofUrl.js";
import type { WorkspaceDraft } from "./workspaceDraft.js";

export type ProductionHardeningStatus = "ready" | "attention" | "blocked";

export type ProductionHardeningAction = {
  label: string;
  href: string;
  external: boolean;
};

export type ProductionHardeningCheckId = "public-proof-urls" | "reference-artifacts" | "live-verification" | "buyer-owned-run" | "external-submission";

export type ProductionHardeningCheck = {
  id: ProductionHardeningCheckId;
  label: string;
  status: ProductionHardeningStatus;
  evidence: string;
  action: string;
  href: string;
};

export type ProductionHardeningActionPriority = "P0" | "P1" | "P2";

export type ProductionHardeningActionItem = {
  id: string;
  sourceCheckId: ProductionHardeningCheckId;
  priority: ProductionHardeningActionPriority;
  owner: string;
  dueDate: string;
  label: string;
  status: ProductionHardeningStatus;
  action: string;
  acceptance: string;
  verification: string;
  href: string;
};

export type ProductionHardeningActionPacket = {
  generatedAt: string;
  status: ProductionHardeningStatus;
  summary: string;
  dueDate: string;
  openCount: number;
  blockedCount: number;
  ownerSummary: string;
  items: ProductionHardeningActionItem[];
};

export type ProductionHardeningRecoveryIssue = {
  id: string;
  sourceActionId: string;
  priority: ProductionHardeningActionPriority;
  status: ProductionHardeningStatus;
  owner: string;
  dueDate: string;
  title: string;
  action: string;
  acceptance: string;
  verification: string;
  href: string;
  issueTitle: string;
  issueBody: string;
};

export type ProductionHardeningRecoveryKit = {
  status: ProductionHardeningStatus;
  headline: string;
  summary: string;
  releaseRule: string;
  topOwner: string;
  topAction: string;
  issueCount: number;
  blockedCount: number;
  dueDate: string;
  issues: ProductionHardeningRecoveryIssue[];
  csvText: string;
  copyText: string;
};

export type ProductionHardeningSnapshot = {
  status: ProductionHardeningStatus;
  score: number;
  headline: string;
  summary: string;
  firstAction: ProductionHardeningAction;
  readyCount: number;
  checkTotal: number;
  checks: ProductionHardeningCheck[];
  actionPacket: ProductionHardeningActionPacket;
  recoveryKit: ProductionHardeningRecoveryKit;
  noLaunchRules: string[];
  copyText: string;
  exportMarkdown: string;
};

export type ProductionHardeningDemoResidueItem = {
  id: ProductionHardeningCheckId;
  label: string;
  status: ProductionHardeningStatus;
  evidence: string;
  action: string;
  href: string;
  owner: string;
};

export type ProductionHardeningDemoResidueAudit = {
  status: ProductionHardeningStatus;
  headline: string;
  summary: string;
  readyCount: number;
  totalCount: number;
  blockedCount: number;
  attentionCount: number;
  primaryAction: ProductionHardeningAction;
  items: ProductionHardeningDemoResidueItem[];
  copyText: string;
  exportMarkdown: string;
};

export type ProductionHardeningBuildInput = {
  workspace: WorkspaceDraft;
  workflowIntakeHref: string;
  currentAuditHref: string;
  deliveryMemoHref: string;
  trustManifestHref: string;
  launchRoomHref: string;
  now?: Date;
};

export type ProductionHardeningLinks = {
  appUrl?: string;
  launchRoomUrl?: string;
  proofAuditUrl?: string;
  deliveryMemoUrl?: string;
  trustManifestUrl?: string;
  jsonUrl?: string;
  markdownUrl?: string;
};

type ProofSlot = {
  id: keyof Pick<WorkspaceDraft, "targetUrl" | "protopediaUrl" | "videoUrl"> | "pilotEvidenceUrl" | "workOrderEvidenceUrl";
  label: string;
  value: string;
};

const REFERENCE_AGENT_IDS = new Set(["custom-buyer-proof-operator"]);
const FRESH_PROOF_HOURS = 24;
const WATCH_PROOF_HOURS = 18;

function proofSlots(workspace: WorkspaceDraft): ProofSlot[] {
  return [
    { id: "targetUrl", label: "Deployed URL", value: workspace.targetUrl },
    { id: "protopediaUrl", label: "ProtoPedia URL", value: workspace.protopediaUrl },
    { id: "videoUrl", label: "Walkthrough video", value: workspace.videoUrl },
    { id: "pilotEvidenceUrl", label: "Pilot receipt", value: workspace.pilotRun.evidenceUrl },
    { id: "workOrderEvidenceUrl", label: "Work order proof", value: workspace.buyerWorkOrder.evidenceUrl }
  ];
}

function hrefIsExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tone(status: ProductionHardeningStatus) {
  if (status === "ready") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function statusScore(status: ProductionHardeningStatus) {
  if (status === "ready") return 100;
  if (status === "attention") return 64;
  return 18;
}

function isReferenceUrl(value: string) {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.pathname.startsWith("/sample/") || hostname === "sample.example" || hostname.endsWith(".sample.example");
  } catch {
    return /\/sample\//i.test(value);
  }
}

function hoursSince(checkedAt: string, now: Date) {
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) return null;
  return Math.round(((now.getTime() - checked.getTime()) / 3_600_000) * 10) / 10;
}

function worstStatus(statuses: ProductionHardeningStatus[]) {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function buildMarkdown(snapshot: Omit<ProductionHardeningSnapshot, "copyText" | "exportMarkdown">) {
  return [
    "# Production hardening gate",
    "",
    `Status: ${snapshot.status}`,
    `Score: ${snapshot.score}/100`,
    `First action: ${snapshot.firstAction.label} (${snapshot.firstAction.href})`,
    `Action packet: ${snapshot.actionPacket.openCount} open / ${snapshot.actionPacket.blockedCount} blocked / due ${snapshot.actionPacket.dueDate}`,
    "",
    snapshot.summary,
    "",
    "## Checks",
    ...snapshot.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence} Next: ${check.action}`),
    "",
    "## Release action packet",
    snapshot.actionPacket.summary,
    "",
    ...snapshot.actionPacket.items.map(
      (item) =>
        `- [${item.priority}/${item.status}] ${item.owner} by ${item.dueDate}: ${item.label}. Action: ${item.action} Acceptance: ${item.acceptance} Verify: ${item.verification}`
    ),
    "",
    "## Global release recovery kit",
    snapshot.recoveryKit.headline,
    snapshot.recoveryKit.summary,
    `Release rule: ${snapshot.recoveryKit.releaseRule}`,
    "",
    ...snapshot.recoveryKit.issues.map((issue) => `- [${issue.priority}/${issue.status}] ${issue.issueTitle} Owner: ${issue.owner}. Verify: ${issue.verification}`),
    "",
    "## No-launch rules",
    ...snapshot.noLaunchRules.map((rule) => `- ${rule}`)
  ].join("\n");
}

function buildDemoResidueMarkdown(audit: Omit<ProductionHardeningDemoResidueAudit, "copyText" | "exportMarkdown">) {
  return [
    "# Reference residue audit",
    "",
    `Status: ${audit.status}`,
    `Primary action: ${audit.primaryAction.label} (${audit.primaryAction.href})`,
    `Clear checks: ${audit.readyCount}/${audit.totalCount}`,
    "",
    audit.summary,
    "",
    "## Buyer-facing residue checks",
    ...audit.items.map((item) => `- [${item.status}] ${item.label}: ${item.evidence} Owner: ${item.owner}. Next: ${item.action}`)
  ].join("\n");
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return dateOnly(next);
}

function priorityFor(status: ProductionHardeningStatus): ProductionHardeningActionPriority {
  if (status === "blocked") return "P0";
  if (status === "attention") return "P1";
  return "P2";
}

function dueDaysFor(status: ProductionHardeningStatus) {
  if (status === "blocked") return 1;
  if (status === "attention") return 2;
  return 7;
}

function ownerFor(checkId: ProductionHardeningCheckId) {
  if (checkId === "public-proof-urls") return "Proof owner";
  if (checkId === "reference-artifacts") return "Product owner";
  if (checkId === "live-verification") return "DevOps owner";
  if (checkId === "buyer-owned-run") return "Buyer sponsor";
  return "Submission owner";
}

function acceptanceFor(checkId: ProductionHardeningCheckId) {
  if (checkId === "public-proof-urls") return "Every proof slot uses a buyer-owned public HTTPS URL and no localhost or private host remains.";
  if (checkId === "reference-artifacts") return "All /sample/ URLs, sample-only agents, and sample launch copy are replaced with this product's own proof.";
  if (checkId === "live-verification") return "Verify live links succeeds within the 24-hour publication window after the latest URL change.";
  if (checkId === "buyer-owned-run") return "The measured run has a named reviewer, accepted tasks, and non-reference pilot/work-order proof.";
  return "ProtoPedia and walkthrough video URLs are public, ownable, and attached to the launch room.";
}

function verificationFor(checkId: ProductionHardeningCheckId) {
  if (checkId === "public-proof-urls") return "Open Buyer Proof Audit and confirm 5/5 public proof URLs.";
  if (checkId === "reference-artifacts") return "Reopen Workflow Intake and confirm no reference artifacts remain.";
  if (checkId === "live-verification") return "Run Verify live links, then reopen this gate.";
  if (checkId === "buyer-owned-run") return "Open Delivery Memo and confirm the accepted buyer run is attached.";
  return "Open Trust Manifest and confirm submission proof is public.";
}

function buildActionPacket(input: { status: ProductionHardeningStatus; checks: ProductionHardeningCheck[]; now: Date }): ProductionHardeningActionPacket {
  const openChecks = input.checks.filter((check) => check.status !== "ready");
  const packetChecks = openChecks.length > 0 ? openChecks : input.checks;
  const items = packetChecks
    .map((check) => ({
      id: `action-${check.id}`,
      sourceCheckId: check.id,
      priority: priorityFor(check.status),
      owner: ownerFor(check.id),
      dueDate: addDays(input.now, dueDaysFor(check.status)),
      label: check.label,
      status: check.status,
      action: check.action,
      acceptance: acceptanceFor(check.id),
      verification: verificationFor(check.id),
      href: check.href
    }))
    .sort((left, right) => {
      const priorityOrder: Record<ProductionHardeningActionPriority, number> = { P0: 0, P1: 1, P2: 2 };
      return priorityOrder[left.priority] - priorityOrder[right.priority] || left.dueDate.localeCompare(right.dueDate);
    });
  const blockedCount = openChecks.filter((check) => check.status === "blocked").length;
  const dueDate = items[0]?.dueDate ?? dateOnly(input.now);
  const owners = Array.from(new Set(items.map((item) => item.owner)));

  return {
    generatedAt: input.now.toISOString(),
    status: input.status,
    summary:
      openChecks.length === 0
        ? "No blocking release action remains; keep the verification window fresh and rerun the gate after every public URL change."
        : `${openChecks.length} release action${openChecks.length === 1 ? "" : "s"} must close before the workspace is safe to share globally.`,
    dueDate,
    openCount: openChecks.length,
    blockedCount,
    ownerSummary: owners.join(" / "),
    items
  };
}

function csvCell(value: unknown) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildIssueBody(item: ProductionHardeningActionItem, noLaunchRules: string[]) {
  return [
    `# ${item.label}`,
    "",
    `Priority: ${item.priority}`,
    `Status: ${item.status}`,
    `Owner: ${item.owner}`,
    `Due: ${item.dueDate}`,
    `Source check: ${item.sourceCheckId}`,
    `Open: ${item.href}`,
    "",
    "## Action",
    item.action,
    "",
    "## Acceptance",
    item.acceptance,
    "",
    "## Verification",
    item.verification,
    "",
    "## No-launch guardrails",
    ...noLaunchRules.map((rule) => `- ${rule}`)
  ].join("\n");
}

function buildRecoveryKit(input: {
  status: ProductionHardeningStatus;
  actionPacket: ProductionHardeningActionPacket;
  noLaunchRules: string[];
}): ProductionHardeningRecoveryKit {
  const issues = input.actionPacket.items.map((item) => ({
    id: `recovery-${item.sourceCheckId}`,
    sourceActionId: item.id,
    priority: item.priority,
    status: item.status,
    owner: item.owner,
    dueDate: item.dueDate,
    title: item.label,
    action: item.action,
    acceptance: item.acceptance,
    verification: item.verification,
    href: item.href,
    issueTitle: `[${item.priority}] ${item.label}: ${item.action}`,
    issueBody: buildIssueBody(item, input.noLaunchRules)
  }));
  const topIssue = issues[0];
  const openIssues = issues.filter((issue) => issue.status !== "ready");
  const blockedCount = openIssues.filter((issue) => issue.status === "blocked").length;
  const csvText = [
    ["priority", "status", "owner", "due_date", "title", "action", "acceptance", "verification", "href"].map(csvCell).join(","),
    ...issues.map((issue) =>
      [issue.priority, issue.status, issue.owner, issue.dueDate, issue.title, issue.action, issue.acceptance, issue.verification, issue.href].map(csvCell).join(",")
    )
  ].join("\n");
  const releaseRule =
    blockedCount > 0
      ? "Do not share externally until every P0 recovery ticket is verified and the hardening gate is rerun."
      : openIssues.length > 0
        ? "Sponsor review only; attach the recovery kit and close the P1 watch items before buyer send."
        : "External share is allowed after one fresh proof verification run inside the publication window.";
  const headline =
    openIssues.length === 0
      ? "Release recovery kit is in monitor mode"
      : `${openIssues.length} owner-ready recovery ticket${openIssues.length === 1 ? "" : "s"} before global share`;
  const summary =
    openIssues.length === 0
      ? "No launch blocker remains. Keep this kit attached so the next URL or proof change has a verification script."
      : `First owner: ${topIssue?.owner ?? "Launch owner"}. Close ${topIssue?.title ?? "the first recovery ticket"}, verify the acceptance signal, then rerun the production hardening gate.`;

  return {
    status: input.status,
    headline,
    summary,
    releaseRule,
    topOwner: topIssue?.owner ?? "Launch owner",
    topAction: topIssue?.action ?? "Run one final proof verification before external sharing.",
    issueCount: issues.length,
    blockedCount,
    dueDate: input.actionPacket.dueDate,
    issues,
    csvText,
    copyText: issues.map((issue) => issue.issueBody).join("\n\n---\n\n")
  };
}

export function buildProductionHardeningDemoResidueAudit(snapshot: ProductionHardeningSnapshot): ProductionHardeningDemoResidueAudit {
  const labels: Record<ProductionHardeningCheckId, string> = {
    "reference-artifacts": "No reference artifacts",
    "public-proof-urls": "Own public proof URLs",
    "buyer-owned-run": "Buyer-run receipt",
    "live-verification": "Fresh public proof check",
    "external-submission": "Launch-room submission proof"
  };
  const owners: Record<ProductionHardeningCheckId, string> = {
    "reference-artifacts": "Product owner",
    "public-proof-urls": "Proof owner",
    "buyer-owned-run": "Buyer sponsor",
    "live-verification": "DevOps owner",
    "external-submission": "Submission owner"
  };
  const order: ProductionHardeningCheckId[] = ["reference-artifacts", "public-proof-urls", "buyer-owned-run", "live-verification", "external-submission"];
  const items = order
    .map((id) => snapshot.checks.find((check) => check.id === id))
    .filter((check): check is ProductionHardeningCheck => Boolean(check))
    .map((check) => ({
      id: check.id,
      label: labels[check.id],
      status: check.status,
      evidence: check.evidence,
      action: check.action,
      href: check.href,
      owner: owners[check.id]
    }));
  const readyCount = items.filter((item) => item.status === "ready").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const attentionCount = items.filter((item) => item.status === "attention").length;
  const partial: Omit<ProductionHardeningDemoResidueAudit, "copyText" | "exportMarkdown"> = {
    status: snapshot.status,
    headline:
      snapshot.status === "ready"
        ? "No reference residue is blocking buyer review"
        : snapshot.status === "attention"
          ? "Reference residue is mostly cleared; refresh proof before sharing"
          : "Reference residue still blocks buyer review",
    summary:
      snapshot.status === "ready"
        ? "The workspace now stands on own public URLs, fresh verification, buyer-run receipts, and launch-room proof instead of reference evidence."
        : `${blockedCount + attentionCount} buyer-facing residue check${blockedCount + attentionCount === 1 ? "" : "s"} must close before this can feel like a real external product.`,
    readyCount,
    totalCount: items.length,
    blockedCount,
    attentionCount,
    primaryAction: snapshot.firstAction,
    items
  };
  const exportMarkdown = buildDemoResidueMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

export function buildProductionHardeningSnapshot({
  workspace,
  workflowIntakeHref,
  currentAuditHref,
  deliveryMemoHref,
  trustManifestHref,
  launchRoomHref,
  now = new Date()
}: ProductionHardeningBuildInput): ProductionHardeningSnapshot {
  const slots = proofSlots(workspace);
  const nonPublic = slots.filter((slot) => !isBuyerFacingProofUrl(slot.value));
  const referenceUrls = slots.filter((slot) => isReferenceUrl(slot.value));
  const hasReferenceAgent = workspace.selectedAgentIds.some((id) => REFERENCE_AGENT_IDS.has(id)) || workspace.customAgents.some((agent) => REFERENCE_AGENT_IDS.has(agent.id));
  const referenceBrief = /sample workspace|sample proof|proof-backed sample/i.test(workspace.projectBrief);
  const verification = workspace.proofVerification;
  const proofAgeHours = verification ? hoursSince(verification.checkedAt, now) : null;
  const liveStatus: ProductionHardeningStatus = !verification
    ? "blocked"
    : verification.results.some((result) => result.status === "block")
      ? "blocked"
      : proofAgeHours === null || proofAgeHours > FRESH_PROOF_HOURS
        ? "blocked"
        : verification.results.some((result) => result.status === "watch") || proofAgeHours >= WATCH_PROOF_HOURS
          ? "attention"
          : "ready";
  const buyerRunPublic = isBuyerFacingProofUrl(workspace.pilotRun.evidenceUrl) && isBuyerFacingProofUrl(workspace.buyerWorkOrder.evidenceUrl);
  const buyerRunReference = isReferenceUrl(workspace.pilotRun.evidenceUrl) || isReferenceUrl(workspace.buyerWorkOrder.evidenceUrl);
  const buyerRunAccepted = workspace.pilotRun.acceptedTasks >= workspace.pilotRun.totalTasks && workspace.pilotRun.totalTasks > 0;
  const buyerRunStatus: ProductionHardeningStatus =
    !buyerRunPublic || buyerRunReference
      ? "blocked"
      : buyerRunAccepted && workspace.pilotRun.reviewerName.trim() && workspace.buyerWorkOrder.targetUser.trim()
        ? "ready"
        : "attention";
  const externalSubmissionPublic = isBuyerFacingProofUrl(workspace.protopediaUrl) && isBuyerFacingProofUrl(workspace.videoUrl);
  const externalSubmissionReference = isReferenceUrl(workspace.protopediaUrl) || isReferenceUrl(workspace.videoUrl);
  const checks: ProductionHardeningCheck[] = [
    {
      id: "public-proof-urls",
      label: "Public proof URLs",
      status: nonPublic.length === 0 ? "ready" : "blocked",
      evidence:
        nonPublic.length === 0
          ? `${slots.length}/${slots.length} proof URLs use public HTTPS and are not localhost.`
          : `${slots.length - nonPublic.length}/${slots.length} proof URLs are public HTTPS; first gap is ${nonPublic[0]?.label}.`,
      action: nonPublic.length === 0 ? "Keep URLs public and rerun live verification after every change." : `Replace ${nonPublic[0]?.label ?? "the first proof link"} with a public HTTPS URL.`,
      href: currentAuditHref
    },
    {
      id: "reference-artifacts",
      label: "Reference artifacts",
      status: referenceUrls.length === 0 && !hasReferenceAgent && !referenceBrief ? "ready" : "blocked",
      evidence:
        referenceUrls.length === 0 && !hasReferenceAgent && !referenceBrief
          ? "No reference /sample/ proof URLs or sample-only agent remain in the workspace."
          : `${referenceUrls.length} reference proof URL${referenceUrls.length === 1 ? "" : "s"}${hasReferenceAgent ? " and the reference proof operator" : ""}${referenceBrief ? " plus sample brief copy" : ""} remain.`,
      action: "Replace reference artifacts with your own buyer proof before external launch.",
      href: workflowIntakeHref
    },
    {
      id: "live-verification",
      label: verification ? "Fresh live verification" : "Live verification required",
      status: liveStatus,
      evidence: verification
        ? `${verification.verifiedCount}/${verification.totalCount} links passed live verification; check age is ${proofAgeHours ?? "invalid"} hours.`
        : "Live link verification has not run for this workspace.",
      action: liveStatus === "ready" ? "Keep the proof check inside the 24-hour publication window." : "Run Verify live links after replacing proof URLs.",
      href: currentAuditHref
    },
    {
      id: "buyer-owned-run",
      label: "Buyer-owned measured run",
      status: buyerRunStatus,
      evidence: `${workspace.pilotRun.acceptedTasks}/${workspace.pilotRun.totalTasks} tasks accepted by ${workspace.pilotRun.reviewerName.trim() || "unnamed reviewer"}; work order owner is ${workspace.buyerWorkOrder.targetUser.trim() || "missing"}.`,
      action:
        buyerRunStatus === "ready"
          ? "Keep the measured receipt and buyer-approved work order attached."
          : "Attach a non-reference measured receipt and buyer-approved work order with a named reviewer.",
      href: deliveryMemoHref
    },
    {
      id: "external-submission",
      label: "External submission proof",
      status: !externalSubmissionPublic || externalSubmissionReference ? "blocked" : "ready",
      evidence:
        externalSubmissionPublic && !externalSubmissionReference
          ? "ProtoPedia and walkthrough proof are public, buyer-facing URLs."
          : "ProtoPedia and walkthrough proof must both be own public URLs, not reference artifacts.",
      action: externalSubmissionPublic && !externalSubmissionReference ? "Keep submission proof attached to the launch room." : "Publish your own ProtoPedia page and walkthrough video before final sharing.",
      href: trustManifestHref
    }
  ];
  const status = worstStatus(checks.map((check) => check.status));
  const firstOpen = checks.find((check) => check.status === "blocked") ?? checks.find((check) => check.status === "attention");
  const score = Math.round(checks.reduce((sum, check) => sum + statusScore(check.status), 0) / Math.max(1, checks.length));
  const noLaunchRules = [
    "Do not call the workspace globally publishable while any proof URL is localhost, plain HTTP, missing, or unreachable.",
    "Do not send buyer proof that still points at /sample/ reference artifacts.",
    "Do not reuse a live proof check older than 24 hours after any public URL changes.",
    "Do not cite measured value without a named reviewer, accepted tasks, and a buyer-owned receipt."
  ];
  const actionPacket = buildActionPacket({ status, checks, now });
  const recoveryKit = buildRecoveryKit({ status, actionPacket, noLaunchRules });
  const partial: Omit<ProductionHardeningSnapshot, "copyText" | "exportMarkdown"> = {
    status,
    score,
    headline:
      status === "ready"
        ? "Workspace is hardened for external launch review"
        : status === "attention"
          ? "Workspace needs a final hardening review"
          : "Workspace still contains reference launch risk",
    summary:
      status === "ready"
        ? "Public URLs, own proof artifacts, fresh verification, measured buyer receipt, and external submission proof are aligned."
        : `${firstOpen?.label ?? "Production hardening"} is the first launch-hardening item to close before calling this globally publishable.`,
    firstAction: firstOpen
      ? {
          label: `${firstOpen.status === "blocked" ? "Fix" : "Review"} ${firstOpen.label}`,
          href: firstOpen.href,
          external: hrefIsExternal(firstOpen.href)
        }
      : {
          label: "Open launch room",
          href: launchRoomHref,
          external: hrefIsExternal(launchRoomHref)
    },
    readyCount: checks.filter((check) => check.status === "ready").length,
    checkTotal: checks.length,
    checks,
    actionPacket,
    recoveryKit,
    noLaunchRules
  };
  const exportMarkdown = buildMarkdown(partial);

  return {
    ...partial,
    copyText: exportMarkdown,
    exportMarkdown
  };
}

export function renderProductionHardeningHtml(snapshot: ProductionHardeningSnapshot, links: ProductionHardeningLinks = {}) {
  const nav = [
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.proofAuditUrl ? `<a href="${escapeHtml(links.proofAuditUrl)}">Proof audit</a>` : "",
    links.deliveryMemoUrl ? `<a href="${escapeHtml(links.deliveryMemoUrl)}">Delivery memo</a>` : "",
    links.trustManifestUrl ? `<a href="${escapeHtml(links.trustManifestUrl)}">Trust manifest</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workbench</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = [
    { label: "Status", value: snapshot.status, status: snapshot.status },
    { label: "Hardening score", value: `${snapshot.score}/100`, status: snapshot.status },
    { label: "Launch checks", value: `${snapshot.readyCount}/${snapshot.checkTotal}`, status: snapshot.status },
    { label: "Open actions", value: `${snapshot.actionPacket.openCount} / due ${snapshot.actionPacket.dueDate}`, status: snapshot.status }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const checks = snapshot.checks
    .map(
      (check) => `
        <article class="check ${tone(check.status)}">
          <div>
            <span>${escapeHtml(check.status)}</span>
            <strong><a href="${escapeHtml(check.href)}">${escapeHtml(check.label)}</a></strong>
          </div>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.action)}</small>
        </article>`
    )
    .join("");
  const rules = snapshot.noLaunchRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");
  const actionItems = snapshot.actionPacket.items
    .map(
      (item) => `
        <article class="action ${tone(item.status)}">
          <div>
            <span>${escapeHtml(item.priority)} / ${escapeHtml(item.status)}</span>
            <strong><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></strong>
          </div>
          <p>${escapeHtml(item.action)}</p>
          <small>${escapeHtml(item.owner)} by ${escapeHtml(item.dueDate)} · ${escapeHtml(item.acceptance)}</small>
        </article>`
    )
    .join("");
  const recoveryIssues = snapshot.recoveryKit.issues
    .map(
      (issue) => `
        <article class="issue ${tone(issue.status)}">
          <div>
            <span>${escapeHtml(issue.priority)} / ${escapeHtml(issue.owner)}</span>
            <strong><a href="${escapeHtml(issue.href)}">${escapeHtml(issue.issueTitle)}</a></strong>
          </div>
          <p>${escapeHtml(issue.acceptance)}</p>
          <small>${escapeHtml(issue.verification)}</small>
        </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(snapshot.headline)} - Production hardening</title>
    <style>
      :root { color-scheme: light; --ink: #172126; --muted: #56645f; --paper: #f4f7f6; --panel: #fffdf7; --line: #cbd8d4; --blue: #2457a6; --green: #0b7a60; --amber: #a66a00; --red: #b4233b; --good-bg: #e8f7ee; --watch-bg: #fff5d6; --bad-bg: #fff0f2; --shadow: 0 18px 46px rgba(23, 33, 31, .09); }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--ink); background: var(--paper); font-family: Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 20px; align-items: end; padding: 40px 0 16px; }
      .eyebrow, h2, .metric span, .check span, .action span, .issue span, .recovery span, .rules span { color: var(--blue); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 940px; margin: 7px 0 12px; font-size: clamp(2.2rem, 5vw, 4.8rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a, .primary-action { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-size: .9rem; font-weight: 900; text-decoration: none; }
      .primary-action { display: inline-flex; width: fit-content; margin-top: 16px; color: #fffdf7; border-color: #172126; background: #172126; }
      .score { min-height: 200px; display: grid; place-items: center; align-content: center; gap: 8px; border-radius: 8px; color: #fffdf7; background: linear-gradient(150deg, #172126, #2457a6); text-align: center; box-shadow: var(--shadow); }
      .score span { color: rgba(255, 253, 247, .76); font-size: .78rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 4.4rem; line-height: .9; }
      .score small { max-width: 180px; color: rgba(255, 253, 247, .78); font-weight: 900; }
      main { display: grid; gap: 12px; padding: 0 0 34px; }
      .metrics, .checks, .actions, .issues { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .metric, .check, .action, .issue, .recovery, .rules { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); }
      .metric { min-height: 112px; display: grid; align-content: start; gap: 8px; padding: 12px; }
      .metric strong { color: var(--ink); font-size: 1.25rem; line-height: 1.08; overflow-wrap: anywhere; }
      .checks { grid-template-columns: repeat(5, minmax(0, 1fr)); }
      .check, .action, .issue { min-height: 176px; display: grid; align-content: start; gap: 8px; padding: 12px; border-top: 5px solid var(--green); }
      .check.watch, .action.watch, .issue.watch { border-top-color: var(--amber); background: var(--watch-bg); }
      .check.block, .action.block, .issue.block { border-top-color: var(--red); background: var(--bad-bg); }
      .check.pass, .action.pass, .issue.pass { background: var(--good-bg); }
      .check div, .action div, .issue div { display: grid; gap: 5px; }
      .check strong, .action strong, .issue strong { color: var(--ink); line-height: 1.12; overflow-wrap: anywhere; }
      .check small, .action small, .issue small { color: var(--muted); font-weight: 780; line-height: 1.35; overflow-wrap: anywhere; }
      .action p, .issue p { font-weight: 820; }
      .recovery { display: grid; gap: 10px; padding: 14px; color: #fffdf7; background: linear-gradient(135deg, #172126, #2457a6); }
      .recovery span, .recovery p, .recovery small { color: rgba(255, 253, 247, .78); }
      .recovery strong { color: #fffdf7; font-size: 1.25rem; line-height: 1.1; }
      .rules { padding: 14px; }
      .rules ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
      .rules li { min-width: 0; padding-left: 12px; border-left: 4px solid rgba(36, 87, 166, .45); color: var(--muted); overflow-wrap: anywhere; }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 980px) { header, .metrics, .checks, .actions, .issues, .rules ul { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 680px) { header, .metrics, .checks, .actions, .issues, .rules ul { grid-template-columns: 1fr; } h1 { font-size: 2.15rem; } .score { min-height: 150px; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Production hardening gate</span>
        <h1>${escapeHtml(snapshot.headline)}</h1>
        <p>${escapeHtml(snapshot.summary)}</p>
        <a class="primary-action" href="${escapeHtml(snapshot.firstAction.href)}">${escapeHtml(snapshot.firstAction.label)}</a>
        <nav aria-label="Production hardening links">${nav}</nav>
      </div>
      <aside class="score" aria-label="Production hardening score">
        <span>${escapeHtml(snapshot.status)}</span>
        <strong>${escapeHtml(snapshot.score)}</strong>
        <small>${escapeHtml(`${snapshot.readyCount}/${snapshot.checkTotal} launch checks clear`)}</small>
      </aside>
    </header>
    <main>
      <section class="metrics" aria-label="Hardening metrics">${metrics}</section>
      <section>
        <h2>Launch checks</h2>
        <div class="checks">${checks}</div>
      </section>
      <section>
        <h2>Release action packet</h2>
        <p>${escapeHtml(snapshot.actionPacket.summary)} Owners: ${escapeHtml(snapshot.actionPacket.ownerSummary)}.</p>
        <div class="actions">${actionItems}</div>
      </section>
      <section class="recovery" aria-label="Global release recovery kit">
        <span>Global release recovery kit</span>
        <strong>${escapeHtml(snapshot.recoveryKit.headline)}</strong>
        <p>${escapeHtml(snapshot.recoveryKit.summary)}</p>
        <small>${escapeHtml(snapshot.recoveryKit.releaseRule)}</small>
      </section>
      <section>
        <h2>Recovery issue queue</h2>
        <div class="issues">${recoveryIssues}</div>
      </section>
      <section class="rules" aria-label="No-launch rules">
        <span>No-launch rules</span>
        <ul>${rules}</ul>
      </section>
    </main>
    <footer>Generated from the current workspace state. Treat blocked checks as public launch blockers.</footer>
  </body>
</html>`;
}
