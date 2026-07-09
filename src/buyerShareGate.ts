import type { BuyerPilotCommand, BuyerPilotCommandStep } from "./buyerPilotCommand.js";
import type { BuyerPilotMeasuredRunSummary } from "./buyerPilotMeasuredRun.js";
import type { BuyerPilotRunCalibration } from "./buyerPilotRunCalibration.js";
import { isBuyerFacingProofUrl } from "./publicProofUrl.js";

export type BuyerShareGateReadiness = "send-ready" | "almost-ready" | "needs-room" | "needs-proof" | "needs-measurement";
export type BuyerShareGateCheckStatus = "pass" | "watch" | "block";
export const BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH = "/api/buyer-share-gate/receipt/verify";

export type BuyerShareGateProofLink = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type BuyerShareGateProofVerification = {
  id: string;
  label: string;
  status: BuyerShareGateCheckStatus;
  httpStatus?: number;
  evidence: string;
  action: string;
};

export type BuyerShareGateProofVerificationSummary = {
  checkedAt: string;
  verifiedCount: number;
  totalCount: number;
  score: number;
  results: BuyerShareGateProofVerification[];
};

export type BuyerShareGateCheck = {
  id: "launch-room" | "public-proof" | "measured-run" | "artifact-closure";
  label: string;
  status: BuyerShareGateCheckStatus;
  score: number;
  evidence: string;
  action: string;
  href: string;
};

export type BuyerShareGateRepairStatus = "ready" | "review" | "repair";

export type BuyerShareGateRepairPlanItem = {
  id: BuyerShareGateCheck["id"];
  sequence: number;
  label: string;
  status: BuyerShareGateCheckStatus;
  owner: string;
  action: string;
  evidence: string;
  href: string;
  unlock: string;
};

export type BuyerShareGateRepairPlan = {
  status: BuyerShareGateRepairStatus;
  headline: string;
  summary: string;
  items: BuyerShareGateRepairPlanItem[];
  exportMarkdown: string;
  exportHref: string;
};

export type BuyerShareGateSendPacketMode = "send" | "review" | "hold";

export type BuyerShareGateSendPacket = {
  mode: BuyerShareGateSendPacketMode;
  subject: string;
  messageLines: string[];
  acceptanceCriteria: Array<{
    id: BuyerShareGateCheck["id"];
    label: string;
    status: BuyerShareGateCheckStatus;
    evidence: string;
    action: string;
  }>;
  stopRules: string[];
  copyText: string;
};

export type BuyerShareGateReceiptPayload = {
  receiptVersion: "buyer-share-gate.v1";
  readiness: BuyerShareGateReadiness;
  score: number;
  mode: BuyerShareGateSendPacketMode;
  subject: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  blockerCount: number;
  watchCount: number;
  checks: BuyerShareGateCheck[];
  repairPlan: Pick<BuyerShareGateRepairPlan, "status" | "headline" | "summary" | "items">;
  stopRules: string[];
};

export type BuyerShareGateReceiptVerification = {
  status: "verified" | "mismatch";
  expectedChecksum: string;
  actualChecksum: string;
  instruction: string;
};

export type BuyerShareGateReceipt = {
  receiptId: string;
  checksumAlgorithm: "fnv1a-64";
  checksum: string;
  verificationApiPath: typeof BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH;
  payload: BuyerShareGateReceiptPayload;
  payloadJson: string;
  payloadHref: string;
  verificationRequestJson: string;
  verificationRequestHref: string;
  verification: BuyerShareGateReceiptVerification;
  copyText: string;
  href: string;
};

export type BuyerShareGate = {
  readiness: BuyerShareGateReadiness;
  score: number;
  headline: string;
  decision: string;
  blockerCount: number;
  watchCount: number;
  primaryActionLabel: string;
  primaryActionHref: string;
  checks: BuyerShareGateCheck[];
  repairPlan: BuyerShareGateRepairPlan;
  sendPacket: BuyerShareGateSendPacket;
  receipt: BuyerShareGateReceipt;
  exportMarkdown: string;
};

const CURRENT_PROOF_WINDOW_HOURS = 24;
const STALE_PROOF_WINDOW_HOURS = 72;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function statusScore(status: BuyerShareGateCheckStatus) {
  if (status === "pass") return 100;
  if (status === "watch") return 66;
  return 22;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value), null, 2);
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

function escapeScriptJson(value: string) {
  return value
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function tone(status: BuyerShareGateCheckStatus | BuyerShareGateSendPacketMode | BuyerShareGateReadiness) {
  if (status === "pass" || status === "send" || status === "send-ready") return "good";
  if (status === "watch" || status === "review" || status === "almost-ready") return "watch";
  return "bad";
}

function repairPlanTone(status: BuyerShareGateRepairStatus) {
  if (status === "ready") return "good";
  if (status === "review") return "watch";
  return "bad";
}

function firstOpenStep(steps: BuyerPilotCommandStep[]) {
  return steps.find((step) => step.status === "blocked") ?? steps.find((step) => step.status === "attention") ?? steps[0];
}

function hoursSince(checkedAt: string, now: Date) {
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) return null;
  return Math.max(0, Math.round(((now.getTime() - checked.getTime()) / 3_600_000) * 10) / 10);
}

function proofFreshnessStatus(freshnessHours: number | null): BuyerShareGateCheckStatus {
  if (freshnessHours === null) return "block";
  if (freshnessHours <= CURRENT_PROOF_WINDOW_HOURS) return "pass";
  if (freshnessHours <= STALE_PROOF_WINDOW_HOURS) return "watch";
  return "block";
}

