import type { BuyerShareGate, BuyerShareGateCheck, BuyerShareGateCheckStatus } from "./buyerShareGate.js";
import type { BuyerProofPacketReceipt } from "./buyerProofPacket.js";
import type { LaunchRoom, LaunchRoomArtifact, LaunchRoomDecisionCheck, LaunchRoomStatus } from "./launchRoom.js";

export type BuyerEvidenceTraceReadiness = "buyer-safe" | "sponsor-review" | "not-shareable";
export type BuyerEvidenceTraceStatus = "pass" | "watch" | "block";
export type BuyerEvidenceTraceClaimId = "value-case" | "measured-pilot" | "public-proof" | "work-order" | "operating-gates" | "buyer-decision";
export type BuyerEvidenceTraceAuditCheckId = "source-check" | "artifact-link" | "claim-match";
export type BuyerEvidenceTraceAuditReadiness = "audit-ready" | "needs-review" | "audit-blocked";

export type BuyerEvidenceTraceSource = {
  label: string;
  value: string;
  href: string;
  status: BuyerEvidenceTraceStatus;
};

export type BuyerEvidenceTraceClaim = {
  id: BuyerEvidenceTraceClaimId;
  label: string;
  status: BuyerEvidenceTraceStatus;
  score: number;
  buyerQuestion: string;
  claim: string;
  source: BuyerEvidenceTraceSource;
  artifact: BuyerEvidenceTraceSource;
  verification: string;
  nextAction: string;
  auditChecks: BuyerEvidenceTraceAuditCheck[];
};

export type BuyerEvidenceTraceAuditCheck = {
  id: BuyerEvidenceTraceAuditCheckId;
  label: string;
  status: BuyerEvidenceTraceStatus;
  method: string;
  evidence: string;
  href: string;
  failureMode: string;
  repairAction: string;
};

export type BuyerEvidenceTraceAuditSummary = {
  readiness: BuyerEvidenceTraceAuditReadiness;
  passCount: number;
  totalCount: number;
  primaryFailure: BuyerEvidenceTraceAuditCheck | null;
};

export type BuyerEvidenceTraceApprovalTrailItemId = "claim-trace" | "share-gate" | "packet-receipt" | "sponsor-decision";

export type BuyerEvidenceTraceApprovalTrailItem = {
  id: BuyerEvidenceTraceApprovalTrailItemId;
  label: string;
  status: BuyerEvidenceTraceStatus;
  evidence: string;
  href: string;
  verifier: string;
};

export type BuyerEvidenceTraceApprovalTrail = {
  readiness: BuyerEvidenceTraceStatus;
  receiptDigest: string | null;
  receiptId: string | null;
  items: BuyerEvidenceTraceApprovalTrailItem[];
};

export type BuyerEvidenceTraceBlocker = {
  id: BuyerEvidenceTraceClaimId;
  label: string;
  status: BuyerEvidenceTraceStatus;
  owner: string;
  action: string;
  href: string;
};