function proofFreshnessEvidence(freshnessHours: number | null) {
  if (freshnessHours === null) return "The live proof verification timestamp is invalid.";
  return `Last live proof check was ${freshnessHours} hours ago.`;
}

function proofFreshnessAction(status: BuyerShareGateCheckStatus) {
  if (status === "pass") return "Keep verified proof URLs attached to the workspace.";
  if (status === "watch") return "Re-run Verify live links before the next sponsor or buyer review.";
  return "Run Verify live links before external sharing.";
}

function buildLaunchRoomCheck(command: BuyerPilotCommand): BuyerShareGateCheck {
  const isReady = command.readiness === "buyer-ready";
  const status: BuyerShareGateCheckStatus = isReady ? "pass" : command.readiness === "needs-proof" && command.launchScore >= 70 ? "watch" : "block";
  return {
    id: "launch-room",
    label: "Launch room decision",
    status,
    score: isReady ? 100 : status === "watch" ? clamp(command.launchScore, 58, 82) : clamp(command.launchScore, 0, 55),
    evidence: `${command.launchScore}/100 launch score; ${command.proofClosure}.`,
    action: isReady ? "Use the launch room as the buyer-facing source of truth." : command.nextGap.action,
    href: isReady ? command.nextGap.href : command.nextGap.editHref
  };
}

function buildProofCheck(proofLinks: BuyerShareGateProofLink[], proofVerification: BuyerShareGateProofVerificationSummary | undefined, now: Date): BuyerShareGateCheck {
  const total = Math.max(1, proofLinks.length);
  const missing = proofLinks.filter((link) => !isBuyerFacingProofUrl(link.value));
  if (proofVerification) {
    const firstOpen = proofVerification.results.find((result) => result.status === "block") ?? proofVerification.results.find((result) => result.status === "watch");
    const matchingLink = firstOpen ? proofLinks.find((link) => link.id === firstOpen.id) : undefined;
    const freshnessHours = hoursSince(proofVerification.checkedAt, now);
    const freshStatus = proofFreshnessStatus(freshnessHours);
    const reachabilityStatus: BuyerShareGateCheckStatus = proofVerification.results.some((result) => result.status === "block")
      ? "block"
      : proofVerification.results.some((result) => result.status === "watch")
        ? "watch"
        : "pass";
    const status: BuyerShareGateCheckStatus =
      reachabilityStatus === "block" || freshStatus === "block"
        ? "block"
        : reachabilityStatus === "watch" || freshStatus === "watch"
          ? "watch"
          : "pass";
    const freshnessAction = proofFreshnessAction(freshStatus);
    return {
      id: "public-proof",
      label: "Live proof reachability",
      status,
      score: Math.min(proofVerification.score, statusScore(freshStatus)),
      evidence: `${proofVerification.verifiedCount}/${proofVerification.totalCount} evidence links verified live${firstOpen ? `; ${firstOpen.label}: ${firstOpen.evidence}` : "."} ${proofFreshnessEvidence(freshnessHours)}`,
      action: firstOpen ? firstOpen.action : freshnessAction,
      href: matchingLink?.href ?? (freshStatus === "pass" ? "#launch-evidence-console" : "#buyer-proof-intake")
    };
  }

  const sealed = proofLinks.length - missing.length;
  const next = missing[0];
  return {
    id: "public-proof",
    label: missing.length > 0 ? "Public proof links" : "Live proof verification",
    status: "block",
    score: Math.min(59, Math.round((sealed / total) * 100)),
    evidence:
      missing.length > 0
        ? `${sealed}/${total} evidence links are public; next missing: ${next?.label ?? "public proof"}.`
        : `${sealed}/${total} evidence links are public, but live reachability has not been checked in this session.`,
    action: next ? `Attach ${next.label} before external sharing.` : "Run Verify live links before external sharing.",
    href: next?.href ?? "#buyer-proof-intake"
  };
}

function measuredRunAction(measuredRun: BuyerPilotMeasuredRunSummary) {
  if (measuredRun.readiness === "needs-reviewer") return "Name the reviewer who accepted the measured run.";
  if (measuredRun.readiness === "needs-acceptance") return "Rerun or narrow the pilot until at least 70% of tasks are accepted.";
  if (measuredRun.readiness === "needs-savings") return "Record a run where assisted work is faster than the manual baseline.";
  return "Cite the measured run as buyer proof.";
}

function buildMeasuredRunCheck(measuredRun: BuyerPilotMeasuredRunSummary, calibration?: BuyerPilotRunCalibration): BuyerShareGateCheck {
  const targetMet = calibration ? calibration.readiness === "target-met" : true;
  const isMeasured = targetMet && measuredRun.readiness === "measured" && measuredRun.actualMinutesSavedPerRun > 0 && measuredRun.measuredMonthlyValueYen > 0;
  const calibrationAction =
    calibration && calibration.readiness !== "target-met"
      ? calibration.checks.find((check) => check.status === "block" || check.status === "watch")?.action
      : undefined;
  const calibrationEvidence = calibration ? ` Target ${calibration.minimumAcceptedSavingsMinutes}m; gap ${calibration.savingsGapMinutes}m.` : "";
  return {
    id: "measured-run",
    label: "Measured pilot receipt",
    status: isMeasured ? "pass" : "block",
    score: isMeasured ? 100 : statusScore("block"),
    evidence: `${measuredRun.actualMinutesSavedPerRun}m saved/run, ${measuredRun.acceptanceRatePercent}% accepted, ${measuredRun.measuredMonthlyHoursSaved}h/month measured.${calibrationEvidence}`,
    action: calibrationAction ?? measuredRunAction(measuredRun),
    href: "#pilot-run-receipt"
  };
}

function buildArtifactClosureCheck(command: BuyerPilotCommand): BuyerShareGateCheck {
  const total = Math.max(1, command.steps.length);
  const ready = command.steps.filter((step) => step.status === "ready").length;
  const open = command.steps.filter((step) => step.status !== "ready");
  const current = firstOpenStep(command.steps);
  const status: BuyerShareGateCheckStatus = open.length === 0 ? "pass" : open.some((step) => step.status === "blocked") ? "block" : "watch";
  return {
    id: "artifact-closure",
    label: "Artifact closure",
    status,
    score: Math.round((ready / total) * 100),
    evidence: `${ready}/${total} buyer artifacts are sealed.`,
    action: open.length === 0 ? "All artifact links are ready for external review." : `Close ${current?.label ?? "the current artifact"} before sending.`,
    href: open.length === 0 ? command.nextGap.href : current?.editHref ?? command.nextGap.editHref
  };
}

function readinessFrom(checks: BuyerShareGateCheck[]): BuyerShareGateReadiness {
  const blocker = checks.find((check) => check.status === "block");
  if (!blocker) return checks.some((check) => check.status === "watch") ? "almost-ready" : "send-ready";
  if (blocker.id === "public-proof") return "needs-proof";
  if (blocker.id === "measured-run") return "needs-measurement";
  return "needs-room";
}

function headlineFor(readiness: BuyerShareGateReadiness) {
  if (readiness === "send-ready") return "Buyer share gate is clear";
  if (readiness === "almost-ready") return "One final review before sending";
  if (readiness === "needs-proof") return "Attach public proof before sending";
  if (readiness === "needs-measurement") return "Measured pilot proof is not citeable yet";
  return "Launch room is not buyer-ready yet";
}

function buildDecision(readiness: BuyerShareGateReadiness, blocker: BuyerShareGateCheck | undefined) {
  if (readiness === "send-ready") return "Send the launch room to the buyer or sponsor reviewer.";
  if (readiness === "almost-ready") return "Share internally for review, then close the remaining warning before buyer delivery.";
  return `Hold external sharing. ${blocker?.action ?? "Close the first open buyer-readiness gap."}`;
}

function repairOwnerFor(id: BuyerShareGateCheck["id"]) {
  if (id === "launch-room") return "Pilot owner";
  if (id === "public-proof") return "Proof owner";
  if (id === "measured-run") return "Pilot reviewer";
  return "Launch owner";
}

function repairUnlockFor(id: BuyerShareGateCheck["id"]) {
  if (id === "launch-room") return "Buyer room can move from internal hold to sponsor review.";
  if (id === "public-proof") return "Public evidence can be cited outside the app.";
  if (id === "measured-run") return "ROI claim becomes citeable from observed work.";
  return "Send packet has the artifacts reviewers need.";
}

function buildRepairPlanMarkdown(plan: Omit<BuyerShareGateRepairPlan, "exportMarkdown" | "exportHref">, score: number) {
  const itemLines =
    plan.items.length > 0
      ? plan.items.flatMap((item) => [
          `- ${item.sequence}. [${item.status}] ${item.label}`,
          `  Owner: ${item.owner}`,
          `  Action: ${item.action}`,
          `  Evidence: ${item.evidence}`,
          `  Unlock: ${item.unlock}`,
          `  Link: ${item.href}`
        ])
      : ["- No repair items. Keep the receipt with the buyer packet."];

  return ["# Buyer send repair plan", "", `Status: ${plan.status}`, `Score: ${score}/100`, plan.headline, "", plan.summary, "", "## Items", ...itemLines].join("\n");
}

function buildRepairPlan(checks: BuyerShareGateCheck[], score: number): BuyerShareGateRepairPlan {
  const items = checks
    .filter((check) => check.status !== "pass")
    .map((check, index) => ({
      id: check.id,
      sequence: index + 1,
      label: check.label,
      status: check.status,
      owner: repairOwnerFor(check.id),
      action: check.action,
      evidence: check.evidence,
      href: check.href,
      unlock: repairUnlockFor(check.id)
    }));
  const status: BuyerShareGateRepairStatus = items.length === 0 ? "ready" : items.some((item) => item.status === "block") ? "repair" : "review";
  const headline =
    status === "ready"
      ? "No repair work before buyer send"
      : status === "review"
        ? "Review warning before buyer send"
        : "Repair blockers before buyer send";
  const summary =
    items.length === 0
      ? "All share-gate checks are pass. Keep the receipt with the buyer packet."
      : `${items.length} repair ${items.length === 1 ? "item" : "items"} before buyer send. Start with ${items[0]?.label}: ${items[0]?.action}`;
  const partial = {
    status,
    headline,
    summary,
    items
  };
  const exportMarkdown = buildRepairPlanMarkdown(partial, score);

  return {
    ...partial,
    exportMarkdown,
    exportHref: `data:text/markdown;charset=utf-8,${encodeURIComponent(exportMarkdown)}`
  };
}