export type BuyerEvidenceTrace = {
  id: string;
  generatedAt: string;
  readiness: BuyerEvidenceTraceReadiness;
  score: number;
  headline: string;
  hardTruth: string;
  targetBuyer: string;
  shareDecision: string;
  primaryClaim: BuyerEvidenceTraceClaim;
  claims: BuyerEvidenceTraceClaim[];
  auditSummary: BuyerEvidenceTraceAuditSummary;
  approvalTrail: BuyerEvidenceTraceApprovalTrail;
  blockers: BuyerEvidenceTraceBlocker[];
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

function statusScore(status: BuyerEvidenceTraceStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 68;
  return 18;
}

function fromLaunchStatus(status: LaunchRoomStatus): BuyerEvidenceTraceStatus {
  if (status === "ready") return "pass";
  if (status === "attention") return "watch";
  return "block";
}

function fromShareStatus(status: BuyerShareGateCheckStatus): BuyerEvidenceTraceStatus {
  if (status === "pass") return "pass";
  if (status === "watch") return "watch";
  return "block";
}

function worstStatus(...statuses: BuyerEvidenceTraceStatus[]): BuyerEvidenceTraceStatus {
  if (statuses.includes("block")) return "block";
  if (statuses.includes("watch")) return "watch";
  return "pass";
}

function artifactById(room: LaunchRoom, id: string) {
  return room.artifacts.find((artifact) => artifact.id === id);
}

function decisionCheckById(room: LaunchRoom, id: LaunchRoomDecisionCheck["id"]) {
  return room.buyerDecision.checks.find((check) => check.id === id);
}

function shareCheckById(shareGate: BuyerShareGate, id: BuyerShareGateCheck["id"]) {
  return shareGate.checks.find((check) => check.id === id);
}

function sourceFromDecision(check: LaunchRoomDecisionCheck | undefined, fallbackHref: string): BuyerEvidenceTraceSource {
  const status = check ? fromLaunchStatus(check.status) : "block";
  return {
    label: check?.label ?? "Missing decision check",
    value: check ? `${check.value}. ${check.evidence}` : "Launch room did not produce this buyer decision check.",
    href: fallbackHref,
    status
  };
}

function sourceFromShareGate(check: BuyerShareGateCheck | undefined): BuyerEvidenceTraceSource {
  const status = check ? fromShareStatus(check.status) : "block";
  return {
    label: check?.label ?? "Missing share gate check",
    value: check ? `${check.evidence} ${check.action}` : "Buyer Share Gate did not produce this check.",
    href: check?.href ?? "#buyer-share-gate",
    status
  };
}

function sourceFromArtifact(artifact: LaunchRoomArtifact | undefined): BuyerEvidenceTraceSource {
  return {
    label: artifact?.label ?? "Missing artifact",
    value: artifact ? `${artifact.summary} ${artifact.proof}` : "Launch room did not create the required artifact.",
    href: artifact?.href ?? "#buyer-pilot-command",
    status: artifact ? fromLaunchStatus(artifact.status) : "block"
  };
}

function artifactSource(artifact: LaunchRoomArtifact | undefined): BuyerEvidenceTraceSource {
  return {
    label: artifact?.label ?? "Missing artifact",
    value: artifact ? `${artifact.owner}: ${artifact.proof}` : "No owner or proof route is available.",
    href: artifact?.href ?? "#buyer-pilot-command",
    status: artifact ? fromLaunchStatus(artifact.status) : "block"
  };
}

function claimCopy(id: BuyerEvidenceTraceClaimId) {
  switch (id) {
    case "value-case":
      return {
        label: "Buyer value claim",
        buyerQuestion: "Can a buyer understand the value without a sales call?",
        claim: "The workspace must show modeled value, confidence, and payback from buyer inputs."
      };
    case "measured-pilot":
      return {
        label: "Measured pilot claim",
        buyerQuestion: "Is at least one buyer-like run measured and accepted?",
        claim: "The pilot receipt must connect saved time, accepted tasks, reviewer, and public evidence."
      };
    case "public-proof":
      return {
        label: "Public proof claim",
        buyerQuestion: "Can an outside reviewer open every proof URL right now?",
        claim: "The product should not be shared until the proof links are public and checked."
      };
    case "work-order":
      return {
        label: "Work order claim",
        buyerQuestion: "Can the buyer see exactly what work is being approved?",
        claim: "A scoped work order must name the target user, success metric, baseline, and proof URL."
      };
    case "operating-gates":
      return {
        label: "Operating trust claim",
        buyerQuestion: "Can procurement see adoption, trust, and commercial stop rules?",
        claim: "The room must expose ownership, trust controls, pricing cap, renewal gate, and stop condition."
      };
    case "buyer-decision":
      return {
        label: "Buyer decision claim",
        buyerQuestion: "What is the next externally safe decision?",
        claim: "The share decision must be derived from room readiness, live proof, measurement, and artifact closure."
      };
  }
}

function buildClaim(input: {
  id: BuyerEvidenceTraceClaimId;
  source: BuyerEvidenceTraceSource;
  artifact: BuyerEvidenceTraceSource;
  verification: string;
  nextAction: string;
  extraStatus?: BuyerEvidenceTraceStatus;
  extraScore?: number;
}): BuyerEvidenceTraceClaim {
  const copy = claimCopy(input.id);
  const status = worstStatus(input.source.status, input.artifact.status, input.extraStatus ?? "pass");
  const score = Math.round(clamp(average([statusScore(input.source.status), statusScore(input.artifact.status), input.extraScore ?? statusScore(status)])));
  const finalScore = status === "block" ? Math.min(score, 56) : status === "watch" ? Math.min(score, 84) : score;
  const auditChecks = buildAuditChecks({
    id: input.id,
    source: input.source,
    artifact: input.artifact,
    verification: input.verification,
    status,
    nextAction: input.nextAction
  });
  return {
    id: input.id,
    label: copy.label,
    status,
    score: finalScore,
    buyerQuestion: copy.buyerQuestion,
    claim: copy.claim,
    source: input.source,
    artifact: input.artifact,
    verification: input.verification,
    nextAction: input.nextAction,
    auditChecks
  };
}

function buildAuditChecks(input: {
  id: BuyerEvidenceTraceClaimId;
  source: BuyerEvidenceTraceSource;
  artifact: BuyerEvidenceTraceSource;
  verification: string;
  status: BuyerEvidenceTraceStatus;
  nextAction: string;
}): BuyerEvidenceTraceAuditCheck[] {
  return [
    {
      id: "source-check",
      label: "Source check",
      status: input.source.status,
      method: "Read the source decision or share-gate check and confirm the buyer-facing evidence is present.",
      evidence: `${input.source.label}: ${input.source.value}`,
      href: input.source.href,
      failureMode: `${input.source.label} does not support the ${claimCopy(input.id).label.toLowerCase()}.`,
      repairAction: input.source.status === "pass" ? "Keep the source check linked." : input.nextAction
    },
    {
      id: "artifact-link",
      label: "Artifact link",
      status: input.artifact.status,
      method: "Open the artifact link and confirm an outside reviewer can inspect the cited proof.",
      evidence: `${input.artifact.label}: ${input.artifact.value}`,
      href: input.artifact.href,
      failureMode: `${input.artifact.label} is not inspectable enough to cite externally.`,
      repairAction: input.artifact.status === "pass" ? "Keep the artifact link attached." : input.nextAction
    },
    {
      id: "claim-match",
      label: "Claim match",
      status: input.status,
      method: "Compare the buyer question, source evidence, artifact evidence, and verification note before sharing.",
      evidence: input.verification,
      href: input.artifact.href,
      failureMode: `The ${claimCopy(input.id).label.toLowerCase()} should be downgraded or removed from the buyer packet.`,
      repairAction: input.status === "pass" ? "Keep the claim in the buyer packet." : input.nextAction
    }
  ];
}

function auditSummaryFrom(claims: BuyerEvidenceTraceClaim[]): BuyerEvidenceTraceAuditSummary {
  const checks = claims.flatMap((claim) => claim.auditChecks);
  const passCount = checks.filter((check) => check.status === "pass").length;
  const primaryFailure = checks.find((check) => check.status === "block") ?? checks.find((check) => check.status === "watch") ?? null;
  const readiness: BuyerEvidenceTraceAuditReadiness = primaryFailure?.status === "block" ? "audit-blocked" : primaryFailure ? "needs-review" : "audit-ready";
  return {
    readiness,
    passCount,
    totalCount: checks.length,
    primaryFailure
  };
}

function statusFromReceipt(receipt: BuyerProofPacketReceipt | null | undefined): BuyerEvidenceTraceStatus {
  if (!receipt) return "watch";
  if (receipt.checks.some((check) => check.status === "blocked")) return "block";
  if (receipt.checks.some((check) => check.status === "watch")) return "watch";
  return "pass";
}

function buildApprovalTrail(input: {
  auditSummary: BuyerEvidenceTraceAuditSummary;
  shareGate: BuyerShareGate;
  room: LaunchRoom;
  proofPacketReceipt?: BuyerProofPacketReceipt;
}): BuyerEvidenceTraceApprovalTrail {
  const receiptStatus = statusFromReceipt(input.proofPacketReceipt);
  const claimStatus = input.auditSummary.readiness === "audit-ready" ? "pass" : input.auditSummary.readiness === "needs-review" ? "watch" : "block";
  const shareStatus: BuyerEvidenceTraceStatus = input.shareGate.readiness === "send-ready" ? "pass" : input.shareGate.readiness === "almost-ready" ? "watch" : "block";
  const sponsorStatus = fromLaunchStatus(input.room.buyerDecision.status);
  const items: BuyerEvidenceTraceApprovalTrailItem[] = [
    {
      id: "claim-trace",
      label: "Claim trace verified",
      status: claimStatus,
      evidence: `${input.auditSummary.passCount}/${input.auditSummary.totalCount} source, artifact, and claim-match checks pass.`,
      href: "#buyer-evidence-trace",
      verifier: "Open every claim row and compare the source, artifact, and verification text."
    },
    {
      id: "share-gate",
      label: "Share gate decision",
      status: shareStatus,
      evidence: input.shareGate.decision,
      href: "#buyer-share-gate",
      verifier: "The buyer share gate must agree with the trace before external sharing."
    },
    {
      id: "packet-receipt",
      label: "Proof packet receipt",
      status: receiptStatus,
      evidence: input.proofPacketReceipt
        ? `${input.proofPacketReceipt.algorithm} ${input.proofPacketReceipt.digest}; ${input.proofPacketReceipt.coveredArtifacts.length} artifacts covered.`
        : "No proof packet receipt was attached to this trace.",
      href: "#buyer-proof-packet",
      verifier: input.proofPacketReceipt?.verification ?? "Generate the buyer proof packet and attach its manifest receipt."
    },
    {
      id: "sponsor-decision",
      label: "Sponsor decision path",
      status: sponsorStatus,
      evidence: `${input.room.buyerDecision.headline}: ${input.room.buyerDecision.instruction}`,
      href: "#sponsor-review-room",
      verifier: "Sponsor approval, revise, or stop must be recorded after the packet receipt is inspected."
    }
  ];

  return {
    readiness: worstStatus(...items.map((item) => item.status)),
    receiptDigest: input.proofPacketReceipt?.digest ?? null,
    receiptId: input.proofPacketReceipt?.id ?? null,
    items
  };
}

function readinessFrom(claims: BuyerEvidenceTraceClaim[]): BuyerEvidenceTraceReadiness {
  if (claims.some((claim) => claim.status === "block")) return "not-shareable";
  if (claims.some((claim) => claim.status === "watch")) return "sponsor-review";
  return "buyer-safe";
}

function headlineFor(readiness: BuyerEvidenceTraceReadiness) {
  if (readiness === "buyer-safe") return "Every buyer claim has inspectable proof";
  if (readiness === "sponsor-review") return "Buyer claims need sponsor review before sharing";
  return "Buyer claims are not safe to share yet";
}

function hardTruthFor(readiness: BuyerEvidenceTraceReadiness, blocker: BuyerEvidenceTraceClaim | undefined) {
  if (readiness === "buyer-safe") return "A reviewer can trace value, measurement, live proof, work order, trust gates, and the share decision back to source artifacts.";
  if (readiness === "sponsor-review") return blocker ? `${blocker.label} still needs owner confirmation: ${blocker.nextAction}` : "The trace is close, but one warning still needs owner confirmation.";
  return blocker ? `${blocker.label} blocks external sharing: ${blocker.nextAction}` : "At least one buyer claim is missing proof.";
}

function blockersFrom(room: LaunchRoom, claims: BuyerEvidenceTraceClaim[]): BuyerEvidenceTraceBlocker[] {
  return claims
    .filter((claim) => claim.status !== "pass")
    .map((claim) => {
      const artifact = room.artifacts.find((item) => item.href === claim.artifact.href || item.label === claim.artifact.label);
      return {
        id: claim.id,
        label: claim.label,
        status: claim.status,
        owner: artifact?.owner ?? "Product owner",
        action: claim.nextAction,
        href: claim.artifact.href
      };
    })
    .sort((left, right) => statusScore(left.status) - statusScore(right.status));
}

function buildMarkdown(trace: Omit<BuyerEvidenceTrace, "exportMarkdown">) {
  return [
    `# ${trace.headline}`,
    "",
    `Readiness: ${trace.readiness}`,
    `Trace score: ${trace.score}/100`,
    `Target buyer: ${trace.targetBuyer}`,
    `Share decision: ${trace.shareDecision}`,
    "",
    trace.hardTruth,
    "",
    "## Claim trace matrix",
    ...trace.claims.flatMap((claim) => [
      `- [${claim.status}] ${claim.label} (${claim.score}/100)`,
      `  - Buyer question: ${claim.buyerQuestion}`,
      `  - Source: ${claim.source.label} - ${claim.source.value}`,
      `  - Artifact: ${claim.artifact.label} - ${claim.artifact.href}`,
      `  - Verification: ${claim.verification}`,
      `  - Next action: ${claim.nextAction}`
    ]),
    "",
    "## Verification checklist",
    `Audit readiness: ${trace.auditSummary.readiness} (${trace.auditSummary.passCount}/${trace.auditSummary.totalCount} checks pass)`,
    ...trace.claims.flatMap((claim) => [
      `- ${claim.label}`,
      ...claim.auditChecks.map((check) => `  - [${check.status}] ${check.label}: ${check.method} Evidence: ${check.evidence} Action: ${check.repairAction}`)
    ]),
    "",
    "## Approval trail",
    `Trail readiness: ${trace.approvalTrail.readiness}`,
    `Proof packet receipt: ${trace.approvalTrail.receiptDigest ?? "not attached"}`,
    ...trace.approvalTrail.items.map((item) => `- [${item.status}] ${item.label}: ${item.evidence} Verifier: ${item.verifier}`),
    "",
    "## Open blockers",
    ...(trace.blockers.length > 0
      ? trace.blockers.map((blocker) => `- [${blocker.status}] ${blocker.label}: ${blocker.owner} should ${blocker.action} (${blocker.href})`)
      : ["- None."])
  ].join("\n");
}

export function buildBuyerEvidenceTrace(input: { room: LaunchRoom; shareGate: BuyerShareGate; proofPacketReceipt?: BuyerProofPacketReceipt; generatedAt?: string }): BuyerEvidenceTrace {
  const valueArtifact = artifactById(input.room, "buyer-value");
  const workOrderArtifact = artifactById(input.room, "work-order-brief");
  const proofArtifact = artifactById(input.room, "buyer-proof-packet");
  const proofAuditArtifact = artifactById(input.room, "live-proof-audit");
  const pilotArtifact = artifactById(input.room, "pilot-run-receipt");
  const trustArtifact = artifactById(input.room, "trust-center");
  const sponsorArtifact = artifactById(input.room, "sponsor-review");
  const commercialArtifact = artifactById(input.room, "commercial-offer");
  const measuredShareCheck = shareCheckById(input.shareGate, "measured-run");
  const publicProofShareCheck = shareCheckById(input.shareGate, "public-proof");
  const artifactClosureShareCheck = shareCheckById(input.shareGate, "artifact-closure");

  const claims = [
    buildClaim({
      id: "value-case",
      source: sourceFromDecision(decisionCheckById(input.room, "value-case"), valueArtifact?.href ?? "#value-blueprint"),
      artifact: artifactSource(valueArtifact),
      verification: input.room.primaryMetric.evidence,
      nextAction: valueArtifact?.status === "ready" ? "Keep the value memo linked in the launch room." : input.room.nextAction.action
    }),
    buildClaim({
      id: "measured-pilot",
      source: sourceFromDecision(decisionCheckById(input.room, "measured-pilot"), pilotArtifact?.href ?? "#pilot-run-receipt"),
      artifact: artifactSource(pilotArtifact),
      verification: measuredShareCheck?.evidence ?? "Buyer Share Gate has not evaluated the measured run.",
      nextAction: measuredShareCheck?.action ?? pilotArtifact?.proof ?? "Repair the measured run receipt."
    }),
    buildClaim({
      id: "public-proof",
      source: sourceFromShareGate(publicProofShareCheck),
      artifact: artifactSource(proofAuditArtifact ?? proofArtifact),
      verification: input.room.proofHealth.summary,
      nextAction: publicProofShareCheck?.action ?? input.room.proofHealth.instruction
    }),
    buildClaim({
      id: "work-order",
      source: sourceFromArtifact(workOrderArtifact),
      artifact: artifactSource(workOrderArtifact),
      verification: input.room.metrics.find((metric) => metric.id === "work-order-score")?.evidence ?? "Work order score is not available.",
      nextAction: workOrderArtifact?.status === "ready" ? "Keep the work order proof attached." : workOrderArtifact?.proof ?? "Repair the work order."
    }),
    buildClaim({
      id: "operating-gates",
      source: sourceFromDecision(decisionCheckById(input.room, "operating-gates"), trustArtifact?.href ?? "#buyer-trust-center"),
      artifact: artifactSource(worstStatus(fromLaunchStatus(trustArtifact?.status ?? "blocked"), fromLaunchStatus(commercialArtifact?.status ?? "blocked")) === "block" ? trustArtifact : commercialArtifact),
      verification: `Trust artifact: ${trustArtifact?.proof ?? "missing"}. Commercial artifact: ${commercialArtifact?.proof ?? "missing"}.`,
      nextAction: decisionCheckById(input.room, "operating-gates")?.status === "ready" ? "Keep trust and commercial gates linked." : "Close the adoption, trust, or commercial warning before buyer delivery."
    }),
    buildClaim({
      id: "buyer-decision",
      source: sourceFromShareGate(artifactClosureShareCheck),
      artifact: artifactSource(sponsorArtifact),
      verification: input.shareGate.decision,
      nextAction: input.shareGate.readiness === "send-ready" ? "Send the launch room or ask sponsor to approve the bounded pilot." : input.shareGate.decision,
      extraStatus: fromLaunchStatus(input.room.buyerDecision.status),
      extraScore: input.shareGate.score
    })
  ];
  const readiness = readinessFrom(claims);
  const blockers = blockersFrom(input.room, claims);
  const auditSummary = auditSummaryFrom(claims);
  const approvalTrail = buildApprovalTrail({ auditSummary, shareGate: input.shareGate, room: input.room, proofPacketReceipt: input.proofPacketReceipt });
  const score = Math.round(clamp(average(claims.map((claim) => claim.score))));
  const firstOpen = claims.find((claim) => claim.status === "block") ?? claims.find((claim) => claim.status === "watch");
  const partial: Omit<BuyerEvidenceTrace, "exportMarkdown"> = {
    id: `buyer-evidence-trace-${readiness}-${score}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    readiness,
    score: blockers.length > 0 ? Math.min(score, 88) : score,
    headline: headlineFor(readiness),
    hardTruth: hardTruthFor(readiness, firstOpen),
    targetBuyer: input.room.targetBuyer,
    shareDecision: input.shareGate.decision,
    primaryClaim: firstOpen ?? claims[0],
    claims,
    auditSummary,
    approvalTrail,
    blockers
  };

  return {
    ...partial,
    exportMarkdown: buildMarkdown(partial)
  };
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tone(status: BuyerEvidenceTraceStatus | BuyerEvidenceTraceReadiness) {
  if (status === "pass" || status === "buyer-safe") return "pass";
  if (status === "watch" || status === "sponsor-review") return "watch";
  return "block";
}

export function renderBuyerEvidenceTraceHtml(
  trace: BuyerEvidenceTrace,
  links: { appUrl?: string; launchRoomUrl?: string; buyerBriefUrl?: string; proofDossierUrl?: string; jsonUrl?: string; markdownUrl?: string } = {}
) {
  const nav = [
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.buyerBriefUrl ? `<a href="${escapeHtml(links.buyerBriefUrl)}">Buyer brief</a>` : "",
    links.proofDossierUrl ? `<a href="${escapeHtml(links.proofDossierUrl)}">Proof dossier</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const claims = trace.claims
    .map(
      (claim) => `
        <article class="${tone(claim.status)}">
          <div>
            <span>${escapeHtml(claim.status)}</span>
            <strong>${escapeHtml(claim.label)}</strong>
            <b>${escapeHtml(claim.score)}/100</b>
          </div>
          <p>${escapeHtml(claim.buyerQuestion)}</p>
          <dl>
            <div><dt>Source</dt><dd>${escapeHtml(claim.source.label)}<small>${escapeHtml(claim.source.value)}</small></dd></div>
            <div><dt>Artifact</dt><dd><a href="${escapeHtml(claim.artifact.href)}">${escapeHtml(claim.artifact.label)}</a><small>${escapeHtml(claim.artifact.value)}</small></dd></div>
            <div><dt>Verification</dt><dd>${escapeHtml(claim.verification)}</dd></div>
          </dl>
          <footer>${escapeHtml(claim.nextAction)}</footer>
        </article>
      `
    )
    .join("");
  const auditChecklist = trace.claims
    .map(
      (claim) => `
        <article class="${tone(claim.status)}">
          <div>
            <span>${escapeHtml(claim.status)}</span>
            <strong>${escapeHtml(claim.label)}</strong>
            <b>${escapeHtml(claim.auditChecks.filter((check) => check.status === "pass").length)}/${escapeHtml(claim.auditChecks.length)}</b>
          </div>
          <dl>
            ${claim.auditChecks
              .map(
                (check) => `
                  <div>
                    <dt>${escapeHtml(check.label)} (${escapeHtml(check.status)})</dt>
                    <dd><a href="${escapeHtml(check.href)}">${escapeHtml(check.method)}</a><small>${escapeHtml(check.evidence)} Action: ${escapeHtml(check.repairAction)}</small></dd>
                  </div>
                `
              )
              .join("")}
          </dl>
        </article>
      `
    )
    .join("");
  const blockers =
    trace.blockers.length > 0
      ? trace.blockers
          .map(
            (blocker) => `
              <article class="${tone(blocker.status)}">
                <span>${escapeHtml(blocker.status)}</span>
                <strong>${escapeHtml(blocker.label)}</strong>
                <p>${escapeHtml(blocker.owner)} should ${escapeHtml(blocker.action)}</p>
                <a href="${escapeHtml(blocker.href)}">Open artifact</a>
              </article>
            `
          )
          .join("")
      : `<article class="pass"><span>pass</span><strong>No open blockers</strong><p>All traced buyer claims have inspectable proof.</p></article>`;
  const approvalTrail = trace.approvalTrail.items
    .map(
      (item) => `
        <article class="${tone(item.status)}">
          <div>
            <span>${escapeHtml(item.status)}</span>
            <strong>${escapeHtml(item.label)}</strong>
          </div>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.verifier)}</small>
          <a href="${escapeHtml(item.href)}">Open verifier</a>
        </article>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Buyer Evidence Trace</title>
    <style>
      :root { color: #172126; background: #eef2ed; font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      header, main, footer.page { width: min(1180px, calc(100% - 28px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: end; padding: 28px 0 14px; }
      nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
      nav a, .hero a, .blockers a { border: 1px solid #c9d4ce; border-radius: 999px; padding: 8px 11px; color: #172126; background: #fffdf7; font-size: .84rem; font-weight: 850; text-decoration: none; }
      h1, h2, h3, p { margin: 0; }
      h1 { max-width: 820px; font-size: clamp(2.2rem, 6vw, 4.8rem); line-height: .94; letter-spacing: 0; }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 14px; padding: 18px; border: 1px solid #172126; border-radius: 8px; color: #fffdf7; background: linear-gradient(135deg, #172126, #2457a6); }
      .hero p { max-width: 760px; margin-top: 10px; color: rgba(255,253,247,.78); line-height: 1.55; }
      .score { display: grid; align-content: center; justify-items: center; min-height: 170px; border: 1px solid rgba(255,253,247,.24); border-radius: 8px; background: rgba(255,253,247,.09); }
      .score span { font-size: .72rem; font-weight: 900; text-transform: uppercase; }
      .score strong { font-size: 4.4rem; line-height: .9; }
      .matrix, .blockers { display: grid; gap: 10px; margin-top: 14px; }
      .matrix { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .approval-trail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
      .audit-summary { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 10px; margin-top: 14px; }
      .audit-summary > div { min-width: 0; padding: 14px; border: 1px solid #d5ded8; border-radius: 8px; background: #fffdf7; }
      .audit-summary strong { display: block; margin-top: 5px; font-size: 1.2rem; }
      .section-title { margin-top: 18px; color: #0f766e; font-size: .78rem; font-weight: 950; text-transform: uppercase; }
      article { min-width: 0; display: grid; gap: 10px; padding: 14px; border: 1px solid #d5ded8; border-left: 5px solid #0f766e; border-radius: 8px; background: #fffdf7; }
      article.watch { border-left-color: #f2b84b; background: #fff8e6; }
      article.block { border-left-color: #b56576; background: #fff1f2; }
      article > div { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: start; }
      span, dt { color: #0f766e; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .watch span, .watch dt { color: #806000; }
      .block span, .block dt { color: #8d2d42; }
      strong { line-height: 1.15; overflow-wrap: anywhere; }
      b { font-size: 1.1rem; }
      p, dd, footer, small { color: #44514d; line-height: 1.45; overflow-wrap: anywhere; }
      dl { display: grid; gap: 8px; margin: 0; }
      dl div { display: grid; gap: 3px; padding-top: 8px; border-top: 1px solid rgba(23,33,38,.1); }
      dd { margin: 0; font-weight: 800; }
      dd small { display: block; margin-top: 3px; font-weight: 500; }
      a { color: #0b5f58; font-weight: 850; }
      .blockers { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      footer.page { padding: 18px 0 32px; color: #64706b; font-size: .86rem; }
      @media (max-width: 960px) { .approval-trail { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 820px) { header, .hero, .audit-summary { grid-template-columns: 1fr; } nav { justify-content: flex-start; } .matrix, .blockers, .approval-trail { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <header>
      <div>
        <h1>${escapeHtml(trace.headline)}</h1>
      </div>
      <nav>${nav}</nav>
    </header>
    <main>
      <section class="hero">
        <div>
          <span>${escapeHtml(trace.readiness)}</span>
          <p>${escapeHtml(trace.hardTruth)}</p>
          <p>${escapeHtml(trace.shareDecision)}</p>
        </div>
        <div class="score">
          <span>Trace score</span>
          <strong>${escapeHtml(trace.score)}</strong>
          <small>${escapeHtml(trace.targetBuyer)}</small>
        </div>
      </section>
      <h2 class="section-title">Claim trace matrix</h2>
      <section class="matrix" aria-label="Claim trace matrix">${claims}</section>
      <h2 class="section-title">Verification checklist</h2>
      <section class="audit-summary" aria-label="Verification checklist summary">
        <div>
          <span>${escapeHtml(trace.auditSummary.readiness)}</span>
          <strong>${escapeHtml(trace.auditSummary.passCount)}/${escapeHtml(trace.auditSummary.totalCount)} audit checks pass</strong>
          <p>${escapeHtml(trace.auditSummary.primaryFailure ? `${trace.auditSummary.primaryFailure.label}: ${trace.auditSummary.primaryFailure.repairAction}` : "Every claim has source, artifact, and claim-match checks ready.")}</p>
        </div>
        <div>
          <span>Primary claim</span>
          <strong>${escapeHtml(trace.primaryClaim.label)}</strong>
          <p>${escapeHtml(trace.primaryClaim.nextAction)}</p>
        </div>
      </section>
      <section class="matrix" aria-label="Verification checklist">${auditChecklist}</section>
      <h2 class="section-title">Approval trail</h2>
      <section class="audit-summary" aria-label="Approval trail summary">
        <div>
          <span>${escapeHtml(trace.approvalTrail.readiness)}</span>
          <strong>${escapeHtml(trace.approvalTrail.receiptDigest ?? "No receipt attached")}</strong>
          <p>${escapeHtml(trace.approvalTrail.receiptId ?? "Attach the buyer proof packet receipt before treating this trace as final.")}</p>
        </div>
        <div>
          <span>Trail checks</span>
          <strong>${escapeHtml(trace.approvalTrail.items.filter((item) => item.status === "pass").length)}/${escapeHtml(trace.approvalTrail.items.length)}</strong>
          <p>Claim trace, share gate, packet receipt, and sponsor decision path.</p>
        </div>
      </section>
      <section class="approval-trail" aria-label="Approval trail">${approvalTrail}</section>
      <h2 class="section-title">Open blockers</h2>
      <section class="blockers" aria-label="Open blockers">${blockers}</section>
    </main>
    <footer class="page">Generated ${escapeHtml(trace.generatedAt)}. The trace maps buyer claims to source checks, public artifacts, verification evidence, and next actions.</footer>
  </body>
</html>`;
}