function buildMarkdown(gate: Omit<BuyerShareGate, "exportMarkdown">) {
  return [
    `# ${gate.headline}`,
    "",
    `Readiness: ${gate.readiness}`,
    `Share score: ${gate.score}/100`,
    "",
    gate.decision,
    "",
    "## Checks",
    ...gate.checks.map((check) => `- [${check.status}] ${check.label}: ${check.evidence} Action: ${check.action}`),
    "",
    "## Buyer send repair plan",
    gate.repairPlan.headline,
    gate.repairPlan.summary,
    ...(
      gate.repairPlan.items.length > 0
        ? gate.repairPlan.items.map((item) => `- ${item.sequence}. [${item.status}] ${item.label}: ${item.action} Owner: ${item.owner}. Unlock: ${item.unlock}`)
        : ["- No repair items. Keep the receipt with the buyer packet."]
    ),
    "",
    "## Buyer send packet",
    `Mode: ${gate.sendPacket.mode}`,
    `Subject: ${gate.sendPacket.subject}`,
    "",
    "### Message",
    ...gate.sendPacket.messageLines.map((line) => `- ${line}`),
    "",
    "### Acceptance criteria",
    ...gate.sendPacket.acceptanceCriteria.map((criterion) => `- [${criterion.status}] ${criterion.label}: ${criterion.evidence} Action: ${criterion.action}`),
    "",
    "### Stop rules",
    ...gate.sendPacket.stopRules.map((rule) => `- ${rule}`),
    "",
    "## Decision receipt",
    `Receipt: ${gate.receipt.receiptId}`,
    `Checksum: ${gate.receipt.checksumAlgorithm}:${gate.receipt.checksum}`,
    `Verification: ${gate.receipt.verification.status}`,
    `API verification: POST ${gate.receipt.verificationApiPath}`,
    "Replay rule: Recompute fnv1a-64 over the share gate replay payload before accepting a forwarded buyer send/no-send decision."
  ].join("\n");
}

function sendPacketMode(readiness: BuyerShareGateReadiness): BuyerShareGateSendPacketMode {
  if (readiness === "send-ready") return "send";
  if (readiness === "almost-ready") return "review";
  return "hold";
}

function buildSendPacket(gate: Omit<BuyerShareGate, "sendPacket" | "receipt" | "exportMarkdown">, command: BuyerPilotCommand): BuyerShareGateSendPacket {
  const firstBlocker = gate.checks.find((check) => check.status === "block");
  const firstOpen = firstBlocker ?? gate.checks.find((check) => check.status === "watch");
  const mode = sendPacketMode(gate.readiness);
  const subject =
    mode === "send"
      ? `Buyer pilot packet ready: ${command.targetBuyer}`
      : mode === "review"
        ? `Sponsor review needed: ${firstOpen?.label ?? "buyer share gate"}`
        : `Hold buyer pilot packet: ${firstBlocker?.label ?? firstOpen?.label ?? "share gate blocker"}`;
  const messageLines =
    mode === "send"
      ? [
          `${command.targetBuyer} can review a bounded AI-agent pilot with ${command.primaryMetric}.`,
          `Share gate is ${gate.readiness} at ${gate.score}/100 with ${gate.blockerCount} blockers and ${gate.watchCount} warnings.`,
          "Please inspect the launch room, confirm the measured pilot receipt, and decide continue, revise, or stop."
        ]
      : [
          `${command.targetBuyer} should not receive this packet yet.`,
          `Share gate is ${gate.readiness} at ${gate.score}/100 with ${gate.blockerCount} blockers and ${gate.watchCount} warnings.`,
          firstOpen ? `First open item: ${firstOpen.label}. ${firstOpen.action}` : "Run the share gate again before external delivery."
        ];
  const acceptanceCriteria = gate.checks.map((check) => ({
    id: check.id,
    label: check.label,
    status: check.status,
    evidence: check.evidence,
    action: check.action
  }));
  const stopRules = [
    "Do not send externally while any acceptance criterion is block.",
    "Do not cite measured value if the measured pilot receipt is blocked or missing reviewer acceptance.",
    "Do not use private credentials, private customer data, or non-public links as buyer proof.",
    "Rerun live proof verification after changing any proof URL.",
    "Do not send externally if the latest live proof check is older than 24 hours."
  ];
  const copyText = [
    `Subject: ${subject}`,
    "",
    ...messageLines,
    "",
    "Acceptance criteria:",
    ...acceptanceCriteria.map((criterion) => `- [${criterion.status}] ${criterion.label}: ${criterion.evidence} Action: ${criterion.action}`),
    "",
    "Stop rules:",
    ...stopRules.map((rule) => `- ${rule}`)
  ].join("\n");

  return {
    mode,
    subject,
    messageLines,
    acceptanceCriteria,
    stopRules,
    copyText
  };
}

export function verifyBuyerShareGateReceipt(receipt: Pick<BuyerShareGateReceipt, "checksum" | "payload">): BuyerShareGateReceiptVerification {
  const actualChecksum = stableDigest(receipt.payload);
  const verified = actualChecksum === receipt.checksum;

  return {
    status: verified ? "verified" : "mismatch",
    expectedChecksum: receipt.checksum,
    actualChecksum,
    instruction: verified
      ? "Share gate receipt checksum matches the attached replay payload."
      : "Share gate receipt checksum does not match the attached replay payload. Do not use this send/no-send decision until the share gate is re-exported."
  };
}

function buildReceiptMarkdown(receipt: Omit<BuyerShareGateReceipt, "copyText" | "href">) {
  return [
    "# Buyer share gate receipt",
    "",
    `Receipt: ${receipt.receiptId}`,
    `Checksum: ${receipt.checksumAlgorithm}:${receipt.checksum}`,
    `Readiness: ${receipt.payload.readiness}`,
    `Mode: ${receipt.payload.mode}`,
    `Subject: ${receipt.payload.subject}`,
    `Score: ${receipt.payload.score}/100`,
    "",
    "## Replay payload",
    "```json",
    receipt.payloadJson,
    "```",
    "",
    "## Verification",
    `- Status: ${receipt.verification.status}`,
    `- Expected checksum: ${receipt.verification.expectedChecksum}`,
    `- Actual checksum: ${receipt.verification.actualChecksum}`,
    `- Instruction: ${receipt.verification.instruction}`,
    "",
    "## API verification",
    `POST ${receipt.verificationApiPath}`,
    "",
    "Request body:",
    "```json",
    receipt.verificationRequestJson,
    "```",
    "",
    "Replay rule: Recompute fnv1a-64 over the share gate replay payload before accepting a forwarded buyer send/no-send decision."
  ].join("\n");
}

function buildShareGateReceipt(gate: Omit<BuyerShareGate, "receipt" | "exportMarkdown">): BuyerShareGateReceipt {
  const payload: BuyerShareGateReceiptPayload = {
    receiptVersion: "buyer-share-gate.v1",
    readiness: gate.readiness,
    score: gate.score,
    mode: gate.sendPacket.mode,
    subject: gate.sendPacket.subject,
    primaryActionLabel: gate.primaryActionLabel,
    primaryActionHref: gate.primaryActionHref,
    blockerCount: gate.blockerCount,
    watchCount: gate.watchCount,
    checks: gate.checks,
    repairPlan: {
      status: gate.repairPlan.status,
      headline: gate.repairPlan.headline,
      summary: gate.repairPlan.summary,
      items: gate.repairPlan.items
    },
    stopRules: gate.sendPacket.stopRules
  };
  const checksum = stableDigest(payload);
  const payloadJson = canonicalJson(payload);
  const verificationRequestJson = canonicalJson({ checksum, payload });
  const verification = verifyBuyerShareGateReceipt({ checksum, payload });
  const partial: Omit<BuyerShareGateReceipt, "copyText" | "href"> = {
    receiptId: `buyer-share-gate-${payload.mode}-${checksum.slice(0, 12)}`,
    checksumAlgorithm: "fnv1a-64",
    checksum,
    verificationApiPath: BUYER_SHARE_GATE_RECEIPT_VERIFY_PATH,
    payload,
    payloadJson,
    payloadHref: `data:application/json;charset=utf-8,${encodeURIComponent(payloadJson)}`,
    verificationRequestJson,
    verificationRequestHref: `data:application/json;charset=utf-8,${encodeURIComponent(verificationRequestJson)}`,
    verification
  };
  const copyText = buildReceiptMarkdown(partial);

  return {
    ...partial,
    copyText,
    href: `data:text/markdown;charset=utf-8,${encodeURIComponent(copyText)}`
  };
}

export function buildBuyerShareGate(input: {
  command: BuyerPilotCommand;
  proofLinks: BuyerShareGateProofLink[];
  measuredRun: BuyerPilotMeasuredRunSummary;
  runCalibration?: BuyerPilotRunCalibration;
  proofVerification?: BuyerShareGateProofVerificationSummary;
  now?: Date;
}): BuyerShareGate {
  const checks = [
    buildLaunchRoomCheck(input.command),
    buildProofCheck(input.proofLinks, input.proofVerification, input.now ?? new Date()),
    buildMeasuredRunCheck(input.measuredRun, input.runCalibration),
    buildArtifactClosureCheck(input.command)
  ];
  const readiness = readinessFrom(checks);
  const blockerCount = checks.filter((check) => check.status === "block").length;
  const watchCount = checks.filter((check) => check.status === "watch").length;
  const rawScore = Math.round(checks[0].score * 0.3 + checks[1].score * 0.25 + checks[2].score * 0.25 + checks[3].score * 0.2);
  const score = blockerCount > 0 ? Math.min(rawScore, 79) : watchCount > 0 ? Math.min(rawScore, 89) : rawScore;
  const firstBlocker = checks.find((check) => check.status === "block");
  const firstOpen = firstBlocker ?? checks.find((check) => check.status === "watch");
  const repairPlan = buildRepairPlan(checks, score);
  const partial: Omit<BuyerShareGate, "sendPacket" | "receipt" | "exportMarkdown"> = {
    readiness,
    score,
    headline: headlineFor(readiness),
    decision: buildDecision(readiness, firstBlocker),
    blockerCount,
    watchCount,
    primaryActionLabel: readiness === "send-ready" ? "Open launch room" : "Resolve blocker",
    primaryActionHref: firstOpen?.href ?? input.command.nextGap.href,
    checks,
    repairPlan
  };
  const sendPacket = buildSendPacket(partial, input.command);
  const withPacket: Omit<BuyerShareGate, "receipt" | "exportMarkdown"> = {
    ...partial,
    sendPacket
  };
  const withReceipt: Omit<BuyerShareGate, "exportMarkdown"> = {
    ...withPacket,
    receipt: buildShareGateReceipt(withPacket)
  };

  return {
    ...withReceipt,
    exportMarkdown: buildMarkdown(withReceipt)
  };
}

export function renderBuyerShareGateHtml(
  gate: BuyerShareGate,
  links: {
    appUrl?: string;
    launchRoomUrl?: string;
    proofMonitorUrl?: string;
    recoveryUrl?: string;
    evidenceTraceUrl?: string;
    jsonUrl?: string;
    markdownUrl?: string;
  } = {}
) {
  const receiptVerificationRequestJson = escapeScriptJson(gate.receipt.verificationRequestJson);
  const receiptVerificationApiPathJson = JSON.stringify(gate.receipt.verificationApiPath);
  const nav = [
    links.launchRoomUrl ? `<a href="${escapeHtml(links.launchRoomUrl)}">Launch room</a>` : "",
    links.evidenceTraceUrl ? `<a href="${escapeHtml(links.evidenceTraceUrl)}">Evidence trace</a>` : "",
    links.proofMonitorUrl ? `<a href="${escapeHtml(links.proofMonitorUrl)}">Proof monitor</a>` : "",
    links.recoveryUrl ? `<a href="${escapeHtml(links.recoveryUrl)}">Recovery plan</a>` : "",
    links.appUrl ? `<a href="${escapeHtml(links.appUrl)}">Open workspace</a>` : "",
    links.jsonUrl ? `<a href="${escapeHtml(links.jsonUrl)}">JSON</a>` : "",
    links.markdownUrl ? `<a href="${escapeHtml(links.markdownUrl)}">Markdown</a>` : ""
  ]
    .filter(Boolean)
    .join("");
  const metrics = [
    { label: "Readiness", value: gate.readiness, status: gate.readiness },
    { label: "Share score", value: `${gate.score}/100`, status: gate.readiness },
    { label: "Blockers", value: gate.blockerCount, status: gate.blockerCount > 0 ? "block" : "pass" },
    { label: "Warnings", value: gate.watchCount, status: gate.watchCount > 0 ? "watch" : "pass" }
  ]
    .map(
      (metric) => `
        <article class="metric ${tone(metric.status as BuyerShareGateCheckStatus | BuyerShareGateReadiness)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`
    )
    .join("");
  const checks = gate.checks
    .map(
      (check) => `
        <article class="check ${tone(check.status)}">
          <div>
            <span>${escapeHtml(check.status)}</span>
            <strong>${escapeHtml(check.label)}</strong>
          </div>
          <p>${escapeHtml(check.evidence)}</p>
          <small>${escapeHtml(check.action)}</small>
          <a href="${escapeHtml(check.href)}">${check.status === "pass" ? "Open proof" : "Fix item"}</a>
        </article>`
    )
    .join("");
  const repairSteps =
    gate.repairPlan.items.length > 0
      ? gate.repairPlan.items
          .map(
            (item) => `
        <article class="repair-step ${tone(item.status)}">
          <span>${escapeHtml(`${item.sequence}. ${item.owner}`)}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.action)}</p>
          <small>${escapeHtml(item.unlock)}</small>
          <a href="${escapeHtml(item.href)}">Open repair target</a>
        </article>`
          )
          .join("")
      : `<article class="repair-step good"><span>Ready</span><strong>No repair items</strong><p>${escapeHtml(gate.repairPlan.summary)}</p><small>Keep the receipt with the buyer packet.</small></article>`;
  const repairPlan = `
      <section class="repair-plan ${repairPlanTone(gate.repairPlan.status)}" aria-label="Buyer send repair plan">
        <div class="repair-head">
          <div>
            <span class="eyebrow">Buyer send repair plan</span>
            <strong>${escapeHtml(gate.repairPlan.headline)}</strong>
            <p>${escapeHtml(gate.repairPlan.summary)}</p>
          </div>
          <a class="repair-download" href="${escapeHtml(gate.repairPlan.exportHref)}" download="buyer-send-repair-plan.md">Download repair plan</a>
        </div>
        <div class="repair-steps">${repairSteps}</div>
      </section>`;
  const messageLines = gate.sendPacket.messageLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const criteria = gate.sendPacket.acceptanceCriteria
    .map(
      (criterion) => `
        <article class="${tone(criterion.status)}">
          <span>${escapeHtml(criterion.status)}</span>
          <strong>${escapeHtml(criterion.label)}</strong>
          <p>${escapeHtml(criterion.evidence)}</p>
          <small>${escapeHtml(criterion.action)}</small>
        </article>`
    )
    .join("");
  const stopRules = gate.sendPacket.stopRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");
  const receipt = `
      <section class="receipt ${tone(gate.receipt.payload.mode)}" aria-label="Buyer share gate receipt">
        <div>
          <span class="eyebrow">Decision receipt</span>
          <strong>${escapeHtml(gate.receipt.receiptId)}</strong>
          <p>${escapeHtml(`This receipt seals the ${gate.receipt.payload.mode} decision, ${gate.receipt.payload.score}/100 score, acceptance checks, and stop rules.`)}</p>
        </div>
        <dl>
          <dt>Checksum</dt>
          <dd>${escapeHtml(`${gate.receipt.checksumAlgorithm}:${gate.receipt.checksum}`)}</dd>
          <dt>Verification</dt>
          <dd>${escapeHtml(gate.receipt.verification.status)}</dd>
          <dt>API</dt>
          <dd><code>POST ${escapeHtml(gate.receipt.verificationApiPath)}</code></dd>
          <dt>Receipt</dt>
          <dd><a href="${escapeHtml(gate.receipt.href)}" download="buyer-share-gate-receipt.md">Download receipt</a></dd>
          <dt>Payload</dt>
          <dd><a href="${escapeHtml(gate.receipt.payloadHref)}" download="buyer-share-gate-replay-payload.json">Download replay payload</a></dd>
          <dt>Request</dt>
          <dd><a href="${escapeHtml(gate.receipt.verificationRequestHref)}" download="buyer-share-gate-receipt-verify-request.json">Download verify request</a></dd>
        </dl>
        <div class="receipt-verify">
          <button type="button" data-share-gate-receipt-verify>Verify receipt</button>
          <output data-share-gate-receipt-status aria-live="polite">Receipt not checked in this browser yet.</output>
        </div>
      </section>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(gate.headline)} - Buyer Share Gate</title>
    <style>
      :root { color-scheme: light; --ink: #17211f; --muted: #56645f; --paper: #f4f7f6; --panel: #fffefd; --line: #cbd8d4; --green: #0b7a60; --blue: #245fa7; --amber: #a66a00; --red: #b4233b; --good-bg: #e8f7ee; --watch-bg: #fff5d6; --bad-bg: #fff0f2; --shadow: 0 18px 46px rgba(23, 33, 31, .09); }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, Avenir Next, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
      a { color: inherit; overflow-wrap: anywhere; }
      header, main, footer { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
      header { display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 22px; align-items: end; padding: 40px 0 16px; }
      .eyebrow, h2, .metric span, .check span, .packet-mode span, .criteria span { color: var(--green); font-size: .74rem; font-weight: 950; letter-spacing: 0; text-transform: uppercase; }
      h1 { max-width: 900px; margin: 6px 0 12px; font-size: clamp(2.2rem, 5vw, 4.6rem); line-height: .98; letter-spacing: 0; }
      h2 { margin: 0 0 10px; }
      p { margin: 0; color: var(--muted); }
      nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
      nav a, .check a, .primary-action { border: 1px solid var(--line); border-radius: 999px; padding: 8px 12px; background: var(--panel); font-size: .9rem; font-weight: 900; text-decoration: none; }
      .score { min-height: 200px; border: 1px solid #0b7a60; border-radius: 8px; background: #14322e; color: #fffefd; display: grid; align-content: center; justify-items: center; gap: 8px; box-shadow: var(--shadow); }
      .score span { color: #98e6cf; font-size: .78rem; font-weight: 950; text-transform: uppercase; }
      .score strong { font-size: 4.5rem; line-height: .9; }
      .score small { max-width: 190px; color: rgba(255, 254, 253, .8); font-weight: 900; text-align: center; }
      main { display: grid; gap: 12px; padding: 0 0 34px; }
      .hero, .metrics, .checks, .packet, .rules { min-width: 0; }
      .hero, .packet, .rules { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); }
      .hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 18px; }
      .hero strong { display: block; margin: 5px 0 7px; font-size: 1.45rem; line-height: 1.1; overflow-wrap: anywhere; }
      .primary-action { justify-self: end; border-color: rgba(36, 95, 167, .38); background: #eef6ff; color: var(--blue); }
      .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .metric, .check, .criteria article { min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      .metric { padding: 14px; }
      .metric strong { display: block; margin-top: 6px; font-size: 1.22rem; line-height: 1.12; overflow-wrap: anywhere; }
      .checks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .check { display: grid; gap: 8px; padding: 14px; border-left: 5px solid var(--green); }
      .check.watch, .criteria article.watch, .metric.watch { border-color: #e7cd82; background: var(--watch-bg); }
      .check.bad, .criteria article.bad, .metric.bad { border-color: #e5a9b4; background: var(--bad-bg); }
      .check.good, .criteria article.good, .metric.good { border-color: #a9d7bb; background: var(--good-bg); }
      .check div { display: grid; gap: 4px; }
      .check strong, .criteria strong { line-height: 1.12; overflow-wrap: anywhere; }
      .check small, .criteria small { color: var(--muted); overflow-wrap: anywhere; }
      .check a { justify-self: start; padding: 6px 10px; font-size: .84rem; }
      .repair-plan { display: grid; gap: 12px; padding: 18px; border: 1px solid #a9d7bb; border-left: 6px solid var(--green); border-radius: 8px; background: var(--good-bg); box-shadow: var(--shadow); }
      .repair-plan.watch { border-color: #e7cd82; border-left-color: var(--amber); background: var(--watch-bg); }
      .repair-plan.bad { border-color: #e5a9b4; border-left-color: var(--red); background: var(--bad-bg); }
      .repair-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: start; }
      .repair-head strong { display: block; margin-top: 5px; font-size: 1.22rem; line-height: 1.12; overflow-wrap: anywhere; }
      .repair-head p { margin-top: 7px; overflow-wrap: anywhere; }
      .repair-download { border: 1px solid rgba(36, 95, 167, .34); border-radius: 999px; padding: 8px 12px; background: #eef6ff; color: var(--blue); font-size: .86rem; font-weight: 950; text-decoration: none; }
      .repair-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .repair-step { min-width: 0; display: grid; gap: 6px; padding: 12px; border: 1px solid var(--line); border-left: 5px solid var(--green); border-radius: 8px; background: var(--panel); }
      .repair-step.watch { border-color: #e7cd82; background: rgba(255, 253, 247, .6); }
      .repair-step.bad { border-color: #e5a9b4; background: rgba(255, 253, 247, .62); }
      .repair-step span { color: var(--green); font-size: .72rem; font-weight: 950; text-transform: uppercase; }
      .repair-step strong { line-height: 1.12; overflow-wrap: anywhere; }
      .repair-step small { color: var(--muted); overflow-wrap: anywhere; }
      .repair-step a { justify-self: start; border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; background: var(--panel); font-size: .84rem; font-weight: 900; text-decoration: none; }
      .packet { display: grid; grid-template-columns: minmax(0, .75fr) minmax(360px, 1fr); gap: 14px; padding: 18px; border-color: rgba(36, 95, 167, .34); background: linear-gradient(105deg, #fffefd, #eef6ff); }
      .packet-mode { display: grid; align-content: start; gap: 8px; min-width: 0; }
      .packet-mode strong { font-size: 1.34rem; line-height: 1.12; overflow-wrap: anywhere; }
      .message { display: grid; gap: 7px; }
      .message p { color: var(--ink); overflow-wrap: anywhere; }
      .criteria { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .criteria article { display: grid; gap: 5px; padding: 10px; }
      .receipt { display: grid; grid-template-columns: minmax(0, .68fr) minmax(360px, 1fr); gap: 14px; align-items: start; padding: 18px; border: 1px solid #a9d7bb; border-left: 6px solid var(--green); border-radius: 8px; background: #e8f7ee; box-shadow: var(--shadow); }
      .receipt.watch { border-color: #e7cd82; border-left-color: var(--amber); background: var(--watch-bg); }
      .receipt.bad { border-color: #e5a9b4; border-left-color: var(--red); background: var(--bad-bg); }
      .receipt strong { display: block; margin-top: 5px; line-height: 1.12; overflow-wrap: anywhere; }
      .receipt p { margin-top: 7px; overflow-wrap: anywhere; }
      .receipt dl { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 6px 10px; margin: 0; }
      .receipt dt { color: var(--green); font-size: .74rem; font-weight: 950; text-transform: uppercase; }
      .receipt dd { min-width: 0; margin: 0; color: var(--muted); overflow-wrap: anywhere; }
      .receipt a { font-weight: 900; }
      .receipt-verify { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(23, 33, 31, .12); }
      .receipt-verify button { border: 0; border-radius: 999px; padding: 9px 13px; background: #14322e; color: #fffefd; font: inherit; font-size: .9rem; font-weight: 950; cursor: pointer; }
      .receipt-verify button:disabled { cursor: wait; opacity: .72; }
      .receipt-verify output { min-width: 220px; color: var(--muted); font-size: .88rem; font-weight: 850; overflow-wrap: anywhere; }
      .receipt-verify output[data-status="checking"] { color: var(--blue); }
      .receipt-verify output[data-status="verified"] { color: var(--green); }
      .receipt-verify output[data-status="mismatch"], .receipt-verify output[data-status="error"] { color: var(--red); }
      .rules { padding: 18px; }
      .rules ol { display: grid; gap: 8px; margin: 0; padding-left: 20px; }
      .rules li { color: var(--muted); overflow-wrap: anywhere; }
      footer { padding: 0 0 30px; color: var(--muted); font-size: .86rem; }
      @media (max-width: 860px) {
        header, main, footer { width: min(100% - 24px, 640px); }
        header, .hero, .metrics, .checks, .repair-head, .repair-steps, .packet, .criteria, .receipt { grid-template-columns: 1fr; }
        header { padding-top: 28px; }
        .score { min-height: 140px; }
        .score strong { font-size: 3.3rem; }
        .primary-action { justify-self: start; }
        .repair-download { justify-self: start; }
      }
    </style>
  </head>
  <body>
    <header>
      <div>
        <span class="eyebrow">Buyer Share Gate</span>
        <h1>${escapeHtml(gate.headline)}</h1>
        <p>${escapeHtml(gate.decision)}</p>
        <nav>${nav}</nav>
      </div>
      <aside class="score">
        <span>Share score</span>
        <strong>${escapeHtml(gate.score)}</strong>
        <small>${escapeHtml(gate.readiness)}</small>
      </aside>
    </header>
    <main aria-label="Buyer share gate">
      <section class="hero ${tone(gate.readiness)}">
        <div>
          <span class="eyebrow">Current decision</span>
          <strong>${escapeHtml(gate.decision)}</strong>
          <p>${escapeHtml(`${gate.blockerCount} blockers and ${gate.watchCount} warnings before external buyer delivery.`)}</p>
        </div>
        <a class="primary-action" href="${escapeHtml(gate.primaryActionHref)}">${escapeHtml(gate.primaryActionLabel)}</a>
      </section>
      <section class="metrics" aria-label="Buyer share gate metrics">${metrics}</section>
      <section class="checks" aria-label="Buyer share gate checks">${checks}</section>
      ${repairPlan}
      <section class="packet ${tone(gate.sendPacket.mode)}" aria-label="Buyer send packet">
        <div class="packet-mode">
          <span>${escapeHtml(gate.sendPacket.mode)}</span>
          <strong>${escapeHtml(gate.sendPacket.subject)}</strong>
          <div class="message">${messageLines}</div>
        </div>
        <div>
          <h2>Acceptance criteria</h2>
          <div class="criteria">${criteria}</div>
        </div>
      </section>
      ${receipt}
      <section class="rules" aria-label="Stop rules">
        <h2>Stop rules</h2>
        <ol>${stopRules}</ol>
      </section>
    </main>
    <script type="application/json" id="buyer-share-gate-receipt-verify-request">${receiptVerificationRequestJson}</script>
    <script>
      (() => {
        const button = document.querySelector("[data-share-gate-receipt-verify]");
        const status = document.querySelector("[data-share-gate-receipt-status]");
        const requestNode = document.getElementById("buyer-share-gate-receipt-verify-request");
        if (!button || !status || !requestNode) return;
        button.addEventListener("click", async () => {
          button.disabled = true;
          status.dataset.status = "checking";
          status.textContent = "Checking share gate receipt...";
          try {
            const response = await fetch(${receiptVerificationApiPathJson}, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestNode.textContent || ""
            });
            const result = await response.json().catch(() => ({}));
            const verification = result.verification || {};
            if (response.ok && verification.status === "verified") {
              status.dataset.status = "verified";
              status.textContent = "Verified in this browser. Checksum " + (verification.actualChecksum || "") + " matches the share gate replay payload.";
              return;
            }
            status.dataset.status = "mismatch";
            status.textContent = verification.instruction || result.error || "Share gate receipt verification failed.";
          } catch {
            status.dataset.status = "error";
            status.textContent = "Could not verify the share gate receipt. Check the API route and try again.";
          } finally {
            button.disabled = false;
          }
        });
      })();
    </script>
    <footer>Generated by A2A Agent Marketplace. Use this gate as the public send/no-send record for buyer pilot delivery.</footer>
  </body>
</html>`;
}
